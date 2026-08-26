#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '144';
process.env.MRX_ARTICLE_SLUG =
  'texas-probate-court-appointment-record-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas Probate Court Appointment Record Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas probate court appointment record retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-probate-court-appointment-record-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-probate-court-appointment-record-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas Probate Court',
  'Appointment Record',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas probate court',
  'appointment record retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned low-oblique people-free official-court-directory retrieval station with blank archive cards, a blank directory binder, a neutral retrieval tray, an abstract courthouse-column silhouette without a seal, and uninterrupted left navy title space. No readable text, letters, numbers, names, case styles, causes, dates, court seal, logo, signature, result, status, watermark, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank probate appointment-record retrieval provenance worksheet with separate empty route, court, county, access-time, search-mode, criterion, case-style, cause, docket, document-label, retained-reference, limitation, and three neutral outcome zones above an uninterrupted lower navy keyword band. No binder carousel, oblique angle, readable text, letters, numbers, names, case data, dates, seal, logo, signature, selected outcome, watermark, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
