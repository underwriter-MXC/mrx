#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(
  process.argv.find((arg) => arg.startsWith('--tree='))?.slice('--tree='.length) ??
    process.env.MRX_TREE ??
    resolve(import.meta.dirname, '..'),
);
const write = process.argv.includes('--write');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const retrofitPath = join(root, 'config/mrx-article-two-image-retrofit.json');
const decisionRelativePath =
  'artifacts/mrx1000-release-10/decisions/mrx-owner-two-image-retrofit-authorization-20260811.md';
const decisionPath = join(root, decisionRelativePath);
const retainedBaselineRelativePath =
  'artifacts/mrx1000-release-10/release/retained-production-baseline.json';
const retainedBaselinePath = join(root, retainedBaselineRelativePath);
const postsDirectory = join(root, 'src/content/posts');

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

if (!existsSync(batchPath)) throw new Error(`Missing batch config: ${batchPath}`);
if (!existsSync(retrofitPath)) throw new Error(`Missing retrofit manifest: ${retrofitPath}`);
if (!existsSync(decisionPath)) throw new Error(`Missing owner retrofit decision: ${decisionPath}`);

const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
const retrofitBytes = readFileSync(retrofitPath);
const retrofit = JSON.parse(retrofitBytes.toString('utf8'));
const decisionBytes = readFileSync(decisionPath);
const bySlug = new Map((retrofit.rows ?? []).map((row) => [row.slug, row]));
const problems = [];
const rows = [];

const publicSourceCount = readdirSync(postsDirectory)
  .filter((name) => name.endsWith('.mdx'))
  .filter((name) => {
    const source = readFileSync(join(postsDirectory, name), 'utf8');
    return (
      /^publication_status:\s*published\s*$/m.test(source) &&
      !/^draft:\s*true\s*$/m.test(source) &&
      !/^noindex:\s*true\s*$/m.test(source)
    );
  }).length;

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

for (const entry of batch.articles ?? []) {
  const imageRow = bySlug.get(entry.slug);
  const sourcePath = join(root, entry.repo_path ?? '');
  if (!imageRow) problems.push(`${entry.slug}: missing retrofit row`);
  if (!existsSync(sourcePath)) problems.push(`${entry.slug}: missing source ${entry.repo_path}`);
  if (!imageRow || !existsSync(sourcePath)) continue;
  if (imageRow.title !== entry.title) problems.push(`${entry.slug}: title mismatch`);
  if (!imageRow.hero?.ocr?.pass) problems.push(`${entry.slug}: hero OCR is not PASS`);
  if (!imageRow.inline?.ocr?.pass) problems.push(`${entry.slug}: inline OCR is not PASS`);
  if (imageRow.hero?.public_path === imageRow.inline?.public_path) {
    problems.push(`${entry.slug}: hero and inline paths are not distinct`);
  }
  if (imageRow.hero?.sha256 === imageRow.inline?.sha256) {
    problems.push(`${entry.slug}: hero and inline binaries are not distinct`);
  }
  const sourceSha = sha256(readFileSync(sourcePath));
  rows.push({
    slug: entry.slug,
    source_sha256: sourceSha,
    hero_path: imageRow.hero.public_path,
    hero_sha256: imageRow.hero.sha256,
    inline_path: imageRow.inline.public_path,
    inline_sha256: imageRow.inline.sha256,
    inline_rendered_text: imageRow.inline.rendered_text,
  });
  if (write) {
    entry.repo_sha256 = sourceSha;
    entry.article_sha256 = sourceSha;
    entry.hero_path = imageRow.hero.public_path;
    entry.hero_sha256 = imageRow.hero.sha256;
    entry.hero_asset_sha256 = imageRow.hero.sha256;
    entry.inline_path = imageRow.inline.public_path;
    entry.inline_asset_sha256 = imageRow.inline.sha256;
    entry.inline_rendered_text = imageRow.inline.rendered_text;
  }
}

const summary = {
  batch_article_count: batch.articles?.length ?? 0,
  rebound_article_count: rows.length,
  corpus_article_count: retrofit.rows?.length ?? 0,
  public_source_article_count: publicSourceCount,
  hero_ocr_pass_count: retrofit.summary?.hero_ocr_pass_count ?? 0,
  inline_ocr_pass_count: retrofit.summary?.inline_ocr_pass_count ?? 0,
  problems,
};

if (
  summary.batch_article_count !== rows.length ||
  summary.corpus_article_count !== summary.public_source_article_count ||
  summary.hero_ocr_pass_count !== summary.corpus_article_count ||
  summary.inline_ocr_pass_count !== summary.corpus_article_count
) {
  problems.push('summary counts do not prove the complete current public two-image corpus');
}

if (write && problems.length === 0) {
  batch.two_image_policy = {
    directive:
      'AI Atom Brain/09 Project Packs/MRX/2026-08-11 MRX Two-Image Article Creative Directive.md',
    retrofit_manifest_path: 'config/mrx-article-two-image-retrofit.json',
    retrofit_manifest_sha256: sha256(retrofitBytes),
    public_article_count: summary.corpus_article_count,
    batch_article_count: summary.batch_article_count,
    assets_per_article: 2,
    hero_share_identity_required: true,
    inline_image_distinct_required: true,
    text_filename_identity_required: true,
    ocr_pass_required: true,
    authorized_source_and_asset_rebinding: true,
  };
  batch.decision_authority.two_image_retrofit_decision_id = 'D-2026-0811-17';
  batch.decision_authority.two_image_retrofit_decision_path = decisionRelativePath;
  batch.decision_authority.two_image_retrofit_decision_sha256 = sha256(decisionBytes);
  batch.policy.exact_admitted_slate_sha256 = sha256(
    Buffer.from(JSON.stringify(sortDeep(batch.articles)), 'utf8'),
  );
  if (existsSync(retainedBaselinePath)) {
    batch.release_evidence_bindings.retained_production_baseline_manifest_json = {
      path: retainedBaselineRelativePath,
      sha256: sha256(readFileSync(retainedBaselinePath)),
    };
  }
  writeFileSync(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
}

console.log(JSON.stringify(summary, null, 2));
if (problems.length > 0) process.exitCode = 1;
