#!/usr/bin/env node

import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'dist', 'client');
const stagedDir = path.join(root, 'tmp', 'playwright-build');

await mkdir(stagedDir, { recursive: true });
const sitemapFiles = (await readdir(buildDir)).filter(
  (file) => file.startsWith('sitemap') && file.endsWith('.xml'),
);

if (!sitemapFiles.includes('sitemap_index.xml') || !sitemapFiles.includes('sitemap-articles.xml')) {
  throw new Error('The Vercel build did not emit the expected canonical sitemap artifacts.');
}

await Promise.all(
  sitemapFiles.map((file) => copyFile(path.join(buildDir, file), path.join(stagedDir, file))),
);

console.log(`Staged ${sitemapFiles.length} sitemap artifacts for Playwright.`);
