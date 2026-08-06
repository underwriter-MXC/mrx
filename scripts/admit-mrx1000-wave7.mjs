#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const batchPath = join(root, 'config/mrx1000-release-10-batch.json');
const sidecarPath = `${batchPath}.sha256`;
const decisionPath = 'docs/governance/mrx1000-wave7-selection-decision-2026-08-06.md';
const materializedAt = '2026-08-06T23:30:00Z';

const specifications = [
  [51, 'MRX1000-0162', 'understanding-valuation-methodology-how-it-affects-your-mineral-rights-final-price', 'Understanding Valuation Methodology: How It Affects Your Mineral Rights Transaction Price', 'mineral-rights-value', 'valuation-methodology-drivers', '/assets/articles/valuation-methodology-price-factors-wave7.webp', '7584a71bd3eebbf8b17bb0d4ce78e558b2ab713fdeb435446a4e85823b07e3f8'],
  [52, 'MRX1000-0164', 'what-determines-the-value-of-your-mineral-rights', 'What Determines the Value of Your Mineral Rights?', 'mineral-rights-value', 'valuation-methodology-drivers', '/assets/articles/mineral-rights-value-drivers-wave7.webp', '5e4054b18b00ced482e6bae3821164f1f98c79d111cd0ef131634a62877817d4'],
  [53, 'MRX1000-0304', 'how-to-get-multiple-offers-for-your-texas-mineral-rights', 'How to Get Multiple Offers for Your Texas Mineral Rights', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/multiple-texas-offers-comparison-wave7.webp', '3728723e323556bd0b6a86ae62e8dc8dfd473b0e63c6cd9f2d26a8b45e4b2d5f'],
  [54, 'MRX1000-0306', 'how-to-identify-lowball-mineral-rights-offers', 'How to Identify Lowball Mineral Rights Offers', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/lowball-offer-checklist-wave7.webp', '517fc1c041e7a6ff4ea291c40b219c04d2d6295826519787e2f42e9fbf3eafe2'],
  [55, 'MRX1000-0313', 'identifying-red-flags-in-mineral-rights-transactions', 'Identifying Red Flags in Mineral Rights Transactions', 'offer-review', 'offer-review-buyer-comparison-safety', '/assets/articles/transaction-red-flags-wave7.webp', '5830cbb9c2de73065d73b03fa93133441bba0e7e34c7352aa462e4c490cf85b1'],
  [56, 'MRX1000-0432', 'understand-the-value-of-your-inherited-mineral-rights', 'Understand the Value of Your Inherited Mineral Rights', 'inherited-mineral-rights', 'inherited-estate-probate', '/assets/articles/inherited-mineral-value-records-wave7.webp', '52b6ab89ac68c9650c4248085fff9d4f60abe2763bf781a07e9db4395c1506a0'],
  [57, 'MRX1000-0734', 'top-texas-counties-for-mineral-rights-value-permian-eagle-ford-and-haynesville', 'Top Texas Counties for Mineral Rights Value: Permian, Eagle Ford, and Haynesville', 'texas-mineral-rights', 'texas-county-basin-local-intent', '/assets/articles/texas-basin-county-value-map-wave7.webp', 'dc41d34dc7b04300df985fdf249bb9fe8bb2e5617b2573d40004b245215e1a3c'],
  [58, 'MRX1000-0879', 'the-difference-between-surface-rights-and-mineral-rights-in-texas', 'The Difference Between Surface Rights and Mineral Rights in Texas', 'title-lease-ownership', 'title-lease-ownership-documents', '/assets/articles/surface-vs-mineral-estates-wave7.webp', 'c46141f11825f18e85004c60d6c0b2a93a134d6e92c42946ac496f33688a40c4'],
  [59, 'MRX1000-0951', 'are-there-any-fees-for-a-free-underwriter-review-of-your-mineral-rights', 'Are There Any Fees for a Free Underwriter Review of Your Mineral Rights?', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/free-review-fees-wave7.webp', '366f5edfb60a797637666d150f443371ef00a49eccd3a60379f08ce5a6c265cf'],
  [60, 'MRX1000-0978', 'what-to-expect-during-the-underwriter-review-process-for-your-mineral-rights', 'What to Expect During the Underwriter Review Process for Your Mineral Rights', 'mrx-methodology', 'mrx-methodology-transparency-underwriter-process', '/assets/articles/underwriter-review-process-wave7.webp', '55a072d45394c241efed81eb0921645beecb68ca46f1633aaedb358527cdbbab'],
].map(([selection_rank, program_row_id, slug, title, pillar, cluster, hero_path, archive_evidence_sha256]) => ({ selection_rank, program_row_id, slug, title, pillar, cluster, hero_path, archive_evidence_sha256 }));

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
const retained = batch.articles.filter((article) => article.selection_rank <= 50);
if (retained.length !== 50) throw new Error(`Expected 50 retained entries; observed ${retained.length}`);

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
  const socialAlt = body.match(/^  social_alt:\s*['\"](.+)['\"]$/m)?.[1];
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
      'Continuous quality-gated admission under D-2026-0804-16 and MRX1000-W7-SELECT-2026-08-06; no numerical cap or observation-window gate applies.',
      'Publication remains conditional on current editorial, factual/citation, compliance, exact-title asset, build, rollback, deployment, and live-verification evidence.',
    ],
    evidence_packet_path: `artifacts/mrx1000-release-10/evidence/${specification.slug}.json`,
    evidence_packet_path_required: true,
  });
}

batch.evidence_scaffold_generated_at_utc = materializedAt;
batch.decision_authority.wave7_selection_decision_id = 'MRX1000-W7-SELECT-2026-08-06';
batch.decision_authority.wave7_selection_decision_path = decisionPath;
batch.decision_authority.wave7_selection_decision_sha256 = sha256(decisionBytes);
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
console.log(`Admitted ${additions.length} Wave 7 rows; total reviewed manifest rows: ${batch.articles.length}.`);
