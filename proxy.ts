import createMiddleware from 'next-intl/middleware';

import { routing } from '@/shared/i18n';

// Redirects requests without a locale (for example / → /uk) and remembers the chosen locale in the
// NEXT_LOCALE cookie.
export default createMiddleware(routing);

export const config = {
  // Skip API routes (a future mobile app uses them), Next.js internals and files with an extension.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
