#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '132';
process.env.MRX_ARTICLE_SLUG = 'reeves-county-mineral-records-search-log';
process.env.MRX_ARTICLE_TITLE =
  'Reeves County Mineral Records: A Source-by-Source Search Log';
process.env.MRX_ARTICLE_KEYWORD = 'Reeves County mineral records search';
process.env.MRX_HERO_FILENAME =
  'reeves-county-mineral-records-a-source-by-source-search-log';
process.env.MRX_INLINE_FILENAME = 'reeves-county-mineral-records-search';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Reeves County Mineral',
  'Records: A Source-by-Source',
  'Search Log',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Reeves County mineral',
  'records search',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique Reeves County records-research station on the right with four separated unlabeled source stations, one redacted identifier card, blank provenance tabs, and an uninterrupted left navy title field. No readable base text, real name, number, URL, barcode, QR code, logo, seal, flag, Texas or county outline, real map, watermark, signature, value, rig, pumpjack, person, or hand.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead four-zone Reeves County source-log board with separate county-index, appraisal-observation, land-grant-context, and regulator-data evidence zones, one redacted identifier token, blank evidence tabs, and an uninterrupted lower navy keyword band. No oblique room, screen, clock, people, hands, readable base text, real name, number, URL, barcode, QR code, logo, seal, flag, Texas or county outline, real map, watermark, signature, value, rig, or pumpjack.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
