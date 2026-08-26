#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '147';
process.env.MRX_ARTICLE_SLUG =
  'irs-form-1099-misc-royalty-box-2-source-scope-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'IRS Form 1099-MISC Royalty Box 2 Source-Scope Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'IRS Form 1099-MISC royalty Box 2';
process.env.MRX_HERO_FILENAME =
  'irs-form-1099-misc-royalty-box-2-source-scope-worksheet';
process.env.MRX_INLINE_FILENAME = 'irs-form-1099-misc-royalty-box-2';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'IRS Form 1099-MISC',
  'Royalty Box 2',
  'Source-Scope',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'IRS Form 1099-MISC',
  'royalty Box 2',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free front-facing secure document-provenance station on the right with a navy archival case, sealed blank cream evidence card, blank revision tab, blank source-pointer card, subtle mineral texture, and uninterrupted left navy title space. No IRS or tax-form facsimile, government seal, logo, readable text, letters, numbers, dollar signs, names, addresses, TINs, account numbers, tax year, boxes, checkmarks, outcomes, signatures, people, hands, calculator, cash, chart, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead blank source-scope matrix on pale stone with separate blank pointer cards, blank state tiles, blank limitation card, blank revision tab, a closed archival sleeve, and an uninterrupted lower navy keyword band. No front-facing case, people, hands, IRS or tax-form facsimile, government seal, logo, readable text, letters, numbers, dollar signs, names, addresses, TINs, account numbers, tax year, form boxes, checkmarks, outcomes, calculator, cash, chart, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
