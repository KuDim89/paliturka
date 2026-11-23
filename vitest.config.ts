import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from tsconfig.json, so it is defined in one place.
  resolve: { tsconfigPaths: true },
  test: {
    // next-intl imports `next/navigation` without an extension, which Node's ESM loader does not
    // resolve; letting Vite process next-intl fixes it.
    server: { deps: { inline: ['next-intl'] } },
    projects: [
      {
        extends: true,
        test: {
          // Logic and server code: jsdom would replace Node globals such as streams and fetch.
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'app/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'app/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      // List fully covered files too, so the table shows every file.
      reporter: [['text', { skipFull: false }], 'html'],
    },
  },
});
