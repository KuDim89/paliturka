import { defineRouting } from 'next-intl/routing';

// The locale is always in the URL (/en/..., /uk/...). A request without one is redirected to the
// locale from the NEXT_LOCALE cookie, then the browser language, then the default.
export const routing = defineRouting({
  locales: ['en', 'uk'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
