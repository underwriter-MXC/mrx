#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '157';
process.env.MRX_ARTICLE_SLUG =
  'form-50-843-electronic-delivery-request-field-inventory-crane-mineral-properties';
process.env.MRX_ARTICLE_TITLE =
  'Form 50-843 Electronic Delivery Request Field Inventory for Crane Mineral Properties';
process.env.MRX_ARTICLE_KEYWORD = 'Form 50-843 Crane mineral property';
process.env.MRX_HERO_FILENAME =
  'form-50-843-electronic-delivery-request-field-inventory-for-crane-mineral-properties';
process.env.MRX_INLINE_FILENAME = 'form-50-843-crane-mineral-property';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Form 50-843',
  'Electronic Delivery',
  'Request Field Inventory',
  'for Crane Mineral Properties',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify(['Form 50-843', 'Crane mineral property']);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free eye-level county-records form-control station with one blank cream document sleeve, six blank blue divider tabs, a teal custody ribbon, closed charcoal archive box, and abstract West Texas limestone sample confined to the right of uninterrupted deep-navy title space. No person, hand, map, real form, paper text, letter, number, check mark, date, time, property detail, money, logo, seal, government emblem, screen, QR code, watermark, signature, recommendation, legal interpretation, tax conclusion, delivery result, or outcome.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned people-free strict-overhead light-limestone blank six-card field grid with a separate blank source-version card, empty transparent copy pocket, one unmarked charcoal stop token, teal pencil, and mineral core sample above an uninterrupted lower navy keyword band. No archive box, eye-level angle, real form, paper text, letter, number, check mark, date, time, name, address, email, property detail, money, logo, seal, government emblem, screen, QR code, watermark, signature, recommendation, legal interpretation, tax conclusion, delivery result, or outcome.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
