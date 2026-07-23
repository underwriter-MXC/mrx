/**
 * tests/unit/check-mrx1000-release-gates.spec.ts
 *
 * Vitest pin for the script-level invariants of
 * scripts/check-mrx1000-release-gates.mjs and
 * scripts/build-mrx1000-release-10-evidence-packets.mjs.
 *
 * These tests cover the parts that the script itself enforces but the
 * pure-function release-lifecycle.ts module cannot:
 *
 *   - the script writes both the JSON and the Markdown report and exits
 *     non-zero when the canonical gate surfaces blocking findings;
 *   - the script surfaces the user-approved scale-gate thresholds (80%
 *     index coverage for 10->25 / 25->50; \u226560% non-branded impressions
 *     for continuing 50-article batches) as registered thresholds;
 *   - the script honors --strict and --require-pass-on-articles;
 *   - the evidence-packets script never inverts HOLD to PASS without a
 *     durable signed review-artifact file whose hashes match
 *     bytes-under-review; defaults every disposition to HOLD on a clean
 *     tree.
 *
 * The tests run the .mjs scripts directly under Node so they catch any
 * regression in the scripts themselves (not only in the modules they
 * import). The scripts are exercised against the project's real
 * config + evidence + decision + ledger inputs and the synthetic
 * alternatives we build in tmp.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const repoRoot = resolve(__dirname, '..', '..');

function sha256Hex(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function runNode(args: string[], opts: { env?: Record<string, string>; cwd?: string } = {}) {
  return spawnSync('node', args, {
    cwd: opts.cwd ?? repoRoot,
    env: { ...process.env, ...(opts.env ?? {}) } as NodeJS.ProcessEnv,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function runScript(
  scriptRelPath: string,
  args: string[],
  opts: Parameters<typeof runNode>[1] = {},
) {
  const script = join(repoRoot, scriptRelPath);
  if (!existsSync(script)) {
    throw new Error(`Script not found: ${script}`);
  }
  return runNode([script, ...args], opts);
}

interface CheckRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  jsonPath: string;
  mdPath: string;
  payload: Record<string, unknown>;
}

function runCheckAndRead(args: string[] = []): CheckRunResult {
  const result = runScript('scripts/check-mrx1000-release-gates.mjs', args);
  const outDir = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle');
  const jsonPath = join(outDir, 'check-gates.json');
  const mdPath = join(outDir, 'check-gates.md');
  const payload = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : {};
  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    jsonPath,
    mdPath,
    payload: payload as Record<string, unknown>,
  };
}

describe('scripts/build-mrx1000-release-10-evidence-packets.mjs', () => {
  let workTree: string | null = null;

  beforeEach(() => {
    workTree = mkdtempSync(join(tmpdir(), 'mrx-packet-'));
  });

  afterEach(() => {
    if (workTree && existsSync(workTree)) {
      rmSync(workTree, { recursive: true, force: true });
      workTree = null;
    }
  });

  function makeTree(opts: { withReviewArtifact?: boolean; bodyOverrideBytes?: Buffer } = {}) {
    const tree = workTree!;
    mkdirSync(join(tree, 'config'), { recursive: true });
    mkdirSync(join(tree, 'src/content/posts'), { recursive: true });
    mkdirSync(join(tree, 'artifacts/mrx1000-release-10/evidence'), { recursive: true });
    mkdirSync(join(tree, 'artifacts/mrx1000-release-10/decisions'), { recursive: true });
    mkdirSync(join(tree, 'artifacts/mrx1000-release-10/assets'), { recursive: true });
    mkdirSync(join(tree, 'artifacts/mrx1000-release-10/release'), { recursive: true });
    mkdirSync(join(tree, 'artifacts/mrx1000-release-10/reviews/raw'), { recursive: true });
    mkdirSync(join(tree, 'reports'), { recursive: true });
    const bodyPath = 'src/content/posts/sample-article.mdx';
    const body = Buffer.from(
      `---\ntitle: Sample\npublication_status: published\ncanonical_slug: sample-article\n---\n\n# sample\n`,
      'utf8',
    );
    const bodyOverride = opts.bodyOverrideBytes ?? body;
    writeFileSync(join(tree, bodyPath), bodyOverride);
    const bodySha = sha256Hex(bodyOverride);
    const frontmatterBlock = bodyOverride.toString('utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fmSha = sha256Hex(Buffer.from((frontmatterBlock?.[1] ?? '') + '\n', 'utf8'));
    const assetEvidence = {
      rows: [
        {
          program_row_id: 'MRX1000-TEST-1',
          slug: 'sample-article',
          title: 'Sample',
          body_sha256: bodySha,
          frontmatter_sha256: fmSha,
          disposition: 'PASS',
          assets: [
            { kind: 'hero', disposition: 'PASS' },
            { kind: 'social', disposition: 'PASS' },
          ],
        },
      ],
    };
    const assetText = JSON.stringify(assetEvidence, null, 2) + '\n';
    const assetPath = join(tree, 'artifacts/mrx1000-release-10/assets/asset-evidence.json');
    writeFileSync(assetPath, assetText);
    writeFileSync(`${assetPath}.sha256`, `${sha256Hex(assetText)}  asset-evidence.json\n`);
    const publicationManifest = {
      rows: [
        {
          program_row_id: 'MRX1000-TEST-1',
          slug: 'sample-article',
          title: 'Sample',
          canonical_url: 'https://mineralrightsxchange.com/blog/sample-article/',
          source_path: bodyPath,
          body_sha256: bodySha,
          frontmatter_sha256: fmSha,
          asset_evidence_sha256: sha256Hex(assetText),
          expected_targets: ['test-production'],
          rollback_reference: 'rollback:sample-article',
          release_owner: 'test-release-owner',
          disposition: 'READY',
        },
      ],
    };
    const publicationText = JSON.stringify(publicationManifest, null, 2) + '\n';
    const publicationPath = join(
      tree,
      'artifacts/mrx1000-release-10/release/publication-manifest.json',
    );
    writeFileSync(publicationPath, publicationText);
    writeFileSync(
      `${publicationPath}.sha256`,
      `${sha256Hex(publicationText)}  publication-manifest.json\n`,
    );
    writeFileSync(
      join(tree, 'config/mrx1000-release-10-batch.json'),
      JSON.stringify(
        {
          evidence_scaffold_generated_at_utc: '2026-07-22T06:09:40Z',
          decision_authority: {
            successor_gate_decision_path: 'artifacts/mrx1000-release-10/decisions/x.md',
            successor_gate_decision_sha256: '0'.repeat(64),
          },
          policy: {
            authorization_cap_released_articles: 1,
            fail_closed: true,
            earned_scale_gates: [],
          },
          articles: [
            {
              program_row_id: 'MRX1000-TEST-1',
              slug: 'sample-article',
              title: 'Sample',
              canonical_url: 'https://mineralrightsxchange.com/blog/sample-article/',
              pillar: 'p',
              cluster: 'texas-county-basin-local-intent',
              evidence_packet_path: 'artifacts/mrx1000-release-10/evidence/sample-article.json',
              evidence_packet_path_required: true,
              repo_path: bodyPath,
              repo_sha256: bodySha,
            },
          ],
        },
        null,
        2,
      ),
    );

    if (opts.withReviewArtifact) {
      const reviewPasses = ['editorial', 'factual_citation', 'compliance'].map((capability) => {
        const outputPath = `artifacts/mrx1000-release-10/reviews/raw/${capability}.json`;
        const outputText = JSON.stringify({ capability, verdict: 'PASS' }) + '\n';
        writeFileSync(join(tree, outputPath), outputText);
        return {
          reviewer_id: `${capability}-1`,
          capability,
          disposition: 'PASS',
          reviewed_at: '2026-07-21T12:00:00Z',
          input_body_sha256: bodySha,
          input_frontmatter_sha256: fmSha,
          output_artifact_path: outputPath,
          output_artifact_sha256: sha256Hex(outputText),
          findings: [`${capability} checks completed`],
        };
      });
      const reviewArtifact = {
        program_row_id: 'MRX1000-TEST-1',
        slug: 'sample-article',
        title: 'Sample',
        canonical_url: 'https://mineralrightsxchange.com/blog/sample-article/',
        reviewers: [
          {
            id: 'editor-1',
            capability: 'editorial',
            verdict: 'PASS',
            reviewed_at: '2026-07-21',
            findings_ref: 'editor-1.md',
            review_run_id: 'run-editor-1',
          },
          {
            id: 'factual-1',
            capability: 'factual_citation',
            verdict: 'PASS',
            reviewed_at: '2026-07-21',
            findings_ref: 'factual-1.md',
            review_run_id: 'run-factual-1',
          },
          {
            id: 'compliance-1',
            capability: 'compliance',
            verdict: 'PASS',
            reviewed_at: '2026-07-21',
            findings_ref: 'compliance-1.md',
            review_run_id: 'run-compliance-1',
          },
        ],
        passes: {
          editorial: 'PASS',
          factual_citation: 'PASS',
          compliance: 'PASS',
        },
        body_sha256: bodySha,
        frontmatter_sha256: fmSha,
        claim_to_source: [
          {
            claim: 'numeric claim about RRC data',
            source_url: 'https://www.rrc.texas.gov/example',
            accessed_at: '2026-07-21',
          },
          {
            claim: 'price-series context',
            source_url: 'https://www.eia.gov/example',
            accessed_at: '2026-07-21',
          },
        ],
        findings: [
          { reviewer_id: 'editor-1', severity: 'info', note: 'answer-first verified' },
          { reviewer_id: 'factual-1', severity: 'info', note: 'claim mapped to source URL' },
          {
            reviewer_id: 'compliance-1',
            severity: 'info',
            note: 'disclaimer present, no valuation claim',
          },
        ],
        review_manifest: reviewPasses,
        compliance_checklist: { disposition: 'PASS', checks: ['no guarantees'] },
        seo_aeo_checklist: { disposition: 'PASS', checks: ['answer-first'] },
      };
      const finalText = JSON.stringify(reviewArtifact, null, 2) + '\n';
      const reviewPath = join(
        tree,
        'artifacts/mrx1000-release-10/evidence/sample-article.json.review.json',
      );
      writeFileSync(reviewPath, finalText);
      writeFileSync(
        `${reviewPath}.sha256`,
        `${sha256Hex(Buffer.from(finalText, 'utf8'))}  sample-article.json.review.json\n`,
      );
    }

    return { tree, bodySha, fmSha };
  }

  it('defaults every disposition to HOLD when no review artifact is present', () => {
    const { tree } = makeTree();
    const r = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(r.status).toBe(0);
    const packetPath = join(tree, 'artifacts/mrx1000-release-10/evidence/sample-article.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    expect(packet.editorial_disposition).toBe('HOLD');
    expect(packet.factual_citation_disposition).toBe('HOLD');
    expect(packet.compliance_disposition).toBe('HOLD');
    expect(packet.reviewers).toEqual([]);
    expect(packet.hold_reason).toBe('no_review_artifact_file');
    expect(packet.body_sha256_matches_declared).toBe(true);
  });

  it('refuses to promote to PASS when the review artifact body_sha256 mismatches the bytes under review', () => {
    const { tree } = makeTree({ withReviewArtifact: true });
    writeFileSync(
      join(tree, 'src/content/posts/sample-article.mdx'),
      Buffer.from(
        '---\ntitle: Sample\npublication_status: published\ncanonical_slug: sample-article\n---\n\n# sample-edited\n',
        'utf8',
      ),
    );
    const r = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(r.status).toBe(0);
    const packetPath = join(tree, 'artifacts/mrx1000-release-10/evidence/sample-article.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    expect(packet.editorial_disposition).toBe('HOLD');
    expect(packet.factual_citation_disposition).toBe('HOLD');
    expect(packet.compliance_disposition).toBe('HOLD');
    expect(packet.body_sha256_matches_declared).toBe(false);
    expect(packet.reviewers).toEqual([]);
    expect(packet.hold_reason).toBe('review_artifact_body_sha256_mismatch');
  });

  it('promotes to PASS only when a sidecar-verified, hash-matched review artifact covers editorial, factual_citation, and compliance', () => {
    const { tree } = makeTree({ withReviewArtifact: true });
    const r = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(r.status).toBe(0);
    const packetPath = join(tree, 'artifacts/mrx1000-release-10/evidence/sample-article.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    expect(packet.editorial_disposition).toBe('PASS');
    expect(packet.factual_citation_disposition).toBe('PASS');
    expect(packet.compliance_disposition).toBe('PASS');
    expect(packet.reviewers).toHaveLength(3);
    const caps = new Set(packet.reviewers.map((r: { capability: string }) => r.capability));
    expect(caps.has('editorial')).toBe(true);
    expect(caps.has('factual_citation')).toBe(true);
    expect(caps.has('compliance')).toBe(true);
    expect(packet.review_artifact_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces byte-identical HOLD packets and manifests on unchanged reruns', () => {
    const { tree } = makeTree();
    const first = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(first.status).toBe(0);
    const packetPath = join(tree, 'artifacts/mrx1000-release-10/evidence/sample-article.json');
    const manifestPath = join(tree, 'artifacts/mrx1000-release-10/evidence/_manifest.json');
    const packetFirst = readFileSync(packetPath);
    const manifestFirst = readFileSync(manifestPath);
    const second = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(second.status).toBe(0);
    expect(readFileSync(packetPath).equals(packetFirst)).toBe(true);
    expect(readFileSync(manifestPath).equals(manifestFirst)).toBe(true);
  });
});

describe('scripts/check-mrx1000-release-gates.mjs', () => {
  beforeEach(() => {
    // Wipe any leftover side-effects between tests.
    const outDir = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle');
    if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  });

  it('writes JSON+MD reports and passes the exact authorized 10 after final approval', () => {
    const r = runCheckAndRead();
    expect(existsSync(r.jsonPath)).toBe(true);
    expect(existsSync(r.mdPath)).toBe(true);
    expect(r.exitCode).toBe(0);
    const blocking = (r.payload.blocking_findings as string[]) || [];
    expect(blocking).toEqual([]);
    const evidence = r.payload.evidence as {
      packets_required: number;
      packets_passing: number;
      packets_failing: number;
    };
    expect(evidence).toMatchObject({
      packets_required: 10,
      packets_passing: 10,
      packets_failing: 0,
    });
    const informational = (r.payload.informational_findings as string[]) || [];
    expect(informational.some((f) => f.includes('Future earned scale-gate'))).toBe(true);
  });

  it('surfaces the cap and observed_release_total from the authorized batch', () => {
    const r = runCheckAndRead();
    const cap = r.payload.cap as {
      authorized_release_total: number;
      observed_release_total: number;
    };
    expect(cap.authorized_release_total).toBe(10);
    // The exact ten sources are publication-shaped so the final review hashes
    // cover deployed bytes. They count against the cap, while the decision and
    // evidence gates below still prevent any production release.
    expect(cap.observed_release_total).toBe(10);
    const policy = r.payload.policy as Record<string, unknown>;
    expect(policy.authorization_decision_disposition).toBe('APPROVED');
    expect(policy.release_authorized).toBe(true);
    expect(policy.index_authorized).toBe(true);
  });

  it('lists user-approved thresholds (80% index coverage; \u226560% non-branded impressions)', () => {
    const r = runCheckAndRead();
    const thresholds = r.payload.inputs
      ? (r.payload.inputs as Record<string, unknown>).user_approved_thresholds
      : [];
    expect(Array.isArray(thresholds)).toBe(true);
    const arr = thresholds as Array<{ threshold: string; value: number }>;
    const index80 = arr.find((t) => t.threshold === 'minimum_index_coverage_pct_within_window');
    expect(index80?.value).toBe(80);
    const nonBranded = arr.find(
      (t) => t.threshold === 'minimum_non_branded_impressions_pct_within_window',
    );
    expect(nonBranded?.value).toBe(60);
  });

  it('--require-pass-on-articles accepts an authorized packet only when it is PASS', () => {
    const slug =
      'texas-railroad-commission-how-to-use-public-records-to-understand-your-mineral-rights';
    const r = runCheckAndRead([`--require-pass-on-articles=${slug}`]);
    expect(r.exitCode).toBe(0);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((f) => f.includes(slug) && f.includes('not PASS'))).toBe(false);
  });

  it('--strict mode demotes informational findings into blocking findings', () => {
    const r = runCheckAndRead(['--strict']);
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((f) => f.startsWith('[strict]'))).toBe(true);
  });

  it('reports but does not use a missing future scale decision as a current-cap blocker', () => {
    const obs = join(tmpdir(), `mrx-obs-${Date.now()}.json`);
    writeFileSync(
      obs,
      JSON.stringify({
        '10_to_25': {
          observation_window_days_observed: 30,
          index_coverage_pct_observed: 92,
          index_coverage_window_days_observed: 28,
          independent_audit_sample_size: 5,
          high_risk_legal_tax_valuation_articles_in_audit: 1,
          high_risk_legal_tax_valuation_articles_in_population: 1,
          open_critical_or_high_findings: 0,
          rollback_evidence_present: true,
          batch_retrospective_present: true,
          no_repeated_systemic_defect: true,
        },
        '25_to_50': {},
      }),
    );
    const r = runCheckAndRead([`--observations=${obs}`]);
    expect(r.exitCode).toBe(0);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((f) => f.includes('signed D-2026-0721-22'))).toBe(false);
    const informational = r.payload.informational_findings as string[];
    expect(informational.some((f) => f.includes('signed D-2026-0721-22'))).toBe(true);
    rmSync(obs, { force: true });
  });

  it('never lowers the cap or overwrites the authorized batch', () => {
    const r = runCheckAndRead();
    const cap = r.payload.cap as { authorized_release_total: number };
    expect(cap.authorized_release_total).toBe(10);
  });
});
