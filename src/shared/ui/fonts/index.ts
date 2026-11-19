import localFont from 'next/font/local';

// Local files, not next/font/google: the build works offline and the font versions are fixed.
// How the files were made: ./README.md.

export const literata = localFont({
  src: [
    { path: './literata/Literata.woff2', weight: '400 700', style: 'normal' },
    { path: './literata/Literata-Italic.woff2', weight: '400 600', style: 'italic' },
  ],
  variable: '--font-literata',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

export const onest = localFont({
  src: './onest/Onest.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-onest',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
