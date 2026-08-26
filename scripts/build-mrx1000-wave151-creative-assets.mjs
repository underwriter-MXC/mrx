#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '151';
process.env.MRX_ARTICLE_SLUG =
  'how-to-retrieve-recorded-mineral-deed-copy-for-cpa-handoff';
process.env.MRX_ARTICLE_TITLE =
  'How to Retrieve a Recorded Mineral Deed Copy for a CPA Handoff';
process.env.MRX_ARTICLE_KEYWORD = 'recorded mineral deed copy';
process.env.MRX_HERO_FILENAME =
  'how-to-retrieve-a-recorded-mineral-deed-copy-for-a-cpa-handoff';
process.env.MRX_INLINE_FILENAME = 'recorded-mineral-deed-copy';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Retrieve a',
  'Recorded Mineral',
  'Deed Copy for a',
  'CPA Handoff',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'recorded mineral',
  'deed copy',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free low-oblique county archive retrieval counter on the right, with a blank archival pull box, unlabeled wood index drawer, neutral document sleeve, brass file rail, soft sandstone wall, and a single restrained teal custody ribbon, leaving uninterrupted deep-navy title space on the left. No people, hands, readable text, letters, numbers, dates, county names, identifiers, instrument numbers, volume or page, legal descriptions, signatures, QR codes, barcodes, logos, seals, emblems, deed facsimiles, money, calculators, tax forms, offers, Texas silhouettes, title chains, ownership diagrams, or legal, title, completeness, tax, valuation, or transaction claim.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead pale-stone county-record retrieval log with five blank evidence zones represented only by shapes: jurisdiction source, index query, located record, copy type, and handoff receipt, plus a separate navy evidence sleeve, restrained teal route line, and uninterrupted lower navy keyword band. No dark oblique archive counter, people, hands, readable text, letters, numbers, dates, county names, identifiers, instrument numbers, volume or page, legal descriptions, signatures, QR codes, barcodes, logos, seals, emblems, deed facsimiles, money, calculators, tax forms, offers, Texas silhouettes, title chains, ranking, recommendation, or legal, title, completeness, tax, valuation, or transaction claim.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
