#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MANIFEST = join(ROOT, 'config', 'mrx-1000-pilot-batch-001.json');
const DIST_CANDIDATES = [join(ROOT, 'dist', 'client'), join(ROOT, 'dist')];
const DIST =
  DIST_CANDIDATES.find(
    (candidate) =>
      existsSync(join(candidate, 'sitemap-staged.xml')) ||
      existsSync(join(candidate, 'sitemap-index.xml')),
  ) ?? DIST_CANDIDATES[0];
const REPORT = join(ROOT, 'reports', 'mrx1000-pilot-001', 'verification.json');
const REQUIRED_ROBOTS = 'noindex, follow';

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const results = [];
const stagedSitemapPath = join(DIST, 'sitemap-staged.xml');
const publicIndexPath = join(DIST, 'sitemap-index.xml');
const stagedSitemap = existsSync(stagedSitemapPath)
  ? await readFile(stagedSitemapPath, 'utf8')
  : '';
const publicIndex = existsSync(publicIndexPath) ? await readFile(publicIndexPath, 'utf8') : '';
const publicSegmentNames = [
  ...publicIndex.matchAll(/<loc>https:\/\/mineralrightsxchange\.com\/([^<]+)<\/loc>/g),
]
  .map((match) => match[1])
  .filter((name) => name !== 'sitemap-staged.xml');
const publicSitemaps = (
  await Promise.all(
    publicSegmentNames.map(async (name) => {
      const path = join(DIST, name);
      return existsSync(path) ? readFile(path, 'utf8') : '';
    }),
  )
).join('\n');

for (const article of manifest.articles) {
  const path = `/staged/mrx1000/pilot-001/${article.slug}/`;
  const htmlPath = join(DIST, 'staged', 'mrx1000', 'pilot-001', article.slug, 'index.html');
  const html = existsSync(htmlPath) ? await readFile(htmlPath, 'utf8') : '';
  const heroSrc = extract(html, /<meta property="og:image" content="([^"]+)"/i);
  const socialSrc = extract(html, /<meta name="twitter:image" content="([^"]+)"/i);
  const ogType = extract(html, /<meta property="og:type" content="([^"]+)"/i);
  const ogTitle = decodeHtml(extract(html, /<meta property="og:title" content="([^"]+)"/i));
  const ogDescription = decodeHtml(
    extract(html, /<meta property="og:description" content="([^"]+)"/i),
  );
  const twitterCard = extract(html, /<meta name="twitter:card" content="([^"]+)"/i);
  const twitterTitle = decodeHtml(extract(html, /<meta name="twitter:title" content="([^"]+)"/i));
  const twitterDescription = decodeHtml(
    extract(html, /<meta name="twitter:description" content="([^"]+)"/i),
  );
  const robots = extract(html, /<meta name="robots" content="([^"]+)"/i);
  const canonical = extract(html, /<link rel="canonical" href="([^"]+)"/i);
  const articleNode = extractArticleJsonLd(html);
  const expectedCanonical = `https://mineralrightsxchange.com/staged/mrx1000/pilot-001/${article.slug}/`;
  const ctaBook = /href="\/book\/"/.test(html);
  const heroPath = publicPath(heroSrc);
  const socialPath = publicPath(socialSrc);
  const checks = {
    html_emitted: html.length > 0,
    robots_noindex_follow: normalizeRobots(robots) === normalizeRobots(REQUIRED_ROBOTS),
    canonical_stage_path: canonical === expectedCanonical,
    og_type_article: ogType === 'article',
    og_image_absolute: heroSrc.startsWith('https://mineralrightsxchange.com/'),
    og_title_exact: ogTitle === article.title,
    og_description_exact: ogDescription === frontmatterDescription(article.slug),
    twitter_card_large_image: twitterCard === 'summary_large_image',
    twitter_title_exact: twitterTitle === article.title,
    twitter_description_exact: twitterDescription === frontmatterDescription(article.slug),
    twitter_image_matches_og: socialSrc === heroSrc,
    article_jsonld_stage_id: articleNode?.['@id'] === `${expectedCanonical}#article`,
    article_jsonld_stage_page:
      articleNode?.mainEntityOfPage?.['@id'] === `${expectedCanonical}#page`,
    article_jsonld_has_no_blog_staged_path: !JSON.stringify(articleNode ?? {}).includes(
      '/blog/staged/',
    ),
    book_cta_trailing_slash: ctaBook,
    staged_sitemap_contains_url: stagedSitemap.includes(path),
    public_sitemap_index_excludes_stage_file: !publicIndex.includes('sitemap-staged.xml'),
    public_sitemaps_exclude_url: !publicSitemaps.includes(path),
    hero_resolves_locally: heroPath !== '' && existsSync(join(ROOT, 'public', heroPath)),
    social_resolves_locally: socialPath !== '' && existsSync(join(ROOT, 'public', socialPath)),
  };
  results.push({
    slug: article.slug,
    path,
    robots,
    canonical,
    hero_src: heroSrc,
    social_src: socialSrc,
    article_jsonld_id: articleNode?.['@id'] ?? null,
    checks,
  });
}

const report = {
  batch_id: manifest.batch_id,
  generated_at: new Date().toISOString(),
  build_sha: manifest.build_sha,
  expected_count: manifest.target_count,
  verified_count: results.length,
  sitemap_staged_path: stagedSitemapPath,
  sitemap_submitted_to_gsc: false,
  gsc_write_performed: false,
  all_passed:
    results.length === manifest.target_count &&
    results.every((row) => Object.values(row.checks).every(Boolean)),
  results,
};

await mkdir(dirname(REPORT), { recursive: true });
await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      batch_id: report.batch_id,
      verified_count: report.verified_count,
      all_passed: report.all_passed,
      sitemap_staged_path: report.sitemap_staged_path,
      report_path: REPORT,
      sitemap_submitted_to_gsc: false,
    },
    null,
    2,
  ),
);

if (!report.all_passed) process.exit(1);

function extract(text, pattern) {
  return text.match(pattern)?.[1] ?? '';
}

function normalizeRobots(value) {
  return value.toLowerCase().replace(/\s+/g, '').split(',').sort().join(',');
}

function publicPath(url) {
  if (url.startsWith('https://mineralrightsxchange.com/')) {
    return url.slice('https://mineralrightsxchange.com/'.length);
  }
  if (url.startsWith('/')) return url.slice(1);
  return '';
}

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractArticleJsonLd(html) {
  const scripts = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const match of scripts) {
    try {
      const data = JSON.parse(match[1]);
      const nodes = data?.['@graph'] ?? (Array.isArray(data) ? data : [data]);
      const articleNode = nodes.find((node) => node?.['@type'] === 'Article');
      if (articleNode) return articleNode;
    } catch {
      // A malformed JSON-LD script is a failed Article lookup below.
    }
  }
  return null;
}

function frontmatterDescription(slug) {
  const sourcePath = join(ROOT, 'src', 'content', 'posts', `${slug}.mdx`);
  if (!existsSync(sourcePath)) return '';
  const source = readFileSync(sourcePath, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  return cleanScalar(frontmatter.match(/^description:\s*(.+)$/m)?.[1] ?? '');
}

function cleanScalar(value) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}
