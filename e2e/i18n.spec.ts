import { expect, test } from '@playwright/test';

test.describe('redirect from /', () => {
  for (const [acceptLanguage, target] of [
    ['uk', '/uk'],
    ['en', '/en'],
    ['de', '/en'],
  ]) {
    test(`Accept-Language: ${acceptLanguage} → ${target}`, async ({ request }) => {
      const response = await request.get('/', {
        headers: { 'Accept-Language': acceptLanguage },
        maxRedirects: 0,
      });

      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(new URL(response.headers()['location'], 'http://localhost').pathname).toBe(target);
    });
  }
});

test.describe('a chosen locale is remembered', () => {
  test.use({ extraHTTPHeaders: { 'Accept-Language': 'en' } });

  test('after visiting /uk, / goes to /uk', async ({ page }) => {
    await page.goto('/uk');
    await page.goto('/');

    await expect(page).toHaveURL(/\/uk$/);
  });
});

test('an unknown locale shows the 404 page', async ({ page }) => {
  // `de` is not a locale, so the proxy treats it as a path: /de → /en/de, which does not exist.
  const response = await page.goto('/de');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'This page isn’t here' })).toBeVisible();
});

test('the 404 page follows the locale in the URL', async ({ page }) => {
  const response = await page.goto('/uk/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.getByRole('heading', { level: 1, name: 'Такої сторінки немає' })).toBeVisible();
});

test.describe('the 404 page is a server-rendered document', () => {
  for (const [path, lang, heading] of [
    ['/uk/no-such-page', 'uk', 'Такої сторінки немає'],
    ['/en/no-such-page', 'en', 'This page isn’t here'],
    ['/api/anything', 'en', 'This page isn’t here'],
  ]) {
    test(`${path}: lang and heading are in the HTML from the server`, async ({ request }) => {
      const response = await request.get(path);
      const html = await response.text();

      expect(response.status()).toBe(404);
      // Not the error shell that React fills in on the client.
      expect(html).not.toContain('__next_error__');
      expect(html).toContain(`<html lang="${lang}"`);
      expect(html).toContain(heading);
    });
  }

  test('no console error about the theme script', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/uk/no-such-page');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(errors.filter((text) => text.includes('script tag'))).toEqual([]);
  });

  test.describe('system prefers dark', () => {
    test.use({ colorScheme: 'dark' });

    test('the theme is applied', async ({ page }) => {
      await page.goto('/uk/no-such-page');

      await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
    });
  });
});

test('the proxy does not redirect /api', async ({ request }) => {
  const response = await request.get('/api/anything', { maxRedirects: 0 });

  // No API routes exist yet, so the answer is a 404; what matters is that it is not a redirect.
  const isRedirect = response.status() >= 300 && response.status() < 400;
  expect(isRedirect).toBe(false);
  expect(response.headers()['location']).toBeUndefined();
});
