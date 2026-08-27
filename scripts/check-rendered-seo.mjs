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
import { canonicalizeInternalHref, loadRedirectRules } from './postbuild-canonical-links.mjs';

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

const redirectRules = await loadRedirectRules(ROOT);
const protectedPrefixes = [
  '/api/',
  '/account/',
  '/owner-intake/',
  '/knowledge/',
  '/blog/drafts/',
  '/book/thank-you/',
  '/free-guide/thank-you/',
  '/staff/',
];

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
const outboundByRoute = new Map();
const renderedRoutes = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeFor(file);
  // Icon previews are developer assets, not crawl-facing pages. They are
  // copied into the static output for internal visual QA and intentionally do
  // not carry the site's SEO head.
  if (route.startsWith('/assets/')) continue;
  const canonicalRoute = route === '/' ? '/' : `${route.replace(/\/$/, '')}/`;
  renderedRoutes.add(canonicalRoute);
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

  const outbound = new Set();
  for (const anchor of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const tag = anchor[0];
    const href = anchor[1];
    const canonicalHref = canonicalizeInternalHref(href, redirectRules);
    if (canonicalHref !== href) {
      failures.push(`${route}: internal anchor ${href} should be ${canonicalHref}`);
    }
    if (href.startsWith('#')) continue;

    let target;
    try {
      target = new URL(canonicalHref, `${SITE}${route}`);
    } catch {
      continue;
    }
    if (target.origin !== SITE) continue;

    const rel = tag.match(/\brel=["']([^"']*)["']/i)?.[1] ?? '';
    const isNofollow = /(?:^|\s)nofollow(?:\s|$)/i.test(rel);
    if (protectedPrefixes.some((prefix) => target.pathname.startsWith(prefix)) && !isNofollow) {
      failures.push(`${route}: protected internal anchor ${href} must be marked nofollow`);
    }
    if (!isNofollow) outbound.add(canonicalRouteFor(target.pathname));
  }
  outboundByRoute.set(canonicalRoute, outbound);
}

// Slash normalization alone cannot make a planned or draft destination live.
// Fail closed when public rendered HTML points at a route the build does not
// own so sibling links cannot silently ship as production 404s.
for (const [source, targets] of outboundByRoute) {
  for (const target of targets) {
    const lastSegment = target.split('/').filter(Boolean).at(-1) ?? '';
    if (extname(lastSegment) || target.startsWith('/api/')) continue;
    if (!renderedRoutes.has(target)) {
      failures.push(`${source}: internal anchor target ${target} has no rendered page`);
    }
  }
}

// The sitemap is the public discovery contract. Every URL it advertises must
// resolve to a rendered page with an indexable robots directive and the same
// canonical URL. Image sitemap entries are assets, so they are intentionally
// excluded from this page-level assertion.
const sitemapIndexPath = join(buildRoot, 'sitemap_index.xml');
const sitemapRoutes = new Set();
const sitemapMetadata = [];
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
      sitemapRoutes.add(route);
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
      const sitemapTitle = normalizedText(page.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
      const sitemapDescription = normalizedText(
        page.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? '',
      );
      const sitemapHeadings = [...page.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) =>
        normalizedText(match[1]),
      );
      if (sitemapHeadings.length !== 1) {
        failures.push(`${sitemapName}: ${route} has ${sitemapHeadings.length} H1 elements`);
      }
      sitemapMetadata.push({
        route,
        title: sitemapTitle,
        description: sitemapDescription,
        h1: sitemapHeadings[0] ?? '',
      });
    }
  }
}

for (const field of ['title', 'description', 'h1']) {
  const routesByValue = new Map();
  for (const row of sitemapMetadata) {
    if (!row[field]) continue;
    const routes = routesByValue.get(row[field]) ?? [];
    routes.push(row.route);
    routesByValue.set(row[field], routes);
  }
  for (const routes of routesByValue.values()) {
    if (routes.length > 1) {
      failures.push(`duplicate public ${field}: ${routes.join(', ')}`);
    }
  }
}

const inboundCounts = new Map([...sitemapRoutes].map((route) => [route, 0]));
for (const [source, targets] of outboundByRoute) {
  for (const target of targets) {
    if (target !== source && inboundCounts.has(target)) {
      inboundCounts.set(target, inboundCounts.get(target) + 1);
    }
  }
}
const orphanRoutes = [...inboundCounts]
  .filter(([route, count]) => route !== '/' && count === 0)
  .map(([route]) => route)
  .sort();
for (const route of orphanRoutes)
  failures.push(`${route}: public sitemap orphan with zero inbound links`);

if (failures.length) {
  console.error(`[check-rendered-seo] ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[check-rendered-seo] PASS: ${htmlFiles.length} rendered HTML pages have canonical/meta/JSON-LD, accessible images, unique public title/description/H1 metadata, canonical internal links, and ${orphanRoutes.length} sitemap orphan(s)`,
);

function routeFor(file) {
  let path = relative(buildRoot, file).replaceAll('\\', '/');
  if (path === 'index.html') return '/';
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  return path || '/';
}

function canonicalRouteFor(pathname) {
  if (pathname === '/') return '/';
  if (pathname === '/api' || pathname.startsWith('/api/')) return pathname;
  if (extname(pathname.split('/').filter(Boolean).at(-1) ?? '')) return pathname;
  return `${pathname.replace(/\/+$/, '')}/`;
}

function normalizedText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim();
}
