import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sitemapDir = join(process.cwd(), 'dist', 'client');

test.describe('production sitemaps', () => {
  test('publishes a segmented public-content index', () => {
    const body = readFileSync(join(sitemapDir, 'sitemap-index.xml'), 'utf-8');
    expect(body).toMatch(/<sitemapindex/i);
    for (const segment of ['core', 'articles', 'authors', 'team', 'states']) {
      expect(body).toContain(`sitemap-${segment}.xml`);
    }
  });

  test('core sitemap lists the owner journeys and excludes private utility pages', () => {
    const body = readFileSync(join(sitemapDir, 'sitemap-core.xml'), 'utf-8');
    for (const path of ['/', '/mineral-rights-value/', '/offer-review/', '/inherited-mineral-rights/', '/learning-center/', '/book/', '/privacy-policy/']) {
      expect(body, `path ${path} should be in the core sitemap`).toContain(path);
    }
    expect(body).not.toContain('/account/');
    expect(body).not.toContain('/thank-you/');
  });

  test('homepage has highest priority and public legal content remains lower priority', () => {
    const body = readFileSync(join(sitemapDir, 'sitemap-core.xml'), 'utf-8');
    expect(body).toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/);
    expect(body).toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/privacy-policy\/<\/loc>[\s\S]*?<priority>0\.4<\/priority>/);
  });
});
