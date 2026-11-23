import { hasLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { routing } from '@/shared/i18n';
import { HtmlDocument } from '@/shared/ui/html-document';

import { NotFoundContent } from './NotFoundContent';

// The whole 404 document (app/global-not-found.tsx). Next.js serves it for every URL that matches
// no route, without rendering any layout, so it brings its own <html>. The locale is the one the
// proxy found in the URL (/uk/... → uk), or the default locale for URLs it skips (/api/...).
export async function NotFoundPage() {
  const requested = await getLocale();
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return (
    <HtmlDocument lang={locale}>
      <NotFoundContent locale={locale} />
    </HtmlDocument>
  );
}
