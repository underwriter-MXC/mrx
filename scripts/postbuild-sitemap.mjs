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
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
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
if (!SITEMAP) {
  console.warn(
    `[postbuild-sitemap] no sitemap-0.xml found in ${sitemapCandidates.join(' or ')}; skipping.`,
  );
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
  '/mineral-rights-offer-comparison',
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
const articleMetadata = await loadArticleMetadata();
const stagedArticleMetadata = await loadStagedArticleMetadata();

// The sitemap XML uses <loc>URL</loc> followed by other optional
// <lastmod>, <changefreq>, <priority>. We rewrite the <priority>
// inside each <url> by matching the loc and the priority tag.
let rewritten = 0;
let canonicalizedRedirects = 0;
const out = text.replace(/<url>([\s\S]*?)<\/url>/g, (block) => {
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
  let replaced = block.replace(/<priority>[^<]+<\/priority>/, `<priority>${newP}</priority>`);
  if (replaced !== block) rewritten++;
  // /blog/ is a 301 redirect to /learning-center/ (see src/pages/blog/index.astro).
  // Replace the loc with the canonical Learning Center hub so sitemap-articles
  // never advertises the redirecting URL. Priority/lastmod/changefreq stay the
  // same as the original /blog/ block.
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/blog') {
    replaced = replaced.replace(
      /<loc>[^<]+<\/loc>/,
      '<loc>https://mineralrightsxchange.com/learning-center/</loc>',
    );
    canonicalizedRedirects++;
  }
  return replaced;
});

await writeFile(SITEMAP, out, 'utf-8');
console.log(`[postbuild-sitemap] Rewrote priority on ${rewritten} <url> entries in ${SITEMAP}`);
if (canonicalizedRedirects > 0) {
  console.log(
    `[postbuild-sitemap] Canonicalized ${canonicalizedRedirects} redirecting /blog/ entry/entries to the Learning Center hub (https://mineralrightsxchange.com/learning-center/)`,
  );
}

const REDIRECT_ONLY_PATHS = new Set(['/1031-exchanger', '/contact-us']);

const blocks = (out.match(/<url>[\s\S]*?<\/url>/g) ?? [])
  .filter((block) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    return !loc || !REDIRECT_ONLY_PATHS.has(new URL(loc).pathname.replace(/\/$/, ''));
  })
  .map(enrichArticleBlock);
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
  // The Learning Center hub is the canonical articles index. /blog/ is a 301
  // redirect to /learning-center/ and is canonicalized upstream to that loc,
  // so anything under either path resolves here in the articles segment.
  if (
    path === '/learning-center/' ||
    (path.startsWith('/blog/') && !path.startsWith('/blog/category/'))
  ) {
    return 'articles';
  }
  return 'core';
}

for (const block of blocks) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const group = groupFor(block);
  const bucket = groups.get(group);
  if (!bucket) continue;
  // Skip duplicate <loc> entries within a segment. The Learning Center hub
  // can arrive twice — once from src/pages/learning-center/index.astro and
  // once from the canonicalized /blog/ redirect — and only one entry per
  // URL should be advertised.
  if (loc && bucket.some((existing) => existing.match(/<loc>([^<]+)<\/loc>/)?.[1] === loc)) {
    continue;
  }
  bucket.push(block);
}
const outputDir = dirname(SITEMAP);
const segmentNames = [];
for (const [group, urls] of groups) {
  if (!urls.length) continue;
  const name = `sitemap-${group}.xml`;
  const imageNamespace =
    group === 'articles' ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNamespace}>\n${urls.join('\n')}\n</urlset>\n`;
  await writeFile(join(outputDir, name), xml, 'utf-8');
  segmentNames.push(name);
}

const articleUrls = (groups.get('articles') ?? []).filter((block) =>
  block.includes('<image:image>'),
);
if (articleUrls.length > 0) {
  const imageName = 'sitemap-images.xml';
  const imageXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${articleUrls.join('\n')}\n</urlset>\n`;
  await writeFile(join(outputDir, imageName), imageXml, 'utf-8');
  segmentNames.push(imageName);
}

// This underscore filename is the sole canonical sitemap index advertised in
// robots.txt. Omit a synthetic index-level lastmod for mixed content segments.
const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${segmentNames.map((name) => `<sitemap><loc>https://mineralrightsxchange.com/${name}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
await writeFile(join(outputDir, 'sitemap_index.xml'), index, 'utf-8');
// Keep the hyphenated sitemap index as a crawl-safe compatibility alias for
// tools that probe Astro's default filename, while robots.txt continues to
// advertise the underscore index as canonical.
await writeFile(join(outputDir, 'sitemap-index.xml'), index, 'utf-8');

// Internal QA artifact only. This file is deliberately excluded from both
// public sitemap indexes and robots.txt, and every referenced page is noindex.
// It gives release reviewers a deterministic inventory without implying that
// staged articles are public or submitted to Google Search Console.
const stagedBlocks = stagedArticleMetadata.map((meta) => {
  const url = `https://mineralrightsxchange.com/staged/mrx1000/pilot-001/${meta.slug}/`;
  const lastmod = meta.updatedAt || meta.reviewedAt || meta.publishedAt;
  return `<url><loc>${escapeXml(url)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`;
});
const stagedXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${stagedBlocks.join('\n')}\n</urlset>\n`;
await writeFile(join(outputDir, 'sitemap-staged.xml'), stagedXml, 'utf-8');
for (const legacyName of ['sitemap.xml']) {
  await unlink(join(outputDir, legacyName)).catch((error) => {
    if (error?.code !== 'ENOENT') throw error;
  });
}
console.log(
  `[postbuild-sitemap] Wrote canonical sitemap_index.xml with ${segmentNames.length} public-content segments`,
);
console.log(
  `[postbuild-sitemap] Wrote unsubmitted sitemap-staged.xml with ${stagedBlocks.length} noindex QA URLs`,
);

function enrichArticleBlock(block) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!loc) return block;
  const match = new URL(loc).pathname.match(/^\/blog\/([^/]+)\/$/);
  if (!match) return block;
  const meta = articleMetadata.get(match[1]);
  if (!meta) return block;

  const lastmod = meta.updatedAt || meta.reviewedAt || meta.publishedAt;
  let enriched = block;
  if (lastmod) {
    enriched = /<lastmod>[^<]+<\/lastmod>/.test(enriched)
      ? enriched.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${escapeXml(lastmod)}</lastmod>`)
      : enriched.replace('</loc>', `</loc><lastmod>${escapeXml(lastmod)}</lastmod>`);
  }
  if (meta.heroSrc) {
    const imageUrl = meta.heroSrc.startsWith('http')
      ? meta.heroSrc
      : `https://mineralrightsxchange.com${meta.heroSrc}`;
    enriched = enriched.replace(
      '</url>',
      `<image:image><image:loc>${escapeXml(imageUrl)}</image:loc><image:title>${escapeXml(meta.heroAlt || meta.title)}</image:title></image:image></url>`,
    );
  }
  return enriched;
}

async function loadArticleMetadata() {
  const postsDir = join(ROOT, 'src', 'content', 'posts');
  const files = (await readdir(postsDir)).filter((file) => file.endsWith('.mdx'));
  const map = new Map();
  for (const file of files) {
    const source = await readFile(join(postsDir, file), 'utf-8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    if (scalar(frontmatter, 'publication_status') !== 'published') continue;
    // Fail-closed: a published + noindex row must never enrich the public
    // sitemap. This mirrors isPublishedPost's noindex gate so a leaked row
    // cannot reach crawlers via the sitemap even if a route slipped past.
    if (scalar(frontmatter, 'noindex') === 'true') continue;
    const slug = file.replace(/\.mdx$/, '');
    map.set(slug, {
      title: scalar(frontmatter, 'title') || slug,
      heroSrc: nestedScalar(frontmatter, 'hero_image', 'src'),
      heroAlt: nestedScalar(frontmatter, 'hero_image', 'alt'),
      publishedAt: scalar(frontmatter, 'published_at'),
      updatedAt: scalar(frontmatter, 'updated_at'),
      reviewedAt: scalar(frontmatter, 'reviewed_at'),
    });
  }
  return map;
}

async function loadStagedArticleMetadata() {
  const postsDir = join(ROOT, 'src', 'content', 'posts');
  const files = (await readdir(postsDir)).filter((file) => file.endsWith('.mdx'));
  const rows = [];
  for (const file of files) {
    const source = await readFile(join(postsDir, file), 'utf-8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (scalar(frontmatter, 'content_program') !== 'mrx1000') continue;
    if (scalar(frontmatter, 'content_batch') !== 'pilot-001') continue;
    if (scalar(frontmatter, 'noindex') !== 'true') continue;
    if (scalar(frontmatter, 'draft') !== 'true') continue;
    if (scalar(frontmatter, 'publication_status') !== 'draft') continue;
    rows.push({
      slug: file.replace(/\.mdx$/, ''),
      publishedAt: scalar(frontmatter, 'published_at'),
      updatedAt: scalar(frontmatter, 'updated_at'),
      reviewedAt: scalar(frontmatter, 'reviewed_at'),
    });
  }
  return rows.sort((a, b) => a.slug.localeCompare(b.slug));
}

function scalar(frontmatter, key) {
  return cleanScalar(frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function nestedScalar(frontmatter, parent, key) {
  const block =
    frontmatter.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  return cleanScalar(block.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function cleanScalar(value) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
