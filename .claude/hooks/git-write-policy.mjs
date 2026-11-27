// Which git add and git commit options the main session may not use. Used by the git-write-guard.mjs
// hook. The permission deny rules in .claude/settings.json match command text, so they miss combined
// short flags (`-anm`) and the abbreviated long options git accepts (`--no-verif`); this module parses
// the command instead. The rules are in the Commits section of CLAUDE.md.

const ADD_LONG = {
  all: 'stages every change',
  'no-ignore-removal': 'stages every change',
  update: 'stages every modified file',
};
const ADD_SHORT = { A: 'stages every change', u: 'stages every modified file' };
const COMMIT_LONG = {
  'no-verify': 'skips the commit hooks',
  amend: 'rewrites the last commit',
  all: 'stages every modified file',
};
const COMMIT_SHORT = { n: 'skips the commit hooks', a: 'stages every modified file' };

// Short commit options that take a value: the rest of the group, or the next word, is that value
// (`-mna` is the message "na"). `-S` and `-u` take an optional value only in the same word.
const COMMIT_SHORT_WITH_VALUE = 'mFCct';
const COMMIT_SHORT_OPTIONAL_VALUE = 'Su';
// Long commit options whose value may be the next word.
const COMMIT_LONG_WITH_VALUE = [
  'message',
  'file',
  'reuse-message',
  'reedit-message',
  'fixup',
  'squash',
  'template',
  'author',
  'date',
  'cleanup',
  'trailer',
  'pathspec-from-file',
];
// Global git options before the subcommand whose value is the next word.
const GLOBAL_WITH_VALUE = new Set([
  '-c',
  '-C',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--config-env',
  '--attr-source',
]);
// Pathspecs that mean the whole working tree.
const WHOLE_TREE = new Set(['.', './', '.\\', ':/', ':/*', ':(top)', ':(top)*', '*']);
// Words that can stand before a command in the same simple command (`time git commit -n`).
const PREFIX_WORDS = new Set([
  'if',
  'then',
  'else',
  'elif',
  'do',
  'while',
  'until',
  '!',
  'time',
  'command',
  'builtin',
  'exec',
  'nohup',
  'env',
]);

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
// Ways to turn the git hooks off without a commit option: Husky reads HUSKY=0, and git reads hooks
// from core.hooksPath.
const HUSKY_ASSIGNMENT = /^HUSKY=/;
const HOOKS_PATH_CONFIG = /^core\.hookspath=/i;
const POWERSHELL_HUSKY = /^\$env:HUSKY(=|$)/i;
const GIT_PROGRAM = /(^|[\\/])git(\.exe)?$/i;

function isAbbreviationOf(name, full) {
  return name.length > 0 && full.startsWith(name);
}

function describeShort(arg, letter, effect) {
  return arg === `-${letter}`
    ? `\`${arg}\` ${effect}`
    : `\`${arg}\` includes -${letter}, which ${effect}`;
}

// Splits a command into simple commands (at &&, ||, ;, |, & and new lines), each a list of words
// with quotes and escapes resolved. Heredoc and PowerShell here-string bodies are skipped: they are
// text, not options. Returns null when a quote is not closed.
export function splitCommands(command, shell = 'bash') {
  const escape = shell === 'powershell' ? '`' : '\\';
  const commands = [];
  let words = [];
  let word = '';
  let inWord = false;
  let quote = null;
  let heredocs = [];

  const endWord = () => {
    if (inWord) words.push(word);
    word = '';
    inWord = false;
  };
  const endCommand = () => {
    endWord();
    if (words.length > 0) commands.push(words);
    words = [];
  };

  let i = 0;
  while (i < command.length) {
    const ch = command[i];
    const next = command[i + 1];

    if (quote) {
      if (ch === quote) quote = null;
      // In Bash double quotes `\` escapes only $, `, ", \ and a new line; elsewhere it stays, as in
      // "C:\Program Files\Git\cmd\git.exe". The PowerShell backtick escapes any character.
      else if (
        quote === '"' &&
        ch === escape &&
        next !== undefined &&
        (shell === 'powershell' || '$`"\\\n'.includes(next))
      ) {
        word += next;
        i += 1;
      } else word += ch;
      i += 1;
      continue;
    }

    if (ch === '\n') {
      endCommand();
      i += 1;
      // Skip the bodies of the heredocs opened on the line that just ended.
      for (const { delimiter, stripTabs } of heredocs) {
        while (i < command.length) {
          const end = command.indexOf('\n', i);
          const line = command.slice(i, end === -1 ? command.length : end).replace(/\r$/, '');
          i = end === -1 ? command.length : end + 1;
          if ((stripTabs ? line.replace(/^\t+/, '') : line) === delimiter) break;
        }
      }
      heredocs = [];
      continue;
    }

    if (shell === 'powershell' && ch === '@' && (next === "'" || next === '"') && !inWord) {
      const close = command.indexOf(`\n${next}@`, i + 2);
      if (/^[ \t]*\r?\n/.test(command.slice(i + 2)) && close !== -1) {
        word = '@here-string@';
        inWord = true;
        i = close + 3;
        continue;
      }
    }

    if (ch === '<' && next === '<' && command[i + 2] === '<') {
      // A here-string (`<<< word`): the word is ordinary input, not a heredoc delimiter.
      endWord();
      i += 3;
      continue;
    }

    if (ch === '<' && next === '<') {
      endWord();
      let j = i + 2;
      const stripTabs = command[j] === '-';
      if (stripTabs) j += 1;
      while (command[j] === ' ' || command[j] === '\t') j += 1;
      let delimiter = '';
      while (j < command.length && !/[\s;&|<>]/.test(command[j])) {
        if (command[j] !== "'" && command[j] !== '"' && command[j] !== '\\')
          delimiter += command[j];
        j += 1;
      }
      if (delimiter) heredocs.push({ delimiter, stripTabs });
      i = j;
      continue;
    }

    if (ch === escape && next !== undefined) {
      // A line continuation, with an LF or a CRLF line ending.
      if (next === '\n') i += 2;
      else if (next === '\r' && command[i + 2] === '\n') i += 3;
      else {
        word += next;
        inWord = true;
        i += 2;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      inWord = true;
    } else if (ch === '#' && !inWord) {
      while (i + 1 < command.length && command[i + 1] !== '\n') i += 1;
    } else if (ch === ' ' || ch === '\t' || ch === '\r') {
      endWord();
    } else if (ch === '&' || ch === '|' || ch === ';') {
      endCommand();
    } else if ((ch === '(' || ch === '{') && !inWord) {
      // A subshell or a block: `(cd sub && git add -A)`, `{ git commit -n; }`.
      endCommand();
    } else if ((ch === ')' && !word.includes('(')) || (ch === '}' && !word.includes('{'))) {
      // The end of one; a bracket inside a word (`:(top)`, `HEAD@{1}`) stays part of it.
      endCommand();
    } else {
      word += ch;
      inWord = true;
    }
    i += 1;
  }

  if (quote) return null;
  endCommand();
  return commands;
}

// The git subcommand and its arguments, or null when the words are not a git command. `hooksOff`
// describes a HUSKY= prefix or a core.hooksPath setting that turns the hooks off for this command.
function parseGit(words) {
  let i = 0;
  let hooksOff = null;
  while (i < words.length) {
    const word = words[i];
    if (ENV_ASSIGNMENT.test(word)) {
      if (HUSKY_ASSIGNMENT.test(word)) hooksOff ??= `\`${word}\` turns off the git hooks`;
      i += 1;
    } else if (PREFIX_WORDS.has(word)) {
      i += 1;
      if (word === 'env') while (words[i]?.startsWith('-')) i += 1;
    } else break;
  }
  if (!GIT_PROGRAM.test(words[i] ?? '')) return null;
  i += 1;
  while (i < words.length && words[i].startsWith('-')) {
    const option = words[i];
    // The setting may be the next word (`-c x`, `--config-env x`) or in the same word (`-cx`,
    // `--config-env=x`).
    const isSeparate = option === '-c' || option === '--config-env';
    const setting = isSeparate
      ? (words[i + 1] ?? '')
      : (/^(?:-c|--config-env=)(.+)$/.exec(option)?.[1] ?? '');
    if (HOOKS_PATH_CONFIG.test(setting)) {
      const spelled = isSeparate ? `${option} ${setting}` : option;
      hooksOff ??= `\`${spelled}\` turns off the git hooks`;
    }
    i += GLOBAL_WITH_VALUE.has(option) ? 2 : 1;
  }
  if (i >= words.length) return null;
  return { subcommand: words[i], args: words.slice(i + 1), hooksOff };
}

// `export HUSKY=0` (Bash) or `$env:HUSKY = '0'` (PowerShell) turns the hooks off for every later
// command of the shell.
function disablesHusky(words) {
  if (POWERSHELL_HUSKY.test(words[0] ?? ''))
    return `\`${words.join(' ')}\` turns off the git hooks`;
  if (words[0] === 'export' && words.some((word) => HUSKY_ASSIGNMENT.test(word))) {
    return `\`${words.join(' ')}\` turns off the git hooks for the commands after it`;
  }
  return null;
}

function checkAdd(args) {
  let pathsOnly = false;
  for (const arg of args) {
    if (!pathsOnly && arg === '--') {
      pathsOnly = true;
    } else if (!pathsOnly && arg.startsWith('--')) {
      const name = arg.slice(2).split('=')[0];
      const full = Object.keys(ADD_LONG).find((option) => isAbbreviationOf(name, option));
      if (full) return `\`${arg}\` (--${full}) ${ADD_LONG[full]}`;
    } else if (!pathsOnly && arg.startsWith('-') && arg.length > 1) {
      const flag = [...arg.slice(1)].find((letter) => letter in ADD_SHORT);
      if (flag) return describeShort(arg, flag, ADD_SHORT[flag]);
    } else if (WHOLE_TREE.has(arg)) {
      return `the pathspec \`${arg}\` stages the whole tree`;
    }
  }
  return null;
}

function checkCommit(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--') return null;
    if (arg.startsWith('--')) {
      const [name, value] = arg.slice(2).split(/=(.*)/s);
      const full = Object.keys(COMMIT_LONG).find((option) => isAbbreviationOf(name, option));
      if (full) return `\`${arg}\` (--${full}) ${COMMIT_LONG[full]}`;
      const takesValue = COMMIT_LONG_WITH_VALUE.some((option) => isAbbreviationOf(name, option));
      if (takesValue && value === undefined) i += 1;
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (let j = 1; j < arg.length; j += 1) {
        const letter = arg[j];
        if (letter in COMMIT_SHORT) {
          return describeShort(arg, letter, COMMIT_SHORT[letter]);
        }
        if (COMMIT_SHORT_WITH_VALUE.includes(letter)) {
          if (j === arg.length - 1) i += 1;
          break;
        }
        if (COMMIT_SHORT_OPTIONAL_VALUE.includes(letter)) break;
      }
    }
  }
  return null;
}

// A description of the first blocked git add or git commit option in the command, or null.
// `shell` is 'bash' or 'powershell': they escape characters differently.
export function findBlockedOption(command, shell = 'bash') {
  if (!/git/i.test(command)) return null;
  const commands = splitCommands(command, shell);
  if (commands === null)
    return 'the command has a quote that is not closed, so it cannot be checked';
  for (const words of commands) {
    const husky = disablesHusky(words);
    if (husky) return husky;
    const git = parseGit(words);
    if (git?.subcommand === 'commit' && git.hooksOff) return `git commit: ${git.hooksOff}`;
    if (git?.subcommand === 'add') {
      const problem = checkAdd(git.args);
      if (problem) return `git add: ${problem}`;
    }
    if (git?.subcommand === 'commit') {
      const problem = checkCommit(git.args);
      if (problem) return `git commit: ${problem}`;
    }
  }
  return null;
}
