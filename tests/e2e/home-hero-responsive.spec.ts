import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'wide desktop', width: 1920, height: 700, expectedObjectPosition: '50% 0%' },
  { name: 'desktop', width: 1440, height: 900, expectedObjectPosition: '50% 0%' },
  { name: 'tablet', width: 1180, height: 820, expectedObjectPosition: '50% 0%' },
  { name: 'compact tablet', width: 900, height: 800, expectedObjectPosition: '26% 0%' },
  { name: 'mobile', width: 390, height: 844, expectedObjectPosition: '26% 0%' },
] as const;

test.describe('homepage hero responsive artwork', () => {
  for (const viewport of viewports) {
    test(`keeps Travis's head anchored inside the ${viewport.name} hero crop`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const media = page.locator('.mrx-home-hero__media');
      const image = media.locator('img');
      const benefitsHeading = page.locator('.mrx-benefits h2');
      await expect(media).toBeVisible();
      await expect(image).toBeVisible();
      await expect(benefitsHeading).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate((element) => {
            const img = element as HTMLImageElement;
            return img.complete && img.naturalWidth > 0;
          }),
        )
        .toBe(true);

      const layout = await image.evaluate((element) => {
        const imageRect = element.getBoundingClientRect();
        const mediaRect = element.closest('.mrx-home-hero__media')?.getBoundingClientRect();
        const computed = getComputedStyle(element);

        return {
          imageTop: imageRect.top,
          mediaTop: mediaRect?.top ?? null,
          objectFit: computed.objectFit,
          objectPosition: computed.objectPosition,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        };
      });

      expect(layout.objectFit).toBe('cover');
      expect(layout.objectPosition).toBe(viewport.expectedObjectPosition);
      expect(layout.imageTop).toBe(layout.mediaTop);
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);

      const headingLines = await benefitsHeading.evaluate((element) => {
        const styles = getComputedStyle(element);
        return Math.round(
          element.getBoundingClientRect().height / Number.parseFloat(styles.lineHeight),
        );
      });

      if (viewport.width >= 1440) {
        expect(headingLines).toBe(1);
      }
    });
  }
});
