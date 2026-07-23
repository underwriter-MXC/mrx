#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const GENERATOR = path.join(SCRIPT_DIR, 'build-searchatlas-completed-archive-reconciliation.mjs');
const OUTPUT_DIR = path.join(
  MRX_ROOT,
  'reports/searchatlas-completed-archive-reconciliation-2026-07-20',
);
const FILES = [
  'completed-archive-reconciliation.json',
  'completed-archive-reconciliation.md',
  'completed-archive-reconciliation.json.sha256',
  'completed-archive-reconciliation.md.sha256',
];

function fail(message) {
  throw new Error(`SearchAtlas completed-archive verifier failed: ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function resolveRecordedPath(recordedPath) {
  if (recordedPath === '~') return homedir();
  if (recordedPath.startsWith('~/')) return path.join(homedir(), recordedPath.slice(2));
  if (recordedPath.startsWith('../')) return path.resolve(MRX_ROOT, recordedPath);
  if (path.isAbsolute(recordedPath)) return recordedPath;
  return path.join(MRX_ROOT, recordedPath);
}

function verifyFileEvidence(evidence, label) {
  const filePath = resolveRecordedPath(evidence.path);
  if (!existsSync(filePath)) fail(`${label} file missing: ${filePath}`);
  const bytes = readFileSync(filePath);
  if (bytes.length !== evidence.bytes) fail(`${label} byte count changed`);
  if (sha256(bytes) !== evidence.sha256) fail(`${label} SHA-256 changed`);
}

function verifySidecar(fileName) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  const sidecarPath = `${filePath}.sha256`;
  const expected = `${sha256(readFileSync(filePath))}  ${fileName}\n`;
  if (readFileSync(sidecarPath, 'utf8') !== expected) fail(`${fileName} sidecar mismatch`);
}

const manifestPath = path.join(OUTPUT_DIR, FILES[0]);
const reportPath = path.join(OUTPUT_DIR, FILES[1]);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const report = readFileSync(reportPath, 'utf8');

if (manifest.aggregate.searchatlas_completed_records !== 70) fail('record count is not 70');
if (manifest.rows.length !== 70) fail('rows length is not 70');
if (new Set(manifest.rows.map((row) => row.searchatlas.uuid)).size !== 70) {
  fail('SearchAtlas UUIDs are not unique');
}
if (manifest.aggregate.title_drift_records !== 2) fail('title-drift count is not 2');
if (manifest.aggregate.current_searchatlas_body_equivalence_proven !== 0) {
  fail('manifest incorrectly claims current SearchAtlas body equivalence');
}
if (manifest.aggregate.current_searchatlas_body_equivalence_unproven !== 70) {
  fail('manifest does not mark all 70 current-body relationships unproven');
}
if (sha256(JSON.stringify(manifest.rows)) !== manifest.content_fingerprint_sha256) {
  fail('row content fingerprint mismatch');
}

for (const [index, row] of manifest.rows.entries()) {
  const label = `row ${index + 1} / ${row.searchatlas.uuid}`;
  if (row.searchatlas.local_content_field_state !== 'NULL') fail(`${label} content is not NULL`);
  if (row.current_searchatlas_body_equivalence.state !== 'UNPROVEN') {
    fail(`${label} current body is not UNPROVEN`);
  }
  if (!row.current_searchatlas_body_equivalence.archive_predates_vendor_updated_at) {
    fail(`${label} does not preserve the newer vendor updated_at limitation`);
  }
  verifyFileEvidence(row.historical_wp_searchatlas_archive.markdown_file, `${label} archive`);
  verifyFileEvidence(row.historical_wp_searchatlas_archive.wp_source_json_file, `${label} WP JSON`);
  verifyFileEvidence(row.current_repo.file, `${label} repo`);

  const sourceJson = JSON.parse(
    readFileSync(
      resolveRecordedPath(row.historical_wp_searchatlas_archive.wp_source_json_file.path),
      'utf8',
    ),
  );
  if (
    sha256(sourceJson.content.raw) !==
    row.historical_wp_searchatlas_archive.wp_source_body.raw_body_sha256
  ) {
    fail(`${label} historical raw body SHA-256 changed`);
  }
  if (
    sha256(sourceJson.content.rendered) !==
    row.historical_wp_searchatlas_archive.wp_source_body.rendered_body_sha256
  ) {
    fail(`${label} historical rendered body SHA-256 changed`);
  }
}

for (const source of [
  manifest.sources.signed_d11,
  manifest.sources.readonly_capacity_exportability_preflight,
  manifest.sources.local_searchatlas_metadata_export,
  manifest.sources.historical_wp_export_manifest,
  manifest.sources.canonical_content_ledger,
]) {
  verifyFileEvidence(source, `source ${source.path}`);
}

if (
  !report.includes(
    'Current SearchAtlas body equivalence is therefore **UNPROVEN for all 70 records**',
  )
) {
  fail('report is missing the explicit all-70 current-body limitation');
}
if (!report.includes('No live `cg_*` call')) fail('report is missing the no-cg attestation');

verifySidecar(FILES[0]);
verifySidecar(FILES[1]);

const temporaryOutput = mkdtempSync(path.join(tmpdir(), 'mrx-searchatlas-completed-reconcile-'));
try {
  const result = spawnSync(process.execPath, [GENERATOR], {
    cwd: MRX_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      MRX_SEARCHATLAS_COMPLETED_RECONCILIATION_OUTPUT_DIR: temporaryOutput,
    },
  });
  if (result.status !== 0) {
    fail(`isolated deterministic regeneration failed\n${result.stdout}\n${result.stderr}`);
  }
  for (const fileName of FILES) {
    const checkedIn = readFileSync(path.join(OUTPUT_DIR, fileName));
    const regenerated = readFileSync(path.join(temporaryOutput, fileName));
    if (!checkedIn.equals(regenerated)) fail(`${fileName} is not byte-deterministic`);
  }
} finally {
  rmSync(temporaryOutput, { recursive: true, force: true });
}

process.stdout.write(
  `${JSON.stringify(
    {
      verdict: 'PASS',
      rows_verified: 70,
      title_drift_records: 2,
      current_searchatlas_body_equivalence: 'UNPROVEN_FOR_ALL_70_RECORDS',
      deterministic_regeneration: 'BYTE_IDENTICAL',
      manifest_sha256: sha256(readFileSync(manifestPath)),
      report_sha256: sha256(readFileSync(reportPath)),
    },
    null,
    2,
  )}\n`,
);
