/**
 * Focused verification for the deterministic local-only DKN 39003 current
 * 191-node to MRX1000 consistency audit.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(HERE, '..', '..');
const SCRIPT = path.join(MRX_ROOT, 'scripts/build-dkn39003-mrx1000-consistency-audit.mjs');
const JSON_OUT = path.join(MRX_ROOT, 'reports/dkn39003-mrx1000-consistency-audit.json');
const MD_OUT = path.join(MRX_ROOT, 'reports/dkn39003-mrx1000-consistency-audit.md');
const INPUTS = [
  'docs/search-atlas/searchatlas-dkn-39003-node-inventory-normalized.json',
  'docs/search-atlas/dkn-39003-phase2-node-ledger-2026-07-20.json',
  'config/mrx-1000-canonical-content-ledger.json',
  'config/mrx-1000-content-activation-plan.json',
  'reports/dkn39003-cannibalization-summary-t_a4189128.json',
  'reports/dkn39003-cannibalization-editorial-audit-t_a4189128.md',
].map((file) => path.join(MRX_ROOT, file));

interface AuditNode {
  node_id: number;
  disposition: string;
  match_candidate_counts: Record<string, number>;
  candidate_mapping: {
    state: string;
    canonical_program_row_ids: string[];
  };
  safe_binding: {
    safe_without_inference: boolean;
    program_row_id: string | null;
    canonical_pillar: string | null;
    basis: string;
  };
}

interface Audit {
  deterministic: boolean;
  local_only: boolean;
  external_calls_performed: boolean;
  vendor_mutations_performed: boolean;
  generation_publish_export_or_spend_performed: boolean;
  content_fingerprint_sha256: string;
  scope_separation: {
    current_join_scope: Record<string, number | string | boolean>;
    historical_390_row_topical_map_audit: {
      normalized_rows: number;
      topical_map_ids: string[];
      included_in_join: boolean;
    };
  };
  verification: {
    current_inventory_nodes: number;
    current_inventory_unique_node_ids: number;
    current_inventory_pending_nodes: number;
    current_inventory_generated_nodes: number;
    disposition_ledger_nodes: number;
    disposition_node_id_set_matches_inventory: boolean;
    canonical_rows: number;
    activation_rows: number;
    activation_exact_identity_rows: number;
    activation_identity_mismatches: number;
    safe_binding_count: number;
    safe_binding_requires_inference_count: number;
  };
  disposition_counts: Record<string, number>;
  disposition_counts_by_canonical_pillar: Record<string, Record<string, number>>;
  match_counts: Record<string, { unique: number; ambiguous: number; unmatched: number }>;
  conclusion: {
    current_dkn_node_can_safely_bind_without_inference: boolean;
    safe_binding_count: number;
    unmatched_node_count: number;
    statement: string;
  };
  nodes: AuditNode[];
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function runGenerator(): void {
  const result = spawnSync('node', [SCRIPT], {
    cwd: MRX_ROOT,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `generator exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

function sidecarHash(file: string): string {
  return readFileSync(`${file}.sha256`, 'utf8').trim().split(/\s+/)[0];
}

describe('DKN 39003 current 191-node to MRX1000 consistency audit', () => {
  let audit: Audit;
  let firstOutputHashes: Record<string, string>;
  let secondOutputHashes: Record<string, string>;
  let inputHashesBefore: string[];
  let inputHashesAfter: string[];

  beforeAll(() => {
    inputHashesBefore = INPUTS.map(sha256);
    runGenerator();
    firstOutputHashes = { json: sha256(JSON_OUT), markdown: sha256(MD_OUT) };
    runGenerator();
    secondOutputHashes = { json: sha256(JSON_OUT), markdown: sha256(MD_OUT) };
    inputHashesAfter = INPUTS.map(sha256);
    audit = JSON.parse(readFileSync(JSON_OUT, 'utf8')) as Audit;
  });

  it('is byte-deterministic, hashes outputs, and preserves every input', () => {
    expect(secondOutputHashes).toEqual(firstOutputHashes);
    expect(inputHashesAfter).toEqual(inputHashesBefore);
    expect(sidecarHash(JSON_OUT)).toBe(secondOutputHashes.json);
    expect(sidecarHash(MD_OUT)).toBe(secondOutputHashes.markdown);
    expect(audit.content_fingerprint_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('joins the two current 191-node inputs exactly and preserves dispositions', () => {
    expect(audit.verification).toMatchObject({
      current_inventory_nodes: 191,
      current_inventory_unique_node_ids: 191,
      current_inventory_pending_nodes: 191,
      current_inventory_generated_nodes: 0,
      disposition_ledger_nodes: 191,
      disposition_node_id_set_matches_inventory: true,
    });
    expect(audit.nodes).toHaveLength(191);
    expect(new Set(audit.nodes.map((node) => node.node_id)).size).toBe(191);
    expect(audit.disposition_counts).toEqual({
      KEEP: 36,
      REWRITE: 35,
      MERGE_HOLD: 59,
      REJECT_HOLD: 61,
    });
  });

  it('keeps the historical 390-row topical-map audit outside the current join', () => {
    expect(audit.scope_separation).toMatchObject({
      current_join_scope: {
        dkn_project_id: 39003,
        normalized_inventory_nodes: 191,
        disposition_ledger_nodes: 191,
        included_in_join: true,
      },
      historical_390_row_topical_map_audit: {
        normalized_rows: 390,
        topical_map_ids: ['261163', '261164', '261165'],
        included_in_join: false,
      },
    });
  });

  it('verifies all canonical and activation-plan identities before matching', () => {
    expect(audit.verification).toMatchObject({
      canonical_rows: 1000,
      activation_rows: 1000,
      activation_exact_identity_rows: 1000,
      activation_identity_mismatches: 0,
    });
  });

  it('finds no exact, normalized, direct-ID, unique, or ambiguous mapping', () => {
    for (const dimension of Object.values(audit.match_counts)) {
      expect(dimension).toEqual({ unique: 0, ambiguous: 0, unmatched: 191 });
    }
    expect(
      audit.nodes.every(
        (node) =>
          node.candidate_mapping.state === 'UNMATCHED' &&
          node.candidate_mapping.canonical_program_row_ids.length === 0 &&
          Object.values(node.match_candidate_counts).every((count) => count === 0),
      ),
    ).toBe(true);
  });

  it('does not bind any node to a canonical pillar without inference', () => {
    expect(audit.conclusion).toEqual({
      current_dkn_node_can_safely_bind_without_inference: false,
      safe_binding_count: 0,
      unmatched_node_count: 191,
      statement: expect.any(String),
    });
    expect(audit.verification).toMatchObject({
      safe_binding_count: 0,
      safe_binding_requires_inference_count: 191,
    });
    expect(audit.disposition_counts_by_canonical_pillar).toEqual({
      _UNMAPPED_TO_CANONICAL: {
        KEEP: 36,
        REWRITE: 35,
        MERGE_HOLD: 59,
        REJECT_HOLD: 61,
        total: 191,
      },
    });
    expect(audit.nodes.every((node) => !node.safe_binding.safe_without_inference)).toBe(true);
  });

  it('attests that the audit remained local-only and non-mutating', () => {
    expect(audit).toMatchObject({
      deterministic: true,
      local_only: true,
      external_calls_performed: false,
      vendor_mutations_performed: false,
      generation_publish_export_or_spend_performed: false,
    });
    const report = readFileSync(MD_OUT, 'utf8');
    expect(report).toContain('No current DKN node can safely bind');
    expect(report).toContain('Historical audit excluded');
    expect(report).toContain('_UNMAPPED_TO_CANONICAL');
  });
});
