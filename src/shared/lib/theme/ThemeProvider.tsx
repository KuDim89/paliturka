'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

// The project's theme settings in one place. next-themes adds a small script that sets the `dark`
// class and `color-scheme` on <html> before the page is painted, follows the system theme until
// the user picks one, keeps the choice in localStorage under `theme`, and applies it again after
// React re-renders the page.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark']}
      storageKey="theme"
    >
      {children}
    </NextThemesProvider>
  );
}
