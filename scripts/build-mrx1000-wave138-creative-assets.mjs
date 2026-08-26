#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '138';
process.env.MRX_ARTICLE_SLUG = 'texas-tdi-title-agent-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas TDI Title Agent Report Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas TDI title agent report retrieval';
process.env.MRX_HERO_FILENAME = 'texas-tdi-title-agent-report-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-tdi-title-agent-report-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas TDI Title Agent',
  'Report Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas TDI title agent',
  'report retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned low-oblique people-free public-report retrieval station with a blank report-card carousel, neutral archive tray, blank controlled-reference sleeve, small unlabeled selection dial, and uninterrupted left navy title space. No readable text, letters, numbers, person, company, party, license, appointment, address, county, correspondence, offer, property, logo, seal, result, status, signature, watermark, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank report-attempt provenance worksheet with separate blank route, report title, report date, filter state, displayed-column, evidence-pointer, limitation, and bounded-outcome zones, a separate blank controlled-input card, and uninterrupted lower navy keyword band. No monitor, oblique angle, readable text, letters, numbers, person, company, party, license, appointment, address, county, correspondence, offer, property, logo, seal, result, status, signature, watermark, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
