#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '119';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-imaged-well-log-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Imaged Well Log Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC well log retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-imaged-well-log-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-well-log-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Imaged',
  'Well Log Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC well log retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Low-oblique single-hand well-log retrieval desk with one generic rolled monochrome log sheet, blank source-menu card, closed evidence folder, source-neutral laptop, and uninterrupted left navy title field. No readable base text, identifiers, API numbers, county, field, lease, operator, results, values, logos, seals, official interface screenshot, well status, formation interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead circular TIFF evidence-transfer board with blank criteria-reference, file-format, evidence-receipt, archival-envelope, and image-frame cards plus a magnifying lens and uninterrupted lower navy keyword band. No hand, person, laptop, rolled paper, readable base text, identifiers, values, logos, seals, official interface screenshot, well status, formation interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
