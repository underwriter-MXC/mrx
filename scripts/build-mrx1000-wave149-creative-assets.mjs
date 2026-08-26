#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '149';
process.env.MRX_ARTICLE_SLUG =
  '1031-exchange-evidence-provenance-log-mineral-interest-owners';
process.env.MRX_ARTICLE_TITLE =
  '1031 Exchange Evidence Provenance Log for Mineral Interest Owners';
process.env.MRX_ARTICLE_KEYWORD = '1031 exchange recordkeeping for mineral interests';
process.env.MRX_HERO_FILENAME =
  '1031-exchange-evidence-provenance-log-for-mineral-interest-owners';
process.env.MRX_INLINE_FILENAME = '1031-exchange-recordkeeping-for-mineral-interests';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  '1031 Exchange',
  'Evidence Provenance',
  'Log for Mineral',
  'Interest Owners',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  '1031 exchange recordkeeping',
  'for mineral interests',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free low-oblique museum-like evidence-provenance relay on the right with blank source objects linked by brass rings and amber custody points on charcoal stone, plus uninterrupted left navy title space. No front-facing filing station, overhead worksheet, readable text, letters, numbers, dates, amounts, names, addresses, TINs, property identifiers, signatures, checkmarks, forms, tax calculations, deadlines, government or IRS seals or logos, outcomes, or conclusions.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead pale-limestone five-zone source-custody matrix with blank origin tile, custodian sleeve, retrieval tab, archival marker, unresolved-gap tray, subtle tract contours, and uninterrupted lower navy keyword band. No dark oblique relay, people, hands, readable text, letters, numbers, dates, amounts, names, addresses, TINs, property identifiers, signatures, checkmarks, forms, tax calculations, deadlines, government or IRS seals or logos, outcomes, or conclusions.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
