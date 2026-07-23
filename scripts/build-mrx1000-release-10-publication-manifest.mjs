#!/usr/bin/env node
/** Build the deterministic pre-publication and rollback manifest for release-10. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

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
    const releaseReady = Boolean(
      scalar(fm, 'title') === entry.title &&
        bool(fm, 'draft') === false &&
        bool(fm, 'noindex') === false &&
        scalar(fm, 'publication_status') === 'published' &&
        assets?.disposition === 'PASS' &&
        assets?.body_sha256 === bodySha &&
        assets?.frontmatter_sha256 === fmSha,
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
      rollback: {
        prior_public_state: 'not_in_production_article_sitemap',
        restore_frontmatter: {
          draft: true,
          publication_status: 'draft',
          noindex: true,
          reviewed_by: 'mrx_compliance-pending-release-10',
        },
        procedure:
          'Restore the pre-release frontmatter state for this exact source path, rebuild through every release gate, redeploy the previous verified Vercel production deployment, and verify the URL is absent from article sitemap and LLM indexes.',
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
