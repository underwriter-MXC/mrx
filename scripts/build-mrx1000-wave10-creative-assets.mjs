#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/texas-mineral-1031-exchange-base.png',
    path: 'public/assets/articles/texas-mineral-1031-exchange-wave10.webp',
    title: '1031 Exchange for Mineral Rights in Texas Explained',
    lines: ['1031 Exchange for Mineral Rights', 'in Texas Explained'],
    accent: '#D89A50',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/texas-mineral-1031-gain-planning-base.png',
    path: 'public/assets/articles/texas-mineral-1031-gain-planning-wave10.webp',
    title: 'Maximize Gains With 1031 Exchange for Texas Mineral Rights',
    lines: ['Maximize Gains With 1031 Exchange', 'for Texas Mineral Rights'],
    accent: '#D2AF62',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/mineral-rights-probate-outcomes-base.png',
    path: 'public/assets/articles/mineral-rights-probate-outcomes-wave10.webp',
    title: 'What Happens to Mineral Rights in Probate?',
    lines: ['What Happens to Mineral Rights', 'in Probate?'],
    accent: '#C19A60',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/inherited-mineral-estate-plan-base.png',
    path: 'public/assets/articles/inherited-mineral-estate-plan-wave10.webp',
    title: 'Understanding Estate Planning for Inherited Mineral Rights',
    lines: ['Understanding Estate Planning for', 'Inherited Mineral Rights'],
    accent: '#B9A36B',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/royalty-check-value-signals-base.png',
    path: 'public/assets/articles/royalty-check-value-signals-wave10.webp',
    title: 'Understanding Your Mineral Royalty Checks Value',
    lines: ['Understanding Your Mineral Royalty', 'Checks Value'],
    accent: '#67C7C5',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/texas-mineral-value-workflow-base.png',
    path: 'public/assets/articles/texas-mineral-value-workflow-wave10.webp',
    title: 'How to Determine the Value of Texas Mineral Rights',
    lines: ['How to Determine the Value of', 'Texas Mineral Rights'],
    accent: '#D8AF59',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/texas-mineral-value-levers-base.png',
    path: 'public/assets/articles/texas-mineral-value-levers-wave10.webp',
    title: 'Unlocking Value: Assessing Your Texas Mineral Rights',
    lines: ['Unlocking Value: Assessing Your', 'Texas Mineral Rights'],
    accent: '#91B69D',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/mineral-offer-red-flags-base.png',
    path: 'public/assets/articles/mineral-offer-red-flags-wave10.webp',
    title: 'How to Spot Predatory Mineral Rights Offers',
    lines: ['How to Spot Predatory', 'Mineral Rights Offers'],
    accent: '#D1795E',
  },
  {
    source:
      'artifacts/mrx1000-wave10-creative-sources/competing-mineral-offers-action-plan-base.png',
    path: 'public/assets/articles/competing-mineral-offers-action-plan-wave10.webp',
    title: 'What to Do When You Have Competing Offers on Your Mineral Rights: A Guide',
    lines: ['What to Do When You Have Competing', 'Offers on Your Mineral Rights: A Guide'],
    accent: '#76BFC5',
  },
  {
    source: 'artifacts/mrx1000-wave10-creative-sources/mineral-rights-value-primer-base.png',
    path: 'public/assets/articles/mineral-rights-value-primer-wave10.webp',
    title: 'Understanding the Value of Your Mineral Rights',
    lines: ['Understanding the Value of', 'Your Mineral Rights'],
    accent: '#C7A458',
  },
];

function escapeXml(value) {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character],
  );
}

function overlayFor(creative) {
  const fontSize = creative.title.length > 62 ? 39 : creative.title.length > 52 ? 42 : 46;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#071923" stop-opacity=".82"/>
        <stop offset=".52" stop-color="#071923" stop-opacity=".12"/>
        <stop offset="1" stop-color="#071923" stop-opacity=".42"/>
      </linearGradient>
      <style>
        .title{fill:#FFFDF8;font-family:Arial,Helvetica,sans-serif;font-weight:750;letter-spacing:-.45px}
        .brand{fill:#FFFDF8;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:.2px}
      </style>
    </defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <rect x="48" y="32" width="1104" height="248" rx="30" fill="#071923" fill-opacity=".80" stroke="${creative.accent}" stroke-width="3"/>
    <text x="600" y="126" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(creative.lines[0])}</text>
    <text x="600" y="190" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(creative.lines[1])}</text>
    <rect x="925" y="566" width="227" height="42" rx="18" fill="#071923" fill-opacity=".78"/>
    <text x="1132" y="593" text-anchor="end" class="brand" font-size="18">MineralRightsXchange</text>
  </svg>`);
}

for (const creative of creatives) {
  if (creative.lines.join(' ') !== creative.title) {
    throw new Error(`${creative.path}: title lines do not reproduce the exact canonical title`);
  }

  const source = join(root, creative.source);
  const output = join(root, creative.path);
  await mkdir(dirname(output), { recursive: true });

  await sharp(source)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlayFor(creative) }])
    .webp({ quality: 92, smartSubsample: true })
    .toFile(output);

  const previewRoot = join(
    root,
    'artifacts/mrx1000-wave10-creative-qa',
    basename(creative.path, '.webp'),
  );
  await mkdir(previewRoot, { recursive: true });
  for (const [width, height] of [
    [600, 315],
    [300, 158],
  ]) {
    await sharp(output)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toFile(join(previewRoot, `${width}x${height}.png`));
  }

  console.log(`${creative.path}: ${creative.title}`);
}
