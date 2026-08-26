#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '128';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-oil-and-gas-lease-name-index-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Oil and Gas Lease Name Index Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Oil and Gas Lease Name Index retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-oil-and-gas-lease-name-index-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-oil-and-gas-lease-name-index-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Oil and Gas',
  'Lease Name Index Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Oil and Gas',
  'Lease Name Index retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique archival index retrieval station on the right with one neutral monthly index binder, blank PDF preview, district-tab organizer, loupe, timestamp card, copper accents, and an uninterrupted left navy title field. No readable base text, identifiers, agency marks, results, wells, operators, dates, money, legal imagery, people, hands, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead cream evidence board with one blank landscape PDF page, three separate blank selector cards, loupe, controlled-reference sleeve, retained-reference card, and an uninterrupted lower navy keyword band. No oblique perspective, room, monitor, binder, file organizer, readable base text, identifiers, agency marks, results, wells, operators, dates, money, legal imagery, people, hands, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
