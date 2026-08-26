#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '158';
process.env.MRX_ARTICLE_SLUG =
  'form-50-172-joint-taxation-instruction-source-map-crane-mineral-interests';
process.env.MRX_ARTICLE_TITLE =
  'Form 50-172 Joint-Taxation Instruction Source Map for Crane Mineral Interests';
process.env.MRX_ARTICLE_KEYWORD = 'Form 50-172 Crane mineral interest';
process.env.MRX_HERO_FILENAME =
  'form-50-172-joint-taxation-instruction-source-map-for-crane-mineral-interests';
process.env.MRX_INLINE_FILENAME = 'form-50-172-crane-mineral-interest';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Form 50-172',
  'Joint-Taxation',
  'Instruction Source Map',
  'for Crane Mineral Interests',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Form 50-172',
  'Crane mineral interest',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free oblique eye-level source-provenance research station with a blank open two-page instruction booklet in an acrylic cradle, a closed blue source folio, three unmarked provenance tabs, a mineral core sample, and a brass line-guide tool confined to the right of uninterrupted deep-navy title space. No person, hand, map, real form, paper text, letter, number, checkbox, signature, date, screen, QR code, logo, seal, government emblem, legal conclusion, tax guidance, deadline, filing claim, recommendation, outcome, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned people-free strict-overhead pale-limestone provenance map with four separated blank geometric source tiles connected by teal cotton threads to a central empty transparent evidence sleeve, plus one cobalt strip, one unmarked stop token, and a small mineral sample above an uninterrupted lower navy keyword band. No book, folio, acrylic cradle, upright tabs, brass line-guide, real map, real form, paper text, letter, number, checkbox, signature, date, screen, QR code, logo, seal, government emblem, legal conclusion, tax guidance, deadline, filing claim, recommendation, outcome, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
