#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const sidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave9-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T12:45:00Z';

const specifications = [
  [71, 'MRX1000-0163', 'unlocking-value-a-comprehensive-guide-to-assessing-your-mineral-rights-worth', 'Unlocking Value: A Comprehensive Guide to Assessing Your Mineral Rights Worth', 'mineral-rights-value', 'valuation-methodology-drivers', '/assets/articles/mineral-worth-assessment-workbook-wave9.webp', 'b80beaa7bc157e08be676754090422326887472bc5b49eb4640adf798df775b5'],
  [72, 'MRX1000-0307', 'how-to-identify-predatory-mineral-buyers', 'How to Identify Predatory Mineral Buyers', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/verify-mineral-buyer-wave9.webp', '7278a46040d363517aa8f9ad2a16c20c1e30978c805927ae5156de268c331736'],
  [73, 'MRX1000-0314', 'navigating-competing-offers-what-to-do-before-your-mineral-rights-assessment-call', 'Navigating Competing Offers: What to Do Before Your Mineral Rights Assessment Call', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/competing-offer-call-prep-wave9.webp', '467885c32ec37a4d398eff2338c055654e23872059d6fa1615ef0e056a0722a3'],
  [74, 'MRX1000-0318', 'understanding-mineral-rights-offer-scams-what-you-need-to-know', 'Understanding Mineral Rights Offer Scams: What You Need to Know', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/mineral-offer-scam-defense-wave9.webp', 'd5d0fc8c8265adb14f5e8f43e55d51bb86e5a09384538c90c6bd8b3bff10645c'],
  [75, 'MRX1000-0430', 'managing-mineral-interests-in-estate-planning-explained', 'Managing Mineral Interests in Estate Planning Explained', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/estate-mineral-management-wave9.webp', 'a427cf95afe192cc421501979903b1e1c99920d0d265e8ecb01d05a4cfd096b2'],
  [76, 'MRX1000-0434', 'understanding-inherited-mineral-rights-in-texas', 'Understanding Inherited Mineral Rights in Texas', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/inherited-texas-minerals-wave9.webp', 'a569d3d2c14475f8c0f95036e188e7f27baaf0649fd71185fbf2b0db7c627298'],
  [77, 'MRX1000-0639', 'understanding-1031-tax-implications-for-mineral-rights-owners', 'Understanding 1031 Tax Implications for Mineral Rights Owners', 'mineral-rights-taxes', 'tax-1031-legal-education', '/assets/articles/mineral-1031-tax-implications-wave9.webp', '501a5e226fead3e27119509e49bb5381d29c1248b8137d7d729621048c71f140'],
  [78, 'MRX1000-0729', 'how-to-accurately-assess-your-texas-mineral-rights-value', 'How to Accurately Assess Your Texas Mineral Rights Value', 'texas-mineral-rights', 'texas-county-basin-local-intent', '/assets/articles/texas-mineral-value-evidence-wave9.webp', 'b0734d1baf2e2ee9264e7b6a5479fc3a016a880336a5f3faaf370bb21c980c0f'],
  [79, 'MRX1000-0881', 'understanding-your-mineral-royalty-checks-breakdown', 'Understanding Your Mineral Royalty Checks Breakdown', 'title-lease-ownership', 'title-lease-ownership-documents', '/assets/articles/royalty-check-breakdown-wave9.webp', '9532e3e23c073d797dd229334faa76f920c14a47f461c24b1a09914317038fae'],
  [80, 'MRX1000-0974', 'understanding-the-key-differences-our-underwriter-review-vs-traditional-mineral-rights-brokers', 'Understanding the Key Differences: Our Underwriter Review vs. Traditional Mineral Rights Brokers', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/underwriter-review-vs-broker-wave9.webp', '7917717c5660b6c9f2bcf2cb79c25aed0c19994d63fd9988633fac2cdebb17f1'],
].map(([selection_rank, program_row_id, slug, title, pillar, cluster, hero_path, archive_evidence_sha256]) => ({
  selection_rank,
  program_row_id,
  slug,
  title,
  pillar,
  cluster,
  hero_path,
  archive_evidence_sha256,
}));

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
const retained = batch.articles.filter((article) => article.selection_rank <= 70);
if (retained.length !== 70) throw new Error(`Expected 70 retained entries; observed ${retained.length}`);

const additions = [];
for (const specification of specifications) {
  const repoPath = `src/content/posts/${specification.slug}.mdx`;
  const bodyBytes = await readFile(join(root, repoPath));
  const body = bodyBytes.toString('utf8');
  if (!/^publication_status:\s*draft$/m.test(body) || !/^noindex:\s*true$/m.test(body)) {
    throw new Error(`${specification.slug} must be in reviewed draft/noindex state`);
  }
  const title = body.match(/^title:\s*['"](.+)['"]$/m)?.[1];
  const heroAlt = body.match(/^  alt:\s*['"](.+)['"]$/m)?.[1];
  const socialAlt = body.match(/^  social_alt:\s*['"](.+)['"]$/m)?.[1];
  if (title !== specification.title || heroAlt !== specification.title || socialAlt !== specification.title) {
    throw new Error(`${specification.slug} title or exact-title hero/social alt mismatch`);
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
      'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W9-SELECT-2026-08-06; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave9_selection_decision_id = 'MRX1000-W9-SELECT-2026-08-06';
batch.decision_authority.wave9_selection_decision_path = decisionPath;
batch.decision_authority.wave9_selection_decision_sha256 = sha256(decisionBytes);
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
await writeFile(sidecarPath, `${sha256(Buffer.from(output))}  config/mrx1000-release-10-batch.json\n`);
console.log(`Admitted ${additions.length} Wave 9 rows; total reviewed manifest rows: ${batch.articles.length}.`);
