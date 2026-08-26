#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '145';
process.env.MRX_ARTICLE_SLUG =
  'texas-comptroller-county-appraisal-district-directory-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Comptroller County Appraisal District Directory Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas county appraisal district directory retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-comptroller-county-appraisal-district-directory-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-county-appraisal-district-directory-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Comptroller',
  'County Appraisal District',
  'Directory Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas county appraisal district',
  'directory retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free low-oblique county-directory archival desk with a blank navy directory binder, blank county index cards, one blank contact card, a neutral lamp edge, a cream abstract Texas cardstock silhouette, and uninterrupted left navy title space. No readable text, letters, numbers, names, phone, email, address, seal, logo, status, result, watermark, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank county appraisal-district directory provenance worksheet with empty geometric field zones, three blank county index cards, a gold paper clip, and an uninterrupted lower navy keyword band. No binder, lamp, Texas silhouette, oblique angle, readable text, letters, numbers, contact data, seal, logo, selected outcome, watermark, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
