#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '133';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-taxable-entity-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller Taxable Entity Search Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas Comptroller taxable entity search retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-comptroller-taxable-entity-search-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-comptroller-taxable-entity-search-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Comptroller',
  'Taxable Entity Search',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas Comptroller taxable',
  'entity search retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique Texas public-record research workstation on the right with an unreadable generic search screen, three separate blank query cards, neutral entity-reference folder, blank timestamp notebook, evidence-pointer tag, and an uninterrupted left navy title field. No readable base text, real name, number, URL, logo, seal, flag, Texas outline, map, barcode, QR code, watermark, signature, money, value, chart, person, or hand.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free three-input provenance board with three blank query lanes, a displayed-reference card, neutral status tile, blank timestamp dial, evidence-pointer sleeve, next-question card, and an uninterrupted lower navy keyword band. No oblique room, screen, readable base text, real name, number, URL, logo, seal, flag, Texas outline, map, barcode, QR code, watermark, signature, money, value, chart, person, or hand.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
