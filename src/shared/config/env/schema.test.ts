import { expect, test } from 'vitest';

import { parseEnv } from './parse-env';
import { envSchema } from './schema';

test('STORAGE_DIR defaults to ./storage', () => {
  expect(parseEnv(envSchema, {}).STORAGE_DIR).toBe('./storage');
});

test('STORAGE_DIR takes the value from the source', () => {
  expect(parseEnv(envSchema, { STORAGE_DIR: '/data/books' }).STORAGE_DIR).toBe('/data/books');
});

test('STORAGE_DIR rejects an empty string', () => {
  expect(() => parseEnv(envSchema, { STORAGE_DIR: '' })).toThrow(/STORAGE_DIR/);
});
