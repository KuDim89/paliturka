import { describe, expect, test } from 'vitest';

import { resolveTheme } from './theme';

describe('resolveTheme', () => {
  test.each([
    { cookie: 'light', prefersDark: false, expected: 'light' },
    { cookie: 'light', prefersDark: true, expected: 'light' },
    { cookie: 'dark', prefersDark: false, expected: 'dark' },
    { cookie: 'dark', prefersDark: true, expected: 'dark' },
    { cookie: undefined, prefersDark: false, expected: 'light' },
    { cookie: undefined, prefersDark: true, expected: 'dark' },
    { cookie: null, prefersDark: false, expected: 'light' },
    { cookie: null, prefersDark: true, expected: 'dark' },
    { cookie: 'sepia', prefersDark: false, expected: 'light' },
    { cookie: 'sepia', prefersDark: true, expected: 'dark' },
    { cookie: '', prefersDark: true, expected: 'dark' },
    { cookie: 'DARK', prefersDark: false, expected: 'light' },
  ])(
    'cookie $cookie, system dark $prefersDark → $expected',
    ({ cookie, prefersDark, expected }) => {
      expect(resolveTheme(cookie, prefersDark)).toBe(expected);
    },
  );
});
