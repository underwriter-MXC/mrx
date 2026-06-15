/**
 * Per-post Article JSON-LD factory. Per SEO plan §2.4. Every blog post
 * emits an Article node with author, dates, hero image, and a
 * SpeakableSpecification that points at the §7 disclaimer.
 */
import type { Article, SpeakableSpecification } from 'schema-dts';
import type { PostsFrontmatter } from '../lib/astro/content';
import { SITE } from '../lib/site';

export function article(
  post: PostsFrontmatter,
  authorUrlId: string,
  heroImageUrl: string,
): Article {
  return {
    '@type': 'Article',
    '@id': `${SITE.url}/blog/${post.slug}/#article`,
    headline: post.title,
    description: post.description,
    image: [heroImageUrl],
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    author: { '@id': authorUrlId },
    publisher: { '@id': `${SITE.url}/#org` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE.url}/blog/${post.slug}/`,
    },
    articleSection: post.category,
    inLanguage: SITE.locale,
    speakable: speakable(),
    isPartOf: { '@id': `${SITE.url}/#site` },
  };
}

export function speakable(): SpeakableSpecification {
  // CSS selectors point at the §7 disclaimer (per SEO plan §2.5) and
  // the AEO "Cited answer" blocks rendered by <CitedAnswer />. The
  // Speakable scope protects MRX from being quoted out of context,
  // and signals answer engines (Bing, Perplexity, Google AI Overviews,
  // ChatGPT search, etc.) that these blocks are safe to cite.
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: [
      '.mrx-disclaimer-footer',
      '.mrx-disclaimer-top',
      '.cited-answer',
    ],
  };
}
