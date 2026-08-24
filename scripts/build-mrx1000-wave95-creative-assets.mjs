#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '95';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Inactive Well Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Inactive Well query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-inactive-well-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-inactive-well-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Inactive Well',
  'Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Inactive Well',
  'query retrieval',
]);
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic oblique public-record research counter in pale limestone and brushed steel, on the right: a blank inactive-well query folder, abstract blank criteria card, blank route card, date-time stamp tool, neutral magnifier, and unlabeled Texas-shaped brass paperweight beside an uninterrupted navy title field on the left; no people, hands, money, offers, prices, graphs, maps with labels, wells, rigs, interpretable results, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead slate-blue technical surface with an eight-field blank inactive-well query provenance worksheet, separate blank criteria chips, blank route strip, three neutral status tokens, cobalt ruler, teal pencil, binder clip, and abstract query-flow card above an uninterrupted lower navy keyword band; no archive counter, folder, tablet, monitor, magnifier, Texas shape, wood, people, hands, money, offers, prices, graphs, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
