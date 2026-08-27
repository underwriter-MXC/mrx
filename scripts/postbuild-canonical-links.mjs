#!/usr/bin/env node
/**
 * Rewrite rendered internal anchors to their final canonical routes.
 *
 * Article source remains byte-for-byte unchanged so reviewed content hashes
 * stay valid. The deployed HTML, however, no longer asks crawlers or owners to
 * traverse a known redirect or a slashless alias.
 */
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://mineralrightsxchange.com';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// These reviewed articles point to planned/draft siblings for which no
// scope-equivalent public canonical exists. mrx_ceo approved leaving the
// destinations nonpublic and unwrapping only these rendered anchors to text.
export const suppressedInternalRoutes = new Set([
  '/blog/1031-exchange-fees-for-mineral-rights-sales/',
  '/blog/understanding-1031-exchange-benefits-for-mineral-rights-owners/',
  '/blog/how-a-1031-exchange-benefits-mineral-rights-owners/',
  '/blog/how-to-navigate-a-1031-exchange-for-mineral-rights/',
  '/blog/how-to-evaluate-mineral-production-in-texas/',
]);

export async function loadRedirectRules(root = ROOT) {
  const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
  return (config.redirects ?? []).filter(
    (rule) =>
      rule?.permanent === true &&
      typeof rule.source === 'string' &&
      typeof rule.destination === 'string' &&
      rule.destination.startsWith('/'),
  );
}

export function canonicalizeInternalHref(rawHref, redirectRules = []) {
  if (typeof rawHref !== 'string' || rawHref.length === 0) return rawHref;
  if (/^(?:#|mailto:|tel:|sms:|javascript:|data:)/i.test(rawHref)) return rawHref;

  const absolute = /^https?:\/\//i.test(rawHref);
  let parsed;
  try {
    parsed = new URL(rawHref, `${SITE}/`);
  } catch {
    return rawHref;
  }
  if (parsed.origin !== SITE) return rawHref;

  let pathname = parsed.pathname;
  for (let depth = 0; depth < 5; depth += 1) {
    const redirected = applyFirstRedirect(pathname, redirectRules);
    if (!redirected || redirected === pathname) break;
    pathname = redirected;
  }
  pathname = canonicalPathname(pathname);

  const suffix = `${parsed.search}${parsed.hash}`;
  return absolute ? `${SITE}${pathname}${suffix}` : `${pathname}${suffix}`;
}

export function shouldSuppressInternalHref(rawHref) {
  if (typeof rawHref !== 'string' || rawHref.length === 0) return false;
  let parsed;
  try {
    parsed = new URL(rawHref, `${SITE}/`);
  } catch {
    return false;
  }
  return parsed.origin === SITE && suppressedInternalRoutes.has(canonicalPathname(parsed.pathname));
}

export function rewriteInternalAnchorMarkup(source, redirectRules = []) {
  let changedLinks = 0;
  let suppressedLinks = 0;
  const withoutHeldDestinations = source.replace(
    /<a\b[^>]*?\bhref=(["'])([^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi,
    (tag, _quote, href, contents) => {
      if (!shouldSuppressInternalHref(href)) return tag;
      suppressedLinks += 1;
      return contents;
    },
  );
  const html = withoutHeldDestinations.replace(
    /(<a\b[^>]*?\bhref=)(["'])([^"']+)\2/gi,
    (tag, prefix, quote, href) => {
      const canonical = canonicalizeInternalHref(href, redirectRules);
      if (canonical === href) return tag;
      changedLinks += 1;
      return `${prefix}${quote}${canonical}${quote}`;
    },
  );
  return { html, changedLinks, suppressedLinks };
}

export async function rewriteRenderedInternalLinks(root = ROOT) {
  const candidates = [
    join(root, 'dist', 'client'),
    join(root, 'dist'),
    join(root, '.vercel', 'output', 'static'),
  ];
  const buildRoot = candidates.find((candidate) => existsSync(join(candidate, 'index.html')));
  if (!buildRoot) {
    console.warn(
      `[postbuild-canonical-links] no rendered build found in ${candidates.join(', ')}; skipping.`,
    );
    return { changedFiles: 0, changedLinks: 0, buildRoot: null };
  }

  const redirectRules = await loadRedirectRules(root);
  const htmlFiles = [];
  await walkHtml(buildRoot, htmlFiles);

  let changedFiles = 0;
  let changedLinks = 0;
  let suppressedLinks = 0;
  for (const file of htmlFiles) {
    const source = await readFile(file, 'utf8');
    const rewritten = rewriteInternalAnchorMarkup(source, redirectRules);
    changedLinks += rewritten.changedLinks;
    suppressedLinks += rewritten.suppressedLinks;
    if (rewritten.html !== source) {
      await writeFile(file, rewritten.html, 'utf8');
      changedFiles += 1;
    }
  }

  console.log(
    `[postbuild-canonical-links] Rewrote ${changedLinks} internal anchor(s), suppressed ${suppressedLinks} held destination anchor(s), and changed ${changedFiles} rendered HTML file(s) in ${buildRoot}`,
  );
  return { changedFiles, changedLinks, suppressedLinks, buildRoot };
}

function canonicalPathname(pathname) {
  if (pathname === '/') return '/';
  if (pathname === '/api' || pathname.startsWith('/api/')) return pathname;
  const lastSegment = pathname.split('/').filter(Boolean).at(-1) ?? '';
  if (extname(lastSegment)) return pathname;
  return `${pathname.replace(/\/+$/, '')}/`;
}

function applyFirstRedirect(pathname, redirectRules) {
  for (const rule of redirectRules) {
    const params = [];
    const pattern = rule.source
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          params.push(segment.slice(1));
          return '([^/]+)';
        }
        return escapeRegex(segment);
      })
      .join('/');
    const match = pathname.match(new RegExp(`^${pattern}$`));
    if (!match) continue;
    let destination = rule.destination;
    params.forEach((name, index) => {
      destination = destination.replaceAll(`:${name}`, match[index + 1]);
    });
    return destination;
  }
  return null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function walkHtml(directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const candidate = join(directory, entry.name);
    if (entry.isDirectory()) await walkHtml(candidate, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(candidate);
  }
}
