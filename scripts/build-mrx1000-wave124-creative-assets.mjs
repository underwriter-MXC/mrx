#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '124';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-form-t-1-monthly-transportation-storage-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Form T-1 Monthly Transportation and Storage Report Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Form T-1 report retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-form-t-1-monthly-transportation-and-storage-report-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-form-t-1-report-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Form T-1',
  'Monthly Transportation and',
  'Storage Report Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC Form T-1', 'report retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Wide eye-level Texas public-record archive scene with one careful researcher at far right, blank archival folders, neutral shelves, subtle unlabeled route geometry, and an uninterrupted left navy title field. Every paper, folder, card, shelf label, and screen is blank. No readable base text, identifiers, facility, well, operator, date, result, values, logos, seals, official interface screenshot, charts, money, legal imagery, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead Form T-1 provenance evidence board with blank report folder, timestamp card, route card, criteria cards, loupe, evidence envelope, and three blank outcome tokens above an uninterrupted lower navy keyword band. No people, faces, archive-room perspective, readable base text, identifiers, facility, well, operator, date, result, values, logos, seals, official interface screenshot, charts, money, legal imagery, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
