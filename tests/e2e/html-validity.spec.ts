import { test, expect } from '@playwright/test';

const publicPages = [
  '/',
  '/mineral-rights-value/',
  '/offer-review/',
  '/inherited-mineral-rights/',
  '/learning-center/',
  '/team/',
  '/book/',
];

test.describe('public HTML validity', () => {
  for (const path of publicPages) {
    test(`${path} does not contain nested anchors`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('a a')).toHaveCount(0);
    });
  }
});
