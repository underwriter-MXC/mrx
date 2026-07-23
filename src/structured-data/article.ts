/**
 * Per-post Article JSON-LD factory. Per SEO plan §2.4. Every blog post
 * emits an Article node with author, dates, hero image, and a
 * SpeakableSpecification that points at the visible answer-first blocks.
 */
import type { Article, SpeakableSpecification } from 'schema-dts';
import type { PostsFrontmatter } from '../lib/astro/content';
import { SITE } from '../lib/site';

export function article(
  post: PostsFrontmatter,
  authorUrlId: string,
  heroImageUrl: string,
  authorName = 'MRX Editorial Team',
  canonicalPath = `/blog/${post.slug}/`,
): Article {
  const path = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = new URL(path.endsWith('/') ? path : `${path}/`, `${SITE.url}/`).toString();
  return {
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: post.title,
    description: post.description,
    image: [heroImageUrl],
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    author: {
      '@type': 'Organization',
      '@id': authorUrlId,
      name: authorName,
      url: authorUrlId.replace(/#author$/, ''),
    },
    publisher: { '@id': `${SITE.url}/#org` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#page`,
    },
    articleSection: post.category,
    inLanguage: SITE.locale,
    speakable: speakable(),
    isPartOf: { '@id': `${SITE.url}/#site` },
  };
}

export function speakable(): SpeakableSpecification {
  // Only direct-answer and takeaway blocks are nominated. Disclaimers remain
  // visible but are not the primary text answer engines should quote.
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: ['.cited-answer', '.article-takeaways'],
  };
}
