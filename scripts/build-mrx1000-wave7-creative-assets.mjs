#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/valuation-methodology-price-factors-wave7.webp',
    title: 'Understanding Valuation Methodology: How It Affects Your Mineral Rights Transaction Price',
    lines: ['Understanding Valuation Methodology:', 'How It Affects Your Mineral Rights', 'Transaction Price'],
    palette: ['#173B57', '#091F31', '#7EC8E3', '#E5F4F9'],
    motif: 'methodology',
  },
  {
    path: 'public/assets/articles/mineral-rights-value-drivers-wave7.webp',
    title: 'What Determines the Value of Your Mineral Rights?',
    lines: ['What Determines the Value', 'of Your Mineral Rights?'],
    palette: ['#244B35', '#10281B', '#8FD19E', '#E9F5EC'],
    motif: 'drivers',
  },
  {
    path: 'public/assets/articles/multiple-texas-offers-comparison-wave7.webp',
    title: 'How to Get Multiple Offers for Your Texas Mineral Rights',
    lines: ['How to Get Multiple Offers for', 'Your Texas Mineral Rights'],
    palette: ['#4A3B19', '#2A210B', '#E0C35D', '#F7F0D3'],
    motif: 'offers',
  },
  {
    path: 'public/assets/articles/lowball-offer-checklist-wave7.webp',
    title: 'How to Identify Lowball Mineral Rights Offers',
    lines: ['How to Identify Lowball', 'Mineral Rights Offers'],
    palette: ['#58342B', '#301A15', '#E59B7F', '#F9E8E1'],
    motif: 'lowball',
  },
  {
    path: 'public/assets/articles/transaction-red-flags-wave7.webp',
    title: 'Identifying Red Flags in Mineral Rights Transactions',
    lines: ['Identifying Red Flags in', 'Mineral Rights Transactions'],
    palette: ['#5A2530', '#321119', '#EF879B', '#FBE6EA'],
    motif: 'redflags',
  },
  {
    path: 'public/assets/articles/inherited-mineral-value-records-wave7.webp',
    title: 'Understand the Value of Your Inherited Mineral Rights',
    lines: ['Understand the Value of Your', 'Inherited Mineral Rights'],
    palette: ['#403B70', '#1E1B3F', '#AAA7EA', '#EEEDFA'],
    motif: 'inheritance',
  },
  {
    path: 'public/assets/articles/texas-basin-county-value-map-wave7.webp',
    title: 'Top Texas Counties for Mineral Rights Value: Permian, Eagle Ford, and Haynesville',
    lines: ['Top Texas Counties for Mineral Rights', 'Value: Permian, Eagle Ford,', 'and Haynesville'],
    palette: ['#1C4C56', '#0A2930', '#66CAD6', '#E2F5F7'],
    motif: 'basins',
  },
  {
    path: 'public/assets/articles/surface-vs-mineral-estates-wave7.webp',
    title: 'The Difference Between Surface Rights and Mineral Rights in Texas',
    lines: ['The Difference Between Surface Rights', 'and Mineral Rights in Texas'],
    palette: ['#493824', '#281D10', '#D6A96C', '#F5EBDD'],
    motif: 'estates',
  },
  {
    path: 'public/assets/articles/free-review-fees-wave7.webp',
    title: 'Are There Any Fees for a Free Underwriter Review of Your Mineral Rights?',
    lines: ['Are There Any Fees for a Free', 'Underwriter Review of Your', 'Mineral Rights?'],
    palette: ['#24503F', '#0D2B20', '#81D0A9', '#E6F6EE'],
    motif: 'free',
  },
  {
    path: 'public/assets/articles/underwriter-review-process-wave7.webp',
    title: 'What to Expect During the Underwriter Review Process for Your Mineral Rights',
    lines: ['What to Expect During the', 'Underwriter Review Process for', 'Your Mineral Rights'],
    palette: ['#293E5D', '#111F34', '#91B5E8', '#E8EFF9'],
    motif: 'process',
  },
];

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]);
}

function titleMarkup(lines) {
  const fontSize = lines.length === 2 ? 50 : 42;
  const lineHeight = lines.length === 2 ? 65 : 54;
  const firstY = lines.length === 2 ? 125 : 87;
  return lines.map((line, index) =>
    `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
  ).join('\n');
}

function motifMarkup(kind, colors) {
  const [bg, panel, accent, soft] = colors;
  const accentStroke = `stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const panelStroke = `stroke="${panel}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  if (kind === 'methodology') return `
    <circle cx="235" cy="462" r="72" fill="${soft}"/><circle cx="600" cy="462" r="72" fill="${accent}"/><circle cx="965" cy="462" r="72" fill="${soft}"/>
    <path d="M315 462h205M680 462h205" ${accentStroke}/><path d="M205 462h60M235 432v60M565 462h70M600 427v70M935 462h60" ${panelStroke}/>`;
  if (kind === 'drivers') return `
    <rect x="135" y="370" width="930" height="200" rx="30" fill="${soft}"/>
    <path d="M200 515l145-90 120 55 150-105 135 72 160-42 125 95" ${panelStroke}/>
    <circle cx="345" cy="425" r="18" fill="${accent}"/><circle cx="615" cy="375" r="18" fill="${accent}"/><circle cx="910" cy="405" r="18" fill="${accent}"/>`;
  if (kind === 'offers') return `
    <rect x="120" y="375" width="260" height="170" rx="24" fill="${soft}"/><rect x="470" y="350" width="260" height="220" rx="24" fill="${accent}"/><rect x="820" y="390" width="260" height="140" rx="24" fill="${soft}"/>
    <path d="M175 425h150M175 468h115M525 410h150M525 453h150M525 496h105M875 435h150M875 478h110" ${panelStroke}/>`;
  if (kind === 'lowball') return `
    <rect x="185" y="355" width="830" height="225" rx="30" fill="${soft}"/>
    <path d="M250 420h480M250 470h390M250 520h300" ${panelStroke}/>
    <circle cx="875" cy="467" r="65" fill="${panel}"/><path d="M845 467l20 20 42-50" ${accentStroke}/>`;
  if (kind === 'redflags') return `
    <path d="M260 550V355M260 365h300l-55 62 55 62H260" fill="${accent}" stroke="${soft}" stroke-width="6"/>
    <path d="M700 550V385M700 395h270l-50 55 50 55H700" fill="${soft}" stroke="${accent}" stroke-width="6"/>`;
  if (kind === 'inheritance') return `
    <rect x="125" y="390" width="270" height="165" rx="24" fill="${soft}"/><rect x="805" y="390" width="270" height="165" rx="24" fill="${soft}"/>
    <circle cx="600" cy="470" r="82" fill="${accent}"/><path d="M205 440h110M205 485h145M885 440h110M885 485h145M410 470h100M690 470h100" ${panelStroke}/>`;
  if (kind === 'basins') return `
    <path d="M170 520l95-145 125 55 105-75 125 105 135-95 185 150z" fill="${soft}" stroke="${accent}" stroke-width="7"/>
    <circle cx="315" cy="432" r="22" fill="${panel}"/><circle cx="620" cy="458" r="22" fill="${panel}"/><circle cx="855" cy="414" r="22" fill="${panel}"/>`;
  if (kind === 'estates') return `
    <rect x="135" y="355" width="930" height="105" rx="24" fill="${soft}"/><rect x="135" y="470" width="930" height="105" rx="24" fill="${accent}"/>
    <path d="M190 407h820M190 522h820M600 365v85M600 480v85" ${panelStroke}/>`;
  if (kind === 'free') return `
    <rect x="225" y="360" width="750" height="215" rx="34" fill="${soft}"/>
    <path d="M295 420h410M295 470h320M295 520h250" ${panelStroke}/>
    <circle cx="830" cy="468" r="66" fill="${panel}"/><path d="M795 468l24 24 49-58" ${accentStroke}/>`;
  return `
    <circle cx="215" cy="470" r="58" fill="${soft}"/><circle cx="500" cy="470" r="58" fill="${accent}"/><circle cx="785" cy="470" r="58" fill="${soft}"/><circle cx="1030" cy="470" r="58" fill="${accent}"/>
    <path d="M280 470h150M565 470h150M850 470h110" ${accentStroke}/><path d="M400 437l40 33-40 33M685 437l40 33-40 33M930 437l40 33-40 33" ${accentStroke}/>`;
}

function svgFor(creative) {
  const [bg, panel, accent, soft] = creative.palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${panel}"/></linearGradient>
      <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" fill="none" stroke="${soft}" stroke-width="1" opacity=".09"/></pattern>
      <style>.title{fill:#fffdf7;font-family:Arial,Helvetica,sans-serif;font-weight:750;letter-spacing:-.45px}.brand{fill:${soft};font-family:Arial,Helvetica,sans-serif;font-weight:700}</style>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#grid)"/>
    <rect x="65" y="35" width="1070" height="285" rx="34" fill="${panel}" opacity=".97" stroke="${accent}" stroke-width="3"/>
    ${titleMarkup(creative.lines)}
    ${motifMarkup(creative.motif, creative.palette)}
    <text x="1115" y="605" text-anchor="end" class="brand" font-size="18">MineralRightsXchange</text>
  </svg>`;
}

for (const creative of creatives) {
  if (creative.lines.join(' ') !== creative.title) {
    throw new Error(`${creative.path}: title lines do not reproduce the exact canonical title`);
  }
  const output = join(root, creative.path);
  await mkdir(dirname(output), { recursive: true });
  await sharp(Buffer.from(svgFor(creative))).webp({ quality: 92, smartSubsample: true }).toFile(output);
  const previewRoot = join(root, 'artifacts/mrx1000-wave7-creative-qa', basename(creative.path, '.webp'));
  await mkdir(previewRoot, { recursive: true });
  for (const [width, height] of [[600, 315], [300, 158]]) {
    await sharp(output).resize(width, height, { fit: 'fill' }).png().toFile(join(previewRoot, `${width}x${height}.png`));
  }
  console.log(`${creative.path}: ${creative.title}`);
}
