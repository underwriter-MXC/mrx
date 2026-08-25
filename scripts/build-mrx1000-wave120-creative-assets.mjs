#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '120';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-imaged-potential-file-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Imaged Potential File Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC potential file retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-imaged-potential-file-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-potential-file-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Imaged',
  'Potential File Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC potential file retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Wide eye-level generic archive research counter with one neutral researcher seen from behind at far right opening a flat-file drawer, a source-neutral microfilm reader, blank evidence folder, and uninterrupted left navy title field. No readable base text, identifiers, API numbers, county, field, lease, operator, results, values, logos, seals, official interface screenshot, record interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead rectangular potential-file evidence board with unlabeled link-state, microfilm-frame, viewer-state, archival-envelope, criteria-reference, magnifying-lens, film-reel, and evidence-sleeve objects plus an uninterrupted lower navy keyword band. No hand, person, archive counter, flat-file drawer, readable base text, identifiers, values, logos, seals, official interface screenshot, record interpretation, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
