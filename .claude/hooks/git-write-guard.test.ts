import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const hookPath = fileURLToPath(new URL('./git-write-guard.mjs', import.meta.url));

function runHook(input: string) {
  return spawnSync(process.execPath, [hookPath], { input, encoding: 'utf8' });
}

function call(command: unknown, toolName = 'Bash') {
  return runHook(JSON.stringify({ tool_name: toolName, tool_input: { command } }));
}

describe('git-write-guard hook', () => {
  test('lets a safe command run', () => {
    expect(call('git add -- src/a.ts').status).toBe(0);
    expect(call('pnpm check').status).toBe(0);
  });

  test('blocks a hidden --no-verify and names the option', () => {
    const result = call('git commit -vnm "x"');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Blocked: git commit: `-vnm` includes -n');
    expect(result.stderr).toContain('Commits section of CLAUDE.md');
  });

  test('reads a PowerShell command with PowerShell escapes', () => {
    expect(call('git add .\\', 'PowerShell').status).toBe(2);
    expect(call('git add -- src\\a.ts', 'PowerShell').status).toBe(0);
  });

  test.each([
    ['invalid JSON', 'not json'],
    ['empty input', ''],
    ['no tool_input', JSON.stringify({ tool_name: 'Bash' })],
  ])('blocks on %s', (_name, input) => {
    expect(runHook(input).status).toBe(2);
  });

  test('blocks a command that is not a string', () => {
    const result = call(42);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('no command to check');
  });
});
