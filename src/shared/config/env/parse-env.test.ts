import { expect, test } from 'vitest';
import { z } from 'zod';

import { parseEnv } from './parse-env';

const testSchema = z.object({
  PORT: z.coerce.number().int(),
  APP_NAME: z.string().min(8),
});

test('returns typed values for a valid source', () => {
  const env = parseEnv(testSchema, { PORT: '3000', APP_NAME: 'long-enough' });

  expect(env).toEqual({ PORT: 3000, APP_NAME: 'long-enough' });
  expect(typeof env.PORT).toBe('number');
});

test('names every invalid variable in one error', () => {
  expect(() => parseEnv(testSchema, { PORT: 'abc' })).toThrow(/PORT[\s\S]*APP_NAME/);
});

test('does not include the values in the error', () => {
  expect(() => parseEnv(testSchema, { PORT: '3000', APP_NAME: 'short' })).toThrow(
    expect.objectContaining({ message: expect.not.stringContaining('short') }),
  );
});
