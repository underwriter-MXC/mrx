#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/net-mineral-acres-vs-royalty-acres-wave6.webp',
    title: ['Net Mineral Acres vs. Royalty Acres:', 'What Texas Mineral Rights Owners', 'Need to Know'],
    palette: { bg: '#12355B', panel: '#071C33', accent: '#F4C95D', soft: '#D9ECF7' },
    motif: 'measure',
  },
  {
    path: 'public/assets/articles/oil-and-gas-lease-anatomy-wave6.webp',
    title: ['What Is an Oil and Gas Lease', 'and How Does It Affect Your', 'Mineral Rights?'],
    palette: { bg: '#17483F', panel: '#082A24', accent: '#69D1B5', soft: '#E1F5EE' },
    motif: 'lease',
  },
  {
    path: 'public/assets/articles/held-by-production-lease-timeline-wave6.webp',
    title: ['What Is a Held-by-Production Lease', 'and How Does It Affect Your', 'Mineral Rights?'],
    palette: { bg: '#4B2F59', panel: '#27142F', accent: '#DAB0E8', soft: '#F2E7F6' },
    motif: 'hbp',
  },
  {
    path: 'public/assets/articles/division-order-payment-map-wave6.webp',
    title: ['What Is a Division Order and', 'Why Does It Matter for', 'Mineral Rights Owners?'],
    palette: { bg: '#4A341E', panel: '#281A0D', accent: '#F0AA62', soft: '#F7E7D3' },
    motif: 'division',
  },
  {
    path: 'public/assets/articles/royalty-check-statement-grid-wave6.webp',
    title: ['How to Decode Your', 'Royalty Check Statement'],
    palette: { bg: '#16405A', panel: '#08263A', accent: '#65C8D5', soft: '#DEF3F5' },
    motif: 'statement',
  },
  {
    path: 'public/assets/articles/inherited-royalty-check-flow-wave6.webp',
    title: ['Understanding Royalty Checks', 'After Inheriting Mineral Rights'],
    palette: { bg: '#3D3B72', panel: '#1E1D43', accent: '#AAA6F1', soft: '#EBEAFB' },
    motif: 'inheritcheck',
  },
  {
    path: 'public/assets/articles/inherited-mineral-rights-sale-readiness-wave6.webp',
    title: ['Mineral Rights Inheritance in Texas:', 'What Heirs Need to Know', 'Before Selling'],
    palette: { bg: '#4A3D17', panel: '#2B230B', accent: '#D9C35C', soft: '#F4EFCF' },
    motif: 'inheritready',
  },
  {
    path: 'public/assets/articles/mineral-rights-capital-gains-framework-wave6.webp',
    title: ['Capital Gains Tax on Mineral Rights', 'Sales in Texas: What Sellers', 'Need to Know'],
    palette: { bg: '#263B54', panel: '#111F31', accent: '#8FB8E8', soft: '#E5EEF8' },
    motif: 'tax',
  },
  {
    path: 'public/assets/articles/underwriter-review-document-checklist-wave6.webp',
    title: ['What to Bring to Your Underwriter', 'Review Call: Essential Documents', 'and Preparation Guide'],
    palette: { bg: '#31523B', panel: '#172C1F', accent: '#91D39E', soft: '#E6F4E8' },
    motif: 'checklist',
  },
  {
    path: 'public/assets/articles/competing-mineral-rights-offers-wave6.webp',
    title: ['Can I Still Get a Valid Underwriter', 'Review if I Have Competing', 'Mineral Rights Offers?'],
    palette: { bg: '#5A2F3C', panel: '#331721', accent: '#E696AD', soft: '#F8E5EB' },
    motif: 'offers',
  },
];

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
    return entities[character];
  });
}

function titleSvg(lines) {
  const fontSize = lines.length === 2 ? 55 : 43;
  const lineHeight = lines.length === 2 ? 69 : 55;
  const firstY = lines.length === 2 ? 124 : 84;
  return lines
    .map(
      (line, index) =>
        `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function motifSvg(kind, palette) {
  const stroke = `stroke="${palette.accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const darkStroke = `stroke="${palette.panel}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

  if (kind === 'measure') {
    return `
      <rect x="145" y="390" width="370" height="145" rx="25" fill="${palette.soft}"/>
      <path d="M195 455h270M195 493h175" ${darkStroke}/>
      <rect x="685" y="390" width="370" height="145" rx="25" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="6"/>
      <path d="M735 455h270M735 493h210" stroke="${palette.soft}" stroke-width="9" stroke-linecap="round"/>
      <path d="M535 462h130M620 425l42 37-42 37" ${stroke}/>`;
  }
  if (kind === 'lease') {
    return `
      <rect x="210" y="365" width="780" height="200" rx="28" fill="${palette.soft}"/>
      <path d="M275 420h410M275 462h525M275 504h335" ${darkStroke}/>
      <circle cx="870" cy="465" r="58" fill="${palette.panel}"/>
      <path d="M844 465l18 18 37-42" ${stroke}/>`;
  }
  if (kind === 'hbp') {
    return `
      <path d="M150 475h900" stroke="${palette.soft}" stroke-width="10" stroke-linecap="round" opacity=".7"/>
      <circle cx="285" cy="475" r="48" fill="${palette.soft}"/><circle cx="720" cy="475" r="48" fill="${palette.accent}"/>
      <path d="M285 412v-45M720 412v-45M765 475h240M970 442l40 33-40 33" ${stroke}/>
      <rect x="390" y="396" width="220" height="86" rx="20" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="6"/>`;
  }
  if (kind === 'division') {
    return `
      <rect x="145" y="380" width="300" height="175" rx="24" fill="${palette.soft}"/>
      <path d="M205 430h180M205 470h145M205 510h165" ${darkStroke}/>
      <path d="M465 468h160M585 435l42 33-42 33" ${stroke}/>
      <path d="M625 468h110M735 468l155-68M735 468l155 68" ${stroke}/>
      <circle cx="930" cy="400" r="42" fill="${palette.accent}"/><circle cx="930" cy="536" r="42" fill="${palette.soft}"/>`;
  }
  if (kind === 'statement') {
    return `
      <rect x="175" y="355" width="850" height="225" rx="28" fill="${palette.soft}"/>
      <path d="M230 410h740M230 455h740M230 500h740M430 380v175M710 380v175" stroke="${palette.panel}" stroke-width="7" opacity=".8"/>
      <rect x="735" y="468" width="205" height="55" rx="15" fill="${palette.accent}"/>`;
  }
  if (kind === 'inheritcheck') {
    return `
      <circle cx="215" cy="465" r="70" fill="${palette.soft}"/>
      <rect x="455" y="390" width="290" height="150" rx="24" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="6"/>
      <path d="M505 438h190M505 482h135" stroke="${palette.soft}" stroke-width="9" stroke-linecap="round"/>
      <rect x="900" y="405" width="155" height="120" rx="22" fill="${palette.accent}"/>
      <path d="M295 465h140M405 432l38 33-38 33M765 465h115M850 432l38 33-38 33" ${stroke}/>`;
  }
  if (kind === 'inheritready') {
    return `
      <rect x="135" y="390" width="225" height="150" rx="24" fill="${palette.soft}"/>
      <rect x="488" y="365" width="225" height="200" rx="24" fill="${palette.accent}"/>
      <rect x="840" y="390" width="225" height="150" rx="24" fill="${palette.soft}"/>
      <path d="M185 435h125M185 480h95M538 420h125M538 465h125M538 510h80M890 435h125M890 480h95" ${darkStroke}/>
      <path d="M370 465h98M430 435l38 30-38 30M723 465h97M782 435l38 30-38 30" ${stroke}/>`;
  }
  if (kind === 'tax') {
    return `
      <rect x="150" y="390" width="315" height="145" rx="24" fill="${palette.soft}"/>
      <rect x="735" y="390" width="315" height="145" rx="24" fill="${palette.soft}"/>
      <path d="M210 445h195M210 487h140M795 445h195M795 487h140" ${darkStroke}/>
      <circle cx="600" cy="463" r="72" fill="${palette.panel}" stroke="${palette.accent}" stroke-width="8"/>
      <path d="M562 463h76M600 425v76" ${stroke}/>`;
  }
  if (kind === 'checklist') {
    return `
      <rect x="280" y="350" width="640" height="235" rx="28" fill="${palette.soft}"/>
      ${[405, 460, 515].map((y) => `<rect x="340" y="${y - 22}" width="42" height="42" rx="9" fill="${palette.panel}"/><path d="M348 ${y}l10 10 19-23" ${stroke}/><path d="M420 ${y}h420" ${darkStroke}/>`).join('')}
      <path d="M405 350v-28h390v28" ${stroke}/>`;
  }
  return `
    <rect x="135" y="380" width="360" height="175" rx="25" fill="${palette.soft}"/>
    <rect x="705" y="380" width="360" height="175" rx="25" fill="${palette.soft}"/>
    <path d="M195 430h240M195 475h165M765 430h240M765 475h190" ${darkStroke}/>
    <path d="M510 468h180M650 433l42 35-42 35M690 468H510M550 433l-42 35 42 35" ${stroke}/>`;
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
          .title { fill: #fffdf7; font-family: Arial, Helvetica, sans-serif; font-weight: 750; letter-spacing: -.4px; }
          .brand { fill: ${palette.soft}; font-family: Arial, Helvetica, sans-serif; font-weight: 700; }
        </style>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#grid)"/>
      <rect x="70" y="38" width="1060" height="285" rx="34" fill="${palette.panel}" opacity=".96" stroke="${palette.accent}" stroke-width="3"/>
      ${titleSvg(creative.title)}
      ${motifSvg(creative.motif, palette)}
      <text x="1110" y="604" text-anchor="end" class="brand" font-size="18">MineralRightsXchange</text>
    </svg>`;
}

for (const creative of creatives) {
  if (creative.title.join(' ') !== creative.title.join(' ').replace(/\s+/g, ' ')) {
    throw new Error(`${creative.path}: title contains unstable whitespace`);
  }
  const output = join(root, creative.path);
  await mkdir(dirname(output), { recursive: true });
  await sharp(Buffer.from(buildSvg(creative)))
    .webp({ quality: 92, smartSubsample: true })
    .toFile(output);

  const previewRoot = join(root, 'artifacts/mrx1000-wave6-creative-qa', basename(creative.path, '.webp'));
  await mkdir(previewRoot, { recursive: true });
  for (const [width, height] of [[600, 315], [300, 158]]) {
    await sharp(output)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toFile(join(previewRoot, `${width}x${height}.png`));
  }
  console.log(`${creative.path}: ${creative.title.join(' ')}`);
}
