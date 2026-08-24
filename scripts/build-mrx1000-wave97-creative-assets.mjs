#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '97';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-gas-proration-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Gas Proration Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Gas Proration query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-gas-proration-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-gas-proration-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Gas Proration',
  'Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Gas Proration',
  'query retrieval',
]);
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic oblique public-record research counter in pale limestone and brushed steel, on the right: a blank gas-proration query folder, abstract blank criteria sheet, blank schedule card, date-time stamp tool, neutral divider tabs, and an uninterrupted navy title field on the left; no people, hands, money, offers, prices, graphs, maps with labels, wells, rigs, interpretable results, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead slate-blue technical surface with seven blank gas-proration query provenance worksheet panels, a separate blank route strip, neutral status tokens, cobalt ruler, teal pencil, and binder clip above an uninterrupted lower navy keyword band; no archive counter, folder, tablet, monitor, magnifier, wood, people, hands, money, offers, prices, graphs, wells, rigs, interpretations, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
