import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';

import { messagesByLocale } from './messages-by-locale';
import type { Locale } from './routing';

type Options = RenderOptions & { locale?: Locale };

// Renders a component with the messages of a locale, the way the [locale] layout provides them.
// Test-only entry point, so the testing library never reaches the app bundle.
export function renderWithIntl(ui: ReactElement, { locale = 'en', ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
