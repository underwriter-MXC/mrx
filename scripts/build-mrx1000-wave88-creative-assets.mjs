#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '88';
process.env.MRX_ARTICLE_SLUG = 'how-to-build-a-texas-mineral-production-record-locator-sheet';
process.env.MRX_ARTICLE_TITLE = 'How to Build a Texas Mineral Production Record Locator Sheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas mineral production record locator sheet';
process.env.MRX_HERO_FILENAME = 'how-to-build-a-texas-mineral-production-record-locator-sheet';
process.env.MRX_INLINE_FILENAME = 'texas-mineral-production-record-locator-sheet';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Build a',
  'Texas Mineral',
  'Production Record',
  'Locator Sheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas mineral production',
  'record locator sheet',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level Texas public-record research desk scene on the right with a blank locator worksheet, official-source route card, query-system card, identifier card, covered-period card, access-date stamp, archival folder, subtle unlabeled Texas map, and uninterrupted navy title field on the left; no people, hands, money, offers, prices, charts, production trends, wells, appraisal symbols, conclusions, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead Texas public-production-record locator worksheet on a pale stone surface with seven blank field blocks, neutral browser-route and query-system cards, identifier card, covered-period tab, access-date stamp, result-reference slip, folded abstract tract map, magnifier, pencil, binder clip, and uninterrupted lower navy keyword field; no laptop, framed wall map, folder stack, people, money, offers, prices, charts, production trends, wells, valuation symbols, conclusions, readable text, numbers, dates, signatures, seals, logos, trademarks, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
