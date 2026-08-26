#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '148';
process.env.MRX_ARTICLE_SLUG =
  'irs-form-8824-source-document-map-for-a-mineral-rights-exchange';
process.env.MRX_ARTICLE_TITLE =
  'IRS Form 8824 Source-Document Map for a Mineral Rights Exchange';
process.env.MRX_ARTICLE_KEYWORD = 'IRS Form 8824 source documents';
process.env.MRX_HERO_FILENAME =
  'irs-form-8824-source-document-map-for-a-mineral-rights-exchange';
process.env.MRX_INLINE_FILENAME = 'irs-form-8824-source-documents';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'IRS Form 8824',
  'Source-Document',
  'Map for a Mineral',
  'Rights Exchange',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'IRS Form 8824',
  'source documents',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free front-facing archival source station on the right with a navy secure case, blank tabbed sleeves, a blank exchange folder, an unlabeled index holder, dark walnut, subtle mineral tract contours, and uninterrupted left navy title space. No IRS or government seal, tax-form facsimile, readable text, letters, numbers, names, TINs, addresses, property identifiers, dates, dollar amounts, selected answers, outcomes, signatures, checkmarks, calculator, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead blank source-provenance matrix on pale stone with separate blank cards, location tags, archival sleeve, blank exchange folder, tract-contour card, unresolved-item tray, and an uninterrupted lower navy keyword band. No front-facing case, pumpjack, people, hands, IRS or government seal, tax-form facsimile, readable text, letters, numbers, names, TINs, addresses, property identifiers, dates, dollar amounts, selected answers, outcomes, signatures, checkmarks, calculator, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
