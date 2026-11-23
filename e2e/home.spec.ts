import { expect, test } from '@playwright/test';

const LOCALES = [
  {
    locale: 'en',
    title: 'paliturka · Your personal cloud library',
    tagline: 'Your personal cloud library',
  },
  {
    locale: 'uk',
    title: 'paliturka · Твоя особиста хмарна бібліотека',
    tagline: 'Твоя особиста хмарна бібліотека',
  },
];

for (const { locale, title, tagline } of LOCALES) {
  test(`home page in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('heading', { level: 1, name: 'paliturka' })).toBeVisible();
    await expect(page.getByText(tagline)).toBeVisible();
  });
}
