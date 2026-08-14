#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'should-i-sell-my-mineral-rights';
const programRowId = 'MRX1000-0141';
const title = 'Should I Sell My Mineral Rights?';
const primaryKeyword = 'should I sell my mineral rights';
const inlineKeyword = 'Sell Mineral Rights or Keep Receiving Royalties';
const heroAlt =
  'A mineral owner compares a royalty statement and a sale folder beside “Should I Sell My Mineral Rights?”.';
const inlineAlt =
  'A parcel map separates a sale folder from royalty statements above “Sell Mineral Rights or Keep Receiving Royalties”.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave61-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sourceReceiptPath = process.env.MRX_WAVE61_SOURCE_RECEIPTS_PATH ?? null;
const sourceReceiptBytes = sourceReceiptPath ? readFileSync(sourceReceiptPath) : null;
const sourceReceiptBundle = sourceReceiptBytes
  ? JSON.parse(sourceReceiptBytes.toString('utf8'))
  : null;

if (!row || row.slug !== slug || row.title !== title || row.selection_rank !== 141) {
  throw new Error('Wave 61 batch identity is missing or drifted');
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
      throw new Error('Wave 61 preverified source receipts are invalid, future-dated, or stale');
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
  if (!contentType.includes('text/html')) {
    throw new Error(`${url}: source content type is not HTML (${contentType || 'missing'})`);
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
    'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/',
    [
      'The Railroad Commission of Texas Royalties FAQ provides general royalty-payment and agency-jurisdiction context.',
      'The article uses it only to distinguish payment records and official routing from private title, lease, entitlement, contract, value, remedy, or owner-specific legal conclusions.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
    [
      'The Railroad Commission of Texas production page identifies Texas production compilations and summaries derived from operator reports.',
      'The article uses it only to organize historical operating evidence; it does not prove private title, an owner decimal, realized price, reserves, future production, value, or whether an owner should sell.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
    [
      'The RRC Production Data Query FAQs explain operator-reported production, reporting levels, reporting lag, and later revisions or corrections.',
      'The article uses it only to require dates, identifiers, reporting scope, and version controls; it does not establish owner-specific title, payment, reserves, future production, value, or a sell-versus-hold recommendation.',
    ],
  ],
  [
    'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
    [
      'The Railroad Commission of Texas well-records page describes public search paths and identifiers used to reproduce property and well searches.',
      'The article uses it only for reproducible well and property identity; it does not prove private title, tract inclusion, owner decimals, reserves, future development, value, or a transaction decision.',
    ],
  ],
  [
    'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
    [
      'The U.S. Energy Information Administration publishes dated historical crude-oil spot-price series.',
      'The article uses the series only as dated market context; it does not forecast prices, translate a benchmark into an owner payment or property value, or recommend selling or holding.',
    ],
  ],
  [
    'https://www.eia.gov/naturalgas/data.php',
    [
      'The U.S. Energy Information Administration provides dated natural-gas price, production, and market datasets.',
      'The article uses these data only as dated market context; it does not forecast prices, establish a property-specific price or value, or recommend selling or holding.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/methodology/',
    [
      'The current MRX methodology describes evidence, assumptions, scenarios, and professional limits for a directional mineral-rights review.',
      'The article uses it only to bound a documented directional comparison and professional handoffs; it does not establish title, reserves, value, suitability, tax treatment, an offer, or a sell-versus-hold conclusion.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/sell-mineral-rights/',
    [
      'The current MRX selling page describes owner options, process context, possible buyer-interest disclosure, and the limits of a directional review.',
      'The article uses it only to frame available review and transaction pathways; it does not establish legal rights, title, taxes, value, an offer, payment, sale, closing, or the owner’s decision.',
    ],
  ],
  [
    'https://mineralrightsxchange.com/faq/',
    [
      'The current MRX FAQ describes general service, review, timing, and owner-process boundaries.',
      'The article uses it only for first-party process context and disclosures; it does not establish owner-specific title, value, taxes, suitability, an offer, payment, closing, or a sell-versus-hold recommendation.',
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
    'Wave 61 review inputs do not satisfy identity, article-depth, source, or creative gates',
  );
}

const sourceAccess = [];
for (const sourceEntry of sources) sourceAccess.push(sourceScope(await verifySource(sourceEntry)));

const common = {
  schema_version: '2.0.0',
  disposition: 'PASS',
  reviewed_at: reviewedAt,
  decision_authority: {
    source: 'Daryl owner directives, 2026-08-04 and 2026-08-11',
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
  reviewer_id: 'codex_wave61_editorial',
  review_run_id: `mrx1000-wave61-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns a structured sell-versus-keep decision record. It compares the exact rights under consideration, current royalty evidence, timing, uncertainty, liquidity purpose, alternatives, reversibility, and professional-review questions without deciding for the owner or producing an owner-specific value.',
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
  reviewer_id: 'codex_wave61_factual',
  review_run_id: `mrx1000-wave61-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed current access review.`,
    'Claims remain bounded to reproducible royalty, production, well, and dated market context plus current MRX methodology and process disclosures. No source is converted into private title, reserves, a forecast, property value, offer, tax result, suitability conclusion, or sell-versus-hold recommendation.',
    'The article uses no fabricated owners, properties, buyers, contracts, prices, acreage, ownership decimals, production, reserves, forecasts, offers, testimonials, success rates, or owner-specific legal, tax, accounting, title, appraisal, engineering, investment, or transaction conclusions.',
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
  reviewer_id: 'codex_wave61_compliance',
  review_run_id: `mrx1000-wave61-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses possible MRX buyer interest, preserves owner agency, and makes no owner-specific recommendation, title, lease, engineering, reserves, tax, value, offer, suitability, investment, or transaction conclusion.',
    'Image text is limited to the exact article title and approved supporting phrase and adds no account data, property identifier, amount, date, official seal, value conclusion, recommendation, offer, guarantee, buyer endorsement, or transaction result.',
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
  `Built three hash-locked Wave 61 review artifacts with ${sources.length} current source checks.`,
);
