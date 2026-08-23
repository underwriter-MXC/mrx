#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '86';
process.env.MRX_ARTICLE_SLUG =
  'how-to-extract-shut-in-clause-conditions-before-a-valuation-review';
process.env.MRX_ARTICLE_TITLE =
  'How to Extract Shut-In Clause Conditions Before a Valuation Review';
process.env.MRX_ARTICLE_KEYWORD = 'shut-in clause conditions valuation review';
process.env.MRX_HERO_FILENAME =
  'how-to-extract-shut-in-clause-conditions-before-a-valuation-review';
process.env.MRX_INLINE_FILENAME = 'shut-in-clause-conditions-valuation-review';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Extract',
  'Shut-In Clause',
  'Conditions Before a',
  'Valuation Review',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'shut-in clause conditions',
  'valuation review',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level private oil-and-gas lease review desk on the right with an open blank lease packet, visually marked blank clause block, blank extraction worksheet, tabbed amendments, neutral correspondence folder, pencil, and uninterrupted navy title field on the left; no people, readable document text, real identifiers, signatures, seals, logos, money, values, offers, wells, production charts, lease-effect conclusions, or legal conclusions.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead blank lease-clause extraction worksheet with separate empty source fields, cropped blank lease-paper snippets, colored source tabs, ruler-style line marker, magnifier, neutral unknown tokens, and uninterrupted lower navy keyword field; no eye-level scene, people, laptop, readable document text, real identifiers, signatures, seals, logos, money, values, offers, wells, production charts, lease-effect conclusions, or legal conclusions.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
