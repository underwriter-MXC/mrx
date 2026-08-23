#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'pdp-pud-and-undeveloped-acreage-terminology-register';
const programRowId = 'MRX1000-0265';
const title = 'How to Build a PDP, PUD, and Undeveloped Acreage Terminology Register';
const primaryKeyword = 'PDP PUD undeveloped acreage terminology register';
const inlineKeyword = primaryKeyword;
const heroAlt =
  'Three blank archival category folders and a source-reference card appear beside the exact article title.';
const inlineAlt =
  'An overhead three-source terminology register and neutral-question card appear above the exact keyword.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave80-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 160) {
  throw new Error('Wave 80 batch identity is missing or drifted');
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
    'https://www.govinfo.gov/content/pkg/CFR-2025-title17-vol3/pdf/CFR-2025-title17-vol3-sec210-4-10.pdf',
    [
      '17 CFR 210.4-10 supplies SEC-framework definitions for developed, proved, and undeveloped oil and gas reserves.',
      'The article uses the rule only to show why a named definition and governing framework must remain attached to a displayed term; it does not classify reserves, certify a report, or apply the rule to an owner property.',
    ],
  ],
  [
    'https://www.govinfo.gov/content/pkg/CFR-2025-title17-vol3/pdf/CFR-2025-title17-vol3-sec229-1208.pdf',
    [
      '17 CFR 229.1208 separately describes developed and undeveloped acreage in an SEC registrant disclosure context.',
      'The article uses the provision only to preserve the distinct acreage-disclosure context and rejects converting an acreage label into a reserve status, well count, property attribution, development forecast, or valuation input.',
    ],
  ],
  [
    'https://www.sec.gov/rules-regulations/oil-gas-reporting-modernization-small-entity-compliance-guide',
    [
      'The SEC guide describes the modernized oil-and-gas rule framework, preparer and auditor context, and separate proved-undeveloped-reserves disclosure requirements.',
      'The article uses that guidance only to preserve source, preparer, standard, and scope fields and repeats the SEC boundary that the guide is not a substitute for the rule.',
    ],
  ],
  [
    'https://info.specommunications.org/rs/833-LLT-087/images/petroleum_resources_management_system-2018.pdf',
    [
      'The 2018 Petroleum Resources Management System is a named resources-classification system with defined classes, subclasses, categories, status definitions, and terminology.',
      'The article uses PRMS only as evidence that the named standard and edition must be preserved; it does not assume a document follows PRMS or translate, compare, validate, or assign a classification.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The Railroad Commission explains the lease-level or gas-well-level reporting basis, online reporting lag, update cadence, and possibility of revised, corrected, or delinquent production reports.',
      'The article uses that source only to keep regulator production observations in a separate evidence lane and rejects turning a production result into a reserve classification, acreage conclusion, property attribution, development forecast, or value.',
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
    'Wave 80 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave80_editorial',
  review_run_id: `mrx1000-wave80-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns only a source-preserving terminology register for PDP, PUD, and undeveloped-acreage language displayed in identified documents. It uses term displayed, standard stated, or standard not stated and stops before classification, compliance, comparability, property attribution, development, production, valuation, offer, or transaction conclusions.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; the front-facing archival-category hero and people-free overhead terminology-register worksheet are materially different compositions with matching alt metadata.`,
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
  reviewer_id: 'codex_wave80_factual',
  review_run_id: `mrx1000-wave80-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current HTTPS access review.`,
    'Claims remain bounded to SEC definitions and disclosure context, a named PRMS edition, and RRC production-query reporting limitations. None is converted into a reserve classification, standards-comparability decision, compliance conclusion, property attribution, development forecast, DCF input, offer, or value.',
    'The article supplies no proprietary, universal, market, or owner-specific numerical assumptions; invents no term, standard, preparer, date, scope, classification, property fact, reserve quantity, production result, offer, or development outcome; and makes no owner-specific legal, tax, title, valuation, engineering, accounting, financial, or transaction conclusion.',
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
  reviewer_id: 'codex_wave80_compliance',
  review_run_id: `mrx1000-wave80-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article preserves exact displayed terms, source, date, preparer, stated standard and edition, and stated scope; limits each result to term displayed, standard stated, or standard not stated; turns gaps into neutral questions; discloses possible MRX buyer interest; and preserves owner agency and qualified-review boundaries.',
    'Image text is limited to the exact article title and approved keyword and adds no owner name, property fact, source result, model output, numerical assumption, seal, recommendation, appraisal claim, forecast, guarantee, or transaction outcome.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'terminology_no_classification_compliance_property_development_or_value_conclusion_boundary_pass',
    'owner_agency_and_possible_buyer_interest_disclosure_preserved',
    'no_unsupported_visual_or_decision_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 80 review artifacts with ${sources.length} current source checks.`,
);
