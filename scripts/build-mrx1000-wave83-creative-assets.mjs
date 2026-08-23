#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '83';
process.env.MRX_ARTICLE_SLUG = 'inventory-mixed-status-mineral-interests-before-valuation-review';
process.env.MRX_ARTICLE_TITLE =
  'How to Inventory Mixed-Status Mineral Interests Before a Valuation Review';
process.env.MRX_ARTICLE_KEYWORD = 'mixed-status mineral interest inventory';
process.env.MRX_HERO_FILENAME =
  'how-to-inventory-mixed-status-mineral-interests-before-a-valuation-review';
process.env.MRX_INLINE_FILENAME = 'mixed-status-mineral-interest-inventory';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Inventory',
  'Mixed-Status Mineral',
  'Interests Before a',
  'Valuation Review',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'mixed-status mineral',
  'interest inventory',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic elevated front-facing mixed-status portfolio folder and administrative register on the right with an uninterrupted navy title field on the left; no people, readable text, figures, maps, wells, money, valuation, verification, legal, or conclusion imagery.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict overhead blank eight-column evidence inventory worksheet with document placeholders, as-of-date field, unknown markers, follow-up-owner structure, and uninterrupted lower navy field; no folder, binder, readable text, figures, maps, wells, money, valuation, verification, legal, or conclusion imagery.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
