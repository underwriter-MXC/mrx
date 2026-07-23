#!/usr/bin/env node
/**
 * Build deterministic, hash-locked hero/social asset evidence for the
 * authorized MRX1000 release-10 batch. Exact and perceptual comparisons cover
 * every raster image in public/assets/articles so a release packet cannot
 * approve a missing, stale, or materially duplicated asset.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

import sharp from 'sharp';

const repoRoot = process.argv
  .find((arg) => arg.startsWith('--tree='))
  ?.slice('--tree='.length) ?? process.env.MRX_TREE ?? resolve(import.meta.dirname, '..');
const root = resolve(repoRoot);
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const outputPath = join(root, 'artifacts/mrx1000-release-10/assets/asset-evidence.json');
const markdownPath = join(root, 'artifacts/mrx1000-release-10/assets/asset-evidence.md');
const rasterExtensions = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif']);
const perceptualDuplicateThreshold = 8;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function frontmatter(source) {
  return source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function unquote(value) {
  return String(value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  return unquote(nested.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function listRasterFiles(directory) {
  const out = [];
  if (!existsSync(directory)) return out;
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...listRasterFiles(path));
    else if (rasterExtensions.has(extname(name).toLowerCase())) out.push(path);
  }
  return out.sort();
}

async function differenceHash(path) {
  const { data } = await sharp(path)
    .resize(9, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bits = '';
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const offset = row * 9 + column;
      bits += data[offset] > data[offset + 1] ? '1' : '0';
    }
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
}

function hammingDistance(left, right) {
  let value = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let count = 0;
  while (value) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

function publicToRepoPath(publicPath) {
  if (!publicPath.startsWith('/')) return null;
  return join(root, 'public', publicPath.slice(1));
}

async function main() {
  if (!existsSync(batchPath)) throw new Error(`Missing batch config: ${batchPath}`);
  const batchBytes = readFileSync(batchPath);
  const batch = JSON.parse(batchBytes.toString('utf8'));
  const libraryPaths = listRasterFiles(join(root, 'public/assets/articles'));
  const library = [];
  for (const path of libraryPaths) {
    const bytes = readFileSync(path);
    const metadata = await sharp(path).metadata();
    library.push({
      path,
      repo_path: relative(root, path),
      sha256: sha256(bytes),
      perceptual_hash: await differenceHash(path),
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      format: metadata.format ?? null,
    });
  }

  const rows = [];
  for (const entry of batch.articles ?? []) {
    const bodyPath = join(root, entry.repo_path);
    if (!existsSync(bodyPath)) throw new Error(`Missing article body: ${entry.repo_path}`);
    const bodyBytes = readFileSync(bodyPath);
    const fm = frontmatter(bodyBytes.toString('utf8'));
    const title = scalar(fm, 'title');
    const hero = {
      kind: 'hero',
      public_path: nestedScalar(fm, 'hero_image', 'src'),
      alt_text: nestedScalar(fm, 'hero_image', 'alt'),
      declared_width: Number(nestedScalar(fm, 'hero_image', 'width')),
      declared_height: Number(nestedScalar(fm, 'hero_image', 'height')),
      declared_mime_type: nestedScalar(fm, 'hero_image', 'mime_type'),
    };
    const social = {
      kind: 'social',
      public_path: nestedScalar(fm, 'hero_image', 'social_src'),
      alt_text: nestedScalar(fm, 'hero_image', 'social_alt'),
      declared_width: Number(nestedScalar(fm, 'hero_image', 'social_width')),
      declared_height: Number(nestedScalar(fm, 'hero_image', 'social_height')),
      declared_mime_type: nestedScalar(fm, 'hero_image', 'social_mime_type'),
    };
    const provenance = nestedScalar(fm, 'hero_image', 'source');
    const license = nestedScalar(fm, 'hero_image', 'license');
    const assets = [];
    for (const declared of [hero, social]) {
      const absolutePath = publicToRepoPath(declared.public_path);
      const observed = absolutePath
        ? library.find((asset) => asset.path === absolutePath)
        : null;
      const exactDuplicates = observed
        ? library.filter((asset) => asset.path !== observed.path && asset.sha256 === observed.sha256)
        : [];
      const perceptualMatches = observed
        ? library
            .filter((asset) => asset.path !== observed.path)
            .map((asset) => ({
              repo_path: asset.repo_path,
              distance: hammingDistance(observed.perceptual_hash, asset.perceptual_hash),
            }))
            .sort((left, right) => left.distance - right.distance || left.repo_path.localeCompare(right.repo_path))
        : [];
      const closest = perceptualMatches[0] ?? null;
      const mimeType = observed?.format === 'jpg' || observed?.format === 'jpeg'
        ? 'image/jpeg'
        : observed?.format
          ? `image/${observed.format}`
          : null;
      const pass = Boolean(
        observed &&
          declared.alt_text &&
          provenance &&
          license &&
          declared.declared_width === observed.width &&
          declared.declared_height === observed.height &&
          declared.declared_mime_type === mimeType &&
          exactDuplicates.length === 0 &&
          (!closest || closest.distance > perceptualDuplicateThreshold),
      );
      assets.push({
        ...declared,
        repo_path: observed?.repo_path ?? (absolutePath ? relative(root, absolutePath) : null),
        exists: Boolean(observed),
        observed_width: observed?.width ?? null,
        observed_height: observed?.height ?? null,
        observed_mime_type: mimeType,
        bytes: observed ? statSync(observed.path).size : null,
        sha256: observed?.sha256 ?? null,
        perceptual_hash: observed?.perceptual_hash ?? null,
        exact_duplicate_paths: exactDuplicates.map((asset) => asset.repo_path),
        perceptual_duplicate_threshold: perceptualDuplicateThreshold,
        nearest_nonself_path: closest?.repo_path ?? null,
        nearest_nonself_hamming_distance: closest?.distance ?? null,
        provenance,
        license,
        disposition: pass ? 'PASS' : 'HOLD',
      });
    }
    rows.push({
      program_row_id: entry.program_row_id,
      slug: entry.slug,
      title,
      repo_path: entry.repo_path,
      body_sha256: sha256(bodyBytes),
      frontmatter_sha256: sha256(Buffer.from(`${fm}\n`, 'utf8')),
      assets,
      disposition: assets.every((asset) => asset.disposition === 'PASS') ? 'PASS' : 'HOLD',
    });
  }

  const payload = {
    artifact_type: 'mrx1000_release_10_asset_evidence',
    schema_version: '2.0.0',
    generated_at_utc: batch.evidence_scaffold_generated_at_utc,
    batch_config_path: 'config/mrx1000-release-10-batch.json',
    batch_config_sha256: sha256(batchBytes),
    comparison_universe: {
      path: 'public/assets/articles/**/*.{webp,jpg,jpeg,png,avif}',
      image_count: library.length,
      exact_hash_algorithm: 'SHA-256',
      perceptual_hash_algorithm: '64-bit grayscale difference hash (9x8)',
      perceptual_duplicate_threshold_hamming_distance_lte: perceptualDuplicateThreshold,
    },
    summary: {
      article_count: rows.length,
      asset_count: rows.reduce((sum, row) => sum + row.assets.length, 0),
      passing_article_count: rows.filter((row) => row.disposition === 'PASS').length,
      all_assets_pass: rows.every((row) => row.disposition === 'PASS'),
    },
    rows,
  };
  const json = stableJson(payload);
  const markdown = [
    '# MRX1000 release-10 asset evidence',
    '',
    `- Articles: ${payload.summary.article_count}`,
    `- Assets: ${payload.summary.asset_count}`,
    `- Library comparison images: ${library.length}`,
    `- Perceptual duplicate threshold: Hamming distance <= ${perceptualDuplicateThreshold}`,
    `- Result: **${payload.summary.all_assets_pass ? 'PASS' : 'HOLD'}**`,
    '',
    '| Article | Hero | Social |',
    '|---|---:|---:|',
    ...rows.map((row) => `| ${row.slug} | ${row.assets[0].disposition} | ${row.assets[1].disposition} |`),
    '',
  ].join('\n');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, json);
  writeFileSync(`${outputPath}.sha256`, `${sha256(Buffer.from(json))}  ${relative(root, outputPath)}\n`);
  writeFileSync(markdownPath, markdown);
  writeFileSync(`${markdownPath}.sha256`, `${sha256(Buffer.from(markdown))}  ${relative(root, markdownPath)}\n`);
  console.log(`Asset evidence: ${payload.summary.all_assets_pass ? 'PASS' : 'HOLD'} (${rows.length} articles, ${library.length} library images).`);
  if (!payload.summary.all_assets_pass) process.exitCode = 2;
}

await main();
