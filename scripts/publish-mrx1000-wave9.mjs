#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { analyzeControlledPublicationTransition } from './_mrx1000-controlled-publication-transition.mjs';

const root = resolve(import.meta.dirname, '..');
const batch = JSON.parse(await readFile(join(root, 'config/mrx1000-release-10-batch.json'), 'utf8'));
const rows = batch.articles.filter((row) => row.selection_rank >= 71 && row.selection_rank <= 80);

if (rows.length !== 10) throw new Error(`Expected ten Wave 9 rows; found ${rows.length}`);

for (const row of rows) {
  const path = join(root, row.repo_path);
  const reviewed = await readFile(path, 'utf8');
  const before = analyzeControlledPublicationTransition(reviewed, row);
  if (!before.authorized || before.state !== 'reviewed_bytes_current') {
    throw new Error(`${row.slug}: source does not match the reviewed admission bytes`);
  }
  const statusMatches = reviewed.match(/^publication_status: draft$/gm) ?? [];
  const noindexMatches = reviewed.match(/^noindex: true$/gm) ?? [];
  if (statusMatches.length !== 1 || noindexMatches.length !== 1) {
    throw new Error(`${row.slug}: publication scalars are not unique`);
  }
  const published = reviewed
    .replace(/^publication_status: draft$/m, 'publication_status: published')
    .replace(/^noindex: true$/m, 'noindex: false');
  const after = analyzeControlledPublicationTransition(published, row);
  if (!after.authorized || after.state !== 'controlled_publication_transition') {
    throw new Error(`${row.slug}: controlled transition proof failed (${after.reason})`);
  }
  await writeFile(path, published, 'utf8');
  console.log(`${row.slug}: controlled publication transition PASS`);
}
