import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
    command: 'pnpm dev',
    url: baseURL,
    // Next.js does not allow a second `next dev` in the same folder, so a running one is reused
    // locally. CI always starts its own.
    reuseExistingServer: !process.env.CI,
    // The first request compiles the page, which can take a while in dev mode.
    timeout: 120_000,
  },
});
