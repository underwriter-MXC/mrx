import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

export type PillarTopicDefinition = {
  id: string;
  title: string;
  description: string;
  matches: (post: Post) => boolean;
};

export type PillarTopicGroup = Omit<PillarTopicDefinition, 'matches'> & {
  posts: Post[];
};

/**
 * Assigns each article to the first matching topic. The final topic acts as
 * the catch-all so a newly published pillar article is never omitted from its
 * hub just because its wording does not match an existing subtopic.
 */
export function groupPillarPosts(
  posts: Post[],
  definitions: PillarTopicDefinition[],
): PillarTopicGroup[] {
  if (definitions.length === 0) return [];

  const remaining = new Set(posts.map((post) => post.id));

  return definitions
    .map((definition, index) => {
      const isCatchAll = index === definitions.length - 1;
      const topicPosts = posts.filter(
        (post) => remaining.has(post.id) && (isCatchAll || definition.matches(post)),
      );
      topicPosts.forEach((post) => remaining.delete(post.id));

      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        posts: topicPosts,
      };
    })
    .filter((topic) => topic.posts.length > 0);
}

export function postSearchText(post: Post): string {
  return [post.data.title, post.data.description, post.data.excerpt, ...(post.data.tags ?? [])]
    .join(' ')
    .toLowerCase();
}
