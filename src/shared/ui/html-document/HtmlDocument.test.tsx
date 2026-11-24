import type { ReactElement, ReactNode } from 'react';
import { expect, test, vi } from 'vitest';

import { ThemeProvider } from '@/shared/lib/theme';

import { HtmlDocument } from './HtmlDocument';

// next/font only works inside a Next.js build.
vi.mock('@/shared/ui/fonts', () => ({
  literata: { variable: 'font-literata' },
  onest: { variable: 'font-onest' },
}));

type Element = ReactElement<{
  lang?: string;
  className?: string;
  suppressHydrationWarning?: boolean;
  children: ReactNode;
}>;

// jsdom cannot mount an <html> element inside its own document, so the test checks the tree.
test('renders <html> with the language and fonts, and the page inside the theme provider', () => {
  const page = <p>page</p>;

  const html = HtmlDocument({ lang: 'uk', children: page }) as Element;
  const body = html.props.children as Element;
  const provider = body.props.children as Element;

  expect(html.type).toBe('html');
  expect(html.props.lang).toBe('uk');
  expect(html.props.className).toBe('font-literata font-onest');
  // next-themes changes the class on <html> before React hydrates.
  expect(html.props.suppressHydrationWarning).toBe(true);
  expect(body.type).toBe('body');
  expect(provider.type).toBe(ThemeProvider);
  expect(provider.props.children).toBe(page);
});
