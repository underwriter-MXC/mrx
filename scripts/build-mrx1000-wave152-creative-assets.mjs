#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '152';
process.env.MRX_ARTICLE_SLUG =
  'brazos-cad-mineral-account-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Brazos CAD Mineral Account Search Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Brazos CAD mineral account search';
process.env.MRX_HERO_FILENAME =
  'brazos-cad-mineral-account-search-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'brazos-cad-mineral-account-search';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Brazos CAD',
  'Mineral Account',
  'Search Retrieval',
  'Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Brazos CAD mineral',
  'account search',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free low-three-quarter official property-search desk on the right with a laptop showing only blank interface shapes, neutral map grid, slim archival folder, and one restrained teal provenance ribbon, leaving uninterrupted deep-navy title space on the left. No people, hands, readable text, letters, numbers, dates, names, county outlines, identifiers, property IDs, tax amounts, appraisal values, offers, deeds, ownership diagrams, wells, pumpjacks, calculators, money, signatures, QR codes, barcodes, logos, seals, emblems, or legal, tax, ownership, appraisal, value, or transaction claim.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead bright pale-stone five-card search-attempt log with blank zones for access time, search mode, criterion, displayed outcome, and retained reference, plus a blank evidence frame, navy sleeve, teal route line, gold clip, and uninterrupted lower navy keyword band. No low-angle desk, laptop, people, hands, readable text, letters, numbers, dates, names, county outlines, identifiers, property IDs, tax amounts, appraisal values, offers, deeds, title chains, wells, pumpjacks, calculators, money, signatures, QR codes, barcodes, logos, seals, emblems, ranking, recommendation, or legal, tax, ownership, appraisal, value, or transaction claim.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
