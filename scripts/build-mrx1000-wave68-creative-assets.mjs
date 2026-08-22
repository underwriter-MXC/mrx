#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'property-scope-crosswalk-mineral-rights-offers';
const title = 'How to Build a Property-Scope Crosswalk Before Comparing Mineral Rights Offers';
const keyword = 'Mineral Rights Offer Property Scope Checklist';
const heroFilename = 'how-to-build-a-property-scope-crosswalk-before-comparing-mineral-rights-offers';
const inlineFilename = 'mineral-rights-offer-property-scope-checklist';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave68-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave68-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${heroFilename}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave68-creative-qa/${slug}`),
};

const generationPrompts = {
  hero: 'Premium documentary photograph of one adult mineral owner at an eye-level three-quarter desk view on the right, calmly comparing two blank document packets beside an unmarked tract map, with natural window light and a clean deep-navy exact-title field on the left; no signing, handshakes, cash, buyer branding, fake forms, extra readable words, account numbers, dollar figures, acreage figures, dates, signatures, private information, logos, authority conclusions, title conclusions, value conclusions, legal conclusions, rankings, recommendations, offers, guarantees, or success claims.',
  inline:
    'Compositionally distinct people-free overhead property-scope crosswalk workspace with two closed navy folders, one blank grid worksheet, two abstract tract-map cards, an unmarked ruler, a capped pen, and a clean navy lower exact-phrase field; no people, hands, arrows, screens, cash, buyer branding, fake data, extra readable words, account numbers, dollar figures, acreage figures, dates, signatures, private information, logos, authority conclusions, title conclusions, value conclusions, legal conclusions, rankings, recommendations, offers, guarantees, or success claims.',
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
        .title { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; letter-spacing: -0.4px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="0" y="0" width="700" height="630" fill="url(#navy)" />
      <rect class="rule" x="46" y="116" width="82" height="5" rx="2.5" />
      <text class="title" x="46" y="190">
        <tspan x="46" dy="0">How to Build a</tspan>
        <tspan x="46" dy="62">Property-Scope Crosswalk</tspan>
        <tspan x="46" dy="62">Before Comparing Mineral</tspan>
        <tspan x="46" dy="62">Rights Offers</tspan>
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
        .keyword { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 42px; font-weight: 700; text-anchor: middle; letter-spacing: -0.25px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect x="0" y="405" width="1200" height="270" fill="url(#navy)" />
      <rect class="rule" x="300" y="454" width="600" height="4" rx="2" />
      <text class="keyword" x="600" y="530">
        <tspan x="600" dy="0">Mineral Rights Offer</tspan>
        <tspan x="600" dy="54">Property Scope Checklist</tspan>
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

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave68-ocr-'));
  try {
    const heroOcr = await runOcr(paths.hero, title, tempDirectory, {
      left: 0,
      top: 0,
      width: 700,
      height: 630,
    });
    const inlineOcr = await runOcr(paths.inline, keyword, tempDirectory, {
      left: 0,
      top: 395,
      width: 1200,
      height: 270,
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
