#!/usr/bin/env node
/** Build the deterministic pre-publication and rollback manifest for release-10. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { analyzeControlledPublicationTransition } from './_mrx1000-controlled-publication-transition.mjs';

const root = resolve(
  process.argv.find((arg) => arg.startsWith('--tree='))?.slice('--tree='.length) ??
    process.env.MRX_TREE ??
    resolve(import.meta.dirname, '..'),
);
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const assetPath = join(root, 'artifacts/mrx1000-release-10/assets/asset-evidence.json');
const outputPath = join(root, 'artifacts/mrx1000-release-10/release/publication-manifest.json');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function frontmatter(source) {
  return source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function unquote(value) {
  return String(value ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
}

function bool(block, key) {
  return scalar(block, key) === 'true';
}

function exactDraftAdmissionReady(block, entry) {
  return Boolean(
    bool(block, 'noindex') === true &&
      scalar(block, 'publication_status') === 'draft' &&
      entry.admission_status === 'admitted_exact' &&
      entry.finalization_state === 'draft_noindex_admitted',
  );
}

function verifySidecar(path) {
  const sidecar = `${path}.sha256`;
  if (!existsSync(path) || !existsSync(sidecar)) return false;
  const expected = readFileSync(sidecar, 'utf8').trim().match(/^([a-f0-9]{64})(?:\s|$)/i)?.[1];
  return expected?.toLowerCase() === sha256(readFileSync(path));
}

function main() {
  const batchBytes = readFileSync(batchPath);
  const batch = JSON.parse(batchBytes.toString('utf8'));
  if (!verifySidecar(assetPath)) throw new Error('Asset evidence or its SHA-256 sidecar is missing/stale.');
  const assetBytes = readFileSync(assetPath);
  const assetEvidence = JSON.parse(assetBytes.toString('utf8'));
  const assetsBySlug = new Map(assetEvidence.rows.map((row) => [row.slug, row]));
  const rows = [];
  for (const entry of batch.articles ?? []) {
    const articlePath = join(root, entry.repo_path);
    const bodyBytes = readFileSync(articlePath);
    const fm = frontmatter(bodyBytes.toString('utf8'));
    const bodySha = sha256(bodyBytes);
    const fmSha = sha256(Buffer.from(`${fm}\n`, 'utf8'));
    const assets = assetsBySlug.get(entry.slug);
    const transition = analyzeControlledPublicationTransition(bodyBytes, entry);
    const heroAsset = assets?.assets?.find((asset) => asset.kind === 'hero') ?? null;
    const socialAsset = assets?.assets?.find((asset) => asset.kind === 'social') ?? null;
    const exactWave2 = entry.admission_status === 'admitted_exact';
    const exactHeroReady = !exactWave2 || Boolean(
      heroAsset?.public_path === entry.hero_path &&
        socialAsset?.public_path === entry.hero_path &&
        heroAsset?.sha256 === (entry.hero_asset_sha256 ?? entry.hero_sha256) &&
        socialAsset?.sha256 === (entry.hero_asset_sha256 ?? entry.hero_sha256) &&
        heroAsset?.observed_width === 1200 &&
        heroAsset?.observed_height === 630 &&
        heroAsset?.observed_mime_type === 'image/webp',
    );
    const frontmatterReady =
      (bool(fm, 'draft') === false &&
        bool(fm, 'noindex') === false &&
        scalar(fm, 'publication_status') === 'published') ||
      exactDraftAdmissionReady(fm, entry);
    const releaseReady = Boolean(
      scalar(fm, 'title') === entry.title &&
        frontmatterReady &&
        transition.authorized &&
        assets?.disposition === 'PASS' &&
        assets?.body_sha256 === bodySha &&
        assets?.frontmatter_sha256 === fmSha &&
        exactHeroReady,
    );
    rows.push({
      program_row_id: entry.program_row_id,
      slug: entry.slug,
      title: entry.title,
      canonical_url: entry.canonical_url,
      source_path: entry.repo_path,
      body_sha256: bodySha,
      frontmatter_sha256: fmSha,
      asset_evidence_sha256: sha256(assetBytes),
      expected_targets: ['vercel-origin-via-cloudflare-apex'],
      rollback_reference: `rollback:${entry.slug}`,
      release_owner: 'chestyorchestrator',
      disposition: releaseReady ? 'READY' : 'HOLD',
      source_frontmatter_state: {
        draft: bool(fm, 'draft'),
        noindex: bool(fm, 'noindex'),
        publication_status: scalar(fm, 'publication_status'),
        exact_admission_pre_flip_ready: exactDraftAdmissionReady(fm, entry),
      },
      controlled_publication_transition: transition,
      canonical_hero_identity: {
        public_path: heroAsset?.public_path ?? null,
        sha256: heroAsset?.sha256 ?? null,
        alt_text: heroAsset?.alt_text ?? null,
        width: heroAsset?.observed_width ?? null,
        height: heroAsset?.observed_height ?? null,
        mime_type: heroAsset?.observed_mime_type ?? null,
        hero_social_same_asset:
          Boolean(heroAsset && socialAsset) &&
          heroAsset.public_path === socialAsset.public_path &&
          heroAsset.sha256 === socialAsset.sha256,
      },
      rollback: {
        prior_public_state:
          entry.admission_status === 'admitted_exact'
            ? 'not_in_production_article_sitemap'
            : 'verified_public_before_wave2',
        restore_frontmatter: {
          draft: false,
          publication_status:
            entry.admission_status === 'admitted_exact' ? 'draft' : 'published',
          noindex: entry.admission_status === 'admitted_exact',
          reviewed_by: scalar(fm, 'reviewed_by') || null,
        },
        reviewed_source_sha256: transition.reviewed_body_sha256,
        current_source_sha256: transition.current_body_sha256,
        procedure:
          entry.admission_status === 'admitted_exact'
            ? 'Restore only publication_status to draft and noindex to true for this exact source path; verify the restored file SHA-256 equals reviewed_source_sha256; rebuild through every release gate; redeploy the previous verified Vercel production deployment; and verify the URL is absent from article sitemap and LLM indexes.'
            : 'Redeploy the previous verified Vercel production deployment and verify the incumbent article remains public.',
      },
    });
  }
  const payload = {
    artifact_type: 'mrx1000_release_10_publication_manifest',
    schema_version: '1.0.0',
    generated_at_utc: batch.evidence_scaffold_generated_at_utc,
    batch_config_path: 'config/mrx1000-release-10-batch.json',
    batch_config_sha256: sha256(batchBytes),
    asset_evidence_path: relative(root, assetPath),
    asset_evidence_sha256: sha256(assetBytes),
    hero_rebinding_authority: {
      decision_id:
        batch.decision_authority?.batch_admission_hero_rebinding_addendum_id ?? null,
      path:
        batch.decision_authority?.batch_admission_hero_rebinding_addendum_path ?? null,
      sha256:
        batch.decision_authority?.batch_admission_hero_rebinding_addendum_sha256 ?? null,
    },
    production_registry: {
      confirmed_active_targets_at_preflight: ['vercel-origin-via-cloudflare-apex'],
      canonical_origin: 'https://mineralrightsxchange.com',
      rediscovery_required_immediately_before_publish: true,
    },
    summary: {
      article_count: rows.length,
      ready_count: rows.filter((row) => row.disposition === 'READY').length,
      all_ready: rows.every((row) => row.disposition === 'READY'),
    },
    rows,
  };
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, text);
  writeFileSync(`${outputPath}.sha256`, `${sha256(Buffer.from(text))}  ${relative(root, outputPath)}\n`);
  console.log(`Publication manifest: ${payload.summary.all_ready ? 'READY' : 'HOLD'} (${payload.summary.ready_count}/${rows.length}).`);
  if (!payload.summary.all_ready) process.exitCode = 2;
}

main();
