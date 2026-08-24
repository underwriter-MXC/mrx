#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '110';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-h-9-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC H-9 Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC H-9 Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-h-9-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-h-9-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC H-9 Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC H-9 Query', 'retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low-oblique dark H-9 provenance station with one upright blank ivory route card, one translucent legacy lookup sleeve, three neutral criteria pegs, orange unresolved marker, and uninterrupted left navy title field. No people, screens, certificates, filings, wells, rigs, readable text, identifiers, results, status claims, seals, logos, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale H-9 query worksheet with blank route field, controlled-value cells, retained-reference card, small legacy card, three neutral state discs, orange unresolved marker, and uninterrupted lower navy keyword band. No upright card, dark desk, people, certificates, filings, wells, rigs, readable text, identifiers, results, status claims, seals, logos, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
