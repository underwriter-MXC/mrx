#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '92';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-p-4-gatherer-purchaser-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC P-4 Gatherer/Purchaser Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC P-4 gatherer/purchaser query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-p-4-gatherer-purchaser-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-p-4-gatherer-purchaser-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC P-4',
  'Gatherer/Purchaser Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC P-4 gatherer/purchaser',
  'query retrieval',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic oblique eye-level public-record research counter in warm limestone and brushed steel with a blank P-4 query folder, abstract blank query screen card, route card, date-time stamp tool, neutral magnifier, and unlabeled Texas-shaped brass paperweight beside an uninterrupted navy title field; no people, hands, wood desk, money, offers, prices, graphs, maps with labels, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead cool-gray technical surface with an eight-field blank P-4 gatherer/purchaser query provenance worksheet, separate blank criteria chips, blank result-reference strip, three neutral status tokens, cobalt ruler, teal pencil, binder clip, and abstract route-flow card above an uninterrupted lower navy keyword band; no archive room, counter, folder, tablet, monitor, magnifier, Texas shape, wood, people, hands, money, offers, prices, graphs, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
