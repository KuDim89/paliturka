import { describe, expect, test } from 'vitest';

import { parseEnv } from './parse-env';
import { envSchema } from './schema';

const DATABASE_URL = 'file:./storage/paliturka.db';

test('DATABASE_URL takes the value from the source', () => {
  expect(parseEnv(envSchema, { DATABASE_URL }).DATABASE_URL).toBe(DATABASE_URL);
});

test('DATABASE_URL is required', () => {
  expect(() => parseEnv(envSchema, {})).toThrow(/DATABASE_URL/);
});

test('DATABASE_URL must be a file: URL', () => {
  expect(() => parseEnv(envSchema, { DATABASE_URL: './paliturka.db' })).toThrow(/DATABASE_URL/);
});

test('STORAGE_DIR defaults to ./storage', () => {
  expect(parseEnv(envSchema, { DATABASE_URL }).STORAGE_DIR).toBe('./storage');
});

test('STORAGE_DIR takes the value from the source', () => {
  const env = parseEnv(envSchema, { DATABASE_URL, STORAGE_DIR: '/data/books' });

  expect(env.STORAGE_DIR).toBe('/data/books');
});

test('STORAGE_DIR rejects an empty string', () => {
  expect(() => parseEnv(envSchema, { DATABASE_URL, STORAGE_DIR: '' })).toThrow(/STORAGE_DIR/);
});

describe('DEV_ALLOWED_ORIGINS', () => {
  const origins = (value?: string) =>
    parseEnv(envSchema, { DATABASE_URL, DEV_ALLOWED_ORIGINS: value }).DEV_ALLOWED_ORIGINS;

  test('is an empty list when missing', () => {
    expect(origins()).toEqual([]);
  });

  test('is an empty list when empty', () => {
    expect(origins('')).toEqual([]);
  });

  test('takes one hostname', () => {
    expect(origins('192.168.1.20')).toEqual(['192.168.1.20']);
  });

  test('splits a comma-separated list and trims spaces', () => {
    expect(origins(' 192.168.1.20 , laptop.local ,')).toEqual(['192.168.1.20', 'laptop.local']);
  });

  test('accepts Next.js wildcard patterns', () => {
    expect(origins('192.168.*.*, **.local-origin.dev')).toEqual([
      '192.168.*.*',
      '**.local-origin.dev',
    ]);
  });

  test.each([
    ['a URL with a scheme', 'http://192.168.1.20'],
    ['a port', '192.168.1.20:3000'],
    ['a path', '192.168.1.20/en'],
    ['only wildcards', '*.*.*.*'],
    ['** not at the start', '192.**.1.20'],
  ])('rejects %s', (_case, value) => {
    expect(() => origins(value)).toThrow(/DEV_ALLOWED_ORIGINS/);
  });
});
