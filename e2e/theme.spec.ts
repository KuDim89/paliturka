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
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    theme === 'dark' ? DARK_BG : LIGHT_BG,
  );
}

async function setThemeCookie(page: Page, value: string) {
  await page.context().addCookies([{ name: 'theme', value, url: 'http://localhost:3000' }]);
}

test.describe('without a theme cookie', () => {
  test.describe('system prefers dark', () => {
    test.use({ colorScheme: 'dark' });

    test('opens dark', async ({ page }) => {
      await page.goto('/');
      await expectTheme(page, 'dark');
    });
  });

  test.describe('system prefers light', () => {
    test.use({ colorScheme: 'light' });

    test('opens light', async ({ page }) => {
      await page.goto('/');
      await expectTheme(page, 'light');
    });

    test('follows a change of the system theme while open', async ({ page }) => {
      await page.goto('/');
      await expectTheme(page, 'light');

      await page.emulateMedia({ colorScheme: 'dark' });
      await expectTheme(page, 'dark');

      await page.emulateMedia({ colorScheme: 'light' });
      await expectTheme(page, 'light');
    });
  });
});

test.describe('with a theme cookie', () => {
  test.describe('system prefers dark', () => {
    test.use({ colorScheme: 'dark' });

    test('theme=light opens light', async ({ page }) => {
      await setThemeCookie(page, 'light');
      await page.goto('/');
      await expectTheme(page, 'light');
    });
  });

  test.describe('system prefers light', () => {
    test.use({ colorScheme: 'light' });

    test('theme=dark opens dark', async ({ page }) => {
      await setThemeCookie(page, 'dark');
      await page.goto('/');
      await expectTheme(page, 'dark');
    });

    test('a theme saved the way setTheme saves it is kept after a reload', async ({ page }) => {
      await page.goto('/');
      await expectTheme(page, 'light');

      await page.evaluate(() => {
        document.cookie = 'theme=dark; path=/; max-age=31536000; samesite=lax';
      });
      await page.reload();
      await expectTheme(page, 'dark');
    });
  });
});

test.describe('first paint', () => {
  test.use({ colorScheme: 'dark' });

  test('the theme script is in <head>, before the body', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const script = html.indexOf("matchMedia('(prefers-color-scheme: dark)')");
    const head = html.indexOf('</head>');

    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(head);
  });

  test('the theme class never changes after the body exists', async ({ page }) => {
    // Runs before the page's own scripts: records every class change on <html> and whether the
    // body had been created at that moment. It observes the document, because in some browsers
    // <html> does not exist yet when this runs.
    await page.addInitScript(() => {
      const changes: { className: string; bodyExists: boolean }[] = [];
      (window as unknown as { themeChanges: typeof changes }).themeChanges = changes;
      new MutationObserver((records) => {
        for (const record of records) {
          if (record.target !== document.documentElement) continue;
          changes.push({
            className: document.documentElement.className,
            bodyExists: document.body !== null,
          });
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    // Leave time for hydration and late scripts.
    await page.waitForTimeout(1000);

    const changes = await page.evaluate(
      () =>
        (window as unknown as { themeChanges: { className: string; bodyExists: boolean }[] })
          .themeChanges,
    );
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.filter((change) => change.bodyExists)).toEqual([]);
    await expectTheme(page, 'dark');
  });
});

test('the heading uses Literata and the body text uses Onest', async ({ page }) => {
  await page.goto('/');

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
