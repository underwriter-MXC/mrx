#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '85';
process.env.MRX_ARTICLE_SLUG = 'andrews-county-mineral-rights-public-record-locator';
process.env.MRX_ARTICLE_TITLE =
  'How to Build an Andrews County Mineral Rights Public-Record Locator';
process.env.MRX_ARTICLE_KEYWORD = 'Andrews County mineral rights public-record locator';
process.env.MRX_HERO_FILENAME =
  'how-to-build-an-andrews-county-mineral-rights-public-record-locator';
process.env.MRX_INLINE_FILENAME = 'andrews-county-mineral-rights-public-record-locator';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Build an',
  'Andrews County',
  'Mineral Rights',
  'Public-Record Locator',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Andrews County mineral rights',
  'public-record locator',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level Andrews County civic-records desk on the right with a blank official-record portal, closed records folder, separate blank source cards, tract map, courthouse visible through a window, and uninterrupted navy title field on the left; no people, readable text, real identifiers, seals, logos, title conclusions, ownership claims, prices, values, offers, wells, or production claims.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict overhead four-source public-record locator worksheet with four separate blank source lanes, blank identifier cards, a Texas county map reference, and a magnifier above an uninterrupted lower navy field; no eye-level scene, laptop, courthouse, people, readable text, real identifiers, seals, logos, title conclusions, ownership claims, prices, values, offers, wells, or production claims.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
