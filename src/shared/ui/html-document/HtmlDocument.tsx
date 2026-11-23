import type { ReactNode } from 'react';

import { ThemeProvider } from '@/shared/lib/theme';
import { literata, onest } from '@/shared/ui/fonts';

// The <html> shell shared by the [locale] layout and the 404 page. next-themes sets the theme class
// on <html> before React hydrates, hence suppressHydrationWarning.
export function HtmlDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang} className={`${literata.variable} ${onest.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
