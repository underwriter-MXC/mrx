import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { archivePageNumbers } from '../../src/lib/archive-pagination';
import { selectCanonicalArticlesSitemap } from '../../scripts/build-mrx-1000-readiness-matrix.mjs';

const articleSitemapCandidates = [
  join(process.cwd(), 'dist/client/sitemap-articles.xml'),
  join(process.cwd(), 'dist/sitemap-articles.xml'),
];

describe('canonical sitemap discovery', () => {
  it('advertises the canonical underscore sitemap index in robots.txt', () => {
    const robots = readFileSync(join(process.cwd(), 'public', 'robots.txt'), 'utf-8');
    const directives = robots.match(/^Sitemap:\s*(.+)$/gim) ?? [];

    expect(directives).toEqual(['Sitemap: https://mineralrightsxchange.com/sitemap_index.xml']);
  });

  it('keeps staged QA URLs out of the selected public sitemap index', () => {
    const selected = selectCanonicalArticlesSitemap(articleSitemapCandidates, (candidate) =>
      candidate.toString().endsWith('dist/sitemap-articles.xml'),
    );
    expect(selected).toBe(articleSitemapCandidates[1]);

    const postbuild = readFileSync(join(process.cwd(), 'scripts', 'postbuild-sitemap.mjs'), 'utf8');
    expect(postbuild).toContain('segmentNames.push(name)');
    expect(postbuild).toContain("await writeFile(join(outputDir, 'sitemap-staged.xml')");
    expect(postbuild).not.toContain("segmentNames.push('sitemap-staged.xml')");
  });

  it('keeps private communication preferences out of crawlable output', () => {
    const page = readFileSync(
      join(process.cwd(), 'src', 'pages', 'communication-preferences.astro'),
      'utf8',
    );
    const astroConfig = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');

    expect(page).toContain('noindex={true}');
    expect(page).toContain('robots="noindex, nofollow"');
    expect(astroConfig).toContain("!pathname.startsWith('/communication-preferences')");
  });

  it('publishes only the populated continuation pages required by the public article count', () => {
    const postsDirectory = join(process.cwd(), 'src', 'content', 'posts');
    const publicPostCount = readdirSync(postsDirectory)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => readFileSync(join(postsDirectory, file), 'utf8'))
      .filter(
        (source) =>
          /^publication_status:\s*published\s*$/m.test(source) &&
          !/^draft:\s*true\s*$/m.test(source) &&
          !/^noindex:\s*true\s*$/m.test(source),
      ).length;
    const admittedArticleCount = (
      JSON.parse(
        readFileSync(join(process.cwd(), 'config', 'mrx1000-release-10-batch.json'), 'utf8'),
      ) as { articles: unknown[] }
    ).articles.length;
    expect(publicPostCount).toBe(admittedArticleCount + 9);
    expect(archivePageNumbers(publicPostCount)).toEqual([2, 3, 4, 5, 6]);

    const continuationRoute = readFileSync(
      join(process.cwd(), 'src', 'pages', 'blog', 'category', '[category]', 'page', '[page].astro'),
      'utf8',
    );
    expect(continuationRoute).toContain('archivePageNumbers(categoryPosts.length)');
  });
});
