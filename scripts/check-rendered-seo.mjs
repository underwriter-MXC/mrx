#!/usr/bin/env node
/**
 * Verify the crawl-facing contract emitted by Astro for every rendered HTML
 * page. This is intentionally a small, dependency-free release check: it
 * catches missing canonical/meta/JSON-LD tags and images without alt text in
 * the artifact that will actually be deployed.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const candidates = [
  join(ROOT, 'dist', 'client'),
  join(ROOT, 'dist'),
  join(ROOT, '.vercel', 'output', 'static'),
];
const SITE = 'https://mineralrightsxchange.com';
const buildRoot = candidates.find((candidate) => existsSync(join(candidate, 'index.html')));

if (!buildRoot) {
  console.error(`[check-rendered-seo] no rendered build found in ${candidates.join(', ')}`);
  process.exit(1);
}

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extname(entry.name).toLowerCase() === '.html') htmlFiles.push(path);
  }
}
await walk(buildRoot);

const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeFor(file);
  // Icon previews are developer assets, not crawl-facing pages. They are
  // copied into the static output for internal visual QA and intentionally do
  // not carry the site's SEO head.
  if (route.startsWith('/assets/')) continue;
  const canonicalRoute = route === '/' ? '/' : `${route.replace(/\/$/, '')}/`;
  const canonical = html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const title = html.match(/<title>[^<]+<\/title>/i);
  const description = html.match(/<meta\s+name=["']description["'][^>]*content=["'][^"']+["']/i);
  const robots = html.match(/<meta\s+name=["']robots["'][^>]*content=["'][^"']+["']/i);
  const jsonLd = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i,
  );

  if (canonical !== `${SITE}${canonicalRoute}`) {
    failures.push(`${route}: canonical ${canonical ?? '(missing)'} != ${SITE}${canonicalRoute}`);
  }
  if (!title) failures.push(`${route}: missing <title>`);
  if (!description) failures.push(`${route}: missing meta description`);
  if (!robots) failures.push(`${route}: missing robots meta`);
  if (!jsonLd) failures.push(`${route}: missing JSON-LD graph`);

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(image[0])) {
      failures.push(`${route}: image is missing alt attribute`);
    }
  }
}

// The sitemap is the public discovery contract. Every URL it advertises must
// resolve to a rendered page with an indexable robots directive and the same
// canonical URL. Image sitemap entries are assets, so they are intentionally
// excluded from this page-level assertion.
const sitemapIndexPath = join(buildRoot, 'sitemap_index.xml');
if (existsSync(sitemapIndexPath)) {
  const sitemapIndex = await readFile(sitemapIndexPath, 'utf8');
  for (const match of sitemapIndex.matchAll(/<loc>[^<]*\/(sitemap-[^<]+\.xml)<\/loc>/g)) {
    const sitemapName = match[1];
    if (sitemapName === 'sitemap-images.xml') continue;
    const sitemapPath = join(buildRoot, sitemapName);
    if (!existsSync(sitemapPath)) {
      failures.push(`sitemap index references missing ${sitemapName}`);
      continue;
    }
    const sitemap = await readFile(sitemapPath, 'utf8');
    for (const urlMatch of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      let parsed;
      try {
        parsed = new URL(urlMatch[1]);
      } catch {
        failures.push(`${sitemapName}: invalid URL ${urlMatch[1]}`);
        continue;
      }
      if (parsed.origin !== SITE) {
        failures.push(`${sitemapName}: non-canonical origin ${parsed.origin}`);
        continue;
      }
      const route = parsed.pathname === '/' ? '/' : `${parsed.pathname.replace(/\/$/, '')}/`;
      const pageFile =
        route === '/'
          ? join(buildRoot, 'index.html')
          : join(buildRoot, route.slice(1), 'index.html');
      if (!existsSync(pageFile)) {
        failures.push(`${sitemapName}: ${route} has no rendered HTML page`);
        continue;
      }
      const page = await readFile(pageFile, 'utf8');
      const robotsContent = page.match(
        /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i,
      )?.[1];
      if (!robotsContent || /\bnoindex\b/i.test(robotsContent)) {
        failures.push(`${sitemapName}: ${route} is noindex or missing robots metadata`);
      }
      const canonical = page.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
      if (canonical !== `${SITE}${route}`) {
        failures.push(`${sitemapName}: ${route} canonical is ${canonical ?? '(missing)'}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`[check-rendered-seo] ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[check-rendered-seo] PASS: ${htmlFiles.length} rendered HTML pages have canonical/meta/JSON-LD and accessible images`,
);

function routeFor(file) {
  let path = relative(buildRoot, file).replaceAll('\\', '/');
  if (path === 'index.html') return '/';
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  return path || '/';
}
