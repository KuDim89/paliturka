import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { HomePage } from '@/pages/home';
import type { Locale } from '@/shared/i18n';
import { renderWithIntl } from '@/shared/i18n/index.testing';

// setRequestLocale only tells the server render which locale to use; the test provides the locale
// through renderWithIntl instead.
vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn(), getTranslations: vi.fn() }));

async function renderHomePage(locale: Locale) {
  const page = await HomePage({ params: Promise.resolve({ locale }) });
  return renderWithIntl(page, { locale });
}

describe('home page', () => {
  test.each([
    ['en', 'Your personal cloud library'],
    ['uk', 'Твоя особиста хмарна бібліотека'],
  ] as const)('in %s shows the product name and the tagline', async (locale, tagline) => {
    await renderHomePage(locale);

    expect(screen.getByRole('heading', { level: 1, name: 'paliturka' })).toBeInTheDocument();
    expect(screen.getByText(tagline)).toBeInTheDocument();
  });
});
