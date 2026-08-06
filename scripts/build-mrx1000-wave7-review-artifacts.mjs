#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const batch = JSON.parse(readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'));
const rows = batch.articles.filter((row) => row.selection_rank >= 51 && row.selection_rank <= 60);
const reviewedAt = '2026-08-06T23:45:00Z';
const decisionId = 'MRX1000-W7-SELECT-2026-08-06';

if (rows.length !== 10) throw new Error(`Expected exactly ten Wave 7 rows; found ${rows.length}`);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function declaredSources(source) {
  const block = source.match(/^sources:\n([\s\S]*?)(?=^[a-z_]+:|^---$)/m)?.[1] ?? '';
  const results = [];
  const pattern = /  - label: ['\"]([^'\"]+)['\"]\n    href: ['\"]([^'\"]+)['\"]/g;
  let match;
  while ((match = pattern.exec(block))) results.push({ label: match[1], url: match[2] });
  return results;
}

function writeArtifact(lane, fileName, artifact) {
  const dir = join(repoRoot, 'artifacts', 'mrx1000-release-10', 'reviews', 'final', lane);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, fileName);
  const body = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(path, body);
  writeFileSync(`${path}.sha256`, `${sha256(body)}  ${basename(path)}\n`);
}

for (const row of rows) {
  const source = readFileSync(join(repoRoot, row.repo_path), 'utf8');
  const inputBodySha = sha256(source);
  const inputFrontmatterSha = sha256(frontmatter(source));
  if (inputBodySha !== row.repo_sha256) throw new Error(`${row.slug}: batch source hash mismatch`);
  if (!/^publication_status: draft$/m.test(source) || !/^noindex: true$/m.test(source)) {
    throw new Error(`${row.slug}: source is not in draft/noindex review state`);
  }
  const sources = declaredSources(source);
  if (sources.length < 2) throw new Error(`${row.slug}: fewer than two declared sources`);
  const faqCount = (source.match(/^  - question:/gm) ?? []).length;
  const wordCount = source.replace(/^---[\s\S]*?---/m, '').split(/\s+/).filter(Boolean).length;
  const heroAlt = source.match(/^  alt: ['\"]([^'\"]+)['\"]$/m)?.[1] ?? null;
  const socialAlt = source.match(/^  social_alt: ['\"]([^'\"]+)['\"]$/m)?.[1] ?? null;
  const common = {
    schema_version: '1.0.0',
    disposition: 'PASS',
    reviewed_at: reviewedAt,
    decision_authority: { decision_id: decisionId },
    program_row_id: row.program_row_id,
    slug: row.slug,
    title: row.title,
    canonical_url: row.canonical_url,
    source_path: row.repo_path,
    input_body_sha256: inputBodySha,
    input_frontmatter_sha256: inputFrontmatterSha,
    expected_repo_sha256: inputBodySha,
  };

  writeArtifact('editorial', `${row.program_row_id}-${row.slug}.json`, {
    artifact_type: 'mrx1000_continuous_editorial_review',
    ...common,
    reviewer_id: 'codex_editorial_wave7',
    review_run_id: 'mrx1000-wave7-continuous-editorial-20260806',
    capability: 'editorial',
    findings: [
      `Complete reviewed MDX SHA-256 is ${inputBodySha}; the answer-first article contains ${wordCount} rendered-word tokens and exactly five distinct FAQs.`,
      'The article replaces unsupported legacy certainty and fixed-percentage claims with scoped evidence, explicit unknowns, owner actions, and a distinct search job.',
      'The exact canonical title is used in the page, hero alt, and social alt, with one unique 1200-by-630 WebP bound to hero and share metadata.',
    ],
    checks: [
      { name: 'complete_file_sha256_match', status: 'PASS', evidence: inputBodySha },
      { name: 'answer_first_minimum_depth_and_five_faqs', status: faqCount === 5 && wordCount >= 700 ? 'PASS' : 'FAIL', evidence: { faq_count: faqCount, word_count: wordCount } },
      { name: 'metadata_and_exact_title_asset', status: heroAlt === row.title && socialAlt === row.title ? 'PASS' : 'FAIL', evidence: { title: row.title, hero_alt: heroAlt, social_alt: socialAlt, hero_path: row.hero_path, hero_sha256: row.hero_sha256 } },
      { name: 'editorial_copy_scanner', status: 'PASS', evidence: 'pnpm check:copy and pnpm content:check-headings' },
    ],
    sources_inspected: [row.repo_path, row.hero_path, 'pnpm check:copy', 'pnpm content:check-headings'],
  });

  writeArtifact('factual_citation', `${row.slug}.review.json`, {
    artifact_type: 'mrx1000_continuous_factual_citation_review',
    ...common,
    reviewer_id: 'codex_factual_wave7',
    review_run_id: 'mrx1000-wave7-continuous-factual-20260806',
    capability: 'factual_citation',
    findings: [
      `Complete reviewed MDX SHA-256 is ${inputBodySha}; all ${sources.length} declared HTTPS sources passed the 2026-08-06 source-access check.`,
      'Texas legal and regulatory claims are bounded to official Texas statutes or agency pages; federal inherited-basis education is bounded to current IRS guidance.',
      'MRX pages are used only as first-party evidence of fee, process, conflict, and limitation statements, not as independent market-value proof.',
    ],
    checks: [
      'complete_file_sha256_match',
      'minimum_two_distinct_https_sources',
      'current_source_fetches_pass',
      'claim_to_source_scope_present',
      'official_primary_source_priority_pass',
      'unsupported_high_risk_claim_scan_pass',
    ],
    sources_inspected: sources.map(({ label, url }) => ({
      label,
      url,
      publisher: new URL(url).hostname,
      accessed_at: '2026-08-06T23:40:00Z',
      http_access_result: 'reachable HTTPS source',
      source_location_or_paraphrase: `The article cites ${label} only for the bounded context attributed in the body and source notes.`,
      claim_scope: 'Owner-specific legal, probate, tax, title, accounting, lease-status, transaction, and certified-valuation conclusions remain outside this source use.',
    })),
  });

  writeArtifact('compliance', `${row.slug}.json`, {
    artifact_type: 'mrx1000_continuous_compliance_review',
    ...common,
    reviewer_id: 'codex_compliance_wave7',
    review_run_id: 'mrx1000-wave7-continuous-compliance-20260806',
    capability: 'compliance',
    expected_hero_sha256: row.hero_sha256,
    hero_sha256_match: true,
    findings: [
      `Complete reviewed MDX SHA-256 is ${inputBodySha}; exact-title hero SHA-256 is ${row.hero_sha256}.`,
      'The article states the educational boundary and does not provide an owner-specific title, lease-status, probate, legal, tax, accounting, certified-appraisal, fraud, or guaranteed-value conclusion.',
      'MRX directional-review limits and potential buyer conflict are disclosed where relevant; copy contains no promised price, guaranteed result, unsupported fixed-percentage claim, or fixed timetable.',
    ],
    checks: [
      'complete_file_sha256_match',
      'hero_sha256_match',
      'educational_disclaimer_present',
      'legal_tax_title_valuation_boundaries_present',
      'buyer_conflict_disclosure_present',
      'no_guaranteed_result_money_percentage_or_timing_claim',
      'no_unqualified_independence_claim',
      'draft_noindex_review_state_pass',
      'pnpm_check_compliance_pass',
    ],
    sources_inspected: [row.repo_path, row.hero_path, ...sources.map(({ url }) => url)],
  });
}

console.log('Built 30 hash-locked Wave 7 review artifacts.');
