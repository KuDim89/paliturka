// Pre-commit check (.husky/pre-commit): blocks staged local environment and key files, and added
// lines that look like secrets. Any non-zero exit stops the commit, so an error fails closed.
import { spawnSync } from 'node:child_process';

import { ALLOW_MARKER, findProblems } from './staged-files-policy.mjs';

function git(args) {
  const result = spawnSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    process.stderr.write(`check-staged-files: git ${args.join(' ')} failed\n${result.stderr}`);
    process.exit(1);
  }
  return result.stdout;
}

// Added, copied, modified and renamed files; a deleted file cannot leak anything new.
const filter = '--diff-filter=ACMR';
const files = git(['diff', '--cached', '--name-only', filter]).split('\n').filter(Boolean);
// Fixed prefixes: parseAddedLines reads `+++ b/<path>`, whatever diff.mnemonicPrefix or
// diff.noPrefix the user's git config sets.
const prefixes = ['--src-prefix=a/', '--dst-prefix=b/'];
const diff = git(['diff', '--cached', '-U0', '--no-color', '--no-ext-diff', ...prefixes, filter]);

const problems = findProblems({ files, diff });
if (problems.length > 0) {
  process.stderr.write(
    [
      'Commit blocked: staged files may contain secrets.',
      ...problems.map((problem) => `  ${problem}`),
      'Unstage a file with `git restore --staged <file>`.',
      `A line that only looks like a secret (a fake value in a test) passes with a \`${ALLOW_MARKER}\` comment on it.`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}
