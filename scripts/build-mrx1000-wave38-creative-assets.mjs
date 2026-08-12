#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug =
  'uncovering-hidden-costs-what-every-mineral-rights-seller-should-know-before-the-review';
const title =
  'Uncovering Hidden Costs: What Every Mineral Rights Seller Should Know Before the Review';
const keyword = 'Are There Any Hidden Costs I Should Be Aware of During the Review?';
const inlineFilename = 'are-there-any-hidden-costs-i-should-be-aware-of-during-the-review';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave38-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave38-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave38-creative-qa/${slug}`),
};

const generationPrompts = {
  hero: 'Photorealistic Texas mineral owner mapping possible review costs to source documents and a five-row authorization worksheet, with a deep-navy title-safe panel on the left and no readable words, letters, numbers, prices, percentages, formulas, signatures, logos, or seals.',
  inline:
    'Compositionally distinct no-people overhead cost-map system with five connected blank cards, a property map, magnifier, closed folder, calculator, pencil, and envelope, plus a lower keyword-safe field and no readable words, letters, numbers, prices, percentages, formulas, signatures, logos, or seals.',
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
      <style>
        .title { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 35px; font-weight: 700; letter-spacing: -0.8px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect class="rule" x="58" y="135" width="72" height="5" rx="2.5" />
      <text class="title" x="58" y="195">
        <tspan x="58" dy="0">Uncovering Hidden Costs:</tspan>
        <tspan x="58" dy="44">What Every Mineral</tspan>
        <tspan x="58" dy="44">Rights Seller Should Know</tspan>
        <tspan x="58" dy="44">Before the Review</tspan>
      </text>
    </svg>
  `);
}

function inlineTypography() {
  return Buffer.from(`
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <style>
        .keyword { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; text-anchor: middle; letter-spacing: -0.5px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect class="rule" x="533" y="482" width="134" height="5" rx="2.5" />
      <text class="keyword" x="600" y="538">
        <tspan x="600" dy="0">Are There Any Hidden Costs</tspan>
        <tspan x="600" dy="49">I Should Be Aware of</tspan>
        <tspan x="600" dy="49">During the Review?</tspan>
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
  if (!pass)
    throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  return { expected, actual, normalized: normalizeText(actual), pass };
}

async function main() {
  if (basename(paths.hero, '.webp') !== slug) throw new Error('Hero filename identity failed');
  if (basename(paths.inline, '.webp') !== inlineFilename)
    throw new Error('Inline filename identity failed');

  await Promise.all([
    mkdir(dirname(paths.hero), { recursive: true }),
    mkdir(dirname(paths.inline), { recursive: true }),
    mkdir(paths.qa, { recursive: true }),
  ]);

  const heroBase = await sharp(paths.heroSource)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const heroDocumentBlur = await sharp(heroBase)
    .extract({ left: 785, top: 350, width: 220, height: 115 })
    .blur(18)
    .png()
    .toBuffer();
  await sharp(heroBase)
    .composite([
      { input: heroDocumentBlur, top: 350, left: 785 },
      { input: heroTypography(), top: 0, left: 0 },
    ])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  const inlineBase = await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const inlineMapBlur = await sharp(inlineBase)
    .extract({ left: 305, top: 35, width: 205, height: 255 })
    .blur(10)
    .png()
    .toBuffer();
  const inlineCalculatorBlur = await sharp(inlineBase)
    .extract({ left: 760, top: 80, width: 120, height: 170 })
    .blur(12)
    .png()
    .toBuffer();
  await sharp(inlineBase)
    .composite([
      { input: inlineMapBlur, top: 35, left: 305 },
      { input: inlineCalculatorBlur, top: 80, left: 760 },
      { input: inlineTypography(), top: 0, left: 0 },
    ])
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

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave38-ocr-'));
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
          neutralized_art_text_region_count: 1,
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
          neutralized_art_text_region_count: 2,
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
