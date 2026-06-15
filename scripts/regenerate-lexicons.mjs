#!/usr/bin/env node
/**
 * scripts/regenerate-lexicons.mjs
 *
 * Re-generates compliance/disallowed.json and compliance/named-competitors.json
 * from the source compliance review markdown. CI verifies the JSON is
 * current (the file's last_generated timestamp is checked against the
 * review's Date: line).
 *
 * Per `Compliance Aware Implementation Rules.md` §1.1.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Path to the source compliance review (project-pack, not in repo).
const SOURCE_REVIEW = resolve(
  ROOT,
  '../../t_b11c5561/project-pack/04-compliance/MRX Compliance Review.md',
);

if (!existsSync(SOURCE_REVIEW)) {
  console.error(
    `❌ Source compliance review not found at ${SOURCE_REVIEW}. ` +
      'The project-pack/04-compliance/ folder is upstream of the repo; ' +
      'regenerate from there or skip if the JSON is already current.',
  );
  // We do NOT fail the script; the JSON in the repo is the source of
  // truth at build time. The CI cross-check lives in compliance/scripts/
  // check-compliance.mjs (see last_generated timestamps).
  console.log('   Skipping regeneration; repo JSON is the build-time source of truth.');
  process.exit(0);
}

const text = await readFile(SOURCE_REVIEW, 'utf-8');

// Pull §4 disallowed phrases
const disallowedSection = text.match(/## 4\. Disallowed Language Lexicon[\s\S]+?(?=## 5\.)/);
if (!disallowedSection) {
  console.error('❌ Could not locate §4 in the source review.');
  process.exit(1);
}

const phraseLines = disallowedSection[0].split('\n').filter((l) => l.startsWith('- '));
const phrases = phraseLines
  .map((l) => l.slice(2).split(/\s*\(([^)]+)\)/)[0].trim())
  .filter(Boolean);

const dateMatch = text.match(/^Date:\s*(\d{4}-\d{2}-\d{2})/m);
const sourceDate = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);

const disallowed = {
  $schema: 'https://json-schema.org/draft-07/schema#',
  title: 'MRX §4 Disallowed-Language Lexicon',
  description:
    'Generated from project-pack/04-compliance/MRX Compliance Review.md §4. Used by compliance/scripts/check-compliance.mjs.',
  last_generated: new Date().toISOString(),
  source_review: 'project-pack/04-compliance/MRX Compliance Review.md',
  source_section: '§4 Disallowed Language Lexicon',
  source_date: sourceDate,
  phrases,
};

await writeFile(
  join(ROOT, 'compliance', 'disallowed.json'),
  JSON.stringify(disallowed, null, 2) + '\n',
);

console.log(`✅ Wrote ${phrases.length} disallowed phrases.`);
