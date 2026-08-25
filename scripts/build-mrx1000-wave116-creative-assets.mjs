#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '116';
process.env.MRX_ARTICLE_SLUG = 'texas-rrc-production-by-filing-operator-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Texas RRC Production by Filing Operator Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC Production by Filing Operator retrieval';
process.env.MRX_HERO_FILENAME = 'texas-rrc-production-by-filing-operator-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-production-by-filing-operator-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC',
  'Production by Filing Operator',
  'Retrieval Provenance',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC Production by',
  'Filing Operator retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'Premium oblique three-quarter archival research desk with one hand only at the far right holding a blank evidence tag, a blank provenance worksheet with a neutral branching route diagram, closed evidence folders, a stamp, envelope, pencil, and uninterrupted left navy title field. No monitor, laptop, readable text, values, logos, government seals, official interface screenshot, maps, production figures, money, ownership, value, offer, conclusion, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct people-free strict-overhead horizontal evidence chain with six blank paper stations connected by navy cord inside a gold boundary, blank folder, tag, reference card, retained-evidence envelope, three neutral status tokens, and uninterrupted lower navy keyword band. No hand, person, monitor, laptop, calculator, readable text, values, logos, government seals, official interface screenshot, maps, production figures, money, ownership, value, offer, result, conclusion, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
