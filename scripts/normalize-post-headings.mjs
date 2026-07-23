#!/usr/bin/env node
/**
 * ArticleLayout owns the single visible H1. Imported MDX frequently repeats
 * the title as a Markdown H1 or repeats an H2 twice, so normalize both
 * patterns before publication.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const postsDir = join(process.cwd(), 'src', 'content', 'posts');
const checkOnly = process.argv.includes('--check');
const files = (await readdir(postsDir)).filter((file) => file.endsWith('.mdx')).sort();
let changed = 0;
let remaining = 0;

for (const file of files) {
  const path = join(postsDir, file);
  const source = await readFile(path, 'utf-8');
  const frontmatterEnd = source.indexOf('\n---', 4);
  if (frontmatterEnd < 0) continue;
  const bodyStart = frontmatterEnd + 4;
  const head = source.slice(0, bodyStart);
  const body = source.slice(bodyStart);
  const bodyH1Count = (body.match(/^# /gm) ?? []).length;
  const duplicateHeadingPattern = /^(## .+)\r?\n(?:[ \t]*\r?\n)+\1(?=\r?\n)/gm;
  const duplicateHeadingCount = (body.match(duplicateHeadingPattern) ?? []).length;
  const normalized = body.replace(/^# (.+)$/gm, '## $1').replace(duplicateHeadingPattern, '$1');
  const count = bodyH1Count + duplicateHeadingCount;
  if (count === 0) continue;
  remaining += count;
  changed += 1;
  if (!checkOnly) await writeFile(path, `${head}${normalized}`, 'utf-8');
}

if (checkOnly && remaining > 0) {
  console.error(
    `[normalize-post-headings] ${remaining} body H1 or adjacent duplicate H2 issue(s) remain in ${changed} post(s).`,
  );
  process.exit(1);
}

console.log(
  checkOnly
    ? `[normalize-post-headings] ${files.length} posts have no body H1s or adjacent duplicate H2s.`
    : `[normalize-post-headings] normalized headings in ${changed} of ${files.length} posts.`,
);
