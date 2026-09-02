#!/usr/bin/env node
/**
 * Import the previously published MRX WordPress/SearchAtlas library into Astro.
 *
 * The source export contains 121 public WordPress articles mixed into the larger
 * staged content factory. This importer selects only those published WordPress
 * records, normalizes their frontmatter, removes migration-only notes and
 * embedded JSON-LD, and leaves hand-edited Astro posts untouched.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const defaultManifest =
  '/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_factory_1000/website_load_ready_1121/article_manifest_1121.json';
const manifestArgument = process.argv.find((argument) => argument.startsWith('--manifest='));
const manifestPath = resolve(manifestArgument?.slice('--manifest='.length) || defaultManifest);
const overwrite = process.argv.includes('--overwrite');
const postsDirectory = join(projectRoot, 'src', 'content', 'posts');

if (!existsSync(manifestPath)) {
  throw new Error(`WordPress article manifest not found: ${manifestPath}`);
}

const manifestDocument = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifestItems = Array.isArray(manifestDocument)
  ? manifestDocument
  : manifestDocument.items || manifestDocument.articles || [];
const publishedWordPressArticles = manifestItems.filter(
  (item) => item.source_type === 'wp_searchatlas_export',
);

await mkdir(postsDirectory, { recursive: true });

let imported = 0;
let preserved = 0;

for (const item of publishedWordPressArticles) {
  const outputPath = join(postsDirectory, `${item.slug}.mdx`);
  if (existsSync(outputPath)) {
    const existing = await readFile(outputPath, 'utf8');
    const isImportedArticle = existing.includes("reviewed_by: 'mrx_compliance-source-published'");
    if (!overwrite || !isImportedArticle) {
      preserved += 1;
      continue;
    }
  }

  const sourcePath = resolve(item.absolute_path);
  const source = await readFile(sourcePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(source, sourcePath);
  const title = cleanTitle(item.title);
  const description = normalizeDescription(item.meta_description, title);
  const author = String(item.author || scalar(frontmatter, 'author') || 'Travis').toLowerCase();
  const category = normalizeCategory(listValue(frontmatter, 'categories')[0]);
  const publishedAt = normalizeDate(scalar(frontmatter, 'date_published'), '2026-06-01');
  const updatedAt = normalizeDate(scalar(frontmatter, 'date_modified'), publishedAt);
  const tags = deriveTags(title, category);
  const excerpt = normalizeExcerpt(description, title);
  const importedBody = normalizeBody(body, title);

  const output = `---\n${[
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `published_at: ${yamlString(publishedAt)}`,
    `updated_at: ${yamlString(updatedAt)}`,
    `draft: false`,
    `author: ${yamlString(author)}`,
    `category: ${yamlString(category)}`,
    `tags: ${JSON.stringify(tags)}`,
    `hero_image:`,
    `  src: '/og-default.svg'`,
    `  alt: ${yamlString(`${title} educational illustration`)}`,
    `excerpt: ${yamlString(excerpt)}`,
    `featured: false`,
    `disclaimer_top: ${category === 'tax-legal'}`,
    `money_figure_sourced: false`,
    `reviewed_at: ${yamlString(updatedAt)}`,
    `reviewed_by: 'mrx_compliance-source-published'`,
  ].join('\n')}\n---\n\n${importedBody.trim()}\n`;

  await writeFile(outputPath, output, 'utf8');
  imported += 1;
}

console.log(
  `Imported ${imported} WordPress articles and preserved ${preserved} existing Astro posts ` +
    `from ${basename(manifestPath)}.`,
);

function splitFrontmatter(source, sourcePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Invalid Markdown frontmatter: ${sourcePath}`);
  return { frontmatter: match[1], body: match[2] };
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['\"]?([^'\"\\n]+)`, 'm'));
  return match?.[1]?.trim() || '';
}

function listValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:- .*(?:\\n|$))*)`, 'm'));
  return (match?.[1] || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

function normalizeDate(value, fallback) {
  const cleaned = String(value || fallback).replace(/^['"]|['"]$/g, '');
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) return `${fallback.slice(0, 10)}T00:00:00Z`;
  return date.toISOString();
}

function cleanTitle(value) {
  return cleanCopy(String(value || 'MRX Mineral Rights Guide'))
    .replace(/["']$/, '')
    .trim();
}

function normalizeDescription(value, title) {
  let description = cleanCopy(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (!description) {
    description = `${title}. Read a plain-language MRX overview for mineral owners comparing their records, options, and practical next steps.`;
  }
  const suffix = ' Read a plain-language MRX overview for mineral owners.';
  while (description.length < 130) description += suffix;
  if (description.length > 160) {
    description = description.slice(0, 160);
    const lastSpace = description.lastIndexOf(' ');
    if (lastSpace >= 130) description = description.slice(0, lastSpace);
    description = description.replace(/[,:;\s]+$/, '.');
  }
  return description;
}

function normalizeExcerpt(description, title) {
  const base = description.length >= 40 ? description : `${title}. ${description}`;
  return base
    .slice(0, 220)
    .replace(/\s+\S*$/, '')
    .replace(/[,:;\s]+$/, '.');
}

function normalizeCategory(value = '') {
  const category = value.replaceAll('&amp;', '&').toLowerCase();
  const categories = new Map([
    ['mineral rights', 'mineral-rights'],
    ['valuation', 'valuation'],
    ['tax & legal', 'tax-legal'],
    ['selling process', 'selling-process'],
    ['texas oil & gas', 'texas-oil-gas'],
    ['competing offers', 'competing-offers'],
    ['understanding mineral rights', 'understanding-mineral-rights'],
  ]);
  return categories.get(category) || 'mineral-rights';
}

function deriveTags(title, category) {
  const haystack = title.toLowerCase();
  const rules = [
    ['1031 exchange', '1031 exchange'],
    ['tax', 'tax'],
    ['probate', 'probate'],
    ['inherit', 'inherited rights'],
    ['estate', 'estate planning'],
    ['royalt', 'royalties'],
    ['division order', 'division orders'],
    ['lease', 'leases'],
    ['deed', 'deeds'],
    ['title', 'title'],
    ['valu', 'valuation'],
    ['offer', 'offers'],
    ['buyer', 'buyers'],
    ['sell', 'selling'],
    ['closing', 'closing'],
    ['document', 'documents'],
    ['production', 'production'],
    ['texas', 'texas'],
    ['permian', 'permian basin'],
    ['eagle ford', 'eagle ford'],
    ['haynesville', 'haynesville'],
  ];
  const categoryTag = category.replaceAll('-', ' ');
  const tags = [categoryTag];
  for (const [needle, tag] of rules) {
    if (haystack.includes(needle) && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 5);
}

function normalizeBody(body, title) {
  let output = body.replace(/\r\n/g, '\n');
  output = output.replace(new RegExp(`^#\\s+${escapeRegex(title)}\\s*\\n+`, 'i'), '');
  output = output.replace(/^>\s*\*\*Author box:\*\*.*\n+/m, '');
  output = output.replace(/^>\s+[^\n]+\n+(?=##?\s)/m, '');
  output = output.replace(/^\{\s*"@context"[^\n]*\}\s*$/gm, '');
  output = output.replace(/^## Migration \/ editorial checklist[\s\S]*$/m, '');
  output = output.replace(
    /^!\[[^\]]*\]\(https?:\/\/mineralrightsxchange\.com\/wp-content\/[^)]+\)\s*$/gm,
    '',
  );
  output = output.replaceAll('https://mineralrightsxchange.com/book', '/book/');
  output = output.replaceAll('---', '--');
  output = cleanCopy(output);
  output = output.replaceAll('{', '&#123;').replaceAll('}', '&#125;');
  return output.replace(/\n{3,}/g, '\n\n');
}

function cleanCopy(value) {
  const replacements = [
    [/\u2014|\u2013/g, '-'],
    [/certified appraisal/gi, 'independent professional valuation'],
    [/certified appraiser/gi, 'qualified valuation professional'],
    [/formal appraisal/gi, 'formal valuation'],
    [/exact value/gi, 'estimated value'],
    [/exact market price/gi, 'estimated market range'],
    [/final appraisal/gi, 'completed valuation'],
    [/final price/gi, 'transaction price'],
    [/instant valuation/gi, 'prompt valuation'],
    [/instant cash/gi, 'prompt payment'],
    [/instant offer/gi, 'prompt offer'],
    [/guaranteed value/gi, 'stated valuation range'],
    [/guaranteed offer/gi, 'stated offer'],
    [/we guarantee/gi, 'MRX aims to provide'],
    [/you will receive/gi, 'you may receive'],
    [/best price/gi, 'stronger price'],
    [/the best/gi, 'a strong'],
    [/risk-free/gi, 'lower-risk'],
    [/no-risk/gi, 'lower-risk'],
    [/we recommend that you/gi, 'you may want to'],
    [/we advise/gi, 'MRX explains'],
    [/legal advice/gi, 'individualized legal guidance'],
    [/tax advice/gi, 'individualized tax guidance'],
    [/act now/gi, 'consider the timing'],
  ];
  let output = String(value);
  for (const [pattern, replacement] of replacements) output = output.replace(pattern, replacement);
  return output;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
