#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '118';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-edms-injection-disposal-permit-document-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC EDMS Injection/Disposal Permit Document Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD =
  'Texas RRC EDMS injection disposal permit document retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-edms-injection-disposal-permit-document-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME =
  'texas-rrc-edms-injection-disposal-permit-document-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC EDMS',
  'Injection/Disposal Permit',
  'Document Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC EDMS injection',
  'disposal permit document retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Low-oblique EDMS permit-document retrieval desk with one adult hand only at the extreme right, source-neutral laptop, unmarked Texas district map, blank date-window card, archival application folder, timestamp token, document-transfer sleeve, subtle distant injection-well equipment, and uninterrupted left navy title field. No readable base text, identifiers, values, logos, seals, official interface screenshot, permit status, result, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead circular permit-document evidence-transfer system with blank tracking, field, operator, lease, date-range, route, state, application, correspondence, and transfer-note cards plus a magnifying lens and uninterrupted lower navy keyword band. No hand, person, laptop, window, field equipment, readable base text, identifiers, values, logos, seals, official interface screenshot, permit status, result, production, money, ownership, value, offer, legal conclusion, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
