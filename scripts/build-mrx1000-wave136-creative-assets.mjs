#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '136';
process.env.MRX_ARTICLE_SLUG = 'mineral-rights-retained-evidence-source-scope-worksheet';
process.env.MRX_ARTICLE_TITLE = 'Mineral Rights Retained Evidence Source-Scope Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'mineral rights retained evidence source scope';
process.env.MRX_HERO_FILENAME = 'mineral-rights-retained-evidence-source-scope-worksheet';
process.env.MRX_INLINE_FILENAME = 'mineral-rights-retained-evidence-source-scope';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Mineral Rights Retained',
  'Evidence Source-Scope',
  'Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'mineral rights retained',
  'evidence source scope',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned wide low-oblique people-free single blank retained artifact on a circular evidence tray with blank source-scope card, navy sleeve, copper pen, subtle contour texture, and uninterrupted left navy title space. No readable text, letters, numbers, names, data, form, logo, seal, person, face, hand, screen, search interface, status mark, signature, watermark, conclusion, property, offer, or transaction imagery.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned strict-overhead people-free blank four-quadrant evidence-scope worksheet with separate blank limitation card, navy archival sleeve, abstract rectangle-only integrity strip, and uninterrupted lower navy keyword band. No circular tray, oblique angle, pen, readable text, letters, numbers, names, data, digest, logo, seal, form, person, hand, screen, status mark, signature, watermark, conclusion, property, offer, or transaction imagery.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
