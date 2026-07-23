#!/usr/bin/env node

/**
 * Deterministically reconcile the current 191-node DKN 39003 inventory and
 * its 191-node disposition ledger to the MRX1000 canonical ledger and local
 * activation plan. This script is local-only and performs no network or
 * vendor calls and no content, generation, publication, or spend actions.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');

const INPUTS = {
  current191Inventory: path.join(
    MRX_ROOT,
    'docs/search-atlas/searchatlas-dkn-39003-node-inventory-normalized.json',
  ),
  current191DispositionLedger: path.join(
    MRX_ROOT,
    'docs/search-atlas/dkn-39003-phase2-node-ledger-2026-07-20.json',
  ),
  canonicalLedger: path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json'),
  activationPlan: path.join(MRX_ROOT, 'config/mrx-1000-content-activation-plan.json'),
  historical390Summary: path.join(
    MRX_ROOT,
    'reports/dkn39003-cannibalization-summary-t_a4189128.json',
  ),
  historical390Report: path.join(
    MRX_ROOT,
    'reports/dkn39003-cannibalization-editorial-audit-t_a4189128.md',
  ),
};

const OUTPUTS = {
  json: path.join(MRX_ROOT, 'reports/dkn39003-mrx1000-consistency-audit.json'),
  markdown: path.join(MRX_ROOT, 'reports/dkn39003-mrx1000-consistency-audit.md'),
};

const DIRECT_CANONICAL_ID_FIELDS = [
  'source_record_id',
  'source_handle',
  'searchatlas_map_id',
  'searchatlas_title_uuid',
  'searchatlas_record_id',
  'content_genius_article_uuid',
];

const DISPOSITION_ORDER = ['KEEP', 'REWRITE', 'MERGE_HOLD', 'REJECT_HOLD'];

function invariant(condition, message) {
  if (!condition) throw new Error(`Invariant failed: ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readInput(file) {
  const bytes = readFileSync(file);
  return { bytes, json: file.endsWith('.json') ? JSON.parse(bytes.toString('utf8')) : null };
}

function rel(file) {
  return path.relative(MRX_ROOT, file).split(path.sep).join('/');
}

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugLeaf(value) {
  return (
    String(value || '')
      .split(/[?#]/, 1)[0]
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)
      .at(-1) || ''
  );
}

function normalizeSlug(value) {
  return normalizeTitle(slugLeaf(value));
}

function canonicalPathname(url) {
  return new URL(url).pathname;
}

function indexBy(items, selector) {
  const result = new Map();
  for (const item of items) {
    const key = String(selector(item));
    const values = result.get(key) || [];
    values.push(item);
    result.set(key, values);
  }
  return result;
}

function countBy(items, selector, orderedKeys = null) {
  const counts = {};
  for (const item of items) {
    const key = String(selector(item));
    counts[key] = (counts[key] || 0) + 1;
  }
  const keys = orderedKeys || Object.keys(counts).sort();
  return Object.fromEntries(keys.filter((key) => counts[key]).map((key) => [key, counts[key]]));
}

function matchState(candidateCount) {
  if (candidateCount === 0) return 'UNMATCHED';
  if (candidateCount === 1) return 'UNIQUE';
  return 'AMBIGUOUS';
}

function intersectRows(left, right) {
  const rightIds = new Set(right.map((row) => row.program_row_id));
  return left.filter((row) => rightIds.has(row.program_row_id));
}

function uniqueRows(groups) {
  const byId = new Map();
  for (const group of groups) {
    for (const row of group) byId.set(row.program_row_id, row);
  }
  return [...byId.values()].sort((a, b) => a.program_row_id.localeCompare(b.program_row_id));
}

function emptyDispositionCounts() {
  return Object.fromEntries(DISPOSITION_ORDER.map((key) => [key, 0]));
}

function markdownTable(headers, rows, rightAlignedColumns = []) {
  const rightAligned = new Set(rightAlignedColumns);
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => String(row[column]).length)),
  );
  const render = (row) =>
    `| ${row
      .map((cell, column) =>
        rightAligned.has(column)
          ? String(cell).padStart(widths[column])
          : String(cell).padEnd(widths[column]),
      )
      .join(' | ')} |`;
  const separator = widths.map((width, column) =>
    rightAligned.has(column) ? `${'-'.repeat(Math.max(2, width - 1))}:` : '-'.repeat(width),
  );
  return [render(headers), render(separator), ...rows.map(render)].join('\n');
}

export function buildAudit() {
  const loaded = Object.fromEntries(
    Object.entries(INPUTS).map(([key, file]) => [key, readInput(file)]),
  );
  const inventory = loaded.current191Inventory.json;
  const dispositionLedger = loaded.current191DispositionLedger.json;
  const canonicalLedger = loaded.canonicalLedger.json;
  const activationPlan = loaded.activationPlan.json;
  const historical390 = loaded.historical390Summary.json;

  invariant(inventory.project === '39003', 'current inventory must be DKN 39003');
  invariant(inventory.nodes?.length === 191, 'current normalized inventory must have 191 nodes');
  invariant(
    inventory.pending_nodes?.length === 191 && inventory.generated_nodes?.length === 0,
    'current inventory must remain 191 pending / 0 generated',
  );
  invariant(
    new Set(inventory.nodes.map((node) => node.node_id)).size === 191,
    'current inventory node IDs must be unique',
  );
  invariant(dispositionLedger.dkn_id === 39003, 'disposition ledger must be DKN 39003');
  invariant(
    dispositionLedger.nodes?.length === 191 &&
      new Set(dispositionLedger.nodes.map((node) => node.node_id)).size === 191,
    'disposition ledger must have 191 unique node IDs',
  );
  invariant(
    canonicalLedger.articles?.length === 1000 && activationPlan.rows?.length === 1000,
    'canonical ledger and activation plan must each have 1,000 rows',
  );
  invariant(historical390.node_count === 390, 'historical audit reference must remain 390 rows');

  const inventoryIds = new Set(inventory.nodes.map((node) => node.node_id));
  const dispositionById = new Map(dispositionLedger.nodes.map((node) => [node.node_id, node]));
  invariant(
    dispositionLedger.nodes.every((node) => inventoryIds.has(node.node_id)) &&
      inventory.nodes.every((node) => dispositionById.has(node.node_id)),
    'current inventory and disposition ledger node-ID sets must be identical',
  );
  invariant(
    JSON.stringify(
      countBy(dispositionLedger.nodes, (node) => node.disposition, DISPOSITION_ORDER),
    ) === JSON.stringify({ KEEP: 36, REWRITE: 35, MERGE_HOLD: 59, REJECT_HOLD: 61 }),
    'disposition partition must remain 36/35/59/61',
  );

  const canonicalRows = canonicalLedger.articles;
  const activationById = new Map(activationPlan.rows.map((row) => [row.program_row_id, row]));
  invariant(activationById.size === 1000, 'activation program row IDs must be unique');
  const activationIdentityMismatches = canonicalRows.filter((row) => {
    const activation = activationById.get(row.program_row_id);
    return (
      !activation ||
      activation.canonical_title !== row.canonical_title ||
      activation.canonical_slug !== row.canonical_slug ||
      activation.canonical_url !== canonicalPathname(row.canonical_url) ||
      activation.pillar !== row.pillar
    );
  });
  invariant(
    activationIdentityMismatches.length === 0,
    'activation plan must agree exactly with every canonical row identity',
  );

  const canonicalIndexes = {
    exactTitle: indexBy(canonicalRows, (row) => row.canonical_title),
    normalizedTitle: indexBy(canonicalRows, (row) => normalizeTitle(row.canonical_title)),
    exactSlugLeaf: indexBy(canonicalRows, (row) => row.canonical_slug),
    normalizedSlugLeaf: indexBy(canonicalRows, (row) => normalizeSlug(row.canonical_slug)),
    exactRoute: indexBy(canonicalRows, (row) => canonicalPathname(row.canonical_url)),
  };
  const directIdIndexes = Object.fromEntries(
    DIRECT_CANONICAL_ID_FIELDS.map((field) => [
      field,
      indexBy(
        canonicalRows.filter((row) => row[field] != null),
        (row) => row[field],
      ),
    ]),
  );

  const nodes = inventory.nodes
    .slice()
    .sort((a, b) => a.node_id - b.node_id)
    .map((node) => {
      const disposition = dispositionById.get(node.node_id);
      const exactTitle = canonicalIndexes.exactTitle.get(node.title) || [];
      const normalizedTitle =
        canonicalIndexes.normalizedTitle.get(normalizeTitle(node.title)) || [];
      const exactSlugLeaf = canonicalIndexes.exactSlugLeaf.get(slugLeaf(node.page_url)) || [];
      const normalizedSlugLeaf =
        canonicalIndexes.normalizedSlugLeaf.get(normalizeSlug(node.page_url)) || [];
      const exactRoute = canonicalIndexes.exactRoute.get(node.page_url) || [];
      const exactTitleAndSlug = intersectRows(exactTitle, exactSlugLeaf);
      const normalizedTitleAndSlug = intersectRows(normalizedTitle, normalizedSlugLeaf);
      const directIdMatches = uniqueRows(
        DIRECT_CANONICAL_ID_FIELDS.map(
          (field) => directIdIndexes[field].get(String(node.node_id)) || [],
        ),
      );
      const allLexicalCandidates = uniqueRows([
        exactTitle,
        normalizedTitle,
        exactSlugLeaf,
        normalizedSlugLeaf,
        exactRoute,
      ]);
      const safeCandidates = uniqueRows([directIdMatches, exactTitleAndSlug]);
      const safeBinding = safeCandidates.length === 1 ? safeCandidates[0] : null;
      return {
        node_id: node.node_id,
        disposition: disposition.disposition,
        match_candidate_counts: {
          exact_title: exactTitle.length,
          normalized_title: normalizedTitle.length,
          exact_slug_leaf: exactSlugLeaf.length,
          normalized_slug_leaf: normalizedSlugLeaf.length,
          exact_canonical_route: exactRoute.length,
          combined_exact_title_and_slug: exactTitleAndSlug.length,
          combined_normalized_title_and_slug: normalizedTitleAndSlug.length,
          direct_foreign_key: directIdMatches.length,
        },
        candidate_mapping: {
          state: matchState(allLexicalCandidates.length),
          canonical_program_row_ids: allLexicalCandidates.map((row) => row.program_row_id),
        },
        safe_binding: safeBinding
          ? {
              safe_without_inference: true,
              program_row_id: safeBinding.program_row_id,
              canonical_title: safeBinding.canonical_title,
              canonical_slug: safeBinding.canonical_slug,
              canonical_pillar: safeBinding.pillar,
              basis:
                directIdMatches.length === 1
                  ? 'UNIQUE_DIRECT_FOREIGN_KEY'
                  : 'UNIQUE_EXACT_TITLE_AND_EXACT_SLUG_LEAF',
            }
          : {
              safe_without_inference: false,
              program_row_id: null,
              canonical_title: null,
              canonical_slug: null,
              canonical_pillar: null,
              basis:
                safeCandidates.length > 1
                  ? 'AMBIGUOUS_DIRECT_OR_EXACT_CORROBORATED_CANDIDATES'
                  : 'NO_DIRECT_FOREIGN_KEY_OR_EXACT_TITLE_PLUS_SLUG_CORROBORATION',
            },
      };
    });

  const dimensions = [
    ['exact_title', (node) => matchState(node.match_candidate_counts.exact_title)],
    ['normalized_title', (node) => matchState(node.match_candidate_counts.normalized_title)],
    ['exact_slug_leaf', (node) => matchState(node.match_candidate_counts.exact_slug_leaf)],
    [
      'normalized_slug_leaf',
      (node) => matchState(node.match_candidate_counts.normalized_slug_leaf),
    ],
    [
      'exact_canonical_route',
      (node) => matchState(node.match_candidate_counts.exact_canonical_route),
    ],
    [
      'combined_exact_title_and_slug',
      (node) => matchState(node.match_candidate_counts.combined_exact_title_and_slug),
    ],
    [
      'combined_normalized_title_and_slug',
      (node) => matchState(node.match_candidate_counts.combined_normalized_title_and_slug),
    ],
    ['direct_foreign_key', (node) => matchState(node.match_candidate_counts.direct_foreign_key)],
    ['candidate_mapping', (node) => node.candidate_mapping.state],
  ];
  const matchCounts = Object.fromEntries(
    dimensions.map(([key, selector]) => {
      const counts = countBy(nodes, selector, ['UNIQUE', 'AMBIGUOUS', 'UNMATCHED']);
      return [
        key,
        {
          unique: counts.UNIQUE || 0,
          ambiguous: counts.AMBIGUOUS || 0,
          unmatched: counts.UNMATCHED || 0,
        },
      ];
    }),
  );

  const dispositionByCanonicalPillar = {};
  for (const node of nodes) {
    const pillar = node.safe_binding.safe_without_inference
      ? node.safe_binding.canonical_pillar
      : '_UNMAPPED_TO_CANONICAL';
    const row = dispositionByCanonicalPillar[pillar] || {
      ...emptyDispositionCounts(),
      total: 0,
    };
    row[node.disposition] += 1;
    row.total += 1;
    dispositionByCanonicalPillar[pillar] = row;
  }

  const safeBindingCount = nodes.filter((node) => node.safe_binding.safe_without_inference).length;
  invariant(safeBindingCount === 0, 'current audit expects zero inference-free DKN bindings');
  invariant(
    matchCounts.candidate_mapping.unmatched === 191,
    'current audit expects all 191 nodes unmatched by exact/normalized title/slug',
  );

  const inputEvidence = Object.fromEntries(
    Object.entries(INPUTS).map(([key, file]) => [
      key,
      {
        path: rel(file),
        sha256: sha256(loaded[key].bytes),
        bytes: loaded[key].bytes.length,
      },
    ]),
  );
  const core = {
    artifact_type: 'dkn39003_current191_to_mrx1000_consistency_audit',
    snapshot_at: inventory.generated_at,
    deterministic: true,
    local_only: true,
    external_calls_performed: false,
    external_writes_performed: false,
    vendor_mutations_performed: false,
    generation_publish_export_or_spend_performed: false,
    inputs: inputEvidence,
    scope_separation: {
      current_join_scope: {
        dkn_project_id: 39003,
        normalized_inventory_nodes: 191,
        disposition_ledger_nodes: 191,
        native_node_id_type: 'numeric SearchAtlas DKN node_id',
        included_in_join: true,
      },
      historical_390_row_topical_map_audit: {
        normalized_rows: historical390.node_count,
        topical_map_ids: Object.keys(historical390.map_counts).sort(),
        source_sha256: inputEvidence.historical390Summary.sha256,
        included_in_join: false,
        reason:
          'Historical 390-row audit uses three topical-map title inventories and deterministic SA-* audit IDs; it is not the current native 191-node DKN inventory and is not unioned into any current join count.',
      },
    },
    normalization_policy: {
      exact_title: 'Byte-for-byte JSON string equality.',
      normalized_title:
        'Unicode NFKD; remove combining marks; lowercase; expand ampersand to "and"; remove apostrophes; replace other non-alphanumerics with spaces; collapse whitespace.',
      exact_slug_leaf:
        'DKN page_url final path segment after removing query/fragment and edge slashes equals canonical_slug byte-for-byte.',
      normalized_slug_leaf:
        'Apply the title normalizer to the DKN final path segment and canonical_slug.',
      exact_canonical_route: 'DKN page_url equals the pathname of canonical_url byte-for-byte.',
      safe_binding:
        'Only a unique direct foreign-key match or one canonical row corroborated by both exact title and exact slug leaf may bind without inference. Normalized, topical, keyword, cluster, or semantic similarity alone never binds.',
    },
    verification: {
      current_inventory_nodes: inventory.nodes.length,
      current_inventory_unique_node_ids: inventoryIds.size,
      current_inventory_pending_nodes: inventory.pending_nodes.length,
      current_inventory_generated_nodes: inventory.generated_nodes.length,
      disposition_ledger_nodes: dispositionLedger.nodes.length,
      disposition_node_id_set_matches_inventory: true,
      canonical_rows: canonicalRows.length,
      activation_rows: activationPlan.rows.length,
      activation_exact_identity_rows: canonicalRows.length - activationIdentityMismatches.length,
      activation_identity_mismatches: activationIdentityMismatches.length,
      direct_canonical_id_fields_checked: DIRECT_CANONICAL_ID_FIELDS,
      safe_binding_count: safeBindingCount,
      safe_binding_requires_inference_count: nodes.length - safeBindingCount,
    },
    disposition_counts: countBy(
      dispositionLedger.nodes,
      (node) => node.disposition,
      DISPOSITION_ORDER,
    ),
    canonical_pillar_distribution: activationPlan.distributions.by_pillar,
    disposition_counts_by_canonical_pillar: dispositionByCanonicalPillar,
    match_counts: matchCounts,
    conclusion: {
      current_dkn_node_can_safely_bind_without_inference: safeBindingCount > 0,
      safe_binding_count: safeBindingCount,
      unmatched_node_count: matchCounts.candidate_mapping.unmatched,
      statement:
        'No current DKN node has an exact or normalized title/slug candidate in the canonical 1,000-row ledger, no native node_id matches a canonical foreign-key field, and no current DKN node can safely bind to a canonical row without semantic or topical inference.',
    },
    nodes,
  };
  return { ...core, content_fingerprint_sha256: sha256(stableJson(core)) };
}

function buildMarkdown(audit) {
  const inputRows = Object.values(audit.inputs).map((input) => [
    `\`${input.path}\``,
    `\`${input.sha256}\``,
  ]);
  const matchRows = Object.entries(audit.match_counts).map(([dimension, counts]) => [
    dimension,
    counts.unique,
    counts.ambiguous,
    counts.unmatched,
  ]);
  const pillarRows = Object.entries(audit.disposition_counts_by_canonical_pillar).map(
    ([pillar, counts]) => [
      pillar,
      counts.KEEP,
      counts.REWRITE,
      counts.MERGE_HOLD,
      counts.REJECT_HOLD,
      counts.total,
    ],
  );
  return `# DKN 39003 current 191-node → MRX1000 consistency audit

## Outcome

**No current DKN node can safely bind to a canonical MRX1000 row without inference.** The current 191-node normalized inventory and 191-node disposition ledger join exactly by native numeric \`node_id\`, but all 191 nodes are unmatched against the canonical ledger on exact and normalized title/slug keys. No native DKN node ID appears in any checked canonical foreign-key field.

This was a deterministic, local-only reconciliation. It made no live \`cg_*\` or DKN calls, browser calls, vendor mutations, generation, publication, export, deployment, or spend.

## Scope separation

- **Current join scope:** DKN \`39003\`, 191 native nodes, all pending, 0 generated; 191 disposition rows; 1,000 canonical rows; 1,000 activation-plan rows.
- **Historical audit excluded:** the 390-row audit covers topical maps \`${audit.scope_separation.historical_390_row_topical_map_audit.topical_map_ids.join(', ')}\` and deterministic \`SA-*\` audit IDs. It is retained as historical evidence but is not unioned into the current 191-node join or any count below.

## Join counts

${markdownTable(['Dimension', 'Unique', 'Ambiguous', 'Unmatched'], matchRows, [1, 2, 3])}

The activation plan agrees exactly with canonical title, slug, URL, and pillar identity for **${audit.verification.activation_exact_identity_rows}/1,000** rows. The inference-free safe-binding count is **${audit.verification.safe_binding_count}**.

## Dispositions by canonical pillar

Because no node binds safely, no disposition can be attributed to an actual canonical pillar. The full disposition partition therefore remains under \`_UNMAPPED_TO_CANONICAL\`:

${markdownTable(
  ['Canonical pillar', 'KEEP', 'REWRITE', 'MERGE_HOLD', 'REJECT_HOLD', 'Total'],
  pillarRows,
  [1, 2, 3, 4, 5],
)}

Canonical activation-plan context contains nine pillars: ${Object.entries(
    audit.canonical_pillar_distribution,
  )
    .map(([pillar, count]) => `\`${pillar}\` (${count})`)
    .join(
      ', ',
    )}. Assigning any current DKN node to one of them would require topical, keyword, cluster, or semantic inference and is intentionally not performed.

## Binding rule

A node may bind without inference only through one unique direct canonical foreign key or one canonical row corroborated by both exact title and exact slug leaf. Normalized matches are reported as candidates only; they do not bind. The fields checked for direct identity were: ${audit.verification.direct_canonical_id_fields_checked.map((field) => `\`${field}\``).join(', ')}.

## Input hashes

${markdownTable(['Input', 'SHA-256'], inputRows)}

Content fingerprint: \`${audit.content_fingerprint_sha256}\`.
`;
}

export async function writeAudit() {
  const audit = buildAudit();
  const json = stableJson(audit);
  const markdown = buildMarkdown(audit);
  const jsonSidecar = `${sha256(json)}  ${path.basename(OUTPUTS.json)}\n`;
  const markdownSidecar = `${sha256(markdown)}  ${path.basename(OUTPUTS.markdown)}\n`;
  await Promise.all([
    writeFile(OUTPUTS.json, json),
    writeFile(OUTPUTS.markdown, markdown),
    writeFile(`${OUTPUTS.json}.sha256`, jsonSidecar),
    writeFile(`${OUTPUTS.markdown}.sha256`, markdownSidecar),
  ]);
  return {
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, file]) => [key, rel(file)])),
    content_fingerprint_sha256: audit.content_fingerprint_sha256,
    output_sha256: { json: sha256(json), markdown: sha256(markdown) },
    current_nodes: audit.verification.current_inventory_nodes,
    safe_bindings: audit.verification.safe_binding_count,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await writeAudit(), null, 2));
}
