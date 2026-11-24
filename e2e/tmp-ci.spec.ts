import { expect, test } from '@playwright/test';

// Throwaway test for PL-20: always fails, so the e2e job fails and uploads its report. Never merged.
test('fails on purpose', async ({ page }) => {
  await page.goto('/en');

  await expect(page).toHaveTitle('this title does not exist');
});
