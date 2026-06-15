#!/usr/bin/env node
/**
 * Audit the staged MRX article libraries before loading them into the
 * Vercel-backed website preview. This is intentionally read-only: it checks
 * the source factories/RAG packs and reports the schema gaps that an import
 * step must normalize before files are written into src/content/posts/.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const SOURCES = [
  '/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_factory_1000',
  '/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_factory_9000',
  '/Users/darylhill/.hermes/kanban/boards/mrx-growth/mrx_team_rag_databases_full',
];

const POST_CATEGORIES = new Set([
  'mineral-rights',
  'valuation',
  'tax-legal',
  'selling-process',
  'texas-oil-gas',
  'competing-offers',
  'understanding-mineral-rights',
]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function getFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? '';
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['\"]?([^'\"\\n]+)`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function categoryFor(item) {
  const cluster = String(item.cluster_id || item.cluster || '').toLowerCase();
  const keyword = String(item.primary_keyword || item.title || '').toLowerCase();
  if (cluster.includes('valuation') || keyword.includes('value') || keyword.includes('valuation'))
    return 'valuation';
  if (cluster.includes('tax') || keyword.includes('1031') || keyword.includes('tax'))
    return 'tax-legal';
  if (cluster.includes('offer') || keyword.includes('offer') || keyword.includes('buyer'))
    return 'competing-offers';
  if (cluster.includes('royalt') || keyword.includes('royalt')) return 'texas-oil-gas';
  if (cluster.includes('sell') || keyword.includes('sell')) return 'selling-process';
  if (cluster.includes('inherited') || keyword.includes('inherit'))
    return 'understanding-mineral-rights';
  return 'mineral-rights';
}

function requiredNormalizedFields(item) {
  const category = categoryFor(item);
  return {
    title: String(item.title || '').slice(0, 60),
    description: String(item.description || item.meta_description || item.excerpt || '').slice(
      0,
      160,
    ),
    published_at: String(item.date_published || item.created || '2026-06-15'),
    draft: true,
    author: 'organization',
    category,
    tags: [item.cluster_id, item.primary_keyword].filter(Boolean),
    hero_image: {
      src: '/og-default.svg',
      alt: item.image_alt || `${item.title || 'MRX mineral rights guide'} illustration`,
    },
    excerpt: String(item.excerpt || item.meta_description || item.title || '').slice(0, 220),
    featured: false,
    disclaimer_top: category === 'tax-legal',
    money_figure_sourced: false,
    reviewed_at: 'TBD-after-compliance-review',
    reviewed_by: 'mrx_compliance-TBD',
  };
}

async function summarizeFactory(base) {
  const manifestPath = join(base, 'article_manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : [];
  const items = Array.isArray(manifest) ? manifest : manifest.articles || manifest.items || [];
  const files = [];
  for await (const file of walk(join(base, 'drafts'))) {
    if (file.endsWith('.md')) files.push(file);
  }

  const statuses = new Map();
  const authors = new Map();
  let missingBook = 0;
  let badTitleLength = 0;
  let badDescriptionLength = 0;
  let missingInternalLinks = 0;
  let unsupportedCategory = 0;

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const fm = getFrontmatter(text);
    const item = {
      title: scalar(fm, 'title') || scalar(fm, 'seo_title'),
      description: scalar(fm, 'description') || scalar(fm, 'meta_description'),
      cluster_id: scalar(fm, 'cluster_id'),
      cluster: scalar(fm, 'cluster'),
      primary_keyword: scalar(fm, 'primary_keyword'),
      author: scalar(fm, 'author'),
      status: scalar(fm, 'status'),
    };
    statuses.set(item.status, (statuses.get(item.status) || 0) + 1);
    authors.set(item.author, (authors.get(item.author) || 0) + 1);
    if (!text.includes('/book/')) missingBook += 1;
    if (item.title.length > 60 || item.title.length < 30) badTitleLength += 1;
    if (item.description.length < 130 || item.description.length > 160) badDescriptionLength += 1;
    if (!fm.includes('internal_links:')) missingInternalLinks += 1;
    if (!POST_CATEGORIES.has(categoryFor(item))) unsupportedCategory += 1;
  }

  const normalizedSample = items[0] ? requiredNormalizedFields(items[0]) : null;
  return {
    source: base,
    manifest_items: items.length,
    markdown_files_under_drafts: files.length,
    statuses: Object.fromEntries([...statuses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)),
    authors: Object.fromEntries([...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)),
    import_gaps: {
      missing_book_cta: missingBook,
      title_length_not_30_to_60: badTitleLength,
      description_length_not_130_to_160: badDescriptionLength,
      missing_internal_links_frontmatter: missingInternalLinks,
      unsupported_category_after_mapping: unsupportedCategory,
    },
    normalized_preview_frontmatter_shape: normalizedSample,
  };
}

async function summarizeRag(base) {
  const manifestPath = join(base, 'manifest.json');
  const readmePath = join(base, 'README.md');
  const summary = {
    source: base,
    manifest_present: existsSync(manifestPath),
    readme_present: existsSync(readmePath),
    agent_packs: [],
  };
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(base, entry.name);
    const docs = existsSync(join(dir, 'documents.jsonl'))
      ? (await readFile(join(dir, 'documents.jsonl'), 'utf8')).split('\n').filter(Boolean).length
      : 0;
    summary.agent_packs.push({
      name: entry.name,
      documents_jsonl: docs,
      sqlite_present: existsSync(join(dir, 'rag.sqlite')),
      readme_present: existsSync(join(dir, 'README.md')),
    });
  }
  summary.agent_packs.sort((a, b) => b.documents_jsonl - a.documents_jsonl);
  return summary;
}

const results = [];
for (const source of SOURCES) {
  if (!existsSync(source)) {
    results.push({ source, error: 'missing source directory' });
    continue;
  }
  const s = await stat(source);
  if (!s.isDirectory()) {
    results.push({ source, error: 'source is not a directory' });
    continue;
  }
  if (source.includes('mrx_team_rag_databases_full')) {
    results.push(await summarizeRag(source));
  } else {
    results.push(await summarizeFactory(source));
  }
}

console.log(JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2));

if (results.some((r) => r.error)) process.exit(1);
