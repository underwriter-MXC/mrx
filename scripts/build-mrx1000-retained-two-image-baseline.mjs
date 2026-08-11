#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(
  process.argv.find((arg) => arg.startsWith('--tree='))?.slice('--tree='.length) ??
    process.env.MRX_TREE ??
    resolve(import.meta.dirname, '..'),
);
const outputPath = join(
  root,
  'artifacts/mrx1000-release-10/release/retained-production-baseline.json',
);
const retrofit = JSON.parse(
  readFileSync(join(root, 'config/mrx-article-two-image-retrofit.json'), 'utf8'),
);
const previous = JSON.parse(readFileSync(outputPath, 'utf8'));
const retainedSlugs = (previous.retained_routes ?? []).map((row) => row.slug);
const bySlug = new Map((retrofit.rows ?? []).map((row) => [row.slug, row]));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceDeploymentId =
  process.env.MRX_RETAINED_SOURCE_DEPLOYMENT_ID ?? 'dpl_819hrDevPMibhKha8SiVhKFDBYLw';

if (retainedSlugs.length !== 2) {
  throw new Error(`Expected the two historical retained routes; found ${retainedSlugs.length}`);
}

const routes = [];
const files = [];
for (const slug of retainedSlugs) {
  const row = bySlug.get(slug);
  if (!row) throw new Error(`Missing retrofit row: ${slug}`);
  const sourceBytes = readFileSync(join(root, row.file_path));
  const heroBytes = readFileSync(join(root, 'public', row.hero.public_path.slice(1)));
  const inlineBytes = readFileSync(join(root, 'public', row.inline.public_path.slice(1)));
  const pageUrl = `https://mineralrightsxchange.com/blog/${slug}/`;
  const route = {
    slug,
    page_url: pageUrl,
    expected_h1: row.title,
    source_path: row.file_path,
    source_sha256: sha256(sourceBytes),
    hero_path: row.hero.public_path,
    hero_sha256: sha256(heroBytes),
    inline_path: row.inline.public_path,
    inline_sha256: sha256(inlineBytes),
    inline_rendered_text: row.inline.rendered_text,
  };
  routes.push(route);
  files.push(
    {
      path: route.source_path,
      role: 'page_source',
      sha256: route.source_sha256,
      page_url: pageUrl,
      expected_h1: row.title,
      hero_path: route.hero_path,
      hero_sha256: route.hero_sha256,
      inline_path: route.inline_path,
      inline_sha256: route.inline_sha256,
    },
    {
      path: `public${route.hero_path}`,
      role: 'hero_asset',
      sha256: route.hero_sha256,
      page_url: pageUrl,
    },
    {
      path: `public${route.inline_path}`,
      role: 'inline_asset',
      sha256: route.inline_sha256,
      page_url: pageUrl,
    },
  );
}

const payload = {
  artifact_type: 'mrx1000_retained_production_baseline',
  schema_version: '2.0.0',
  generated_at_utc: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  source_authority: {
    decision_id: 'D-2026-0811-17',
    source_deployment_id: sourceDeploymentId,
    current_active_deployment_id: sourceDeploymentId,
    note:
      'The two historical retained routes are rebound to the owner-authorized two-image corpus; all nine legacy public routes are independently covered by the corpus manifest and production verifier.',
  },
  files,
  retained_routes: routes,
};
const text = `${JSON.stringify(payload, null, 2)}\n`;
writeFileSync(outputPath, text);
writeFileSync(`${outputPath}.sha256`, `${sha256(text)}  ${basename(outputPath)}\n`);
console.log(`Built retained two-image baseline: ${routes.length} routes, ${files.length} files.`);
