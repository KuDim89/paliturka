import { createTranslator } from 'next-intl';
import { describe, expect, test } from 'vitest';

import { messageKeys } from './message-keys';
import en from './messages/en.json';
import uk from './messages/uk.json';

describe('messageKeys', () => {
  test('lists nested keys as dotted paths', () => {
    expect(messageKeys({ b: 'x', a: { d: 'y', c: 'z' } })).toEqual(['a.c', 'a.d', 'b']);
  });

  test('tells apart objects with a key missing on one side', () => {
    expect(messageKeys({ a: { b: 'x', c: 'y' } })).not.toEqual(messageKeys({ a: { b: 'x' } }));
  });
});

test('en.json and uk.json have exactly the same keys', () => {
  expect(messageKeys(uk)).toEqual(messageKeys(en));
});

describe('book count plural', () => {
  test.each([
    [1, '1 книжка'],
    [2, '2 книжки'],
    [5, '5 книжок'],
    [21, '21 книжка'],
  ])('uk: %i → %s', (count, expected) => {
    const t = createTranslator({ locale: 'uk', messages: uk, namespace: 'library' });
    expect(t('bookCount', { count })).toBe(expected);
  });

  test.each([
    [1, '1 book'],
    [5, '5 books'],
  ])('en: %i → %s', (count, expected) => {
    const t = createTranslator({ locale: 'en', messages: en, namespace: 'library' });
    expect(t('bookCount', { count })).toBe(expected);
  });
});

// Checked by `pnpm typecheck`, never run: if message keys stop being typed, the directive below
// becomes unused and typecheck fails.
export function unknownKeyFailsTypecheck() {
  const t = createTranslator({ locale: 'en', messages: en });
  // @ts-expect-error `home.missing` is not a key in en.json.
  return t('home.missing');
}
