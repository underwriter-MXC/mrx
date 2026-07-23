#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format as formatWithPrettier } from 'prettier';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const WORKSPACE_ROOT = path.resolve(MRX_ROOT, '..');
const USER_HOME = homedir();

const DEFAULT_WP_EXPORT_DIR = path.join(
  USER_HOME,
  '.hermes/kanban/boards/mrx-growth/content_factory_1000/source_exports/searchatlas_wp_122',
);

const INPUTS = {
  searchatlasMetadata: path.resolve(
    process.env.MRX_SEARCHATLAS_COMPLETED_METADATA_PATH ??
      path.join(
        MRX_ROOT,
        'reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json',
      ),
  ),
  wpManifest: path.resolve(
    process.env.MRX_SEARCHATLAS_WP_MANIFEST_PATH ??
      path.join(DEFAULT_WP_EXPORT_DIR, 'manifest.json'),
  ),
  ledger: path.resolve(
    process.env.MRX_SEARCHATLAS_LEDGER_PATH ??
      path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json'),
  ),
  postsDir: path.resolve(
    process.env.MRX_SEARCHATLAS_POSTS_DIR ?? path.join(MRX_ROOT, 'src/content/posts'),
  ),
  d11: path.join(WORKSPACE_ROOT, 'program-plans/mrx-1000-ceo-decision-no-spend-capacity.md'),
  readonlyPreflight: path.join(
    WORKSPACE_ROOT,
    'program-plans/mrx-1000-044-searchatlas-readonly-capacity-exportability-preflight.md',
  ),
};

const OUTPUT_DIR = path.resolve(
  process.env.MRX_SEARCHATLAS_COMPLETED_RECONCILIATION_OUTPUT_DIR ??
    path.join(MRX_ROOT, 'reports/searchatlas-completed-archive-reconciliation-2026-07-20'),
);
const OUTPUTS = {
  manifest: path.join(OUTPUT_DIR, 'completed-archive-reconciliation.json'),
  report: path.join(OUTPUT_DIR, 'completed-archive-reconciliation.md'),
  manifestSidecar: path.join(OUTPUT_DIR, 'completed-archive-reconciliation.json.sha256'),
  reportSidecar: path.join(OUTPUT_DIR, 'completed-archive-reconciliation.md.sha256'),
};

const EXPECTED = {
  completedCount: 70,
  d11Sha256: '46a9d02548e97a794d1cdaa919682bb159bcfbeabb5b9d8e559431c6ca34091d',
  readonlyPreflightSha256: '851768fe45a88836e3885b7ba22013391297fe2fb8c09ac21e3f6f0860cb55ba',
};

function fail(message) {
  throw new Error(`SearchAtlas completed-archive reconciliation failed: ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fileEvidence(filePath) {
  if (!existsSync(filePath)) fail(`required file is missing: ${filePath}`);
  const bytes = readFileSync(filePath);
  return {
    path: displayPath(filePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function displayPath(filePath) {
  const absolute = path.resolve(filePath);
  if (absolute.startsWith(`${MRX_ROOT}${path.sep}`)) {
    return path.relative(MRX_ROOT, absolute).split(path.sep).join('/');
  }
  if (absolute.startsWith(`${WORKSPACE_ROOT}${path.sep}`)) {
    return `../${path.relative(WORKSPACE_ROOT, absolute).split(path.sep).join('/')}`;
  }
  if (absolute === USER_HOME) return '~';
  if (absolute.startsWith(`${USER_HOME}${path.sep}`)) {
    return `~/${path.relative(USER_HOME, absolute).split(path.sep).join('/')}`;
  }
  return absolute.split(path.sep).join('/');
}

function normalizeTitle(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"')))
  ) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  return value;
}

function parseFrontmatter(text, filePath) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) fail(`frontmatter is missing from ${filePath}`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line || /^\s/.test(line) || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    fields[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
  }
  return fields;
}

function uniqueMap(rows, keyFn, label) {
  const result = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) fail(`${label} contains an empty key`);
    if (result.has(key)) fail(`${label} contains duplicate key ${key}`);
    result.set(key, row);
  }
  return result;
}

function indexByNormalizedTitle(rows, titleFn, label) {
  const result = new Map();
  for (const row of rows) {
    const key = normalizeTitle(titleFn(row));
    if (!key) fail(`${label} contains an empty normalized title`);
    const existing = result.get(key) ?? [];
    existing.push(row);
    result.set(key, existing);
  }
  return result;
}

function sourceJsonPath(wpManifestPath, wpRow) {
  return path.join(path.dirname(wpManifestPath), `${wpRow.queue_id}-${wpRow.slug}.json`);
}

function sourceBodyEvidence(sourceJson, sourcePath) {
  const raw = sourceJson?.content?.raw;
  const rendered = sourceJson?.content?.rendered;
  if (typeof raw !== 'string' || raw.trim().length < 500) {
    fail(`historical WP raw body is absent or implausibly short: ${sourcePath}`);
  }
  if (typeof rendered !== 'string' || rendered.trim().length < 500) {
    fail(`historical WP rendered body is absent or implausibly short: ${sourcePath}`);
  }
  return {
    raw_body_bytes: Buffer.byteLength(raw),
    raw_body_sha256: sha256(raw),
    rendered_body_bytes: Buffer.byteLength(rendered),
    rendered_body_sha256: sha256(rendered),
  };
}

function fixedInputEvidence() {
  const d11 = fileEvidence(INPUTS.d11);
  const readonlyPreflight = fileEvidence(INPUTS.readonlyPreflight);
  if (d11.sha256 !== EXPECTED.d11Sha256) {
    fail(`D11 SHA-256 mismatch: expected ${EXPECTED.d11Sha256}, found ${d11.sha256}`);
  }
  if (readonlyPreflight.sha256 !== EXPECTED.readonlyPreflightSha256) {
    fail(
      `read-only preflight SHA-256 mismatch: expected ${EXPECTED.readonlyPreflightSha256}, found ${readonlyPreflight.sha256}`,
    );
  }
  return { d11, readonlyPreflight };
}

function buildManifest() {
  const { d11, readonlyPreflight } = fixedInputEvidence();
  const searchatlasMetadataEvidence = fileEvidence(INPUTS.searchatlasMetadata);
  const wpManifestEvidence = fileEvidence(INPUTS.wpManifest);
  const ledgerEvidence = fileEvidence(INPUTS.ledger);

  const searchatlasExport = JSON.parse(readFileSync(INPUTS.searchatlasMetadata, 'utf8'));
  const wpManifest = JSON.parse(readFileSync(INPUTS.wpManifest, 'utf8'));
  const ledger = JSON.parse(readFileSync(INPUTS.ledger, 'utf8'));

  const completedList = searchatlasExport.list_items.filter(
    (row) => row.status === 'COMPLETED' && row.status_filter === 'COMPLETED',
  );
  const completedDetails = searchatlasExport.details.filter((row) => row.status === 'COMPLETED');
  if (completedList.length !== EXPECTED.completedCount) {
    fail(`expected ${EXPECTED.completedCount} completed list rows, found ${completedList.length}`);
  }
  if (completedDetails.length !== EXPECTED.completedCount) {
    fail(
      `expected ${EXPECTED.completedCount} completed detail rows, found ${completedDetails.length}`,
    );
  }

  const listByUuid = uniqueMap(completedList, (row) => row.id, 'completed list');
  const detailByUuid = uniqueMap(completedDetails, (row) => row.uuid, 'completed details');
  const wpByTitle = indexByNormalizedTitle(wpManifest.items, (row) => row.title, 'WP manifest');
  const ledgerRows = ledger.articles ?? [];
  const ledgerBySlug = uniqueMap(ledgerRows, (row) => row.canonical_slug, 'canonical ledger');

  const rows = [];
  for (const uuid of [...listByUuid.keys()].sort()) {
    const listRow = listByUuid.get(uuid);
    const detail = detailByUuid.get(uuid);
    if (!detail) fail(`no completed detail row for UUID ${uuid}`);
    if (normalizeTitle(listRow.title) !== normalizeTitle(detail.title)) {
      fail(`list/detail title mismatch for UUID ${uuid}`);
    }
    if (detail.content !== null) {
      fail(`expected local SearchAtlas content field to be null for UUID ${uuid}`);
    }

    const wpMatches = wpByTitle.get(normalizeTitle(detail.title)) ?? [];
    if (wpMatches.length !== 1) {
      fail(`expected one historical WP title match for UUID ${uuid}, found ${wpMatches.length}`);
    }
    const wpRow = wpMatches[0];
    const archiveMarkdownPath = path.resolve(wpRow.file);
    const archiveMarkdown = fileEvidence(archiveMarkdownPath);
    if (archiveMarkdown.bytes < 500) {
      fail(`historical Markdown archive is implausibly short: ${archiveMarkdownPath}`);
    }

    const wpSourceJsonPath = sourceJsonPath(INPUTS.wpManifest, wpRow);
    const wpSourceJsonFile = fileEvidence(wpSourceJsonPath);
    const wpSourceJson = JSON.parse(readFileSync(wpSourceJsonPath, 'utf8'));
    const wpBodies = sourceBodyEvidence(wpSourceJson, wpSourceJsonPath);

    const repoPath = path.join(INPUTS.postsDir, `${wpRow.slug}.mdx`);
    const repoFile = fileEvidence(repoPath);
    const repoFrontmatter = parseFrontmatter(readFileSync(repoPath, 'utf8'), repoPath);
    if (repoFrontmatter.slug != null && repoFrontmatter.slug !== wpRow.slug) {
      fail(`repo frontmatter slug mismatch for UUID ${uuid}`);
    }

    const canonical = ledgerBySlug.get(wpRow.slug);
    if (!canonical) fail(`no canonical-ledger slug match for UUID ${uuid}`);

    const archiveExportedAt = new Date(wpManifest.exported_at);
    const vendorUpdatedAt = new Date(detail.updated_at);
    if (Number.isNaN(archiveExportedAt.valueOf()) || Number.isNaN(vendorUpdatedAt.valueOf())) {
      fail(`invalid archive/vendor timestamp for UUID ${uuid}`);
    }
    const archivePredatesVendorUpdate = vendorUpdatedAt > archiveExportedAt;
    if (!archivePredatesVendorUpdate) {
      fail(`expected vendor updated_at to be newer than the historical export for UUID ${uuid}`);
    }

    const repoTitleMatches = normalizeTitle(repoFrontmatter.title) === normalizeTitle(detail.title);
    const canonicalTitleMatches =
      normalizeTitle(canonical.canonical_title) === normalizeTitle(detail.title);
    const canonicalTitleMatchesRepo =
      normalizeTitle(canonical.canonical_title) === normalizeTitle(repoFrontmatter.title);
    if (!canonicalTitleMatchesRepo) {
      fail(`canonical/repo title mismatch for UUID ${uuid}`);
    }
    const titleDrift = !repoTitleMatches || !canonicalTitleMatches;

    rows.push({
      searchatlas: {
        uuid,
        title: detail.title,
        status: detail.status,
        version: detail.version,
        editor_url: detail.editor_url,
        primary_keyword: detail.primary_keyword,
        target_keywords: detail.target_keywords,
        word_count: detail.word_count,
        content_score: detail.content_score,
        seo_score: detail.seo_score,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        was_deleted: detail.was_deleted,
        local_content_field_state: 'NULL',
      },
      historical_wp_searchatlas_archive: {
        match_method: 'NORMALIZED_EXACT_TITLE_ONE_TO_ONE',
        queue_id: wpRow.queue_id,
        wp_id: wpRow.wp_id,
        title: wpRow.title,
        slug: wpRow.slug,
        wp_status_at_export: wpRow.wp_status,
        original_url_at_export: wpRow.original_url,
        manifest_exported_at: wpManifest.exported_at,
        markdown_file: archiveMarkdown,
        wp_source_json_file: wpSourceJsonFile,
        wp_source_body: wpBodies,
      },
      current_repo: {
        match_method: 'EXACT_ARCHIVE_SLUG_TO_MDX_FILENAME',
        file: repoFile,
        filename_slug: path.basename(repoPath, '.mdx'),
        filename_slug_matches_archive: true,
        frontmatter_title: repoFrontmatter.title,
        frontmatter_slug: repoFrontmatter.slug ?? null,
        frontmatter_slug_state:
          repoFrontmatter.slug == null ? 'ABSENT' : 'MATCHES_ARCHIVE_AND_FILENAME',
        publication_status: repoFrontmatter.publication_status ?? null,
        title_matches_searchatlas_metadata: repoTitleMatches,
      },
      canonical_ledger: {
        match_method: 'EXACT_ARCHIVE_SLUG',
        program_row_id: canonical.program_row_id,
        canonical_title: canonical.canonical_title,
        canonical_slug: canonical.canonical_slug,
        canonical_url: canonical.canonical_url,
        title_matches_searchatlas_metadata: canonicalTitleMatches,
        title_matches_current_repo: canonicalTitleMatchesRepo,
      },
      title_drift: {
        detected: titleDrift,
        searchatlas_title: detail.title,
        current_repo_title: repoFrontmatter.title,
        canonical_ledger_title: canonical.canonical_title,
        note: titleDrift
          ? 'The archive slug still matches one current repo file and one canonical-ledger row, but the current editorial title differs from the historical SearchAtlas title.'
          : null,
      },
      current_searchatlas_body_equivalence: {
        state: 'UNPROVEN',
        archive_predates_vendor_updated_at: archivePredatesVendorUpdate,
        current_searchatlas_body_sha256: null,
        current_searchatlas_full_body_available_in_local_metadata_export: false,
        reason:
          'The local SearchAtlas detail export has content:null, and vendor updated_at is newer than the historical WP export. Matching title, slug, word count, or workflow status cannot prove byte equivalence.',
      },
    });
  }

  const aggregate = {
    searchatlas_completed_records: rows.length,
    unique_searchatlas_uuids: new Set(rows.map((row) => row.searchatlas.uuid)).size,
    local_searchatlas_details_with_content_null: rows.filter(
      (row) => row.searchatlas.local_content_field_state === 'NULL',
    ).length,
    historical_archive_exact_title_matches: rows.filter(
      (row) =>
        row.historical_wp_searchatlas_archive.match_method === 'NORMALIZED_EXACT_TITLE_ONE_TO_ONE',
    ).length,
    historical_archive_markdown_files_present: rows.filter((row) =>
      row.historical_wp_searchatlas_archive.markdown_file.sha256.match(/^[0-9a-f]{64}$/),
    ).length,
    historical_wp_source_json_files_present: rows.filter((row) =>
      row.historical_wp_searchatlas_archive.wp_source_json_file.sha256.match(/^[0-9a-f]{64}$/),
    ).length,
    historical_archive_unique_markdown_paths: new Set(
      rows.map((row) => row.historical_wp_searchatlas_archive.markdown_file.path),
    ).size,
    historical_archive_unique_markdown_hashes: new Set(
      rows.map((row) => row.historical_wp_searchatlas_archive.markdown_file.sha256),
    ).size,
    historical_archive_markdown_total_bytes: rows.reduce(
      (sum, row) => sum + row.historical_wp_searchatlas_archive.markdown_file.bytes,
      0,
    ),
    current_repo_exact_slug_matches: rows.length,
    current_repo_files_present: rows.filter((row) => row.current_repo.file.sha256).length,
    current_repo_unique_paths: new Set(rows.map((row) => row.current_repo.file.path)).size,
    current_repo_unique_hashes: new Set(rows.map((row) => row.current_repo.file.sha256)).size,
    current_repo_frontmatter_slug_matches: rows.filter(
      (row) => row.current_repo.frontmatter_slug_state === 'MATCHES_ARCHIVE_AND_FILENAME',
    ).length,
    current_repo_frontmatter_slug_absent: rows.filter(
      (row) => row.current_repo.frontmatter_slug_state === 'ABSENT',
    ).length,
    current_repo_titles_matching_searchatlas_metadata: rows.filter(
      (row) => row.current_repo.title_matches_searchatlas_metadata,
    ).length,
    canonical_ledger_titles_matching_current_repo: rows.filter(
      (row) => row.canonical_ledger.title_matches_current_repo,
    ).length,
    title_drift_records: rows.filter((row) => row.title_drift.detected).length,
    vendor_records_updated_after_archive_export: rows.filter(
      (row) => row.current_searchatlas_body_equivalence.archive_predates_vendor_updated_at,
    ).length,
    current_searchatlas_body_equivalence_proven: 0,
    current_searchatlas_body_equivalence_unproven: rows.length,
  };

  const sourceEvidence = {
    signed_d11: d11,
    readonly_capacity_exportability_preflight: readonlyPreflight,
    local_searchatlas_metadata_export: {
      ...searchatlasMetadataEvidence,
      exported_at: searchatlasExport.exported_at,
      local_export_total_records: searchatlasExport.unique_id_count,
      local_export_completed_records: completedDetails.length,
    },
    historical_wp_export_manifest: {
      ...wpManifestEvidence,
      exported_at: wpManifest.exported_at,
      published_export_count: wpManifest.published_export_count,
    },
    canonical_content_ledger: {
      ...ledgerEvidence,
      row_count: ledgerRows.length,
      content_fingerprint_sha256: ledger.content_fingerprint_sha256,
    },
    current_repo_posts_directory: displayPath(INPUTS.postsDir),
  };

  const sourceFingerprint = sha256(
    JSON.stringify(
      Object.entries(sourceEvidence)
        .filter(([, value]) => typeof value === 'object')
        .map(([key, value]) => [key, value.sha256 ?? value]),
    ),
  );
  const contentFingerprint = sha256(JSON.stringify(rows));

  return {
    schema_version: '1.0.0',
    artifact_type: 'searchatlas_completed_to_historical_archive_to_current_repo_reconciliation',
    generated_at: searchatlasExport.exported_at,
    generated_at_basis:
      'Deterministic reuse of the local SearchAtlas metadata export timestamp; unchanged inputs produce byte-identical outputs.',
    mode: 'LOCAL_ONLY_EXISTING_EVIDENCE_NO_EXTERNAL_ACTION',
    policy: {
      external_services_called: false,
      live_cg_actions_called: false,
      browser_used: false,
      vendor_mutations_performed: false,
      external_or_vendor_exports_created: false,
      content_generated: false,
      publication_or_indexing_performed: false,
      spend_performed: false,
      d11_new_searchatlas_row_cap: 0,
      archive_or_status_is_public_live_proof: false,
    },
    limitations: {
      current_searchatlas_body_equivalence: 'UNPROVEN_FOR_ALL_70_RECORDS',
      explanation:
        'Every local SearchAtlas completed detail has content:null, and every vendor updated_at is newer than the historical WP export timestamp. The historical bodies are recoverable evidence, not proof of the current vendor body bytes.',
      historical_wp_status_is_current_public_state_proof: false,
      exact_title_or_slug_match_is_current_body_identity_proof: false,
    },
    sources: sourceEvidence,
    source_input_fingerprint_sha256: sourceFingerprint,
    content_fingerprint_sha256: contentFingerprint,
    aggregate,
    rows,
  };
}

function renderReport(manifest) {
  const driftRows = manifest.rows.filter((row) => row.title_drift.detected);
  const sourceRows = [
    ['Signed D11', manifest.sources.signed_d11],
    [
      'Read-only capacity/exportability preflight',
      manifest.sources.readonly_capacity_exportability_preflight,
    ],
    ['Local SearchAtlas metadata export', manifest.sources.local_searchatlas_metadata_export],
    ['Historical WP export manifest', manifest.sources.historical_wp_export_manifest],
    ['Canonical content ledger', manifest.sources.canonical_content_ledger],
  ];

  return `# SearchAtlas completed-record archive reconciliation

Mode: **local-only existing evidence; no external action**  
Deterministic evidence timestamp: \`${manifest.generated_at}\`

## Outcome

All **${manifest.aggregate.searchatlas_completed_records}** locally recorded SearchAtlas \`COMPLETED\` UUIDs map one-to-one by normalized exact title to **${manifest.aggregate.historical_archive_exact_title_matches}** historical WP/SearchAtlas archive records. All ${manifest.aggregate.historical_archive_markdown_files_present} historical Markdown bodies, all ${manifest.aggregate.historical_wp_source_json_files_present} WP source JSON files, and all ${manifest.aggregate.current_repo_files_present} current repo MDX files are present and checksummed.

This does **not** prove that any historical body equals the current SearchAtlas body. The local SearchAtlas detail export has \`content:null\` for ${manifest.aggregate.local_searchatlas_details_with_content_null}/${manifest.aggregate.searchatlas_completed_records} records, and all ${manifest.aggregate.vendor_records_updated_after_archive_export}/${manifest.aggregate.searchatlas_completed_records} vendor \`updated_at\` timestamps are newer than the historical WP export timestamp. Current SearchAtlas body equivalence is therefore **UNPROVEN for all ${manifest.aggregate.current_searchatlas_body_equivalence_unproven} records**.

## Exact counts

| Check | Count |
| --- | ---: |
| SearchAtlas \`COMPLETED\` UUIDs | ${manifest.aggregate.searchatlas_completed_records} |
| Unique UUIDs | ${manifest.aggregate.unique_searchatlas_uuids} |
| Local SearchAtlas details with \`content:null\` | ${manifest.aggregate.local_searchatlas_details_with_content_null} |
| One-to-one historical archive title matches | ${manifest.aggregate.historical_archive_exact_title_matches} |
| Historical Markdown files / unique hashes | ${manifest.aggregate.historical_archive_markdown_files_present} / ${manifest.aggregate.historical_archive_unique_markdown_hashes} |
| Historical Markdown total bytes | ${manifest.aggregate.historical_archive_markdown_total_bytes} |
| Current repo exact-slug filenames | ${manifest.aggregate.current_repo_exact_slug_matches} |
| Current repo frontmatter slugs matching / absent | ${manifest.aggregate.current_repo_frontmatter_slug_matches} / ${manifest.aggregate.current_repo_frontmatter_slug_absent} |
| Current repo titles still matching SearchAtlas metadata | ${manifest.aggregate.current_repo_titles_matching_searchatlas_metadata} |
| Title-drift records | ${manifest.aggregate.title_drift_records} |
| Vendor records updated after archive export | ${manifest.aggregate.vendor_records_updated_after_archive_export} |
| Current SearchAtlas body equivalence proven | ${manifest.aggregate.current_searchatlas_body_equivalence_proven} |

## Title drift

The archive slug still maps exactly to the current repo file and canonical-ledger row for both records below; only the editorial title changed.

| SearchAtlas UUID | Historical SearchAtlas title | Current repo / canonical title | Slug |
| --- | --- | --- | --- |
${driftRows
  .map(
    (row) =>
      `| \`${row.searchatlas.uuid}\` | ${row.title_drift.searchatlas_title} | ${row.title_drift.current_repo_title} | \`${row.historical_wp_searchatlas_archive.slug}\` |`,
  )
  .join('\n')}

## Source evidence

| Source | Path | SHA-256 |
| --- | --- | --- |
${sourceRows.map(([label, source]) => `| ${label} | \`${source.path}\` | \`${source.sha256}\` |`).join('\n')}

- Source-input fingerprint: \`${manifest.source_input_fingerprint_sha256}\`
- Reconciled-row fingerprint: \`${manifest.content_fingerprint_sha256}\`

## Guardrails and limitation

No live \`cg_*\` call, browser action, vendor mutation, new export, generation, publication, indexing, or spend was performed. D11's new-row cap remains \`0\`.

The historical archive is usable local recovery and provenance evidence. It must not be described as a current SearchAtlas full-body export or as byte-equivalent to the current vendor article without a separately authorized, genuinely read-only retrieval of current vendor bytes and a direct checksum comparison.
`;
}

async function writeOutputs(manifest) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const reportText = await formatWithPrettier(renderReport(manifest), {
    parser: 'markdown',
    printWidth: 100,
  });
  writeFileSync(OUTPUTS.manifest, manifestText);
  writeFileSync(OUTPUTS.report, reportText);
  writeFileSync(
    OUTPUTS.manifestSidecar,
    `${sha256(manifestText)}  ${path.basename(OUTPUTS.manifest)}\n`,
  );
  writeFileSync(OUTPUTS.reportSidecar, `${sha256(reportText)}  ${path.basename(OUTPUTS.report)}\n`);
}

const manifest = buildManifest();
await writeOutputs(manifest);

process.stdout.write(
  `${JSON.stringify(
    {
      output_dir: OUTPUT_DIR,
      rows: manifest.aggregate.searchatlas_completed_records,
      title_drift_records: manifest.aggregate.title_drift_records,
      current_searchatlas_body_equivalence:
        manifest.limitations.current_searchatlas_body_equivalence,
      content_fingerprint_sha256: manifest.content_fingerprint_sha256,
    },
    null,
    2,
  )}\n`,
);
