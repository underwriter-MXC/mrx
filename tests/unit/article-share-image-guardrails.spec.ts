import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { imagePolicyViolations, parsePostFrontmatter } from './helpers/post-frontmatter';

const repoRoot = join(import.meta.dirname, '..', '..');
const publishedFixture = `---
title: 'Fixture article'
description: 'Fixture description'
draft: false
publication_status: published
hero_image:
  src: '/assets/articles/fixture.webp'
  alt: 'A specific illustration for the fixture article.'
---`;

describe('post frontmatter helper', () => {
  it('parses scalar and nested hero metadata from current MDX frontmatter', () => {
    expect(parsePostFrontmatter(publishedFixture, 'fixture')).toMatchObject({
      slug: 'fixture',
      title: 'Fixture article',
      description: 'Fixture description',
      draft: false,
      publicationStatus: 'published',
      hero: {
        src: '/assets/articles/fixture.webp',
        alt: 'A specific illustration for the fixture article.',
      },
    });
  });
});

describe('published article image guardrails', () => {
  it('requires every fail-closed published post to have a unique, local, descriptive hero', () => {
    const postsDir = join(repoRoot, 'src', 'content', 'posts');
    const posts = readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) =>
        parsePostFrontmatter(
          readFileSync(join(postsDir, file), 'utf8'),
          file.replace(/\.mdx$/, ''),
        ),
      );
    const published = posts.filter(
      (post) => post.publicationStatus === 'published' && post.draft !== true,
    );
    const heroPaths = published.map((post) => post.hero.src);
    const explicitlyAllowedVerifiedRemoteSources = new Set<string>();

    // Nine legacy-live posts plus the forty hash-locked release rows.
    // Production publication remains controlled by the separate release gate.
    expect(published).toHaveLength(49);
    expect(new Set(heroPaths).size).toBe(heroPaths.length);
    for (const post of published) {
      expect(post.hero.src, post.slug).toMatch(/^(\/|https:\/\/)/);
      if (post.hero.src.startsWith('/')) {
        expect(existsSync(join(repoRoot, 'public', post.hero.src.slice(1))), post.slug).toBe(true);
      } else {
        expect(explicitlyAllowedVerifiedRemoteSources.has(post.hero.src), post.slug).toBe(true);
      }
      expect(imagePolicyViolations(post, { requireDistinctSocial: false }), post.slug).toEqual([]);
    }
  });

  it('reports MRX1000 draft image gaps and rejects them if publication is attempted', () => {
    const postsDir = join(repoRoot, 'src', 'content', 'posts');
    const mrx1000Posts = readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) =>
        parsePostFrontmatter(
          readFileSync(join(postsDir, file), 'utf8'),
          file.replace(/\.mdx$/, ''),
        ),
      )
      .filter((post) => post.contentProgram === 'mrx1000');
    const currentFailures = mrx1000Posts.filter(
      (post) =>
        post.publicationStatus === 'published' &&
        imagePolicyViolations(post, { requireDistinctSocial: false }).length > 0,
    );
    const exactWave2Slugs = new Set(
      (
        JSON.parse(
          readFileSync(join(repoRoot, 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
        ) as { articles: Array<{ slug: string; admission_status?: string }> }
      ).articles
        .filter((article) => article.admission_status === 'admitted_exact')
        .map((article) => article.slug),
    );
    const exactWave2Posts = mrx1000Posts.filter((post) => exactWave2Slugs.has(post.slug));
    const pilotDraftPosts = mrx1000Posts.filter(
      (post) => post.publicationStatus === 'draft' && post.draft && post.noindex,
    );
    const releaseGaps = pilotDraftPosts.filter(
      (post) => imagePolicyViolations(post, { requireDistinctSocial: true }).length > 0,
    );

    expect(mrx1000Posts).toHaveLength(65);
    expect(
      mrx1000Posts.filter((post) => post.publicationStatus === 'published' && post.draft !== true),
    ).toHaveLength(40);
    expect(
      mrx1000Posts.filter(
        (post) => post.publicationStatus === 'draft' && post.draft && post.noindex,
      ),
    ).toHaveLength(25);
    expect(currentFailures).toEqual([]);
    expect(exactWave2Posts).toHaveLength(15);
    expect(
      exactWave2Posts.every((post) => post.hero.src && post.hero.socialSrc === post.hero.src),
    ).toBe(true);
    expect(releaseGaps).toHaveLength(25);
    expect(mrx1000Posts.filter((post) => releaseGaps.includes(post))).toHaveLength(25);

    const attemptedPublication = {
      ...pilotDraftPosts[0],
      draft: false,
      noindex: false,
      publicationStatus: 'published',
    };
    expect(imagePolicyViolations(attemptedPublication, { requireDistinctSocial: true })).toEqual(
      expect.arrayContaining([
        'generic hero placeholder',
        'hero and social paths must differ',
        'generic social placeholder',
      ]),
    );
  });
});

describe('article share metadata wiring', () => {
  it('renders the complete canonical hero asset without cropping title pixels', () => {
    const articleLayout = readFileSync(
      join(repoRoot, 'src', 'layouts', 'ArticleLayout.astro'),
      'utf8',
    );

    expect(articleLayout).toMatch(
      /\.article-hero-image img\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*auto;[\s\S]*?object-fit:\s*contain;/,
    );
  });

  it('passes the article title, description, and hero/social image through ArticleLayout to Seo', () => {
    const blogRoute = readFileSync(
      join(repoRoot, 'src', 'pages', 'blog', '[...slug].astro'),
      'utf8',
    );
    const articleLayout = readFileSync(
      join(repoRoot, 'src', 'layouts', 'ArticleLayout.astro'),
      'utf8',
    );
    const baseLayout = readFileSync(join(repoRoot, 'src', 'layouts', 'BaseLayout.astro'), 'utf8');
    const seo = readFileSync(join(repoRoot, 'src', 'components', 'seo', 'Seo.astro'), 'utf8');

    expect(blogRoute).toContain('title={seoTitle}');
    expect(blogRoute).toContain('description={post.data.description}');
    expect(blogRoute).toContain('heroImage={post.data.hero_image}');
    expect(articleLayout).toContain(
      'const socialImage = ogImage ?? heroImage.social_src ?? heroImage.src;',
    );
    expect(articleLayout).toContain('title={title}');
    expect(articleLayout).toContain('description={description}');
    expect(articleLayout).toContain('ogImage={socialImage}');
    expect(baseLayout).toContain('ogImage={ogImage}');
    expect(seo).toContain('<meta property="og:title" content={finalTitle} />');
    expect(seo).toContain('<meta property="og:description" content={description} />');
    expect(seo).toContain('<meta property="og:image" content={og} />');
    expect(seo).toContain('<meta name="twitter:title" content={finalTitle} />');
    expect(seo).toContain('<meta name="twitter:description" content={description} />');
    expect(seo).toContain('<meta name="twitter:image" content={og} />');
  });
});
