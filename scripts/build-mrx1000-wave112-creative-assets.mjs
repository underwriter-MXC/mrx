#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '112';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Production Data Query Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Production Data Query retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-production-data-query-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-production-data-query-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Production',
  'Data Query Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Production Data',
  'Query retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium low-eye-level three-quarter Texas mineral-owner research desk with a person only on the far right, blank two-path production-query route board, neutral lease-reference card, calendar marker, evidence sleeve, and uninterrupted left navy title field. No readable text, values, logos, seals, UI screenshots, cash, conclusions, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead pale production-query provenance worksheet with two blank path columns, controlled-values card, retained-evidence sleeve, calendar marker, neutral status discs, unresolved marker, and uninterrupted lower navy keyword band. No person, hands, oblique desk, readable text, values, logos, seals, UI screenshots, conclusions, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
