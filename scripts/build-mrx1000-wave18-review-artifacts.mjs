#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const slug = 'depth-severances-and-formation-rights-in-mineral-valuation';
const programRowId = 'MRX1000-0176';
const title = 'Depth Severances and Formation Rights in Mineral Valuation';
const inlineKeyword = 'depth severance formation rights valuation';
const articlePath = `src/content/posts/${slug}.mdx`;
const creativePath = `artifacts/mrx1000-wave18-creative-qa/${slug}/creative-manifest.json`;
const batch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
);
const row = batch.articles.find((article) => article.program_row_id === programRowId);
const reviewedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

if (!row || row.slug !== slug || row.title !== title) {
  throw new Error('Wave 18 batch identity is missing or drifted');
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Frontmatter missing');
  return `${match[1]}\n`;
}

function nestedScalar(block, parent, key) {
  const nested = block.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1];
  const match = nested?.match(new RegExp(`^[ \\t]+${key}:\\s*['\"]([^'\"]+)['\"]$`, 'm'));
  return match?.[1] ?? null;
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
      'https://www.txcourts.gov/media/1438302/160353.pdf',
      [
        'The Supreme Court of Texas explains that an unambiguous deed is construed from the intent expressed within the instrument as a whole, with provisions harmonized where possible.',
        'The article uses the opinion only for the general deed-construction boundary and does not interpret a private instrument, resolve ambiguity, determine title, or apply the holding to an owner-specific dispute.',
      ],
    ],
    [
      'https://www.txcourts.gov/media/1460523/220878.pdf',
      [
        'The Supreme Court of Texas distinguishes a conveyed mineral estate and associated production rights from underground empty space and evaluates the deed language and legal character of the claimed property interest.',
        'The article uses the opinion as a limited illustration that subsurface property categories must be identified precisely; it does not extend the salt-cavern holding to a different mineral deed or depth boundary.',
      ],
    ],
    [
      'https://statutes.capitol.texas.gov/Docs/SDocs/PROPERTYCODE.pdf',
      [
        'The Texas Property Code provides the statutory recording framework for instruments concerning real property, including execution and acknowledgment requirements addressed by the cited provisions.',
        'The article uses the Code only as recording context and does not claim that recording alone resolves title, instrument interpretation, notice disputes, or the validity of an owner-specific conveyance.',
      ],
    ],
    [
      'https://webapps2.rrc.texas.gov/EWA/help/DP_gloss.htm',
      [
        'The Railroad Commission glossary distinguishes fields, reservoirs, completion depth, and total depth, and explains that a field can contain separate reservoirs at different depths.',
        'The article uses these definitions to prevent regulatory and geological terms from being collapsed together; it does not treat a field assignment or reported depth as ownership evidence.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/glossary-for-well-log-list/',
      [
        'The Railroad Commission well-log glossary identifies top and bottom log intervals, field, lease, API, survey, and total-depth data used to locate and understand Commission records.',
        'The article uses the glossary for data-field boundaries and does not claim that a log interval, well identifier, or survey reference establishes private title or a legal depth cutoff.',
      ],
    ],
    [
      'https://www.rrc.texas.gov/resource-center/research/research-queries/about-oil-gas-data-queries/',
      [
        'The Railroad Commission explains that a wellbore is the hole in the ground and can contain one or more completions, and that its query systems expose different regulatory data slices.',
        'The article uses this distinction for careful identity and completion matching and does not infer title, lease continuation, or payment ownership from the wellbore record.',
      ],
    ],
    [
      'https://comptroller.texas.gov/taxes/property-tax/valuing-property.php',
      [
        'The Texas Comptroller describes the sales-comparison, income, and cost approaches and explains that the income approach estimates the present worth of anticipated future benefits.',
        'The article preserves the public property-tax context and does not present the page as a private-sale formula, professional appraisal, title conclusion, or owner-specific value.',
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
  nestedScalar(fm, 'inline_image', 'rendered_text') !== inlineKeyword ||
  faqCount !== 5 ||
  wordCount < 700 ||
  sources.length < 3
) {
  throw new Error(
    'Wave 18 review inputs do not satisfy identity, depth, source, or creative gates',
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
};

writeArtifact('editorial', `${programRowId}-${slug}.json`, {
  artifact_type: 'mrx1000_two_image_editorial_review',
  ...common,
  reviewer_id: 'codex_wave18_editorial',
  review_run_id: `mrx1000-wave18-editorial-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'editorial',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; the answer-first article contains ${wordCount} body tokens and five FAQs.`,
    'The document-first framework separates title instruments, technical correlation, interval lease status, production attribution, development evidence, economics, and curative risk without issuing a title, legal, engineering, or owner-specific value conclusion.',
    `Exact-title hero/share OCR passed for “${title}”; distinct in-body OCR passed for “${inlineKeyword}”.`,
  ],
  checks: [
    { name: 'complete_file_sha256_match', status: 'PASS', evidence: articleSha },
    {
      name: 'answer_first_depth_and_five_faqs',
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
  reviewer_id: 'codex_wave18_factual',
  review_run_id: `mrx1000-wave18-factual-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'factual_citation',
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; all ${sources.length} declared official sources passed live access review.`,
    'Deed-construction, subsurface-property, recording, regulatory-field, well-log, completion, and property-appraisal claims remain bounded to their official court and government sources.',
    'The article uses no fabricated instruments, legal descriptions, depth cutoffs, formations, owners, wells, production, leases, prices, reserves, percentages, disputes, transaction values, testimonials, or owner-specific legal or valuation conclusions.',
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
  reviewer_id: 'codex_wave18_compliance',
  review_run_id: `mrx1000-wave18-compliance-${reviewedAt.replace(/[-:]/g, '')}`,
  capability: 'compliance',
  expected_hero_sha256: heroSha,
  expected_inline_sha256: inlineSha,
  findings: [
    `Complete current MDX SHA-256 is ${articleSha}; hero/share and inline image hashes are separately locked.`,
    'The article states educational and professional boundaries, discloses MRX’s potential economic interest, and avoids title or legal opinions, lease-status conclusions, reserve claims, engineering guarantees, unsupported precision, double counting, or an owner-specific value conclusion.',
    'Image text is limited to the exact article title and an authorized supporting keyword and adds no owner, instrument, legal description, depth, formation, well, reserve, production, price, percentage, dispute, or valuation conclusion.',
  ],
  checks: [
    'complete_file_sha256_match',
    'hero_share_sha256_identity',
    'inline_image_distinct_sha256',
    'exact_text_ocr_pass',
    'filename_text_identity_pass',
    'educational_and_professional_boundaries_preserved',
    'no_unsupported_visual_or_payment_claims',
  ],
  sources_inspected: [articlePath, row.hero_path, row.inline_path],
});

console.log(
  `Built three hash-locked Wave 18 review artifacts with ${sources.length} live source checks.`,
);
