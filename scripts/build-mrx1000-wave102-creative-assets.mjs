#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '102';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-field-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Field Search Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Field Search retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-field-search-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-field-search-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Field Search',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Texas RRC Field Search', 'retrieval']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free oblique Field Search evidence desk. On the right: a generic computer terminal with blank search controls, three blank mode tabs, a blank retained-reference card, a clock, and an abstract unlabeled Texas desk object; on the left: an uninterrupted textured navy title field. No people, hands, money, offers, prices, production charts, wells, rigs, readable record text, identifiers, dates, results, signatures, seals, agency logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone evidence scene with one blank three-lane search-mode worksheet, abstract character tiles, a three-unit marker, blank route arrows, a magnifying glass, blank retained-reference tabs, and an uninterrupted lower keyword band. No oblique angle, monitor, map object, folder scene, people, hands, money, offers, prices, charts, wells, rigs, readable record text, identifiers, dates, results, signatures, seals, agency logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
