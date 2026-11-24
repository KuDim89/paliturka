import { describe, expect, test } from 'vitest';

import { isAllowedCommand, parseCheckScripts } from './checks-command-policy.mjs';

const CHECK = 'pnpm lint && pnpm format:check && pnpm lint:fsd && pnpm typecheck && pnpm test';

describe('parseCheckScripts', () => {
  test('returns the script names in order', () => {
    expect(parseCheckScripts(CHECK)).toEqual([
      'lint',
      'format:check',
      'lint:fsd',
      'typecheck',
      'test',
    ]);
  });

  test('ignores parts that are not `pnpm <script>`', () => {
    expect(parseCheckScripts('pnpm lint && echo hi && pnpm test --run')).toEqual(['lint']);
  });

  test('returns nothing without a check script', () => {
    expect(parseCheckScripts(undefined)).toEqual([]);
  });
});

describe('isAllowedCommand', () => {
  test.each([
    'pnpm lint',
    'pnpm format:check',
    'pnpm lint:fsd',
    'pnpm typecheck',
    'pnpm test',
    'pnpm test:e2e',
    '  pnpm test  ',
    'git status',
    'git status --porcelain',
    'git status --porcelain -uall',
  ])('allows %s', (command) => {
    expect(isAllowedCommand(command, CHECK)).toBe(true);
  });

  test.each([
    'pnpm format',
    'pnpm lint --fix',
    'pnpm lint -- --fix',
    'pnpm test -- -u',
    'pnpm exec prettier --write .',
    'pnpm install',
    'pnpm lint && pnpm format',
    'pnpm lint; rm -rf src',
    'pnpm test | sh',
    'pnpm "lint"',
    'pnpm $(echo format)',
    'pnpm lint\npnpm format',
    'git status > out.txt',
    'git status src/app.ts',
    'git add -- file.ts',
    'git diff HEAD',
    'npm run lint',
    '',
  ])('blocks %j', (command) => {
    expect(isAllowedCommand(command, CHECK)).toBe(false);
  });

  test('follows a changed check script', () => {
    const changed = 'pnpm lint && pnpm build';
    expect(isAllowedCommand('pnpm build', changed)).toBe(true);
    expect(isAllowedCommand('pnpm typecheck', changed)).toBe(false);
  });
});
