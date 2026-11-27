import { describe, expect, test } from 'vitest';

import { findBlockedOption, splitCommands } from './git-write-policy.mjs';

describe('findBlockedOption: git commit', () => {
  test.each([
    ['git commit -anm "x"', '-a'],
    ['git commit -nm "x"', '-n'],
    ['git commit -m x -n', '-n'],
    ['git commit -n -m x', '-n'],
    ['git commit --no-verify -m x', '--no-verify'],
    ['git commit --no-verif -m x', '--no-verify'],
    ['git commit --amend --no-edit', '--amend'],
    ['git commit --amen', '--amend'],
    ['git commit --al -m x', '--all'],
    ['git commit -a -m x', '-a'],
    ['git commit -vn -m x', '-n'],
    ['git commit -F - -n -- a.ts', '-n'],
  ])('blocks %s', (command, option) => {
    const problem = findBlockedOption(command);
    expect(problem).toMatch(/^git commit: /);
    expect(problem).toContain(option);
  });

  test.each([
    'git commit -F - -- CLAUDE.md',
    'git commit -m "fix: add -n flag docs" -- a.ts',
    'git commit -m "-n"',
    'git commit -mna',
    'git commit --message -n',
    'git commit -m x -- -n',
    'git commit -uno -m x',
    'git commit --author "A <a@b.c>" -m x',
    'git commit --allow-empty -m x',
    'git commit -v -s -m x',
  ])('allows %s', (command) => {
    expect(findBlockedOption(command)).toBeNull();
  });

  test('allows a heredoc body that mentions the blocked options', () => {
    const command = [
      "git commit -F - -- CLAUDE.md <<'EOF'",
      'chore(tooling): note --amend and -n',
      '',
      'git commit --no-verify -n --amend',
      'EOF',
    ].join('\n');
    expect(findBlockedOption(command)).toBeNull();
  });

  test('checks a command after a heredoc', () => {
    const command = ["git commit -F - -- a.ts <<'EOF'", 'msg', 'EOF', 'git commit -n -m x'].join(
      '\n',
    );
    expect(findBlockedOption(command)).toContain('-n');
  });

  test('reads a here-string (<<<) as input, not as a heredoc that hides the next lines', () => {
    expect(findBlockedOption('git commit -F - <<< msg\ngit commit -n -m y')).toContain('-n');
    expect(findBlockedOption('git commit -F - -- a.ts <<< "fix: note -n"')).toBeNull();
  });

  test('ends a <<- heredoc at a delimiter indented with tabs', () => {
    const command = ['git commit -F - <<-EOF', '\tmsg -n', '\tEOF', 'git commit -n'].join('\n');
    expect(findBlockedOption(command)).toContain('-n');
  });
});

describe('findBlockedOption: git add', () => {
  test.each([
    ['git add -A', '-A'],
    ['git add -Av', '-A'],
    ['git add -vu', '-u'],
    ['git add --all', '--all'],
    ['git add --al', '--all'],
    ['git add --upd', '--update'],
    ['git add .', '`.`'],
    ['git add -- .', '`.`'],
    ['git add ./', '`./`'],
    ['git add :/', '`:/`'],
    ['git add -- :/', '`:/`'],
    ['git add --dry-run -- .', '`.`'],
  ])('blocks %s', (command, option) => {
    const problem = findBlockedOption(command);
    expect(problem).toMatch(/^git add: /);
    expect(problem).toContain(option);
  });

  test.each([
    'git add -- src/a.ts ./scripts/b.mjs',
    'git add -- .claude/settings.json',
    'git add src/app.tsx',
    'git add -- -A',
    'git add --dry-run -- CLAUDE.md',
    'git add --no-all -- a.ts',
  ])('allows %s', (command) => {
    expect(findBlockedOption(command)).toBeNull();
  });
});

describe('findBlockedOption: shells and command shapes', () => {
  test.each([
    'git status && git add -A',
    'cd src && git add -A',
    'git status; git commit -n -m x',
    'git status | git commit -n -m x',
    'git -c core.quotePath=false commit -n -m x',
    'git -C some/dir commit -n -m x',
    'git --no-pager commit -n -m x',
    'GIT_EDITOR=true git commit -n',
    '/usr/bin/git commit -n',
    'git.exe add -A',
  ])('blocks %s', (command) => {
    expect(findBlockedOption(command)).not.toBeNull();
  });

  test.each([
    'git status',
    'git status --porcelain -uall',
    'git diff HEAD -- a.ts',
    'git log --oneline -5',
    'pnpm check',
    'pnpm exec vitest run scripts',
    'git push -u origin feature/x',
    'gh pr view 60 --json body',
    'echo "git add -A"',
    "echo 'git commit -n'",
    'ls .gitignore # git add -A',
  ])('allows %s', (command) => {
    expect(findBlockedOption(command)).toBeNull();
  });

  test('blocks a command with a quote that is not closed', () => {
    expect(findBlockedOption('git commit -m "x')).toContain('quote');
  });

  test('allows a broken command that does not mention git', () => {
    expect(findBlockedOption('echo "x')).toBeNull();
  });

  test('reads PowerShell escapes: backslashes are path separators', () => {
    expect(findBlockedOption('git add .\\', 'powershell')).toContain('`.\\`');
    expect(findBlockedOption('git add -- src\\a.ts', 'powershell')).toBeNull();
    expect(findBlockedOption('git commit -m "a `"quoted`" -n" -- a.ts', 'powershell')).toBeNull();
  });

  test('skips the body of a PowerShell here-string', () => {
    const command = ["git commit -F - -- a.ts @'", "don't -n --amend", "'@"].join('\n');
    expect(findBlockedOption(command, 'powershell')).toBeNull();
  });

  test('blocks PowerShell commands after ; and &&', () => {
    expect(findBlockedOption('git status; git add -A', 'powershell')).not.toBeNull();
    expect(findBlockedOption('git status && git commit -n', 'powershell')).not.toBeNull();
  });
});

describe('findBlockedOption: subshells, blocks and prefix words', () => {
  test.each([
    ['(cd sub && git add -A)', 'bash'],
    ['( git add -A )', 'bash'],
    ['{ git commit -n; }', 'bash'],
    ['if ($x) { git commit -n -m x }', 'powershell'],
    ['time git commit -n', 'bash'],
    ['command git add -A', 'bash'],
    ['env git commit -n', 'bash'],
    ['env -i git commit -n', 'bash'],
    ['! git commit -n', 'bash'],
    ['if true; then git add -A; fi', 'bash'],
    ['for f in a; do git add -A; done', 'bash'],
  ])('blocks %s', (command, shell) => {
    expect(findBlockedOption(command, shell)).not.toBeNull();
  });

  test.each(['git reset HEAD@{1}', "git add -- 'file (1).ts'", 'git commit -C HEAD@{1} -- a.ts'])(
    'allows %s',
    (command) => {
      expect(findBlockedOption(command)).toBeNull();
    },
  );
});

describe('findBlockedOption: turning the hooks off', () => {
  test.each([
    ['HUSKY=0 git commit -m x', 'bash', 'HUSKY=0'],
    ['git -c core.hooksPath=/dev/null commit -m x', 'bash', 'core.hooksPath'],
    ['git -c CORE.HOOKSPATH=x commit -m x', 'bash', 'CORE.HOOKSPATH'],
    ['git --config-env core.hooksPath=HOOKS commit -m x', 'bash', 'core.hooksPath'],
    ['git --config-env=core.hooksPath=HOOKS commit -m x', 'bash', '--config-env=core.hooksPath'],
    ['git -ccore.hooksPath=/dev/null commit -m x', 'bash', '-ccore.hooksPath'],
    ['export HUSKY=0 && git commit -m x', 'bash', 'export HUSKY=0'],
    ["$env:HUSKY = '0'; git commit -m x", 'powershell', '$env:HUSKY'],
  ])('blocks %s', (command, shell, part) => {
    expect(findBlockedOption(command, shell)).toContain(part);
  });

  test.each(['git -c core.quotePath=false commit -m x', 'FOO=1 git commit -m x'])(
    'allows %s',
    (command) => {
      expect(findBlockedOption(command)).toBeNull();
    },
  );
});

describe('findBlockedOption: synonyms of staging everything', () => {
  test.each([
    ['git add --no-ignore-removal', '--no-ignore-removal'],
    ['git add :(top)', ':(top)'],
    ["git add -- ':(top)*'", ':(top)*'],
  ])('blocks %s', (command, part) => {
    expect(findBlockedOption(command)).toContain(part);
  });

  test('allows git add --ignore-removal on explicit paths', () => {
    expect(findBlockedOption('git add --ignore-removal -- a.ts')).toBeNull();
  });
});

describe('messages', () => {
  test('name a single flag directly and a flag inside a group', () => {
    expect(findBlockedOption('git add -A')).toBe('git add: `-A` stages every change');
    expect(findBlockedOption('git commit -anm x')).toBe(
      'git commit: `-anm` includes -a, which stages every modified file',
    );
  });
});

describe('splitCommands', () => {
  test('splits at operators and resolves quotes and escapes', () => {
    expect(splitCommands(`a "b c" d\\ e && f 'g h'|i;j`)).toEqual([
      ['a', 'b c', 'd e'],
      ['f', 'g h'],
      ['i'],
      ['j'],
    ]);
  });

  test('joins a line continuation', () => {
    expect(splitCommands('git commit \\\n  -n')).toEqual([['git', 'commit', '-n']]);
  });

  test('joins a line continuation with a CRLF line ending', () => {
    expect(splitCommands('git commit -m x \\\r\n -n')).toEqual([
      ['git', 'commit', '-m', 'x', '-n'],
    ]);
    expect(findBlockedOption('git commit -m x \\\r\n -n')).toContain('-n');
    expect(findBlockedOption('git commit -m x `\r\n -n', 'powershell')).toContain('-n');
  });

  test('keeps a backslash inside Bash double quotes unless it escapes $ ` " \\ or a new line', () => {
    expect(splitCommands('"C:\\Program Files\\Git\\cmd\\git.exe" commit')).toEqual([
      ['C:\\Program Files\\Git\\cmd\\git.exe', 'commit'],
    ]);
    expect(splitCommands('echo "a \\" b \\\\ c"')).toEqual([['echo', 'a " b \\ c']]);
    expect(findBlockedOption('"C:\\Program Files\\Git\\cmd\\git.exe" commit -n -m x')).toContain(
      '-n',
    );
  });

  test('returns null for a quote that is not closed', () => {
    expect(splitCommands("a 'b")).toBeNull();
  });
});
