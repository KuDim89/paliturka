import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const hookPath = fileURLToPath(new URL('./git-read-only.mjs', import.meta.url));

function runHook(input: string) {
  return spawnSync(process.execPath, [hookPath], { input, encoding: 'utf8' });
}

describe('git-read-only hook', () => {
  test('lets an allowed git command run', () => {
    const result = runHook(JSON.stringify({ tool_input: { command: 'git status --porcelain' } }));
    expect(result.status).toBe(0);
  });

  test('blocks a command that is not allowed', () => {
    const result = runHook(JSON.stringify({ tool_input: { command: 'pnpm lint' } }));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Blocked');
  });

  test.each([
    ['invalid JSON', 'not json'],
    ['empty input', ''],
    ['no tool_input', JSON.stringify({})],
    ['a command that is not a string', JSON.stringify({ tool_input: { command: 42 } })],
  ])('blocks on %s', (_name, input) => {
    expect(runHook(input).status).toBe(2);
  });
});
