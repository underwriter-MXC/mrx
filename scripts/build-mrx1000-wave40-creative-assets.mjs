#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'understanding-fair-valuation-key-factors-for-assessing-your-mineral-rights-worth';
const title = "Understanding Fair Valuation: Key Factors for Assessing Your Mineral Rights' Worth";
const keyword = "How Will I Know if I'm Receiving a Fair Valuation for My Mineral Rights?";
const inlineFilename = 'how-will-i-know-if-im-receiving-a-fair-valuation-for-my-mineral-rights';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave40-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave40-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave40-creative-qa/${slug}`),
};

const generationPrompts = {
  hero: 'Photorealistic Texas mineral owner comparing balanced valuation evidence at a desk, with a title-safe navy field on the left and no readable text, letters, numbers, logos, watermarks, signatures, brands, currency figures, legal clauses, seals, or labeled charts.',
  inline:
    'Compositionally distinct six-factor fair-valuation symmetry audit with balanced ownership, production, commodity, development, uncertainty, and transaction-scope cues, plus a dark-navy keyword-safe band and no readable text, letters, numbers, logos, watermarks, signatures, brands, currency figures, legal clauses, seals, or labeled charts.',
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
        .title { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 38px; font-weight: 700; letter-spacing: -0.7px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect class="rule" x="52" y="164" width="72" height="5" rx="2.5" />
      <text class="title" x="52" y="225">
        <tspan x="52" dy="0">Understanding Fair</tspan>
        <tspan x="52" dy="47">Valuation: Key Factors for</tspan>
        <tspan x="52" dy="47">Assessing Your Mineral</tspan>
        <tspan x="52" dy="47">Rights' Worth</tspan>
      </text>
    </svg>
  `);
}

function inlineTypography() {
  return Buffer.from(`
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <style>
        .keyword { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 42px; font-weight: 700; text-anchor: middle; letter-spacing: -0.5px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect class="rule" x="530" y="34" width="140" height="5" rx="2.5" />
      <text class="keyword" x="600" y="86">
        <tspan x="600" dy="0">How Will I Know if I'm Receiving</tspan>
        <tspan x="600" dy="50">a Fair Valuation for My</tspan>
        <tspan x="600" dy="50">Mineral Rights?</tspan>
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
  const heroLeftDocumentBlur = await sharp(heroBase)
    .extract({ left: 630, top: 365, width: 190, height: 155 })
    .blur(10)
    .png()
    .toBuffer();
  const heroRightDocumentBlur = await sharp(heroBase)
    .extract({ left: 815, top: 360, width: 250, height: 155 })
    .blur(12)
    .png()
    .toBuffer();
  const heroForegroundMapBlur = await sharp(heroBase)
    .extract({ left: 520, top: 510, width: 270, height: 110 })
    .blur(12)
    .png()
    .toBuffer();
  const heroForegroundChartBlur = await sharp(heroBase)
    .extract({ left: 745, top: 540, width: 235, height: 85 })
    .blur(12)
    .png()
    .toBuffer();
  const heroCalculatorBlur = await sharp(heroBase)
    .extract({ left: 965, top: 520, width: 130, height: 70 })
    .blur(10)
    .png()
    .toBuffer();
  await sharp(heroBase)
    .composite([
      { input: heroLeftDocumentBlur, top: 365, left: 630 },
      { input: heroRightDocumentBlur, top: 360, left: 815 },
      { input: heroForegroundMapBlur, top: 510, left: 520 },
      { input: heroForegroundChartBlur, top: 540, left: 745 },
      { input: heroCalculatorBlur, top: 520, left: 965 },
      { input: heroTypography(), top: 0, left: 0 },
    ])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  const inlineBase = await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const inlineOwnershipDocumentBlur = await sharp(inlineBase)
    .extract({ left: 75, top: 355, width: 95, height: 85 })
    .blur(10)
    .png()
    .toBuffer();
  const inlineTransactionDocumentBlur = await sharp(inlineBase)
    .extract({ left: 1000, top: 520, width: 160, height: 100 })
    .blur(10)
    .png()
    .toBuffer();
  await sharp(inlineBase)
    .composite([
      { input: inlineOwnershipDocumentBlur, top: 355, left: 75 },
      { input: inlineTransactionDocumentBlur, top: 520, left: 1000 },
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

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave40-ocr-'));
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
          neutralized_art_text_region_count: 5,
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
