#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '137';
process.env.MRX_ARTICLE_SLUG =
  'sec-edgar-mineral-rights-offeror-filing-search-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'SEC EDGAR Mineral Rights Offeror Filing Search Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'SEC EDGAR mineral rights offeror filing search';
process.env.MRX_HERO_FILENAME =
  'sec-edgar-mineral-rights-offeror-filing-search-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'sec-edgar-mineral-rights-offeror-filing-search';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'SEC EDGAR Mineral Rights',
  'Offeror Filing Search',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'SEC EDGAR mineral rights',
  'offeror filing search',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned low-oblique people-free public-filings research station with blank screen panels, archival filing tray, blank retained-correspondence sleeve, small unlabeled reference card, and uninterrupted left navy title space. No readable text, letters, numbers, company, person, identifier, filing, offer, property, logo, seal, result, status, signature, watermark, or conclusion.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank search-attempt provenance worksheet with separate blank route, timestamp, query, filter, result, retained-reference, limitation, and bounded-outcome zones, a separate blank correspondence sleeve, an abstract filing-row strip, and uninterrupted lower navy keyword band. No monitor, oblique angle, readable text, letters, numbers, company, person, identifier, filing, offer, property, logo, seal, result, status, signature, watermark, or conclusion.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
