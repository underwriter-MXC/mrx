#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '150';
process.env.MRX_ARTICLE_SLUG = 'cash-for-mineral-rights-irs-tax-transcripts-cpa-handoff';
process.env.MRX_ARTICLE_TITLE =
  'Cash for Mineral Rights: How to Retrieve IRS Tax Transcripts for a CPA Handoff';
process.env.MRX_ARTICLE_KEYWORD = 'cash for mineral rights tax transcripts';
process.env.MRX_HERO_FILENAME =
  'cash-for-mineral-rights-how-to-retrieve-irs-tax-transcripts-for-a-cpa-handoff';
process.env.MRX_INLINE_FILENAME = 'cash-for-mineral-rights-tax-transcripts';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Cash for Mineral Rights:',
  'How to Retrieve IRS',
  'Tax Transcripts for',
  'a CPA Handoff',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'cash for mineral rights',
  'tax transcripts',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free low-oblique secure federal-record retrieval and CPA handoff station on the right, with a blank sealed source packet, black archival sleeve, secure blank terminal, document tray, teal custody line, charcoal stone, brass anchors, and uninterrupted left navy title space. No people, hands, readable text, letters, numbers, dates, identifiers, signatures, QR codes, barcodes, logos, seals, emblems, form facsimiles, money, calculators, rates, offers, Texas silhouettes, exchange arrows, 1031 imagery, or title, basis, ownership, completeness, or tax-treatment claim.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead pale-limestone transcript source-scope matrix with four blank evidence zones, a separate navy professional-handoff folder, a secure storage sleeve, restrained navy and teal paths, and uninterrupted lower navy keyword band. No dark oblique station, people, hands, readable text, letters, numbers, dates, identifiers, signatures, QR codes, barcodes, logos, seals, emblems, form facsimiles, money, calculators, rates, offers, Texas silhouettes, exchange arrows, 1031 imagery, ranking, recommendation, or title, basis, ownership, completeness, or tax-treatment claim.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
