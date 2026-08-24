#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '104';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-p-5-renewal-status-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC P-5 Renewal Status Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC P-5 Renewal Status Query retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-p-5-renewal-status-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-p-5-renewal-status-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC P-5',
  'Renewal Status Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC P-5 Renewal Status',
  'Query retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low three-quarter archival route desk. On the right: three stacked blank routing trays, a neutral brass timestamp dial without numbers, blank criterion tabs, an unbranded closed folder, and a small unlabeled Texas-shaped object; on the left: uninterrupted textured navy title field. No people, hands, screens, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale-gray query-state board with one horizontal route line, five blank criterion tiles, three neutral outcome cards, a retained-reference sleeve, an unlabeled circular time marker, pencil, and uninterrupted lower keyword band. No oblique angle, dark desk, stacked trays, people, hands, screens, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
