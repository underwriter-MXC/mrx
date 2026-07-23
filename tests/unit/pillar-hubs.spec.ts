import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { ARTICLE_PILLARS } from '../../src/lib/content-graph';
import { groupPillarPosts } from '../../src/lib/pillar-hubs';

const routes = [
  {
    id: 'oil-and-gas-royalties',
    path: '/learning-center/oil-and-gas-royalties/',
  },
  {
    id: 'mineral-rights-taxes',
    path: '/learning-center/mineral-rights-taxes/',
  },
  {
    id: 'title-lease-ownership',
    path: '/learning-center/title-lease-ownership/',
  },
] as const;

describe('pillar hub routes', () => {
  it.each(routes)('implements the canonical $id route from the content graph', ({ id, path }) => {
    expect(ARTICLE_PILLARS[id].path).toBe(path);

    const routeFile = join(process.cwd(), 'src/pages', path, 'index.astro');
    expect(existsSync(routeFile), routeFile).toBe(true);

    const source = readFileSync(routeFile, 'utf8');
    expect(source).toContain(`const PILLAR_ID = '${id}' as const;`);
    expect(source).toContain("getCollection('posts', isPublishedPost)");
    expect(source).toContain('resolvePillar(post).id === PILLAR_ID');
    expect(source).toContain('faq={faq}');
    expect(source).toContain('faqs={faq}');

    const title = source.match(/<MarketingLayout\s+title="([^"]+)"/)?.[1] ?? '';
    const description = source.match(/\sdescription="([^"]+)"/)?.[1] ?? '';
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(130);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('renders the direct answer, published article navigation, reviewer, visible FAQ, and CTA', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/organisms/PillarHubPage.astro'),
      'utf8',
    );

    expect(source).toContain('<CitedAnswer');
    expect(source).toContain('data-pillar-article-count');
    expect(source).toContain('<PostCard');
    expect(source).toContain('/authors/mrx-editorial-team/');
    expect(source).toContain('<details>');
    expect(source).toContain('data-pillar-prompt');
  });
});

describe('groupPillarPosts', () => {
  it('assigns every article once and sends unmatched articles to the final topic', () => {
    const posts = ['alpha', 'beta', 'other'].map(
      (id) => ({ id, data: { title: id } }) as unknown as CollectionEntry<'posts'>,
    );
    const groups = groupPillarPosts(posts, [
      { id: 'a', title: 'A', description: 'A', matches: (post) => post.id === 'alpha' },
      { id: 'b', title: 'B', description: 'B', matches: (post) => post.id === 'beta' },
      { id: 'more', title: 'More', description: 'More', matches: () => false },
    ]);

    expect(groups.map((group) => group.posts.map((post) => post.id))).toEqual([
      ['alpha'],
      ['beta'],
      ['other'],
    ]);
  });
});
