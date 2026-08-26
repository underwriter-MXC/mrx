#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '154';
process.env.MRX_ARTICLE_SLUG =
  'brazos-county-texas-mineral-rights-property-tax-protest-evidence-packet';
process.env.MRX_ARTICLE_TITLE =
  'Brazos County, Texas Mineral Rights Property Tax Protest Evidence Packet';
process.env.MRX_ARTICLE_KEYWORD = 'Brazos County mineral rights property tax protest';
process.env.MRX_HERO_FILENAME =
  'brazos-county-texas-mineral-rights-property-tax-protest-evidence-packet';
process.env.MRX_INLINE_FILENAME =
  'brazos-county-mineral-rights-property-tax-protest';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Brazos County,',
  'Texas Mineral Rights',
  'Property Tax Protest',
  'Evidence Packet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Brazos County mineral rights',
  'property tax protest',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free eye-level evidence-preparation station with a blank accordion folder, blank notice sleeve, blank source-date tabs, blank discrepancy cards, and an archival box confined to the right of uninterrupted deep-navy title space. No map, routing wall, account-search screen, person, hand, readable text, letter, number, date, owner, address, account, property, value, tax amount, dollar sign, real form, signature, logo, seal, recommendation, legal or tax conclusion, appraisal result, or outcome.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned people-free strict-overhead warm-cream four-card evidence matrix with blank source, period, discrepancy, and unresolved cards, teal and amber tabs, blank sleeves, paper clips, and an uninterrupted lower navy keyword band. No standing folder, archive box, wall, map, calculator, person, hand, readable text, letter, number, date, owner, address, account, property, value, tax amount, dollar sign, real form, signature, logo, seal, recommendation, legal or tax conclusion, appraisal result, or outcome.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
