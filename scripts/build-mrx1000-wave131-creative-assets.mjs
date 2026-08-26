#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '131';
process.env.MRX_ARTICLE_SLUG = 'search-unclaimed-mineral-royalty-payments-texas';
process.env.MRX_ARTICLE_TITLE =
  'How to Search for Unclaimed Mineral Royalty Payments in Texas';
process.env.MRX_ARTICLE_KEYWORD = 'Texas unclaimed mineral royalty payments search';
process.env.MRX_HERO_FILENAME =
  'how-to-search-for-unclaimed-mineral-royalty-payments-in-texas';
process.env.MRX_INLINE_FILENAME = 'texas-unclaimed-mineral-royalty-payments-search';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Search for',
  'Unclaimed Mineral Royalty',
  'Payments in Texas',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas unclaimed mineral',
  'royalty payments search',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique archival search desk on the right with a generic blank search card, laptop, magnifying glass, cream folder, redacted name-variant tabs, fully redacted envelope, neutral property-reference card, and checkpoint clip beside an uninterrupted left navy title field. No readable base text, real name, identifier, amount, URL, barcode, QR code, government seal, agency logo, Texas outline, flag, watermark, official-interface imitation, legal symbol, well, rig, map, boundary, person, or hand.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead cream unclaimed-property search-log evidence board with a blank session log, five redacted name-variant cards, apparent-holder card, property-reference sleeve, match-evidence checkpoint strip, claim-status token, next-action card, and uninterrupted lower navy keyword band. No oblique room, laptop, screen, magnifying glass, readable base text, real name, identifier, amount, URL, barcode, QR code, government seal, agency logo, Texas outline, flag, watermark, official-interface imitation, legal symbol, well, rig, map, boundary, person, or hand.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
