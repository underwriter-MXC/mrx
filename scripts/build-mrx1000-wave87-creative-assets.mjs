#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '87';
process.env.MRX_ARTICLE_SLUG = 'how-to-build-a-mineral-rights-valuation-evidence-cutoff-log';
process.env.MRX_ARTICLE_TITLE = 'How to Build a Mineral Rights Valuation Evidence-Cutoff Log';
process.env.MRX_ARTICLE_KEYWORD = 'mineral rights valuation evidence cutoff log';
process.env.MRX_HERO_FILENAME = 'how-to-build-a-mineral-rights-valuation-evidence-cutoff-log';
process.env.MRX_INLINE_FILENAME = 'mineral-rights-valuation-evidence-cutoff-log';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'How to Build a',
  'Mineral Rights',
  'Valuation',
  'Evidence-Cutoff Log',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'mineral rights valuation',
  'evidence cutoff log',
]);
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium photorealistic eye-level evidence-control desk on the right with a blank dated source-log sheet, neutral source-category tabs, blank identifier cards, a covered-period field card, physical date stamp, closed archival folder, and uninterrupted navy title field on the left; no people, hands, money, price charts, offers, wells, appraisal symbols, conclusions, readable text, figures, dates, signatures, seals, logos, or fake document text.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead administrative evidence-cutoff worksheet with six separate blank field columns, neutral source-folder stack, date-marker tabs, ruler, binder clip, magnifier, and uninterrupted lower navy keyword field; no eye-level desk scene, people, hands, money, offers, charts, wells, appraisal symbols, conclusions, readable text, figures, dates, signatures, seals, logos, or fake document text.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
