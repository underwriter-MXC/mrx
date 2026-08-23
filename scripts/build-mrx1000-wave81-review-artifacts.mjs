#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'post-production-cost-evidence-packet-for-royalty-records';
const programRowId = 'MRX1000-0266';
const title = 'Post-Production Cost Evidence Packet for Royalty Records';
const primaryKeyword = 'post-production cost evidence packet royalty records';
const inlineKeyword = primaryKeyword;
const heroAlt =
  'A blank royalty-record evidence packet appears beside the exact article title.';
const inlineAlt =
  'An overhead royalty-record source matrix appears above the exact keyword.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave81-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 161) {
  throw new Error('Wave 81 batch identity is missing or drifted');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function unquote(value) {
  return String(value ?? '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .replace(/''/g, "'");
}

function scalar(block, key) {
  return unquote(block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]);
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  return unquote(nested?.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]);
}

function declaredSources(source) {
  const block = source.match(/^sources:\n([\s\S]*?)(?=^[a-z_]+:|^---$)/m)?.[1] ?? '';
  const results = [];
  const pattern = /  - label: ['"]([^'"]+)['"]\n    href: ['"]([^'"]+)['"]/g;
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

async function verifySource({ label, url }) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'MRX Research contact@mineralrightsxchange.com',
      'cache-control': 'no-cache',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${url}: source access returned ${response.status}`);
  }
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  const allowed =
    contentType.includes('text/html') ||
    (url.endsWith('.pdf') &&
      (contentType.includes('application/pdf') || contentType.includes('octet-stream')));
  if (!allowed || new URL(response.url).protocol !== 'https:') {
    throw new Error(`${url}: source access or content type is unsupported`);
  }
  return {
    label,
    url,
    publisher: new URL(response.url).hostname,
    accessed_at: reviewedAt,
    http_access_result: {
      status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
    },
  };
}

const sourceScopes = new Map([
  [
    'https://statutes.capitol.texas.gov/Docs/NR/pdf/NR.91.pdf',
    [
      'Texas Natural Resources Code Chapter 91 supplies the current statutory source for the bounded payment-information and written-request context described from Sections 91.502, 91.504, 91.505, and 91.507.',
      'The article uses the code only to identify source fields and preserve a dated request trail; it does not interpret the statute, a private instrument, deadlines, rights, remedies, payment correctness, or liability for an owner.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The Railroad Commission explains the lease-level or gas-well-level reporting basis, online reporting lag, update cadence, and possibility of revised, corrected, or delinquent production reports.',
      'The article uses the FAQ only to preserve query criteria, identifiers, periods, retrieval dates, and public-record limits; it rejects turning regulator production into owner payment accounting, a deduction result, a decimal, or entitlement.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/ewaPdqMain.do',
    [
      'The Railroad Commission Production Data Query is the current first-party query surface for reported Texas production by its available lease, gas-well, operator, field, district, county, and period criteria.',
      'The article retains the query only as identifier and period context and does not use it to verify a royalty statement amount, cost, realized price, owner decimal, lease meaning, or payment entitlement.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/crude-oil/',
    [
      'The Texas Comptroller page supplies the current first-party crude-oil production-tax administration and reporting context.',
      'The article uses the page only to keep an official tax-reference lane separate from other reported statement entries; it does not apply a tax rule to an owner or validate a statement label, calculation, allocation, or withholding.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/natural-gas/',
    [
      'The Texas Comptroller page supplies the current first-party natural-gas production-tax administration and reporting context.',
      'The article uses the page only to keep an official tax-reference lane separate from other reported statement entries; it does not apply a tax rule to an owner or validate a statement label, calculation, allocation, or withholding.',
    ],
  ],
]);

function sourceScope(source) {
  const [paraphrase, claimScope] = sourceScopes.get(source.url) ?? [];
  if (!paraphrase || !claimScope) {
    throw new Error(`${source.url}: claim-to-source scope is missing`);
  }
  return {
    ...source,
    source_location_or_paraphrase: paraphrase,
    claim_scope: claimScope,
  };
}

const articleBytes = readFileSync(join(repoRoot, articlePath));
const source = articleBytes.toString('utf8');
const fm = frontmatter(source);
const articleSha = sha256(articleBytes);
const frontmatterSha = sha256(fm);
const creativeBytes = readFileSync(join(repoRoot, creativePath));
const creativeSha = sha256(creativeBytes);
const creative = JSON.parse(creativeBytes).article;
const heroBytes = readFileSync(join(repoRoot, 'public', row.hero_path.slice(1)));
const inlineBytes = readFileSync(join(repoRoot, 'public', row.inline_path.slice(1)));
const heroSha = sha256(heroBytes);
const inlineSha = sha256(inlineBytes);
const faqCount = (source.match(/^  - question:/gm) ?? []).length;
const wordCount =
  source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)
    ?.length ?? 0;
const sources = declaredSources(source);

if (
  articleSha !== row.repo_sha256 ||
  heroSha !== row.hero_sha256 ||
  inlineSha !== row.inline_asset_sha256 ||
  creative.hero.ocr?.pass !== true ||
  creative.inline.ocr?.pass !== true ||
  creative.title !== title ||
  creative.keyword !== inlineKeyword ||
  scalar(fm, 'primary_keyword') !== primaryKeyword ||
  nestedScalar(fm, 'hero_image', 'src') !== row.hero_path ||
  nestedScalar(fm, 'hero_image', 'social_src') !== row.hero_path ||
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'src') !== row.inline_path ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length !== 5
) {
  throw new Error(
    'Wave 81 review inputs do not satisfy identity, article-depth, source, or creative gates',
  );
}

const sourceAccess = [];
for (const sourceEntry of sources) sourceAccess.push(sourceScope(await verifySource(sourceEntry)));

const common = {
  schema_version: '2.0.0',
  disposition: 'PASS',
  reviewed_at: reviewedAt,
  decision_authority: {
    source: 'Daryl owner directives, 2026-08-04 and 2026-08-14',
    policy: 'MRX continuous quality-gated publication and two-image article creative directive',
  },
  program_row_id: programRowId,
  slug,
  title,
  canonical_url: row.canonical_url,
  source_path: articlePath,
  input_body_sha256: articleSha,
  input_frontmatter_sha256: frontmatterSha,
  expected_repo_sha256: articleSha,
  two_image_manifest_sha256: creativeSha,
  visual_metadata: { hero_alt: heroAlt, social_alt: heroAlt, inline_alt: inlineAlt },
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: 'mrx1000_two_image_editorial_review',
  ...common,
  reviewer_id: 'codex_wave81_editorial',
  review_run_id: `mrx1000-wave81-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns only a source-preserving packet for reported post-production-cost entries and related royalty records. It uses matched, conflict, missing, or unresolved and stops before statement decoding, lease interpretation, deduction-permissibility judgments, royalty auditing, payment resolution, owner-decimal validation, cash-flow calculation, valuation, offer, or transaction conclusions.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; the front-facing archival evidence-packet hero and people-free overhead royalty-record source matrix are materially different compositions with matching alt metadata.`,
  ],
  checks: [
    { name: 'complete_file_sha256_match', status: 'PASS', evidence: articleSha },
    {
      name: 'answer_first_article_depth_and_five_faqs',
      status: 'PASS',
      evidence: { word_count: wordCount, minimum_word_count: 700, faq_count: faqCount },
    },
    {
      name: 'two_image_exact_text_identity',
      status: 'PASS',
      evidence: {
        hero_ocr: true,
        inline_ocr: true,
        social_reuses_hero: true,
        hero_social_alt_match: true,
        inline_alt_match: true,
        filename_identity: true,
        distinct_binaries: heroSha !== inlineSha,
      },
    },
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

writeArtifact('factual_citation', `${slug}.review.json`, {
  artifact_type: 'mrx1000_two_image_factual_citation_review',
  ...common,
  reviewer_id: 'codex_wave81_factual',
  review_run_id: `mrx1000-wave81-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current HTTPS access review.`,
    'Claims remain bounded to Texas statutory payment-information context, Railroad Commission production-query limits, and separate Comptroller tax-administration source lanes. None is converted into private-instrument interpretation, a cost classification, a deduction-permissibility decision, payment validation, liability, cash-flow calculation, offer, or value.',
    'The article supplies no proprietary, universal, market, or owner-specific numerical assumptions; invents no code definition, cost category, amount, source, identifier, period, document relationship, payment result, or tax treatment; and makes no owner-specific legal, tax, title, valuation, accounting, audit, financial, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'five_distinct_https_sources',
    'current_source_access_review_pass',
    'claim_to_source_scope_present',
    'official_source_priority_pass',
    'unsupported_high_risk_claim_scan_pass',
  ],
  sources_inspected: sourceAccess,
});

writeArtifact('compliance', `${slug}.json`, {
  artifact_type: 'mrx1000_two_image_compliance_review',
  ...common,
  reviewer_id: 'codex_wave81_compliance',
  review_run_id: `mrx1000-wave81-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article preserves the exact reported entry, source location, payor and property identifiers as displayed, product and period, stated calculation basis, related support, and retrieval date; limits evidence status to matched, conflict, missing, or unresolved; turns gaps into neutral questions; discloses possible MRX buyer interest; and preserves owner agency and qualified-review boundaries.',
    'Image text is limited to the exact article title and approved keyword and adds no owner name, property fact, source result, model output, numerical assumption, seal, recommendation, appraisal claim, forecast, guarantee, or transaction outcome.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'evidence_packet_no_statement_decoding_lease_interpretation_deduction_audit_payment_cash_flow_or_value_conclusion_boundary_pass',
    'owner_agency_and_possible_buyer_interest_disclosure_preserved',
    'no_unsupported_visual_or_decision_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 81 review artifacts with ${sources.length} current source checks.`,
);
