#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '146';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-county-tax-assessor-collector-directory-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller County Tax Assessor-Collector Directory Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas county tax assessor collector directory retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-comptroller-county-tax-assessor-collector-directory-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-county-tax-assessor-collector-directory-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Comptroller',
  'County Tax Assessor-Collector',
  'Directory Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas county tax assessor collector',
  'directory retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free front-facing civic-office directory installation with a blank navy-framed panel, blank service-window plaque, blank routing cards, cream stone, and uninterrupted left navy title space. No desk, binder, file-card box, Texas silhouette, readable text, letters, numbers, contact data, flag, seal, logo, result, watermark, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead collecting-unit card layout with one wide blank navy-edged card, five separate blank unit-code chips, two blank contact/address strips, one blank limitation card, and an uninterrupted lower navy keyword band. No centered full-page worksheet, binder, service window, wall panel, Texas silhouette, readable text, letters, numbers, contact data, seal, logo, selected outcome, watermark, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
