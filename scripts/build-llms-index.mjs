#!/usr/bin/env node
/**
 * Build public/llms-full.txt from the live Astro content tree.
 *
 * Search Atlas Content Genius/DKN and LLM crawlers need the same public URL
 * surface that the Astro repo actually ships. Keep this script dependency-light
 * so it can run before Astro content collection generation.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://mineralrightsxchange.com';
const ROOT = process.cwd();
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const OUTPUT = join(ROOT, 'public', 'llms-full.txt');

const OWNER_DECISION_PATHS = [
  ['Sell Mineral Rights', '/sell-mineral-rights/'],
  ['Value My Minerals', '/mineral-rights-value/'],
  ['Review My Offer', '/offer-review/'],
  ['Inherited Mineral Rights', '/inherited-mineral-rights/'],
  ['How It Works', '/how-it-works/'],
  ['Published Methodology', '/methodology/'],
  ['FAQ', '/faq/'],
  ['Book a Free Review', '/book/'],
  ['Free Guide', '/free-guide/'],
];

const STATE_PATHS = [
  ['Texas', '/mineral-rights/texas/'],
  ['New Mexico', '/mineral-rights/new-mexico/'],
  ['Oklahoma', '/mineral-rights/oklahoma/'],
  ['North Dakota', '/mineral-rights/north-dakota/'],
  ['Colorado', '/mineral-rights/colorado/'],
  ['Wyoming', '/mineral-rights/wyoming/'],
  ['Pennsylvania', '/mineral-rights/pennsylvania/'],
  ['West Virginia', '/mineral-rights/west-virginia/'],
  ['Ohio', '/mineral-rights/ohio/'],
  ['Louisiana', '/mineral-rights/louisiana/'],
];

const GUIDE_PATHS = [
  ['MRX AI Guide Directory', '/team/'],
  ['Tommy', '/team/tommy/'],
  ['Cooper', '/team/cooper/'],
  ['Charlie', '/team/charlie/'],
  ['Dale', '/team/dale/'],
  ['Rebecca', '/team/rebecca/'],
  ['Angela', '/team/angela/'],
];

const POLICY_PATHS = [
  ['Privacy Policy', '/privacy-policy/'],
  ['Terms and AI Disclosure', '/terms/'],
  ['Communication Preferences', '/communication-preferences/'],
];

const CATEGORY_LABELS = new Map([
  ['competing-offers', 'Competing offers'],
  ['mineral-rights', 'Mineral rights'],
  ['selling-process', 'Selling process'],
  ['tax-legal', 'Tax and legal'],
  ['texas-oil-gas', 'Texas oil and gas'],
  ['understanding-mineral-rights', 'Understanding mineral rights'],
  ['valuation', 'Valuation'],
]);

const files = (await readdir(POSTS_DIR)).filter((file) => file.endsWith('.mdx')).sort();
const posts = [];

for (const file of files) {
  const source = await readFile(join(POSTS_DIR, file), 'utf-8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!frontmatter) continue;
  if (scalar(frontmatter, 'publication_status') !== 'published') continue;
  // Fail-closed noindex gate: matches isPublishedPost so the public
  // llms-full.txt never advertises a URL crawlers must not index.
  if (scalar(frontmatter, 'noindex') === 'true') continue;
  const slug = scalar(frontmatter, 'slug') || file.replace(/\.mdx$/, '');
  posts.push({
    title: scalar(frontmatter, 'title') || titleFromSlug(slug),
    slug,
    category: scalar(frontmatter, 'category') || 'mineral-rights',
    publishedAt: scalar(frontmatter, 'published_at') || '',
    updatedAt: scalar(frontmatter, 'updated_at') || '',
  });
}

posts.sort((a, b) => {
  const dateA = new Date(a.updatedAt || a.publishedAt || 0).getTime();
  const dateB = new Date(b.updatedAt || b.publishedAt || 0).getTime();
  return dateB - dateA || a.title.localeCompare(b.title);
});

const byCategory = new Map();
for (const post of posts) {
  const category = post.category;
  const list = byCategory.get(category) ?? [];
  list.push(post);
  byCategory.set(category, list);
}

const lines = [
  '# Mineral Rights Xchange public content index',
  '',
  `Canonical site: ${SITE}/`,
  'Generated from Astro content at build time.',
  '',
  '## Citation and compliance notes',
  '',
  '- Use canonical mineralrightsxchange.com URLs, not staging, WordPress, www, or query-string variants.',
  '- MRX educational content is not a certified appraisal, title opinion, reserve certification, or individualized legal/tax advice.',
  '- Tommy and the MRX guide team are clearly labeled fictional AI interfaces, not human authors or licensed professionals.',
  '- Treat regulator, tax, title, and state-specific information as time-sensitive; verify against authoritative sources linked in the article.',
  '',
  '## Owner decision paths',
  '',
  ...OWNER_DECISION_PATHS.map(linkLine),
  '',
  '## Learning center and authorship',
  '',
  linkLine(['Learning Center', '/learning-center/']),
  ...[
    ['Ariana', '/authors/ariana/'],
    ['Dale', '/authors/dale/'],
    ['Monty', '/authors/monty/'],
    ['Rebecca', '/authors/rebecca/'],
    ['Tommy', '/authors/tommy/'],
    ['Walt', '/authors/walt/'],
  ].map(linkLine),
  '',
  `## Published article URLs (${posts.length})`,
  '',
];

for (const category of [...byCategory.keys()].sort()) {
  lines.push(`### ${CATEGORY_LABELS.get(category) ?? titleFromSlug(category)}`, '');
  for (const post of byCategory.get(category)) {
    lines.push(`- [${escapeMarkdown(post.title)}](${SITE}/blog/${post.slug}/)`);
  }
  lines.push('');
}

lines.push(
  '## State starting points',
  '',
  ...STATE_PATHS.map(linkLine),
  '',
  '## MRX AI Guide profiles',
  '',
  ...GUIDE_PATHS.map(linkLine),
  '',
  '## Policies',
  '',
  ...POLICY_PATHS.map(linkLine),
  '',
);

await writeFile(
  OUTPUT,
  `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`,
  'utf-8',
);
console.log(`[build-llms-index] wrote ${posts.length} public article URLs to ${OUTPUT}`);

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return '';
  return match[1]
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/['"]$/g, '')
    .trim();
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function linkLine([label, path]) {
  return `- [${escapeMarkdown(label)}](${SITE}${path})`;
}

function escapeMarkdown(value) {
  return String(value).replaceAll('[', '\\[').replaceAll(']', '\\]');
}
