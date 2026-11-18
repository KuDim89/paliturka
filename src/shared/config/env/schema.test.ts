import { expect, test } from 'vitest';

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
