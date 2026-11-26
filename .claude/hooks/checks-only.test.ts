import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { parseCheckScripts } from './checks-command-policy.mjs';

const hookPath = fileURLToPath(new URL('./checks-only.mjs', import.meta.url));

// The hook reads the real package.json, so the expectations come from it too: changing the
// `check` script must not break this test. The policy itself is tested with a fixed string in
// checks-command-policy.test.ts.
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { scripts?: { check?: string } };
const checkScripts = parseCheckScripts(packageJson.scripts?.check);

function runHook(input: string) {
  return spawnSync(process.execPath, [hookPath], { input, encoding: 'utf8' });
}

describe('checks-only hook', () => {
  test('package.json has a check script with at least one script', () => {
    expect(checkScripts.length).toBeGreaterThan(0);
  });

  test.each(checkScripts)('lets pnpm %s from the check script run', (script) => {
    const result = runHook(JSON.stringify({ tool_input: { command: `pnpm ${script}` } }));
    expect(result.status).toBe(0);
  });

  test('blocks a command that is not allowed and lists the allowed scripts', () => {
    const result = runHook(JSON.stringify({ tool_input: { command: 'pnpm format' } }));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Blocked');
    const allowed = [...checkScripts, 'test:e2e'].map((name) => `pnpm ${name}`).join(', ');
    expect(result.stderr).toContain(allowed);
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
