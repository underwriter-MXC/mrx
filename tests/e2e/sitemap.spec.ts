import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sitemapDirs = [
  join(process.cwd(), 'tmp', 'playwright-build'),
  join(process.cwd(), 'dist', 'client'),
  join(process.cwd(), 'dist'),
];
const postsDir = join(process.cwd(), 'src', 'content', 'posts');

const expectedPublishedArticleCount = readdirSync(postsDir)
  .filter((file) => file.endsWith('.mdx'))
  .filter((file) => {
    const source = readFileSync(join(postsDir, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    return /^publication_status:\s*published\s*$/m.test(frontmatter);
  }).length;

function sitemapPath(file: string): string {
  return (
    sitemapDirs.map((dir) => join(dir, file)).find((path) => existsSync(path)) ??
    join(sitemapDirs[0], file)
  );
}

test.describe('production sitemaps', () => {
  test('publishes a segmented public-content index', () => {
    const canonicalIndex = sitemapPath('sitemap_index.xml');
    expect(existsSync(canonicalIndex)).toBe(true);
    expect(existsSync(sitemapPath('sitemap-index.xml'))).toBe(true);
    expect(existsSync(sitemapPath('sitemap.xml'))).toBe(false);

    const body = readFileSync(canonicalIndex, 'utf-8');
    expect(readFileSync(sitemapPath('sitemap-index.xml'), 'utf-8')).toBe(body);
    expect(body).toMatch(/<sitemapindex/i);
    for (const segment of ['core', 'articles', 'authors', 'team', 'states']) {
      expect(body).toContain(`sitemap-${segment}.xml`);
    }
  });

  test('core sitemap lists the owner journeys and excludes private utility pages', () => {
    const body = readFileSync(sitemapPath('sitemap-core.xml'), 'utf-8');
    for (const path of [
      '/',
      '/mineral-rights-value/',
      '/offer-review/',
      '/inherited-mineral-rights/',
      '/book/',
      '/privacy-policy/',
    ]) {
      expect(body, `path ${path} should be in the core sitemap`).toContain(path);
    }
    // /learning-center/ is the canonical articles index and now lives in
    // sitemap-articles.xml (alongside /blog/{slug}/ article posts). The
    // redirecting /blog/ URL must not appear in either segment. Note that
    // /learning-center/{pillar}/ pages are real (non-redirecting) routes
    // and continue to appear in the core sitemap.
    expect(body, 'core sitemap must not advertise the Learning Center hub').not.toMatch(
      /<loc>https:\/\/mineralrightsxchange\.com\/learning-center\/<\/loc>/,
    );
    // /blog/category/* archive pages are real (non-redirecting) routes and
    // remain in the core segment; only the redirecting bare /blog/ index
    // must be excluded from the public sitemaps.
    expect(body, 'core sitemap must not advertise the redirecting /blog/ index').not.toMatch(
      /<loc>https:\/\/mineralrightsxchange\.com\/blog\/<\/loc>/,
    );
    expect(body).not.toContain('/account/');
    expect(body).not.toContain('/owner-intake/');
    expect(body).not.toContain('/staff/');
    expect(body).not.toContain('/thank-you/');
  });

  test('homepage has highest priority and public legal content remains lower priority', () => {
    const body = readFileSync(sitemapPath('sitemap-core.xml'), 'utf-8');
    expect(body).toMatch(
      /<loc>https:\/\/mineralrightsxchange\.com\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/,
    );
    expect(body).toMatch(
      /<loc>https:\/\/mineralrightsxchange\.com\/privacy-policy\/<\/loc>[\s\S]*?<priority>0\.4<\/priority>/,
    );
  });

  test('every current article has one URL, one real lastmod, and one hero image', () => {
    const body = readFileSync(sitemapPath('sitemap-articles.xml'), 'utf-8');
    const articleBlocks = (body.match(/<url>[\s\S]*?<\/url>/g) ?? []).filter((block) =>
      /<loc>https:\/\/mineralrightsxchange\.com\/blog\/[a-z0-9-]+\/<\/loc>/.test(block),
    );
    const articleUrls = articleBlocks.map((block) => block.match(/<loc>[^<]+<\/loc>/)?.[0]);
    expect(articleBlocks).toHaveLength(expectedPublishedArticleCount);
    expect(new Set(articleUrls).size).toBe(expectedPublishedArticleCount);
    expect(articleBlocks.every((block) => block.includes('<image:image>'))).toBe(true);
    expect(articleBlocks.every((block) => /<lastmod>[^<]+<\/lastmod>/.test(block))).toBe(true);
  });

  test('articles sitemap is the canonical Learning Center hub plus fail-closed article posts', () => {
    const body = readFileSync(sitemapPath('sitemap-articles.xml'), 'utf-8');
    const allBlocks = body.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    const articlePostBlocks = allBlocks.filter((block) =>
      /<loc>https:\/\/mineralrightsxchange\.com\/blog\/[a-z0-9-]+\/<\/loc>/.test(block),
    );
    const hubBlock = allBlocks.filter((block) =>
      /<loc>https:\/\/mineralrightsxchange\.com\/learning-center\/<\/loc>/.test(block),
    );
    // Exactly one Learning Center hub entry and one entry per published post.
    expect(hubBlock).toHaveLength(1);
    expect(allBlocks).toHaveLength(expectedPublishedArticleCount + 1);
    expect(articlePostBlocks).toHaveLength(expectedPublishedArticleCount);
    // The redirecting /blog/ index must never appear in the public sitemap.
    expect(body).not.toMatch(/<loc>https:\/\/mineralrightsxchange\.com\/blog\/<\/loc>/);
  });
});
