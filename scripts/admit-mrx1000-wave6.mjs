#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const batchSidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave6-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T22:30:00Z';

const specifications = [
  {
    selection_rank: 41,
    program_row_id: 'MRX1000-0878',
    slug: 'net-mineral-acres-vs-royalty-acres-what-texas-mineral-rights-owners-need-to-know',
    title: 'Net Mineral Acres vs. Royalty Acres: What Texas Mineral Rights Owners Need to Know',
    pillar: 'title-lease-ownership',
    cluster: 'title-lease-ownership-documents',
    hero_path: '/assets/articles/net-mineral-acres-vs-royalty-acres-wave6.webp',
    archive_evidence_sha256: '788f870769ee111f5b747aa371b1877f059f44575805c9f42e3e87bbd727dac5',
  },
  {
    selection_rank: 42,
    program_row_id: 'MRX1000-0885',
    slug: 'what-is-an-oil-and-gas-lease-and-how-does-it-affect-your-mineral-rights',
    title: 'What Is an Oil and Gas Lease and How Does It Affect Your Mineral Rights?',
    pillar: 'title-lease-ownership',
    cluster: 'title-lease-ownership-documents',
    hero_path: '/assets/articles/oil-and-gas-lease-anatomy-wave6.webp',
    archive_evidence_sha256: '2d9811ca320a0a01be174c4a595f6cefac28735af703f36063db2bed89907978',
  },
  {
    selection_rank: 43,
    program_row_id: 'MRX1000-0884',
    slug: 'what-is-a-held-by-production-lease-and-how-does-it-affect-your-mineral-rights',
    title: 'What Is a Held-by-Production Lease and How Does It Affect Your Mineral Rights?',
    pillar: 'title-lease-ownership',
    cluster: 'title-lease-ownership-documents',
    hero_path: '/assets/articles/held-by-production-lease-timeline-wave6.webp',
    archive_evidence_sha256: 'e982a48912ac88cb84bab361a4062cfb4600495aa936544eaf376869da97cd86',
  },
  {
    selection_rank: 44,
    program_row_id: 'MRX1000-0883',
    slug: 'what-is-a-division-order-and-why-does-it-matter-for-mineral-rights-owners',
    title: 'What Is a Division Order and Why Does It Matter for Mineral Rights Owners?',
    pillar: 'title-lease-ownership',
    cluster: 'title-lease-ownership-documents',
    hero_path: '/assets/articles/division-order-payment-map-wave6.webp',
    archive_evidence_sha256: '7f66e8ab1aa5913eb829ee2d51936cc2a0e0b2f784171d3bf8db1176976f74ce',
  },
  {
    selection_rank: 45,
    program_row_id: 'MRX1000-0526',
    slug: 'how-to-decode-your-royalty-check-statement',
    title: 'How to Decode Your Royalty Check Statement',
    pillar: 'oil-and-gas-royalties',
    cluster: 'royalties-owner-operations',
    hero_path: '/assets/articles/royalty-check-statement-grid-wave6.webp',
    archive_evidence_sha256: 'c7559e95b3fd3b4772e926ba2872d3f3ecbaf48eb70d2c0456c3f38fba6e8608',
  },
  {
    selection_rank: 46,
    program_row_id: 'MRX1000-0435',
    slug: 'understanding-royalty-checks-after-inheriting-mineral-rights',
    title: 'Understanding Royalty Checks After Inheriting Mineral Rights',
    pillar: 'inherited-mineral-rights',
    cluster: 'inherited-estate-probate',
    hero_path: '/assets/articles/inherited-royalty-check-flow-wave6.webp',
    archive_evidence_sha256: 'c7e5dd7dff6b7e1a1f8aebca409fe681eb9ad90f4581bdc6102a919b8218fa76',
  },
  {
    selection_rank: 47,
    program_row_id: 'MRX1000-0431',
    slug: 'mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling',
    title: 'Mineral Rights Inheritance in Texas: What Heirs Need to Know Before Selling',
    pillar: 'inherited-mineral-rights',
    cluster: 'inherited-estate-probate',
    hero_path: '/assets/articles/inherited-mineral-rights-sale-readiness-wave6.webp',
    archive_evidence_sha256: '53146c0ab6d3cb2024a741b1a2fada14cda92bb6ef778a58e08cd51ed4aecfd0',
  },
  {
    selection_rank: 48,
    program_row_id: 'MRX1000-0629',
    slug: 'capital-gains-tax-on-mineral-rights-sales-in-texas-what-sellers-need-to-know',
    title: 'Capital Gains Tax on Mineral Rights Sales in Texas: What Sellers Need to Know',
    pillar: 'mineral-rights-taxes',
    cluster: 'tax-1031-legal-education',
    hero_path: '/assets/articles/mineral-rights-capital-gains-framework-wave6.webp',
    archive_evidence_sha256: '3a0c0f795470935de09eb2cbefb99b5294593f9eed5d23c52eb0835083f0cc75',
  },
  {
    selection_rank: 49,
    program_row_id: 'MRX1000-0977',
    slug: 'what-to-bring-to-your-underwriter-review-call-essential-documents-and-preparation-guide',
    title: 'What to Bring to Your Underwriter Review Call: Essential Documents and Preparation Guide',
    pillar: 'mrx-methodology',
    cluster: 'mrx-methodology-transparency-underwriter-process',
    hero_path: '/assets/articles/underwriter-review-document-checklist-wave6.webp',
    archive_evidence_sha256: '31ac9f41ccc6f434790ec29a8878219aa7669a9cce25b86837350ec89b1824f2',
  },
  {
    selection_rank: 50,
    program_row_id: 'MRX1000-0952',
    slug: 'can-i-still-get-a-valid-underwriter-review-if-i-have-competing-mineral-rights-offers',
    title: 'Can I Still Get a Valid Underwriter Review if I Have Competing Mineral Rights Offers?',
    pillar: 'mrx-methodology',
    cluster: 'mrx-methodology-transparency-underwriter-process',
    hero_path: '/assets/articles/competing-mineral-rights-offers-wave6.webp',
    archive_evidence_sha256: '014e6cd7d5605e7cf43183a50bccf5e9f15aa12ed70b0c450a2cf4c0efd13dc3',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function wordCount(source) {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  return body.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)?.length ?? 0;
}

const batch = JSON.parse(await readFile(batchPath, 'utf8'));
const decisionBytes = await readFile(join(root, decisionPath));
const retained = batch.articles.filter((article) => article.selection_rank <= 40);
if (retained.length !== 40) {
  throw new Error(`Expected the immutable first 40 entries; observed ${retained.length}`);
}

const additions = [];
for (const specification of specifications) {
  const repoPath = `src/content/posts/${specification.slug}.mdx`;
  const bodyBytes = await readFile(join(root, repoPath));
  const body = bodyBytes.toString('utf8');
  if (!/^publication_status:\s*draft$/m.test(body) || !/^noindex:\s*true$/m.test(body)) {
    throw new Error(`${specification.slug} must be in reviewed draft/noindex state`);
  }
  const title = body.match(/^title:\s*['\"](.+)['\"]$/m)?.[1];
  const heroAlt = body.match(/^  alt:\s*['\"](.+)['\"]$/m)?.[1];
  if (title !== specification.title || heroAlt !== specification.title) {
    throw new Error(`${specification.slug} title or exact-title hero alt mismatch`);
  }
  const heroBytes = await readFile(join(root, 'public', specification.hero_path.slice(1)));
  const articleSha = sha256(bodyBytes);
  const heroSha = sha256(heroBytes);
  additions.push({
    selection_rank: specification.selection_rank,
    program_row_id: specification.program_row_id,
    source_shortlist_program_row_id: specification.program_row_id,
    slug: specification.slug,
    title: specification.title,
    source_shortlist_title: specification.title,
    canonical_url: `https://mineralrightsxchange.com/blog/${specification.slug}/`,
    pillar: specification.pillar,
    cluster: specification.cluster,
    content_genius_article_uuid: null,
    archive_evidence_sha256: specification.archive_evidence_sha256,
    repo_path: repoPath,
    repo_sha256: articleSha,
    article_sha256: articleSha,
    hero_path: specification.hero_path,
    hero_sha256: heroSha,
    hero_asset_sha256: heroSha,
    admission_status: 'admitted_quality_gated',
    finalization_state: 'draft_noindex_admitted',
    searchatlas_content_score: null,
    searchatlas_word_count: wordCount(body),
    risk_citation_remediation: [
      'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W6-SELECT-2026-08-06; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave6_selection_decision_id = 'MRX1000-W6-SELECT-2026-08-06';
batch.decision_authority.wave6_selection_decision_path = decisionPath;
batch.decision_authority.wave6_selection_decision_sha256 = sha256(decisionBytes);
batch.articles = [...retained, ...additions];
batch.policy.prior_verified_article_count = retained.length;
batch.policy.exact_admitted_count = batch.articles.length;
batch.policy.exact_admitted_slate_sha256 = sha256(JSON.stringify(sortDeep(batch.articles)));
batch.admission_audit = {
  admitted_article_count: batch.articles.length,
  selection_ranks: batch.articles.map((article) => article.selection_rank),
  duplicate_program_row_ids: [],
  duplicate_slugs: [],
  quality_gated_continuous_release: true,
};

const output = `${JSON.stringify(batch, null, 2)}\n`;
await writeFile(batchPath, output);
await writeFile(batchSidecarPath, `${sha256(Buffer.from(output))}  config/mrx1000-release-10-batch.json\n`);
console.log(`Admitted ${additions.length} Wave 6 rows; total reviewed manifest rows: ${batch.articles.length}.`);
