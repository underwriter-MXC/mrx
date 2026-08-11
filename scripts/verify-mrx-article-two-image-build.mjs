#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, 'config/mrx-article-two-image-retrofit.json');
const renderedRoot = existsSync(join(root, 'dist/client'))
  ? join(root, 'dist/client')
  : join(root, 'dist');
const canonicalOrigin = 'https://mineralrightsxchange.com';

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const failures = [];

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function decodeHtml(value) {
  return String(value ?? '')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function attribute(html, selectorPattern, attributeName) {
  const tag = html.match(selectorPattern)?.[0] ?? '';
  return decodeHtml(tag.match(new RegExp(`\\b${attributeName}="([^"]*)"`, 'i'))?.[1] ?? '');
}

function jsonLdObjects(html) {
  const objects = [];
  const pattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      objects.push(JSON.parse(decodeHtml(match[1])));
    } catch (error) {
      failures.push(`invalid rendered JSON-LD: ${error.message}`);
    }
  }
  return objects;
}

function findArticleSchema(objects) {
  const candidates = objects.flatMap((value) => {
    if (Array.isArray(value?.['@graph'])) return value['@graph'];
    return [value];
  });
  return candidates.find((value) => {
    const type = value?.['@type'];
    return type === 'Article' || (Array.isArray(type) && type.includes('Article'));
  });
}

if (
  !Array.isArray(manifest.rows) ||
  manifest.summary?.article_count !== manifest.rows.length ||
  manifest.summary?.asset_count !== manifest.rows.length * 2
) {
  failures.push('manifest summary must match the complete current public article corpus');
}

for (const row of manifest.rows ?? []) {
  const htmlPath = join(renderedRoot, 'blog', row.slug, 'index.html');
  if (!existsSync(htmlPath)) {
    failures.push(`${row.slug}: rendered HTML missing`);
    continue;
  }
  const html = readFileSync(htmlPath, 'utf8');
  const absoluteHero = `${canonicalOrigin}${row.hero.public_path}`;
  const heroTagPattern = /<figure class="article-hero-image"[^>]*>[\s\S]*?<img\b[^>]*>/i;
  const inlineTagPattern =
    /<figure class="article-inline-image"[^>]*data-article-inline-image[^>]*>[\s\S]*?<img\b[^>]*>/i;
  const ogTagPattern = /<meta property="og:image"[^>]*>/i;
  const twitterTagPattern = /<meta name="twitter:image"[^>]*>/i;

  const heroSrc = attribute(html, heroTagPattern, 'src');
  const heroAlt = attribute(html, heroTagPattern, 'alt');
  const heroWidth = attribute(html, heroTagPattern, 'width');
  const heroHeight = attribute(html, heroTagPattern, 'height');
  const ogImage = attribute(html, ogTagPattern, 'content');
  const twitterImage = attribute(html, twitterTagPattern, 'content');
  const inlineSrc = attribute(html, inlineTagPattern, 'src');
  const inlineAlt = attribute(html, inlineTagPattern, 'alt');
  const inlineWidth = attribute(html, inlineTagPattern, 'width');
  const inlineHeight = attribute(html, inlineTagPattern, 'height');
  const inlineFigure = html.match(/<figure class="article-inline-image"[^>]*>/i)?.[0] ?? '';
  const inlineRenderedText = attribute(inlineFigure, /<figure\b[^>]*>/i, 'data-rendered-text');
  const articleSchema = findArticleSchema(jsonLdObjects(html));
  const schemaImages = Array.isArray(articleSchema?.image)
    ? articleSchema.image
    : articleSchema?.image
      ? [articleSchema.image]
      : [];

  const checks = [
    [heroSrc === row.hero.public_path, 'rendered hero src mismatch'],
    [heroAlt === row.hero.alt, 'rendered hero alt mismatch'],
    [heroWidth === String(row.hero.width), 'rendered hero width mismatch'],
    [heroHeight === String(row.hero.height), 'rendered hero height mismatch'],
    [ogImage === absoluteHero, 'og:image is not the canonical hero'],
    [twitterImage === absoluteHero, 'twitter:image is not the canonical hero'],
    [
      schemaImages.length === 1 && schemaImages[0] === absoluteHero,
      'Article schema image mismatch',
    ],
    [inlineSrc === row.inline.public_path, 'rendered in-body src mismatch'],
    [inlineAlt === row.inline.alt, 'rendered in-body alt mismatch'],
    [inlineWidth === String(row.inline.width), 'rendered in-body width mismatch'],
    [inlineHeight === String(row.inline.height), 'rendered in-body height mismatch'],
    [inlineRenderedText === row.inline.rendered_text, 'rendered in-body text identity mismatch'],
    [heroSrc !== inlineSrc, 'hero and in-body paths are not distinct'],
  ];
  for (const [pass, message] of checks) {
    if (!pass) failures.push(`${row.slug}: ${message}`);
  }

  for (const [kind, asset] of [
    ['hero', row.hero],
    ['inline', row.inline],
  ]) {
    const renderedAssetPath = join(renderedRoot, asset.public_path.slice(1));
    if (!existsSync(renderedAssetPath)) {
      failures.push(`${row.slug}: ${kind} binary missing from rendered output`);
    } else if (sha256(renderedAssetPath) !== asset.sha256) {
      failures.push(`${row.slug}: ${kind} rendered binary SHA-256 mismatch`);
    }
  }
}

if (failures.length > 0) {
  console.error(`MRX rendered two-image verification failed (${failures.length} findings):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `MRX rendered two-image verification passed: ${manifest.rows.length} articles, ${manifest.rows.length * 2} binaries.`,
);
