import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

// Loaded by the next-intl plugin (next.config.ts) for every server render.
export default getRequestConfig(async ({ locale: explicitLocale, requestLocale }) => {
  // An explicit locale (getTranslations({ locale })) comes first: awaiting requestLocale without
  // setRequestLocale would read the request headers and make the page dynamic.
  const requested = explicitLocale ?? (await requestLocale);
  // Outside a [locale] route (for example the root 404) there is no locale: use the default.
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
