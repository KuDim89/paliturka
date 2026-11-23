import en from './messages/en.json';
import uk from './messages/uk.json';
import type { Locale } from './routing';

// All messages by locale, for code that renders outside the [locale] layout (the 404 page) and for
// tests. Pages under [locale] get their messages from the request config instead.
export const messagesByLocale = { en, uk } satisfies Record<Locale, typeof en>;
