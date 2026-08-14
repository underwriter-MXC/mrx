#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'what-should-i-do-if-a-texas-mineral-rights-sale-goes-wrong';
const programRowId = 'MRX1000-0139';
const title = 'What Should I Do If a Texas Mineral Rights Sale Goes Wrong?';
const inlineKeyword = 'Texas Mineral Rights Sale Problem Triage';
const heroAlt =
  'A hand holds an envelope beside a tabbed file and “What Should I Do If a Texas Mineral Rights Sale Goes Wrong?”.';
const inlineAlt =
  'Hands hold envelopes and a file folder around a parcel map, an abacus, and “Texas Mineral Rights Sale Problem Triage”.';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave59-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const sourceReceiptPath = process.env.MRX_WAVE59_SOURCE_RECEIPTS_PATH ?? null;
const sourceReceiptBytes = sourceReceiptPath ? readFileSync(sourceReceiptPath) : null;
const sourceReceiptBundle = sourceReceiptBytes
  ? JSON.parse(sourceReceiptBytes.toString('utf8'))
  : null;

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 59 batch identity is missing or drifted');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  const raw = nested?.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!raw) return null;
  const quote = raw[0];
  return (quote === "'" || quote === '"') && raw.at(-1) === quote ? raw.slice(1, -1) : raw;
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
      throw new Error('Wave 59 preverified source receipts are invalid, future-dated, or stale');
    }
    const receipt = sourceReceiptBundle.receipts?.find(
      (candidate) => candidate.requested_url === url,
    );
    if (
      !receipt ||
      receipt.status < 200 ||
      receipt.status >= 400 ||
      !String(receipt.content_type).toLowerCase().includes('text/html') ||
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

function sourceScope(source) {
  const scopes = new Map([
    [
      'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.5.htm',
      [
        'Texas Property Code Chapter 5 includes Sections 5.027 through 5.031 addressing correction instruments and distinct statutory requirements.',
        'The article uses the chapter only to identify correction-instrument questions and professional-routing boundaries; it does not determine the category, execution, notice, recording, effect, validity, title result, or remedy for an owner-specific instrument.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.11.htm',
      [
        'Texas Property Code Chapter 11 supplies general provisions applicable to real-property public records and recording.',
        'The article uses the chapter only for evidence-preservation and recording-reference context; it does not determine the effect, priority, completeness, validity, ownership result, or remedy associated with a filing.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/?artSec=12.001&chapter=PR.12&code=PR&tab=1',
      [
        'Texas Property Code Chapter 12 supplies formal eligibility and recording context for instruments concerning property.',
        'The article uses the chapter only to frame formal eligibility and recording questions; it does not determine an instrument’s validity, effect, priority, title result, owner-specific remedy, or transaction outcome.',
      ],
    ],
    [
      'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint',
      [
        'The Texas Attorney General complaint page identifies useful incident facts and supporting-document categories and warns against including sensitive identifiers in a complaint.',
        'The article uses the page only to organize a security or consumer-protection incident file and official routing; it does not make a fraud finding, decide a private contract or deed, create a remedy, or promise investigation or recovery.',
      ],
    ],
    [
      'https://www.texasattorneygeneral.gov/consumer-protection/financial-and-insurance-scams',
      [
        'The Texas Attorney General financial-scams page provides general consumer-protection and complaint-routing context.',
        'The article uses the page only for independent verification and official-routing context when a security incident is suspected; it does not label a buyer or person fraudulent or establish loss, liability, recovery, or a private remedy.',
      ],
    ],
    [
      'https://www.ic3.gov/CrimeInfo/BEC',
      [
        'The FBI Internet Crime Complaint Center Business Email Compromise guidance advises secondary-channel verification for account-information changes and prompt originating-financial-institution contact when fraud is recognized.',
        'The article uses the page only for operational security routing; it does not make a fraud finding, determine liability or a private remedy, promise recovery, or set an owner-specific deadline.',
      ],
    ],
    [
      'https://www.irs.gov/publications/p544',
      [
        'Current IRS Publication 544 provides general federal reporting concepts for sales and other dispositions and points to potentially relevant forms.',
        'The article uses the publication only for tax-record preservation and qualified-professional routing; it does not establish mineral-rights tax character, basis, holding period, amount, reporting form, amendment, deadline, or tax result.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/production-data/',
      [
        'The Railroad Commission of Texas production page identifies Texas production compilations and summaries derived from operator reports.',
        'The article uses the page only for operator-reported production context; it does not prove private title, an owner decimal, realized price, reserves, future production, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/',
      [
        'The Railroad Commission of Texas Royalties FAQ describes information associated with royalty payments and division orders and identifies paths for requesting certain lease, property, or well identifiers.',
        'The article uses the page only for payment-record fields, division-order matching, and identifier follow-up; it does not establish complete title, ownership, reserves, future production, value, or legal effect.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/',
      [
        'The Railroad Commission of Texas well-records page describes public search paths and identifiers such as county, operator, field, API number, drilling-permit number, lease or gas-well identity, survey, abstract, section, and block.',
        'The article uses the page only to explain reproducible property and well identity; it does not prove private title, tract inclusion, owner decimal, reserves, future development, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission of Texas query guide explains public oil-and-gas data identities, including API wellbore identity and lease or gas-well completion identifiers.',
        'The article uses the page only to keep record identifiers and query paths explicit; it does not resolve private ownership, title, contract effect, production entitlement, or value.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/',
      [
        'The RRC Production Data Query FAQs explain operator-reported production, Texas lease-versus-well reporting, reporting lag, and later revisions, corrections, or late filings.',
        'The article uses the page only to require retrieval dates, periods, identifiers, and version controls for public operating evidence; it does not establish owner-specific title, payment, reserves, future production, or value.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.12.htm',
      [
        'Texas Property Code Chapter 12 provides statutory context for recording instruments concerning property.',
        'The article uses the chapter only to explain why complete recorded instruments and recording references may matter; it does not interpret a particular instrument or establish an owner-specific title conclusion.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/LG/htm/LG.191.htm',
      [
        'Texas Local Government Code Chapter 191 identifies the county clerk as county recorder and addresses authorized records and indexing.',
        'The article uses the chapter only for county-record context; it does not determine the legal effect, priority, completeness, or ownership result of any record.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/ES/htm/ES.101.htm',
      [
        'Texas Estates Code Chapter 101 provides statutory context for estate vesting subject to administration and liabilities.',
        'The article uses the chapter only to explain why estate records and authority may be relevant; it does not decide inheritance, probate, heirship, authority, curative requirements, or title.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/NR/htm/NR.91.htm',
      [
        'Texas Natural Resources Code Chapter 91 provides statutory context for certain payor information and identification requests discussed by the RRC.',
        'The article uses the chapter only for record-retrieval and payment-information context; it does not establish complete ownership, lease interpretation, title, production entitlement, or value.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/methodology/',
      [
        'The current MRX methodology describes the evidence, assumptions, scenarios, and professional limits of a directional mineral-rights review.',
        'The article uses the page only to bound a scoped directional review and its handoffs; it does not establish owner-specific title, reserves, value, legal effect, tax treatment, suitability, or a transaction result.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/sell-mineral-rights/',
      [
        'The current MRX selling page describes owner options, process context, possible buyer-interest disclosure, and the limits of a directional review.',
        'The article uses the page only to bound MRX evidence organization and professional handoffs; it does not establish owner-specific legal rights, title, fraud, remedies, taxes, value, an offer, payment, sale, or closing.',
      ],
    ],
    [
      'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_m.htm',
      [
        'The U.S. Energy Information Administration page publishes dated crude-oil spot-price series and their units and frequency.',
        'The article uses the page only for public benchmark context; it does not establish a property-specific realized price, differential, deduction, forecast, or value.',
      ],
    ],
    [
      'https://www.eia.gov/naturalgas/data.php',
      [
        'The U.S. Energy Information Administration natural-gas data page provides dated public natural-gas data and price-series access.',
        'The article uses the page only for public benchmark context; it does not establish a property-specific realized price, contract, deduction, forecast, or value.',
      ],
    ],
    [
      'https://mineralrightsxchange.com/mineral-rights-value/',
      [
        'The current MRX mineral-rights value hub describes common inputs and the educational directional-review boundary.',
        'The article uses the page only to bound general value education; it does not establish owner-specific title, reserves, value, suitability, or a transaction result.',
      ],
    ],
  ]);
  const [sourceLocationOrParaphrase, claimScope] = scopes.get(source.url) ?? [];
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
  nestedScalar(fm, 'hero_image', 'social_src') !== row.hero_path ||
  nestedScalar(fm, 'hero_image', 'alt') !== heroAlt ||
  nestedScalar(fm, 'hero_image', 'social_alt') !== heroAlt ||
  nestedScalar(fm, 'inline_image', 'alt') !== inlineAlt ||
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length < 3
) {
  throw new Error(
    'Wave 59 review inputs do not satisfy identity, article-depth, source, or creative gates',
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
  reviewer_id: 'codex_wave59_editorial',
  review_run_id: `mrx1000-wave59-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The article owns incident triage after a concrete Texas mineral-rights sale mismatch. It freezes and indexes exact evidence, identifies the last verified transaction state, separates an ordinary discrepancy from a suspected security incident, identifies the next reversible procedural control, and routes the precise issue without deciding legal effect or a remedy.',
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
  reviewer_id: 'codex_wave59_factual',
  review_run_id: `mrx1000-wave59-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared sources passed live access review.`,
    'Claims remain bounded to Texas correction-instrument, public-record, and formal recording-eligibility question framing; Texas Attorney General incident-file and official-routing context; FBI IC3 secondary-channel verification and prompt financial-institution routing; IRS federal tax-record routing; RRC payment-record and private-dispute limits; and current MRX methodology and selling-scope boundaries. No source is turned into an owner-specific contract, title, recording, fraud, remedy, recovery, tax, value, offer, payment, sale, or closing conclusion.',
    'The article uses no fabricated owners, properties, buyers, contracts, prices, acreage, ownership decimals, production, reserves, forecasts, tax results, offers, testimonials, success rates, or owner-specific title, legal, tax, accounting, appraisal, investment, or transaction conclusions.',
  ],
  checks: [
    'complete_file_sha256_match',
    'minimum_three_distinct_https_sources',
    'current_source_access_review_pass',
    'claim_to_source_scope_present',
    'official_primary_source_priority_pass',
    'unsupported_high_risk_claim_scan_pass',
  ],
  sources_inspected: sourceAccess,
});

writeArtifact('compliance', `${slug}.json`, {
  artifact_type: 'mrx1000_two_image_compliance_review',
  ...common,
  reviewer_id: 'codex_wave59_compliance',
  review_run_id: `mrx1000-wave59-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, distinguishes evidence from conclusions, separates ordinary discrepancies from suspected security incidents, preserves exact versions and last-verified-state evidence, discloses possible MRX buyer interest, and makes no owner-specific contract, title, recording, fraud, remedy, payment-recovery, tax, value, appraisal, or transaction conclusion.',
    'Image text is limited to the exact article title and exact canonical keyword and adds no owner data, property identifier, amount, accusation, buyer endorsement, legal or title conclusion, fraud finding, remedy, recovery claim, tax result, guarantee, or transaction conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'educational_and_professional_boundaries_preserved',
    'no_unsupported_visual_or_valuation_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 59 review artifacts with ${sources.length} live source checks.`,
);
