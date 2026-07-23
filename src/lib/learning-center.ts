import { getCollection, getEntry } from 'astro:content';
import { isPublishedPost } from './content-graph';

export interface LearningCenterItem {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  author: string;
  authorSlug: string;
  publishedAt: string;
  readingMinutes: number;
  heroImage: string;
  heroAlt: string;
  featured: boolean;
}

export interface LearningCenterCategory {
  slug: string;
  label: string;
}

export interface LearningCenterAuthor {
  slug: string;
  name: string;
}

export async function getLearningCenterData() {
  const [posts, categories] = await Promise.all([
    getCollection('posts', isPublishedPost),
    getCollection('categories'),
  ]);
  const categoryMap = new Map(
    categories.map((category) => [category.data.slug, category.data.label]),
  );

  const items = await Promise.all(
    posts.map(async (post): Promise<LearningCenterItem> => {
      const author = await getEntry(post.data.author);
      return {
        slug: post.id.replace(/\.mdx?$/, ''),
        title: post.data.title,
        description: post.data.description,
        excerpt: post.data.excerpt,
        category: post.data.category,
        categoryLabel:
          categoryMap.get(post.data.category) || post.data.category.replaceAll('-', ' '),
        tags: post.data.tags,
        author: author?.data.name || 'MRX Editorial Team',
        authorSlug: author?.id.replace(/\.mdx?$/, '') || 'mrx-editorial-team',
        publishedAt: post.data.published_at,
        readingMinutes: Math.max(1, Math.round(post.body.split(/\s+/).length / 220)),
        heroImage: post.data.hero_image.src,
        heroAlt: post.data.hero_image.alt,
        featured: post.data.featured,
      };
    }),
  );

  items.sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() ||
      a.slug.localeCompare(b.slug),
  );

  return {
    items,
    authors: Array.from(
      items
        .reduce((authors, item) => {
          authors.set(item.authorSlug, item.author);
          return authors;
        }, new Map<string, string>())
        .entries(),
    )
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    categories: categories
      .map((category) => ({ slug: category.data.slug, label: category.data.label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
