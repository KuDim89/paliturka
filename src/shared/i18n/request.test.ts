import { describe, expect, test, vi } from 'vitest';

import en from './messages/en.json';
import uk from './messages/uk.json';

// getRequestConfig only registers the callback for Next.js; returning it lets the test call it.
vi.mock('next-intl/server', () => ({ getRequestConfig: (callback: unknown) => callback }));

type RequestConfig = (params: {
  locale?: string;
  requestLocale: Promise<string | undefined>;
}) => Promise<{ locale: string; messages: unknown }>;

const { default: loadRequestConfig } = (await import('./request')) as unknown as {
  default: RequestConfig;
};

describe('request config', () => {
  test('uses the locale from the URL with its messages', async () => {
    const config = await loadRequestConfig({ requestLocale: Promise.resolve('uk') });

    expect(config).toEqual({ locale: 'uk', messages: uk });
  });

  test('an explicit locale wins over the one from the URL', async () => {
    const config = await loadRequestConfig({ locale: 'en', requestLocale: Promise.resolve('uk') });

    expect(config).toEqual({ locale: 'en', messages: en });
  });

  test.each([
    ['an unknown locale', 'de'],
    ['no locale', undefined],
  ])('falls back to English for %s', async (_case, requested) => {
    const config = await loadRequestConfig({ requestLocale: Promise.resolve(requested) });

    expect(config).toEqual({ locale: 'en', messages: en });
  });
});
