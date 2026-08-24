#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const waveNumber = process.env.MRX_WAVE_NUMBER ?? '82';
const slug =
  process.env.MRX_ARTICLE_SLUG ?? 'compare-public-oil-and-gas-price-decks-without-mixing-assumptions';
const title =
  process.env.MRX_ARTICLE_TITLE ??
  'How to Compare Public Oil and Gas Price Decks Without Mixing Assumptions';
const keyword = process.env.MRX_ARTICLE_KEYWORD ?? 'compare public oil and gas price decks';
const heroFilename = process.env.MRX_HERO_FILENAME ?? textSlug(title);
const inlineFilename = process.env.MRX_INLINE_FILENAME ?? textSlug(keyword);
const heroLines = JSON.parse(
  process.env.MRX_HERO_LINES_JSON ??
    '["How to Compare Public","Oil and Gas Price Decks","Without Mixing","Assumptions"]',
);
const inlineLines = JSON.parse(
  process.env.MRX_INLINE_LINES_JSON ?? '["compare public oil and gas","price decks"]',
);
const heroFontFamily =
  process.env.MRX_HERO_FONT_FAMILY ?? "Georgia, 'Times New Roman', serif";
const inlineFontFamily =
  process.env.MRX_INLINE_FONT_FAMILY ?? "Georgia, 'Times New Roman', serif";
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave${waveNumber}-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave${waveNumber}-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${heroFilename}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave${waveNumber}-creative-qa/${slug}`),
};

const generationPrompts = {
  hero:
    process.env.MRX_HERO_GENERATION_PROMPT ??
    'Premium photorealistic elevated front-facing desk scene with two clearly separate blank public oil-and-gas outlook booklets, distinct source-category tabs, blank source cards, and an uninterrupted navy field on the left; no people, maps, wells, rigs, money, values, graphs, curves, arrows, predictions, readable words, figures, dates, signatures, seals, logos, conclusions, or fake document text.',
  inline:
    process.env.MRX_INLINE_GENERATION_PROMPT ??
    'Materially distinct people-free strict overhead pale public-source comparison matrix with two source columns, separate blank cards for publication date, effective period, commodity, geography, unit convention, dollar basis, and stated use case, plus unresolved markers above an uninterrupted lower navy field; no booklets, front-facing perspective, maps, rigs, wells, money, graphs, curves, arrows, forecasts, recommendations, readable words, figures, dates, signatures, seals, logos, or fake document text.',
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
function textSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const svgTextLines = (lines, x, lineHeight) =>
  lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${line}</tspan>`).join('');

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
        .title { fill: #fffaf0; font-family: ${heroFontFamily}; font-size: 32px; font-weight: 700; letter-spacing: -0.4px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="0" y="0" width="640" height="630" fill="url(#navy)" />
      <rect class="rule" x="46" y="102" width="82" height="5" rx="2.5" />
      <text class="title" x="46" y="168">
        ${svgTextLines(heroLines, 46, 48)}
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
        .keyword { fill: #fffaf0; font-family: ${inlineFontFamily}; font-size: 37px; font-weight: 700; text-anchor: middle; letter-spacing: -0.25px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="0" y="455" width="1200" height="220" fill="url(#navy)" />
      <rect class="rule" x="300" y="485" width="600" height="4" rx="2" />
      <text class="keyword" x="600" y="533">
        ${svgTextLines(inlineLines, 600, 48)}
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
  const normalizedActual = normalizeText(actual);
  const normalizedExpected = normalizeText(expected);
  const uppercaseIConfusable =
    /\bai\b/.test(normalizedExpected) &&
    (normalizedExpected.replace(/\bai\b/g, 'al') === normalizedActual ||
      normalizedExpected.replace(/\bai\b/g, 'a1') === normalizedActual);
  const pass = normalizedActual === normalizedExpected || uppercaseIConfusable;
  if (!pass) {
    throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  }
  return {
    expected,
    actual,
    normalized: normalizedExpected,
    normalized_expected: normalizedExpected,
    normalized_actual: normalizedActual,
    uppercase_i_confusable_accepted: uppercaseIConfusable,
    pass,
  };
}

async function main() {
  if (basename(paths.hero, '.webp') !== heroFilename) {
    throw new Error('Hero filename identity failed');
  }
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

  const tempDirectory = await mkdtemp(join(tmpdir(), `mrx-wave${waveNumber}-ocr-`));
  try {
    const heroOcr = await runOcr(paths.hero, title, tempDirectory, {
      left: 0,
      top: 0,
      width: 640,
      height: 630,
    });
    const inlineOcr = await runOcr(paths.inline, keyword, tempDirectory, {
      left: 0,
      top: 450,
      width: 1200,
      height: 225,
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
          public_path: `/assets/articles/hero/${heroFilename}.webp`,
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
