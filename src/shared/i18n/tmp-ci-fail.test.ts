import { expect, test } from 'vitest';

// Throwaway test for PL-20: always fails, so the unit test step fails. Never merged.
test('fails on purpose', () => {
  expect(1 + 1).toBe(3);
});
