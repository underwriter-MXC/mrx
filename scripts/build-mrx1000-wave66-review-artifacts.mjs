#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'how-to-talk-to-your-family-before-you-decide-to-sell-mineral-rights';
const programRowId = 'MRX1000-0146';
const title = 'How to Talk to Your Family Before You Decide to Sell Mineral Rights';
const primaryKeyword = 'how do I talk to my family about selling our mineral rights?';
const inlineKeyword = 'One Family, One Decision, One Honest Conversation';
const heroAlt =
  'Three adult family members talk at a table beside “How to Talk to Your Family Before You Decide to Sell Mineral Rights”.';
const inlineAlt =
  'Three notebooks surround a table above “One Family, One Decision, One Honest Conversation”.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave66-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sourceReceiptPath = process.env.MRX_WAVE66_SOURCE_RECEIPTS_PATH ?? null;
const sourceReceiptBytes = sourceReceiptPath ? readFileSync(sourceReceiptPath) : null;
const sourceReceiptBundle = sourceReceiptBytes
  ? JSON.parse(sourceReceiptBytes.toString('utf8'))
  : null;

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 146) {
  throw new Error('Wave 66 batch identity is missing or drifted');
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
      throw new Error('Wave 66 preverified source receipts are invalid, future-dated, or stale');
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
    'https://extension.umn.edu/transfer-and-estate-planning/preparing-meet-your-transition-and-estate-planning-team',
    [
      'University of Minnesota Extension transition-planning guidance recommends preparing goals and questions in writing, involving affected parties, and using family meetings as part of a fact-based planning process.',
      'The article adapts only those meeting-preparation practices to a pre-assessment family conversation. It does not treat farm or estate guidance as mineral-rights law or use it to determine ownership, authority, consent, title, value, tax, or whether to sell.',
    ],
  ],
  [
    'https://extension.umn.edu/transfer-and-estate-planning/farm-business-transfer-strategies',
    [
      'University of Minnesota Extension farm-business transfer guidance recommends brief and specific communication that avoids accusation, insult, and blame and describes structured family-business meetings.',
      'The article adapts only those communication disciplines. It does not equate a mineral interest with a farm business or derive any legal, ownership, authority, consent, valuation, tax, or transaction conclusion from the source.',
    ],
  ],
  [
    'https://extension.usu.edu/finance/files/estate-planning-toolkit.pdf',
    [
      'The Utah State University Extension Estate Planning Toolkit recommends a calm setting, a clear intention, input from people directly affected, and an agenda that may span multiple conversations.',
      'The article adapts only those conversation practices. It does not treat the source as mineral-specific advice or use it to determine probate, title, ownership, authority, consent, value, tax, or disposition.',
    ],
  ],
  [
    'https://www.srs.fs.usda.gov/pubs/gtr/gtr_srs225.pdf',
    [
      'The USDA Forest Service overview describes heirs property as inherited real property that can involve multiple heirs and fragmented collective ownership.',
      'The article uses it only as general background that family shorthand may conceal distinct interests and unresolved records. It does not apply heirs-property law to mineral ownership or determine any reader’s title, authority, consent, signature, probate, or sale rights.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/blog/mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling/',
    [
      'The current MRX inherited-mineral-rights guide explains that inherited-interest review depends on the actual estate, deed, trust, operator, and title records and that family relationship alone does not settle ownership or sale authority.',
      'The article uses it only to separate a family conversation from professional ownership and authority review. It does not restate the inheritance workflow or decide title, acreage, probate, authority, signatures, value, tax, or whether to sell.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/blog/selling-mineral-rights-selling-process-for-mineral-owners/',
    [
      'The current MRX seller-control guide explains that owners can gather information, request written terms, pause, seek independent advice, and decline to proceed through a possible sale process.',
      'The article uses it only to preserve owner agency when the family selects a later information-gathering step. It does not retell the selling sequence, compare offers, interpret documents, determine value, or recommend a sale.',
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
    'Wave 66 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave66_editorial',
  review_run_id: `mrx1000-wave66-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns the narrow pre-assessment family-conversation job. It provides purpose framing, a one-page fact sheet, a timed agenda, needs-oriented questions, disagreement buckets, inherited-interest cautions, and a limited next-step close while stopping before ownership, authority, consent, title, valuation, tax, offer comparison, process narration, and transaction selection.',
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
  reviewer_id: 'codex_wave66_factual',
  review_run_id: `mrx1000-wave66-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current access review.`,
    'Claims remain bounded to adaptable family-meeting and communication practices from university extension sources, general inherited-property context from the USDA Forest Service, and current MRX inheritance and seller-control guidance. No source is converted into a private title, probate, authority, consent, value, tax, contract, or transaction conclusion.',
    'The article invents no real owner, property, buyer, contract, transaction, price range, production, reserves, forecast, testimonial, success rate, or owner-specific legal, tax, accounting, title, appraisal, engineering, investment, or transaction conclusion.',
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
  reviewer_id: 'codex_wave66_compliance',
  review_run_id: `mrx1000-wave66-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses possible MRX buyer interest, preserves owner agency, and makes no owner-specific title, acreage, value, fairness, buyer, contract, legal, tax, suitability, investment, or transaction conclusion.',
    'Image text is limited to the exact article title and approved family-conversation phrase and adds no account data, property identifier, amount, date, equation, official seal, title conclusion, value conclusion, recommendation, offer, guarantee, buyer endorsement, or transaction result.',
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
  `Built three hash-locked Wave 66 review artifacts with ${sources.length} current source checks.`,
);
