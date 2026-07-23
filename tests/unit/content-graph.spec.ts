/**
 * MRX1000-040 content-graph contract tests.
 *
 * Locks in the high-value local architecture slice:
 *   (1) all 9 content_cluster values map deterministically to the 9 pillars
 *   (2) resolvePillar prefers explicit pillar → content_cluster → legacy fallback
 *   (3) resolveCluster prefers content_cluster
 *   (4) MRX1000 internal_links triangle targets are valid and the conversion
 *       link always resolves to /book/
 *   (5) current public articles (the 6 approved live slugs) preserve their
 *       pillar/cluster invariants under the new resolvePillar
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ARTICLE_PILLARS,
  CONTENT_CLUSTERS,
  CONTENT_CLUSTER_TO_PILLAR,
  MRX_CONVERSION_PATH,
  articleCta,
  isPublishedPost,
  resolveCluster,
  resolveInternalLinks,
  resolvePillar,
} from '../../src/lib/content-graph';
import type { CollectionEntry } from 'astro:content';

const repoRoot = join(import.meta.dirname, '..', '..');
const postsDir = join(repoRoot, 'src', 'content', 'posts');

function makePost(data: Partial<CollectionEntry<'posts'>['data']>): CollectionEntry<'posts'> {
  return {
    id: 'synthetic',
    data: {
      title: 'Synthetic title',
      description: 'Synthetic description.',
      published_at: '2026-01-01',
      hero_image: { src: '/x.png', alt: 'x', width: 1, height: 1 },
      excerpt: 'excerpt',
      disclaimer_top: false,
      money_figure_sourced: true,
      reviewed_at: '2026-01-01',
      reviewed_by: 'mrx_compliance-x',
      ...data,
    } as CollectionEntry<'posts'>['data'],
    body: '',
    collection: 'posts',
  } as unknown as CollectionEntry<'posts'>;
}

const expectedClusterToPillar: Record<string, string> = {
  'sell-mineral-rights-decision-process': 'sell-mineral-rights',
  'valuation-methodology-drivers': 'mineral-rights-value',
  'offer-review-buyer-comparison-safety': 'offer-review',
  'inherited-estate-probate': 'inherited-mineral-rights',
  'royalties-owner-operations': 'oil-and-gas-royalties',
  'tax-1031-legal-education': 'mineral-rights-taxes',
  'texas-county-basin-local-intent': 'texas-mineral-rights',
  'title-lease-ownership-documents': 'title-lease-ownership',
  'mrx-methodology-transparency-underwriter-process': 'mrx-methodology',
};

describe('MRX1000 content_cluster → pillar contract', () => {
  it('declares exactly nine clusters matching the content-config enum', () => {
    expect(CONTENT_CLUSTERS).toHaveLength(9);
    expect(Object.keys(expectedClusterToPillar).sort()).toEqual([...CONTENT_CLUSTERS].sort());
  });

  it.each(Object.entries(expectedClusterToPillar))(
    'maps content_cluster=%s deterministically to pillar=%s',
    (cluster, pillarId) => {
      expect(CONTENT_CLUSTER_TO_PILLAR[cluster as keyof typeof CONTENT_CLUSTER_TO_PILLAR]).toBe(
        pillarId,
      );
      // Every cluster has a registered PillarDefinition so resolvePillar
      // can return a fully-formed definition (not a partial).
      const pillar = ARTICLE_PILLARS[pillarId as keyof typeof ARTICLE_PILLARS];
      expect(pillar).toBeDefined();
      expect(pillar.id).toBe(pillarId);
      expect(pillar.path).toMatch(/^\/.+\/$/);
      expect(pillar.defaultCta.length).toBeGreaterThan(0);
    },
  );

  it('resolvePillar honours content_cluster when no explicit pillar is set', () => {
    for (const [cluster, pillarId] of Object.entries(expectedClusterToPillar)) {
      const post = makePost({ content_cluster: cluster as never });
      expect(resolvePillar(post).id).toBe(pillarId);
    }
  });

  it('resolvePillar lets explicit pillar override the content_cluster mapping', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      pillar: 'sell-mineral-rights',
    });
    expect(resolvePillar(post).id).toBe('sell-mineral-rights');
  });

  it('resolvePillar falls back to the legacy regex path when both explicit pillar and content_cluster are missing', () => {
    const inherited = makePost({ title: 'Heir and probate steps for an estate' });
    expect(resolvePillar(inherited).id).toBe('inherited-mineral-rights');

    const texas = makePost({ title: 'Permian Basin and Eagle Ford economics' });
    expect(resolvePillar(texas).id).toBe('texas-mineral-rights');

    // Truly unmatched titles fall back to the catch-all pillar.
    const fallback = makePost({ title: 'A generic overview without trigger words' });
    expect(resolvePillar(fallback).id).toBe('sell-mineral-rights');
  });

  it('resolveCluster prefers content_cluster over legacy cluster/keyword_cluster/category', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      cluster: 'wrong-legacy-cluster',
      keyword_cluster: 'wrong-keyword-cluster',
      category: 'mineral-rights',
    });
    expect(resolveCluster(post)).toBe('tax-1031-legal-education');
  });

  it('resolveCluster falls back through cluster → keyword_cluster → category when content_cluster is absent', () => {
    expect(resolveCluster(makePost({ cluster: 'legacy-cluster' }))).toBe('legacy-cluster');
    expect(resolveCluster(makePost({ keyword_cluster: 'legacy-keyword' }))).toBe('legacy-keyword');
    expect(resolveCluster(makePost({ category: 'mineral-rights' }))).toBe('mineral-rights');
    expect(resolveCluster(makePost({}))).toBe('');
  });
});

describe('MRX1000 internal_links triangle resolution', () => {
  const siblingPost = makePost({
    title: 'Sibling guide',
    content_cluster: 'tax-1031-legal-education',
    publication_status: 'published',
    draft: false,
    noindex: false,
  });
  (siblingPost as { id: string }).id = 'sibling-guide.mdx';

  const siblingPost2 = makePost({
    title: 'Other sibling guide',
    content_cluster: 'tax-1031-legal-education',
    publication_status: 'published',
    draft: false,
    noindex: false,
  });
  (siblingPost2 as { id: string }).id = 'other-sibling-guide.mdx';

  it('always exposes conversion.href === /book/', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'published',
      draft: false,
      noindex: false,
      internal_links: {
        hub: '/mineral-rights-taxes/',
        sibling: '/blog/other-guide/',
        conversion: MRX_CONVERSION_PATH,
      },
    });
    const resolved = resolveInternalLinks(post, [post, siblingPost, siblingPost2]);
    expect(resolved.conversion.href).toBe('/book/');
    expect(resolved.conversion.name).toBe('article-review-cta');
    expect(resolved.conversion.label.length).toBeGreaterThan(0);
  });

  it('honors the declared hub path (defaults to the pillar path when omitted)', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'published',
      draft: false,
      noindex: false,
      internal_links: {
        hub: '/learning-center/',
        sibling: '/methodology/',
        conversion: MRX_CONVERSION_PATH,
      },
    });
    const resolved = resolveInternalLinks(post, [post]);
    expect(resolved.hub.href).toBe('/learning-center/');
    expect(resolved.hub.label).toBe('Back to the Learning Center');
  });

  it('resolves sibling from same-cluster candidate when the frontmatter sibling is missing', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'published',
      draft: false,
      noindex: false,
    });
    (post as { id: string }).id = 'current-guide.mdx';
    const resolved = resolveInternalLinks(post, [post, siblingPost]);
    expect(resolved.sibling.href).toBe('/blog/sibling-guide/');
    expect(resolved.sibling.label.length).toBeGreaterThan(0);
  });

  it('falls back to the pillar path when no same-cluster candidate exists', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'published',
      draft: false,
      noindex: false,
    });
    (post as { id: string }).id = 'orphan-guide.mdx';
    const resolved = resolveInternalLinks(post, [post]);
    expect(resolved.sibling.href).toBe(ARTICLE_PILLARS['mineral-rights-taxes'].path);
  });

  it('ignores a declared sibling that equals the pillar path and substitutes a real sibling', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'published',
      draft: false,
      noindex: false,
      internal_links: {
        hub: '/learning-center/',
        sibling: ARTICLE_PILLARS['mineral-rights-taxes'].path,
        conversion: MRX_CONVERSION_PATH,
      },
    });
    (post as { id: string }).id = 'current-guide.mdx';
    const resolved = resolveInternalLinks(post, [post, siblingPost]);
    expect(resolved.sibling.href).toBe('/blog/sibling-guide/');
  });

  it('rejects malformed, external, and unreleased article targets', () => {
    const held = makePost({
      content_cluster: 'tax-1031-legal-education',
      publication_status: 'draft',
      draft: true,
      noindex: true,
    });
    (held as { id: string }).id = 'held-guide.mdx';

    for (const sibling of [
      'https://example.com/trap',
      '//example.com/trap',
      '/../admin/',
      '/blog/held-guide/',
    ]) {
      const post = makePost({
        content_cluster: 'tax-1031-legal-education',
        publication_status: 'published',
        draft: false,
        noindex: false,
        internal_links: {
          hub: 'https://example.com/trap',
          sibling,
          conversion: MRX_CONVERSION_PATH,
        },
      });
      (post as { id: string }).id = 'current-guide.mdx';
      const resolved = resolveInternalLinks(post, [post, held]);
      expect(resolved.hub.href).toBe(ARTICLE_PILLARS['mineral-rights-taxes'].path);
      expect(resolved.sibling.href).toBe(ARTICLE_PILLARS['mineral-rights-taxes'].path);
      expect(resolved.conversion.href).toBe('/book/');
    }
  });
});

describe('current public article invariants', () => {
  const approvedSlugs = [
    'how-are-mineral-rights-valued',
    'how-to-compare-mineral-rights-buyers-in-texas',
    'how-to-sell-mineral-rights-in-texas',
    'texas-severance-tax-what-mineral-rights-owners-need-to-know',
    'what-documents-do-you-need-to-sell-mineral-rights-in-texas',
    'what-is-a-clawback-clause-in-a-mineral-rights-sale',
  ];

  it('keeps the six approved articles published and inside the noindex-false gate', () => {
    for (const slug of approvedSlugs) {
      const path = join(postsDir, `${slug}.mdx`);
      const frontmatter =
        readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      expect(frontmatter, slug).not.toBe('');
      expect(/^publication_status:\s*published\s*$/m.test(frontmatter), slug).toBe(true);
      // draft defaults to false via the zod schema when omitted; a published
      // post must not explicitly opt in to draft:true or noindex:true.
      expect(/^draft:\s*true\s*$/m.test(frontmatter), slug).toBe(false);
      expect(/^noindex:\s*true\s*$/m.test(frontmatter), slug).toBe(false);
    }
  });

  it('lets every approved legacy article resolve to a registered pillar', () => {
    for (const slug of approvedSlugs) {
      const source = readFileSync(join(postsDir, `${slug}.mdx`), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
      const category =
        frontmatter.match(/^category:\s*(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
      const tags = (frontmatter.match(/^tags:\s*\n((?:\s+-.^\n?)*)/m)?.[1] ?? '')
        .split('\n')
        .map((tag) => tag.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean);
      const post = makePost({
        title,
        category: (category || undefined) as never,
        tags,
      });
      const pillar = resolvePillar(post);
      expect(pillar.id, slug).toBeTruthy();
      expect(ARTICLE_PILLARS[pillar.id]).toBeDefined();
    }
  });
});

describe('publication-gate noindex escape hatch', () => {
  it('rejects a row with publication_status=published + noindex=true', () => {
    const post = makePost({
      publication_status: 'published',
      draft: false,
      noindex: true,
    });
    expect(isPublishedPost(post)).toBe(false);
  });

  it('rejects a row with publication_status=published + draft=true', () => {
    const post = makePost({
      publication_status: 'published',
      draft: true,
      noindex: false,
    });
    expect(isPublishedPost(post)).toBe(false);
  });

  it('rejects a row whose publication_status is anything other than "published"', () => {
    for (const status of [
      undefined,
      'draft',
      'searchatlas_review',
      'editorial_review',
      'compliance_review',
      'approved',
      'retired',
    ] as const) {
      const post = makePost({
        publication_status: status as never,
        draft: false,
        noindex: false,
      });
      expect(isPublishedPost(post), `status=${String(status)}`).toBe(false);
    }
  });

  it('accepts a row with publication_status=published + draft=false + noindex=false', () => {
    const post = makePost({
      publication_status: 'published',
      draft: false,
      noindex: false,
    });
    expect(isPublishedPost(post)).toBe(true);
  });

  it('keeps MRX1000 pilot posts out of the public gate (noindex=true, draft=true, status=draft)', () => {
    const pilotSlugs = readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .filter((file) => /noindex:\s*true/.test(readFileSync(join(postsDir, file), 'utf8')));
    expect(pilotSlugs.length).toBeGreaterThan(0);
    for (const file of pilotSlugs) {
      const source = readFileSync(join(postsDir, file), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const cluster =
        frontmatter.match(/^content_cluster:\s*(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
      const post = makePost({
        publication_status: 'draft',
        draft: true,
        noindex: true,
        content_cluster: cluster as never,
      });
      expect(isPublishedPost(post), file).toBe(false);
    }
  });
});

describe('articleCta honors conversion_cta override and default conversion triangle', () => {
  it('uses the declared conversion_cta when present', () => {
    const post = makePost({
      content_cluster: 'tax-1031-legal-education',
      conversion_cta: { label: 'Custom CTA', href: '/book/?source=custom' },
    });
    const cta = articleCta(post);
    expect(cta.label).toBe('Custom CTA');
    expect(cta.href).toBe('/book/?source=custom');
  });

  it('falls back to the pillar defaultCta and /book/ conversion path', () => {
    const post = makePost({ content_cluster: 'tax-1031-legal-education' });
    const cta = articleCta(post);
    expect(cta.label).toBe(ARTICLE_PILLARS['mineral-rights-taxes'].defaultCta);
    expect(cta.href).toBe(MRX_CONVERSION_PATH);
  });
});
