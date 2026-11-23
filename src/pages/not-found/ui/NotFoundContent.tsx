import { createTranslator } from 'next-intl';

import { type Locale, messagesByLocale } from '@/shared/i18n';

import { NotFoundView } from './NotFoundView';

// The 404 content in a given locale. It renders outside the [locale] layout, so it takes the locale
// as a prop and needs no next-intl provider.
export function NotFoundContent({ locale }: { locale: Locale }) {
  const t = createTranslator({ locale, messages: messagesByLocale[locale], namespace: 'notFound' });

  return (
    <NotFoundView
      eyebrow={t('eyebrow')}
      heading={t('heading')}
      toHome={t('toHome')}
      homeHref={`/${locale}`}
    />
  );
}
