export type ParsedPostFrontmatter = {
  slug: string;
  title: string;
  description: string;
  draft: boolean;
  noindex: boolean;
  publicationStatus: string;
  contentProgram: string;
  hero: {
    src: string;
    alt: string;
    socialSrc: string;
  };
};

function unquote(value: string): string {
  return value.trim().replace(/^(['"])(.*)\1$/, '$2');
}

function scalar(frontmatter: string, key: string): string {
  const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '';
  return unquote(raw);
}

function nestedScalar(frontmatter: string, parent: string, key: string): string {
  const block =
    frontmatter.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  const raw = block.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1] ?? '';
  return unquote(raw);
}

function asBoolean(value: string): boolean {
  return value === 'true';
}

const pilotPlaceholder = '/assets/brand/mrx-underwriter-review-og.png';

export function imagePolicyViolations(
  post: ParsedPostFrontmatter,
  options: { requireDistinctSocial: boolean },
): string[] {
  const violations: string[] = [];
  if (!post.hero.src) violations.push('missing hero source');
  if (post.hero.src === pilotPlaceholder || /placeholder/i.test(post.hero.src)) {
    violations.push('generic hero placeholder');
  }
  if (post.hero.alt.length < 20 || /^(image|photo|hero|placeholder)$/i.test(post.hero.alt)) {
    violations.push('placeholder alt text');
  }
  if (options.requireDistinctSocial) {
    if (!post.hero.socialSrc) violations.push('missing social source');
    if (post.hero.socialSrc === post.hero.src) violations.push('hero and social paths must differ');
    if (post.hero.socialSrc === pilotPlaceholder || /placeholder/i.test(post.hero.socialSrc)) {
      violations.push('generic social placeholder');
    }
  }
  return violations;
}

export function parsePostFrontmatter(source: string, slug: string): ParsedPostFrontmatter {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

  return {
    slug,
    title: scalar(frontmatter, 'title'),
    description: scalar(frontmatter, 'description'),
    draft: asBoolean(scalar(frontmatter, 'draft')),
    noindex: asBoolean(scalar(frontmatter, 'noindex')),
    publicationStatus: scalar(frontmatter, 'publication_status'),
    contentProgram: scalar(frontmatter, 'content_program'),
    hero: {
      src: nestedScalar(frontmatter, 'hero_image', 'src'),
      alt: nestedScalar(frontmatter, 'hero_image', 'alt'),
      socialSrc: nestedScalar(frontmatter, 'hero_image', 'social_src'),
    },
  };
}
