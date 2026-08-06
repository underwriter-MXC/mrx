#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const creatives = [
  {
    path: 'public/assets/articles/mineral-rights-trust-estate-plan-wave8.webp',
    title: 'Can You Put Mineral Rights in a Trust? Texas Estate Planning Explained',
    lines: ['Can You Put Mineral Rights in a Trust?', 'Texas Estate Planning Explained'],
    palette: ['#173F3A', '#0A2724', '#91D5B8', '#E4F5ED'],
    motif: 'trust',
  },
  {
    path: 'public/assets/articles/selling-minerals-estate-plan-wave8.webp',
    title: 'How Selling Mineral Rights Affects Your Estate Plan in Texas',
    lines: ['How Selling Mineral Rights Affects', 'Your Estate Plan in Texas'],
    palette: ['#594322', '#2B2112', '#E4BD70', '#F8EDCF'],
    motif: 'estate-sale',
  },
  {
    path: 'public/assets/articles/probate-mineral-interest-process-wave8.webp',
    title: 'Understanding the Probate Process for Mineral Interests',
    lines: ['Understanding the Probate Process', 'for Mineral Interests'],
    palette: ['#413A6A', '#1E1B38', '#B9A9EC', '#F0ECFB'],
    motif: 'probate',
  },
  {
    path: 'public/assets/articles/royalty-check-interpretation-wave8.webp',
    title: 'How to Interpret Your Mineral Rights Royalty Checks',
    lines: ['How to Interpret Your Mineral Rights', 'Royalty Checks'],
    palette: ['#154D57', '#092B31', '#67CAD0', '#DFF4F5'],
    motif: 'royalty-trend',
  },
  {
    path: 'public/assets/articles/mineral-rights-1031-qualification-wave8.webp',
    title: '1031 Exchange for Mineral Rights: Does It Qualify and How Does It Work?',
    lines: ['1031 Exchange for Mineral Rights:', 'Does It Qualify and How Does It Work?'],
    palette: ['#285A40', '#102E20', '#8BDAA7', '#E4F6EA'],
    motif: 'exchange-check',
  },
  {
    path: 'public/assets/articles/1031-vs-taxable-sale-wave8.webp',
    title: '1031 Exchange vs. Traditional Sales for Mineral Rights',
    lines: ['1031 Exchange vs. Traditional Sales', 'for Mineral Rights'],
    palette: ['#344C70', '#162840', '#8EB5E8', '#E8F0FA'],
    motif: 'exchange-compare',
  },
  {
    path: 'public/assets/articles/federal-tax-reporting-mineral-sale-wave8.webp',
    title: 'How to Report a Mineral Rights Sale on Your Federal Tax Return',
    lines: ['How to Report a Mineral Rights Sale', 'on Your Federal Tax Return'],
    palette: ['#673C2C', '#351D15', '#E8A080', '#F9E8DF'],
    motif: 'tax-file',
  },
  {
    path: 'public/assets/articles/post-review-outcomes-wave8.webp',
    title: 'Can You Discuss Assessment Outcomes With Your Underwriter After Their Review?',
    lines: ['Can You Discuss Assessment Outcomes', 'With Your Underwriter After Their', 'Review?'],
    palette: ['#4A365F', '#281B36', '#C39DE2', '#F2E9F8'],
    motif: 'outcome-dialogue',
  },
  {
    path: 'public/assets/articles/eligible-texas-interest-types-wave8.webp',
    title: 'Discover Which Types of Texas Mineral Rights Qualify for a Free Underwriter Assessment',
    lines: ['Discover Which Types of Texas Mineral', 'Rights Qualify for a Free Underwriter', 'Assessment'],
    palette: ['#4E4B1D', '#29270D', '#D5D36A', '#F4F3D8'],
    motif: 'interest-screen',
  },
  {
    path: 'public/assets/articles/start-free-underwriter-review-wave8.webp',
    title: 'How to Get a Free Underwriter Review of Mineral Rights',
    lines: ['How to Get a Free Underwriter Review', 'of Mineral Rights'],
    palette: ['#214E52', '#102A2D', '#7DC9C6', '#E2F4F3'],
    motif: 'review-start',
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
  return lines
    .map(
      (line, index) =>
        `<text x="600" y="${firstY + index * lineHeight}" text-anchor="middle" class="title" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join('\n');
}

function motifMarkup(kind, palette) {
  const [, panel, accent, soft] = palette;
  const accentStroke = `stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const panelStroke = `stroke="${panel}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

  if (kind === 'trust') return `
    <path d="M185 555V385h250v170" fill="${soft}" stroke="${accent}" stroke-width="7"/>
    <path d="M225 430h170M225 478h120" ${panelStroke}/>
    <circle cx="820" cy="450" r="82" fill="${accent}"/><path d="M820 375v175M745 450h150" ${panelStroke}/>
    <path d="M455 470h210M625 435l45 35-45 35" ${accentStroke}/>
    <circle cx="750" cy="380" r="19" fill="${soft}"/><circle cx="900" cy="380" r="19" fill="${soft}"/><circle cx="750" cy="530" r="19" fill="${soft}"/><circle cx="900" cy="530" r="19" fill="${soft}"/>`;

  if (kind === 'estate-sale') return `
    <rect x="130" y="378" width="285" height="180" rx="28" fill="${soft}"/>
    <path d="M185 430h175M185 475h125M185 520h155" ${panelStroke}/>
    <path d="M445 468h205M605 430l52 38-52 38" ${accentStroke}/>
    <rect x="700" y="360" width="365" height="215" rx="28" fill="${accent}"/>
    <path d="M760 420h245M760 468h195M760 516h135" ${panelStroke}/>`;

  if (kind === 'probate') return `
    <circle cx="185" cy="470" r="64" fill="${soft}"/><circle cx="500" cy="470" r="64" fill="${accent}"/><circle cx="815" cy="470" r="64" fill="${soft}"/><circle cx="1040" cy="470" r="64" fill="${accent}"/>
    <path d="M255 470h175M570 470h175M885 470h85" ${accentStroke}/>
    <path d="M390 435l45 35-45 35M705 435l45 35-45 35M930 435l45 35-45 35" ${accentStroke}/>
    <path d="M160 470h50M185 445v50M465 470h70M785 445h60M785 470h60M785 495h60M1015 445l50 50M1065 445l-50 50" ${panelStroke}/>`;

  if (kind === 'royalty-trend') return `
    <rect x="115" y="350" width="970" height="225" rx="30" fill="${soft}"/>
    <path d="M180 520V405M180 520h475" ${panelStroke}/>
    <path d="M205 490l95-55 90 20 105-75 125 40" ${accentStroke}/>
    <circle cx="300" cy="435" r="14" fill="${panel}"/><circle cx="495" cy="380" r="14" fill="${panel}"/><circle cx="620" cy="420" r="14" fill="${panel}"/>
    <rect x="735" y="390" width="270" height="145" rx="22" fill="${accent}"/><path d="M785 435h170M785 478h115" ${panelStroke}/>`;

  if (kind === 'exchange-check') return `
    <circle cx="375" cy="470" r="100" fill="${soft}"/><circle cx="825" cy="470" r="100" fill="${accent}"/>
    <path d="M475 420c105-90 225-90 350 0M725 386l105 35-65 88" ${accentStroke}/>
    <path d="M725 520c-105 90-225 90-350 0M435 554l-70-35 65-88" ${accentStroke}/>
    <path d="M330 470l30 30 58-70" ${panelStroke}/><path d="M780 470l30 30 58-70" ${panelStroke}/>`;

  if (kind === 'exchange-compare') return `
    <path d="M600 350v230" ${accentStroke}/>
    <rect x="105" y="385" width="390" height="160" rx="28" fill="${soft}"/><rect x="705" y="385" width="390" height="160" rx="28" fill="${accent}"/>
    <path d="M165 435h260M165 482h185" ${panelStroke}/><path d="M765 435h260M765 482h185" ${panelStroke}/>
    <path d="M525 450h65M555 420l40 30-40 30M675 500h-65M645 470l-40 30 40 30" ${accentStroke}/>`;

  if (kind === 'tax-file') return `
    <path d="M175 360h460l115 115v105H175z" fill="${soft}" stroke="${accent}" stroke-width="7"/><path d="M635 360v115h115" ${accentStroke}/>
    <path d="M245 430h285M245 480h360M245 530h250" ${panelStroke}/>
    <circle cx="920" cy="468" r="105" fill="${accent}"/><path d="M870 468l34 34 70-82" ${panelStroke}/>`;

  if (kind === 'outcome-dialogue') return `
    <path d="M110 370h430a35 35 0 0 1 35 35v110a35 35 0 0 1-35 35H270l-70 50 18-50H110a35 35 0 0 1-35-35V405a35 35 0 0 1 35-35z" fill="${soft}"/>
    <path d="M660 360h430a35 35 0 0 1 35 35v110a35 35 0 0 1-35 35H980l18 50-70-50H660a35 35 0 0 1-35-35V395a35 35 0 0 1 35-35z" fill="${accent}"/>
    <path d="M150 425h330M150 475h240M705 415h330M705 465h270" ${panelStroke}/>`;

  if (kind === 'interest-screen') return `
    <rect x="90" y="375" width="250" height="165" rx="24" fill="${soft}"/><rect x="370" y="375" width="250" height="165" rx="24" fill="${accent}"/><rect x="650" y="375" width="250" height="165" rx="24" fill="${soft}"/>
    <path d="M145 425h140M145 472h105M425 425h140M425 472h105M705 425h140M705 472h105" ${panelStroke}/>
    <path d="M930 380h180l-65 78v70l-50 28v-98z" fill="${accent}" stroke="${soft}" stroke-width="7"/>`;

  return `
    <circle cx="195" cy="465" r="70" fill="${soft}"/><circle cx="500" cy="465" r="70" fill="${accent}"/><circle cx="805" cy="465" r="70" fill="${soft}"/><circle cx="1040" cy="465" r="70" fill="${accent}"/>
    <path d="M270 465h155M575 465h155M880 465h85" ${accentStroke}/>
    <path d="M385 430l45 35-45 35M690 430l45 35-45 35M925 430l45 35-45 35" ${accentStroke}/>
    <path d="M165 465h60M470 440h60M470 465h60M470 490h60M775 440l60 50M835 440l-60 50M1010 465l22 22 43-52" ${panelStroke}/>`;
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

  const previewRoot = join(
    root,
    'artifacts/mrx1000-wave8-creative-qa',
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
