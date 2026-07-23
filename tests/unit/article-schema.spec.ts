import { describe, expect, it } from 'vitest';
import { article } from '../../src/structured-data/article';

const post = {
  slug: 'sample-article',
  title: 'Sample Mineral Rights Article',
  description:
    'A sufficiently detailed sample description for testing canonical Article structured-data identifiers without publishing any content.',
  published_at: '2026-07-20T00:00:00Z',
  category: 'mineral-rights',
} as never;

describe('Article structured-data canonical identifiers', () => {
  it('defaults public posts to their blog canonical', () => {
    const graph = article(post, 'https://mineralrightsxchange.com/#org', '/hero.webp');
    expect(graph['@id']).toBe('https://mineralrightsxchange.com/blog/sample-article/#article');
    expect(graph.mainEntityOfPage).toMatchObject({
      '@id': 'https://mineralrightsxchange.com/blog/sample-article/#page',
    });
  });

  it('supports an explicit staged canonical without a /blog prefix', () => {
    const graph = article(
      post,
      'https://mineralrightsxchange.com/#org',
      '/hero.webp',
      'MRX Editorial Team',
      '/staged/mrx1000/pilot-001/sample-article/',
    );
    expect(graph['@id']).toBe(
      'https://mineralrightsxchange.com/staged/mrx1000/pilot-001/sample-article/#article',
    );
    expect(graph.mainEntityOfPage).toMatchObject({
      '@id': 'https://mineralrightsxchange.com/staged/mrx1000/pilot-001/sample-article/#page',
    });
  });
});
