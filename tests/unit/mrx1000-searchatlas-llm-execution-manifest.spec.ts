/**
 * Focused invariants for the deterministic, local-only MRX1000 SearchAtlas +
 * ordered-LLM execution manifest.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { validateCanarySnapshot } from '../../scripts/build-mrx-1000-searchatlas-llm-execution-manifest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(HERE, '..', '..');
const WORKSPACE_ROOT = path.resolve(MRX_ROOT, '..');
const SCRIPT = path.join(MRX_ROOT, 'scripts/build-mrx-1000-searchatlas-llm-execution-manifest.mjs');
const JSON_OUT = path.join(MRX_ROOT, 'config/mrx-1000-searchatlas-llm-execution-manifest.json');
const CSV_OUT = path.join(MRX_ROOT, 'config/mrx-1000-searchatlas-llm-execution-manifest.csv');
const REPORT_OUT = path.join(MRX_ROOT, 'reports/mrx-1000-searchatlas-llm-execution-manifest.md');
const LEDGER = path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json');
const LEDGER_COUNTS = (
  JSON.parse(readFileSync(LEDGER, 'utf8')) as {
    verification: { preservation_classification_counts: Record<string, number> };
  }
).verification.preservation_classification_counts;
const PUBLIC_ROW_COUNT = LEDGER_COUNTS.live_public_published_route;
const HELD_ROW_COUNT = LEDGER_COUNTS.incumbent_draft_nonpublic_held;
const PILOT_ROW_COUNT = LEDGER_COUNTS.pilot_draft_noindex_stage;
const PLANNING_ROW_COUNT = LEDGER_COUNTS.planning_only_inventory;
const INCUMBENT_ROW_COUNT = PUBLIC_ROW_COUNT + HELD_ROW_COUNT;
const READINESS = path.join(MRX_ROOT, 'reports/mrx-1000-readiness-matrix.json');
const D11 = path.join(WORKSPACE_ROOT, 'program-plans/mrx-1000-ceo-decision-no-spend-capacity.md');
const OWNER_DECISION = path.join(
  MRX_ROOT,
  'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
);
const D12 = path.join(
  WORKSPACE_ROOT,
  'program-plans/mrx-1000-ceo-decision-exact-claude-gate-and-narrow-no-spend-row2-review.md',
);
const D14 = path.join(
  WORKSPACE_ROOT,
  'program-plans/mrx-1000-ceo-decision-d13-row2-source-hash-clerical-correction-supersession.md',
);

interface ReviewStage {
  order: number;
  key: string;
  display_name: string;
  required_exact_model_id: string | null;
  additional_engine: boolean;
  state: string;
  dispatch_eligible_now: boolean;
  prerequisite_gates: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

interface ManifestRow {
  program_row_id: string;
  canonical_slug: string;
  authoritative_current_state: {
    canonical_inventory_state: string;
    pilot_article_id: string | null;
    repo: {
      mdx_exists: boolean;
      source_sha256: string | null;
      workspace_public_route_configured: boolean;
      production_live_verified_in_this_local_build: boolean;
    };
    planning_handles: {
      searchatlas_map_id: number | null;
      searchatlas_title_uuid: string | null;
      content_genius_article_uuid_persisted_in_ledger: string | null;
      are_content_genius_article_creation_proof: boolean;
    };
    review_candidate: {
      state: string;
      checksummed_review_candidate_present: boolean;
      path: string | null;
      source_sha256: string | null;
      body_sha256: string | null;
      body_word_count: number | null;
      candidate_type: string | null;
      readiness_evidence_verified: boolean;
      readiness_evidence_paths: string[];
      workspace_mdx_is_review_candidate: boolean;
      special_candidate_validation: null | {
        validated: boolean;
        state: string;
        candidate_path: string | null;
        candidate_sha256: string | null;
        candidate_body_sha256: string | null;
        candidate_word_count: number | null;
        readiness_evidence_verified: boolean;
        readiness_evidence_paths: string[];
        rejection_reasons: string[];
        rejected_candidate_observation: null | {
          path_observed: string | null;
          actual_sha256: string | null;
          compliance_evidence_declared_sha256: string | null;
          seo_aeo_evidence_declared_sha256: string | null;
          actual_body_sha256: string | null;
          frontmatter_body_checksum_sha256: string | null;
          current_raw_vendor_draft_sha256: string | null;
          current_raw_vendor_draft_bytes: number;
          d14_corrected_recorded_raw_sha256: string;
          d10_recorded_raw_bytes: number;
          frontmatter_remediated_from_sha256: string | null;
        };
      };
    };
    vendor_join: {
      match_count: number;
      binding_status: string;
      candidate_article_uuids: string[];
      content_genius_article_uuid_proven_for_canonical_row: string | null;
      exact_title_candidate_is_creation_proof_for_canonical_row: boolean;
      records: Array<{
        article_uuid: string;
        artifact_bound_to_canonical_row: boolean;
        source_sha256_verified_now: boolean;
        vendor_record_evidence_verified_now: boolean;
      }>;
    };
  };
  searchatlas_execution: {
    execution_sequence: number;
    batch_id: string;
    position_in_batch: number;
    action_needed: string;
    execution_state: string;
    execution_eligible_now: boolean;
    creation_needed_proven: boolean;
    searchatlas_created_claimed: boolean;
    external_write_performed: boolean;
    prerequisite_gates: Record<string, unknown>;
    evidence: Record<string, unknown>;
  };
  ordered_llm_reviews: ReviewStage[];
  ordered_review_exception: null | {
    decision_id: string;
    decision_sha256: string;
    corrected_by_decision_id: string;
    correction_sha256: string;
    recovery_decision_id: string;
    recovery_decision_sha256: string;
    target_pilot_article_id: string;
    scope: string;
    no_spend: boolean;
    nonpublic: boolean;
    noindex_required: boolean;
    one_pass_per_surface: boolean;
    exact_surface_count: number;
    required_order: string[];
    claude_model_policy: {
      selection: string;
      selected_model_id: string | null;
      substitution_note_required: boolean;
      substitution_note_template: string;
      release_or_index_gate_substitution_allowed: boolean;
    };
    corrected_recorded_raw_provenance: {
      sha256: string;
      sha256_length: number;
      expected_bytes: number;
      current_sha256: string | null;
      current_bytes: number;
      matches_current_bytes: boolean;
    };
    formal_audits: {
      compliance: { sha256: string | null; sha256_verified: boolean; verdict: string };
      seo_aeo: { sha256: string | null; sha256_verified: boolean; verdict: string };
    };
    candidate_readiness: {
      candidate_sha256: string | null;
      candidate_body_sha256: string | null;
      candidate_validated: boolean;
      both_fresh_audits_pass_same_candidate: boolean;
      audit_ready_now: boolean;
      ordered_review_ready_for_action_time_preflight: boolean;
    };
    preconditions: Record<string, boolean>;
    preconditions_satisfied_now: boolean;
    dispatch_eligible_now: boolean;
    blocker_codes: string[];
  };
  review_gate: {
    required_order: string[];
    next_stage: string | null;
    any_verdict_recorded: boolean;
    all_required_verdicts_passed: boolean;
    exact_claude_substitution_allowed: boolean;
    exact_claude_substitution_scope: string | null;
  };
  release_index_eligibility: {
    authorization_cap_new_rows: number | null;
    numerical_release_cap_applies: boolean;
    elapsed_time_gate_applies: boolean;
    program_release_authorized: boolean;
    release_action_eligible_now: boolean;
    index_submission_eligible_now: boolean;
    production_live_verified_in_this_local_build: boolean;
    release_or_index_action_performed: boolean;
    exact_claude_opus_4_6_required_before_release_or_index_transition: boolean;
    release_or_index_model_substitution_allowed: boolean;
  };
  stop_conditions: string[];
}

interface Manifest {
  deterministic: boolean;
  local_only: boolean;
  external_services_called: boolean;
  external_writes_performed: boolean;
  content_fingerprint_sha256: string;
  inputs: Record<
    string,
    {
      path: string;
      sha256: string | null;
      bytes: number;
      present?: boolean;
      sha256_method?: string;
      generated_at_excluded_from_sha256?: boolean;
    }
  >;
  release_gate: {
    decision_id: string;
    signed_artifact_sha256: string;
    signed_artifact_sha256_verified: boolean;
    authorization_cap_new_rows: number | null;
    numerical_release_cap_applies: boolean;
    elapsed_time_gate_applies: boolean;
    release_authorized: boolean;
    index_authorized: boolean;
    vendor_inventory_snapshot: {
      total: number;
      by_status: Record<string, number>;
      composition: Record<string, number | boolean>;
    };
  };
  model_gate: {
    exact_claude_model_id: string;
    exact_claude_available: boolean;
    substitution_allowed: boolean;
    google_label_correction: Record<string, string>;
    applies_to_every_release_or_index_transition: boolean;
    applies_to_every_row_outside_d12_ordered_review_exception: boolean;
  };
  aggregate: Record<string, unknown> & {
    total_rows: number;
    unique_program_row_ids: number;
    unique_canonical_slugs: number;
    batch_count: number;
    by_batch: Record<string, number>;
    by_canonical_inventory_state: Record<string, number>;
    repo_mdx_present: number;
    workspace_public_route_configured: number;
    planning_searchatlas_map_id_count: number;
    planning_searchatlas_title_uuid_count: number;
    persisted_ledger_content_genius_article_uuid_count: number;
    checksummed_review_candidate_rows: number;
    rows_without_checksummed_review_candidate: number;
    by_review_candidate_state: Record<string, number>;
    pilot_workspace_qa_shell_rows: number;
    pilot_workspace_shells_marked_as_review_candidates: number;
    pilot_rows_with_validated_distinct_review_candidate: number;
    vendor_exact_title_match_rows: number;
    vendor_unambiguous_candidate_rows: number;
    vendor_ambiguous_candidate_rows: number;
    vendor_exact_title_candidate_records: number;
    unique_vendor_exact_title_candidate_uuids: number;
    vendor_candidate_records_reverified_against_source: number;
    artifact_bound_content_genius_uuid_rows: number;
    rows_with_any_llm_verdict: number;
    rows_with_all_required_llm_verdicts_passed: number;
    row2_ordered_review_exception_rows: number;
    row2_ordered_review_exception_dispatch_eligible_now: number;
    row2_ordered_review_audit_ready_now: number;
    release_action_eligible_now: number;
    index_submission_eligible_now: number;
    searchatlas_created_claim_count: number;
    external_write_performed_count: number;
  };
  rows: ManifestRow[];
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function readinessSemanticSha256(file: string): string {
  const readiness = JSON.parse(readFileSync(file, 'utf8')) as { generated_at: string };
  readiness.generated_at = '<masked-nondeterministic-readiness-timestamp>';
  return createHash('sha256')
    .update(`${JSON.stringify(readiness, null, 2)}\n`)
    .digest('hex');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

function runGenerator(outputDir: string, ledgerPath: string, readinessPath: string): void {
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: MRX_ROOT,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    env: {
      ...process.env,
      MRX1000_SEARCHATLAS_LLM_OUTPUT_DIR: outputDir,
      MRX1000_SEARCHATLAS_LLM_LEDGER_PATH: ledgerPath,
      MRX1000_SEARCHATLAS_LLM_READINESS_PATH: readinessPath,
    },
  });
  if (result.status !== 0) {
    throw new Error(
      `generator exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

function snapshotProtectedInputs(
  ledgerPath: string,
  readinessPath: string,
): Record<string, string> {
  return {
    ledger_snapshot: sha256(ledgerPath),
    readiness_snapshot: sha256(readinessPath),
    d11: sha256(D11),
    owner_decision: sha256(OWNER_DECISION),
    d12: sha256(D12),
    d14: sha256(D14),
  };
}

describe('MRX1000 SearchAtlas + ordered LLM execution manifest', () => {
  let manifest: Manifest;
  let firstOutputHashes: Record<string, string>;
  let secondOutputHashes: Record<string, string>;
  let protectedInputHashesBefore: Record<string, string>;
  let protectedInputHashesAfter: Record<string, string>;
  let isolatedOutputDir: string | null = null;
  let isolatedOutputs: { json: string; csv: string; report: string };
  let isolatedLedgerPath: string;
  let isolatedReadinessPath: string;

  beforeAll(() => {
    isolatedOutputDir = mkdtempSync(path.join(tmpdir(), 'mrx1000-searchatlas-llm-'));
    isolatedLedgerPath = path.join(isolatedOutputDir, 'canonical-content-ledger.snapshot.json');
    isolatedReadinessPath = path.join(isolatedOutputDir, 'readiness-matrix.snapshot.json');
    const ledgerBytes = readFileSync(LEDGER);
    const readinessBytes = readFileSync(READINESS);
    const ledger = JSON.parse(ledgerBytes.toString('utf8')) as { articles?: unknown[] };
    const readiness = JSON.parse(readinessBytes.toString('utf8')) as { rows?: unknown[] };
    expect(ledger.articles).toHaveLength(1000);
    expect(readiness.rows).toHaveLength(1000);
    writeFileSync(isolatedLedgerPath, ledgerBytes);
    writeFileSync(isolatedReadinessPath, readinessBytes);
    protectedInputHashesBefore = snapshotProtectedInputs(isolatedLedgerPath, isolatedReadinessPath);
    isolatedOutputs = {
      json: path.join(isolatedOutputDir, 'mrx-1000-searchatlas-llm-execution-manifest.json'),
      csv: path.join(isolatedOutputDir, 'mrx-1000-searchatlas-llm-execution-manifest.csv'),
      report: path.join(isolatedOutputDir, 'mrx-1000-searchatlas-llm-execution-manifest.md'),
    };
    runGenerator(isolatedOutputDir, isolatedLedgerPath, isolatedReadinessPath);
    firstOutputHashes = {
      json: sha256(isolatedOutputs.json),
      csv: sha256(isolatedOutputs.csv),
      report: sha256(isolatedOutputs.report),
    };
    runGenerator(isolatedOutputDir, isolatedLedgerPath, isolatedReadinessPath);
    secondOutputHashes = {
      json: sha256(isolatedOutputs.json),
      csv: sha256(isolatedOutputs.csv),
      report: sha256(isolatedOutputs.report),
    };
    protectedInputHashesAfter = snapshotProtectedInputs(isolatedLedgerPath, isolatedReadinessPath);
    manifest = JSON.parse(readFileSync(isolatedOutputs.json, 'utf8')) as Manifest;
  });

  afterAll(() => {
    if (isolatedOutputDir) rmSync(isolatedOutputDir, { recursive: true, force: true });
  });

  it('is byte-deterministic in isolation and matches checked-in sidecars without modifying protected inputs', () => {
    expect(secondOutputHashes).toEqual(firstOutputHashes);
    expect(protectedInputHashesAfter).toEqual(protectedInputHashesBefore);
    // Compare large generated artifacts by their byte hashes. Deep-equality on
    // multi-megabyte Buffers can exhaust the Vitest worker while serializing a
    // failure diff, even though the contract being tested is byte identity.
    expect(sha256(JSON_OUT)).toBe(sha256(isolatedOutputs.json));
    expect(sha256(CSV_OUT)).toBe(sha256(isolatedOutputs.csv));
    expect(sha256(REPORT_OUT)).toBe(sha256(isolatedOutputs.report));
    expect(manifest.inputs.ledger.sha256).toBe(sha256(isolatedLedgerPath));
    expect(manifest.inputs.ledger.bytes).toBe(readFileSync(isolatedLedgerPath).byteLength);
    expect(manifest.inputs.readiness).toMatchObject({
      path: 'reports/mrx-1000-readiness-matrix.json',
      sha256: readinessSemanticSha256(isolatedReadinessPath),
      sha256_method: 'canonical_json_with_top_level_generated_at_masked',
      generated_at_excluded_from_sha256: true,
    });
    expect(manifest.deterministic).toBe(true);
    expect(manifest.content_fingerprint_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('contains exactly 1,000 unique canonical rows in 40 stable 25-row batches', () => {
    expect(manifest.rows).toHaveLength(1000);
    expect(manifest.aggregate).toMatchObject({
      total_rows: 1000,
      unique_program_row_ids: 1000,
      unique_canonical_slugs: 1000,
      batch_count: 40,
    });
    expect(Object.keys(manifest.aggregate.by_batch)).toHaveLength(40);
    expect(Object.values(manifest.aggregate.by_batch).every((count) => count === 25)).toBe(true);
    expect(manifest.rows.map((row) => row.searchatlas_execution.execution_sequence)).toEqual(
      Array.from({ length: 1000 }, (_, index) => index + 1),
    );

    const batchOne = manifest.rows.slice(0, 25);
    expect(
      batchOne.every((row) => row.searchatlas_execution.batch_id === 'MRX1000-SA-BATCH-001'),
    ).toBe(true);
    expect(batchOne.map((row) => row.authoritative_current_state.pilot_article_id)).toEqual(
      Array.from(
        { length: 25 },
        (_, index) => `MRX1000-PILOT-001-${String(index + 1).padStart(2, '0')}`,
      ),
    );
    expect(batchOne.map((row) => row.searchatlas_execution.execution_sequence)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
    const remainingIds = manifest.rows.slice(25).map((row) => row.program_row_id);
    expect(remainingIds).toEqual(
      [...remainingIds].sort(
        (a, b) => Number(a.slice('MRX1000-'.length)) - Number(b.slice('MRX1000-'.length)),
      ),
    );
  });

  it('projects the current canonical workspace-state partition', () => {
    expect(manifest.aggregate.by_canonical_inventory_state).toEqual({
      incumbent_draft_nonpublic_held: HELD_ROW_COUNT,
      live_public_published_route: PUBLIC_ROW_COUNT,
      pilot_draft_noindex_stage: PILOT_ROW_COUNT,
      planning_only_inventory: PLANNING_ROW_COUNT,
    });
    expect(manifest.aggregate.repo_mdx_present).toBe(INCUMBENT_ROW_COUNT + PILOT_ROW_COUNT);
    expect(manifest.aggregate.workspace_public_route_configured).toBe(PUBLIC_ROW_COUNT);
    expect(
      manifest.rows.every(
        (row) => !row.authoritative_current_state.repo.production_live_verified_in_this_local_build,
      ),
    ).toBe(true);
  });

  it('distinguishes workspace inventory from a checksummed, readiness-backed LLM candidate', () => {
    expect(manifest.aggregate).toMatchObject({
      checksummed_review_candidate_rows: INCUMBENT_ROW_COUNT + 1,
      rows_without_checksummed_review_candidate: 1000 - INCUMBENT_ROW_COUNT - 1,
      pilot_workspace_qa_shell_rows: PILOT_ROW_COUNT,
      pilot_workspace_shells_marked_as_review_candidates: 0,
      pilot_rows_with_validated_distinct_review_candidate: 1,
      by_review_candidate_state: {
        CHECKSUMMED_EXISTING_PUBLIC_ARTICLE_READY_FOR_LLM_REVIEW: PUBLIC_ROW_COUNT,
        CHECKSUMMED_HELD_SUBSTANTIVE_DRAFT_READY_FOR_LLM_REVIEW: HELD_ROW_COUNT,
        NO_CHECKSUMMED_REVIEW_CANDIDATE_PILOT_QA_SHELL_ONLY: 24,
        NO_WORKSPACE_CONTENT_CANDIDATE: PLANNING_ROW_COUNT,
        ROW2_REMEDIATED_NOINDEX_CANDIDATE_VALIDATED_FOR_ORDERED_LLM_REVIEW: 1,
      },
    });

    const pilots = manifest.rows.filter(
      (row) =>
        row.authoritative_current_state.canonical_inventory_state === 'pilot_draft_noindex_stage',
    );
    expect(pilots).toHaveLength(PILOT_ROW_COUNT);
    const nonRow2Pilots = pilots.filter(
      (row) => row.authoritative_current_state.pilot_article_id !== 'MRX1000-PILOT-001-02',
    );
    expect(nonRow2Pilots).toHaveLength(24);
    for (const row of nonRow2Pilots) {
      const candidate = row.authoritative_current_state.review_candidate;
      expect(candidate).toMatchObject({
        state: 'NO_CHECKSUMMED_REVIEW_CANDIDATE_PILOT_QA_SHELL_ONLY',
        checksummed_review_candidate_present: false,
        path: null,
        source_sha256: null,
        readiness_evidence_verified: false,
        workspace_mdx_is_review_candidate: false,
      });
      expect(row.stop_conditions).toContain('NO_CHECKSUMMED_REVIEW_CANDIDATE');
      expect(row.review_gate.next_stage).toBeNull();
      expect(row.searchatlas_execution.prerequisite_gates).toMatchObject({
        checksummed_content_candidate_present: false,
        review_candidate_path_and_sha256_present: false,
        review_readiness_evidence_verified: false,
      });
      for (const stage of row.ordered_llm_reviews) {
        expect(stage.prerequisite_gates).toMatchObject({
          checksummed_review_candidate_present: false,
          review_candidate_path: null,
          review_candidate_sha256: null,
          review_candidate_readiness_evidence_verified: false,
        });
      }
    }

    const row2 = pilots.find(
      (row) => row.authoritative_current_state.pilot_article_id === 'MRX1000-PILOT-001-02',
    );
    expect(row2).toBeDefined();
    expect(
      row2?.authoritative_current_state.review_candidate.special_candidate_validation,
    ).toMatchObject({
      validated: true,
      state: 'ROW2_REMEDIATED_NOINDEX_CANDIDATE_VALIDATED_FOR_ORDERED_LLM_REVIEW',
      candidate_path:
        '.worktrees/t_953629dc/drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx',
      candidate_sha256: '8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d',
      candidate_body_sha256: 'abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07',
      candidate_word_count: 1894,
      readiness_evidence_verified: true,
      rejection_reasons: [],
      rejected_candidate_observation: null,
    });
    expect(row2?.authoritative_current_state.review_candidate).toMatchObject({
      checksummed_review_candidate_present: true,
      source_sha256: '8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d',
      body_sha256: 'abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07',
      body_word_count: 1894,
      readiness_evidence_paths: [
        '.worktrees/t_953629dc/reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md',
        '.worktrees/t_953629dc/reports/mrx1000-row2-remediated-fresh-post-recovery-audit-compliance.md',
        '.worktrees/t_953629dc/reports/mrx1000-055-fresh-seo-aeo-audit-after-exact-row2-recovery.md',
      ],
    });
    expect(row2?.review_gate.next_stage).toBe('chatgpt');
    expect(row2?.stop_conditions).not.toContain('NO_CHECKSUMMED_REVIEW_CANDIDATE');

    const substantive = manifest.rows.filter((row) =>
      ['live_public_published_route', 'incumbent_draft_nonpublic_held'].includes(
        row.authoritative_current_state.canonical_inventory_state,
      ),
    );
    expect(substantive).toHaveLength(INCUMBENT_ROW_COUNT);
    for (const row of substantive) {
      const candidate = row.authoritative_current_state.review_candidate;
      if (!candidate.checksummed_review_candidate_present) {
        expect(row.authoritative_current_state.canonical_inventory_state).toBe(
          'incumbent_draft_nonpublic_held',
        );
        expect(candidate.state).toBe('WORKSPACE_MDX_PRESENT_BUT_REVIEW_READINESS_UNPROVEN');
        continue;
      }
      expect(candidate.path, row.program_row_id).toBeTruthy();
      expect(candidate.source_sha256, row.program_row_id).toMatch(/^[0-9a-f]{64}$/);
      expect(candidate.body_sha256, row.program_row_id).toMatch(/^[0-9a-f]{64}$/);
      expect(candidate.body_word_count, row.program_row_id).toBeGreaterThanOrEqual(500);
      expect(candidate.readiness_evidence_verified, row.program_row_id).toBe(true);
      expect(candidate.readiness_evidence_paths, row.program_row_id).toEqual([
        'reports/mrx-1000-readiness-matrix.json',
        'config/mrx-1000-canonical-content-ledger.json',
      ]);
      expect(row.review_gate.next_stage, row.program_row_id).toBe('chatgpt');
      expect(row.stop_conditions, row.program_row_id).not.toContain(
        'NO_CHECKSUMMED_REVIEW_CANDIDATE',
      );
      for (const stage of row.ordered_llm_reviews) {
        expect(stage.prerequisite_gates, row.program_row_id).toMatchObject({
          checksummed_review_candidate_present: true,
          review_candidate_path: candidate.path,
          review_candidate_sha256: candidate.source_sha256,
          review_candidate_readiness_evidence_verified: true,
        });
      }
    }
  });

  it('uses D16 release authority while preserving the historical D11 vendor inventory', () => {
    expect(manifest.release_gate).toMatchObject({
      decision_id: 'D-2026-0804-16',
      signed_artifact_sha256: 'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f',
      signed_artifact_sha256_verified: true,
      authorization_cap_new_rows: null,
      numerical_release_cap_applies: false,
      elapsed_time_gate_applies: false,
      release_authorized: true,
      index_authorized: true,
      vendor_inventory_snapshot: {
        total: 299,
        by_status: { NEEDS_REVIEW: 200, COMPLETED: 70, NOT_BEGUN: 29 },
        composition: {
          raw_content_genius_export_records: 297,
          separately_validated_canary_artifacts: 2,
          arithmetic_verified: true,
        },
      },
    });
  });

  it('fails duplicate-canary UUID drift before composing the 299-row snapshot', () => {
    const duplicate = {
      uuid: '0f41794e-2ef4-4de5-b228-589dd2c0f0f7',
      status: 'NEEDS_REVIEW',
    };
    expect(() => validateCanarySnapshot([duplicate, { ...duplicate }], new Map())).toThrow(
      'canary UUIDs must be unique from each other',
    );

    expect(() =>
      validateCanarySnapshot(
        [
          duplicate,
          {
            uuid: '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c',
            status: 'NEEDS_REVIEW',
          },
        ],
        new Map([[duplicate.uuid, {}]]),
      ),
    ).toThrow('outside the 297-row raw export');
  });

  it('keeps topical-map planning handles separate from Content Genius UUID proof', () => {
    expect(manifest.aggregate).toMatchObject({
      planning_searchatlas_map_id_count: 258,
      planning_searchatlas_title_uuid_count: 233,
      persisted_ledger_content_genius_article_uuid_count: 0,
      vendor_exact_title_match_rows: 153,
      vendor_unambiguous_candidate_rows: 147,
      vendor_ambiguous_candidate_rows: 6,
      vendor_exact_title_candidate_records: 160,
      unique_vendor_exact_title_candidate_uuids: 160,
      vendor_candidate_records_reverified_against_source: 160,
      artifact_bound_content_genius_uuid_rows: 2,
    });
    expect(
      manifest.rows.every(
        (row) =>
          !row.authoritative_current_state.planning_handles
            .are_content_genius_article_creation_proof &&
          !row.authoritative_current_state.vendor_join
            .exact_title_candidate_is_creation_proof_for_canonical_row,
      ),
    ).toBe(true);
    expect(
      manifest.rows.every((row) =>
        row.authoritative_current_state.vendor_join.records.every(
          (record) => record.vendor_record_evidence_verified_now,
        ),
      ),
    ).toBe(true);

    const bound = manifest.rows.filter(
      (row) =>
        row.authoritative_current_state.vendor_join
          .content_genius_article_uuid_proven_for_canonical_row,
    );
    expect(
      bound.map((row) => [
        row.authoritative_current_state.pilot_article_id,
        row.authoritative_current_state.vendor_join
          .content_genius_article_uuid_proven_for_canonical_row,
      ]),
    ).toEqual([
      ['MRX1000-PILOT-001-01', '0f41794e-2ef4-4de5-b228-589dd2c0f0f7'],
      ['MRX1000-PILOT-001-02', '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c'],
    ]);
    expect(
      bound.every((row) =>
        row.authoritative_current_state.vendor_join.records.every(
          (record) =>
            record.artifact_bound_to_canonical_row &&
            record.source_sha256_verified_now &&
            record.vendor_record_evidence_verified_now,
        ),
      ),
    ).toBe(true);
  });

  it('keeps the default exact-Opus order on all 999 non-exception rows', () => {
    const expectedKeys = [
      'chatgpt',
      'google_gemini',
      'claude_opus_4_6',
      'perplexity',
      'microsoft_copilot',
    ];
    const defaultRows = manifest.rows.filter((row) => row.ordered_review_exception == null);
    expect(defaultRows).toHaveLength(999);
    for (const row of defaultRows) {
      expect(row.review_gate.required_order).toEqual(expectedKeys);
      expect(row.ordered_llm_reviews.map((stage) => stage.key)).toEqual(expectedKeys);
      expect(row.ordered_llm_reviews.map((stage) => stage.order)).toEqual([1, 2, 3, 4, 5]);
      expect(row.ordered_llm_reviews[1].display_name).toBe('Google Gemini');
      expect(row.ordered_llm_reviews[2]).toMatchObject({
        required_exact_model_id: 'claude-opus-4-6',
        state: 'MODEL_BLOCKED_EXACT_CLAUDE_OPUS_4_6_UNAVAILABLE',
        dispatch_eligible_now: false,
      });
      expect(row.ordered_llm_reviews[4]).toMatchObject({
        display_name: 'Microsoft Copilot',
        additional_engine: true,
      });
      for (const stage of row.ordered_llm_reviews) {
        expect(stage.evidence).toMatchObject({
          review_input_sha256: null,
          verdict_output_sha256: null,
          evidence_path: null,
          exact_model_id_observed: null,
          run_id: null,
          executed_at: null,
          verdict: null,
        });
      }
    }
    expect(manifest.model_gate).toMatchObject({
      exact_claude_model_id: 'claude-opus-4-6',
      exact_claude_available: false,
      substitution_allowed: false,
      applies_to_every_release_or_index_transition: true,
      applies_to_every_row_outside_d12_ordered_review_exception: true,
      google_label_correction: {
        incorrect_source_label: 'Google Demini',
        canonical_machine_key: 'google_gemini',
        canonical_display_name: 'Google Gemini',
      },
    });
  });

  it('pins D12/D14/D15 and isolates row-2 audit readiness without external dispatch', () => {
    expect(manifest.inputs.d12Row2OrderedReview).toMatchObject({
      sha256: 'cf1ee52c6239465d257cafdab67715ea60ff618aefe886a06d3128a7b98d4ac1',
    });
    expect(manifest.inputs.d14Row2SourceHashCorrection).toMatchObject({
      sha256: '20a57109fcc1332391f2660c6890d21f9efd861c397fceaf550630349dc9c136',
    });
    expect(manifest.inputs.d15Row2FinalRecovery).toMatchObject({
      sha256: '6390678bd9ec46d373fdc237b1e27a8f3abf7cebd2cb40b5498e2cd09af92dfd',
    });
    expect(manifest.aggregate).toMatchObject({
      row2_ordered_review_exception_rows: 1,
      row2_ordered_review_exception_dispatch_eligible_now: 0,
      row2_ordered_review_audit_ready_now: 1,
    });

    const exceptionRows = manifest.rows.filter((row) => row.ordered_review_exception != null);
    expect(exceptionRows).toHaveLength(1);
    const row2 = exceptionRows[0];
    expect(row2.authoritative_current_state.pilot_article_id).toBe('MRX1000-PILOT-001-02');
    expect(row2.review_gate).toMatchObject({
      required_order: ['chatgpt', 'google_gemini', 'claude_action_time_named_model', 'perplexity'],
      next_stage: 'chatgpt',
      exact_claude_substitution_allowed: true,
      exact_claude_substitution_scope: 'D12_ROW2_ORDERED_INDEPENDENT_REVIEW_ONLY',
    });
    expect(row2.ordered_llm_reviews.map((stage) => stage.key)).toEqual(
      row2.review_gate.required_order,
    );
    expect(row2.ordered_llm_reviews).toHaveLength(4);
    expect(row2.ordered_llm_reviews[0]).toMatchObject({
      key: 'chatgpt',
      state: 'READY_FOR_D12_CHATGPT_REVIEW_AFTER_ACTION_TIME_PREFLIGHT',
      dispatch_eligible_now: false,
    });
    expect(row2.ordered_llm_reviews[2]).toMatchObject({
      key: 'claude_action_time_named_model',
      display_name: 'Claude (action-time named model)',
      required_exact_model_id: null,
      availability_state: 'ACTION_TIME_SIGNED_IN_CLAUDE_SELECTOR_CAPTURE_REQUIRED',
      dispatch_eligible_now: false,
    });

    const exception = row2.ordered_review_exception;
    expect(exception).toMatchObject({
      decision_id: 'D-2026-0720-12',
      decision_sha256: 'cf1ee52c6239465d257cafdab67715ea60ff618aefe886a06d3128a7b98d4ac1',
      corrected_by_decision_id: 'D-2026-0720-14',
      correction_sha256: '20a57109fcc1332391f2660c6890d21f9efd861c397fceaf550630349dc9c136',
      recovery_decision_id: 'D-2026-0720-15',
      recovery_decision_sha256: '6390678bd9ec46d373fdc237b1e27a8f3abf7cebd2cb40b5498e2cd09af92dfd',
      scope: 'ONE_PASS_ORDERED_INDEPENDENT_REVIEW_ONLY',
      no_spend: true,
      nonpublic: true,
      noindex_required: true,
      one_pass_per_surface: true,
      exact_surface_count: 4,
      preconditions_satisfied_now: false,
      dispatch_eligible_now: false,
      corrected_recorded_raw_provenance: {
        sha256: 'fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e',
        sha256_length: 64,
        expected_bytes: 13698,
        current_sha256: 'fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e',
        current_bytes: 13698,
        matches_current_bytes: true,
      },
      formal_audits: {
        compliance: {
          sha256: '03437048d097cd95356d99c40653fe6967f8ad9f6c37e84a777404c737b2cdca',
          sha256_verified: true,
          verdict: 'PASS',
        },
        seo_aeo: {
          sha256: 'e4de274bccc48d4e614258fd09792c820cea3531366612187cedc4172eda6964',
          sha256_verified: true,
          verdict: 'PASS',
        },
      },
      candidate_readiness: {
        candidate_sha256: '8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d',
        candidate_body_sha256: 'abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07',
        candidate_validated: true,
        both_fresh_audits_pass_same_candidate: true,
        audit_ready_now: true,
        ordered_review_ready_for_action_time_preflight: true,
      },
      claude_model_policy: {
        selection: 'ACTION_TIME_CURRENTLY_AVAILABLE_NAMED_CLAUDE_FAMILY_MODEL',
        selected_model_id: null,
        substitution_note_required: true,
        release_or_index_gate_substitution_allowed: false,
      },
      blocker_codes: [
        'ROW2_D12_ACTION_TIME_REVIEW_PREFLIGHT_REQUIRED',
        'LOCAL_ONLY_MANIFEST_EXTERNAL_DISPATCH_NOT_PERFORMED',
      ],
    });
    expect(exception?.claude_model_policy.substitution_note_template).toContain(
      'D-2026-0720-12 §1A',
    );
    expect(row2.stop_conditions).toEqual(expect.arrayContaining(exception?.blocker_codes || []));
  });

  it('fails all rows closed and never claims creation, review, release, indexing, or writes', () => {
    expect(manifest).toMatchObject({
      local_only: true,
      external_services_called: false,
      external_writes_performed: false,
    });
    expect(manifest.aggregate).toMatchObject({
      rows_with_any_llm_verdict: 0,
      rows_with_all_required_llm_verdicts_passed: 0,
      release_action_eligible_now: 0,
      index_submission_eligible_now: 0,
      searchatlas_created_claim_count: 0,
      external_write_performed_count: 0,
    });
    for (const row of manifest.rows) {
      expect(row.searchatlas_execution).toMatchObject({
        execution_state: 'WAITING_FOR_IDENTITY_CONTENT_AND_REVIEW_GATES_NO_EXTERNAL_WRITE',
        execution_eligible_now: false,
        creation_needed_proven: false,
        searchatlas_created_claimed: false,
        external_write_performed: false,
      });
      expect(row.review_gate).toMatchObject({
        any_verdict_recorded: false,
        all_required_verdicts_passed: false,
      });
      expect(row.review_gate.exact_claude_substitution_allowed).toBe(
        row.authoritative_current_state.pilot_article_id === 'MRX1000-PILOT-001-02',
      );
      expect(row.release_index_eligibility).toMatchObject({
        authorization_cap_new_rows: null,
        numerical_release_cap_applies: false,
        elapsed_time_gate_applies: false,
        program_release_authorized: true,
        release_action_eligible_now: false,
        index_submission_eligible_now: false,
        production_live_verified_in_this_local_build: false,
        release_or_index_action_performed: false,
        exact_claude_opus_4_6_required_before_release_or_index_transition: true,
        release_or_index_model_substitution_allowed: false,
      });
      expect(row.stop_conditions).toEqual(
        expect.arrayContaining([
          'EXACT_CLAUDE_OPUS_4_6_UNAVAILABLE',
          'ORDERED_LLM_REVIEW_SEQUENCE_NOT_COMPLETE',
          'ARTICLE_SPECIFIC_QUALITY_CLEARANCE_NOT_COMPLETE',
        ]),
      );
    }
  });

  it('writes a 1,000-row CSV and a report that states the evidence boundary', () => {
    const csv = readFileSync(CSV_OUT, 'utf8');
    const csvLines = csv.trimEnd().split('\n');
    expect(csvLines).toHaveLength(1001);
    expect(csvLines[0]).toContain('google_gemini_state');
    expect(csvLines[0]).toContain('claude_action_time_named_model_state');
    expect(csvLines[0]).toContain('ordered_review_exception_decision_id');
    expect(csvLines[0]).toContain('ordered_review_exception_audit_ready_now');
    expect(csvLines[0]).toContain('checksummed_review_candidate_present');
    const header = parseCsvLine(csvLines[0]);
    const sequenceColumn = header.indexOf('execution_sequence');
    const pilotColumn = header.indexOf('pilot_article_id');
    const batchColumn = header.indexOf('batch_id');
    const exceptionDecisionColumn = header.indexOf('ordered_review_exception_decision_id');
    const auditReadyColumn = header.indexOf('ordered_review_exception_audit_ready_now');
    expect(sequenceColumn).toBeGreaterThanOrEqual(0);
    expect(pilotColumn).toBeGreaterThanOrEqual(0);
    expect(batchColumn).toBeGreaterThanOrEqual(0);
    expect(exceptionDecisionColumn).toBeGreaterThanOrEqual(0);
    expect(auditReadyColumn).toBeGreaterThanOrEqual(0);
    for (let index = 1; index < csvLines.length; index += 1) {
      const cells = parseCsvLine(csvLines[index]);
      expect(cells[sequenceColumn], `CSV row ${index}`).toBe(String(index));
      if (index <= 25) {
        expect(cells[pilotColumn], `CSV pilot row ${index}`).toBe(
          `MRX1000-PILOT-001-${String(index).padStart(2, '0')}`,
        );
        expect(cells[batchColumn], `CSV pilot row ${index}`).toBe('MRX1000-SA-BATCH-001');
      }
      expect(cells[exceptionDecisionColumn], `CSV exception row ${index}`).toBe(
        index === 2 ? 'D-2026-0720-12' : '',
      );
      expect(cells[auditReadyColumn], `CSV audit-ready row ${index}`).toBe(
        index === 2 ? 'true' : '',
      );
    }
    const report = readFileSync(REPORT_OUT, 'utf8');
    expect(report).toContain('299 = 200 NEEDS_REVIEW + 70 COMPLETED + 29 NOT_BEGUN');
    expect(report).toContain('it does not claim that 1,000 articles were created');
    expect(report).toContain('Google Gemini');
    expect(report).toContain('Microsoft Copilot');
    expect(report).toContain('Every batch has exactly 25 rows');
    expect(report).toContain('physically emitted in `execution_sequence` order 1-1000');
    expect(report).toMatch(/Pilot QA shells \(never review candidates\)\s+\|\s+25/);
    expect(report).toContain('`NO_CHECKSUMMED_REVIEW_CANDIDATE`');
    expect(report).toContain('ROW2_REMEDIATED_NOINDEX_CANDIDATE_VALIDATED_FOR_ORDERED_LLM_REVIEW');
    expect(report).toContain('D12/D14/D15 row-2-only ordered-review readiness');
    expect(report).toContain('currently available named Claude-family model');
    expect(report).toContain('Row 2 is **audit-ready now**');
    expect(report).toContain('compliance `PASS` and SEO/AEO `PASS`');
    expect(report).toContain(
      'the other 999 rows retain their article-specific identity, content, and review requirements',
    );
  });
});
