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
 *   - the script preserves the historical exact-25 bindings while accepting
 *     later rows only through continuous, quality-gated admission;
 *   - the owner directive removes article-count, observation-window, and
 *     missing cap-lift-decision blockers without weakening quality evidence;
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
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { analyzeControlledPublicationTransition } from '../../scripts/_mrx1000-controlled-publication-transition.mjs';

const repoRoot = resolve(__dirname, '..', '..');

function sha256Hex(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function runNode(args: string[], opts: { env?: Record<string, string>; cwd?: string } = {}) {
  return spawnSync(process.execPath, args, {
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

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortDeep((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function exactSlateSha(rows: unknown[]): string {
  return sha256Hex(JSON.stringify(sortDeep(rows)));
}

function runTamperedExactGate(
  mutate: (batch: Record<string, any>) => void,
  opts: { mutateGscJson?: (receipt: Record<string, any>) => void } = {},
): CheckRunResult {
  const tree = mkdtempSync(join(tmpdir(), 'mrx-exact-gate-'));
  try {
    mkdirSync(join(tree, 'config'), { recursive: true });
    mkdirSync(join(tree, 'reports'), { recursive: true });
    mkdirSync(join(tree, 'reports', 'mrx1000-release-10-lifecycle'), { recursive: true });
    symlinkSync(join(repoRoot, 'src'), join(tree, 'src'), 'dir');
    symlinkSync(join(repoRoot, 'artifacts'), join(tree, 'artifacts'), 'dir');
    symlinkSync(join(repoRoot, 'docs'), join(tree, 'docs'), 'dir');
    if (existsSync(join(repoRoot, 'dist'))) {
      symlinkSync(join(repoRoot, 'dist'), join(tree, 'dist'), 'dir');
    }
    symlinkSync(
      join(repoRoot, 'config', 'mrx-1000-canonical-content-ledger.json'),
      join(tree, 'config', 'mrx-1000-canonical-content-ledger.json'),
      'file',
    );
    for (const name of [
      'mrx1000-wave2-pre-release-qa.json',
      'mrx1000-wave2-pre-release-qa.json.sha256',
      'mrx1000-wave2-pre-release-qa.md',
      'mrx1000-wave2-pre-release-qa.md.sha256',
      'mrx1000-wave2-release-manifest-20260801T003929Z.json',
      'mrx1000-wave2-release-manifest-20260801T003929Z.json.sha256',
      'mrx1000-wave2-rollback-packet-20260801T003929Z.json',
      'mrx1000-wave2-rollback-packet-20260801T003929Z.json.sha256',
      'mrx1000-wave2-final2-gates.log',
      'mrx1000-wave2-final2-gates.log.sha256',
      'mrx1000-wave2-creative-revalidate-9x8-20260801T021210Z',
    ]) {
      const source = join(repoRoot, 'reports', name);
      if (existsSync(source)) {
        symlinkSync(source, join(tree, 'reports', name), name.includes('.') ? 'file' : 'dir');
      }
    }
    for (const name of [
      'gsc-url-inspection-2026-07-31.json',
      'gsc-url-inspection-2026-07-31.json.sha256',
      'gsc-url-inspection-2026-07-31.md',
      'gsc-url-inspection-2026-07-31.md.sha256',
    ]) {
      const source = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle', name);
      const target = join(tree, 'reports', 'mrx1000-release-10-lifecycle', name);
      if (!existsSync(source)) continue;
      if (name === 'gsc-url-inspection-2026-07-31.json' && opts.mutateGscJson) {
        const receipt = JSON.parse(readFileSync(source, 'utf8'));
        opts.mutateGscJson(receipt);
        const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
        writeFileSync(target, bytes);
        writeFileSync(`${target}.sha256`, `${sha256Hex(bytes)}  ${name}\n`);
        continue;
      }
      if (name === 'gsc-url-inspection-2026-07-31.json.sha256' && opts.mutateGscJson) {
        continue;
      }
      symlinkSync(source, target, 'file');
    }
    const batch = JSON.parse(
      readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
    );
    mutate(batch);
    batch.policy.exact_admitted_slate_sha256 = exactSlateSha(batch.articles);
    writeFileSync(
      join(tree, 'config', 'mrx1000-release-10-batch.json'),
      `${JSON.stringify(batch, null, 2)}\n`,
    );
    const result = runScript('scripts/check-mrx1000-release-gates.mjs', [
      `--tree=${tree}`,
      '--expected-decision-sha=d78eba9cd8ce17b50a70331f6c5a3cb3bd4f4537f7c2ea9d3d0084fc6c1562c7',
    ]);
    const jsonPath = join(tree, 'reports', 'mrx1000-release-10-lifecycle', 'check-gates.json');
    const mdPath = join(tree, 'reports', 'mrx1000-release-10-lifecycle', 'check-gates.md');
    if (!existsSync(jsonPath)) {
      throw new Error(
        `Tampered gate did not write its report (exit=${result.status}). stdout=${result.stdout} stderr=${result.stderr}`,
      );
    }
    return {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      jsonPath,
      mdPath,
      payload: JSON.parse(readFileSync(jsonPath, 'utf8')),
    };
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
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

  function makeTree(
    opts: {
      withReviewArtifact?: boolean;
      bodyOverrideBytes?: Buffer;
      controlledTransition?: boolean;
    } = {},
  ) {
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
      `---\ntitle: Sample\ndraft: false\npublication_status: published\nnoindex: false\ncanonical_slug: sample-article\n---\n\n# sample\n`,
      'utf8',
    );
    const bodyOverride = opts.bodyOverrideBytes ?? body;
    const reviewedBody = opts.controlledTransition
      ? Buffer.from(
          bodyOverride
            .toString('utf8')
            .replace('publication_status: published', 'publication_status: draft')
            .replace('noindex: false', 'noindex: true'),
          'utf8',
        )
      : bodyOverride;
    writeFileSync(join(tree, bodyPath), bodyOverride);
    const bodySha = sha256Hex(bodyOverride);
    const frontmatterBlock = bodyOverride.toString('utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fmSha = sha256Hex(Buffer.from((frontmatterBlock?.[1] ?? '') + '\n', 'utf8'));
    const reviewedSha = sha256Hex(reviewedBody);
    const reviewedFrontmatterBlock = reviewedBody
      .toString('utf8')
      .match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const reviewedFmSha = sha256Hex(
      Buffer.from((reviewedFrontmatterBlock?.[1] ?? '') + '\n', 'utf8'),
    );
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
              repo_sha256: reviewedSha,
              ...(opts.controlledTransition
                ? {
                    article_sha256: reviewedSha,
                    admission_status: 'admitted_exact',
                    finalization_state: 'draft_noindex_admitted',
                  }
                : {}),
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
          input_body_sha256: reviewedSha,
          input_frontmatter_sha256: reviewedFmSha,
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
        current_body_sha256: bodySha,
        current_frontmatter_sha256: fmSha,
        reviewed_body_sha256: reviewedSha,
        reviewed_frontmatter_sha256: reviewedFmSha,
        controlled_publication_transition: analyzeControlledPublicationTransition(bodyOverride, {
          repo_sha256: reviewedSha,
          ...(opts.controlledTransition
            ? {
                article_sha256: reviewedSha,
                admission_status: 'admitted_exact',
                finalization_state: 'draft_noindex_admitted',
              }
            : {}),
        }),
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

    return { tree, bodySha, fmSha, reviewedSha, reviewedFmSha };
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

  it('preserves PASS after the exact byte-proven publication_status/noindex transition', () => {
    const { tree, bodySha, reviewedSha } = makeTree({
      withReviewArtifact: true,
      controlledTransition: true,
    });
    const r = runScript(
      'scripts/build-mrx1000-release-10-evidence-packets.mjs',
      [`--tree=${tree}`],
      { cwd: tree },
    );
    expect(r.status).toBe(0);
    const packetPath = join(tree, 'artifacts/mrx1000-release-10/evidence/sample-article.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    expect(packet.editorial_disposition).toBe('PASS');
    expect(packet.body_sha256).toBe(bodySha);
    expect(packet.reviewed_body_sha256_declared).toBe(reviewedSha);
    expect(packet.body_sha256_matches_declared).toBe(false);
    expect(packet.body_sha256_matches_declared_or_authorized_transition).toBe(true);
    expect(packet.controlled_publication_transition.state).toBe(
      'controlled_publication_transition',
    );
    expect(packet.controlled_publication_transition.normalized_body_sha256).toBe(reviewedSha);
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
    // Wipe only the check-gates outputs between tests; keep bound lifecycle
    // evidence fixtures (for example the GSC inspection receipts) intact.
    const outDir = join(repoRoot, 'reports', 'mrx1000-release-10-lifecycle');
    for (const filename of [
      'check-gates.json',
      'check-gates.json.sha256',
      'check-gates.md',
      'check-gates.md.sha256',
    ]) {
      const path = join(outDir, filename);
      if (existsSync(path)) rmSync(path, { force: true });
    }
  });

  it('writes JSON+MD reports and passes all 60 continuously admitted rows after final approval', () => {
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
      packets_required: 60,
      packets_passing: 60,
      packets_failing: 0,
    });
    const informational = (r.payload.informational_findings as string[]) || [];
    expect(informational.some((f) => f.includes('Numerical scale gates are superseded'))).toBe(
      true,
    );
  });

  it('treats 1,000 as program scope and observes the 60 quality-cleared public rows', () => {
    const r = runCheckAndRead();
    const cap = r.payload.cap as {
      authorized_release_total: number;
      observed_release_total: number;
    };
    expect(cap.authorized_release_total).toBe(1000);
    expect(cap.observed_release_total).toBe(60);
    const inputs = r.payload.inputs as {
      ledger: { runtime_publication_overrides: unknown[] };
    };
    expect(inputs.ledger.runtime_publication_overrides).toHaveLength(50);
    const policy = r.payload.policy as Record<string, unknown>;
    expect(policy.authorization_decision_disposition).toBe('APPROVED');
    expect(policy.release_authorized).toBe(true);
    expect(policy.index_authorized).toBe(true);
  });

  it('does not register numerical scale thresholds after the owner supersession', () => {
    const r = runCheckAndRead();
    const thresholds = r.payload.inputs
      ? (r.payload.inputs as Record<string, unknown>).user_approved_thresholds
      : [];
    expect(thresholds).toEqual([]);
  });

  it('--require-pass-on-articles accepts an authorized packet only when it is PASS', () => {
    const slug =
      'texas-railroad-commission-how-to-use-public-records-to-understand-your-mineral-rights';
    const r = runCheckAndRead([`--require-pass-on-articles=${slug}`]);
    expect(r.exitCode).toBe(0);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((f) => f.includes(slug) && f.includes('not PASS'))).toBe(false);
  });

  it('--expected-decision-sha keeps the historical admission binding intact during continuous additions', () => {
    const r = runCheckAndRead([
      '--expected-decision-sha=d78eba9cd8ce17b50a70331f6c5a3cb3bd4f4537f7c2ea9d3d0084fc6c1562c7',
    ]);
    expect(r.exitCode).toBe(0);
    const blocking = (r.payload.blocking_findings as string[]) || [];
    expect(
      blocking.some((f) => f.includes('Batch-admission decision SHA-256 does not match')),
    ).toBe(false);
    const exact = ((r.payload.inputs as Record<string, unknown>).exact_admission ?? {}) as Record<
      string,
      unknown
    >;
    expect((exact.configured_exact_count as number) ?? 0).toBe(60);
    expect(exact.admission_mode).toBe('continuous_quality_gated');
  });

  it('fails closed when the retained production baseline manifest binding is stale', () => {
    const r = runTamperedExactGate((batch) => {
      batch.release_evidence_bindings.retained_production_baseline_manifest_json.sha256 =
        '0'.repeat(64);
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(
      blocking.some((finding) =>
        finding.includes(
          'Bound release evidence SHA-256 mismatch for retained_production_baseline_manifest_json',
        ),
      ),
    ).toBe(true);
  });

  it('fails closed when all mandatory GSC recovery authority and receipt bindings are omitted', () => {
    const r = runTamperedExactGate((batch) => {
      delete batch.decision_authority.batch_admission_gsc_recovery_addendum_id;
      delete batch.decision_authority.batch_admission_gsc_recovery_addendum_path;
      delete batch.decision_authority.batch_admission_gsc_recovery_addendum_sha256;
      delete batch.release_evidence_bindings.gsc_url_inspection_json;
      delete batch.release_evidence_bindings.gsc_url_inspection_md;
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((finding) => finding.includes('requires GSC recovery addendum ID'))).toBe(
      true,
    );
    expect(
      blocking.some((finding) =>
        finding.includes(
          'Missing required exact-admission release evidence binding: gsc_url_inspection_json',
        ),
      ),
    ).toBe(true);
  });

  it('fails closed when one mandatory GSC receipt binding is omitted', () => {
    const r = runTamperedExactGate((batch) => {
      delete batch.release_evidence_bindings.gsc_url_inspection_md;
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(
      blocking.some((finding) =>
        finding.includes(
          'Missing required exact-admission release evidence binding: gsc_url_inspection_md',
        ),
      ),
    ).toBe(true);
    expect(
      blocking.some((finding) =>
        finding.includes('GSC replacement receipt markdown SHA-256 binding is missing'),
      ),
    ).toBe(true);
  });

  it('binds GSC receipt rows to the immutable pre-edit identity and order', () => {
    const r = runTamperedExactGate(() => {}, {
      mutateGscJson: (receipt) => {
        [receipt.records[0], receipt.records[1]] = [receipt.records[1], receipt.records[0]];
      },
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(
      blocking.some((finding) =>
        finding.includes('GSC replacement receipt immutable row identity/order mismatch at rank 1'),
      ),
    ).toBe(true);
  });

  it('rejects substituted GSC receipt row identity', () => {
    const r = runTamperedExactGate(() => {}, {
      mutateGscJson: (receipt) => {
        receipt.records[0].program_row_id = 'MRX1000-9999';
      },
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(
      blocking.some((finding) =>
        finding.includes('GSC replacement receipt immutable row identity/order mismatch at rank 1'),
      ),
    ).toBe(true);
  });

  it('rejects bad GSC HTTPS, fetch, robots, and canonical evidence', () => {
    const r = runTamperedExactGate(() => {}, {
      mutateGscJson: (receipt) => {
        receipt.records[0].https = 'no';
        receipt.records[0].page_fetch_state = 'FAILED';
        receipt.records[0].robots_txt_state = 'BLOCKED';
        receipt.records[0].google_canonical = 'https://example.com/wrong/';
        receipt.records[0].user_canonical = 'https://example.com/wrong/';
      },
    });
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((finding) => finding.includes('must prove https=yes'))).toBe(true);
    expect(
      blocking.some((finding) => finding.includes('must prove page_fetch_state=SUCCESSFUL')),
    ).toBe(true);
    expect(
      blocking.some((finding) => finding.includes('must prove robots_txt_state=ALLOWED')),
    ).toBe(true);
    expect(blocking.some((finding) => finding.includes('Google canonical mismatch'))).toBe(true);
    expect(blocking.some((finding) => finding.includes('user canonical mismatch'))).toBe(true);
  });

  it.each([
    [
      'stale decision binding',
      (batch: Record<string, any>) => {
        batch.decision_authority.batch_admission_decision_sha256 = '0'.repeat(64);
      },
      'Batch-admission decision SHA-256 mismatch',
    ],
    [
      'substituted row',
      (batch: Record<string, any>) => {
        batch.articles[10].title = `${batch.articles[10].title} Substituted`;
      },
      'Exact-admission decision binding mismatch',
    ],
    [
      'reordered rows',
      (batch: Record<string, any>) => {
        [batch.articles[10], batch.articles[11]] = [batch.articles[11], batch.articles[10]];
      },
      'Exact-admission decision binding mismatch',
    ],
    [
      'row 31 without an admitted-count update',
      (batch: Record<string, any>) => {
        batch.articles.push({ ...batch.articles[29], selection_rank: 31 });
      },
      'Exact-admission row count mismatch',
    ],
    [
      '29-row underscope',
      (batch: Record<string, any>) => {
        batch.articles.pop();
      },
      'Exact-admission row count mismatch',
    ],
  ])('rejects %s', (_name, mutate, expectedFinding) => {
    const r = runTamperedExactGate(mutate);
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((finding) => finding.includes(expectedFinding))).toBe(true);
  });

  it('--strict mode demotes informational findings into blocking findings', () => {
    const r = runCheckAndRead(['--strict']);
    expect(r.exitCode).toBe(2);
    const blocking = r.payload.blocking_findings as string[];
    expect(blocking.some((f) => f.startsWith('[strict]'))).toBe(true);
  });

  it('ignores historical scale observations because no numerical scale gates remain', () => {
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
    const inputs = r.payload.inputs as Record<string, unknown>;
    expect(inputs.user_approved_thresholds).toEqual([]);
    const informational = r.payload.informational_findings as string[];
    expect(informational.some((f) => f.includes('Numerical scale gates are superseded'))).toBe(
      true,
    );
    rmSync(obs, { force: true });
  });

  it('uses the declared 1,000-row program size instead of a staged release cap', () => {
    const r = runCheckAndRead();
    const cap = r.payload.cap as { authorized_release_total: number };
    expect(cap.authorized_release_total).toBe(1000);
  });
});
