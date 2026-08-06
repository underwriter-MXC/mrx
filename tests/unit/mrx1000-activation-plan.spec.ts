/**
 * Focused invariants for the additive MRX1000 activation-plan sidecar.
 *
 * These tests build expected artifacts in memory before comparing them with
 * the checked-in files. They never run the generator or overwrite a stale
 * artifact before detecting drift.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  EXPECTED_OWNER_DECISION_SHA256,
  buildActivationPlan,
  canonicalLedgerRowFingerprint,
  renderCsv,
  renderReport,
} from '../../scripts/build-mrx-1000-activation-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const LEDGER_PATH = path.join(ROOT, 'config', 'mrx-1000-canonical-content-ledger.json');
const OWNER_DECISION_PATH = path.resolve(
  ROOT,
  'docs',
  'governance',
  'mrx1000-owner-continuous-publication-directive-2026-08-04.md',
);
const JSON_OUT = path.join(ROOT, 'config', 'mrx-1000-content-activation-plan.json');
const CSV_OUT = path.join(ROOT, 'config', 'mrx-1000-content-activation-plan.csv');
const REPORT_OUT = path.join(ROOT, 'reports', 'mrx-1000-content-activation-plan.md');

type Cta = {
  url: string;
  label: string;
  name: string;
  placement_code: string;
  placement_guidance: string;
  assignment_rule: string;
  assignment_basis: string;
  approved_route_evidence: string;
  role: string;
  status: string;
};

type PlanRow = {
  program_row_id: string;
  canonical_url: string;
  cluster: string;
  funnel_stage: 'education' | 'consideration' | 'decision';
  source_route_live: boolean;
  pillar_link: { url: string; route_evidence: string; status: string };
  sibling_link: {
    target_program_row_id: string;
    url: string;
    relationship: string;
    status: string;
  };
  primary_cta: Cta & { is_appointment_cta: boolean };
  appointment_cta: Cta & { distinct_from_primary_cta: boolean };
  evidence: {
    triangle_plan_status: string;
    primary_cta_plan_status: string;
    appointment_cta_plan_status: string;
    rendered_status: string;
    rendered_triangle_verified: boolean;
    live_status: string;
    live_triangle_verified: boolean;
    release_status: string;
    numerical_release_cap_applies: boolean;
  };
};

type Ledger = {
  content_fingerprint_sha256: string;
  articles: Array<Record<string, unknown>>;
};

type Plan = {
  content_fingerprint_sha256: string;
  inputs: {
    canonical_ledger_fingerprint_sha256: string;
    canonical_ledger_fingerprint_verified: boolean;
    owner_decision: {
      numerical_release_cap_applies: boolean;
      elapsed_time_gate_applies: boolean;
      spend_authorized: boolean;
      publication_authorized: boolean;
      decision_sha256: string;
      decision_sha256_verified: boolean;
    };
  };
  policy: Record<string, unknown>;
  verification: Record<string, number | boolean>;
  distributions: {
    by_primary_cta_url: Record<string, number>;
    by_appointment_cta_url: Record<string, number>;
    by_source_preservation_classification: Record<string, number>;
  };
  rows: PlanRow[];
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

describe('MRX1000 deterministic content activation plan', () => {
  let ledger: Ledger;
  let ownerDecisionText: string;
  let plan: Plan;
  let expectedJson: string;
  let expectedCsv: string;
  let expectedReport: string;

  beforeAll(() => {
    ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as Ledger;
    ownerDecisionText = readFileSync(OWNER_DECISION_PATH, 'utf8');
    plan = buildActivationPlan(ledger, ownerDecisionText) as Plan;
    expectedJson = `${JSON.stringify(plan, null, 2)}\n`;
    expectedCsv = renderCsv(plan);
    expectedReport = renderReport(plan);
  });

  it('keeps checked-in artifacts synchronized without overwriting them first', () => {
    expect(readFileSync(JSON_OUT, 'utf8')).toBe(expectedJson);
    expect(readFileSync(CSV_OUT, 'utf8')).toBe(expectedCsv);
    expect(readFileSync(REPORT_OUT, 'utf8')).toBe(expectedReport);
  });

  it('covers exactly 1,000 unique canonical rows', () => {
    expect(plan.rows).toHaveLength(1000);
    expect(new Set(plan.rows.map((row) => row.program_row_id))).toHaveLength(1000);
    expect(new Set(plan.rows.map((row) => row.canonical_url))).toHaveLength(1000);
    expect(plan.verification.all_invariants_pass).toBe(true);
  });

  it('recomputes and verifies the canonical-ledger row fingerprint', () => {
    const computed = canonicalLedgerRowFingerprint(ledger.articles);
    expect(computed).toBe(ledger.content_fingerprint_sha256);
    expect(plan.inputs.canonical_ledger_fingerprint_sha256).toBe(computed);
    expect(plan.inputs.canonical_ledger_fingerprint_verified).toBe(true);
    expect(plan.verification.canonical_ledger_fingerprint_verified).toBe(true);
  });

  it('fails closed when a canonical row changes without a new ledger fingerprint', () => {
    const alteredLedger = structuredClone(ledger);
    alteredLedger.articles[0].canonical_title = `${String(
      alteredLedger.articles[0].canonical_title,
    )} altered`;
    expect(() => buildActivationPlan(alteredLedger, ownerDecisionText)).toThrow(
      /canonical ledger fingerprint mismatch/,
    );
  });

  it('pins the exact owner decision bytes and fails any hash drift', () => {
    expect(sha256(ownerDecisionText)).toBe(EXPECTED_OWNER_DECISION_SHA256);
    expect(plan.inputs.owner_decision.decision_sha256).toBe(EXPECTED_OWNER_DECISION_SHA256);
    expect(plan.inputs.owner_decision.decision_sha256_verified).toBe(true);
    expect(plan.verification.owner_decision_sha256_verified).toBe(true);
    expect(() =>
      buildActivationPlan(ledger, `${ownerDecisionText}\nunsigned alteration\n`),
    ).toThrow(/Owner decision SHA-256 mismatch/);
  });

  it('assigns a real same-cluster sibling without self-links', () => {
    const byId = new Map(plan.rows.map((row) => [row.program_row_id, row]));
    for (const row of plan.rows) {
      const sibling = byId.get(row.sibling_link.target_program_row_id);
      expect(sibling).toBeDefined();
      expect(sibling?.program_row_id).not.toBe(row.program_row_id);
      expect(sibling?.cluster).toBe(row.cluster);
      expect(sibling?.canonical_url).toBe(row.sibling_link.url);
      expect(row.sibling_link.relationship).toBe('same_cluster_next_by_program_row_id_cyclic');
    }
  });

  it('uses only canonical trailing-slash internal URLs', () => {
    for (const row of plan.rows) {
      for (const url of [
        row.canonical_url,
        row.pillar_link.url,
        row.sibling_link.url,
        row.primary_cta.url,
        row.appointment_cta.url,
      ]) {
        expect(url).toMatch(/^\/(?!\/)/);
        expect(url.endsWith('/')).toBe(true);
        expect(url).not.toMatch(/[?#]/);
      }
    }
    expect(plan.verification.noncanonical_or_nontrailing_url_count).toBe(0);
  });

  it('carries existing route evidence for every pillar target', () => {
    for (const row of plan.rows) {
      expect(row.pillar_link.route_evidence).toMatch(/^src\/pages\/.+\.astro(?:#.+)?$/);
    }
    expect(new Set(plan.rows.map((row) => row.pillar_link.url))).toHaveLength(9);
  });

  it('selects a stage-appropriate primary CTA and retains intent/stage evidence', () => {
    for (const row of plan.rows) {
      const expectedUrl = row.funnel_stage === 'education' ? '/free-guide/' : '/book/';
      expect(row.primary_cta.url).toBe(expectedUrl);
      expect(row.primary_cta.assignment_basis).toMatch(new RegExp(`^${row.funnel_stage}:[a-z-]+$`));
      expect(row.primary_cta.approved_route_evidence).toMatch(/^src\/pages\/.+\.astro$/);
    }
    expect(plan.distributions.by_primary_cta_url).toEqual({
      '/book/': 625,
      '/free-guide/': 375,
    });
    expect(plan.verification.primary_cta_planned_count).toBe(1000);
  });

  it('gives every row an explicit appointment CTA and education a secondary handoff', () => {
    for (const row of plan.rows) {
      expect(row.appointment_cta.url).toBe('/book/');
      expect(row.appointment_cta.label.length).toBeGreaterThan(10);
      expect(row.appointment_cta.name).toMatch(/^mrx1000-[a-z0-9-]+-book_review-/);
      expect(row.appointment_cta.placement_guidance.length).toBeGreaterThan(30);
      expect(row.appointment_cta.approved_route_evidence).toBe('src/pages/book.astro');
      expect(row.appointment_cta.status).toBe('planned_local_only');
      if (row.funnel_stage === 'education') {
        expect(row.appointment_cta.distinct_from_primary_cta).toBe(true);
        expect(row.appointment_cta.role).toBe('secondary_appointment_after_primary_nurture');
        expect(row.appointment_cta.placement_code).toBe('closing_team_handoff');
      } else {
        expect(row.appointment_cta.distinct_from_primary_cta).toBe(false);
        expect(row.appointment_cta.role).toBe('same_as_primary_appointment');
        expect(row.appointment_cta.name).toBe(row.primary_cta.name);
      }
    }
    expect(plan.distributions.by_appointment_cta_url).toEqual({ '/book/': 1000 });
    expect(plan.verification.appointment_cta_planned_count).toBe(1000);
    expect(plan.verification.appointment_cta_book_url_count).toBe(1000);
    expect(plan.verification.primary_appointment_cta_count).toBe(625);
    expect(plan.verification.secondary_appointment_cta_count).toBe(375);
  });

  it('provides primary CTA label, controlled name, and placement guidance on every row', () => {
    for (const row of plan.rows) {
      expect(row.primary_cta.label.length).toBeGreaterThan(10);
      expect(row.primary_cta.name).toMatch(/^mrx1000-[a-z0-9-]+-(book_review|free_guide)-/);
      expect(['mid_article', 'contextual_inline', 'closing_panel']).toContain(
        row.primary_cta.placement_code,
      );
      expect(row.primary_cta.placement_guidance.length).toBeGreaterThan(30);
    }
  });

  it('separates planning from rendered/live evidence without overclaiming', () => {
    expect(plan.verification.planned_complete_triangle_count).toBe(1000);
    expect(plan.verification.primary_cta_planned_count).toBe(1000);
    expect(plan.verification.appointment_cta_planned_count).toBe(1000);
    expect(plan.verification.rendered_triangle_verified_count).toBe(0);
    expect(plan.verification.live_triangle_verified_count).toBe(0);
    for (const row of plan.rows) {
      expect(row.pillar_link.status).toBe('planned_local_only');
      expect(row.sibling_link.status).toBe('planned_local_only');
      expect(row.primary_cta.status).toBe('planned_local_only');
      expect(row.appointment_cta.status).toBe('planned_local_only');
      expect(row.evidence.triangle_plan_status).toBe('planned_complete');
      expect(row.evidence.primary_cta_plan_status).toBe('planned_complete');
      expect(row.evidence.appointment_cta_plan_status).toBe('planned_complete');
      expect(row.evidence.rendered_triangle_verified).toBe(false);
      expect(row.evidence.live_triangle_verified).toBe(false);
    }
  });

  it('preserves source-publication evidence while removing numerical release blockers', () => {
    expect(plan.distributions.by_source_preservation_classification).toEqual({
      incumbent_draft_nonpublic_held: 84,
      live_public_published_route: 44,
      pilot_draft_noindex_stage: 25,
      planning_only_inventory: 847,
    });
    expect(plan.rows.filter((row) => row.source_route_live)).toHaveLength(44);
    expect(plan.inputs.owner_decision.numerical_release_cap_applies).toBe(false);
    expect(plan.inputs.owner_decision.elapsed_time_gate_applies).toBe(false);
    expect(plan.inputs.owner_decision.spend_authorized).toBe(false);
    expect(plan.inputs.owner_decision.publication_authorized).toBe(true);
    expect(plan.policy.numerical_release_cap_applies).toBe(false);
    expect(plan.rows.every((row) => row.evidence.numerical_release_cap_applies === false)).toBe(
      true,
    );
    expect(
      plan.rows
        .filter((row) => row.source_route_live)
        .every(
          (row) => row.evidence.release_status === 'released_under_d16_continuous_quality_gate',
        ),
    ).toBe(true);
    expect(
      plan.rows
        .filter((row) => !row.source_route_live)
        .every(
          (row) =>
            row.evidence.release_status ===
            'eligible_for_continuous_quality_review_not_yet_cleared',
        ),
    ).toBe(true);
  });

  it('is byte-deterministic entirely in memory', () => {
    const rerun = buildActivationPlan(structuredClone(ledger), ownerDecisionText) as Plan;
    expect(`${JSON.stringify(rerun, null, 2)}\n`).toBe(expectedJson);
    expect(renderCsv(rerun)).toBe(expectedCsv);
    expect(renderReport(rerun)).toBe(expectedReport);
    expect(rerun.content_fingerprint_sha256).toBe(plan.content_fingerprint_sha256);
  });
});
