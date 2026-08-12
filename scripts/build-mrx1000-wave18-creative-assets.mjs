#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const title = 'Depth Severances and Formation Rights in Mineral Valuation';
const titleLines = ['Depth Severances and', 'Formation Rights in', 'Mineral Valuation'];
const keyword = 'depth severance formation rights valuation';

const paths = {
  heroSource: join(
    root,
    'artifacts/mrx1000-wave18-creative-sources/depth-severances-and-formation-rights-in-mineral-valuation-hero-base.png',
  ),
  inlineSource: join(
    root,
    'artifacts/mrx1000-wave18-creative-sources/depth-severances-and-formation-rights-in-mineral-valuation-inline-base.png',
  ),
  hero: join(
    root,
    'public/assets/articles/hero/depth-severances-and-formation-rights-in-mineral-valuation.webp',
  ),
  inline: join(
    root,
    'public/assets/articles/inline/depth-severances-and-formation-rights-in-mineral-valuation/depth-severance-formation-rights-valuation.webp',
  ),
  qa: join(
    root,
    'artifacts/mrx1000-wave18-creative-qa/depth-severances-and-formation-rights-in-mineral-valuation',
  ),
};

const generationPrompts = {
  hero:
    'Photorealistic subsurface title-and-geology analysis workspace with unlabelled geological layers, blank survey paper, drafting tools, core samples, and an abstract wellbore model; warm West Texas evening light and clean dark left-side title space; no words, numbers, labels, logos, identifiers, claims, or readable legal documents.',
  inline:
    'Distinct photorealistic overhead formation-rights analysis table with unlabelled geological layer tiles, a blank abstract cross-section, an unmarked straightedge, a geological hand lens, blank cards, and core samples; clean lower-right keyword space; no words, numbers, labels, identifiers, claims, or readable legal documents.',
};

function escapeXml(value) {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '\"': '&quot;' })[character],
  );
}

function normalizeText(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fileSha256(filePath) {
  return sha256(await readFile(filePath));
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

function heroOverlay() {
  const tspans = titleLines
    .map((line, index) => `<tspan x="58" y="${210 + index * 66}">${escapeXml(line)}</tspan>`)
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="hero-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#071e34" stop-opacity=".98"/>
        <stop offset=".47" stop-color="#071e34" stop-opacity=".9"/>
        <stop offset=".68" stop-color="#071e34" stop-opacity=".18"/>
        <stop offset="1" stop-color="#071e34" stop-opacity=".02"/>
      </linearGradient>
      <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".48"/>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#hero-shade)"/>
    <rect x="58" y="143" width="92" height="8" rx="4" fill="#d9a441"/>
    <text fill="#fffdf8" font-family="Arial,Helvetica,sans-serif" font-size="42" font-weight="700" letter-spacing="-.7" filter="url(#hero-shadow)">${tspans}</text>
  </svg>`);
}

function inlineOverlay() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
    <defs>
      <linearGradient id="inline-shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#071e34" stop-opacity="0"/>
        <stop offset=".52" stop-color="#071e34" stop-opacity=".06"/>
        <stop offset=".72" stop-color="#071e34" stop-opacity=".56"/>
        <stop offset="1" stop-color="#071e34" stop-opacity=".96"/>
      </linearGradient>
      <filter id="inline-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".36"/>
      </filter>
    </defs>
    <rect width="1200" height="675" fill="url(#inline-shade)"/>
    <rect x="714" y="368" width="88" height="8" rx="4" fill="#d9a441"/>
    <text x="714" y="434" fill="#fffdf8" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" letter-spacing="-.6" filter="url(#inline-shadow)">
      <tspan x="714" y="434">depth severance</tspan>
      <tspan x="714" y="490">formation rights</tspan>
      <tspan x="714" y="546">valuation</tspan>
    </text>
  </svg>`);
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
  if (!pass) {
    throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  }
  return { expected, actual, normalized: normalizeText(actual), pass };
}

async function main() {
  if (titleLines.join(' ') !== title) {
    throw new Error('Hero title lines do not reproduce the exact canonical title');
  }
  if (basename(paths.hero, '.webp') !== 'depth-severances-and-formation-rights-in-mineral-valuation') {
    throw new Error('Hero filename does not match the exact-title slug');
  }
  if (basename(paths.inline, '.webp') !== 'depth-severance-formation-rights-valuation') {
    throw new Error('Inline filename does not match the exact-keyword slug');
  }

  await Promise.all([
    mkdir(dirname(paths.hero), { recursive: true }),
    mkdir(dirname(paths.inline), { recursive: true }),
    mkdir(paths.qa, { recursive: true }),
  ]);

  await sharp(paths.heroSource)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: heroOverlay() }])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .composite([{ input: inlineOverlay() }])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.inline);

  for (const [source, prefix, sizes] of [
    [paths.hero, 'hero', [[600, 315], [300, 158]]],
    [paths.inline, 'inline', [[900, 506], [600, 338], [360, 203]]],
  ]) {
    for (const [width, height] of sizes) {
      await sharp(source)
        .resize(width, height, { fit: 'fill' })
        .png()
        .toFile(join(paths.qa, `${prefix}-${width}x${height}.png`));
    }
  }

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave18-ocr-'));
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
          public_path: '/assets/articles/hero/depth-severances-and-formation-rights-in-mineral-valuation.webp',
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
          public_path:
            '/assets/articles/inline/depth-severances-and-formation-rights-in-mineral-valuation/depth-severance-formation-rights-valuation.webp',
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
        exact_title_lines: titleLines.join(' ') === title,
        deterministic_typography: true,
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
