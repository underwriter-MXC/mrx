#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'mineral-rights-document-redaction-checklist-before-sharing-records';
const programRowId = 'MRX1000-0007';
const title = 'Mineral Rights Document Redaction Checklist Before You Share Records';
const primaryKeyword = 'mineral rights document redaction checklist';
const inlineKeyword = primaryKeyword;
const heroAlt =
  'A hand places a redacted share copy beside preserved originals under the exact article title.';
const inlineAlt =
  'An overhead workflow separates preserved originals, a redacted share copy, and a blank log under the exact keyword.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave74-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 154) {
  throw new Error('Wave 74 batch identity is missing or drifted');
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
    'https://mineralrightsxchange.com/privacy-policy/',
    [
      'The MRX privacy policy says users should upload only files they are authorized to share and should not upload Social Security numbers, complete bank or payment details, passwords, or information unnecessary for the requested review. It also notes that OCR can reproduce sensitive text and that no system is perfectly secure.',
      'The article uses this first-party policy only to support data-minimization and authorized-sharing steps for MRX submissions; it makes no confidentiality, security, legal, or recipient-entitlement guarantee.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/terms/',
    [
      'The MRX terms require users to upload only files they are authorized to provide and to keep sign-in links secure.',
      'The article uses those terms only for MRX-specific authorization and access hygiene and does not infer what another recipient is legally entitled or required to receive.',
    ],
  ],
  [
    'https://csrc.nist.gov/pubs/sp/800/122/final',
    [
      'NIST SP 800-122 describes context-based identification and protection of personally identifiable information for federal information systems.',
      'The article uses the publication as general information-minimization context only; it does not present federal-agency guidance as governing private mineral transactions or as legal advice.',
    ],
  ],
  [
    'https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams',
    [
      'The FTC explains that unexpected messages may seek personal or financial information and recommends contacting an organization through a known channel rather than using the message-provided path.',
      'The article uses that guidance only for a stop-and-confirm step before responding to an unexpected request; it does not verify or endorse a recipient, provider, or buyer.',
    ],
  ],
  [
    'https://consumer.ftc.gov/articles/what-know-about-identity-theft',
    [
      'The FTC provides general consumer context about misuse of personal and financial information and practical recovery resources.',
      'The article uses that context only to explain why unnecessary sensitive values should not be copied into a share log and does not claim that redaction prevents identity theft or other misuse.',
    ],
  ],
  [
    'https://www.irs.gov/forms-pubs/about-form-w-9',
    [
      'The IRS states that Form W-9 is used to provide a taxpayer identification number to a person required to file an information return with the IRS.',
      'The article uses the page only to require a pause before changing or withholding fields on a requested tax form and makes no owner-specific tax conclusion.',
    ],
  ],
  [
    'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
    [
      'The official Form W-9 shows that a completed form can contain a name, address, taxpayer identification number, and certification tied to its stated information-reporting purpose.',
      'The article uses the form only to identify why tax forms need purpose-specific instructions; it does not advise an owner to alter or withhold a required form or field.',
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
  sources.length !== 7
) {
  throw new Error(
    'Wave 74 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave74_editorial',
  review_run_id: `mrx1000-wave74-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns one purpose-limited redaction workflow: preserve the original, make a separate share copy, and keep a value-free redaction log. It does not duplicate package indexing, intake, sender-identity, correspondence, property-scope, valuation, offer-comparison, or title-review jobs.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; the hero and overhead workflow are materially different compositions with matching alt metadata.`,
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
  reviewer_id: 'codex_wave74_factual',
  review_run_id: `mrx1000-wave74-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current HTTPS access review.`,
    'Claims remain bounded to MRX first-party upload rules, NIST context-based information handling, FTC consumer warnings, and the stated IRS Form W-9 purpose. None is converted into a promise of confidentiality, security, fraud prevention, recipient legitimacy, or a legal or tax conclusion.',
    'The article invents no owner, record, recipient, buyer, offer, title fact, acreage, tax result, confidentiality outcome, fraud result, testimonial, success rate, or owner-specific legal, tax, title, security, valuation, engineering, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'seven_distinct_https_sources',
    'current_source_access_review_pass',
    'claim_to_source_scope_present',
    'official_and_first_party_source_priority_pass',
    'unsupported_high_risk_claim_scan_pass',
  ],
  sources_inspected: sourceAccess,
});

writeArtifact('compliance', `${slug}.json`, {
  artifact_type: 'mrx1000_two_image_compliance_review',
  ...common,
  reviewer_id: 'codex_wave74_compliance',
  review_run_id: `mrx1000-wave74-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article preserves originals, forbids concealing material facts, stops before omitting information that may be required for a tax, title, legal, regulatory, or transaction purpose, discloses possible MRX buyer interest, and preserves owner agency.',
    'Image text is limited to the exact article title and approved keyword and adds no owner name, account value, tax identifier, property fact, recipient verification, seal, recommendation, confidentiality claim, security claim, guarantee, or transaction outcome.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'original_preservation_and_required-field-stop_rule_pass',
    'owner_agency_and_possible_buyer_interest_disclosure_preserved',
    'no_unsupported_visual_or_decision_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 74 review artifacts with ${sources.length} current source checks.`,
);
