#!/usr/bin/env node
// One-time setup: split the categories.json into per-item JSON files
// matching Astro 5's data-collection folder convention.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CATS = join(ROOT, 'src', 'content', 'categories');
const SRC = join(ROOT, 'src', 'content', 'categories.json');

const cats = JSON.parse(await readFile(SRC, 'utf-8'));
await rm(CATS, { recursive: true, force: true });
await mkdir(CATS, { recursive: true });

for (const c of cats) {
  await writeFile(join(CATS, `${c.slug}.json`), JSON.stringify(c, null, 2) + '\n');
}
await rm(SRC);
console.log(`✅ Split ${cats.length} categories into ${CATS}/`);
