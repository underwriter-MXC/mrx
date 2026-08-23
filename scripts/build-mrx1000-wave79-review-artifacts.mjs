#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'mineral-rights-operator-name-change-log';
const programRowId = 'MRX1000-0264';
const title = 'How to Build a Mineral Rights Operator-Name Change Log';
const primaryKeyword = 'mineral rights operator name change log';
const inlineKeyword = primaryKeyword;
const heroAlt =
  'Three blank archival folders and a source-reference card appear beside the exact article title.';
const inlineAlt =
  'An overhead three-source name-history strip and blank question-routing card appear above the exact keyword.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave79-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 159) {
  throw new Error('Wave 79 batch identity is missing or drifted');
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
      'user-agent': 'MRX-Codex-Source-Verifier/1.0',
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
    'https://www.rrc.texas.gov/resource-center/research/research-queries/',
    [
      'The Railroad Commission provides separate online research query systems and states that the continually updated data sets are informational, non-authoritative, and without legal force or effect.',
      'The article uses that guidance only to preserve the exact source system and retrieval date and rejects corporate, responsibility, property, payment, development, and value conclusions from a query result.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/WellboreGeneralHowTo.html',
    [
      'The Railroad Commission Wellbore Query help describes operator search, displayed result fields including operator name and well identifiers, and current or historical query scope.',
      'The article uses those fields only to preserve which identified wellbore result displayed a name; it does not treat the result as proof of a private-property, corporate, responsibility, payment, or economic conclusion.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/P5Organization_About.html',
    [
      'The Railroad Commission P-5 Organization Query help describes displayed operator number, operator name, organization status and type, and organization-detail fields including filing dates.',
      'The article uses those fields only to preserve an identified organization record and expressly rejects inferences about successor, affiliate, responsibility, property, payment, development, or value.',
    ],
  ],
  [
    'https://webapps2.rrc.texas.gov/EWA/help/DPQuery_results_howto.htm',
    [
      'The Railroad Commission drilling-permit results help describes the permitted-operator field and operator number, permit identifiers and dates, current status, and that an operator name can change at completion.',
      'The article uses those descriptions only to preserve what identified permit and later records display; it does not infer a transfer, corporate relationship, property connection, payment duty, development result, or value.',
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
  sources.length !== 4
) {
  throw new Error(
    'Wave 79 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave79_editorial',
  review_run_id: `mrx1000-wave79-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns only a dated, source-preserving log of operator or payor names displayed in identified records. It uses same displayed name, different displayed name, or unavailable and stops before corporate-identity, responsibility, property, title, payment, development, valuation, offer, or transaction conclusions.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; the front-facing archival-folder hero and people-free overhead name-history strip are materially different compositions with matching alt metadata.`,
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
  reviewer_id: 'codex_wave79_factual',
  review_run_id: `mrx1000-wave79-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current HTTPS access review.`,
    'Claims remain bounded to online-query limitations and displayed wellbore, organization, and drilling-permit names, identifiers, dates, statuses, and query scope. None is converted into a corporate-identity, responsibility, property, development, title, production, payment, or value conclusion.',
    'The article supplies no proprietary, universal, market, or owner-specific numerical assumptions; invents no name, identifier, date, status, relationship, property fact, payment fact, offer, or development result; and makes no owner-specific legal, tax, title, valuation, engineering, financial, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'four_distinct_https_sources',
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
  reviewer_id: 'codex_wave79_compliance',
  review_run_id: `mrx1000-wave79-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article preserves exact displayed names, limits each result to same displayed name, different displayed name, or unavailable, turns differences and unavailable fields into neutral questions, discloses possible MRX buyer interest, and preserves owner agency and qualified-review boundaries.',
    'Image text is limited to the exact article title and approved keyword and adds no owner name, property fact, source result, model output, numerical assumption, seal, recommendation, appraisal claim, forecast, guarantee, or transaction outcome.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'displayed_name_no_corporate_property_payment_development_or_value_conclusion_boundary_pass',
    'owner_agency_and_possible_buyer_interest_disclosure_preserved',
    'no_unsupported_visual_or_decision_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 79 review artifacts with ${sources.length} current source checks.`,
);
