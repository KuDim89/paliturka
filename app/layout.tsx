import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { literata, onest } from '@/shared/ui/fonts';
import { themeInitScript } from '@/shared/lib/theme';

export const metadata: Metadata = {
  title: 'paliturka',
};

// lang is fixed until i18n sets it from the locale.
// The theme script sets the theme class on <html> before React hydrates, hence
// suppressHydrationWarning. No cookies() here: it would make every page dynamic.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${literata.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
