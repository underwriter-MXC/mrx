import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/how-it-works',
  '/about',
  '/faq',
  '/free-guide',
  '/book',
  '/methodology',
  '/sell-mineral-rights',
  '/privacy-policy',
];

test.describe('smoke', () => {
  for (const path of PAGES) {
    test(`page returns 200 and has the §7 footer disclaimer: ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      // The §7 footer disclaimer is the only place the marketing copy
      // is allowed to mention "not certified appraisals". Verify it's
      // in the rendered DOM.
      const footer = await page.locator('.mrx-disclaimer-footer').first();
      await expect(footer).toBeVisible();
      await expect(footer).toContainText(/not certified appraisals/i);
    });
  }

  test('/blog returns 200', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBe(200);
  });

  test('/blog/<post-slug>/ returns 200 for at least one migrated post', async ({ page }) => {
    const response = await page.goto('/blog/how-are-mineral-rights-valued/');
    expect(response?.status()).toBe(200);
    const footer = await page.locator('.mrx-disclaimer-footer').first();
    await expect(footer).toBeVisible();
  });
});
