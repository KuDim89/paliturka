import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/shared/i18n';

type Props = { params: Promise<{ locale: string }> };

// Placeholder until the landing page.
// box-content: the 1280 px max width is the content, the side gutters sit outside it.
function HomeContent() {
  const t = useTranslations('home');

  return (
    <main className="mx-auto box-content min-h-dvh max-w-[1280px] bg-pl-bg px-4 py-16 sm:px-6">
      <h1 className="font-serif text-[34px] leading-tight font-medium tracking-[-0.02em] text-pl-ink sm:text-[48px] lg:text-[58px]">
        {t('name')}
      </h1>
      <p className="mt-3 text-lg text-pl-body">{t('tagline')}</p>
    </main>
  );
}

// The [locale] layout has already rejected unknown locales.
export async function HomePage({ params }: Props) {
  const { locale } = await params;
  // Keeps the page static: next-intl reads the locale from here instead of the request headers.
  setRequestLocale(locale as Locale);

  return <HomeContent />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'home' });

  return { title: t('title') };
}
