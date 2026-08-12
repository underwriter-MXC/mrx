#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'understanding-market-demand-how-it-influences-the-value-of-your-mineral-rights';
const title = 'Understanding Market Demand: How It Influences the Value of Your Mineral Rights';
const keyword = 'How Does the Market Demand Affect the Price I Can Expect for My Rights?';
const inlineFilename = 'how-does-the-market-demand-affect-the-price-i-can-expect-for-my-rights';
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave41-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave41-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/${inlineFilename}.webp`),
  qa: join(root, `artifacts/mrx1000-wave41-creative-qa/${slug}`),
};

const generationPrompts = {
  hero: 'Photorealistic Texas mineral owner and analyst reviewing layered commodity, development, and buyer-demand evidence, with a title-safe navy field on the left and no readable text, letters, numbers, logos, watermarks, signatures, brands, currency figures, legal clauses, seals, or labeled charts.',
  inline:
    'Compositionally distinct three-zone commodity-market, Texas-development, and acquisition-demand narrative with a dark-navy keyword-safe band and no readable text, letters, numbers, logos, watermarks, signatures, brands, currency figures, legal clauses, seals, or labeled charts.',
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
        .title { fill: #fffaf0; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; letter-spacing: -0.7px; }
        .rule { fill: #d79a2b; }
      </style>
      <rect class="rule" x="52" y="158" width="72" height="5" rx="2.5" />
      <text class="title" x="52" y="219">
        <tspan x="52" dy="0">Understanding Market</tspan>
        <tspan x="52" dy="49">Demand: How It Influences</tspan>
        <tspan x="52" dy="49">the Value of Your</tspan>
        <tspan x="52" dy="49">Mineral Rights</tspan>
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
        <tspan x="600" dy="0">How Does the Market Demand</tspan>
        <tspan x="600" dy="50">Affect the Price I Can Expect</tspan>
        <tspan x="600" dy="50">for My Rights?</tspan>
      </text>
    </svg>
  `);
}

function inlineSealNeutralizer() {
  return Buffer.from(`
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <g fill="#1b2d49" stroke="#2c4363" stroke-width="2">
        <ellipse cx="1048" cy="326" rx="18" ry="13" />
        <ellipse cx="916" cy="404" rx="20" ry="14" />
        <ellipse cx="1184" cy="365" rx="18" ry="13" />
        <ellipse cx="923" cy="598" rx="20" ry="15" />
        <ellipse cx="1161" cy="520" rx="18" ry="14" />
      </g>
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
  const heroLaptopScreenBlur = await sharp(heroBase)
    .extract({ left: 970, top: 305, width: 190, height: 190 })
    .blur(14)
    .png()
    .toBuffer();
  await sharp(heroBase)
    .composite([
      { input: heroLaptopScreenBlur, top: 305, left: 970 },
      { input: heroTypography(), top: 0, left: 0 },
    ])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  const inlineBase = await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  await sharp(inlineBase)
    .composite([
      { input: inlineSealNeutralizer(), top: 0, left: 0 },
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

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave41-ocr-'));
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
          neutralized_art_text_region_count: 5,
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
