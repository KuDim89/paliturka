import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';
// Set by GitHub Actions, and by `pnpm test:e2e:ci` to run locally the way CI does.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // The HTML report never opens by itself: after a failure it would wait for Ctrl+C
  // instead of exiting. `pnpm test:e2e:report` opens it.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // CI tests the production build, which also proves that the app builds; locally the dev server
    // is faster to start.
    command: isCI ? 'pnpm build && pnpm start' : 'pnpm dev',
    url: baseURL,
    // Next.js does not allow a second `next dev` in the same folder, so a running one is reused
    // locally. CI always starts its own, so it fails when the port is taken instead of testing
    // whatever runs there.
    reuseExistingServer: !isCI,
    // The production build, or the first request compiling the page in dev mode, takes a while.
    timeout: isCI ? 300_000 : 120_000,
  },
});
