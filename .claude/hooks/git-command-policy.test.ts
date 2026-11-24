import { describe, expect, test } from 'vitest';

import { isAllowedCommand } from './git-command-policy.mjs';

describe('isAllowedCommand', () => {
  test.each([
    'git diff HEAD',
    'git diff HEAD -- src/app.ts',
    'git show HEAD:package.json',
    'git log --oneline -5',
    'git status --porcelain -uall',
    '  git status  ',
    'git diff --output-indicator-new=+ HEAD',
  ])('allows %s', (command) => {
    expect(isAllowedCommand(command)).toBe(true);
  });

  test.each([
    'pnpm lint',
    'git add -- file.ts',
    'git commit -m x',
    'git checkout -- file.ts',
    'git diff HEAD && pnpm test',
    'git status; rm -rf src',
    'git log | sh',
    'git diff > out.txt',
    'git show $(rm file)',
    'git status\npnpm test',
    'git difftool',
    'git diff --output=src/app.ts',
    'git log --output x',
    'git show HEAD --output=out.txt',
    'git diff --outp=out.txt',
    'git diff "--output=out.txt"',
    'git diff \\--output=out.txt',
    'cat package.json',
    '',
  ])('blocks %j', (command) => {
    expect(isAllowedCommand(command)).toBe(false);
  });
});
