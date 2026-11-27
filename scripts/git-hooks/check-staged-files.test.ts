import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const scriptPath = fileURLToPath(new URL('./check-staged-files.mjs', import.meta.url));

// Built from parts, so this file does not trip the scanner it tests.
const apiKeyLine = 'api_key = "' + 'abcdefgh12345678' + '"';

let repo: string;

// This file also runs inside the real pre-commit hook (lint-staged runs `vitest related`), where git
// exports GIT_INDEX_FILE and similar variables. Without removing them, git in the temporary repo
// would read and write the index of the commit being made.
function cleanEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  for (const name of Object.keys(env)) {
    if (name.startsWith('GIT_') && !(name in extra)) delete env[name];
  }
  return env;
}

function git(...args: string[]) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8', env: cleanEnv() });
  expect(result.status, result.stderr).toBe(0);
}

function stage(path: string, content: string) {
  writeFileSync(join(repo, path), content);
  git('add', '--', path);
}

function runCheck() {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: repo,
    encoding: 'utf8',
    env: cleanEnv(),
  });
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'check-staged-files-'));
  git('init', '--quiet');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('check-staged-files', () => {
  test('blocks a staged .env', () => {
    stage('.env', 'DATABASE_URL="file:./dev.db"\n');
    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.env: a local environment or key file must not be committed');
  });

  test('lets a staged .env.example pass', () => {
    stage('.env.example', 'DATABASE_URL="file:./storage/paliturka.db"\n');
    expect(runCheck().status).toBe(0);
  });

  test('blocks an added secret and names the file and line with the value masked', () => {
    stage('config.ts', `export const a = 1;\n${apiKeyLine};\n`);
    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('config.ts:2: looks like a secret: api_***";');
    expect(result.stderr).not.toContain('abcdefgh12345678');
    expect(result.stderr).toContain('secret-scan: allow');
  });

  test.each([
    ['diff.mnemonicPrefix', 'true'],
    ['diff.noPrefix', 'true'],
  ])('still finds a secret with %s set in the git config', (key, value) => {
    git('config', key, value);
    stage('config.ts', `${apiKeyLine};\n`);
    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('config.ts:1: looks like a secret');
  });

  test('lets a line with the allow marker pass', () => {
    stage('fixture.ts', `${apiKeyLine}; // secret-scan: allow\n`);
    expect(runCheck().status).toBe(0);
  });

  test('passes with nothing staged', () => {
    expect(runCheck().status).toBe(0);
  });

  test('fails closed outside a git repository', () => {
    const outside = mkdtempSync(join(tmpdir(), 'check-staged-files-outside-'));
    try {
      const result = spawnSync(process.execPath, [scriptPath], {
        cwd: outside,
        encoding: 'utf8',
        env: cleanEnv({ GIT_CEILING_DIRECTORIES: tmpdir() }),
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('failed');
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test('ignores the index of a commit in progress (GIT_INDEX_FILE from a running hook)', () => {
    const foreignIndex = join(repo, '..', `${repo.split(/[\\/]/).pop()}-foreign-index`);
    vi.stubEnv('GIT_INDEX_FILE', foreignIndex);
    try {
      stage('.env', 'DATABASE_URL="file:./dev.db"\n');
      const result = runCheck();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        '.env: a local environment or key file must not be committed',
      );
      expect(existsSync(foreignIndex)).toBe(false);
    } finally {
      vi.unstubAllEnvs();
      rmSync(foreignIndex, { force: true });
    }
  });
});
