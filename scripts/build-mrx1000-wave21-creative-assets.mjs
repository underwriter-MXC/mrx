#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const slug = 'existing-wells-vs-future-locations-in-a-dcf-model';
const title = 'Existing Wells vs. Future Locations in a DCF Model';
const titleLines = ['Existing Wells vs.', 'Future Locations in', 'a DCF Model'];
const keyword = 'existing wells future locations DCF';
const keywordLines = ['existing wells', 'future locations', 'DCF'];
const paths = {
  heroSource: join(root, `artifacts/mrx1000-wave21-creative-sources/${slug}-hero-base.png`),
  inlineSource: join(root, `artifacts/mrx1000-wave21-creative-sources/${slug}-inline-base.png`),
  hero: join(root, `public/assets/articles/hero/${slug}.webp`),
  inline: join(root, `public/assets/articles/inline/${slug}/existing-wells-future-locations-dcf.webp`),
  qa: join(root, `artifacts/mrx1000-wave21-creative-qa/${slug}`),
};

const generationPrompts = {
  hero:
    'Photorealistic split evidence scene: a producing pumpjack, separate surveyed-but-undrilled stakes, an unlabeled decline sheet, and an assumption folder; clean dark left title panel; no readable words, numbers, labels, logos, identifiers, claims, or owner-specific data.',
  inline:
    'Distinct overhead scenario board: a physical pumpjack and observed decline cards separated from empty location tiles, permit folders, a blank timeline, and uncertainty tokens; clean dark right keyword panel; no readable words, numbers, labels, logos, identifiers, claims, or owner-specific data.',
};

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) =>
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

function overlay(lines, { x, firstY, step, fontSize, width, height }) {
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" y="${firstY + index * step}">${escapeXml(line)}</tspan>`)
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".46"/>
      </filter>
    </defs>
    <rect x="${x}" y="${firstY - 52}" width="92" height="8" rx="4" fill="#d9a441"/>
    <text fill="#fffdf8" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="-.5" filter="url(#shadow)">${tspans}</text>
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
  if (!pass) throw new Error(`${basename(filePath)} OCR mismatch: expected ${expected}; received ${actual}`);
  return { expected, actual, normalized: normalizeText(actual), pass };
}

async function main() {
  if (titleLines.join(' ') !== title) throw new Error('Hero lines do not reproduce the exact title');
  if (keywordLines.join(' ') !== keyword) throw new Error('Inline lines do not reproduce the exact keyword');
  if (basename(paths.hero, '.webp') !== slug) throw new Error('Hero filename identity failed');
  if (basename(paths.inline, '.webp') !== 'existing-wells-future-locations-dcf') {
    throw new Error('Inline filename identity failed');
  }

  await Promise.all([
    mkdir(dirname(paths.hero), { recursive: true }),
    mkdir(dirname(paths.inline), { recursive: true }),
    mkdir(paths.qa, { recursive: true }),
  ]);

  await sharp(paths.heroSource)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay(titleLines, { x: 56, firstY: 245, step: 58, fontSize: 40, width: 1200, height: 630 }) }])
    .webp({ quality: 92, smartSubsample: true, effort: 6 })
    .toFile(paths.hero);

  await sharp(paths.inlineSource)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay(keywordLines, { x: 712, firstY: 292, step: 58, fontSize: 40, width: 1200, height: 675 }) }])
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

  const tempDirectory = await mkdtemp(join(tmpdir(), 'mrx-wave21-ocr-'));
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
          public_path: `/assets/articles/inline/${slug}/existing-wells-future-locations-dcf.webp`,
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
        exact_keyword_lines: keywordLines.join(' ') === keyword,
        deterministic_typography: true,
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
