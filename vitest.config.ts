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
          // .claude/ holds the hooks of the project's Claude Code agents.
          include: ['src/**/*.test.ts', 'app/**/*.test.ts', '.claude/**/*.test.ts'],
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
      // Only code with logic to test, so the thresholds measure real code. Left out: app/ (Next.js
      // routes and special files, which only wire FSD pages in and are covered by the e2e tests),
      // slice public APIs and entry points (index.ts, index.server.ts: re-exports and singletons
      // built from tested code), and type declarations. Root config files and generated/ are
      // outside src/.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/**/index*.ts', '**/*.d.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      // List fully covered files too, so the table shows every file.
      reporter: [['text', { skipFull: false }], 'html'],
    },
  },
});
