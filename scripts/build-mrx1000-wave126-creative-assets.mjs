#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '126';
process.env.MRX_ARTICLE_SLUG =
  'texas-rrc-injection-storage-test-report-retrieval-provenance-worksheet';
process.env.MRX_ARTICLE_TITLE =
  'Texas RRC Injection-Storage Test Report Retrieval Provenance Worksheet';
process.env.MRX_ARTICLE_KEYWORD = 'Texas RRC injection-storage test report retrieval';
process.env.MRX_HERO_FILENAME =
  'texas-rrc-injection-storage-test-report-retrieval-provenance-worksheet';
process.env.MRX_INLINE_FILENAME = 'texas-rrc-injection-storage-test-report-retrieval';
process.env.MRX_HERO_LINES_JSON = JSON.stringify([
  'Texas RRC Injection-Storage',
  'Test Report Retrieval',
  'Provenance Worksheet',
]);
process.env.MRX_INLINE_LINES_JSON = JSON.stringify([
  'Texas RRC injection-storage',
  'test report retrieval',
]);
process.env.MRX_HERO_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_INLINE_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
process.env.MRX_HERO_GENERATION_PROMPT =
  'People-free archival research station with a microfilm viewer, blank archive drawer, blank folders, loupe, deep navy background, copper accents, and uninterrupted left title field. No readable base text, identifiers, wells, operators, dates, results, pressure readings, compliance or engineering claims, logos, seals, official interface, money, legal imagery, automation, people, or watermark.';
process.env.MRX_INLINE_GENERATION_PROMPT =
  'Materially distinct top-down evidence desk with one gloved hand, three blank sleeves, unlabeled pressure-chart roll, blank checklist, loupe, and uninterrupted lower navy keyword band. No microfilm viewer, room perspective, readable base text, identifiers, wells, operators, dates, results, pressure readings, compliance or engineering claims, logos, seals, official interface, money, legal imagery, automation, or watermark.';

await import('./build-mrx1000-wave82-creative-assets.mjs');
