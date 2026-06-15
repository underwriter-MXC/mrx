import { test, expect } from '@playwright/test';

test.describe('robots.txt', () => {
  test('returns 200 with the correct shape and a Sitemap directive', async ({ request }) => {
    const r = await request.get('/robots.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Disallow:\s*\/blog\/drafts\//i);
    expect(body).toMatch(/Sitemap:\s*https:\/\/mineralrightsxchange\.com\/sitemap-index\.xml/i);
  });
});
