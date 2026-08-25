#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '117';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-production-by-operator-of-record-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Production by Operator of Record Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Production by Operator of Record retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-production-by-operator-of-record-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-production-by-operator-of-record-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Production by Operator of Record',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Production by',
  'Operator of Record retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Low-oblique Texas production-record retrieval desk with one adult hand only at the far right placing a blank operator-of-record tab into a three-path archival stand, a source-neutral laptop, unmarked district map, blank monthly divider, plain operator-number card, distant pumpjack silhouette, and uninterrupted left navy title field. No readable text, values, logos, seals, official interface screenshot, private identifiers, production figures, money, ownership, value, offer, conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead circular provenance-card system with four blank criterion stations, six blank result-state cards, historical-window divider, separate archive card, abstract Texas district map, timestamp token, magnifying lens, and uninterrupted lower navy keyword band. No hand, person, laptop, window, pumpjack, readable text, values, logos, seals, official interface screenshot, private identifiers, production figures, money, ownership, value, offer, result, conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
