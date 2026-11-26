import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import {
  ALLOW_MARKER,
  findProblems,
  findSecret,
  isForbiddenFile,
  maskSecret,
  parseAddedLines,
} from './staged-files-policy.mjs';

// Fake secrets are built from parts, so this file does not trip the scanner it tests.
const openAiKey = 'sk-' + 'a'.repeat(24);
const githubToken = 'ghp_' + 'b'.repeat(36);
const githubPat = 'github_pat_' + 'c'.repeat(22);
const awsKey = 'AKIA' + 'D'.repeat(16);
const privateKey = '-----BEGIN ' + 'RSA PRIVATE KEY-----';
const apiKeyLine = 'api_key = "' + 'abcdefgh12345678' + '"';
const passwordLine = 'PASSWORD: "' + 'hunter2hunter2"';

describe('isForbiddenFile', () => {
  test.each([
    '.env',
    '.env.local',
    '.env.development.local',
    '.env.production',
    'config/.env',
    'certs/server.pem',
    'deploy.key',
    'id_rsa',
    'id_rsa.pub',
  ])('blocks %s', (path) => {
    expect(isForbiddenFile(path)).toBe(true);
  });

  test.each(['.env.example', '.env.sample', '.env.template', 'src/env.ts', 'keyboard.ts'])(
    'allows %s',
    (path) => {
      expect(isForbiddenFile(path)).toBe(false);
    },
  );
});

describe('findSecret', () => {
  test.each([
    ['an OpenAI or Anthropic key', `const key = '${openAiKey}';`, openAiKey],
    ['a GitHub token', `token ${githubToken}`, githubToken],
    ['a GitHub fine-grained token', githubPat, githubPat],
    ['an AWS key', `aws=${awsKey}`, awsKey],
    ['a private key', privateKey, privateKey.slice(0, -5)],
    ['an assigned API key', apiKeyLine, apiKeyLine.slice(0, -1)],
    ['an assigned password in any case', passwordLine, passwordLine.slice(0, -1)],
  ])('finds %s', (_name, text, secret) => {
    expect(findSecret(text)).toBe(secret);
  });

  test.each([
    ['a variable name', 'const passwordInput = screen.getByLabelText(label);'],
    ['a short value', 'password: "short"'],
    ['a line with the allow marker', `${apiKeyLine} // ${ALLOW_MARKER}`],
    [
      'kebab-case text with sk- inside a word',
      "const id = 'task-runner-configuration-for-the-app';",
    ],
    ['a kebab-case import path', "import { Meter } from './disk-usage-meter-component-x';"],
  ])('ignores %s', (_name, text) => {
    expect(findSecret(text)).toBeNull();
  });
});

describe('maskSecret', () => {
  test('keeps only the first 4 characters of the secret', () => {
    expect(maskSecret(`  ${apiKeyLine}`, apiKeyLine.slice(0, -1))).toBe('api_***"');
  });

  test('shortens a long line', () => {
    const masked = maskSecret(`${openAiKey}${'x'.repeat(200)}`, openAiKey);
    expect(masked).toHaveLength(121);
    expect(masked.endsWith('…')).toBe(true);
  });
});

describe('parseAddedLines', () => {
  test('returns the added lines with their file and line number', () => {
    const diff = [
      'diff --git a/src/a.ts b/src/a.ts',
      '--- a/src/a.ts',
      '+++ b/src/a.ts',
      '@@ -1,0 +2,2 @@',
      '+first',
      '+second',
      '@@ -9 +10 @@',
      '-old',
      '+third',
      'diff --git a/new.ts b/new.ts',
      '--- /dev/null',
      '+++ b/new.ts',
      '@@ -0,0 +1 @@',
      '+only',
      '\\ No newline at end of file',
    ].join('\n');

    expect(parseAddedLines(diff)).toEqual([
      { file: 'src/a.ts', line: 2, text: 'first' },
      { file: 'src/a.ts', line: 3, text: 'second' },
      { file: 'src/a.ts', line: 10, text: 'third' },
      { file: 'new.ts', line: 1, text: 'only' },
    ]);
  });

  test('reads an added line starting with "++ " as an added line, not a file header', () => {
    const diff = [
      'diff --git a/notes.md b/notes.md',
      '--- a/notes.md',
      '+++ b/notes.md',
      '@@ -0,0 +1,2 @@',
      '+++ notes',
      `+${apiKeyLine}`,
    ].join('\n');

    expect(parseAddedLines(diff)).toEqual([
      { file: 'notes.md', line: 1, text: '++ notes' },
      { file: 'notes.md', line: 2, text: apiKeyLine },
    ]);
    expect(findProblems({ files: ['notes.md'], diff })).toEqual([
      'notes.md:2: looks like a secret: api_***"',
    ]);
  });

  test('skips a deleted file', () => {
    const diff = ['--- a/gone.ts', '+++ /dev/null', '@@ -1 +0,0 @@', '-gone'].join('\n');
    expect(parseAddedLines(diff)).toEqual([]);
  });
});

describe('findProblems', () => {
  test('reports a forbidden file once, not its lines', () => {
    const diff = ['+++ b/.env', '@@ -0,0 +1 @@', `+${apiKeyLine}`].join('\n');
    expect(findProblems({ files: ['.env'], diff })).toEqual([
      '.env: a local environment or key file must not be committed',
    ]);
  });

  test('reports a secret with its file and line, masked', () => {
    const diff = ['+++ b/src/config.ts', '@@ -4,0 +5 @@', `+${apiKeyLine}`].join('\n');
    expect(findProblems({ files: ['src/config.ts'], diff })).toEqual([
      'src/config.ts:5: looks like a secret: api_***"',
    ]);
  });

  test('reports nothing for clean changes', () => {
    const diff = ['+++ b/src/a.ts', '@@ -0,0 +1 @@', '+export const a = 1;'].join('\n');
    expect(findProblems({ files: ['src/a.ts', '.env.example'], diff })).toEqual([]);
  });
});

describe('the git hook files', () => {
  // The pre-commit check scans these files too, so a fake secret written as one literal here
  // would block their own commit.
  const dir = new URL('./', import.meta.url);
  test.each(readdirSync(dir))('%s has no line that looks like a secret', (name) => {
    const lines = readFileSync(new URL(name, dir), 'utf8').split('\n');
    expect(lines.filter((line) => findSecret(line) !== null)).toEqual([]);
  });
});
