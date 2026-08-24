#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '103';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-inactive-well-aging-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Inactive Well Aging Report Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Inactive Well Aging Report retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-inactive-well-aging-report-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-inactive-well-aging-report-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Inactive',
  'Well Aging Report',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Inactive Well Aging',
  'Report retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low three-quarter archival research counter. On the right: blank age-band tab cards, neutral timestamp device, abstract calendar wheel, closed unbranded report folder, magnifier, and unlabeled Texas object; on the left: uninterrupted textured navy title field. No people, hands, screens, readable record text, identifiers, dates, results, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead cool-gray evidence scene with one blank radial six-segment timeline wheel, three neutral status tokens, blank route strip, retained-reference envelope, analog timestamp dial without numbers, pencil, divider, and uninterrupted lower keyword band. No oblique angle, counter, fan of tabs, people, hands, screens, readable record text, identifiers, dates, results, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
