#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '115';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Production by Lease Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Production by Lease retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-production-by-lease-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-production-by-lease-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Production by Lease',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC Production by', 'Lease retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium straight-on evidence workstation with one researcher only on the far right, neutral monitor showing an abstract route diagram ending at one selected blank card, blank provenance worksheet, closed evidence folder, controlled-reference card, timestamp card, and uninterrupted left navy title field. No readable text, values, logos, government seals, official interface screenshot, maps, production figures, money, ownership, value, offer, conclusion, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct strict-overhead pale provenance worksheet with one hand only, blank route card, four blank criteria tabs, timestamp/source card, retained-evidence sleeve, three neutral status tokens, blank-display calculator, abstract unmarked tract-style grid, and uninterrupted lower navy keyword band. No monitor, laptop, seated person, readable text, values, logos, government seals, official interface screenshot, maps, production figures, money, ownership, value, offer, result, conclusion, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
