#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'should-i-sell-my-mineral-rights';
const title = 'Should I Sell My Mineral Rights?';
const keyword = 'Sell Mineral Rights or Keep Receiving Royalties';
const inlineFilename = 'sell-mineral-rights-or-keep-receiving-royalties';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave61-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave61-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave61-creative-qa/${slug}`),
};

const generationPrompts = {
  hero: 'Calm documentary Texas mineral-owner decision workspace with a generic royalty statement, a separate sale-review folder, a parcel map, and a deep-navy exact-title field; no cash, buyer branding, fake forms, extra readable words, account numbers, dollar figures, dates, signatures, private information, logos, value conclusions, tax results, legal conclusions, recommendations, offers, guarantees, or success claims.',
  inline:
    'Compositionally distinct overhead decision scene with one unlabeled evidence lane for continuing royalty records and another for a possible mineral-rights sale, joined by a neutral parcel map and centered navy exact-keyword card; no cash, buyer branding, fake forms, extra readable words, account numbers, dollar figures, dates, signatures, private information, logos, value conclusions, tax results, legal conclusions, recommendations, offers, guarantees, or success claims.',
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

function heroTypography() {
  return Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#03182d" />
          <stop offset="1" stop-color="#062744" />
        </linearGradient>
      </defs>
      <style>
        .title { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 48px; font-weight: 700; letter-spacing: -0.5px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="0" y="0" width="660" height="630" fill="url(#navy)" />
      <rect class="rule" x="46" y="116" width="82" height="5" rx="2.5" />
      <text class="title" x="46" y="207">
        <tspan x="46" dy="0">Should I Sell My</tspan>
        <tspan x="46" dy="68">Mineral Rights?</tspan>
      </text>
    </svg>
  `);
}

function inlineTypography() {
  return Buffer.from(`
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navy" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#03182d" />
          <stop offset="0.5" stop-color="#082b4c" />
          <stop offset="1" stop-color="#03182d" />
        </linearGradient>
      </defs>
      <style>
        .keyword { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; text-anchor: middle; letter-spacing: -0.2px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="160" y="425" width="880" height="250" fill="url(#navy)" />
      <rect class="rule" x="350" y="460" width="500" height="4" rx="2" />
      <text class="keyword" x="600" y="535">
        <tspan x="600" dy="0">Sell Mineral Rights or</tspan>
        <tspan x="600" dy="60">Keep Receiving Royalties</tspan>
      </text>
    </svg>
  `);
}

async function perceptualHash(filePath) {
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const average = data.reduce((sum, value) => sum + value, 0) / data.length;
  return Array.from(data, (value) => (value >= average ? '1' : '0')).join('');
}

async function runOcr(filePath, expected, tempDirectory, crop) {
  const binary = join(tempDirectory, 'ocr-image-text');
  if (!(await readFile(binary).catch(() => null))) {
    execFileSync('swiftc', [join(root, 'scripts/ocr-image-text.swift'), '-o', binary], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CLANG_MODULE_CACHE_PATH: join(tempDirectory, 'clang-module-cache'),
        SWIFT_MODULECACHE_PATH: join(tempDirectory, 'swift-module-cache'),
      },
    });
  }
  const ocrPath = join(tempDirectory, `${basename(filePath)}.png`);
  await sharp(filePath).extract(crop).png().toFile(ocrPath);
  const actual = execFileSync(binary, [ocrPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const pass = normalizeText(actual) === normalizeText(expected);
  if (!pass) {
    throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  }
  return { expected, actual, normalized: normalizeText(actual), pass };
}

async function main() {
  if (basename(paths.hero, '.webp') !== slug) throw new Error('Hero filename identity failed');
  if (basename(paths.inline, '.webp') !== inlineFilename) {
    throw new Error('Inline filename identity failed');
  }
  await Promise.all([
    mkdir(dirname(paths.hero), { recursive: true }),
    mkdir(dirname(paths.inline), { recursive: true }),
    mkdir(paths.qa, { recursive: true }),
  ]);

  const [heroSourceBytes, inlineSourceBytes] = await Promise.all([
    readFile(paths.heroSource),
    readFile(paths.inlineSource),
  ]);
  if (sha256(heroSourceBytes) === sha256(inlineSourceBytes)) {
    throw new Error('Hero and inline source art must be distinct binaries');
  }

  const heroBase = await sharp(heroSourceBytes)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  await sharp(heroBase)
    .composite([{ input: heroTypography(), top: 0, left: 0 }])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  const inlineBase = await sharp(inlineSourceBytes)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  await sharp(inlineBase)
    .composite([{ input: inlineTypography(), top: 0, left: 0 }])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.inline);

  for (const [source, prefix, sizes] of [
    [
      paths.hero,
      'hero',
      [
        [600, 315],
        [300, 158],
      ],
    ],
    [
      paths.inline,
      'inline',
      [
        [900, 506],
        [600, 338],
        [360, 203],
      ],
    ],
  ]) {
    for (const [width, height] of sizes) {
      await sharp(source)
        .resize(width, height, { fit: 'fill' })
        .png()
        .toFile(join(paths.qa, `${prefix}-${width}x${height}.png`));
    }
  }

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave61-ocr-'));
  try {
    const heroOcr = await runOcr(paths.hero, title, tempDirectory, {
      left: 0,
      top: 0,
      width: 660,
      height: 630,
    });
    const inlineOcr = await runOcr(paths.inline, keyword, tempDirectory, {
      left: 160,
      top: 415,
      width: 880,
      height: 260,
    });
    const heroSha = await fileSha256(paths.hero);
    const inlineSha = await fileSha256(paths.inline);
    if (heroSha === inlineSha) throw new Error('Hero and inline outputs must be distinct binaries');

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
          sha256: heroSha,
          perceptual_hash: await perceptualHash(paths.hero),
          width: 1200,
          height: 630,
          mime_type: 'image/webp',
          rendered_text: title,
          neutralized_art_text_region_count: 1,
          ocr: heroOcr,
        },
        inline: {
          source_path: paths.inlineSource.slice(root.length + 1),
          source_sha256: await fileSha256(paths.inlineSource),
          public_path: `/assets/articles/inline/${slug}/${inlineFilename}.webp`,
          sha256: inlineSha,
          perceptual_hash: await perceptualHash(paths.inline),
          width: 1200,
          height: 675,
          mime_type: 'image/webp',
          rendered_text: keyword,
          neutralized_art_text_region_count: 1,
          ocr: inlineOcr,
        },
      },
      verification: {
        exact_title_ocr: heroOcr.pass,
        exact_keyword_ocr: inlineOcr.pass,
        deterministic_pixel_text: true,
        distinct_source_binaries: true,
        distinct_output_binaries: true,
      },
    };
    await writeFile(
      join(paths.qa, 'creative-manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

await main();
