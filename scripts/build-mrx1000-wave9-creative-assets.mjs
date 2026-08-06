#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/mineral-worth-assessment-workbook-wave9.webp',
    title: 'Unlocking Value: A Comprehensive Guide to Assessing Your Mineral Rights Worth',
    lines: ['Unlocking Value: A Comprehensive Guide', 'to Assessing Your Mineral Rights Worth'],
    palette: ['#173E59', '#092438', '#76C9D6', '#E3F5F7'],
    motif: 'evidence-layers',
  },
  {
    path: 'public/assets/articles/verify-mineral-buyer-wave9.webp',
    title: 'How to Identify Predatory Mineral Buyers',
    lines: ['How to Identify Predatory', 'Mineral Buyers'],
    palette: ['#5C3528', '#311A13', '#EF9A72', '#FAE9E1'],
    motif: 'buyer-check',
  },
  {
    path: 'public/assets/articles/competing-offer-call-prep-wave9.webp',
    title: 'Navigating Competing Offers: What to Do Before Your Mineral Rights Assessment Call',
    lines: ['Navigating Competing Offers: What to Do', 'Before Your Mineral Rights Assessment Call'],
    palette: ['#284C68', '#132A3D', '#8DB9E0', '#E8F1F8'],
    motif: 'offer-compare',
  },
  {
    path: 'public/assets/articles/mineral-offer-scam-defense-wave9.webp',
    title: 'Understanding Mineral Rights Offer Scams: What You Need to Know',
    lines: ['Understanding Mineral Rights Offer Scams:', 'What You Need to Know'],
    palette: ['#59354E', '#2C1927', '#D695C2', '#F6E8F1'],
    motif: 'shield',
  },
  {
    path: 'public/assets/articles/estate-mineral-management-wave9.webp',
    title: 'Managing Mineral Interests in Estate Planning Explained',
    lines: ['Managing Mineral Interests in', 'Estate Planning Explained'],
    palette: ['#3F4D29', '#202916', '#AECF78', '#EEF5E3'],
    motif: 'estate-map',
  },
  {
    path: 'public/assets/articles/inherited-texas-minerals-wave9.webp',
    title: 'Understanding Inherited Mineral Rights in Texas',
    lines: ['Understanding Inherited Mineral Rights', 'in Texas'],
    palette: ['#4D3D69', '#241D36', '#BBA6E0', '#F1ECFA'],
    motif: 'inheritance-chain',
  },
  {
    path: 'public/assets/articles/mineral-1031-tax-implications-wave9.webp',
    title: 'Understanding 1031 Tax Implications for Mineral Rights Owners',
    lines: ['Understanding 1031 Tax Implications', 'for Mineral Rights Owners'],
    palette: ['#245241', '#102C21', '#83D0A7', '#E5F6ED'],
    motif: 'tax-exchange',
  },
  {
    path: 'public/assets/articles/texas-mineral-value-evidence-wave9.webp',
    title: 'How to Accurately Assess Your Texas Mineral Rights Value',
    lines: ['How to Accurately Assess Your Texas', 'Mineral Rights Value'],
    palette: ['#635020', '#31270F', '#DFC56A', '#F7F0D6'],
    motif: 'texas-data',
  },
  {
    path: 'public/assets/articles/royalty-check-breakdown-wave9.webp',
    title: 'Understanding Your Mineral Royalty Checks Breakdown',
    lines: ['Understanding Your Mineral Royalty', 'Checks Breakdown'],
    palette: ['#1D5260', '#0D2A31', '#74CFDA', '#E2F5F7'],
    motif: 'royalty-ledger',
  },
  {
    path: 'public/assets/articles/underwriter-review-vs-broker-wave9.webp',
    title: 'Understanding the Key Differences: Our Underwriter Review vs. Traditional Mineral Rights Brokers',
    lines: ['Understanding the Key Differences:', 'Our Underwriter Review vs. Traditional', 'Mineral Rights Brokers'],
    palette: ['#53412A', '#2A2116', '#D9B77F', '#F6ECD9'],
    motif: 'process-compare',
  },
];

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]);
}

function titleMarkup(lines) {
  const fontSize = lines.length === 2 ? 45 : 39;
  const lineHeight = lines.length === 2 ? 60 : 49;
  const firstY = lines.length === 2 ? 133 : 96;
  return lines.map((line, index) =>
    `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
  ).join('\n');
}

function motifMarkup(kind, palette) {
  const [, panel, accent, soft] = palette;
  const a = `stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const p = `stroke="${panel}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

  if (kind === 'evidence-layers') return `
    <rect x="105" y="365" width="285" height="175" rx="28" fill="${soft}"/><rect x="455" y="385" width="285" height="175" rx="28" fill="${accent}"/><rect x="805" y="405" width="285" height="175" rx="28" fill="${soft}"/>
    <path d="M165 420h165M165 465h120M515 440h165M515 485h120M865 460h165M865 505h120" ${p}/><path d="M395 450h55M745 470h55" ${a}/>`;
  if (kind === 'buyer-check') return `
    <circle cx="300" cy="465" r="115" fill="${soft}"/><circle cx="300" cy="430" r="38" fill="${accent}"/><path d="M225 530c25-78 125-78 150 0" ${p}/>
    <rect x="550" y="360" width="520" height="220" rx="30" fill="${accent}"/><path d="M620 420h365M620 470h270M620 520h185" ${p}/><circle cx="1035" cy="385" r="36" fill="${soft}"/><path d="M1018 385l13 13 24-29" ${p}/>`;
  if (kind === 'offer-compare') return `
    <rect x="90" y="370" width="420" height="185" rx="30" fill="${soft}"/><rect x="690" y="370" width="420" height="185" rx="30" fill="${accent}"/>
    <path d="M150 425h300M150 475h210M750 425h300M750 475h210" ${p}/><path d="M530 430h140M625 395l50 35-50 35M670 505H530M575 470l-50 35 50 35" ${a}/>`;
  if (kind === 'shield') return `
    <path d="M285 350l175 60v92c0 72-72 112-175 144-103-32-175-72-175-144v-92z" fill="${soft}" stroke="${accent}" stroke-width="8"/><path d="M235 475l36 36 70-84" ${p}/>
    <rect x="560" y="375" width="535" height="190" rx="28" fill="${accent}"/><path d="M630 425h390M630 475h275M630 525h185" ${p}/>`;
  if (kind === 'estate-map') return `
    <rect x="90" y="370" width="320" height="190" rx="26" fill="${soft}"/><path d="M145 425h205M145 475h150M145 525h110" ${p}/>
    <path d="M430 465h230M610 425l58 40-58 40" ${a}/><circle cx="790" cy="425" r="65" fill="${accent}"/><circle cx="980" cy="510" r="65" fill="${soft}"/><path d="M845 450l80 36" ${a}/><path d="M755 425h70M790 390v70M945 510h70" ${p}/>`;
  if (kind === 'inheritance-chain') return `
    <circle cx="170" cy="465" r="70" fill="${soft}"/><circle cx="500" cy="465" r="70" fill="${accent}"/><circle cx="830" cy="425" r="58" fill="${soft}"/><circle cx="1030" cy="520" r="58" fill="${accent}"/>
    <path d="M245 465h180M575 450l195-20M882 450l100 45" ${a}/><path d="M385 430l45 35-45 35M735 400l43 27-38 49" ${a}/><path d="M145 465h50M465 440h70M465 465h70M465 490h70M805 425h50M1005 495l50 50M1055 495l-50 50" ${p}/>`;
  if (kind === 'tax-exchange') return `
    <rect x="100" y="380" width="350" height="175" rx="28" fill="${soft}"/><rect x="750" y="380" width="350" height="175" rx="28" fill="${accent}"/>
    <path d="M160 430h230M160 480h160M810 430h230M810 480h160" ${p}/><path d="M465 420c95-65 175-65 270 0M690 390l50 30-45 50M735 515c-95 65-175 65-270 0M510 545l-50-30 45-50" ${a}/>`;
  if (kind === 'texas-data') return `
    <path d="M150 370h300l60 80-40 120-145 18-85-62-90-35z" fill="${soft}" stroke="${accent}" stroke-width="7"/><circle cx="320" cy="465" r="25" fill="${accent}"/>
    <rect x="585" y="365" width="505" height="215" rx="30" fill="${accent}"/><path d="M650 525V415M650 525h370" ${p}/><path d="M680 500l85-58 85 28 110-70" ${p}/>`;
  if (kind === 'royalty-ledger') return `
    <rect x="85" y="350" width="1030" height="230" rx="30" fill="${soft}"/><path d="M145 410h910M145 465h910M145 520h910M390 385v160M690 385v160M900 385v160" ${p}/>
    <path d="M215 435l24 24 45-55M760 490l24 24 45-55" ${a}/>`;
  return `
    <rect x="95" y="375" width="430" height="185" rx="30" fill="${soft}"/><rect x="675" y="375" width="430" height="185" rx="30" fill="${accent}"/>
    <path d="M155 425h310M155 475h215M735 425h310M735 475h215" ${p}/><circle cx="600" cy="465" r="58" fill="${accent}"/><path d="M575 465h50M600 440v50" ${p}/>`;
}

function svgFor(creative) {
  const [background, panel, accent, soft] = creative.palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${background}"/><stop offset="1" stop-color="${panel}"/></linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${soft}" stroke-width="1" opacity=".09"/></pattern>
      <style>.title{fill:#fffdf7;font-family:Arial,Helvetica,sans-serif;font-weight:750;letter-spacing:-.45px}.brand{fill:${soft};font-family:Arial,Helvetica,sans-serif;font-weight:700}</style>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/><rect width="1200" height="630" fill="url(#grid)"/>
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

  const previewRoot = join(root, 'artifacts/mrx1000-wave9-creative-qa', basename(creative.path, '.webp'));
  await mkdir(previewRoot, { recursive: true });
  for (const [width, height] of [[600, 315], [300, 158]]) {
    await sharp(output).resize(width, height, { fit: 'fill' }).png().toFile(join(previewRoot, `${width}x${height}.png`));
  }
  console.log(`${creative.path}: ${creative.title}`);
}
