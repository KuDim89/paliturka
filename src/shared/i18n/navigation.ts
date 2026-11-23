import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

// Locale-aware versions of the Next.js navigation APIs: links and redirects keep the current
// locale, and `useRouter().replace(pathname, { locale })` switches it.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
