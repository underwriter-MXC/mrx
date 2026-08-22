import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildArticleTitle, validateArticleTitle } from '../../src/lib/seo';

const postsDirectory = join(process.cwd(), 'src/content/posts');
const postFiles = readdirSync(postsDirectory).filter((file) => /\.mdx?$/.test(file));

function frontmatterValue(source: string, field: string): string | undefined {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return undefined;

  const raw = match[1].trim();
  const quoted = raw.match(/^(['"])(.*)\1$/);
  return quoted ? quoted[2] : raw;
}

describe('article SEO titles', () => {
  it('keeps every release-eligible branded article title within policy', () => {
    const invalid: string[] = [];

    for (const file of postFiles) {
      const source = readFileSync(join(postsDirectory, file), 'utf-8');
      const visibleTitle = frontmatterValue(source, 'title');
      expect(visibleTitle, `${file} is missing title frontmatter`).toBeTruthy();

      const publicationStatus = frontmatterValue(source, 'publication_status');
      const draft = frontmatterValue(source, 'draft') === 'true';
      const noindex = frontmatterValue(source, 'noindex') === 'true';
      const releaseEligible = publicationStatus === 'published' && !draft && !noindex;
      if (!releaseEligible) continue;

      const seoTitle = frontmatterValue(source, 'seo_title');
      const finalTitle = buildArticleTitle(visibleTitle!, seoTitle);
      if (!validateArticleTitle(visibleTitle!, seoTitle).ok) {
        invalid.push(`${file}: ${finalTitle.length} — ${finalTitle}`);
      }
    }

    expect(invalid, invalid.join('\n')).toEqual([]);
  });

  it('keeps final article SEO titles unique', () => {
    const filesByTitle = new Map<string, string[]>();

    for (const file of postFiles) {
      const source = readFileSync(join(postsDirectory, file), 'utf-8');
      const visibleTitle = frontmatterValue(source, 'title')!;
      const finalTitle = buildArticleTitle(visibleTitle, frontmatterValue(source, 'seo_title'));
      filesByTitle.set(finalTitle, [...(filesByTitle.get(finalTitle) ?? []), file]);
    }

    const duplicates = [...filesByTitle.entries()].filter(([, files]) => files.length > 1);
    expect(duplicates).toEqual([]);
  });
});
