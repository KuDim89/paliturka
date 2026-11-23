import { expect, type Page, test } from '@playwright/test';

const LIGHT_BG = 'rgb(243, 238, 228)';
const DARK_BG = 'rgb(21, 24, 22)';

async function expectTheme(page: Page, theme: 'light' | 'dark') {
  const html = page.locator('html');
  if (theme === 'dark') {
    await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  } else {
    await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
  }
  await expect(html).toHaveCSS('color-scheme', theme);
  // The window background comes from <html>, so it follows a theme change without a reload.
  await expect(html).toHaveCSS('background-color', theme === 'dark' ? DARK_BG : LIGHT_BG);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    theme === 'dark' ? DARK_BG : LIGHT_BG,
  );
}

// next-themes keeps the chosen theme in localStorage under `theme`.
async function saveTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
}

test.describe('no theme chosen', () => {
  test.describe('system prefers dark', () => {
    test.use({ colorScheme: 'dark' });

    test('opens dark', async ({ page }) => {
      await page.goto('/en');
      await expectTheme(page, 'dark');
    });
  });

  test.describe('system prefers light', () => {
    test.use({ colorScheme: 'light' });

    test('opens light', async ({ page }) => {
      await page.goto('/en');
      await expectTheme(page, 'light');
    });

    test('follows a change of the system theme while open', async ({ page }) => {
      await page.goto('/en');
      await expectTheme(page, 'light');

      await page.emulateMedia({ colorScheme: 'dark' });
      await expectTheme(page, 'dark');

      await page.emulateMedia({ colorScheme: 'light' });
      await expectTheme(page, 'light');
    });
  });
});

test.describe('a chosen theme', () => {
  test.describe('system prefers dark', () => {
    test.use({ colorScheme: 'dark' });

    test('light opens light', async ({ page }) => {
      await saveTheme(page, 'light');
      await page.goto('/en');
      await expectTheme(page, 'light');
    });
  });

  test.describe('system prefers light', () => {
    test.use({ colorScheme: 'light' });

    test('dark opens dark', async ({ page }) => {
      await saveTheme(page, 'dark');
      await page.goto('/en');
      await expectTheme(page, 'dark');
    });

    test('a saved theme is kept after a reload', async ({ page }) => {
      await page.goto('/en');
      await expectTheme(page, 'light');

      await page.evaluate(() => localStorage.setItem('theme', 'dark'));
      await page.reload();
      await expectTheme(page, 'dark');
    });
  });
});

test.describe('first paint', () => {
  test.use({ colorScheme: 'dark' });

  test('the theme script comes before the page content in the server HTML', async ({ request }) => {
    const html = await (await request.get('/en')).text();
    const script = html.indexOf('localStorage.getItem');
    const content = html.indexOf('<main');

    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(content);
  });

  test('the theme is set before the content exists and never changes', async ({ page }) => {
    // Runs before the page's own scripts: records the theme on every class change of <html> and
    // whether the page content existed at that moment. It observes the document, because in some
    // browsers <html> does not exist yet when this runs.
    await page.addInitScript(() => {
      const changes: { dark: boolean; contentExists: boolean }[] = [];
      (window as unknown as { themeChanges: typeof changes }).themeChanges = changes;
      new MutationObserver((records) => {
        for (const record of records) {
          if (record.target !== document.documentElement) continue;
          changes.push({
            dark: document.documentElement.classList.contains('dark'),
            contentExists: document.querySelector('main') !== null,
          });
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });

    await page.goto('/en');
    await page.waitForLoadState('load');
    // Leave time for hydration and late scripts.
    await page.waitForTimeout(1000);

    const changes = await page.evaluate(
      () =>
        (window as unknown as { themeChanges: { dark: boolean; contentExists: boolean }[] })
          .themeChanges,
    );
    expect(changes[0]).toEqual({ dark: true, contentExists: false });
    expect(changes.filter((change) => !change.dark)).toEqual([]);
    await expectTheme(page, 'dark');
  });

  test('the theme survives a client re-render after a hydration mismatch', async ({ page }) => {
    // Like a page translator: changes the text after the HTML is parsed, before React hydrates.
    // React then renders the page again on the client, which the theme must survive.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const heading = document.querySelector('h1');
        if (heading) heading.textContent = 'палітурка';
      });
    });

    await page.goto('/en');
    await page.waitForTimeout(1500);
    await expectTheme(page, 'dark');
  });
});

test('the heading uses Literata and the body text uses Onest', async ({ page }) => {
  await page.goto('/en');

  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const root = getComputedStyle(document.documentElement);
    const firstFamily = (value: string) => value.split(',')[0].trim();
    const literata = firstFamily(root.getPropertyValue('--font-literata'));
    const onest = firstFamily(root.getPropertyValue('--font-onest'));
    const heading = getComputedStyle(document.querySelector('h1')!);
    // Browsers differ in whether a family name comes back quoted.
    const unquote = (value: string) => value.replace(/["']/g, '');
    return {
      literata: unquote(literata),
      onest: unquote(onest),
      heading: unquote(firstFamily(heading.fontFamily)),
      headingWeight: heading.fontWeight,
      body: unquote(firstFamily(getComputedStyle(document.body).fontFamily)),
      // The page has text only in the heading, so only Literata is downloaded.
      literataLoaded: [...document.fonts].some(
        (face) => unquote(face.family) === unquote(literata) && face.status === 'loaded',
      ),
    };
  });

  expect(fonts.literata).toMatch(/literata/i);
  expect(fonts.onest).toMatch(/onest/i);
  expect(fonts.heading).toBe(fonts.literata);
  expect(fonts.headingWeight).toBe('500');
  expect(fonts.body).toBe(fonts.onest);
  expect(fonts.literataLoaded).toBe(true);
});
