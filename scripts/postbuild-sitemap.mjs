#!/usr/bin/env node
/**
 * scripts/postbuild-sitemap.mjs
 *
 * Postbuild hook: rewrite per-page priorities in dist/sitemap-0.xml.
 * The @astrojs/sitemap integration only supports a flat `priority`
 * number, but SEO best practice (and our internal SEO plan §1.4)
 * wants per-path priorities:
 *
 *   - homepage:                 1.0
 *   - core marketing pages:     0.9
 *   - blog index + posts:       0.8
 *   - blog category:            0.7
 *   - legal:                    0.4
 *   - thank-you / utility:      0.3
 *
 * astro.config.mjs calls this from the `astro:build:done` hook.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const sitemapCandidates = [
  join(ROOT, 'dist', 'sitemap-0.xml'),
  join(ROOT, 'dist', 'client', 'sitemap-0.xml'),
];
const SITEMAP = sitemapCandidates.find((candidate) => existsSync(candidate));
const sitemapIndexCandidates = [
  join(ROOT, 'dist', 'sitemap-index.xml'),
  join(ROOT, 'dist', 'client', 'sitemap-index.xml'),
];
const SITEMAP_INDEX = sitemapIndexCandidates.find((candidate) => existsSync(candidate));

if (!SITEMAP) {
  console.warn(`[postbuild-sitemap] no sitemap-0.xml found in ${sitemapCandidates.join(' or ')}; skipping.`);
  process.exit(0);
}

const CORE_PAGES = new Set([
  '/about',
  '/methodology',
  '/how-it-works',
  '/sell-mineral-rights',
  '/faq',
  '/free-guide',
  '/book',
  '/mineral-rights-value',
  '/offer-review',
  '/inherited-mineral-rights',
  '/learning-center',
  '/team',
]);

const THANK_YOU_SUFFIX = '/thank-you';

function priorityFor(pathname) {
  // pathname is the URL path part, with or without a trailing slash.
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return '1.0';
  if (CORE_PAGES.has(path)) return '0.9';
  if (path === '/blog') return '0.8';
  if (path.startsWith('/blog/category/')) return '0.7';
  if (path.startsWith('/blog/')) return '0.8';
  if (path === '/privacy-policy') return '0.4';
  if (path.endsWith(THANK_YOU_SUFFIX)) return '0.3';
  return '0.5';
}

const text = await readFile(SITEMAP, 'utf-8');

// The sitemap XML uses <loc>URL</loc> followed by other optional
// <lastmod>, <changefreq>, <priority>. We rewrite the <priority>
// inside each <url> by matching the loc and the priority tag.
let rewritten = 0;
const out = text.replace(
  /<url>([\s\S]*?)<\/url>/g,
  (block) => {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) return block;
    let pathname = '/';
    try {
      const u = new URL(locMatch[1]);
      pathname = u.pathname;
    } catch {
      return block;
    }
    const newP = priorityFor(pathname);
    const replaced = block.replace(
      /<priority>[^<]+<\/priority>/,
      `<priority>${newP}</priority>`,
    );
    if (replaced !== block) rewritten++;
    return replaced;
  },
);

await writeFile(SITEMAP, out, 'utf-8');
console.log(`[postbuild-sitemap] Rewrote priority on ${rewritten} <url> entries in ${SITEMAP}`);

const blocks = out.match(/<url>[\s\S]*?<\/url>/g) ?? [];
const groups = new Map([
  ['core', []],
  ['articles', []],
  ['authors', []],
  ['team', []],
  ['states', []],
]);

function groupFor(block) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!loc) return 'core';
  const path = new URL(loc).pathname;
  if (path.startsWith('/authors/')) return 'authors';
  if (path.startsWith('/team/')) return 'team';
  if (path.startsWith('/mineral-rights/')) return 'states';
  if (path.startsWith('/blog/') && !path.startsWith('/blog/category/')) return 'articles';
  return 'core';
}

for (const block of blocks) groups.get(groupFor(block)).push(block);
const outputDir = dirname(SITEMAP);
const segmentNames = [];
for (const [group, urls] of groups) {
  if (!urls.length) continue;
  const name = `sitemap-${group}.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  await writeFile(join(outputDir, name), xml, 'utf-8');
  segmentNames.push(name);
}

const lastmod = new Date().toISOString();
const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${segmentNames.map((name) => `<sitemap><loc>https://mineralrightsxchange.com/${name}</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
const indexPath = SITEMAP_INDEX ?? join(outputDir, 'sitemap-index.xml');
await writeFile(indexPath, index, 'utf-8');
await writeFile(join(outputDir, 'sitemap.xml'), index, 'utf-8');
await writeFile(join(outputDir, 'sitemap_index.xml'), index, 'utf-8');
console.log(`[postbuild-sitemap] Wrote segmented sitemap index with ${segmentNames.length} public-content segments`);
