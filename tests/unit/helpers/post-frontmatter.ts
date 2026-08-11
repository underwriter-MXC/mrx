import { articleImageFilenameMatchesText } from '../../../src/lib/article-images';

export type ParsedPostFrontmatter = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  draft: boolean;
  noindex: boolean;
  publicationStatus: string;
  contentProgram: string;
  primaryKeyword: string;
  hero: {
    src: string;
    alt: string;
    socialSrc: string;
  };
  inline: {
    src: string;
    alt: string;
    renderedText: string;
  };
};

function unquote(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(['"])(.*)\1$/);
  if (!match) return trimmed;
  return match[1] === "'" ? match[2].replaceAll("''", "'") : match[2].replaceAll('\\"', '"');
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
  options: {
    requireDistinctSocial: boolean;
    requireCanonicalSocial?: boolean;
    requireInline?: boolean;
    requireTextMatchedFilenames?: boolean;
  },
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
  if (options.requireCanonicalSocial) {
    if (!post.hero.socialSrc) violations.push('missing social source');
    if (post.hero.socialSrc !== post.hero.src) {
      violations.push('hero and social paths must use the same canonical asset');
    }
  }
  if (options.requireInline) {
    if (!post.inline.src) violations.push('missing in-body image source');
    if (!post.inline.renderedText) violations.push('missing in-body rendered text');
    if (post.inline.src === post.hero.src) violations.push('hero and in-body paths must differ');
    if (post.inline.alt.length < 20 || /^(image|photo|hero|placeholder)$/i.test(post.inline.alt)) {
      violations.push('placeholder in-body alt text');
    }
  }
  if (options.requireTextMatchedFilenames) {
    if (!articleImageFilenameMatchesText(post.hero.src, post.title)) {
      violations.push('hero filename/title mismatch');
    }
    if (
      post.inline.src &&
      !articleImageFilenameMatchesText(post.inline.src, post.inline.renderedText)
    ) {
      violations.push('in-body filename/text mismatch');
    }
  }
  return violations;
}

export function parsePostFrontmatter(source: string, slug: string): ParsedPostFrontmatter {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

  return {
    slug,
    title: scalar(frontmatter, 'title'),
    seoTitle: scalar(frontmatter, 'seo_title'),
    description: scalar(frontmatter, 'description'),
    draft: asBoolean(scalar(frontmatter, 'draft')),
    noindex: asBoolean(scalar(frontmatter, 'noindex')),
    publicationStatus: scalar(frontmatter, 'publication_status'),
    contentProgram: scalar(frontmatter, 'content_program'),
    primaryKeyword: scalar(frontmatter, 'primary_keyword'),
    hero: {
      src: nestedScalar(frontmatter, 'hero_image', 'src'),
      alt: nestedScalar(frontmatter, 'hero_image', 'alt'),
      socialSrc: nestedScalar(frontmatter, 'hero_image', 'social_src'),
    },
    inline: {
      src: nestedScalar(frontmatter, 'inline_image', 'src'),
      alt: nestedScalar(frontmatter, 'inline_image', 'alt'),
      renderedText: nestedScalar(frontmatter, 'inline_image', 'rendered_text'),
    },
  };
}
