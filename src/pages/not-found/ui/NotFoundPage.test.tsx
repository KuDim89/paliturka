import type { ReactElement } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { NotFoundContent } from './NotFoundContent';
import { NotFoundPage } from './NotFoundPage';

const { getLocale } = vi.hoisted(() => ({ getLocale: vi.fn<() => Promise<string>>() }));

vi.mock('next-intl/server', () => ({ getLocale }));
// next/font only works inside a Next.js build.
vi.mock('@/shared/ui/fonts', () => ({ literata: { variable: '' }, onest: { variable: '' } }));

type Page = ReactElement<{ lang: string; children: ReactElement<{ locale: string }> }>;

describe('not found page', () => {
  // The page renders a whole <html> document, which jsdom cannot mount inside its own one, so the
  // test checks the element tree instead.
  test.each([
    ['the locale from the URL', 'uk', 'uk'],
    ['the default locale for an unknown one', 'de', 'en'],
  ])('uses %s', async (_case, requested, expected) => {
    getLocale.mockResolvedValue(requested);

    const page = (await NotFoundPage()) as Page;

    expect(page.props.lang).toBe(expected);
    expect(page.props.children.type).toBe(NotFoundContent);
    expect(page.props.children.props.locale).toBe(expected);
  });
});
