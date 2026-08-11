#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(repoRoot, 'src', 'content', 'posts');
const publicDir = join(repoRoot, 'public');
const manifestPath = join(repoRoot, 'config', 'mrx-article-two-image-retrofit.json');
const artifactDir = join(repoRoot, 'artifacts', 'mrx-article-two-image-retrofit');
const write = process.argv.includes('--write');
const remediateCurrent = process.argv.includes('--remediate-current');
const rerenderSlugs = new Set(
  (process.argv.find((value) => value.startsWith('--rerender-slugs='))?.split('=')[1] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const previewSlug = process.argv
  .find((value) => value.startsWith('--preview-slug='))
  ?.split('=')[1];
let ocrEngine;
let ocrTempDir;
const sanitizedSourceCache = new Map();

const HERO_WIDTH = 1200;
const HERO_HEIGHT = 630;
const INLINE_WIDTH = 1200;
const INLINE_HEIGHT = 675;

function frontmatter(source, filePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Missing frontmatter: ${filePath}`);
  return match[1];
}

function unquote(value) {
  return value
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .replace(/''/g, "'");
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  return unquote(nested.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function asBoolean(value) {
  return value === 'true';
}

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

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function yamlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function estimatedTextWidth(value, fontSize) {
  let units = 0;
  for (const character of value) {
    if (/\s/.test(character)) units += 0.29;
    else if (/[MW@%&]/.test(character)) units += 0.84;
    else if (/[A-Z0-9]/.test(character)) units += 0.64;
    else if (/[ilI1.,:;!'’|]/.test(character)) units += 0.28;
    else units += 0.53;
  }
  return units * fontSize;
}

function wrapText(value, fontSize, maxWidth) {
  const words = value.trim().split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || estimatedTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitText(value, { maxWidth, maxHeight, maxFontSize, minFontSize, lineHeight = 1.08 }) {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    const lines = wrapText(value, fontSize, maxWidth);
    const height = lines.length * fontSize * lineHeight;
    const everyLineFits = lines.every((line) => estimatedTextWidth(line, fontSize) <= maxWidth);
    if (height <= maxHeight && everyLineFits) return { fontSize, lines, lineHeight };
  }
  const lines = wrapText(value, minFontSize, maxWidth);
  return { fontSize: minFontSize, lines, lineHeight };
}

function titleSvg(title) {
  const fit = fitText(title, {
    maxWidth: 650,
    maxHeight: 480,
    maxFontSize: 68,
    minFontSize: 30,
    lineHeight: 1.06,
  });
  const totalHeight = fit.lines.length * fit.fontSize * fit.lineHeight;
  const firstBaseline = (HERO_HEIGHT - totalHeight) / 2 + fit.fontSize * 0.86;
  const tspans = fit.lines
    .map(
      (line, index) =>
        `<tspan x="64" y="${Math.round(firstBaseline + index * fit.fontSize * fit.lineHeight)}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return Buffer.from(`
    <svg width="${HERO_WIDTH}" height="${HERO_HEIGHT}" viewBox="0 0 ${HERO_WIDTH} ${HERO_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
      </defs>
      <path d="M0 0H820C772 134 770 272 804 408C824 486 830 560 812 630H0Z" fill="#071e34"/>
      <rect x="64" y="${Math.round(firstBaseline - fit.fontSize - 25)}" width="86" height="8" rx="4" fill="#d09a42"/>
      <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fit.fontSize}" font-weight="700" letter-spacing="-1.2" filter="url(#shadow)">${tspans}</text>
    </svg>
  `);
}

const INLINE_ACCENTS = [
  '#d09a42',
  '#2f8f9d',
  '#b86642',
  '#6f8f4e',
  '#8e6aa9',
  '#c37b92',
  '#3d78a8',
  '#9b7a31',
];

function inlineVisualSpec(identity) {
  const digest = createHash('sha256').update(identity).digest();
  const family = digest[0] % 4;
  const theme = digest[1] % 2 === 0 ? 'dark' : 'light';
  const accent = INLINE_ACCENTS[digest[2] % INLINE_ACCENTS.length];
  const variation = digest[3] % 5;
  return {
    id: `full-bleed-${family}-${theme}-${variation}`,
    family,
    theme,
    accent,
    variation,
    flop: (digest[4] & 1) === 1,
    motifA: digest[5] % 100,
    motifB: digest[6] % 100,
  };
}

function inlineTextSvg(phrase, spec) {
  const vertical = spec.family < 2;
  const panelShift = spec.variation * 12;
  const region =
    spec.family === 0
      ? { x: 58, y: 46, width: 438 + panelShift, height: 583 }
      : spec.family === 1
        ? { x: 700 - panelShift, y: 46, width: 438 + panelShift, height: 583 }
        : spec.family === 2
          ? { x: 70, y: 390 - panelShift, width: 1060, height: 235 + panelShift }
          : { x: 70, y: 50, width: 1060, height: 235 + panelShift };
  const fit = fitText(phrase, {
    maxWidth: region.width,
    maxHeight: region.height,
    maxFontSize: vertical ? 64 : 60,
    minFontSize: vertical ? 25 : 28,
    lineHeight: 1.08,
  });
  const totalHeight = fit.lines.length * fit.fontSize * fit.lineHeight;
  const firstBaseline = region.y + (region.height - totalHeight) / 2 + fit.fontSize * 0.86;
  const tspans = fit.lines
    .map(
      (line, index) =>
        `<tspan x="${region.x}" y="${Math.round(firstBaseline + index * fit.fontSize * fit.lineHeight)}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  const dark = spec.theme === 'dark';
  const panelFill = dark ? '#071e34' : '#fffaf1';
  const panelOpacity = dark ? 0.93 : 0.94;
  const textFill = dark ? '#ffffff' : '#071e34';
  const shift = spec.variation * 12;
  const panelPath =
    spec.family === 0
      ? `M0 0H${550 + shift}C${610 + shift} 130 ${500 + shift} 300 ${575 + shift} 470C${610 + shift} 555 ${595 + shift} 620 ${570 + shift} 675H0Z`
      : spec.family === 1
        ? `M${650 - shift} 0H1200V675H${630 - shift}C${585 - shift} 560 ${705 - shift} 420 ${635 - shift} 260C${600 - shift} 175 ${615 - shift} 80 ${650 - shift} 0Z`
        : spec.family === 2
          ? `M0 ${350 - shift}C260 ${315 - shift} 430 ${390 - shift} 650 ${352 - shift}C875 ${314 - shift} 1010 ${375 - shift} 1200 ${330 - shift}V675H0Z`
          : `M0 0H1200V${315 + shift}C960 ${365 + shift} 760 ${300 + shift} 530 ${350 + shift}C300 ${400 + shift} 145 ${325 + shift} 0 ${372 + shift}Z`;
  const motifX = Math.round((spec.motifA / 100) * 880 + 120);
  const motifY = Math.round((spec.motifB / 100) * 475 + 100);
  const accentMarker = vertical
    ? `<rect x="${region.x}" y="${Math.round(firstBaseline - fit.fontSize - 24)}" width="${72 + spec.variation * 7}" height="8" rx="4" fill="${spec.accent}"/>`
    : `<circle cx="${region.x + 9}" cy="${Math.round(firstBaseline - fit.fontSize - 18)}" r="9" fill="${spec.accent}"/>`;

  return Buffer.from(`
    <svg width="${INLINE_WIDTH}" height="${INLINE_HEIGHT}" viewBox="0 0 ${INLINE_WIDTH} ${INLINE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="inline-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.34"/>
        </filter>
      </defs>
      <path d="${panelPath}" fill="${panelFill}" fill-opacity="${panelOpacity}"/>
      <circle cx="${motifX}" cy="${motifY}" r="${92 + spec.variation * 13}" fill="none" stroke="${spec.accent}" stroke-width="18" stroke-opacity="0.12"/>
      <path d="M${Math.max(0, motifX - 185)} ${motifY + 115}H${Math.min(1200, motifX + 185)}" stroke="${spec.accent}" stroke-width="5" stroke-opacity="0.2"/>
      ${accentMarker}
      <text fill="${textFill}" font-family="Arial, Helvetica, sans-serif" font-size="${fit.fontSize}" font-weight="700" letter-spacing="-0.8" filter="url(#inline-shadow)">${tspans}</text>
    </svg>
  `);
}

async function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
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

function runOcrBoxes(filePath) {
  const output = execFileSync(ocrEngine.command, ['--json', filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

async function sanitizedSourceArt(sourcePath) {
  if (sanitizedSourceCache.has(sourcePath)) return sanitizedSourceCache.get(sourcePath);
  const promise = (async () => {
    const { data, info } = await sharp(sourcePath).toBuffer({ resolveWithObject: true });
    const observations = runOcrBoxes(sourcePath).filter(
      (observation) =>
        observation.confidence >= 0.25 && normalizedOcr(observation.text).length >= 2,
    );
    if (observations.length === 0) {
      return { data, width: info.width, height: info.height, observations };
    }
    const blurred = await sharp(data).blur(32).toBuffer();
    const composites = [];
    for (const observation of observations) {
      const rawLeft = observation.x * info.width;
      const rawTop = (1 - observation.y - observation.height) * info.height;
      const rawWidth = observation.width * info.width;
      const rawHeight = observation.height * info.height;
      const padX = Math.max(18, rawWidth * 0.08);
      const padY = Math.max(12, rawHeight * 0.28);
      const left = Math.max(0, Math.floor(rawLeft - padX));
      const top = Math.max(0, Math.floor(rawTop - padY));
      const right = Math.min(info.width, Math.ceil(rawLeft + rawWidth + padX));
      const bottom = Math.min(info.height, Math.ceil(rawTop + rawHeight + padY));
      const regionWidth = right - left;
      const regionHeight = bottom - top;
      if (regionWidth < 1 || regionHeight < 1) continue;
      const region = await sharp(blurred)
        .extract({ left, top, width: regionWidth, height: regionHeight })
        .toBuffer();
      composites.push({ input: region, left, top });
    }
    const sanitized = await sharp(data).composite(composites).toBuffer();
    return { data: sanitized, width: info.width, height: info.height, observations };
  })();
  sanitizedSourceCache.set(sourcePath, promise);
  return promise;
}

async function lowerSourceArt(sourcePath, width, height, { flop = false, blur = 1.2 } = {}) {
  const sanitized = await sanitizedSourceArt(sourcePath);
  const cropWidth = Math.min(
    sanitized.width,
    Math.max(1, Math.round(sanitized.height * (width / height))),
  );
  const maxLeft = sanitized.width - cropWidth;
  let bestLeft = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  const step = Math.max(1, Math.floor(maxLeft / 32));
  for (let candidate = 0; candidate <= maxLeft; candidate += step) {
    const right = candidate + cropWidth;
    const textOverlap = sanitized.observations.reduce((sum, observation) => {
      const textLeft = observation.x * sanitized.width;
      const textRight = textLeft + observation.width * sanitized.width;
      const overlap = Math.max(0, Math.min(right, textRight) - Math.max(candidate, textLeft));
      return sum + overlap * observation.height * sanitized.height;
    }, 0);
    if (textOverlap < bestScore) {
      bestScore = textOverlap;
      bestLeft = candidate;
    }
  }
  if (maxLeft - bestLeft < step) bestLeft = maxLeft;
  let pipeline = sharp(sanitized.data)
    .extract({ left: bestLeft, top: 0, width: cropWidth, height: sanitized.height })
    .resize(width, height, { fit: 'cover', position: 'attention' });
  if (flop) pipeline = pipeline.flop();
  return pipeline.modulate({ brightness: 0.86, saturation: 0.82 }).blur(blur).toBuffer();
}

async function renderHero(sourcePath, targetPath, title) {
  const art = await lowerSourceArt(sourcePath, 480, HERO_HEIGHT);
  await sharp({
    create: {
      width: HERO_WIDTH,
      height: HERO_HEIGHT,
      channels: 4,
      background: '#071e34',
    },
  })
    .composite([
      { input: art, left: 720, top: 0 },
      {
        input: Buffer.from(
          `<svg width="480" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="630" fill="#071e34" fill-opacity="0.18"/></svg>`,
        ),
        left: 720,
        top: 0,
      },
      { input: titleSvg(title), left: 0, top: 0 },
    ])
    .webp({ quality: 90, effort: 6 })
    .toFile(targetPath);
}

async function renderInline(sourcePath, targetPath, phrase, spec) {
  const art = await lowerSourceArt(sourcePath, INLINE_WIDTH, INLINE_HEIGHT, {
    flop: spec.flop,
    blur: 1.1,
  });
  const canvas = await sharp({
    create: {
      width: INLINE_WIDTH,
      height: INLINE_HEIGHT,
      channels: 4,
      background: '#071e34',
    },
  })
    .composite([
      { input: art, left: 0, top: 0 },
      {
        input: Buffer.from(
          `<svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="675" fill="#071e34" fill-opacity="0.12"/></svg>`,
        ),
        left: 0,
        top: 0,
      },
      { input: inlineTextSvg(phrase, spec), left: 0, top: 0 },
    ])
    .webp({ quality: 90, effort: 6 })
    .toFile(targetPath);
  return canvas;
}

async function neutralizeArtPanelText(filePath, kind, inlineSpec) {
  const observations = runOcrBoxes(filePath).filter((observation) => {
    const centerX = observation.x + observation.width / 2;
    if (kind === 'hero') return centerX >= 0.6;
    const centerTopY = 1 - (observation.y + observation.height / 2);
    if (inlineSpec.family === 0) return centerX >= 0.58;
    if (inlineSpec.family === 1) return centerX <= 0.48;
    if (inlineSpec.family === 2) return centerTopY <= 0.45;
    return centerTopY >= 0.56;
  });
  if (observations.length === 0) return 0;
  const { data, info } = await sharp(filePath).toBuffer({ resolveWithObject: true });
  const blurred = await sharp(data).blur(32).toBuffer();
  const composites = [];
  for (const observation of observations) {
    const rawLeft = observation.x * info.width;
    const rawTop = (1 - observation.y - observation.height) * info.height;
    const rawWidth = observation.width * info.width;
    const rawHeight = observation.height * info.height;
    const padX = Math.max(12, rawWidth * 0.12);
    const padY = Math.max(10, rawHeight * 0.3);
    const left = Math.max(0, Math.floor(rawLeft - padX));
    const top = Math.max(0, Math.floor(rawTop - padY));
    const right = Math.min(info.width, Math.ceil(rawLeft + rawWidth + padX));
    const bottom = Math.min(info.height, Math.ceil(rawTop + rawHeight + padY));
    const regionWidth = right - left;
    const regionHeight = bottom - top;
    if (regionWidth < 1 || regionHeight < 1) continue;
    const region = await sharp(blurred)
      .extract({ left, top, width: regionWidth, height: regionHeight })
      .toBuffer();
    composites.push({ input: region, left, top });
  }
  const output = await sharp(data)
    .composite(composites)
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  writeFileSync(filePath, output);
  return composites.length;
}

function normalizedOcr(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function prepareOcrEngine() {
  ocrTempDir = mkdtempSync(join(tmpdir(), 'mrx-image-ocr-'));
  const binary = join(ocrTempDir, 'ocr-image-text');
  execFileSync('swiftc', [join(repoRoot, 'scripts', 'ocr-image-text.swift'), '-o', binary], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  ocrEngine = { command: binary, args: (filePath) => [filePath] };
}

function runOcr(filePath, expected) {
  try {
    const output = execFileSync(ocrEngine.command, ocrEngine.args(filePath), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const actual = normalizedOcr(output);
    const normalizedExpected = normalizedOcr(expected);
    const uppercaseIConfusable =
      /\bai\b/.test(normalizedExpected) &&
      (normalizedExpected.replace(/\bai\b/g, 'al') === actual ||
        normalizedExpected.replace(/\bai\b/g, 'a1') === actual);
    return {
      expected,
      actual: output.trim(),
      normalized_expected: normalizedExpected,
      normalized_actual: actual,
      uppercase_i_confusable_accepted: uppercaseIConfusable,
      pass: actual === normalizedExpected || uppercaseIConfusable,
    };
  } catch (error) {
    return { expected, actual: '', pass: false, error: error.message };
  }
}

function heroAlt(title) {
  const composed = `MRX article cover with the title “${title}”.`;
  return composed.length <= 125 ? composed : title;
}

function inlineAlt(phrase) {
  const composed = `Mineral-rights illustration highlighting “${phrase}”.`;
  return composed.length <= 125 ? composed : phrase;
}

function replaceTopLevelBlock(block, key, replacement) {
  const pattern = new RegExp(`^${key}:\\s*\\n(?:^[ \\t].*(?:\\r?\\n|$))*`, 'm');
  if (!pattern.test(block)) throw new Error(`Missing ${key} frontmatter block`);
  return block.replace(pattern, `${replacement}\n`);
}

function upsertScalar(block, key, value) {
  const pattern = new RegExp(`^${key}:\\s*.*$`, 'm');
  if (pattern.test(block)) return block.replace(pattern, `${key}: ${yamlString(value)}`);
  return `${block}\n${key}: ${yamlString(value)}`;
}

function rewriteArticleSource(source, post, row) {
  const oldFrontmatter = frontmatter(source, post.file_path);
  const heroBlock = [
    'hero_image:',
    `  src: ${yamlString(row.hero.public_path)}`,
    `  alt: ${yamlString(row.hero.alt)}`,
    `  width: ${HERO_WIDTH}`,
    `  height: ${HERO_HEIGHT}`,
    `  mime_type: 'image/webp'`,
    `  social_src: ${yamlString(row.hero.public_path)}`,
    `  social_alt: ${yamlString(row.hero.alt)}`,
    `  social_width: ${HERO_WIDTH}`,
    `  social_height: ${HERO_HEIGHT}`,
    `  social_mime_type: 'image/webp'`,
    `  prompt: ${yamlString(`MRX-owned article artwork with deterministic exact-title composition: ${post.title}`)}`,
    `  source: ${yamlString(`MRX-owned derivative of ${row.source_public_path}`)}`,
    `  license: 'MRX-owned'`,
    `  perceptual_hash: ${yamlString(row.hero.perceptual_hash)}`,
  ].join('\n');
  const inlineBlock = [
    'inline_image:',
    `  src: ${yamlString(row.inline.public_path)}`,
    `  alt: ${yamlString(row.inline.alt)}`,
    `  rendered_text: ${yamlString(post.keyword)}`,
    `  width: ${INLINE_WIDTH}`,
    `  height: ${INLINE_HEIGHT}`,
    `  mime_type: 'image/webp'`,
    `  prompt: ${yamlString(`Distinct MRX-owned in-body composition with deterministic exact-keyword text: ${post.keyword}`)}`,
    `  source: ${yamlString(`MRX-owned derivative of ${row.source_public_path}`)}`,
    `  license: 'MRX-owned'`,
    `  perceptual_hash: ${yamlString(row.inline.perceptual_hash)}`,
  ].join('\n');

  let nextFrontmatter = replaceTopLevelBlock(oldFrontmatter, 'hero_image', heroBlock);
  if (/^inline_image:\s*$/m.test(nextFrontmatter)) {
    nextFrontmatter = replaceTopLevelBlock(nextFrontmatter, 'inline_image', inlineBlock);
  } else {
    nextFrontmatter = nextFrontmatter.replace(`${heroBlock}\n`, `${heroBlock}\n${inlineBlock}\n`);
  }
  nextFrontmatter = upsertScalar(nextFrontmatter, 'updated_at', row.generated_at_utc);
  return source.replace(oldFrontmatter, nextFrontmatter);
}

async function createContactSheets(rows, kind) {
  const width = 1200;
  const tileWidth = 300;
  const tileHeight = kind === 'hero' ? 158 : 169;
  const columns = 4;
  const pageSize = 20;
  const paths = [];
  for (let start = 0; start < rows.length; start += pageSize) {
    const pageRows = rows.slice(start, start + pageSize);
    const rowCount = Math.ceil(pageRows.length / columns);
    const composites = [];
    for (let index = 0; index < pageRows.length; index += 1) {
      const row = pageRows[index];
      const input = await sharp(join(publicDir, row[kind].public_path.slice(1)))
        .resize(tileWidth, tileHeight, { fit: 'contain', background: '#071e34' })
        .toBuffer();
      composites.push({
        input,
        left: (index % columns) * tileWidth,
        top: Math.floor(index / columns) * tileHeight,
      });
    }
    const path = join(
      artifactDir,
      `${kind}-contact-sheet-${String(start / pageSize + 1).padStart(2, '0')}.webp`,
    );
    await sharp({
      create: {
        width,
        height: rowCount * tileHeight,
        channels: 4,
        background: '#071e34',
      },
    })
      .composite(composites)
      .webp({ quality: 92, effort: 5 })
      .toFile(path);
    paths.push(relative(repoRoot, path));
  }
  return paths;
}

function loadPreviousManifest() {
  if (!existsSync(manifestPath)) return new Map();
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return new Map(manifest.rows.map((row) => [row.slug, row]));
}

function discoverPosts(previousRows) {
  return readdirSync(postsDir)
    .filter((name) => name.endsWith('.mdx'))
    .sort()
    .map((name) => {
      const filePath = join(postsDir, name);
      const source = readFileSync(filePath, 'utf8');
      const fm = frontmatter(source, filePath);
      const publicationStatus = scalar(fm, 'publication_status');
      const draft = asBoolean(scalar(fm, 'draft'));
      const noindex = asBoolean(scalar(fm, 'noindex'));
      if (publicationStatus !== 'published' || draft || noindex) return null;
      const slug = name.replace(/\.mdx$/, '');
      const title = scalar(fm, 'title');
      const keyword = scalar(fm, 'primary_keyword') || title;
      const currentHero = nestedScalar(fm, 'hero_image', 'src');
      const previous = previousRows.get(slug);
      const sourcePublicPath = previous?.source_public_path ?? currentHero;
      return {
        slug,
        title,
        keyword,
        source,
        file_path: filePath,
        source_public_path: sourcePublicPath,
        hero_public_path: `/assets/articles/hero/${textSlug(title)}.webp`,
        inline_public_path: `/assets/articles/inline/${slug}/${textSlug(keyword)}.webp`,
      };
    })
    .filter(Boolean);
}

async function main() {
  const previousRows = loadPreviousManifest();
  const posts = discoverPosts(previousRows);
  const problems = [];
  const allTargets = new Set();
  for (const post of posts) {
    const sourcePath = join(publicDir, post.source_public_path.replace(/^\//, ''));
    if (!post.source_public_path.startsWith('/')) problems.push(`${post.slug}: remote source`);
    if (!existsSync(sourcePath)) problems.push(`${post.slug}: missing ${post.source_public_path}`);
    for (const target of [post.hero_public_path, post.inline_public_path]) {
      if (allTargets.has(target)) problems.push(`${post.slug}: target collision ${target}`);
      allTargets.add(target);
    }
  }

  const audit = {
    public_article_count: posts.length,
    source_count: new Set(posts.map((post) => post.source_public_path)).size,
    target_count: allTargets.size,
    problems,
  };
  if (previewSlug) {
    const post = posts.find((candidate) => candidate.slug === previewSlug);
    if (!post) throw new Error(`Unknown preview slug: ${previewSlug}`);
    if (problems.length > 0) throw new Error(`Retrofit audit failed:\n${problems.join('\n')}`);
    const previewDir = join(artifactDir, 'preview');
    mkdirSync(previewDir, { recursive: true });
    const sourcePath = join(publicDir, post.source_public_path.slice(1));
    const heroPath = join(previewDir, `${post.slug}-hero.webp`);
    const inlinePath = join(previewDir, `${post.slug}-inline.webp`);
    const inlineSpec = inlineVisualSpec(post.slug);
    prepareOcrEngine();
    await renderHero(sourcePath, heroPath, post.title);
    await renderInline(sourcePath, inlinePath, post.keyword, inlineSpec);
    const heroNeutralizedRegionCount = await neutralizeArtPanelText(heroPath, 'hero');
    const inlineNeutralizedRegionCount = await neutralizeArtPanelText(
      inlinePath,
      'inline',
      inlineSpec,
    );
    console.log(
      JSON.stringify(
        {
          hero_path: relative(repoRoot, heroPath),
          hero_neutralized_art_text_region_count: heroNeutralizedRegionCount,
          hero_ocr: runOcr(heroPath, post.title),
          inline_path: relative(repoRoot, inlinePath),
          inline_visual_variant: inlineSpec.id,
          inline_neutralized_art_text_region_count: inlineNeutralizedRegionCount,
          inline_ocr: runOcr(inlinePath, post.keyword),
        },
        null,
        2,
      ),
    );
    if (ocrTempDir) rmSync(ocrTempDir, { recursive: true, force: true });
    return;
  }
  if (rerenderSlugs.size > 0) {
    if (!existsSync(manifestPath)) throw new Error('Cannot rerender without the retrofit manifest');
    if (problems.length > 0) throw new Error(`Retrofit audit failed:\n${problems.join('\n')}`);
    mkdirSync(artifactDir, { recursive: true });
    prepareOcrEngine();
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    for (const slug of rerenderSlugs) {
      const post = posts.find((candidate) => candidate.slug === slug);
      const row = manifest.rows.find((candidate) => candidate.slug === slug);
      if (!post || !row) throw new Error(`Missing post or manifest row for rerender: ${slug}`);
      const sourcePath = join(publicDir, post.source_public_path.slice(1));
      const heroPath = join(publicDir, row.hero.public_path.slice(1));
      const inlinePath = join(publicDir, row.inline.public_path.slice(1));
      const inlineSpec = inlineVisualSpec(post.slug);
      await renderHero(sourcePath, heroPath, post.title);
      await renderInline(sourcePath, inlinePath, post.keyword, inlineSpec);
      const heroNeutralized = await neutralizeArtPanelText(heroPath, 'hero');
      const inlineNeutralized = await neutralizeArtPanelText(inlinePath, 'inline', inlineSpec);
      const [heroMetadata, inlineMetadata] = await Promise.all([
        sharp(heroPath).metadata(),
        sharp(inlinePath).metadata(),
      ]);
      row.source_public_path = post.source_public_path;
      row.generated_at_utc = generatedAt;
      row.hero = {
        ...row.hero,
        alt: heroAlt(post.title),
        width: heroMetadata.width,
        height: heroMetadata.height,
        mime_type: `image/${heroMetadata.format}`,
        sha256: await sha256(heroPath),
        perceptual_hash: await perceptualHash(heroPath),
        neutralized_art_text_region_count: heroNeutralized,
        ocr: runOcr(heroPath, post.title),
      };
      row.inline = {
        ...row.inline,
        alt: inlineAlt(post.keyword),
        rendered_text: post.keyword,
        visual_variant: inlineSpec.id,
        width: inlineMetadata.width,
        height: inlineMetadata.height,
        mime_type: `image/${inlineMetadata.format}`,
        sha256: await sha256(inlinePath),
        perceptual_hash: await perceptualHash(inlinePath),
        neutralized_art_text_region_count: inlineNeutralized,
        ocr: runOcr(inlinePath, post.keyword),
      };
      writeFileSync(post.file_path, rewriteArticleSource(post.source, post, row));
      console.log(`rerender ${slug} hero=${row.hero.ocr.pass} inline=${row.inline.ocr.pass}`);
    }
    const contactSheets = {
      hero: await createContactSheets(manifest.rows, 'hero'),
      inline: await createContactSheets(manifest.rows, 'inline'),
    };
    const summary = {
      article_count: manifest.rows.length,
      asset_count: manifest.rows.length * 2,
      unique_source_art_count: new Set(manifest.rows.map((row) => row.source_public_path)).size,
      unique_hero_sha256_count: new Set(manifest.rows.map((row) => row.hero.sha256)).size,
      unique_inline_sha256_count: new Set(manifest.rows.map((row) => row.inline.sha256)).size,
      distinct_article_pair_count: manifest.rows.filter(
        (row) => row.hero.sha256 !== row.inline.sha256,
      ).length,
      hero_ocr_pass_count: manifest.rows.filter((row) => row.hero.ocr.pass).length,
      inline_ocr_pass_count: manifest.rows.filter((row) => row.inline.ocr.pass).length,
      exact_filename_identity_count: manifest.rows.filter(
        (row) =>
          basename(row.hero.public_path, extname(row.hero.public_path)) === textSlug(row.title) &&
          basename(row.inline.public_path, extname(row.inline.public_path)) === textSlug(row.keyword),
      ).length,
    };
    manifest.generated_at_utc = generatedAt;
    manifest.summary = summary;
    manifest.contact_sheets = contactSheets;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(
      join(artifactDir, 'verification-summary.json'),
      `${JSON.stringify({ generated_at_utc: generatedAt, summary, contact_sheets: contactSheets }, null, 2)}\n`,
    );
    console.log(JSON.stringify(summary, null, 2));
    if (ocrTempDir) rmSync(ocrTempDir, { recursive: true, force: true });
    if (
      summary.exact_filename_identity_count !== manifest.rows.length ||
      summary.unique_source_art_count !== manifest.rows.length ||
      summary.unique_hero_sha256_count !== manifest.rows.length ||
      summary.unique_inline_sha256_count !== manifest.rows.length ||
      summary.distinct_article_pair_count !== manifest.rows.length ||
      summary.hero_ocr_pass_count !== manifest.rows.length ||
      summary.inline_ocr_pass_count !== manifest.rows.length
    ) {
      process.exitCode = 1;
    }
    return;
  }
  if (remediateCurrent) {
    if (!existsSync(manifestPath))
      throw new Error('Cannot remediate without the retrofit manifest');
    if (problems.length > 0) throw new Error(`Retrofit audit failed:\n${problems.join('\n')}`);
    mkdirSync(artifactDir, { recursive: true });
    prepareOcrEngine();
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const failedRows = manifest.rows.filter((row) => !row.hero.ocr.pass || !row.inline.ocr.pass);
    for (const row of failedRows) {
      const post = posts.find((candidate) => candidate.slug === row.slug);
      if (!post) throw new Error(`Missing post for remediation: ${row.slug}`);
      const heroPath = join(publicDir, row.hero.public_path.slice(1));
      const inlinePath = join(publicDir, row.inline.public_path.slice(1));
      const heroNeutralized = await neutralizeArtPanelText(heroPath, 'hero');
      const inlineSpec = inlineVisualSpec(row.slug);
      const inlineNeutralized = await neutralizeArtPanelText(inlinePath, 'inline', inlineSpec);
      row.generated_at_utc = generatedAt;
      row.hero.neutralized_art_text_region_count =
        (row.hero.neutralized_art_text_region_count ?? 0) + heroNeutralized;
      row.hero.sha256 = await sha256(heroPath);
      row.hero.perceptual_hash = await perceptualHash(heroPath);
      row.hero.ocr = runOcr(heroPath, row.title);
      row.inline.neutralized_art_text_region_count =
        (row.inline.neutralized_art_text_region_count ?? 0) + inlineNeutralized;
      row.inline.sha256 = await sha256(inlinePath);
      row.inline.perceptual_hash = await perceptualHash(inlinePath);
      row.inline.ocr = runOcr(inlinePath, row.keyword);
      const nextSource = rewriteArticleSource(post.source, post, row);
      writeFileSync(post.file_path, nextSource);
      console.log(`remediate ${row.slug} hero=${row.hero.ocr.pass} inline=${row.inline.ocr.pass}`);
    }
    const contactSheets = {
      hero: await createContactSheets(manifest.rows, 'hero'),
      inline: await createContactSheets(manifest.rows, 'inline'),
    };
    const summary = {
      article_count: manifest.rows.length,
      asset_count: manifest.rows.length * 2,
      unique_source_art_count: new Set(manifest.rows.map((row) => row.source_public_path)).size,
      unique_hero_sha256_count: new Set(manifest.rows.map((row) => row.hero.sha256)).size,
      unique_inline_sha256_count: new Set(manifest.rows.map((row) => row.inline.sha256)).size,
      distinct_article_pair_count: manifest.rows.filter(
        (row) => row.hero.sha256 !== row.inline.sha256,
      ).length,
      hero_ocr_pass_count: manifest.rows.filter((row) => row.hero.ocr.pass).length,
      inline_ocr_pass_count: manifest.rows.filter((row) => row.inline.ocr.pass).length,
      exact_filename_identity_count: manifest.rows.filter(
        (row) =>
          basename(row.hero.public_path, extname(row.hero.public_path)) === textSlug(row.title) &&
          basename(row.inline.public_path, extname(row.inline.public_path)) ===
            textSlug(row.keyword),
      ).length,
    };
    manifest.generated_at_utc = generatedAt;
    manifest.summary = summary;
    manifest.contact_sheets = contactSheets;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(
      join(artifactDir, 'verification-summary.json'),
      `${JSON.stringify({ generated_at_utc: generatedAt, summary, contact_sheets: contactSheets }, null, 2)}\n`,
    );
    console.log(JSON.stringify(summary, null, 2));
    if (ocrTempDir) rmSync(ocrTempDir, { recursive: true, force: true });
    if (
      summary.exact_filename_identity_count !== manifest.rows.length ||
      summary.unique_source_art_count !== manifest.rows.length ||
      summary.unique_hero_sha256_count !== manifest.rows.length ||
      summary.unique_inline_sha256_count !== manifest.rows.length ||
      summary.distinct_article_pair_count !== manifest.rows.length ||
      summary.hero_ocr_pass_count !== manifest.rows.length ||
      summary.inline_ocr_pass_count !== manifest.rows.length
    ) {
      process.exitCode = 1;
    }
    return;
  }
  if (!write) {
    console.log(JSON.stringify(audit, null, 2));
    if (problems.length > 0) process.exitCode = 1;
    return;
  }
  if (problems.length > 0) throw new Error(`Retrofit audit failed:\n${problems.join('\n')}`);

  mkdirSync(join(publicDir, 'assets', 'articles', 'hero'), { recursive: true });
  mkdirSync(join(publicDir, 'assets', 'articles', 'inline'), { recursive: true });
  mkdirSync(artifactDir, { recursive: true });
  prepareOcrEngine();
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const rows = [];
  let completed = 0;
  for (const post of posts) {
    const sourcePath = join(publicDir, post.source_public_path.slice(1));
    const heroPath = join(publicDir, post.hero_public_path.slice(1));
    const inlinePath = join(publicDir, post.inline_public_path.slice(1));
    const inlineSpec = inlineVisualSpec(post.slug);
    mkdirSync(dirname(heroPath), { recursive: true });
    mkdirSync(dirname(inlinePath), { recursive: true });
    await renderHero(sourcePath, heroPath, post.title);
    await renderInline(sourcePath, inlinePath, post.keyword, inlineSpec);
    const heroNeutralizedRegionCount = await neutralizeArtPanelText(heroPath, 'hero');
    const inlineNeutralizedRegionCount = await neutralizeArtPanelText(
      inlinePath,
      'inline',
      inlineSpec,
    );
    const [heroMetadata, inlineMetadata] = await Promise.all([
      sharp(heroPath).metadata(),
      sharp(inlinePath).metadata(),
    ]);
    const row = {
      slug: post.slug,
      title: post.title,
      keyword: post.keyword,
      file_path: relative(repoRoot, post.file_path),
      source_public_path: post.source_public_path,
      generated_at_utc: generatedAt,
      hero: {
        public_path: post.hero_public_path,
        alt: heroAlt(post.title),
        width: heroMetadata.width,
        height: heroMetadata.height,
        mime_type: `image/${heroMetadata.format}`,
        sha256: await sha256(heroPath),
        perceptual_hash: await perceptualHash(heroPath),
        neutralized_art_text_region_count: heroNeutralizedRegionCount,
        ocr: runOcr(heroPath, post.title),
      },
      inline: {
        public_path: post.inline_public_path,
        alt: inlineAlt(post.keyword),
        rendered_text: post.keyword,
        visual_variant: inlineSpec.id,
        width: inlineMetadata.width,
        height: inlineMetadata.height,
        mime_type: `image/${inlineMetadata.format}`,
        sha256: await sha256(inlinePath),
        perceptual_hash: await perceptualHash(inlinePath),
        neutralized_art_text_region_count: inlineNeutralizedRegionCount,
        ocr: runOcr(inlinePath, post.keyword),
      },
    };
    const nextSource = rewriteArticleSource(post.source, post, row);
    writeFileSync(post.file_path, nextSource);
    rows.push(row);
    completed += 1;
    console.log(`retrofit ${completed}/${posts.length} ${post.slug}`);
  }

  const contactSheets = {
    hero: await createContactSheets(rows, 'hero'),
    inline: await createContactSheets(rows, 'inline'),
  };
  const summary = {
    article_count: rows.length,
    asset_count: rows.length * 2,
    unique_source_art_count: new Set(rows.map((row) => row.source_public_path)).size,
    unique_hero_sha256_count: new Set(rows.map((row) => row.hero.sha256)).size,
    unique_inline_sha256_count: new Set(rows.map((row) => row.inline.sha256)).size,
    distinct_article_pair_count: rows.filter((row) => row.hero.sha256 !== row.inline.sha256).length,
    hero_ocr_pass_count: rows.filter((row) => row.hero.ocr.pass).length,
    inline_ocr_pass_count: rows.filter((row) => row.inline.ocr.pass).length,
    exact_filename_identity_count: rows.filter(
      (row) =>
        basename(row.hero.public_path, extname(row.hero.public_path)) === textSlug(row.title) &&
        basename(row.inline.public_path, extname(row.inline.public_path)) === textSlug(row.keyword),
    ).length,
  };
  const manifest = {
    artifact_type: 'mrx_article_two_image_retrofit',
    schema_version: 1,
    generated_at_utc: generatedAt,
    policy_source:
      'AI Atom Brain/09 Project Packs/MRX/2026-08-11 MRX Two-Image Article Creative Directive.md',
    summary,
    contact_sheets: contactSheets,
    rows,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(artifactDir, 'verification-summary.json'),
    `${JSON.stringify({ generated_at_utc: generatedAt, summary, contact_sheets: contactSheets }, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary, null, 2));
  if (ocrTempDir) rmSync(ocrTempDir, { recursive: true, force: true });
  if (
    summary.exact_filename_identity_count !== rows.length ||
    summary.unique_source_art_count !== rows.length ||
    summary.unique_hero_sha256_count !== rows.length ||
    summary.unique_inline_sha256_count !== rows.length ||
    summary.distinct_article_pair_count !== rows.length ||
    summary.hero_ocr_pass_count !== rows.length ||
    summary.inline_ocr_pass_count !== rows.length
  ) {
    process.exitCode = 1;
  }
}

await main();
