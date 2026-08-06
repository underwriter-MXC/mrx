#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/mineral-rights-acquisition-platform.webp',
    title: [
      'Why Our AI-Powered Mineral Rights',
      'Platform Is Different From Other',
      'Acquisition Services',
    ],
    palette: { bg: '#172A3A', panel: '#0D1B2A', accent: '#49C6E5', soft: '#D9F3FA' },
    motif: 'ai',
  },
  {
    path: 'public/assets/articles/predatory-mineral-rights-buyers-2.webp',
    title: ['How We Protect Mineral Rights', 'Sellers From Predatory Tactics'],
    palette: { bg: '#17352A', panel: '#0E241C', accent: '#E9B44C', soft: '#F9E7B8' },
    motif: 'shield',
  },
  {
    path: 'public/assets/articles/mineral-rights-direct-buyer-risks.webp',
    title: [
      'Risks of Selling Your Mineral Rights',
      'to a Direct Buyer: What to Know',
      'Before You Sign',
    ],
    palette: { bg: '#3A1D2D', panel: '#25111D', accent: '#F58A8A', soft: '#F9D6D6' },
    motif: 'contract',
  },
  {
    path: 'public/assets/articles/mineral-rights-assessment.webp',
    title: ['Key Factors That Determine Your', 'Mineral Rights Assessment', 'Pricing Range'],
    palette: { bg: '#1E2751', panel: '#121936', accent: '#A6D189', soft: '#E0F0D4' },
    motif: 'factors',
  },
  {
    path: 'public/assets/articles/how-to-identify-and-avoid-hidden-fees-in-mineral-rights-assessment-process.webp',
    title: [
      'How to Identify and Avoid Hidden',
      'Fees in Your Mineral Rights',
      'Assessment Process',
    ],
    palette: { bg: '#4A2C12', panel: '#2C190B', accent: '#66D9C7', soft: '#D6F5EF' },
    motif: 'fees',
  },
];

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
    return entities[character];
  });
}

function titleSvg(lines) {
  const fontSize = lines.length === 2 ? 59 : 50;
  const lineHeight = lines.length === 2 ? 72 : 59;
  const firstY = lines.length === 2 ? 122 : 88;
  return lines
    .map(
      (line, index) =>
        `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function motifSvg(kind, palette) {
  const stroke = `stroke="${palette.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  if (kind === 'ai') {
    return `
      <rect x="145" y="380" width="210" height="120" rx="24" fill="${palette.soft}" opacity=".95"/>
      <rect x="495" y="380" width="210" height="120" rx="24" fill="${palette.soft}" opacity=".95"/>
      <rect x="845" y="380" width="210" height="120" rx="24" fill="${palette.soft}" opacity=".95"/>
      <path d="M355 440H495M705 440H845" ${stroke}/>
      <circle cx="600" cy="440" r="42" ${stroke}/>
      <path d="M585 418c18-20 46 0 30 20 20 15-1 44-22 27-18 10-35-11-20-27-11-16-2-31 12-20z" ${stroke}/>
      <path d="M190 416h120M190 444h88M540 473h120M890 414h120M890 444h94M890 474h68" stroke="${palette.bg}" stroke-width="9" stroke-linecap="round"/>
    `;
  }
  if (kind === 'shield') {
    return `
      <rect x="160" y="380" width="280" height="145" rx="24" fill="${palette.soft}"/>
      <path d="M215 425h165M215 461h118M215 497h145" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
      <path d="M605 360l105 38v78c0 66-43 110-105 139-62-29-105-73-105-139v-78z" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="10"/>
      <path d="M558 470l31 31 65-76" ${stroke}/>
      <circle cx="890" cy="440" r="76" fill="${palette.soft}"/>
      <path d="M850 440h80M890 400v80" stroke="${palette.bg}" stroke-width="11" stroke-linecap="round"/>
      <path d="M750 515h155" ${stroke}/>
    `;
  }
  if (kind === 'contract') {
    return `
      <rect x="150" y="360" width="315" height="190" rx="24" fill="${palette.soft}"/>
      <path d="M205 410h205M205 450h160M205 490h112" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
      <path d="M527 430h135l-32-32M662 430l-32 32" ${stroke}/>
      <rect x="730" y="360" width="315" height="190" rx="24" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="7"/>
      <circle cx="825" cy="445" r="43" ${stroke}/>
      <path d="M859 479l42 42M934 407v92M900 453h68" ${stroke}/>
    `;
  }
  if (kind === 'factors') {
    return `
      <path d="M155 505h890" stroke="${palette.soft}" stroke-width="8" stroke-linecap="round" opacity=".6"/>
      <rect x="190" y="430" width="120" height="75" rx="16" fill="${palette.soft}"/>
      <rect x="355" y="390" width="120" height="115" rx="16" fill="${palette.accent}"/>
      <rect x="520" y="345" width="120" height="160" rx="16" fill="${palette.soft}"/>
      <rect x="685" y="410" width="120" height="95" rx="16" fill="${palette.accent}"/>
      <rect x="850" y="370" width="120" height="135" rx="16" fill="${palette.soft}"/>
      <path d="M250 405v-48M415 365v-62M580 320v-38M745 385v-58M910 345v-76" ${stroke}/>
      <circle cx="250" cy="351" r="14" fill="${palette.accent}"/><circle cx="415" cy="297" r="14" fill="${palette.soft}"/><circle cx="580" cy="276" r="14" fill="${palette.accent}"/><circle cx="745" cy="321" r="14" fill="${palette.soft}"/><circle cx="910" cy="263" r="14" fill="${palette.accent}"/>
    `;
  }
  return `
    <rect x="170" y="350" width="390" height="210" rx="24" fill="${palette.soft}"/>
    <path d="M225 402h275M225 442h215M225 482h250M225 522h120" stroke="${palette.bg}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="725" cy="435" r="92" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="11"/>
    <path d="M790 500l82 82" ${stroke}/>
    <path d="M690 395h62M721 369v132M690 475h62" ${stroke}/>
    <path d="M915 382h105M915 432h78M915 482h105" ${stroke}/>
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
          <path d="M48 0H0V48" fill="none" stroke="${palette.soft}" stroke-width="1" opacity=".11"/>
        </pattern>
        <style>
          .title { fill: #fffdf7; font-family: Arial, Helvetica, sans-serif; font-weight: 750; letter-spacing: -.6px; }
          .brand { fill: ${palette.soft}; font-family: Arial, Helvetica, sans-serif; font-weight: 700; }
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
    'artifacts/mrx1000-wave4-creative-qa',
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
