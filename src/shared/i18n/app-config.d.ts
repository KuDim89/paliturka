import type messages from './messages/en.json';
import type { routing } from './routing';

// Types the locale and the message keys for next-intl: a key missing from en.json, or a wrong
// argument for a message, fails `pnpm typecheck`.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
