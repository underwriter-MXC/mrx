import { test, expect } from '@playwright/test';

const PAGES_WITH_JSONLD = [
  '/',
  '/about',
  '/faq',
  '/methodology',
  '/sell-mineral-rights',
  '/book',
  '/privacy-policy',
  '/how-it-works',
  '/free-guide',
];

test.describe('JSON-LD schema markup', () => {
  for (const path of PAGES_WITH_JSONLD) {
    test(`JSON-LD present and parses on: ${path}`, async ({ page }) => {
      await page.goto(path);
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      expect(count, `${path} should have at least one JSON-LD block`).toBeGreaterThan(0);

      const body = (await jsonLdScripts.first().textContent()) ?? '';
      // Parse it; any parse error fails the test.
      const parsed = JSON.parse(body);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(Array.isArray(parsed['@graph'])).toBe(true);

      // Per compliance §10: no aggregateRating, no reviewCount.
      const serialized = JSON.stringify(parsed);
      expect(serialized).not.toMatch(/aggregateRating/i);
      expect(serialized).not.toMatch(/reviewCount/i);
    });
  }

  test('/faq emits a FAQPage node with the 7 required Q&A pairs', async ({ page }) => {
    await page.goto('/faq');
    const body = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(body ?? '{}');
    const faqPageNode = (parsed['@graph'] as any[]).find((n) => n['@type'] === 'FAQPage');
    expect(faqPageNode).toBeDefined();
    expect(faqPageNode.mainEntity.length).toBeGreaterThanOrEqual(7);
  });
});
