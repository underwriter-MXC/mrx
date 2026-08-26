#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '156';
process.env.MRX_ARTICLE_SLUG = 'brazos-cad-mineral-property-arb-hearing-notice-inventory';
process.env.MRX_ARTICLE_TITLE = 'Brazos CAD Mineral Property ARB Hearing Notice Inventory';
process.env.MRX_ARTICLE_KEYWORD = 'Brazos CAD mineral property ARB hearing notice';
process.env.MRX_HERO_FILENAME = 'brazos-cad-mineral-property-arb-hearing-notice-inventory';
process.env.MRX_INLINE_FILENAME = 'brazos-cad-mineral-property-arb-hearing-notice';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Brazos CAD',
  'Mineral Property',
  'ARB Hearing Notice',
  'Inventory',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Brazos CAD mineral property',
  'ARB hearing notice',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free eye-level archival intake station with one sealed blank cream notice sleeve, shallow dark archival tray, blank divider tabs, a no-numeral desk clock, closed charcoal record box, and blank enclosure cards confined to the right of uninterrupted deep-navy title space. No map, public-status screen, evidence-packet assembly, person, hand, readable text, letter, number, date, time, place, owner, address, account, property, value, tax amount, money, real form, signature, logo, seal, recommendation, legal interpretation, appraisal result, hearing result, or outcome.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned people-free strict-overhead light-stone inventory flat lay with one blank document sleeve, six blank enclosure-index tiles, a transparent archival-copy pocket, three unmarked status tokens, pencil, and unnumbered ruler above an uninterrupted lower navy keyword band. No clock, record box, window, eye-level perspective, map, public-status screen, evidence-packet assembly, person, hand, readable text, letter, number, date, time, place, owner, address, account, property, value, tax amount, money, real form, signature, logo, seal, recommendation, legal interpretation, appraisal result, hearing result, or outcome.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
