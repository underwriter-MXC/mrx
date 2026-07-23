import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LLM discovery files', () => {
  const publicDir = join(process.cwd(), 'public');

  it('publishes llms.txt with canonical MRX pages and compliance caveats', () => {
    const text = readFileSync(join(publicDir, 'llms.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/');
    expect(text).toContain('https://mineralrightsxchange.com/sell-mineral-rights/');
    expect(text).toContain('https://mineralrightsxchange.com/offer-review/');
    expect(text).toContain('https://mineralrightsxchange.com/inherited-mineral-rights/');
    expect(text).toContain('https://mineralrightsxchange.com/methodology/');
    expect(text).toContain('fictional AI interfaces');
    expect(text).toContain('not a certified appraisal');
  });

  it('publishes a public-content-only full index and points the legacy singular file to it', () => {
    const text = readFileSync(join(publicDir, 'llms-full.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/sell-mineral-rights/');
    expect(text).toContain('https://mineralrightsxchange.com/learning-center/');
    expect(text).toContain('https://mineralrightsxchange.com/team/');
    expect(text).toContain('## Published article URLs');
    expect(text).toContain('Use canonical mineralrightsxchange.com URLs');
    expect(text).not.toMatch(/internal strategy|competitor research|raw knowledge index/i);
    expect(existsSync(join(publicDir, 'llm.txt'))).toBe(true);
    expect(readFileSync(join(publicDir, 'llm.txt'), 'utf-8')).toContain(
      'https://mineralrightsxchange.com/llms.txt',
    );
  });

  it('keeps llms-full.txt aligned with published Astro posts', () => {
    const postsDir = join(process.cwd(), 'src/content/posts');
    const expectedPublishedPosts = readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => readFileSync(join(postsDir, file), 'utf-8'))
      .filter((source) => {
        const status = source
          .match(/^publication_status:\s*(.+)$/m)?.[1]
          ?.trim()
          .replace(/^['"]|['"]$/g, '')
          .trim();
        return status === 'published';
      }).length;

    const text = readFileSync(join(publicDir, 'llms-full.txt'), 'utf-8');
    const articleUrls = text.match(/https:\/\/mineralrightsxchange\.com\/blog\//g) ?? [];
    expect(articleUrls).toHaveLength(expectedPublishedPosts);
  });
});
