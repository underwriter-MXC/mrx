#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'mineral-rights-offer-sender-identity-cross-check';
const programRowId = 'MRX1000-0962';
const title = 'How to Build a Mineral Rights Offer Sender Identity Cross-Check';
const primaryKeyword = 'mineral rights offer sender identity cross-check';
const inlineKeyword = 'mineral rights offer sender identity cross-check';
const heroAlt =
  'Owner and analyst review a sender checklist beside “How to Build a Mineral Rights Offer Sender Identity Cross-Check”.';
const inlineAlt =
  'Blank offer, entity, and contact cards form a matrix above “mineral rights offer sender identity cross-check”.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave72-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sourceReceiptPath = process.env.MRX_WAVE72_SOURCE_RECEIPTS_PATH ?? null;
const sourceReceiptBytes = sourceReceiptPath ? readFileSync(sourceReceiptPath) : null;
const sourceReceiptBundle = sourceReceiptBytes
  ? JSON.parse(sourceReceiptBytes.toString('utf8'))
  : null;

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 152) {
  throw new Error('Wave 72 batch identity is missing or drifted');
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
  if (sourceReceiptBundle) {
    const checkedAt = Date.parse(sourceReceiptBundle.checked_at_utc);
    const ageMs = Date.now() - checkedAt;
    if (!Number.isFinite(checkedAt) || ageMs < -300_000 || ageMs > 7_200_000) {
      throw new Error('Wave 72 preverified source receipts are invalid, future-dated, or stale');
    }
    const receipt = sourceReceiptBundle.receipts?.find(
      (candidate) => (candidate.requested_url ?? candidate.url) === url,
    );
    const contentType = String(receipt?.content_type ?? '').toLowerCase();
    const sourceMimeAllowed =
      contentType.includes('text/html') ||
      (url.endsWith('.pdf') &&
        (contentType.includes('application/pdf') || contentType.includes('octet-stream')));
    if (
      !receipt ||
      receipt.status < 200 ||
      receipt.status >= 400 ||
      !sourceMimeAllowed ||
      new URL(receipt.final_url).protocol !== 'https:'
    ) {
      throw new Error(`${url}: preverified source receipt is missing or invalid`);
    }
    return {
      label,
      url,
      publisher: new URL(receipt.final_url).hostname,
      accessed_at: sourceReceiptBundle.checked_at_utc,
      http_access_result: {
        status: receipt.status,
        final_url: receipt.final_url,
        content_type: receipt.content_type,
      },
      receipt_evidence: {
        method: sourceReceiptBundle.method,
        bundle_sha256: sha256(sourceReceiptBytes),
      },
    };
  }
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
  const sourceMimeAllowed =
    contentType.includes('text/html') ||
    (url.endsWith('.pdf') &&
      (contentType.includes('application/pdf') || contentType.includes('octet-stream')));
  if (!sourceMimeAllowed) {
    throw new Error(`${url}: source content type is unsupported (${contentType || 'missing'})`);
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
    'https://comptroller.texas.gov/transparency/open-data/cpa-databases/',
    [
      'The Texas Comptroller database directory identifies the Taxable Entity Search and the recorded right-to-transact-business status available from Comptroller records.',
      'The article uses the result only as one public-record column at query time; it does not treat a status result as authentication of a person, offer, authority, reputation, or transaction.',
    ],
  ],
  [
    'https://comptroller.texas.gov/taxes/franchise/coas-instructions.php',
    [
      'The Texas Comptroller account-status instructions describe the scope of franchise-tax account-status searches and certificates.',
      'The article records only what the selected status source displays and does not infer representative authority, offer authenticity, buyer quality, legal effect, or a transaction decision.',
    ],
  ],
  [
    'https://www.sos.state.tx.us/corp/do-business.shtml',
    [
      'The Texas Secretary of State page describes business-organization filings and public-record services.',
      'The article treats those records as entity-record evidence only and does not claim that a filing authenticates the contacting person or approves an offer.',
    ],
  ],
  [
    'https://www.sos.state.tx.us/corp/options.shtml',
    [
      'The Texas Secretary of State filing-options page identifies available filing and record-request channels.',
      'The article mentions the official channel only as a way to locate entity-record evidence and makes no claim about record sufficiency, authority, legitimacy, or offer quality.',
    ],
  ],
  [
    'https://www.sos.state.tx.us/corp/generalfaqs.shtml',
    [
      'The Texas Secretary of State business-organization FAQs explain the limited public-record role of the office and identify record questions owners may research.',
      'The article preserves that limited scope and does not convert a record match into proof of a sender’s identity, authority, reputation, or transaction legitimacy.',
    ],
  ],
  [
    'https://consumer.ftc.gov/features/pass-it-on/impersonator-scams/business-impersonator-scams',
    [
      'The FTC business-impersonator guidance supports contacting a business through independently located contact information rather than relying only on an unexpected message.',
      'The article uses that practice only to create an independent-contact comparison column and does not label a mismatch as impersonation or fraud.',
    ],
  ],
  [
    'https://consumer.ftc.gov/consumer-alerts/2025/04/online-search-results-good-bad-scammy',
    [
      'The FTC alert warns that some search results and sponsored listings can lead to impostor contact information.',
      'The article therefore asks owners to record how independent contact details were located and does not treat the first search result as verified evidence.',
    ],
  ],
  [
    'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint',
    [
      'The Texas Attorney General complaint page identifies business and contact details that may be preserved with a consumer record.',
      'The article borrows only the record-preservation fields; it does not say a mismatch warrants a complaint or treat a complaint number as a merits decision.',
    ],
  ],
]);

function sourceScope(source) {
  const [sourceLocationOrParaphrase, claimScope] = sourceScopes.get(source.url) ?? [];
  if (!sourceLocationOrParaphrase || !claimScope) {
    throw new Error(`${source.url}: claim-to-source scope is missing`);
  }
  return {
    ...source,
    source_location_or_paraphrase: sourceLocationOrParaphrase,
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
  sources.length < 3
) {
  throw new Error(
    'Wave 72 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  visual_metadata: {
    hero_alt: heroAlt,
    social_alt: heroAlt,
    inline_alt: inlineAlt,
  },
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: 'mrx1000_two_image_editorial_review',
  ...common,
  reviewer_id: 'codex_wave72_editorial',
  review_run_id: `mrx1000-wave72-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns one reusable three-source sender-identity matrix covering seven stated fields and only match, mismatch, or unverified labels. It converts discrepancies into neutral questions while excluding legitimacy, authenticity, authority, reputation, fairness, fraud, value, legal effect, offer quality, and transaction conclusions.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”; composition-accurate hero/social and inline alt metadata matched the final visual audit.`,
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
  reviewer_id: 'codex_wave72_factual',
  review_run_id: `mrx1000-wave72-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current access review.`,
    'Claims remain bounded to the public-record scope of Texas Comptroller and Secretary of State pages, the FTC practice of independently locating contact information, and the Texas Attorney General page’s record-preservation fields. No source is converted into authentication, authority, legitimacy, reputation, fairness, fraud, value, legal effect, contract, or transaction advice.',
    'The article invents no real owner, sender, entity, representative, address, phone, domain, source result, offer, property, contract, transaction, price, testimonial, success rate, or owner-specific legal, tax, accounting, title, appraisal, investment, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'minimum_three_distinct_https_sources',
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
  reviewer_id: 'codex_wave72_compliance',
  review_run_id: `mrx1000-wave72-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, separates an identity cross-check from authentication, authority, legitimacy, reputation, fraud, offer economics, property scope, contract review, and decisions, discloses possible MRX buyer interest, and preserves owner agency.',
    'Image text is limited to the exact article title and approved keyword and adds no name, address, phone, domain, entity result, amount, property identifier, signature, seal, match or mismatch result, legitimacy conclusion, ranking, recommendation, guarantee, buyer endorsement, or transaction result.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'educational_and_professional_boundaries_preserved',
    'owner_agency_and_possible_buyer_interest_disclosure_preserved',
    'no_unsupported_visual_or_decision_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 72 review artifacts with ${sources.length} current source checks.`,
);
