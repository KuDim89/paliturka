import '../globals.css';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { routing } from '@/shared/i18n';
import { HtmlDocument } from '@/shared/ui/html-document';

// The root layout: every page lives under [locale]. URLs that match no route get
// app/global-not-found.tsx instead.

// Only /en and /uk exist: any other first segment is a 404 (app/global-not-found.tsx).
export const dynamicParams = false;

// Prerenders /en and /uk, so the pages stay static.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <HtmlDocument lang={locale}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </HtmlDocument>
  );
}
