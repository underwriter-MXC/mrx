#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '129';
process.env.MRX_ARTICLE_SLUG =
  'mineral-rights-offer-version-control-and-deadline-register';
process.env.MRX_ARTICLE_TITLE =
  'Mineral Rights Offer Version-Control and Deadline Register';
process.env.MRX_ARTICLE_KEYWORD = 'mineral rights offer version control';
process.env.MRX_HERO_FILENAME =
  'mineral-rights-offer-version-control-and-deadline-register';
process.env.MRX_INLINE_FILENAME = 'mineral-rights-offer-version-control';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Mineral Rights Offer',
  'Version-Control and',
  'Deadline Register',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'mineral rights offer',
  'version control',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique dark archival version-control station on the right with three blank offer-document sleeves, copper version tabs, neutral date-stamp device, analog clock, blank source-filename card, sealed archive tray, and an uninterrupted left navy title field. No readable base text, identifiers, logos, legal symbols, money, conclusions, people, hands, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead cream register board with three blank document-version cards, timestamp and source-filename strips, hash-grid icon, blank deadline-and-timezone card, three-state shape marker, changed-field ruler, and an uninterrupted lower navy keyword band. No oblique room, archive tray, clock, stamp device, readable base text, identifiers, legal symbols, money, people, hands, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
