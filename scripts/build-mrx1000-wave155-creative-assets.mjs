#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '155';
process.env.MRX_ARTICLE_SLUG = 'brazos-cad-mineral-property-protest-status-verification-log';
process.env.MRX_ARTICLE_TITLE = 'Brazos CAD Mineral Property Protest Status Verification Log';
process.env.MRX_ARTICLE_KEYWORD = 'Brazos CAD mineral property protest status';
process.env.MRX_HERO_FILENAME = 'brazos-cad-mineral-property-protest-status-verification-log';
process.env.MRX_INLINE_FILENAME = 'brazos-cad-mineral-property-protest-status';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Brazos CAD',
  'Mineral Property',
  'Protest Status',
  'Verification Log',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Brazos CAD mineral property',
  'protest status',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'MRX-owned people-free eye-level post-submission status-observation station with an abstract unlabeled four-step timeline on a generic monitor, a face-down blank confirmation sleeve, a no-digit clock, and a closed record box confined to the right of uninterrupted deep-navy title space. No map, account-search result, routing wall, evidence-packet folder, person, hand, readable text, letter, number, date, owner, address, account, property, value, tax amount, money, real form, signature, logo, seal, recommendation, legal interpretation, appraisal result, hearing result, or outcome.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct MRX-owned people-free strict-overhead warm-cream blank four-row status-observation ledger with a face-down confirmation sleeve, blank archival capture card, no-digit clock, and separate teal, cream, and amber status tokens above an uninterrupted lower navy keyword band. No monitor, wall, lamp, standing box, map, account-search result, routing diagram, evidence-packet folder, person, hand, readable text, letter, number, date, owner, address, account, property, value, tax amount, money, real form, signature, logo, seal, recommendation, legal interpretation, appraisal result, hearing result, or outcome.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
