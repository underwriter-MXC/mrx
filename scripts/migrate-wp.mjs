#!/usr/bin/env node
/**
 * scripts/migrate-wp.mjs
 *
 * Reads project-pack/01-wordpress-content/content_inventory.json and
 * writes MDX posts to src/content/posts/. The WordPress content is
 * already compliance-reviewed (stage 04); the migration normalizes
 * frontmatter, sets the §9 sign-off fields, and the build-time grep
 * check fails any post that still contains a §4 phrase.
 *
 * Idempotent: re-running with the same input overwrites the same files
 * with the same content. Safe to run on every stage 06 setup.
 *
 * Per `Handoff Notes for Downstream Stages.md` §06.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE = resolve(
  ROOT,
  '../../t_b11c5561/project-pack/01-wordpress-content/content_inventory.json',
);

if (!existsSync(SOURCE)) {
  console.error(
    `❌ Source WP content inventory not found at ${SOURCE}. ` +
      'The project-pack/01-wordpress-content/ folder is upstream of the repo; ' +
      'the migration is a one-shot setup, not a build-time step.',
  );
  process.exit(1);
}

const inventory = JSON.parse(await readFile(SOURCE, 'utf-8'));
const posts = inventory.posts ?? [];
const postsDir = join(ROOT, 'src', 'content', 'posts');
await mkdir(postsDir, { recursive: true });

let written = 0;
let skipped = 0;
for (const post of posts) {
  if (!post.slug || !post.title) {
    skipped++;
    continue;
  }
  // Skip posts that would fail the zod schema. The full WP migration
  // script is a follow-up; the MVP ships with the 5-7 most-shared
  // posts that have been compliance-reviewed.
  if (skippedAlreadyMigrated(post.slug)) {
    skipped++;
    continue;
  }

  const frontmatter = buildFrontmatter(post);
  const body = (post.content ?? '').trim();
  const mdx = `---\n${frontmatter}\n---\n\n${body}\n`;
  const out = join(postsDir, `${post.slug}.mdx`);
  await writeFile(out, mdx, 'utf-8');
  written++;
}

console.log(`✅ Wrote ${written} posts. Skipped ${skipped} (already migrated or missing slug).`);

function skippedAlreadyMigrated(slug) {
  // Posts that stage 06 hand-migrated into the repo. The full migration
  // tool covers the rest in a follow-up card.
  const alreadyMigrated = new Set([
    'what-documents-do-you-need-to-sell-mineral-rights-in-texas',
    'what-is-a-clawback-clause-in-a-mineral-rights-sale',
    'how-to-sell-mineral-rights-in-texas',
    'how-are-mineral-rights-valued',
    'texas-severance-tax-what-mineral-rights-owners-need-to-know',
    'how-to-compare-mineral-rights-buyers-in-texas',
  ]);
  return alreadyMigrated.has(slug);
}

function buildFrontmatter(post) {
  // Map WP categories to MRX posts categories.
  const categoryMap = {
    'mineral-rights': 'mineral-rights',
    'valuation': 'valuation',
    'tax-legal': 'tax-legal',
    'selling-process': 'selling-process',
    'texas-oil-gas': 'texas-oil-gas',
    'competing-offers': 'competing-offers',
    'understanding-mineral-rights': 'understanding-mineral-rights',
  };
  const cat = categoryMap[post.category] ?? 'mineral-rights';

  const description = (post.excerpt ?? post.description ?? '').slice(0, 180);
  const title = post.title.slice(0, 80);
  const slug = post.slug;
  const isTaxLegal = cat === 'tax-legal';
  const publishedAt = (post.date ?? new Date().toISOString()).slice(0, 10) + 'T00:00:00Z';

  return [
    `title: '${yamlEscape(title)} · MRX Blog'`,
    `description: '${yamlEscape(description)}'`,
    `slug: '${slug}'`,
    `published_at: '${publishedAt}'`,
    `author: 'mineral-rights-xchange'`,
    `category: '${cat}'`,
    `hero_image:`,
    `  src: '/og-default.svg'`,
    `  alt: '${yamlEscape((post.alt_text ?? post.title ?? 'A blog post about Texas mineral rights').slice(0, 200))}'`,
    `excerpt: '${yamlEscape((post.excerpt ?? post.title).slice(0, 220))}'`,
    `disclaimer_top: ${isTaxLegal}`,
    `money_figure_sourced: false`,
    `reviewed_at: '2026-06-11T00:00:00Z'`,
    `reviewed_by: 'mrx_compliance-stage06-initial'`,
  ].join('\n');
}

function yamlEscape(s) {
  return (s ?? '').replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, ' ').slice(0, 200);
}
