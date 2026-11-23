import { expect, test } from '@playwright/test';

// 375 is the phone base; the rest are the Tailwind breakpoints (see .claude/rules/design.md).
const WIDTHS = [375, 640, 768, 1024, 1280, 1536];
const CONTENT_MAX = 1280;

// Add each new screen here. `content` is the element that holds the page's content container.
const PAGES = [{ name: 'home', path: '/en', content: 'main' }];

function gutter(width: number) {
  return width < 640 ? 16 : 24;
}

for (const page of PAGES) {
  test.describe(`${page.name} page`, () => {
    for (const width of WIDTHS) {
      test(`works at ${width} px`, async ({ page: browserPage }) => {
        await browserPage.setViewportSize({ width, height: 900 });
        await browserPage.goto(page.path);

        const layout = await browserPage.evaluate((selector) => {
          const content = document.querySelector(selector)!;
          const style = getComputedStyle(content);
          return {
            viewport: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            contentWidth:
              content.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          };
        }, page.content);

        // No horizontal scroll.
        expect(layout.scrollWidth).toBe(layout.viewport);
        // The content is at most 1280 px wide; the gutters sit outside it.
        expect(layout.contentWidth).toBeCloseTo(
          Math.min(CONTENT_MAX, layout.viewport - 2 * gutter(width)),
          0,
        );
      });
    }
  });
}
