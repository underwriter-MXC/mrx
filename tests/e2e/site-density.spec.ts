import { expect, test } from '@playwright/test';

const representativePages = [
  '/',
  '/about',
  '/how-it-works',
  '/inherited-mineral-rights/',
  '/learning-center/',
  '/book/',
  '/team/',
  '/methodology/',
  '/sell-mineral-rights/',
] as const;

test.describe('Compact site-wide page rhythm', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of representativePages) {
    test(`${path} brings its primary content into the opening viewport`, async ({ page }) => {
      await page.goto(path);

      const heading = page.locator('main h1').first();
      await expect(heading).toBeVisible();

      const metrics = await heading.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          top: bounds.top,
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          pageType: document.body.dataset.pageType,
        };
      });

      expect(metrics.top).toBeLessThan(560);
      expect(metrics.fontSize).toBeLessThanOrEqual(72);
      expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.pageType).toBeTruthy();
    });
  }

  test('all article entries use the reusable compact article layout', async ({ page }) => {
    await page.goto('/blog/how-are-mineral-rights-valued/');

    const layout = page.locator('[data-article-layout]');
    await expect(layout).toBeVisible();
    await expect(page.locator('.article-hero-image img')).toBeVisible();
    await expect(page.locator('.article-page__content')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('.article-page__content')?.getBoundingClientRect();
      const title = document.querySelector('.article-page h1');
      return {
        contentTop: content?.top ?? Number.POSITIVE_INFINITY,
        titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      };
    });

    expect(metrics.contentTop).toBeLessThan(760);
    expect(metrics.titleSize).toBeLessThanOrEqual(60);
  });
});
