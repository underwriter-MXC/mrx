import { test, expect } from '@playwright/test';

test.describe('sitemap', () => {
  test('sitemap_index.xml is served and references sitemap-0.xml', async ({ request }) => {
    const r = await request.get('/sitemap_index.xml');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/<sitemapindex/i);
    expect(body).toMatch(/sitemap-0\.xml/);
  });

  test('sitemap-0.xml lists at least the 9 marketing pages', async ({ request }) => {
    const r = await request.get('/sitemap-0.xml');
    expect(r.status()).toBe(200);
    const body = await r.text();
    for (const path of ['/', '/how-it-works', '/about', '/faq', '/free-guide', '/book', '/methodology', '/sell-mineral-rights', '/privacy-policy']) {
      expect(body, `path ${path} should be in sitemap-0.xml`).toContain(path);
    }
  });

  test('homepage is priority 1.0 and thank-you pages are deprioritized', async ({ request }) => {
    const r = await request.get('/sitemap-0.xml');
    const body = await r.text();
    // Homepage URL gets priority 1.0 (highest crawl weight).
    expect(body).toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/);
    // Thank-you pages get 0.3 (lowest, still indexable for analytics).
    expect(body).toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/book\/thank-you\/<\/loc>[\s\S]*?<priority>0\.3<\/priority>/);
    // Privacy policy gets 0.4.
    expect(body).toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/privacy-policy\/<\/loc>[\s\S]*?<priority>0\.4<\/priority>/);
  });
});
