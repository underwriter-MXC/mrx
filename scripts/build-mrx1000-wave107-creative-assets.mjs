#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '107';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-new-lease-ids-built-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC New Lease IDs Built Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC New Lease IDs Built Query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-new-lease-ids-built-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-new-lease-ids-built-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC New Lease',
  'IDs Built Query',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC New Lease IDs',
  'Built Query retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium people-free low-oblique dark navy and charcoal provenance station. On the right: a compact architectural light-table with blank routing strip, six blank ceramic criterion tiles, brass date-range bracket, two teal locator tokens, one orange query token, and an empty clear archival envelope. On the left: uninterrupted textured navy title field. No people, hands, screens, folders, maps, wells, rigs, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale limestone query worksheet with blank date-window slider, permit and API token sockets, district fan, county grid, branching field and operator paths, retained-reference capsule, three neutral outcome markers, teal pencil, orange reset token, and uninterrupted lower keyword band. No oblique angle, dark desk, light-table, envelope, people, hands, wells, rigs, readable record text, identifiers, dates, results, status claims, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
