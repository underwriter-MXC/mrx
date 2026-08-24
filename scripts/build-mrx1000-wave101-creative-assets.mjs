#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '101';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Completions Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Completions Query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-completions-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-completions-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Completions Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Completions',
  'Query retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free oblique archive desk. On the right: a blank generic completion-packet folder, character-free computer search panels, a blank retained-reference card, and an abstract unlabeled Texas map; on the left: an uninterrupted textured navy title field. No people, hands, money, offers, prices, production charts, wells, rigs, readable record text, identifiers, dates, results, signatures, seals, agency logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone evidence scene with a blank multi-row query-criteria worksheet, neutral route arrows, magnifying glass, blank retained-reference tabs, and an uninterrupted lower keyword band. No oblique angle, monitor, map, archive folder scene, people, hands, money, offers, prices, charts, wells, rigs, readable record text, identifiers, dates, results, signatures, seals, agency logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
