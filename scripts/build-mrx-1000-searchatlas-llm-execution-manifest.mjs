#!/usr/bin/env node

/**
 * Build the deterministic, local-only SearchAtlas + ordered-LLM execution
 * manifest for the 1,000-row MRX canonical content program.
 *
 * This script performs no network calls and no vendor/CMS/release writes. It
 * reads already-captured evidence, assigns deterministic 25-row execution
 * batches, and keeps each row fail closed on its own identity, content, and
 * review evidence. D-2026-0804-16 removes numerical and elapsed-time blockers.
 *
 * Inputs are read-only. The existing canonical ledger and readiness matrix are
 * deliberately not modified.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectLedgerArticlesForRuntime } from './_mrx1000-runtime-publication-projection.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const PROGRAM_PLANS_ROOT = path.resolve(MRX_ROOT, '..', 'program-plans');

const CANONICAL_INPUTS = {
  ledger: path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json'),
  readiness: path.join(MRX_ROOT, 'reports/mrx-1000-readiness-matrix.json'),
  contentGeniusExport: path.join(
    MRX_ROOT,
    'reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json',
  ),
  d11: path.join(PROGRAM_PLANS_ROOT, 'mrx-1000-ceo-decision-no-spend-capacity.md'),
  ownerDecision: path.join(
    MRX_ROOT,
    'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
  ),
  claudeFramework: path.join(PROGRAM_PLANS_ROOT, 'mrx-1000-f3-claude-opus-verdict-framework.md'),
  row1Canary: path.join(
    MRX_ROOT,
    'reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md',
  ),
  pilotManifest: path.join(MRX_ROOT, 'config/mrx-1000-pilot-batch-001.json'),
  d10Row2Canary: path.join(PROGRAM_PLANS_ROOT, 'mrx-1000-ceo-decision-row2-canary-remediation.md'),
  d12Row2OrderedReview: path.join(
    PROGRAM_PLANS_ROOT,
    'mrx-1000-ceo-decision-exact-claude-gate-and-narrow-no-spend-row2-review.md',
  ),
  d14Row2SourceHashCorrection: path.join(
    PROGRAM_PLANS_ROOT,
    'mrx-1000-ceo-decision-d13-row2-source-hash-clerical-correction-supersession.md',
  ),
  d15Row2FinalRecovery: path.join(
    PROGRAM_PLANS_ROOT,
    'mrx-1000-ceo-decision-exact-row2-local-recovery-and-final-remediation.md',
  ),
};
const INPUTS = {
  ...CANONICAL_INPUTS,
  ledger: process.env.MRX1000_SEARCHATLAS_LLM_LEDGER_PATH
    ? path.resolve(process.env.MRX1000_SEARCHATLAS_LLM_LEDGER_PATH)
    : CANONICAL_INPUTS.ledger,
  readiness: process.env.MRX1000_SEARCHATLAS_LLM_READINESS_PATH
    ? path.resolve(process.env.MRX1000_SEARCHATLAS_LLM_READINESS_PATH)
    : CANONICAL_INPUTS.readiness,
};
const INPUT_EVIDENCE_PATHS = new Map([
  [path.resolve(INPUTS.ledger), CANONICAL_INPUTS.ledger],
  [path.resolve(INPUTS.readiness), CANONICAL_INPUTS.readiness],
]);

const OPTIONAL_INPUTS = {
  row2RemediatedCandidate: path.join(
    MRX_ROOT,
    '.worktrees/t_953629dc/drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx',
  ),
  row2RawVendorDraft: path.join(
    MRX_ROOT,
    '.worktrees/t_953629dc/drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.mdx',
  ),
  row2RecoveryEvidence: path.join(
    MRX_ROOT,
    '.worktrees/t_953629dc/reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md',
  ),
  row2FreshComplianceAudit: path.join(
    MRX_ROOT,
    '.worktrees/t_953629dc/reports/mrx1000-row2-remediated-fresh-post-recovery-audit-compliance.md',
  ),
  row2FreshSeoAeoAudit: path.join(
    MRX_ROOT,
    '.worktrees/t_953629dc/reports/mrx1000-055-fresh-seo-aeo-audit-after-exact-row2-recovery.md',
  ),
};

const ISOLATED_OUTPUT_DIR = process.env.MRX1000_SEARCHATLAS_LLM_OUTPUT_DIR
  ? path.resolve(process.env.MRX1000_SEARCHATLAS_LLM_OUTPUT_DIR)
  : null;
const OUTPUTS = ISOLATED_OUTPUT_DIR
  ? {
      json: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-searchatlas-llm-execution-manifest.json'),
      csv: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-searchatlas-llm-execution-manifest.csv'),
      report: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-searchatlas-llm-execution-manifest.md'),
    }
  : {
      json: path.join(MRX_ROOT, 'config/mrx-1000-searchatlas-llm-execution-manifest.json'),
      csv: path.join(MRX_ROOT, 'config/mrx-1000-searchatlas-llm-execution-manifest.csv'),
      report: path.join(MRX_ROOT, 'reports/mrx-1000-searchatlas-llm-execution-manifest.md'),
    };

const EXPECTED = {
  rowCount: 1000,
  batchSize: 25,
  batchCount: 40,
  d11Sha256: '46a9d02548e97a794d1cdaa919682bb159bcfbeabb5b9d8e559431c6ca34091d',
  d11DecisionId: 'D-2026-0720-11',
  d11Disposition: 'HOLD_ZERO_NEW_ROWS_NO_SPEND_CAPACITY_GATE',
  ownerDecisionSha256: 'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f',
  ownerDecisionId: 'D-2026-0804-16',
  ownerDecisionDisposition: 'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
  row1CanarySha256: '942490dbdaf8cbacc79b655dad967f6577cf77efb7b665184dadacf048f3bef5',
  pilotManifestSha256: 'e6922a750847b82a9c8592dcc18c0d2b12ab4addcd9eea3bd39dc8cf7dc40d2a',
  d10Row2CanarySha256: '4fd80d8f3316d06b5b8bd58d028d9c24b0fb4523c1cad0c58a9a2163dbbb6000',
  d12Row2OrderedReviewSha256: 'cf1ee52c6239465d257cafdab67715ea60ff618aefe886a06d3128a7b98d4ac1',
  d14Row2SourceHashCorrectionSha256:
    '20a57109fcc1332391f2660c6890d21f9efd861c397fceaf550630349dc9c136',
  d15Row2FinalRecoverySha256: '6390678bd9ec46d373fdc237b1e27a8f3abf7cebd2cb40b5498e2cd09af92dfd',
  row2FinalCandidateSha256: '8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d',
  row2FinalCandidateBodySha256: 'abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07',
  row2RecoveryEvidenceSha256: '13e2b8b3cd9babcef42e321a177004628759cebec9b1701a195c5c85c93dd915',
  row2FreshComplianceAuditSha256:
    '03437048d097cd95356d99c40653fe6967f8ad9f6c37e84a777404c737b2cdca',
  row2FreshSeoAeoAuditSha256: 'e4de274bccc48d4e614258fd09792c820cea3531366612187cedc4172eda6964',
  row2PreservedRawRecordedSha256:
    'fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e',
  row2PreservedRawRecordedBytes: 13698,
  vendorSnapshot: {
    total: 299,
    by_status: { NEEDS_REVIEW: 200, COMPLETED: 70, NOT_BEGUN: 29 },
  },
  rawExportCount: 297,
  canaryArtifactCount: 2,
  exactClaudeModelId: 'claude-opus-4-6',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LLM_SEQUENCE = [
  {
    order: 1,
    key: 'chatgpt',
    display_name: 'ChatGPT',
    provider: 'OpenAI',
    required_exact_model_id: null,
    exact_model_gate:
      'Capture the exact first-party model identifier before dispatch; no model was selected or executed by this local-only build.',
    additional_engine: false,
    rationale: 'First answer-engine review requested by Daryl.',
  },
  {
    order: 2,
    key: 'google_gemini',
    display_name: 'Google Gemini',
    provider: 'Google',
    required_exact_model_id: null,
    exact_model_gate:
      'Capture the exact first-party Gemini model identifier before dispatch; the machine and display labels intentionally correct the user typo "Demini".',
    additional_engine: false,
    rationale: 'Second answer-engine review requested by Daryl.',
  },
  {
    order: 3,
    key: 'claude_opus_4_6',
    display_name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    required_exact_model_id: EXPECTED.exactClaudeModelId,
    exact_model_gate:
      'Hard requirement: execute only claude-opus-4-6 in a first-party environment; never substitute a different Claude model.',
    additional_engine: false,
    rationale: 'Exact editorial/release model required by the signed MRX gate.',
  },
  {
    order: 4,
    key: 'perplexity',
    display_name: 'Perplexity',
    provider: 'Perplexity AI',
    required_exact_model_id: null,
    exact_model_gate: 'Capture the exact first-party model/product identifier before dispatch.',
    additional_engine: false,
    rationale: 'Fourth answer-engine review requested by Daryl.',
  },
  {
    order: 5,
    key: 'microsoft_copilot',
    display_name: 'Microsoft Copilot',
    provider: 'Microsoft',
    required_exact_model_id: null,
    exact_model_gate:
      'Capture the exact first-party Copilot surface and model/product identifier before dispatch.',
    additional_engine: true,
    rationale:
      'Adds a distinct Bing/Copilot answer surface after the four required reviewers without changing their order.',
  },
];

const ROW2_D12_REVIEW_SEQUENCE = [
  {
    order: 1,
    key: 'chatgpt',
    display_name: 'ChatGPT',
    provider: 'OpenAI',
    required_exact_model_id: null,
    exact_model_gate: 'Capture the exact first-party model identifier before dispatch.',
    additional_engine: false,
    rationale: 'First surface in the signed D12 row-2-only review exception.',
  },
  {
    order: 2,
    key: 'google_gemini',
    display_name: 'Google Gemini',
    provider: 'Google',
    required_exact_model_id: null,
    exact_model_gate: 'Capture the exact first-party Gemini model identifier before dispatch.',
    additional_engine: false,
    rationale: 'Second surface in the signed D12 row-2-only review exception.',
  },
  {
    order: 3,
    key: 'claude_action_time_named_model',
    display_name: 'Claude (action-time named model)',
    provider: 'Anthropic',
    required_exact_model_id: null,
    exact_model_gate:
      'D12-only substitution: immediately before send, capture the signed-in Claude surface, visible model selector, and exact offered Claude-family model ID verbatim.',
    additional_engine: false,
    rationale:
      'D12 §1A permits a currently available named Claude model only in this row-2 ordered-review lane.',
  },
  {
    order: 4,
    key: 'perplexity',
    display_name: 'Perplexity',
    provider: 'Perplexity AI',
    required_exact_model_id: null,
    exact_model_gate: 'Capture the exact first-party model/product identifier before dispatch.',
    additional_engine: false,
    rationale: 'Fourth and final surface in the signed D12 row-2-only review exception.',
  },
];

function invariant(condition, message) {
  if (!condition) throw new Error(`Invariant failed: ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readBytes(file) {
  invariant(existsSync(file), `required input missing: ${file}`);
  return readFileSync(file);
}

function readOptionalBytes(file) {
  return existsSync(file) ? readFileSync(file) : null;
}

function rel(file) {
  const evidenceFile = INPUT_EVIDENCE_PATHS.get(path.resolve(file)) ?? file;
  const value = path.relative(MRX_ROOT, evidenceFile).split(path.sep).join('/');
  return value.startsWith('.') ? value : value || '.';
}

function readinessEvidenceBytes(bytes) {
  const readiness = JSON.parse(bytes.toString('utf8'));
  invariant(
    typeof readiness.generated_at === 'string' && readiness.generated_at.length > 0,
    'readiness generated_at is missing',
  );
  readiness.generated_at = '<masked-nondeterministic-readiness-timestamp>';
  return Buffer.from(stableJson(readiness), 'utf8');
}

function normalizeRepoPath(repoPath) {
  if (!repoPath) return null;
  const normalized = String(repoPath).split('\\').join('/');
  return normalized.startsWith('mrx/') ? normalized.slice(4) : normalized;
}

function countBy(items, selector) {
  const result = {};
  for (const item of items) {
    const key = String(selector(item));
    result[key] = (result[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function unquoteYamlScalar(value) {
  const scalar = String(value || '').trim();
  if (
    (scalar.startsWith("'") && scalar.endsWith("'")) ||
    (scalar.startsWith('"') && scalar.endsWith('"'))
  ) {
    const body = scalar.slice(1, -1);
    return scalar.startsWith("'") ? body.replaceAll("''", "'") : body.replaceAll('\\"', '"');
  }
  return scalar;
}

function frontmatterScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? unquoteYamlScalar(match[1]) : null;
}

function booleanScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function numberScalar(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mdxContentEvidence(bytes, sourcePath) {
  if (!bytes) return null;
  const source = bytes.toString('utf8');
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  invariant(match, `MDX frontmatter missing: ${sourcePath}`);
  const frontmatter = match[1];
  const body = source.slice(match[0].length);
  const bodyBytes = Buffer.from(body, 'utf8');
  return {
    frontmatter_title: frontmatterScalar(frontmatter, 'title'),
    frontmatter_slug: frontmatterScalar(frontmatter, 'slug'),
    frontmatter_publication_status: frontmatterScalar(frontmatter, 'publication_status'),
    frontmatter_reviewed_at: frontmatterScalar(frontmatter, 'reviewed_at'),
    frontmatter_reviewed_by: frontmatterScalar(frontmatter, 'reviewed_by'),
    frontmatter_article_id: frontmatterScalar(frontmatter, 'article_id'),
    frontmatter_searchatlas_uuid: frontmatterScalar(frontmatter, 'searchatlas_uuid'),
    frontmatter_workflow_status: frontmatterScalar(frontmatter, 'workflow_status'),
    frontmatter_remediated_from_sha256: frontmatterScalar(frontmatter, 'remediated_from_sha256'),
    frontmatter_body_checksum_sha256: frontmatterScalar(frontmatter, 'body_checksum_sha256'),
    frontmatter_body_length_chars: numberScalar(
      frontmatterScalar(frontmatter, 'body_length_chars'),
    ),
    frontmatter_body_word_count: numberScalar(frontmatterScalar(frontmatter, 'body_word_count')),
    frontmatter_draft: booleanScalar(frontmatterScalar(frontmatter, 'draft')),
    frontmatter_noindex: booleanScalar(frontmatterScalar(frontmatter, 'noindex')),
    frontmatter_indexable: booleanScalar(frontmatterScalar(frontmatter, 'indexable')),
    body_sha256: sha256(bodyBytes),
    body_bytes: bodyBytes.length,
    body_characters: body.length,
    body_word_count: (body.match(/\b[\w'-]+\b/g) || []).length,
    explicit_qa_shell_without_final_copy:
      /\bStaged QA shell\b|\bInternal QA shell\b|Final article copy is not included/i.test(source),
  };
}

function csvCell(value) {
  const scalar = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  return /[",\r\n]/.test(scalar) ? `"${scalar.replaceAll('"', '""')}"` : scalar;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownTable(headers, rows, rightAlignedColumns = []) {
  const rightAligned = new Set(rightAlignedColumns);
  const widths = headers.map((header, column) =>
    Math.max(3, header.length, ...rows.map((row) => String(row[column]).length)),
  );
  const renderRow = (row) =>
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
  return [renderRow(headers), renderRow(separator), ...rows.map(renderRow)].join('\n');
}

function rowNumber(row) {
  const match = String(row.program_row_id).match(/^MRX1000-(\d{4})$/);
  invariant(match, `invalid program_row_id ${row.program_row_id}`);
  return Number(match[1]);
}

function pilotNumber(row) {
  const match = String(row.pilot_article_id || '').match(/^MRX1000-PILOT-001-(\d{2})$/);
  return match ? Number(match[1]) : null;
}

function repoEvidence(ledgerRow, readinessRow) {
  const repoPath = normalizeRepoPath(ledgerRow.repo_path || readinessRow.repo?.path);
  const absolutePath = repoPath ? path.join(MRX_ROOT, repoPath) : null;
  const mdxExists = Boolean(absolutePath && existsSync(absolutePath));
  const bytes = mdxExists ? readFileSync(absolutePath) : null;
  invariant(
    mdxExists === Boolean(readinessRow.repo?.mdx_exists),
    `${ledgerRow.program_row_id} repo existence disagrees with readiness evidence`,
  );
  const content = mdxContentEvidence(bytes, absolutePath);
  return {
    state: mdxExists ? 'WORKSPACE_MDX_PRESENT' : 'NO_WORKSPACE_MDX',
    path: repoPath,
    mdx_exists: mdxExists,
    source_sha256: bytes ? sha256(bytes) : null,
    publication_status: ledgerRow.publication_status,
    frontmatter_noindex: Boolean(ledgerRow.frontmatter_noindex),
    workspace_public_route_configured:
      ledgerRow.preservation_classification === 'live_public_published_route',
    production_live_verified_in_this_local_build: false,
    content_evidence: content
      ? {
          ...content,
          filename_matches_canonical_slug:
            path.basename(repoPath) === `${ledgerRow.canonical_slug}.mdx`,
          frontmatter_title_matches_canonical:
            normalizeTitle(content.frontmatter_title) === normalizeTitle(ledgerRow.canonical_title),
          frontmatter_publication_status_matches_ledger:
            content.frontmatter_publication_status === ledgerRow.publication_status,
        }
      : null,
  };
}

function extractCandidateShaFromAudit(text) {
  if (!text) return null;
  return text.match(/Candidate file[^\n]*?\b([0-9a-f]{64})\b/i)?.[1] || null;
}

function validateRow2RemediatedCandidate(optionalInputBytes, ledgerRow) {
  const candidateBytes = optionalInputBytes.row2RemediatedCandidate;
  const complianceBytes = optionalInputBytes.row2FreshComplianceAudit;
  const seoAeoBytes = optionalInputBytes.row2FreshSeoAeoAudit;
  const recoveryEvidenceBytes = optionalInputBytes.row2RecoveryEvidence;
  const rawVendorDraftBytes = optionalInputBytes.row2RawVendorDraft;
  const candidatePath = OPTIONAL_INPUTS.row2RemediatedCandidate;
  const candidateRelativePath = rel(candidatePath);
  const expectedPilotId = 'MRX1000-PILOT-001-02';
  const expectedVendorUuid = '6cfc4a3f-e793-4d20-9a74-a9966c25ee8c';
  const reasons = [];

  if (!candidateBytes) reasons.push('ROW2_REMEDIATED_CANDIDATE_MISSING');
  if (!complianceBytes) reasons.push('ROW2_FRESH_COMPLIANCE_EVIDENCE_MISSING');
  if (!seoAeoBytes) reasons.push('ROW2_FRESH_SEO_AEO_EVIDENCE_MISSING');
  if (!recoveryEvidenceBytes) reasons.push('ROW2_RECOVERY_EVIDENCE_MISSING');
  if (!rawVendorDraftBytes) reasons.push('ROW2_PRESERVED_RAW_VENDOR_DRAFT_MISSING');

  const candidateSha = candidateBytes ? sha256(candidateBytes) : null;
  const content = mdxContentEvidence(candidateBytes, candidatePath);
  const complianceText = complianceBytes?.toString('utf8') || '';
  const seoAeoText = seoAeoBytes?.toString('utf8') || '';
  const recoveryEvidenceText = recoveryEvidenceBytes?.toString('utf8') || '';
  const complianceDeclaredSha = extractCandidateShaFromAudit(complianceText);
  const seoAeoDeclaredSha = extractCandidateShaFromAudit(seoAeoText);
  const rawVendorDraftSha = rawVendorDraftBytes ? sha256(rawVendorDraftBytes) : null;
  const worktreeRelativePath =
    'drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx';

  if (candidateBytes && complianceDeclaredSha !== candidateSha) {
    reasons.push('ROW2_COMPLIANCE_EVIDENCE_CANDIDATE_SHA_MISMATCH');
  }
  if (candidateBytes && seoAeoDeclaredSha !== candidateSha) {
    reasons.push('ROW2_SEO_AEO_EVIDENCE_CANDIDATE_SHA_MISMATCH');
  }
  if (complianceBytes && !complianceText.includes(worktreeRelativePath)) {
    reasons.push('ROW2_COMPLIANCE_EVIDENCE_PATH_MISMATCH');
  }
  if (seoAeoBytes && !seoAeoText.includes(worktreeRelativePath)) {
    reasons.push('ROW2_SEO_AEO_EVIDENCE_PATH_MISMATCH');
  }
  if (
    complianceBytes &&
    (!/PASS — formal fresh independent compliance gate passed/i.test(complianceText) ||
      !/Final fresh independent post-recovery compliance verdict:\s*PASS/i.test(complianceText))
  ) {
    reasons.push('ROW2_COMPLIANCE_REVIEW_READINESS_EVIDENCE_MISSING');
  }
  if (
    seoAeoBytes &&
    (!/Overall SEO\/AEO audit verdict:\s*PASS/i.test(seoAeoText) ||
      !/Fresh SEO\/AEO audit disposition:\s*PASS/i.test(seoAeoText))
  ) {
    reasons.push('ROW2_SEO_AEO_REVIEW_READINESS_EVIDENCE_MISSING');
  }
  if (
    recoveryEvidenceBytes &&
    (sha256(recoveryEvidenceBytes) !== EXPECTED.row2RecoveryEvidenceSha256 ||
      !recoveryEvidenceText.includes(EXPECTED.row2FinalCandidateSha256) ||
      !/Preservation result:\s*PASS/i.test(recoveryEvidenceText))
  ) {
    reasons.push('ROW2_RECOVERY_EVIDENCE_INVALID');
  }
  if (content) {
    if (
      content.frontmatter_article_id !== expectedPilotId ||
      content.frontmatter_title !== ledgerRow.canonical_title ||
      content.frontmatter_slug !== ledgerRow.canonical_slug ||
      content.frontmatter_searchatlas_uuid !== expectedVendorUuid
    ) {
      reasons.push('ROW2_REMEDIATED_CANDIDATE_IDENTITY_MISMATCH');
    }
    if (
      content.frontmatter_workflow_status !== 'NEEDS_REVIEW_REMEDIATED_NOINDEX' ||
      content.frontmatter_draft !== true ||
      content.frontmatter_noindex !== true ||
      content.frontmatter_indexable !== false
    ) {
      reasons.push('ROW2_REMEDIATED_CANDIDATE_CONTAINMENT_MISMATCH');
    }
    if (content.frontmatter_body_checksum_sha256 !== content.body_sha256) {
      reasons.push('ROW2_REMEDIATED_CANDIDATE_BODY_SHA_MISMATCH');
    }
    if (
      content.frontmatter_body_length_chars !== content.body_characters ||
      content.frontmatter_body_word_count !== content.body_word_count
    ) {
      reasons.push('ROW2_REMEDIATED_CANDIDATE_BODY_METRICS_MISMATCH');
    }
    if (
      candidateSha !== EXPECTED.row2FinalCandidateSha256 ||
      content.body_sha256 !== EXPECTED.row2FinalCandidateBodySha256
    ) {
      reasons.push('ROW2_FINAL_CANDIDATE_SHA_DOES_NOT_MATCH_D15_EVIDENCE');
    }
    if (content.frontmatter_remediated_from_sha256 !== EXPECTED.row2PreservedRawRecordedSha256) {
      reasons.push('ROW2_REMEDIATED_FROM_SHA_DOES_NOT_MATCH_D14_CORRECTED_VALUE');
    }
    if (rawVendorDraftBytes && content.frontmatter_remediated_from_sha256 !== rawVendorDraftSha) {
      reasons.push('ROW2_REMEDIATED_FROM_SHA_DOES_NOT_MATCH_CURRENT_RAW_BYTES');
    }
    if (content.body_word_count < 500) {
      reasons.push('ROW2_REMEDIATED_CANDIDATE_NOT_SUBSTANTIVE');
    }
  }

  const validated = reasons.length === 0;
  return {
    validated,
    state: validated
      ? 'ROW2_REMEDIATED_NOINDEX_CANDIDATE_VALIDATED_FOR_ORDERED_LLM_REVIEW'
      : 'ROW2_REMEDIATED_NOINDEX_CANDIDATE_REJECTED_FAIL_CLOSED',
    candidate_path: validated ? candidateRelativePath : null,
    candidate_sha256: validated ? candidateSha : null,
    candidate_body_sha256: validated ? content.body_sha256 : null,
    candidate_word_count: validated ? content.body_word_count : null,
    readiness_evidence_verified: validated,
    readiness_evidence_paths: validated
      ? [
          rel(OPTIONAL_INPUTS.row2RecoveryEvidence),
          rel(OPTIONAL_INPUTS.row2FreshComplianceAudit),
          rel(OPTIONAL_INPUTS.row2FreshSeoAeoAudit),
        ]
      : [],
    rejection_reasons: reasons,
    rejected_candidate_observation: validated
      ? null
      : {
          path_observed: candidateBytes ? candidateRelativePath : null,
          actual_sha256: candidateSha,
          compliance_evidence_declared_sha256: complianceDeclaredSha,
          seo_aeo_evidence_declared_sha256: seoAeoDeclaredSha,
          actual_body_sha256: content?.body_sha256 || null,
          frontmatter_body_checksum_sha256: content?.frontmatter_body_checksum_sha256 || null,
          current_raw_vendor_draft_sha256: rawVendorDraftSha,
          current_raw_vendor_draft_bytes: rawVendorDraftBytes?.length || 0,
          d14_corrected_recorded_raw_sha256: EXPECTED.row2PreservedRawRecordedSha256,
          d10_recorded_raw_bytes: EXPECTED.row2PreservedRawRecordedBytes,
          frontmatter_remediated_from_sha256: content?.frontmatter_remediated_from_sha256 || null,
        },
  };
}

function formalAuditVerdict(bytes, expectedSha256, passPattern, failPattern) {
  const text = bytes?.toString('utf8') || '';
  if (bytes) invariant(sha256(bytes) === expectedSha256, 'row-2 formal audit checksum mismatch');
  const pass = passPattern.test(text);
  return {
    present: Boolean(bytes),
    sha256: bytes ? sha256(bytes) : null,
    expected_sha256: expectedSha256,
    sha256_verified: Boolean(bytes && sha256(bytes) === expectedSha256),
    verdict: pass ? 'PASS' : failPattern.test(text) ? 'FAIL' : 'UNVERIFIED',
  };
}

function row2OrderedReviewException(optionalInputBytes, row2Remediation) {
  const rawBytes = optionalInputBytes.row2RawVendorDraft;
  const rawSha = rawBytes ? sha256(rawBytes) : null;
  const formalCompliance = formalAuditVerdict(
    optionalInputBytes.row2FreshComplianceAudit,
    EXPECTED.row2FreshComplianceAuditSha256,
    /Final fresh independent post-recovery compliance verdict:\s*PASS/i,
    /Final fresh independent post-recovery compliance verdict:\s*FAIL/i,
  );
  const formalSeoAeo = formalAuditVerdict(
    optionalInputBytes.row2FreshSeoAeoAudit,
    EXPECTED.row2FreshSeoAeoAuditSha256,
    /Fresh SEO\/AEO audit disposition:\s*PASS/i,
    /Fresh SEO\/AEO audit disposition:\s*FAIL/i,
  );
  const preconditions = {
    p1_action_time_claude_model_selector_captured: false,
    p2_unsent_prompt_and_model_id_recorded_before_send: false,
    p3_model_substitution_note_ready: false,
    p4_candidate_provenance_and_fresh_sha_valid: row2Remediation.validated,
    p4_raw_vendor_draft_matches_d14_corrected_recorded_sha:
      rawSha === EXPECTED.row2PreservedRawRecordedSha256,
    p4_raw_vendor_draft_matches_d10_recorded_size:
      rawBytes?.length === EXPECTED.row2PreservedRawRecordedBytes,
    p5_formal_compliance_second_audit_pass: formalCompliance.verdict === 'PASS',
    p5_formal_seo_aeo_second_audit_pass: formalSeoAeo.verdict === 'PASS',
    p6_order_locked: true,
    p7_per_surface_hash_run_model_and_verdict_evidence_recorded: false,
    p8_consolidated_report_not_yet_filed: true,
    owner_continuous_publication_policy_bound: true,
    nonpublic_noindex_no_spend_boundary_preserved: true,
  };
  const blockers = [];
  if (!preconditions.p4_candidate_provenance_and_fresh_sha_valid) {
    blockers.push('ROW2_D12_CANDIDATE_PROVENANCE_INVALID');
  }
  if (
    !preconditions.p4_raw_vendor_draft_matches_d14_corrected_recorded_sha ||
    !preconditions.p4_raw_vendor_draft_matches_d10_recorded_size
  ) {
    blockers.push('ROW2_D12_RAW_SOURCE_PROVENANCE_INVALID');
  }
  if (!preconditions.p5_formal_compliance_second_audit_pass) {
    blockers.push('ROW2_D12_FORMAL_COMPLIANCE_AUDIT_FAIL');
  }
  if (!preconditions.p5_formal_seo_aeo_second_audit_pass) {
    blockers.push('ROW2_D12_FORMAL_SEO_AEO_AUDIT_FAIL');
  }
  const auditReadyNow =
    preconditions.p4_candidate_provenance_and_fresh_sha_valid &&
    preconditions.p4_raw_vendor_draft_matches_d14_corrected_recorded_sha &&
    preconditions.p4_raw_vendor_draft_matches_d10_recorded_size &&
    preconditions.p5_formal_compliance_second_audit_pass &&
    preconditions.p5_formal_seo_aeo_second_audit_pass &&
    preconditions.p6_order_locked &&
    preconditions.nonpublic_noindex_no_spend_boundary_preserved;
  blockers.push(
    'ROW2_D12_ACTION_TIME_REVIEW_PREFLIGHT_REQUIRED',
    'LOCAL_ONLY_MANIFEST_EXTERNAL_DISPATCH_NOT_PERFORMED',
  );
  return {
    exception_authorized: true,
    decision_id: 'D-2026-0720-12',
    decision_sha256: EXPECTED.d12Row2OrderedReviewSha256,
    corrected_by_decision_id: 'D-2026-0720-14',
    correction_sha256: EXPECTED.d14Row2SourceHashCorrectionSha256,
    recovery_decision_id: 'D-2026-0720-15',
    recovery_decision_sha256: EXPECTED.d15Row2FinalRecoverySha256,
    target_pilot_article_id: 'MRX1000-PILOT-001-02',
    scope: 'ONE_PASS_ORDERED_INDEPENDENT_REVIEW_ONLY',
    no_spend: true,
    nonpublic: true,
    noindex_required: true,
    one_pass_per_surface: true,
    exact_surface_count: 4,
    required_order: ROW2_D12_REVIEW_SEQUENCE.map((stage) => stage.key),
    claude_model_policy: {
      selection: 'ACTION_TIME_CURRENTLY_AVAILABLE_NAMED_CLAUDE_FAMILY_MODEL',
      selected_model_id: null,
      selector_state_evidence_required_immediately_before_send: true,
      selected_model_id_must_be_recorded_verbatim: true,
      substitution_note_required: true,
      substitution_note_template:
        'D-2026-0720-12 §1A supersedes exact claude-opus-4-6 only for this row-2 ordered independent review; record the named Claude model actually used and that 4.6 was unavailable on the signed-in surface.',
      release_or_index_gate_substitution_allowed: false,
    },
    corrected_recorded_raw_provenance: {
      sha256: EXPECTED.row2PreservedRawRecordedSha256,
      sha256_length: EXPECTED.row2PreservedRawRecordedSha256.length,
      expected_bytes: EXPECTED.row2PreservedRawRecordedBytes,
      current_sha256: rawSha,
      current_bytes: rawBytes?.length || 0,
      matches_current_bytes: rawSha === EXPECTED.row2PreservedRawRecordedSha256,
    },
    formal_audits: {
      compliance: formalCompliance,
      seo_aeo: formalSeoAeo,
    },
    candidate_readiness: {
      candidate_sha256: row2Remediation.candidate_sha256,
      candidate_body_sha256: row2Remediation.candidate_body_sha256,
      candidate_validated: row2Remediation.validated,
      both_fresh_audits_pass_same_candidate: auditReadyNow,
      audit_ready_now: auditReadyNow,
      ordered_review_ready_for_action_time_preflight: auditReadyNow,
    },
    authorization_expiry:
      'CONSOLIDATED_REPORT_FILED_OR_7_CALENDAR_DAYS_AFTER_CANDIDATE_SHA_FIRST_RECORDED_WHICHEVER_FIRST',
    expiry_precondition_verified_now: false,
    preconditions,
    preconditions_satisfied_now: false,
    dispatch_eligible_now: false,
    blocker_codes: blockers,
  };
}

function reviewCandidate(ledgerRow, readinessRow, repo, row2Remediation) {
  const content = repo.content_evidence;
  const isPilot = ledgerRow.preservation_classification === 'pilot_draft_noindex_stage';
  const readinessIdentityVerified = Boolean(
    readinessRow.repo?.mdx_exists === repo.mdx_exists &&
    normalizeRepoPath(readinessRow.repo?.path) === repo.path &&
    readinessRow.title === ledgerRow.canonical_title &&
    readinessRow.slug === ledgerRow.canonical_slug &&
    readinessRow.publication_status === ledgerRow.publication_status,
  );

  if (isPilot) {
    const isRow2 = ledgerRow.pilot_article_id === 'MRX1000-PILOT-001-02';
    const validatedRemediation = isRow2 ? row2Remediation : null;
    const ready = Boolean(validatedRemediation?.validated);
    return {
      state: ready
        ? validatedRemediation.state
        : 'NO_CHECKSUMMED_REVIEW_CANDIDATE_PILOT_QA_SHELL_ONLY',
      checksummed_review_candidate_present: ready,
      path: ready ? validatedRemediation.candidate_path : null,
      source_sha256: ready ? validatedRemediation.candidate_sha256 : null,
      body_sha256: ready ? validatedRemediation.candidate_body_sha256 : null,
      body_word_count: ready ? validatedRemediation.candidate_word_count : null,
      candidate_type: ready ? 'row2_remediated_noindex_candidate' : null,
      readiness_evidence_verified: ready,
      readiness_evidence_paths: ready ? validatedRemediation.readiness_evidence_paths : [],
      workspace_mdx_is_review_candidate: false,
      workspace_mdx_rejection_reason:
        'Pilot workspace MDX is an explicit staged QA shell; final article copy is absent.',
      special_candidate_validation: isRow2 ? validatedRemediation : null,
    };
  }

  const substantiveClass = [
    'live_public_published_route',
    'incumbent_draft_nonpublic_held',
  ].includes(ledgerRow.preservation_classification);
  const readinessChecks = {
    workspace_source_checksum_present: Boolean(repo.source_sha256),
    readiness_row_identity_verified: readinessIdentityVerified,
    filename_matches_canonical_slug: Boolean(content?.filename_matches_canonical_slug),
    frontmatter_title_matches_canonical: Boolean(content?.frontmatter_title_matches_canonical),
    frontmatter_publication_status_matches_ledger: Boolean(
      content?.frontmatter_publication_status_matches_ledger,
    ),
    substantive_body_at_least_500_words: Boolean(content && content.body_word_count >= 500),
    explicit_qa_shell_absent: Boolean(content && !content.explicit_qa_shell_without_final_copy),
    review_metadata_present: Boolean(
      content?.frontmatter_reviewed_at && content?.frontmatter_reviewed_by,
    ),
    canonical_state_supports_content_review: substantiveClass,
  };
  const ready = Object.values(readinessChecks).every(Boolean);
  return {
    state: ready
      ? ledgerRow.preservation_classification === 'live_public_published_route'
        ? 'CHECKSUMMED_EXISTING_PUBLIC_ARTICLE_READY_FOR_LLM_REVIEW'
        : 'CHECKSUMMED_HELD_SUBSTANTIVE_DRAFT_READY_FOR_LLM_REVIEW'
      : repo.mdx_exists
        ? 'WORKSPACE_MDX_PRESENT_BUT_REVIEW_READINESS_UNPROVEN'
        : 'NO_WORKSPACE_CONTENT_CANDIDATE',
    checksummed_review_candidate_present: ready,
    path: ready ? repo.path : null,
    source_sha256: ready ? repo.source_sha256 : null,
    body_sha256: ready ? content.body_sha256 : null,
    body_word_count: ready ? content.body_word_count : null,
    candidate_type: ready
      ? ledgerRow.preservation_classification === 'live_public_published_route'
        ? 'existing_public_article'
        : 'held_substantive_draft'
      : null,
    readiness_evidence_verified: ready,
    readiness_evidence_paths: ready ? [rel(INPUTS.readiness), rel(INPUTS.ledger)] : [],
    readiness_checks: readinessChecks,
    workspace_mdx_is_review_candidate: ready,
    workspace_mdx_rejection_reason: ready
      ? null
      : repo.mdx_exists
        ? 'Workspace MDX did not satisfy every content identity, substance, review-metadata, and readiness check.'
        : 'No workspace MDX exists.',
    special_candidate_validation: null,
  };
}

function validateCanaryRecord(record, ledgerRow, pilotManifestById) {
  if (!record?.pilot_article_id) {
    return {
      artifact_bound_to_canonical_row: false,
      source_sha256_verified_now: false,
      identity_source_sha256_verified_now: false,
    };
  }
  invariant(
    record.pilot_article_id === ledgerRow.pilot_article_id,
    `${ledgerRow.program_row_id} canary pilot identity mismatch`,
  );
  const sourcePath = path.resolve(MRX_ROOT, record.source);
  const sourceBytes = readBytes(sourcePath);
  const sourceText = sourceBytes.toString('utf8');
  const sourceVerified = sha256(sourceBytes) === record.source_sha256;
  invariant(sourceVerified, `${ledgerRow.program_row_id} canary source checksum mismatch`);

  const pilotSpec = pilotManifestById.get(record.pilot_article_id);
  invariant(pilotSpec, `${ledgerRow.program_row_id} canary missing from pilot manifest`);
  invariant(
    pilotSpec.title === ledgerRow.canonical_title && pilotSpec.slug === ledgerRow.canonical_slug,
    `${ledgerRow.program_row_id} pilot manifest identity mismatch`,
  );
  invariant(
    sourceText.includes(record.pilot_article_id) &&
      sourceText.includes(record.uuid) &&
      sourceText.includes(record.status),
    `${ledgerRow.program_row_id} canary source fields could not be independently rechecked`,
  );

  let identityVerified = true;
  if (record.identity_source) {
    const identityPath = path.resolve(MRX_ROOT, record.identity_source);
    identityVerified = sha256(readBytes(identityPath)) === record.identity_source_sha256;
    invariant(identityVerified, `${ledgerRow.program_row_id} canary identity checksum mismatch`);
  }

  return {
    artifact_bound_to_canonical_row: Boolean(
      sourceVerified &&
      identityVerified &&
      record.source_fields_verified &&
      UUID_RE.test(record.uuid),
    ),
    source_sha256_verified_now: sourceVerified,
    identity_source_sha256_verified_now: identityVerified,
  };
}

function vendorJoin(ledgerRow, readinessRow, rawDetailByUuid, pilotManifestById) {
  const evidence = readinessRow.searchatlas?.content_genius_exact_title_records;
  invariant(evidence, `${ledgerRow.program_row_id} lacks Content Genius join evidence`);
  invariant(
    evidence.match_count === evidence.records.length,
    'vendor match count disagrees with records',
  );
  for (const record of evidence.records) {
    invariant(UUID_RE.test(record.uuid), `invalid Content Genius UUID ${record.uuid}`);
  }

  const validatedRecords = evidence.records.map((record) => {
    let rawExportRecordVerifiedNow = false;
    if (!record.pilot_article_id) {
      const raw = rawDetailByUuid.get(record.uuid);
      invariant(raw, `${ledgerRow.program_row_id} vendor UUID is absent from the raw export`);
      invariant(
        normalizeTitle(raw.title) === normalizeTitle(ledgerRow.canonical_title) &&
          raw.status === record.status &&
          raw.uuid === record.uuid,
        `${ledgerRow.program_row_id} raw-export title/status/UUID join failed`,
      );
      rawExportRecordVerifiedNow = true;
    }
    const canary = validateCanaryRecord(record, ledgerRow, pilotManifestById);
    return {
      article_uuid: record.uuid,
      status: record.status,
      editor_url: record.editor_url,
      updated_at: record.updated_at,
      evidence_source: record.source,
      evidence_provenance: record.provenance,
      evidence_source_sha256: record.source_sha256,
      pilot_article_id: record.pilot_article_id,
      raw_export_record_verified_now: rawExportRecordVerifiedNow,
      vendor_record_evidence_verified_now:
        rawExportRecordVerifiedNow || canary.artifact_bound_to_canonical_row,
      ...canary,
    };
  });
  const boundRecords = validatedRecords.filter((record) => record.artifact_bound_to_canonical_row);
  invariant(
    boundRecords.length <= 1,
    `${ledgerRow.program_row_id} has multiple artifact-bound UUIDs`,
  );

  let bindingStatus = 'NO_EXACT_TITLE_JOIN';
  if (boundRecords.length === 1) bindingStatus = 'ARTIFACT_BOUND_CANONICAL_ROW_UUID';
  else if (evidence.match_count === 1)
    bindingStatus = 'UNAMBIGUOUS_EXACT_TITLE_CANDIDATE_NOT_BOUND';
  else if (evidence.match_count > 1) bindingStatus = 'AMBIGUOUS_EXACT_TITLE_CANDIDATES';

  return {
    join_method: 'normalized_exact_title_against_composed_local_snapshot',
    match_count: evidence.match_count,
    match_state:
      evidence.match_count === 0
        ? 'NO_EXACT_TITLE_MATCH'
        : evidence.match_count === 1
          ? 'ONE_EXACT_TITLE_MATCH'
          : 'MULTIPLE_EXACT_TITLE_MATCHES',
    binding_status: bindingStatus,
    candidate_article_uuids: validatedRecords.map((record) => record.article_uuid),
    candidate_statuses: validatedRecords.map((record) => record.status),
    records: validatedRecords,
    content_genius_article_uuid_proven_for_canonical_row:
      boundRecords.length === 1 ? boundRecords[0].article_uuid : null,
    exact_title_candidate_is_creation_proof_for_canonical_row: false,
    manual_reconciliation_required: boundRecords.length !== 1,
  };
}

function searchAtlasAction(row, repo, vendor) {
  if (vendor.binding_status === 'ARTIFACT_BOUND_CANONICAL_ROW_UUID') {
    return 'reconcile_artifact_bound_content_genius_record_no_creation';
  }
  if (vendor.match_count > 1) {
    return 'resolve_ambiguous_exact_title_vendor_candidates_no_creation';
  }
  if (vendor.match_count === 1) {
    return 'reconcile_unambiguous_exact_title_vendor_candidate_no_creation';
  }
  if (row.is_pilot_001) {
    return 'reconcile_pilot_non_creation_workflow_label_then_bind_or_conditionally_create';
  }
  if (repo.workspace_public_route_configured) {
    return 'preserve_workspace_public_route_and_search_vendor_identity_before_any_creation';
  }
  if (repo.mdx_exists) {
    return 'reconcile_workspace_draft_and_search_vendor_identity_before_any_creation';
  }
  return 'search_vendor_identity_then_conditionally_create_after_identity_and_quality_preflight';
}

function makeReviewStages(candidate, orderedReviewException) {
  const sequence = orderedReviewException ? ROW2_D12_REVIEW_SEQUENCE : LLM_SEQUENCE;
  return sequence.map((definition) => {
    const isClaude = definition.key === 'claude_opus_4_6';
    const isD12Claude = definition.key === 'claude_action_time_named_model';
    const predecessor = definition.order === 1 ? null : sequence[definition.order - 2];
    return {
      ...definition,
      state: isClaude
        ? 'MODEL_BLOCKED_EXACT_CLAUDE_OPUS_4_6_UNAVAILABLE'
        : isD12Claude
          ? 'WAITING_FOR_PREDECESSOR_PASS_AND_ACTION_TIME_MODEL_CAPTURE'
          : definition.order === 1
            ? orderedReviewException
              ? orderedReviewException.candidate_readiness.audit_ready_now
                ? 'READY_FOR_D12_CHATGPT_REVIEW_AFTER_ACTION_TIME_PREFLIGHT'
                : 'NOT_STARTED_D12_PRECONDITIONS_FAILED'
              : 'NOT_STARTED_LOCAL_ONLY_NO_DISPATCH'
            : 'WAITING_FOR_PREDECESSOR_PASS',
      availability_state: isClaude
        ? 'UNAVAILABLE_PER_LOCAL_FRAMEWORK_SNAPSHOT'
        : isD12Claude
          ? 'ACTION_TIME_SIGNED_IN_CLAUDE_SELECTOR_CAPTURE_REQUIRED'
          : 'NOT_CHECKED_BY_LOCAL_ONLY_BUILD',
      dispatch_eligible_now: false,
      prerequisite_gates: {
        checksummed_review_candidate_present: candidate.checksummed_review_candidate_present,
        review_candidate_path: candidate.path,
        review_candidate_sha256: candidate.source_sha256,
        review_candidate_readiness_evidence_verified: candidate.readiness_evidence_verified,
        predecessor_key: predecessor?.key || null,
        predecessor_pass_required: Boolean(predecessor),
        predecessor_pass_observed: false,
        exact_model_id_must_be_recorded: true,
        exact_required_model_available: definition.required_exact_model_id == null ? null : false,
        program_release_authorization_satisfied: true,
        row2_d12_exception_preconditions_satisfied:
          orderedReviewException?.preconditions_satisfied_now ?? null,
        row2_d12_audit_ready_now:
          orderedReviewException?.candidate_readiness.audit_ready_now ?? null,
      },
      evidence: {
        review_input_sha256: null,
        verdict_output_sha256: null,
        evidence_path: null,
        exact_model_id_observed: null,
        run_id: null,
        executed_at: null,
        verdict: null,
        issues: [],
        model_substitution_note: isD12Claude ? null : undefined,
      },
    };
  });
}

function stopConditions(candidate, vendor, orderedReviewException) {
  const reasons = [
    'EXACT_CLAUDE_OPUS_4_6_UNAVAILABLE',
    'ORDERED_LLM_REVIEW_SEQUENCE_NOT_COMPLETE',
    'LOCAL_ONLY_MANIFEST_EXTERNAL_DISPATCH_NOT_PERFORMED',
    'ARTICLE_SPECIFIC_QUALITY_CLEARANCE_NOT_COMPLETE',
  ];
  if (!candidate.checksummed_review_candidate_present) {
    reasons.push('NO_CHECKSUMMED_REVIEW_CANDIDATE');
  }
  if (vendor.match_count > 1) reasons.push('CONTENT_GENIUS_IDENTITY_AMBIGUOUS');
  else if (vendor.binding_status !== 'ARTIFACT_BOUND_CANONICAL_ROW_UUID') {
    reasons.push('CONTENT_GENIUS_CANONICAL_ROW_UUID_BINDING_UNPROVEN');
  }
  if (orderedReviewException) reasons.push(...orderedReviewException.blocker_codes);
  return reasons;
}

function assignBatches(ledgerRows) {
  const pilots = ledgerRows
    .filter((row) => row.is_pilot_001)
    .sort((a, b) => pilotNumber(a) - pilotNumber(b));
  const nonPilots = ledgerRows
    .filter((row) => !row.is_pilot_001)
    .sort((a, b) => rowNumber(a) - rowNumber(b));
  invariant(pilots.length === EXPECTED.batchSize, 'pilot batch must contain exactly 25 rows');
  const ordered = [...pilots, ...nonPilots];
  const assignments = new Map();
  ordered.forEach((row, zeroBasedIndex) => {
    const batchSequence = Math.floor(zeroBasedIndex / EXPECTED.batchSize) + 1;
    assignments.set(row.program_row_id, {
      execution_sequence: zeroBasedIndex + 1,
      batch_id: `MRX1000-SA-BATCH-${String(batchSequence).padStart(3, '0')}`,
      batch_sequence: batchSequence,
      position_in_batch: (zeroBasedIndex % EXPECTED.batchSize) + 1,
      batch_size: EXPECTED.batchSize,
      assignment_policy:
        batchSequence === 1
          ? 'existing_pilot_001_rows_by_pilot_article_id'
          : 'remaining_rows_by_program_row_id',
    });
  });
  return assignments;
}

/**
 * Validate the two-record canary contribution to the composed vendor snapshot.
 * This is exported so regression tests can prove duplicate-canary drift fails.
 *
 * @param {Array<{uuid: string, status: string}>} canaryRecords
 * @param {Map<string, unknown>} rawDetailByUuid
 */
export function validateCanarySnapshot(canaryRecords, rawDetailByUuid) {
  invariant(
    canaryRecords.length === EXPECTED.canaryArtifactCount,
    'composed snapshot must have exactly two canary artifacts',
  );
  invariant(
    new Set(canaryRecords.map((record) => record.uuid)).size === EXPECTED.canaryArtifactCount,
    'canary UUIDs must be unique from each other',
  );
  invariant(
    canaryRecords.every(
      (record) =>
        record.status === 'NEEDS_REVIEW' &&
        !rawDetailByUuid.has(record.uuid) &&
        UUID_RE.test(record.uuid),
    ),
    'canary records must be distinct NEEDS_REVIEW UUIDs outside the 297-row raw export',
  );
}

function reviewStageState(row, key) {
  return row.ordered_llm_reviews.find((stage) => stage.key === key)?.state || null;
}

function buildCsv(rows) {
  const columns = [
    ['program_row_id', (r) => r.program_row_id],
    ['canonical_title', (r) => r.canonical_title],
    ['canonical_slug', (r) => r.canonical_slug],
    ['pillar', (r) => r.pillar],
    ['cluster', (r) => r.cluster],
    ['canonical_inventory_state', (r) => r.authoritative_current_state.canonical_inventory_state],
    ['repo_path', (r) => r.authoritative_current_state.repo.path],
    ['repo_mdx_exists', (r) => r.authoritative_current_state.repo.mdx_exists],
    ['repo_source_sha256', (r) => r.authoritative_current_state.repo.source_sha256],
    ['review_candidate_state', (r) => r.authoritative_current_state.review_candidate.state],
    [
      'checksummed_review_candidate_present',
      (r) => r.authoritative_current_state.review_candidate.checksummed_review_candidate_present,
    ],
    ['review_candidate_path', (r) => r.authoritative_current_state.review_candidate.path],
    [
      'review_candidate_sha256',
      (r) => r.authoritative_current_state.review_candidate.source_sha256,
    ],
    [
      'review_candidate_readiness_evidence_verified',
      (r) => r.authoritative_current_state.review_candidate.readiness_evidence_verified,
    ],
    [
      'workspace_mdx_is_review_candidate',
      (r) => r.authoritative_current_state.review_candidate.workspace_mdx_is_review_candidate,
    ],
    [
      'workspace_public_route_configured',
      (r) => r.authoritative_current_state.repo.workspace_public_route_configured,
    ],
    ['pilot_article_id', (r) => r.authoritative_current_state.pilot_article_id],
    ['batch_id', (r) => r.searchatlas_execution.batch_id],
    ['batch_sequence', (r) => r.searchatlas_execution.batch_sequence],
    ['position_in_batch', (r) => r.searchatlas_execution.position_in_batch],
    ['execution_sequence', (r) => r.searchatlas_execution.execution_sequence],
    ['searchatlas_action_needed', (r) => r.searchatlas_execution.action_needed],
    ['searchatlas_execution_state', (r) => r.searchatlas_execution.execution_state],
    [
      'searchatlas_map_id_planning_handle',
      (r) => r.authoritative_current_state.planning_handles.searchatlas_map_id,
    ],
    [
      'searchatlas_title_uuid_planning_handle',
      (r) => r.authoritative_current_state.planning_handles.searchatlas_title_uuid,
    ],
    [
      'planning_handles_are_creation_proof',
      (r) =>
        r.authoritative_current_state.planning_handles.are_content_genius_article_creation_proof,
    ],
    ['content_genius_match_count', (r) => r.authoritative_current_state.vendor_join.match_count],
    [
      'content_genius_binding_status',
      (r) => r.authoritative_current_state.vendor_join.binding_status,
    ],
    [
      'content_genius_candidate_article_uuids',
      (r) => r.authoritative_current_state.vendor_join.candidate_article_uuids,
    ],
    [
      'content_genius_candidate_statuses',
      (r) => r.authoritative_current_state.vendor_join.candidate_statuses,
    ],
    [
      'content_genius_article_uuid_proven_for_canonical_row',
      (r) =>
        r.authoritative_current_state.vendor_join
          .content_genius_article_uuid_proven_for_canonical_row,
    ],
    ['chatgpt_state', (r) => reviewStageState(r, 'chatgpt')],
    ['google_gemini_state', (r) => reviewStageState(r, 'google_gemini')],
    ['claude_opus_4_6_state', (r) => reviewStageState(r, 'claude_opus_4_6')],
    [
      'claude_action_time_named_model_state',
      (r) => reviewStageState(r, 'claude_action_time_named_model'),
    ],
    ['perplexity_state', (r) => reviewStageState(r, 'perplexity')],
    ['microsoft_copilot_state', (r) => reviewStageState(r, 'microsoft_copilot')],
    ['ordered_review_exception_decision_id', (r) => r.ordered_review_exception?.decision_id],
    ['ordered_review_exception_scope', (r) => r.ordered_review_exception?.scope],
    [
      'ordered_review_exception_dispatch_eligible_now',
      (r) => r.ordered_review_exception?.dispatch_eligible_now,
    ],
    [
      'ordered_review_exception_audit_ready_now',
      (r) => r.ordered_review_exception?.candidate_readiness.audit_ready_now,
    ],
    [
      'ordered_review_exception_candidate_sha256',
      (r) => r.ordered_review_exception?.candidate_readiness.candidate_sha256,
    ],
    ['ordered_review_exception_blockers', (r) => r.ordered_review_exception?.blocker_codes || []],
    ['all_llm_verdicts_passed', (r) => r.review_gate.all_required_verdicts_passed],
    ['release_action_eligible_now', (r) => r.release_index_eligibility.release_action_eligible_now],
    [
      'index_submission_eligible_now',
      (r) => r.release_index_eligibility.index_submission_eligible_now,
    ],
    ['owner_decision_id', (r) => r.release_index_eligibility.decision_id],
    [
      'numerical_release_cap_applies',
      (r) => r.release_index_eligibility.numerical_release_cap_applies,
    ],
    ['stop_conditions', (r) => r.stop_conditions],
  ];
  return `${[
    columns.map(([name]) => csvCell(name)).join(','),
    ...rows.map((row) => columns.map(([, select]) => csvCell(select(row))).join(',')),
  ].join('\n')}\n`;
}

function buildReport(manifest) {
  const a = manifest.aggregate;
  const hashes = manifest.inputs;
  const row2 = manifest.rows.find(
    (row) => row.authoritative_current_state.pilot_article_id === 'MRX1000-PILOT-001-02',
  );
  const row2Candidate = row2.authoritative_current_state.review_candidate;
  const inventoryTable = markdownTable(
    ['Measure', 'Count'],
    [
      ['Canonical rows', a.total_rows],
      ['Deterministic 25-row batches', a.batch_count],
      ['Workspace MDX present', a.repo_mdx_present],
      [
        'Workspace public-route configurations (not a production-live claim)',
        a.workspace_public_route_configured,
      ],
      [
        'Checksummed review candidates with readiness evidence',
        a.checksummed_review_candidate_rows,
      ],
      ['Rows without a validated review candidate', a.rows_without_checksummed_review_candidate],
      ['Pilot QA shells (never review candidates)', a.pilot_workspace_qa_shell_rows],
      [
        'Pilot workspace shells marked as review candidates',
        a.pilot_workspace_shells_marked_as_review_candidates,
      ],
      [
        'Pilot rows with a separately validated review candidate',
        a.pilot_rows_with_validated_distinct_review_candidate,
      ],
      ['Held incumbent drafts', a.by_canonical_inventory_state.incumbent_draft_nonpublic_held || 0],
      ['Noindex pilot drafts', a.by_canonical_inventory_state.pilot_draft_noindex_stage || 0],
      ['Planning-only rows', a.by_canonical_inventory_state.planning_only_inventory || 0],
      ['Rows with any normalized exact-title vendor candidate', a.vendor_exact_title_match_rows],
      ['Unambiguous exact-title candidate rows', a.vendor_unambiguous_candidate_rows],
      ['Ambiguous exact-title candidate rows', a.vendor_ambiguous_candidate_rows],
      ['Exact-title candidate records across matched rows', a.vendor_exact_title_candidate_records],
      [
        'Artifact-bound canonical-row Content Genius UUIDs',
        a.artifact_bound_content_genius_uuid_rows,
      ],
      ['Rows with any recorded LLM verdict', a.rows_with_any_llm_verdict],
      ['D12 row-2 ordered-review exceptions', a.row2_ordered_review_exception_rows],
      [
        'D12 row-2 exceptions dispatch-eligible now',
        a.row2_ordered_review_exception_dispatch_eligible_now,
      ],
      ['D12 row-2 exceptions audit-ready now', a.row2_ordered_review_audit_ready_now],
      ['Release-eligible rows now', a.release_action_eligible_now],
      ['Index-submission-eligible rows now', a.index_submission_eligible_now],
    ],
    [1],
  );
  const inputTable = markdownTable(
    ['Input', 'SHA-256'],
    Object.values(hashes).map((input) => [`\`${input.path}\``, `\`${input.sha256}\``]),
  );
  return `# MRX1000 SearchAtlas + ordered LLM local execution manifest

## Disposition

**FAIL-CLOSED / LOCAL-ONLY / NO EXTERNAL WRITES.** This artifact assigns and reconciles work; it does not claim that 1,000 articles were created, reviewed, released, live, indexed, or submitted.

Owner decision **${manifest.release_gate.decision_id}** is checksum-verified at \`${manifest.release_gate.signed_artifact_sha256}\` and removes numerical release caps and elapsed-time gates. Exact **Claude Opus 4.6** (\`${manifest.model_gate.exact_claude_model_id}\`) is unavailable in the captured legacy framework evidence, and the ordered-review sequence recorded by this local artifact is incomplete. Rows remain individually ineligible for an action until their identity, content, and substantive quality evidence is complete; article count is not a blocker.

## Deterministic inventory

${inventoryTable}

## SearchAtlas evidence boundary

- Historical signed D11 vendor snapshot: **299 = 200 NEEDS_REVIEW + 70 COMPLETED + 29 NOT_BEGUN**. D11 is inventory provenance, not current release authority.
- Composition: **297** records in the captured raw Content Genius export plus **2** separately validated canary artifacts.
- Exact-title reconciliation assigns **${a.vendor_exact_title_candidate_records}** candidate records to **${a.vendor_exact_title_match_rows}** ledger rows. The remaining vendor inventory is not silently assigned to canonical rows.
- A topical-map \`searchatlas_map_id\` or \`searchatlas_title_uuid\` is retained only as a planning handle and is never treated as Content Genius article-creation proof.
- An unambiguous exact-title match is still a candidate join, not canonical identity proof. Only ${a.artifact_bound_content_genius_uuid_rows} canary rows have checksum-validated artifact binding between pilot identity and Content Genius article UUID.

## Review-candidate safety boundary

- Workspace MDX existence is inventory evidence, not review-candidate proof.
- The immutable canonical ledger is preserved, while the current workspace publication view projects only byte-proven exact-admission transitions. It therefore records **${a.by_canonical_inventory_state.incumbent_draft_nonpublic_held || 0}** held incumbents and **${a.by_canonical_inventory_state.live_public_published_route || 0}** public workspace articles. Checksummed review-candidate status still requires canonical identity, substantive body, review metadata, source path/SHA, publication state, and readiness-row identity to agree.
- All 25 pilot workspace MDX files are explicit QA shells without final article copy. Their workspace paths are never review candidates and every shell has \`workspace_mdx_is_review_candidate=false\`.
- A pilot row may become reviewable only through a distinct candidate whose exact path, file SHA, body SHA, identity, containment state, and readiness evidence validate together.
- Row 2 distinct-candidate state: \`${row2Candidate.special_candidate_validation.state}\`. Checksummed review candidate present: \`${row2Candidate.checksummed_review_candidate_present}\`. Rejection reasons: ${
    row2Candidate.special_candidate_validation.rejection_reasons.length
      ? row2Candidate.special_candidate_validation.rejection_reasons
          .map((reason) => `\`${reason}\``)
          .join(', ')
      : 'none'
  }.

## D12/D14/D15 row-2-only ordered-review readiness

- Signed \`D-2026-0720-12\` (\`${row2.ordered_review_exception.decision_sha256}\`) authorizes exactly one no-spend, nonpublic, noindex review pass for \`MRX1000-PILOT-001-02\` in this order: **ChatGPT → Google Gemini → a currently available named Claude-family model captured at action time → Perplexity**.
- Signed \`D-2026-0720-14\` (\`${row2.ordered_review_exception.correction_sha256}\`) corrects the intended preserved-raw SHA to the 64-character value \`${row2.ordered_review_exception.corrected_recorded_raw_provenance.sha256}\`. Signed \`D-2026-0720-15\` (\`${row2.ordered_review_exception.recovery_decision_sha256}\`) authorized the exact local recovery and fresh dual audits now reflected here.
- The Claude stage requires the visible signed-in model selector and exact selected model ID immediately before send, plus a verdict \`model_substitution_note\` naming D12, the model actually used, and why exact 4.6 was unavailable. No named model has been silently guessed or pre-filled.
- Row 2 is **audit-ready now**: candidate \`${row2.ordered_review_exception.candidate_readiness.candidate_sha256}\` is checksummed and both fresh audits PASS the same bytes. This local manifest still does not perform or claim external dispatch. Pending action-time/local-only conditions: ${row2.ordered_review_exception.blocker_codes
    .map((reason) => `\`${reason}\``)
    .join(', ')}.
- Current formal audit evidence is checksum-pinned and returns compliance \`${row2.ordered_review_exception.formal_audits.compliance.verdict}\` and SEO/AEO \`${row2.ordered_review_exception.formal_audits.seo_aeo.verdict}\`. The restored raw draft is ${row2.ordered_review_exception.corrected_recorded_raw_provenance.current_bytes} bytes at \`${row2.ordered_review_exception.corrected_recorded_raw_provenance.current_sha256}\`, exactly matching the D10/D14 recorded raw provenance.
- The exception does not itself authorize a SearchAtlas write or weaken the recorded review sequence. D-2026-0804-16 separately removes the former numerical cap; the other 999 rows retain their article-specific identity, content, and review requirements.

## Execution order

Batch \`MRX1000-SA-BATCH-001\` preserves the 25 existing pilot rows in \`pilot_article_id\` order. Batches 002-040 contain the remaining 975 rows in canonical \`program_row_id\` order. JSON and CSV rows are physically emitted in \`execution_sequence\` order 1-1000, so the pilot batch is first for sequential consumers. Every batch has exactly 25 rows. This local manifest performs no external writes; rows wait on identity, content, and review evidence rather than a numerical release cap.

The ordered answer-engine sequence is:

1. **ChatGPT**
2. **Google Gemini** (correct machine/display label; the source request's “Demini” was a typo)
3. **Claude Opus 4.6** — exact \`claude-opus-4-6\`, no substitution
4. **Perplexity**
5. **Microsoft Copilot** — an additional Bing/Copilot answer surface after the four required reviewers

Every stage includes null input/output checksum, exact-model, run, timestamp, verdict, and evidence-path slots. No verdict is populated by this generator. A later executor must preserve sequence and record a PASS before moving to the next engine.

The sequence above is the default for 999 rows. Row 2 alone uses the four-surface D12 exception described above; Microsoft Copilot is not part of that signed narrow pass.

## Fail-closed stop conditions

Every row stops on its incomplete ordered review sequence and this artifact's local-only no-dispatch posture. Rows without an independently validated candidate also stop on \`NO_CHECKSUMMED_REVIEW_CANDIDATE\`; row-specific stops additionally cover ambiguous Content Genius identities and unproven canonical row-to-UUID bindings. D-2026-0804-16 supplies program-level release/index authority, but no row may skip its substantive quality evidence.

## Read-only input provenance

${inputTable}

Manifest content fingerprint: \`${manifest.content_fingerprint_sha256}\`.
`;
}

export function buildManifest() {
  const inputBytes = Object.fromEntries(
    Object.entries(INPUTS).map(([key, file]) => [key, readBytes(file)]),
  );
  const optionalInputBytes = Object.fromEntries(
    Object.entries(OPTIONAL_INPUTS).map(([key, file]) => [key, readOptionalBytes(file)]),
  );
  const ledger = JSON.parse(inputBytes.ledger.toString('utf8'));
  const runtimeArticles = projectLedgerArticlesForRuntime(ledger.articles ?? [], MRX_ROOT).articles;
  const readiness = JSON.parse(inputBytes.readiness.toString('utf8'));
  const contentGeniusExport = JSON.parse(inputBytes.contentGeniusExport.toString('utf8'));
  const pilotManifest = JSON.parse(inputBytes.pilotManifest.toString('utf8'));
  const d11Text = inputBytes.d11.toString('utf8');
  const ownerDecisionText = inputBytes.ownerDecision.toString('utf8');
  const d12Text = inputBytes.d12Row2OrderedReview.toString('utf8');
  const d14Text = inputBytes.d14Row2SourceHashCorrection.toString('utf8');
  const d15Text = inputBytes.d15Row2FinalRecovery.toString('utf8');
  const claudeFrameworkText = inputBytes.claudeFramework.toString('utf8');

  invariant(sha256(inputBytes.d11) === EXPECTED.d11Sha256, 'signed D11 checksum mismatch');
  invariant(
    sha256(inputBytes.ownerDecision) === EXPECTED.ownerDecisionSha256,
    'owner decision checksum mismatch',
  );
  invariant(
    sha256(inputBytes.row1Canary) === EXPECTED.row1CanarySha256,
    'row-1 canary checksum mismatch',
  );
  invariant(
    sha256(inputBytes.pilotManifest) === EXPECTED.pilotManifestSha256,
    'pilot manifest checksum mismatch',
  );
  invariant(
    sha256(inputBytes.d10Row2Canary) === EXPECTED.d10Row2CanarySha256,
    'signed D10 row-2 canary checksum mismatch',
  );
  invariant(
    sha256(inputBytes.d12Row2OrderedReview) === EXPECTED.d12Row2OrderedReviewSha256,
    'signed D12 row-2 ordered-review checksum mismatch',
  );
  invariant(
    sha256(inputBytes.d14Row2SourceHashCorrection) === EXPECTED.d14Row2SourceHashCorrectionSha256,
    'signed D14 source-hash correction checksum mismatch',
  );
  invariant(
    sha256(inputBytes.d15Row2FinalRecovery) === EXPECTED.d15Row2FinalRecoverySha256,
    'signed D15 row-2 final-recovery checksum mismatch',
  );
  invariant(d11Text.includes(EXPECTED.d11DecisionId), 'signed D11 decision id missing');
  invariant(d11Text.includes(EXPECTED.d11Disposition), 'signed D11 disposition missing');
  invariant(/authorization cap is zero \(`0`\)/i.test(d11Text), 'D11 zero-cap statement missing');
  invariant(
    /299[^\n]*200 NEEDS_REVIEW[^\n]*70 COMPLETED[^\n]*29 NOT_BEGUN/i.test(d11Text),
    'D11 299-row vendor snapshot missing',
  );
  invariant(
    ownerDecisionText.includes(EXPECTED.ownerDecisionId) &&
      ownerDecisionText.includes('release_authorized: true') &&
      ownerDecisionText.includes('index_authorized: true') &&
      ownerDecisionText.includes('Article count and elapsed time do not.'),
    'owner continuous-publication decision is incomplete',
  );
  invariant(
    claudeFrameworkText.includes(EXPECTED.exactClaudeModelId) &&
      /blocked on Claude Opus 4\.6 first-party env auth/i.test(claudeFrameworkText),
    'exact Claude Opus 4.6 unavailability evidence missing',
  );
  invariant(
    d12Text.includes('D-2026-0720-12') &&
      /ChatGPT → Gemini → Claude → Perplexity/.test(d12Text) &&
      /exactly one pass per surface/i.test(d12Text) &&
      /NO-SPEND/.test(d12Text) &&
      /nonpublic/.test(d12Text) &&
      /action-time, evidenced, named currently available Claude model/i.test(d12Text) &&
      /D-2026-0720-11 cap remains `0`/.test(d12Text),
    'signed D12 narrow row-2 ordered-review authorization is incomplete',
  );
  invariant(
    d14Text.includes('D-2026-0720-14') &&
      d14Text.includes(EXPECTED.row2PreservedRawRecordedSha256) &&
      /Length:\s*\*\*64\*\*/.test(d14Text) &&
      /preserved raw-draft drift/.test(d14Text) &&
      /exact-Claude-Opus-4\.6 gate remains binding/i.test(d14Text),
    'signed D14 corrected row-2 raw provenance boundary is incomplete',
  );
  invariant(
    EXPECTED.row2PreservedRawRecordedSha256.length === 64 &&
      /^[0-9a-f]{64}$/.test(EXPECTED.row2PreservedRawRecordedSha256),
    'D14 corrected raw SHA-256 must be exactly 64 lowercase hex characters',
  );
  invariant(
    d15Text.includes('D-2026-0720-15') &&
      d15Text.includes('AUTHORIZE_EXACT_LOCAL_RECOVERY_AND_TWO_ITEM_FINAL_REMEDIATION') &&
      /Both new formal audits must return PASS against the same final candidate file SHA-256/i.test(
        d15Text,
      ) &&
      /ordered ChatGPT → Gemini → Claude → Perplexity review may begin only after both fresh audits PASS/i.test(
        d15Text,
      ) &&
      /authorization cap of `0`/.test(d15Text) &&
      /exact-Claude gate outside D-2026-0720-12's narrow ordered-review substitution lane/.test(
        d15Text,
      ),
    'signed D15 row-2 recovery/audit boundary is incomplete',
  );

  invariant(
    ledger.articles?.length === EXPECTED.rowCount,
    'canonical ledger must contain 1,000 rows',
  );
  invariant(
    readiness.rows?.length === EXPECTED.rowCount,
    'readiness matrix must contain 1,000 rows',
  );
  invariant(readiness.release_decision?.signed === true, 'readiness owner decision must be signed');
  invariant(
    readiness.release_decision?.decision_id === EXPECTED.ownerDecisionId &&
      readiness.release_decision?.signed_artifact_sha256 === EXPECTED.ownerDecisionSha256 &&
      readiness.release_decision?.signed_artifact_sha256_verified === true,
    'readiness owner-decision checksum evidence is invalid',
  );
  invariant(
    readiness.release_decision?.numerical_release_cap_applies === false &&
      readiness.release_decision?.elapsed_time_gate_applies === false,
    'readiness must not impose numerical or elapsed-time release blockers',
  );
  invariant(
    readiness.release_decision?.release_authorized === true,
    'program release must be authorized',
  );
  invariant(
    readiness.release_decision?.index_authorized === true,
    'program indexing must be authorized',
  );
  invariant(
    JSON.stringify(readiness.release_decision.vendor_inventory_snapshot?.by_status) ===
      JSON.stringify(EXPECTED.vendorSnapshot.by_status) &&
      readiness.release_decision.vendor_inventory_snapshot?.total === EXPECTED.vendorSnapshot.total,
    'readiness vendor snapshot disagrees with signed D11',
  );
  invariant(
    contentGeniusExport.list_item_count === EXPECTED.rawExportCount &&
      contentGeniusExport.unique_id_count === EXPECTED.rawExportCount &&
      contentGeniusExport.detail_found_count === EXPECTED.rawExportCount,
    'raw Content Genius export must contain 297 complete records',
  );
  invariant(contentGeniusExport.generation_triggered === false, 'raw export reports generation');
  invariant(
    contentGeniusExport.publish_or_schedule_triggered === false,
    'raw export reports publish/schedule activity',
  );
  const rawStatusCounts = countBy(contentGeniusExport.details, (record) => record.status);
  invariant(
    JSON.stringify(rawStatusCounts) ===
      JSON.stringify({ COMPLETED: 70, NEEDS_REVIEW: 198, NOT_BEGUN: 29 }),
    'raw Content Genius export status counts changed',
  );
  invariant(
    EXPECTED.rawExportCount + EXPECTED.canaryArtifactCount === EXPECTED.vendorSnapshot.total,
    'vendor snapshot composition arithmetic failed',
  );

  const rawDetailByUuid = new Map(
    contentGeniusExport.details.map((record) => [record.uuid, record]),
  );
  invariant(rawDetailByUuid.size === EXPECTED.rawExportCount, 'raw export UUIDs are not unique');
  const canaryRecords =
    readiness.searchatlas_evidence.content_genius_export.artifact_canary_records;
  validateCanarySnapshot(canaryRecords, rawDetailByUuid);
  const pilotManifestById = new Map(
    pilotManifest.articles.map((article) => [article.article_id, article]),
  );
  invariant(pilotManifestById.size === EXPECTED.batchSize, 'pilot manifest must contain 25 rows');

  const readinessById = new Map(readiness.rows.map((row) => [row.program_row_id, row]));
  const uniqueIds = new Set(runtimeArticles.map((row) => row.program_row_id));
  const uniqueSlugs = new Set(runtimeArticles.map((row) => row.canonical_slug));
  invariant(uniqueIds.size === EXPECTED.rowCount, 'program row ids must be unique');
  invariant(uniqueSlugs.size === EXPECTED.rowCount, 'canonical slugs must be unique');

  const batchAssignments = assignBatches(runtimeArticles);
  const row2Ledger = runtimeArticles.find((row) => row.pilot_article_id === 'MRX1000-PILOT-001-02');
  invariant(row2Ledger, 'pilot row 2 is missing from the canonical ledger');
  const row2Remediation = validateRow2RemediatedCandidate(optionalInputBytes, row2Ledger);
  const row2ReviewException = row2OrderedReviewException(optionalInputBytes, row2Remediation);
  const rows = runtimeArticles
    .slice()
    .sort(
      (a, b) =>
        batchAssignments.get(a.program_row_id).execution_sequence -
        batchAssignments.get(b.program_row_id).execution_sequence,
    )
    .map((ledgerRow) => {
      const readinessRow = readinessById.get(ledgerRow.program_row_id);
      invariant(readinessRow, `${ledgerRow.program_row_id} missing from readiness matrix`);
      invariant(
        readinessRow.slug === ledgerRow.canonical_slug &&
          readinessRow.title === ledgerRow.canonical_title,
        `${ledgerRow.program_row_id} ledger/readiness identity mismatch`,
      );

      const repo = repoEvidence(ledgerRow, readinessRow);
      const vendor = vendorJoin(ledgerRow, readinessRow, rawDetailByUuid, pilotManifestById);
      const assignment = batchAssignments.get(ledgerRow.program_row_id);
      const candidate = reviewCandidate(ledgerRow, readinessRow, repo, row2Remediation);
      const isRow2 = ledgerRow.pilot_article_id === 'MRX1000-PILOT-001-02';
      const orderedReviewException = isRow2 ? row2ReviewException : null;
      const reviews = makeReviewStages(candidate, orderedReviewException);
      const stops = stopConditions(candidate, vendor, orderedReviewException);

      return {
        program_row_id: ledgerRow.program_row_id,
        canonical_title: ledgerRow.canonical_title,
        canonical_slug: ledgerRow.canonical_slug,
        canonical_url: ledgerRow.canonical_url,
        pillar: ledgerRow.pillar,
        pillar_url: ledgerRow.pillar_url,
        cluster: ledgerRow.cluster,
        primary_keyword: ledgerRow.primary_keyword,
        authoritative_current_state: {
          canonical_inventory_state: ledgerRow.preservation_classification,
          normalized_status: ledgerRow.normalized_status,
          source_system: ledgerRow.source_system,
          pilot_article_id: ledgerRow.pilot_article_id,
          repo,
          planning_handles: {
            searchatlas_map_id: ledgerRow.searchatlas_map_id,
            searchatlas_title_uuid: ledgerRow.searchatlas_title_uuid,
            searchatlas_record_id_persisted_in_ledger: ledgerRow.searchatlas_record_id,
            content_genius_article_uuid_persisted_in_ledger: ledgerRow.content_genius_article_uuid,
            are_content_genius_article_creation_proof: false,
            evidence_boundary:
              'map_id/title_uuid are topical-map planning handles; pilot_article_id is a local manifest identity; none proves a Content Genius article UUID',
          },
          vendor_join: vendor,
          review_candidate: candidate,
        },
        searchatlas_execution: {
          ...assignment,
          action_needed: searchAtlasAction(ledgerRow, repo, vendor),
          execution_state: 'WAITING_FOR_IDENTITY_CONTENT_AND_REVIEW_GATES_NO_EXTERNAL_WRITE',
          execution_eligible_now: false,
          creation_needed_proven: false,
          searchatlas_created_claimed: false,
          external_write_performed: false,
          prerequisite_gates: {
            owner_decision_sha256_verified: true,
            program_release_authorization_observed: true,
            article_specific_quality_clearance_required: true,
            article_specific_quality_clearance_observed: false,
            read_only_quota_preflight_required_before_external_write: true,
            canonical_identity_reconciliation_required: true,
            checksummed_content_candidate_required_before_review: true,
            checksummed_content_candidate_present: candidate.checksummed_review_candidate_present,
            review_candidate_path_and_sha256_present: Boolean(
              candidate.path && candidate.source_sha256,
            ),
            review_readiness_evidence_verified: candidate.readiness_evidence_verified,
            compliance_seo_aeo_editorial_gates_required: true,
          },
          evidence: {
            preflight_evidence_path: null,
            preflight_sha256: null,
            vendor_action_receipt_path: null,
            vendor_action_receipt_sha256: null,
            resulting_content_genius_article_uuid: null,
            resulting_candidate_content_sha256: null,
            executed_at: null,
          },
        },
        ordered_llm_reviews: reviews,
        ordered_review_exception: orderedReviewException,
        review_gate: {
          required_order: (orderedReviewException ? ROW2_D12_REVIEW_SEQUENCE : LLM_SEQUENCE).map(
            (stage) => stage.key,
          ),
          next_stage:
            candidate.checksummed_review_candidate_present &&
            (!orderedReviewException || orderedReviewException.candidate_readiness.audit_ready_now)
              ? 'chatgpt'
              : null,
          any_verdict_recorded: false,
          all_required_verdicts_passed: false,
          sequence_complete: false,
          exact_claude_substitution_allowed: Boolean(orderedReviewException),
          exact_claude_substitution_scope: orderedReviewException
            ? 'D12_ROW2_ORDERED_INDEPENDENT_REVIEW_ONLY'
            : null,
        },
        release_index_eligibility: {
          decision_id: EXPECTED.ownerDecisionId,
          signed_artifact_sha256: EXPECTED.ownerDecisionSha256,
          authorization_cap_new_rows: null,
          numerical_release_cap_applies: false,
          elapsed_time_gate_applies: false,
          program_release_authorized: true,
          program_index_authorized: true,
          release_action_eligible_now: false,
          index_submission_eligible_now: false,
          sitemap_addition_eligible_now: false,
          currently_in_workspace_sitemap: Boolean(readinessRow.sitemap?.currently_included),
          production_live_verified_in_this_local_build: false,
          release_or_index_action_performed: false,
          exact_claude_opus_4_6_required_before_release_or_index_transition: true,
          release_or_index_model_substitution_allowed: false,
          reason_codes: [
            'ORDERED_LLM_REVIEWS_NOT_COMPLETE',
            'EXACT_CLAUDE_OPUS_4_6_UNAVAILABLE',
            'ARTICLE_SPECIFIC_QUALITY_CLEARANCE_NOT_COMPLETE',
            'NO_EXTERNAL_RELEASE_OR_INDEX_ACTION_PERFORMED',
          ],
        },
        stop_conditions: stops,
      };
    });

  const allVendorRecords = rows.flatMap(
    (row) => row.authoritative_current_state.vendor_join.records,
  );
  const aggregate = {
    total_rows: rows.length,
    unique_program_row_ids: new Set(rows.map((row) => row.program_row_id)).size,
    unique_canonical_slugs: new Set(rows.map((row) => row.canonical_slug)).size,
    batch_count: new Set(rows.map((row) => row.searchatlas_execution.batch_id)).size,
    by_batch: countBy(rows, (row) => row.searchatlas_execution.batch_id),
    by_canonical_inventory_state: countBy(
      rows,
      (row) => row.authoritative_current_state.canonical_inventory_state,
    ),
    by_searchatlas_action_needed: countBy(rows, (row) => row.searchatlas_execution.action_needed),
    repo_mdx_present: rows.filter((row) => row.authoritative_current_state.repo.mdx_exists).length,
    workspace_public_route_configured: rows.filter(
      (row) => row.authoritative_current_state.repo.workspace_public_route_configured,
    ).length,
    planning_searchatlas_map_id_count: rows.filter(
      (row) => row.authoritative_current_state.planning_handles.searchatlas_map_id != null,
    ).length,
    planning_searchatlas_title_uuid_count: rows.filter(
      (row) => row.authoritative_current_state.planning_handles.searchatlas_title_uuid != null,
    ).length,
    persisted_ledger_content_genius_article_uuid_count: rows.filter(
      (row) =>
        row.authoritative_current_state.planning_handles
          .content_genius_article_uuid_persisted_in_ledger != null,
    ).length,
    checksummed_review_candidate_rows: rows.filter(
      (row) =>
        row.authoritative_current_state.review_candidate.checksummed_review_candidate_present,
    ).length,
    rows_without_checksummed_review_candidate: rows.filter(
      (row) =>
        !row.authoritative_current_state.review_candidate.checksummed_review_candidate_present,
    ).length,
    by_review_candidate_state: countBy(
      rows,
      (row) => row.authoritative_current_state.review_candidate.state,
    ),
    pilot_workspace_qa_shell_rows: rows.filter(
      (row) =>
        row.authoritative_current_state.canonical_inventory_state === 'pilot_draft_noindex_stage' &&
        row.authoritative_current_state.repo.content_evidence?.explicit_qa_shell_without_final_copy,
    ).length,
    pilot_workspace_shells_marked_as_review_candidates: rows.filter(
      (row) =>
        row.authoritative_current_state.canonical_inventory_state === 'pilot_draft_noindex_stage' &&
        row.authoritative_current_state.review_candidate.workspace_mdx_is_review_candidate,
    ).length,
    pilot_rows_with_validated_distinct_review_candidate: rows.filter(
      (row) =>
        row.authoritative_current_state.canonical_inventory_state === 'pilot_draft_noindex_stage' &&
        row.authoritative_current_state.review_candidate.checksummed_review_candidate_present,
    ).length,
    vendor_exact_title_match_rows: rows.filter(
      (row) => row.authoritative_current_state.vendor_join.match_count > 0,
    ).length,
    vendor_unambiguous_candidate_rows: rows.filter(
      (row) => row.authoritative_current_state.vendor_join.match_count === 1,
    ).length,
    vendor_ambiguous_candidate_rows: rows.filter(
      (row) => row.authoritative_current_state.vendor_join.match_count > 1,
    ).length,
    vendor_exact_title_candidate_records: allVendorRecords.length,
    unique_vendor_exact_title_candidate_uuids: new Set(
      allVendorRecords.map((record) => record.article_uuid),
    ).size,
    vendor_candidate_records_reverified_against_source: allVendorRecords.filter(
      (record) => record.vendor_record_evidence_verified_now,
    ).length,
    artifact_bound_content_genius_uuid_rows: rows.filter(
      (row) =>
        row.authoritative_current_state.vendor_join
          .content_genius_article_uuid_proven_for_canonical_row != null,
    ).length,
    rows_with_any_llm_verdict: rows.filter((row) => row.review_gate.any_verdict_recorded).length,
    rows_with_all_required_llm_verdicts_passed: rows.filter(
      (row) => row.review_gate.all_required_verdicts_passed,
    ).length,
    row2_ordered_review_exception_rows: rows.filter((row) => row.ordered_review_exception != null)
      .length,
    row2_ordered_review_exception_dispatch_eligible_now: rows.filter(
      (row) => row.ordered_review_exception?.dispatch_eligible_now,
    ).length,
    row2_ordered_review_audit_ready_now: rows.filter(
      (row) => row.ordered_review_exception?.candidate_readiness.audit_ready_now,
    ).length,
    release_action_eligible_now: rows.filter(
      (row) => row.release_index_eligibility.release_action_eligible_now,
    ).length,
    index_submission_eligible_now: rows.filter(
      (row) => row.release_index_eligibility.index_submission_eligible_now,
    ).length,
    searchatlas_created_claim_count: rows.filter(
      (row) => row.searchatlas_execution.searchatlas_created_claimed,
    ).length,
    external_write_performed_count: rows.filter(
      (row) => row.searchatlas_execution.external_write_performed,
    ).length,
  };

  invariant(aggregate.total_rows === EXPECTED.rowCount, 'output row count must be 1,000');
  invariant(aggregate.batch_count === EXPECTED.batchCount, 'output must have 40 batches');
  invariant(
    Object.values(aggregate.by_batch).every((count) => count === EXPECTED.batchSize),
    'every batch must contain exactly 25 rows',
  );
  invariant(
    rows.every((row, index) => row.searchatlas_execution.execution_sequence === index + 1),
    'manifest rows must be physically ordered by execution_sequence',
  );
  invariant(
    aggregate.repo_mdx_present === 153 &&
      aggregate.by_canonical_inventory_state.live_public_published_route === 79 &&
      aggregate.by_canonical_inventory_state.incumbent_draft_nonpublic_held === 49 &&
      aggregate.by_canonical_inventory_state.pilot_draft_noindex_stage === 25 &&
      aggregate.by_canonical_inventory_state.planning_only_inventory === 847,
    'runtime publication projection must be 79 + 49 + 25 + 847',
  );
  invariant(
    aggregate.planning_searchatlas_map_id_count === 294 &&
      aggregate.planning_searchatlas_title_uuid_count === 269 &&
      aggregate.persisted_ledger_content_genius_article_uuid_count === 0,
    'planning-handle / persisted-UUID evidence boundary changed',
  );
  invariant(
    aggregate.checksummed_review_candidate_rows === 128 + Number(row2Remediation.validated) &&
      aggregate.rows_without_checksummed_review_candidate ===
        872 - Number(row2Remediation.validated) &&
      aggregate.pilot_workspace_qa_shell_rows === 25 &&
      aggregate.pilot_workspace_shells_marked_as_review_candidates === 0 &&
      aggregate.pilot_rows_with_validated_distinct_review_candidate ===
        Number(row2Remediation.validated),
    `review-candidate safety partition disagrees with substantive workspace and validated row-2 evidence: checksummed=${aggregate.checksummed_review_candidate_rows}, without=${aggregate.rows_without_checksummed_review_candidate}, pilot_shells=${aggregate.pilot_workspace_qa_shell_rows}, pilot_candidates=${aggregate.pilot_workspace_shells_marked_as_review_candidates}, validated_row2=${Number(row2Remediation.validated)}`,
  );
  invariant(
    aggregate.vendor_exact_title_match_rows === 153 &&
      aggregate.vendor_unambiguous_candidate_rows === 147 &&
      aggregate.vendor_ambiguous_candidate_rows === 6 &&
      aggregate.vendor_exact_title_candidate_records === 160 &&
      aggregate.unique_vendor_exact_title_candidate_uuids === 160 &&
      aggregate.vendor_candidate_records_reverified_against_source === 160 &&
      aggregate.artifact_bound_content_genius_uuid_rows === 2,
    'Content Genius exact-title reconciliation counts changed',
  );
  invariant(
    aggregate.rows_with_any_llm_verdict === 0 &&
      aggregate.release_action_eligible_now === 0 &&
      aggregate.index_submission_eligible_now === 0 &&
      aggregate.searchatlas_created_claim_count === 0 &&
      aggregate.external_write_performed_count === 0,
    'fail-closed/no-overclaim invariants failed',
  );
  invariant(
    aggregate.row2_ordered_review_exception_rows === 1 &&
      aggregate.row2_ordered_review_exception_dispatch_eligible_now === 0 &&
      aggregate.row2_ordered_review_audit_ready_now === 1 &&
      rows.find((row) => row.ordered_review_exception)?.authoritative_current_state
        .pilot_article_id === 'MRX1000-PILOT-001-02',
    'D12 ordered-review exception must exist only on row 2 and remain undispatchable',
  );
  invariant(
    rows
      .filter((row) => row.authoritative_current_state.pilot_article_id !== 'MRX1000-PILOT-001-02')
      .every(
        (row) =>
          row.ordered_review_exception == null &&
          row.review_gate.exact_claude_substitution_allowed === false &&
          row.review_gate.required_order.join('|') ===
            LLM_SEQUENCE.map((stage) => stage.key).join('|'),
      ),
    'D12 row-2 exception leaked to another manifest row',
  );
  invariant(
    rows.every(
      (row) =>
        row.release_index_eligibility.authorization_cap_new_rows == null &&
        row.release_index_eligibility.numerical_release_cap_applies === false &&
        row.release_index_eligibility.elapsed_time_gate_applies === false &&
        row.release_index_eligibility.program_release_authorized === true &&
        row.release_index_eligibility
          .exact_claude_opus_4_6_required_before_release_or_index_transition === true &&
        row.release_index_eligibility.release_or_index_model_substitution_allowed === false,
    ),
    'owner release authority or exact-Opus review contract was weakened',
  );

  const inputEvidence = Object.fromEntries(
    Object.entries(INPUTS).map(([key, file]) => {
      const evidenceBytes =
        key === 'readiness' ? readinessEvidenceBytes(inputBytes[key]) : inputBytes[key];
      return [
        key,
        {
          path: rel(file),
          sha256: sha256(evidenceBytes),
          bytes: inputBytes[key].length,
          ...(key === 'readiness'
            ? {
                sha256_method: 'canonical_json_with_top_level_generated_at_masked',
                generated_at_excluded_from_sha256: true,
              }
            : {}),
        },
      ];
    }),
  );
  for (const [key, file] of Object.entries(OPTIONAL_INPUTS)) {
    const bytes = optionalInputBytes[key];
    inputEvidence[key] = {
      path: rel(file),
      present: Boolean(bytes),
      sha256: bytes ? sha256(bytes) : null,
      bytes: bytes?.length || 0,
    };
  }
  const snapshotAt = [
    ledger.generated_at,
    contentGeniusExport.exported_at,
    '2026-07-20T08:25:37.000Z',
  ]
    .filter(Boolean)
    .sort()
    .at(-1);

  const manifestCore = {
    program: 'MRX1000',
    artifact_type: 'searchatlas_ordered_llm_local_execution_manifest',
    generated_at: snapshotAt,
    deterministic: true,
    local_only: true,
    external_services_called: false,
    external_writes_performed: false,
    inputs: inputEvidence,
    release_gate: {
      decision_id: EXPECTED.ownerDecisionId,
      signed_artifact: rel(INPUTS.ownerDecision),
      signed_artifact_sha256: EXPECTED.ownerDecisionSha256,
      signed_artifact_sha256_verified: true,
      signed_disposition: EXPECTED.ownerDecisionDisposition,
      authorization_cap_new_rows: null,
      numerical_release_cap_applies: false,
      elapsed_time_gate_applies: false,
      release_authorized: true,
      index_authorized: true,
      vendor_inventory_snapshot: {
        source: 'historical_signed_D-2026-0720-11_capacity_baseline_not_release_authority',
        ...EXPECTED.vendorSnapshot,
        composition: {
          raw_content_genius_export_records: EXPECTED.rawExportCount,
          separately_validated_canary_artifacts: EXPECTED.canaryArtifactCount,
          arithmetic_verified: true,
        },
        meaning:
          'Vendor inventory only; not a canonical-row, created-article, public-live, release, or index count.',
      },
    },
    model_gate: {
      required_order: LLM_SEQUENCE,
      exact_claude_model_id: EXPECTED.exactClaudeModelId,
      exact_claude_available: false,
      exact_claude_availability_source: rel(INPUTS.claudeFramework),
      substitution_allowed: false,
      applies_to_every_release_or_index_transition: true,
      applies_to_every_row_outside_d12_ordered_review_exception: true,
      google_label_correction: {
        incorrect_source_label: 'Google Demini',
        canonical_machine_key: 'google_gemini',
        canonical_display_name: 'Google Gemini',
      },
    },
    ordered_review_policy: {
      default_sequence: LLM_SEQUENCE,
      default_exact_claude_substitution_allowed: false,
      row2_exception: {
        decision_id: row2ReviewException.decision_id,
        decision_sha256: row2ReviewException.decision_sha256,
        corrected_by_decision_id: row2ReviewException.corrected_by_decision_id,
        correction_sha256: row2ReviewException.correction_sha256,
        recovery_decision_id: row2ReviewException.recovery_decision_id,
        recovery_decision_sha256: row2ReviewException.recovery_decision_sha256,
        target_pilot_article_id: row2ReviewException.target_pilot_article_id,
        sequence: ROW2_D12_REVIEW_SEQUENCE,
        scope: row2ReviewException.scope,
        dispatch_eligible_now: row2ReviewException.dispatch_eligible_now,
        audit_ready_now: row2ReviewException.candidate_readiness.audit_ready_now,
        exception_does_not_change_release_index_model_gate: true,
      },
    },
    policy: {
      batch_size: EXPECTED.batchSize,
      pilot_batch_first: true,
      emitted_rows_sorted_by_execution_sequence: true,
      remaining_rows_sorted_by_program_row_id: true,
      planning_handles_are_content_genius_creation_proof: false,
      normalized_exact_title_match_is_canonical_binding_proof: false,
      artifact_bound_canary_identity_may_prove_row_uuid_binding: true,
      llm_review_order_must_be_preserved: true,
      exact_model_id_must_be_recorded_at_each_review: true,
      workspace_mdx_existence_alone_is_review_candidate_proof: false,
      review_candidate_requires_path_sha_and_readiness_evidence: true,
      pilot_qa_shell_is_never_a_review_candidate: true,
      all_actions_fail_closed_under_current_gates: true,
    },
    aggregate,
    rows,
  };
  const contentFingerprint = sha256(stableJson(manifestCore));
  return { ...manifestCore, content_fingerprint_sha256: contentFingerprint };
}

export async function writeManifest() {
  const manifest = buildManifest();
  const json = stableJson(manifest);
  const csv = buildCsv(manifest.rows);
  const report = buildReport(manifest);
  await Promise.all([
    mkdir(path.dirname(OUTPUTS.json), { recursive: true }),
    mkdir(path.dirname(OUTPUTS.report), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(OUTPUTS.json, json),
    writeFile(OUTPUTS.csv, csv),
    writeFile(OUTPUTS.report, report),
  ]);
  return {
    manifest,
    output_sha256: {
      json: sha256(json),
      csv: sha256(csv),
      report: sha256(report),
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await writeManifest();
  console.log(
    JSON.stringify(
      {
        outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, file]) => [key, rel(file)])),
        rows: result.manifest.aggregate.total_rows,
        batches: result.manifest.aggregate.batch_count,
        vendor_snapshot: result.manifest.release_gate.vendor_inventory_snapshot,
        content_fingerprint_sha256: result.manifest.content_fingerprint_sha256,
        output_sha256: result.output_sha256,
        external_writes_performed: result.manifest.external_writes_performed,
      },
      null,
      2,
    ),
  );
}
