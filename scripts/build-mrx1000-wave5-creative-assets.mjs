#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/sell-mineral-rights-timeline-texas-wave5.webp',
    title: ['How Long Does It Take to Sell', 'Mineral Rights in Texas?'],
    palette: { bg: '#102A43', panel: '#071A2B', accent: '#F6C85F', soft: '#D7EAF5' },
    motif: 'timeline',
  },
  {
    path: 'public/assets/articles/selling-texas-mineral-rights-process-wave5.webp',
    title: ['How the Step-by-Step Process', 'of Selling Texas Mineral Rights', 'Works'],
    palette: { bg: '#143B35', panel: '#082620', accent: '#74D3AE', soft: '#DFF6EC' },
    motif: 'process',
  },
  {
    path: 'public/assets/articles/after-selling-mineral-rights-texas-wave5.webp',
    title: ['What Happens After You Sell Your', 'Mineral Rights in Texas?'],
    palette: { bg: '#3A254F', panel: '#21152E', accent: '#D8A7E8', soft: '#F1E4F6' },
    motif: 'handoff',
  },
  {
    path: 'public/assets/articles/negotiate-mineral-rights-sale-wave5.webp',
    title: ['How to Negotiate a Mineral Rights', 'Sale: What Sellers Need to Know'],
    palette: { bg: '#4A2D1B', panel: '#2A180D', accent: '#F0A868', soft: '#F8E4CF' },
    motif: 'negotiate',
  },
  {
    path: 'public/assets/articles/mineral-rights-offer-range-factors-wave5.webp',
    title: ['Understanding the Key Factors', 'Influencing Your Mineral Rights', 'Offer Range'],
    palette: { bg: '#18365A', panel: '#0B223D', accent: '#65C7D0', soft: '#DCF2F4' },
    motif: 'range',
  },
];

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
    return entities[character];
  });
}

function titleSvg(lines) {
  const fontSize = lines.length === 2 ? 57 : 49;
  const lineHeight = lines.length === 2 ? 70 : 58;
  const firstY = lines.length === 2 ? 125 : 91;
  return lines
    .map(
      (line, index) =>
        `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function motifSvg(kind, palette) {
  const stroke = `stroke="${palette.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  if (kind === 'timeline') {
    return `
      <path d="M165 465H1035" stroke="${palette.soft}" stroke-width="9" stroke-linecap="round" opacity=".75"/>
      ${[210, 405, 600, 795, 990]
        .map(
          (x, index) => `
            <circle cx="${x}" cy="465" r="38" fill="${index % 2 ? palette.accent : palette.soft}"/>
            <text x="${x}" y="475" text-anchor="middle" class="step" font-size="27">${index + 1}</text>
            <path d="M${x} 420V385" ${stroke}/>
          `,
        )
        .join('')}
      <path d="M1010 435l40 30-40 30" ${stroke}/>
    `;
  }
  if (kind === 'process') {
    return `
      ${[150, 350, 550, 750, 950]
        .map(
          (x, index) => `
            <rect x="${x}" y="385" width="130" height="130" rx="24" fill="${index % 2 ? palette.accent : palette.soft}"/>
            <text x="${x + 65}" y="462" text-anchor="middle" class="step" font-size="32">${index + 1}</text>
            ${index < 4 ? `<path d="M${x + 140} 450H${x + 185}" ${stroke}/>` : ''}
          `,
        )
        .join('')}
      <path d="M1050 418l36 32-36 32" ${stroke}/>
    `;
  }
  if (kind === 'handoff') {
    return `
      <rect x="155" y="355" width="290" height="205" rx="24" fill="${palette.soft}"/>
      <path d="M210 410h180M210 452h145M210 494h168" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
      <path d="M485 458H700M662 420l42 38-42 38" ${stroke}/>
      <rect x="755" y="355" width="290" height="205" rx="24" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="7"/>
      <path d="M815 412h170M815 454h120" stroke="${palette.soft}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="905" cy="510" r="34" ${stroke}/><path d="M886 510l14 14 27-31" ${stroke}/>
    `;
  }
  if (kind === 'negotiate') {
    return `
      <rect x="155" y="370" width="300" height="165" rx="24" fill="${palette.soft}"/>
      <path d="M215 425h180M215 470h125" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
      <rect x="745" y="370" width="300" height="165" rx="24" fill="${palette.soft}"/>
      <path d="M805 425h180M860 470h125" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
      <path d="M455 452h290M555 410l45 42-45 42M645 410l-45 42 45 42" ${stroke}/>
      <circle cx="600" cy="452" r="60" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="9"/>
      <path d="M575 452l18 18 35-40" ${stroke}/>
    `;
  }
  return `
    <path d="M170 500h860" stroke="${palette.soft}" stroke-width="8" stroke-linecap="round" opacity=".55"/>
    ${[
      [205, 435, 110],
      [365, 395, 150],
      [525, 350, 195],
      [685, 410, 135],
      [845, 375, 170],
    ]
      .map(
        ([x, y, height], index) => `
          <rect x="${x}" y="${y}" width="110" height="${height}" rx="18" fill="${index % 2 ? palette.accent : palette.soft}"/>
          <circle cx="${x + 55}" cy="${y - 28}" r="13" fill="${index % 2 ? palette.soft : palette.accent}"/>
        `,
      )
      .join('')}
    <path d="M190 390c160-50 285 38 430-10 140-46 255-30 390-45" ${stroke}/>
  `;
}

function buildSvg(creative) {
  const { palette } = creative;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette.bg}"/>
          <stop offset="1" stop-color="${palette.panel}"/>
        </linearGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="${palette.soft}" stroke-width="1" opacity=".10"/>
        </pattern>
        <style>
          .title { fill: #fffdf7; font-family: Arial, Helvetica, sans-serif; font-weight: 750; letter-spacing: -.6px; }
          .brand { fill: ${palette.soft}; font-family: Arial, Helvetica, sans-serif; font-weight: 700; }
          .step { fill: ${palette.panel}; font-family: Arial, Helvetica, sans-serif; font-weight: 800; }
        </style>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#grid)"/>
      <rect x="70" y="45" width="1060" height="275" rx="34" fill="${palette.panel}" opacity=".96" stroke="${palette.accent}" stroke-width="3"/>
      ${titleSvg(creative.title)}
      ${motifSvg(creative.motif, palette)}
      <text x="1110" y="602" text-anchor="end" class="brand" font-size="18">MineralRightsXchange</text>
    </svg>
  `;
}

for (const creative of creatives) {
  const output = join(root, creative.path);
  await mkdir(dirname(output), { recursive: true });
  await sharp(Buffer.from(buildSvg(creative)))
    .webp({ quality: 92, smartSubsample: true })
    .toFile(output);

  const previewRoot = join(
    root,
    'artifacts/mrx1000-wave5-creative-qa',
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
  console.log(`${creative.path}: ${creative.title.join(' ')}`);
}
