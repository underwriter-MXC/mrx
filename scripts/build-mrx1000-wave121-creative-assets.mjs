#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '121';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-dry-hole-file-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Dry Hole File Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC dry hole file retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-dry-hole-file-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-dry-hole-file-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Dry Hole',
  'File Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC dry hole file retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Wide eye-level public-record archive scene with one careful researcher at right opening a shallow microfilm drawer, a blank record sleeve, neutral viewer, and uninterrupted left navy title field. No readable base text, identifiers, API numbers, county, field, lease, operator, results, values, logos, seals, official interface screenshot, document interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead dry-hole retrieval evidence board with blank tract outline, blank well-location card, generic folder, magnifier, microfilm strip, viewer thumbnail, criteria worksheet, timestamp card, and three blank outcome tokens above an uninterrupted lower navy keyword band. No people, hands, archive drawer, readable base text, identifiers, values, logos, seals, official interface screenshot, document interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
