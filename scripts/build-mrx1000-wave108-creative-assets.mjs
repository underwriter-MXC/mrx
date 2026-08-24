#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '108';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-g-10-w-10-well-status-report-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC G-10/W-10 Well Status Report Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC G-10/W-10 Well Status Report Query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-g-10-w-10-well-status-report-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME =
  'texas-rrc-g-10-w-10-well-status-report-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC G-10/W-10',
  'Well Status Report',
  'Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC G-10/W-10 Well',
  'Status Report Query retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low-oblique dark provenance station with two upright parallel matte-ivory route gates, blank acrylic PDF sleeve, three neutral state pegs, teal route token, orange provenance marker, and brushed-metal timestamp rail. Uninterrupted left navy title field. No people, screens, reports, wells, rigs, readable text, identifiers, results, status claims, logos, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale query ledger with two separated blank route cards, independent teal paths, seven empty criteria cells, transparent PDF capsule, three neutral state disks, orange unresolved marker, blank next-question card, and uninterrupted lower navy keyword band. No upright gates, dark desk, people, reports, wells, rigs, readable text, identifiers, results, status claims, logos, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
