#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '122';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-district-office-well-records-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC District Office Well Records Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC District Office Well Records retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-district-office-well-records-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-district-office-well-records-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC District Office',
  'Well Records Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC District Office',
  'Well Records retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Wide eye-level public-record archive scene with one careful researcher at right, blank archival folders on a light table, a neutral film canister, wooden cubbies, and an uninterrupted left navy title field. Every paper, folder, shelf label, and object is blank. No readable base text, identifiers, lease number, API number, district, well, operator, date, result, values, logos, seals, official interface screenshot, document interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead district-office well-record retrieval evidence board with blank index cards, blank archival grid card, blank envelope, microfilm reel, loupe, blank criteria cards, and blank outcome tokens above an uninterrupted lower navy keyword band. No people, hands, archive room perspective, readable base text, identifiers, lease number, API number, district, well, operator, date, result, values, logos, seals, official interface screenshot, document interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
