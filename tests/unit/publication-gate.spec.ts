import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..', '..');
const postsDir = join(repoRoot, 'src', 'content', 'posts');
const releaseBatch = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
) as { articles: Array<{ slug: string }> };
const canonicalLedger = JSON.parse(
  readFileSync(join(repoRoot, 'config', 'mrx-1000-canonical-content-ledger.json'), 'utf8'),
) as { verification: { incumbent_repo_count: number; pilot_001_count: number } };

const approvedLiveSlugs = [
  'how-title-defects-change-mineral-rights-offer',
  'how-are-mineral-rights-valued',
  'how-to-compare-mineral-rights-buyers-in-texas',
  'how-to-sell-mineral-rights-in-texas',
  'texas-severance-tax-what-mineral-rights-owners-need-to-know',
  'what-is-a-net-royalty-acre',
  'what-documents-do-you-need-to-sell-mineral-rights-in-texas',
  'what-is-a-clawback-clause-in-a-mineral-rights-sale',
  'why-did-my-royalty-check-go-down',
].sort();
const approvedPublicationShapedSlugs = [
  ...new Set([...approvedLiveSlugs, ...releaseBatch.articles.map(({ slug }) => slug)]),
].sort();
const retiredHistoricalSourceSlugs = new Set([
  'avoiding-predatory-offers-fair-valuation-for-mineral-rights',
  'how-to-identify-unfair-offers-for-mineral-rights',
  'texas-mineral-rights-valuation-vs-predatory-offers-what-to-know',
  'what-to-do-when-you-have-multiple-offers-for-your-mineral-rights',
  '5-essential-steps-to-verify-the-legitimacy-of-your-mineral-rights-offer',
]);

describe('article publication gate', () => {
  it('fails closed when publication_status is omitted', () => {
    const schema = readFileSync(join(repoRoot, 'src', 'content', 'config.ts'), 'utf8');
    const predicate = readFileSync(join(repoRoot, 'src', 'lib', 'content-graph.ts'), 'utf8');

    expect(schema).toContain("PublicationStatus.optional().default('draft')");
    expect(predicate).toContain("post.data.publication_status ?? 'draft'");
    expect(predicate).toContain("status !== 'published'");
  });

  it('rejects a published + noindex row from the public gate', () => {
    const predicate = readFileSync(join(repoRoot, 'src', 'lib', 'content-graph.ts'), 'utf8');
    expect(predicate).toContain('post.data.noindex === true');
    expect(predicate).toMatch(/noindex.*return\s+false/);
  });

  it('requires noindex:false in the same frontmatter as publication_status:published', () => {
    const articleFiles = readdirSync(postsDir).filter((file) => file.endsWith('.mdx'));
    const publishedAndNoindex = articleFiles.filter((file) => {
      const source = readFileSync(join(postsDir, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      return (
        /^publication_status:\s*published\s*$/m.test(frontmatter) &&
        /^noindex:\s*true\s*$/m.test(frontmatter)
      );
    });
    expect(publishedAndNoindex).toEqual([]);
  });
  it('keeps only legacy-live and authorized-batch articles publication-shaped', () => {
    const articleFiles = readdirSync(postsDir).filter((file) => file.endsWith('.mdx'));
    const articleSlugs = new Set(articleFiles.map((file) => file.replace(/\.mdx$/, '')));
    const retiredHistoricalSourceCount = [...retiredHistoricalSourceSlugs].filter((slug) =>
      articleSlugs.has(slug),
    ).length;
    const statuses = articleFiles.map((file) => {
      const source = readFileSync(join(postsDir, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const status = frontmatter.match(/^publication_status:\s*(\S+)\s*$/m)?.[1];

      return { slug: file.replace(/\.mdx$/, ''), status };
    });
    const published = statuses
      .filter(({ status }) => status === 'published')
      .map(({ slug }) => slug)
      .sort();

    expect(articleFiles).toHaveLength(
      canonicalLedger.verification.incumbent_repo_count +
        canonicalLedger.verification.pilot_001_count +
        retiredHistoricalSourceCount,
    );
    expect(
      statuses
        .filter(({ slug }) => retiredHistoricalSourceSlugs.has(slug))
        .every(({ status }) => status === 'draft'),
    ).toBe(true);
    expect(statuses.every(({ status }) => status === 'draft' || status === 'published')).toBe(true);
    expect(published).toEqual(approvedPublicationShapedSlugs);
    expect(statuses.filter(({ status }) => status === 'draft')).toHaveLength(
      articleFiles.length - approvedPublicationShapedSlugs.length,
    );
  });

  it('uses the same publication predicate for public discovery surfaces', () => {
    const publicConsumers = [
      'src/components/organisms/HomeExperience.astro',
      'src/pages/api/chat/message.ts',
      'src/lib/learning-center.ts',
      'src/pages/blog/[...slug].astro',
      'src/pages/blog/rss.xml.ts',
    ];

    for (const relativePath of publicConsumers) {
      const source = readFileSync(join(repoRoot, relativePath), 'utf8');
      expect(source, relativePath).toContain('isPublishedPost');
    }

    for (const relativePath of ['scripts/build-llms-index.mjs', 'scripts/postbuild-sitemap.mjs']) {
      const source = readFileSync(join(repoRoot, relativePath), 'utf8');
      expect(source, relativePath).toContain(
        "scalar(frontmatter, 'publication_status') !== 'published'",
      );
      expect(source, relativePath).toContain("scalar(frontmatter, 'noindex') === 'true'");
    }
  });
});
