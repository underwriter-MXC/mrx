#!/usr/bin/env node

/**
 * Restore the per-article WordPress hero assets recorded in
 * config/article-hero-plan.json and wire them into the Astro MDX posts.
 *
 * The public MRX domain no longer serves /wp-content/uploads, but the
 * original MRX WordPress staging origin still does. Override the source
 * origin with MRX_WP_MEDIA_ORIGIN when the staging hostname changes.
 *
 * Usage:
 *   node scripts/sync-article-heroes.mjs --check
 *   node scripts/sync-article-heroes.mjs --download --apply
 *   node scripts/sync-article-heroes.mjs --download --apply --force
 */
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const projectRoot = process.cwd();
const planPath = path.join(projectRoot, 'config', 'article-hero-plan.json');
const postsDirectory = path.join(projectRoot, 'src', 'content', 'posts');
const assetsDirectory = path.join(projectRoot, 'public', 'assets', 'articles');
const sourceOrigin = process.env.MRX_WP_MEDIA_ORIGIN ?? 'https://s7f8jom6sq.wpdns.site';
const flags = new Set(process.argv.slice(2));
const shouldDownload = flags.has('--download');
const shouldApply = flags.has('--apply');
const force = flags.has('--force');

const plan = JSON.parse(await readFile(planPath, 'utf8'));

function sourceUrlFor(entry) {
  if (!entry.sourceImageUrl) return null;
  const original = new URL(entry.sourceImageUrl);
  return new URL(`${original.pathname}${original.search}`, sourceOrigin).toString();
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await worker(item);
    }
  });
  await Promise.all(workers);
}

async function downloadHero(entry) {
  const sourceUrl = sourceUrlFor(entry);
  if (!sourceUrl) return { slug: entry.slug, status: 'no-source' };

  const targetPath = path.join(assetsDirectory, entry.filename);
  if (!force && (await exists(targetPath))) {
    return { slug: entry.slug, status: 'existing' };
  }

  const response = await fetch(sourceUrl, {
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8',
      'user-agent': 'MRX article hero migration/1.0',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`${entry.slug}: ${response.status} downloading ${sourceUrl}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`${entry.slug}: expected an image but received ${contentType || 'unknown'}`);
  }

  const input = Buffer.from(await response.arrayBuffer());
  const temporaryPath = `${targetPath}.tmp`;
  await sharp(input)
    .rotate()
    .resize(1600, 900, { fit: 'cover', position: 'attention' })
    .webp({ quality: 84, effort: 5 })
    .toFile(temporaryPath);
  await rename(temporaryPath, targetPath);
  return { slug: entry.slug, status: 'downloaded' };
}

async function applyHero(entry) {
  const targetPath = path.join(assetsDirectory, entry.filename);
  if (!(await exists(targetPath))) return { slug: entry.slug, status: 'missing-asset' };

  const postPath = path.join(postsDirectory, `${entry.slug}.mdx`);
  const original = await readFile(postPath, 'utf8');
  const next = original.replace(
    /(\nhero_image:\s*\n\s+src:)\s*[^\n]+/,
    `$1 '/assets/articles/${entry.filename}'`,
  );
  if (next === original) {
    const alreadyApplied = original.includes(`src: '/assets/articles/${entry.filename}'`);
    if (alreadyApplied) return { slug: entry.slug, status: 'unchanged' };
    throw new Error(`${entry.slug}: hero_image.src was not found in frontmatter`);
  }

  await writeFile(postPath, next);
  return { slug: entry.slug, status: 'updated' };
}

async function validateInventory() {
  const heroPaths = [];
  const missingAssets = [];
  const invalidAssets = [];
  const frontmatterMismatches = [];

  for (const entry of plan) {
    const publicPath = `/assets/articles/${entry.filename}`;
    const targetPath = path.join(assetsDirectory, entry.filename);
    const postPath = path.join(postsDirectory, `${entry.slug}.mdx`);
    heroPaths.push(publicPath);

    if (!(await exists(targetPath))) {
      missingAssets.push(publicPath);
    } else {
      try {
        const metadata = await sharp(targetPath).metadata();
        if (metadata.format !== 'webp' || metadata.width !== 1600 || metadata.height !== 900) {
          invalidAssets.push({ path: publicPath, ...metadata });
        }
      } catch (error) {
        invalidAssets.push({ path: publicPath, error: error.message });
      }
    }

    const post = await readFile(postPath, 'utf8');
    if (!post.includes(`src: '${publicPath}'`) && !post.includes(`src: "${publicPath}"`)) {
      frontmatterMismatches.push(entry.slug);
    }
  }

  return {
    planned: plan.length,
    uniqueHeroPaths: new Set(heroPaths).size,
    missingAssets,
    invalidAssets,
    frontmatterMismatches,
  };
}

await mkdir(assetsDirectory, { recursive: true });

if (shouldDownload) {
  const downloadResults = [];
  const failures = [];
  await mapWithConcurrency(plan, 8, async (entry) => {
    try {
      downloadResults.push(await downloadHero(entry));
    } catch (error) {
      failures.push(error.message);
    }
  });
  const counts = Object.groupBy(downloadResults, (result) => result.status);
  console.log(
    'Download results:',
    Object.fromEntries(Object.entries(counts).map(([key, rows]) => [key, rows.length])),
  );
  if (failures.length > 0) {
    console.error('Download failures:', failures);
    process.exitCode = 1;
  }
}

if (shouldApply) {
  const applyResults = [];
  for (const entry of plan) applyResults.push(await applyHero(entry));
  const counts = Object.groupBy(applyResults, (result) => result.status);
  console.log(
    'Frontmatter results:',
    Object.fromEntries(Object.entries(counts).map(([key, rows]) => [key, rows.length])),
  );
}

const validation = await validateInventory();
console.log('Validation:', JSON.stringify(validation, null, 2));

if (
  validation.uniqueHeroPaths !== validation.planned ||
  validation.missingAssets.length > 0 ||
  validation.invalidAssets.length > 0 ||
  validation.frontmatterMismatches.length > 0
) {
  process.exitCode = 1;
}

process.on('exit', async () => {
  // Best-effort cleanup for an interrupted Sharp conversion.
  for (const entry of plan) {
    await unlink(path.join(assetsDirectory, `${entry.filename}.tmp`)).catch(() => {});
  }
});
