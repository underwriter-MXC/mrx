/**
 * Blog RSS feed. /blog/rss.xml
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../../lib/site';
import { isPublishedPost } from '../../lib/content-graph';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('posts', isPublishedPost))
    .sort(
      (a, b) => new Date(b.data.published_at).getTime() - new Date(a.data.published_at).getTime(),
    )
    .slice(0, 100);
  return rss({
    title: `${SITE.name} Blog`,
    description: 'Plain-language explainers for Texas mineral rights owners.',
    site: context.site ?? new URL(SITE.url),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.published_at),
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
  });
}
