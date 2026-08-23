#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '90';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-drilling-permit-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Drilling-Permit Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC drilling permit query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-drilling-permit-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-drilling-permit-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Drilling-Permit Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC drilling permit',
  'query retrieval',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic oblique eye-level archival records counter in warm limestone and brushed steel with a blank permit-query folder, abstract blank query screen, route card, date-time stamp tool, loupe, and unlabeled Texas-shaped brass paperweight beside an uninterrupted navy title field; no people, hands, wood desk, money, offers, prices, graphs, maps with labels, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead cool-gray technical surface with an eight-field blank query-provenance worksheet, separate criterion chips, blank result-reference strip, three neutral status tokens, cobalt ruler, teal pencil, binder clip, and abstract route-flow card above an uninterrupted lower navy keyword band; no archive room, counter, folder, tablet, monitor, magnifier, stamp, Texas shape, wood, people, hands, money, offers, prices, graphs, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
