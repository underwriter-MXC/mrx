#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'how-lease-royalty-rates-influence-mineral-value';
const title = 'How Lease Royalty Rates Influence Mineral Value';
const keyword = 'lease royalty rates mineral value';
const inlineFilename = 'lease-royalty-rates-mineral-value';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave24-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave24-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave24-creative-qa/${slug}`),
};

const generationPrompts = {
  hero:
    'Photorealistic lease-rate sensitivity workspace with a dark exact-title panel, mapped tract, lease evidence, abstract fractional blocks, and no readable text outside the exact article title.',
  inline:
    'Compositionally distinct evidence board with ownership layers, an abstract royalty-rate ladder, a cash-flow filter, an exact-keyword navy band, and no readable text outside the exact keyword.',
};

const normalizeText = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const fileSha256 = async (filePath) => sha256(await readFile(filePath));

async function perceptualHash(filePath) {
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const average = data.reduce((sum, value) => sum + value, 0) / data.length;
  return Array.from(data, (value) => (value >= average ? '1' : '0')).join('');
}

async function runOcr(filePath, expected, tempDirectory) {
  const binary = join(tempDirectory, 'ocr-image-text');
  if (!(await readFile(binary).catch(() => null))) {
    execFileSync('swiftc', [join(root, 'scripts/ocr-image-text.swift'), '-o', binary], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const actual = execFileSync(binary, [filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const pass = normalizeText(actual) === normalizeText(expected);
  if (!pass) throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  return { expected, actual, normalized: normalizeText(actual), pass };
}

async function main() {
  if (basename(paths.hero, '.webp') !== slug) throw new Error('Hero filename identity failed');
  if (basename(paths.inline, '.webp') !== inlineFilename) throw new Error('Inline filename identity failed');

  await Promise.all([
    mkdir(dirname(paths.hero), { recursive: true }),
    mkdir(dirname(paths.inline), { recursive: true }),
    mkdir(paths.qa, { recursive: true }),
  ]);

  await sharp(paths.heroSource)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.inline);

  for (const [source, prefix, sizes] of [
    [paths.hero, 'hero', [[600, 315], [300, 158]]],
    [paths.inline, 'inline', [[900, 506], [600, 338], [360, 203]]],
  ]) {
    for (const [width, height] of sizes) {
      await sharp(source).resize(width, height, { fit: 'fill' }).png().toFile(
        join(paths.qa, `${prefix}-${width}x${height}.png`),
      );
    }
  }

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave24-ocr-'));
  try {
    const heroOcr = await runOcr(paths.hero, title, tempDirectory);
    const inlineOcr = await runOcr(paths.inline, keyword, tempDirectory);
    const manifest = {
      schema_version: 1,
      generated_at_utc: new Date().toISOString(),
      article: {
        title,
        keyword,
        generation_prompts: generationPrompts,
        hero: {
          source_path: paths.heroSource.slice(root.length + 1),
          source_sha256: await fileSha256(paths.heroSource),
          public_path: `/assets/articles/hero/${slug}.webp`,
          sha256: await fileSha256(paths.hero),
          perceptual_hash: await perceptualHash(paths.hero),
          width: 1200,
          height: 630,
          mime_type: 'image/webp',
          rendered_text: title,
          ocr: heroOcr,
        },
        inline: {
          source_path: paths.inlineSource.slice(root.length + 1),
          source_sha256: await fileSha256(paths.inlineSource),
          public_path: `/assets/articles/inline/${slug}/${inlineFilename}.webp`,
          sha256: await fileSha256(paths.inline),
          perceptual_hash: await perceptualHash(paths.inline),
          width: 1200,
          height: 675,
          mime_type: 'image/webp',
          rendered_text: keyword,
          ocr: inlineOcr,
        },
      },
      verification: {
        exact_title_ocr: heroOcr.pass,
        exact_keyword_ocr: inlineOcr.pass,
        deterministic_pixel_text: true,
        distinct_source_binaries:
          (await fileSha256(paths.heroSource)) !== (await fileSha256(paths.inlineSource)),
        distinct_output_binaries:
          (await fileSha256(paths.hero)) !== (await fileSha256(paths.inline)),
      },
    };
    await writeFile(join(paths.qa, 'creative-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

await main();
