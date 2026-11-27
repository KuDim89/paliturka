import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const scriptPath = fileURLToPath(new URL('./commit-msg.mjs', import.meta.url));

let dir: string;

function runHook(message: string) {
  const path = join(dir, 'COMMIT_EDITMSG');
  writeFileSync(path, message);
  return spawnSync(process.execPath, [scriptPath, path], { encoding: 'utf8' });
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'commit-msg-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('commit-msg hook', () => {
  test('accepts a valid message', () => {
    expect(runHook('feat(tooling): add a commit-msg hook\n\nPart of PL-58.\n').status).toBe(0);
  });

  test('rejects an invalid message and lists the problems', () => {
    const result = runHook('Added stuff\n\nCo-Authored-By: Someone <a@b.c>\n');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Commit blocked');
    expect(result.stderr).toContain('the subject must look like');
    expect(result.stderr).toContain('no AI attribution');
  });

  test('fails closed without a message file', () => {
    const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no message file given');
  });
});
