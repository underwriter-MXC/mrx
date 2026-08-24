#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '99';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Severance Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC severance query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-severance-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-severance-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Severance Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC severance',
  'query retrieval',
]);
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level public-record archive counter. On the right: blank archival file tray, blank dark-blue reference binder, blank cards, neutral status tokens, and a mechanical date stamp; on the left: an uninterrupted textured navy title field. No people, hands, money, offers, prices, graphs, maps, wells, rigs, interpretable results, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone desk with a large blank multi-panel severance-query provenance worksheet, blue pen, binder clip, and three neutral status tokens above an uninterrupted lower navy keyword band. No archive counter, file tray, binder, shelves, monitor, people, hands, money, offers, prices, graphs, maps, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
