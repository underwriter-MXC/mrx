import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('public crawl protections', () => {
  it('allows named search crawlers on public pages while protecting private and action surfaces', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    const sections = robots.split(/\n\s*\n/).filter((section) => /^User-agent:/i.test(section));
    expect(sections).toHaveLength(6);
    for (const section of sections) {
      expect(section).toContain('Allow: /');
      for (const route of [
        '/api',
        '/api/',
        '/account',
        '/account/',
        '/owner-intake',
        '/owner-intake/',
        '/book/thank-you',
        '/book/thank-you/',
        '/free-guide/thank-you',
        '/free-guide/thank-you/',
        '/knowledge',
        '/knowledge/',
        '/blog/drafts',
        '/blog/drafts/',
        '/staff',
        '/staff/',
      ]) {
        expect(section).toContain(`Disallow: ${route}`);
      }
    }
    for (const crawler of [
      'OAI-SearchBot',
      'GPTBot',
      'ClaudeBot',
      'PerplexityBot',
      'Google-Extended',
    ]) {
      expect(robots).toContain(`User-agent: ${crawler}`);
    }
    expect(robots).toContain('Sitemap: https://mineralrightsxchange.com/sitemap_index.xml');
  });

  it('adds defense-in-depth noindex headers at the production edge', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    for (const source of [
      '/api',
      '/api/',
      '/api/:path*',
      '/account',
      '/account/',
      '/account/:path*',
      '/owner-intake',
      '/owner-intake/',
      '/owner-intake/:path*',
      '/knowledge',
      '/knowledge/',
      '/knowledge/:path*',
      '/blog/drafts',
      '/blog/drafts/',
      '/blog/drafts/:path*',
      '/staff',
      '/staff/',
      '/staff/:path*',
      '/book/thank-you',
      '/book/thank-you/',
      '/free-guide/thank-you',
      '/free-guide/thank-you/',
    ]) {
      const rule = config.headers.find((candidate) => candidate.source === source);
      expect(rule, source).toBeDefined();
      expect(rule?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    }

    const protectedPaths = [
      '/api',
      '/api/',
      '/api/book',
      '/api/missing/deep',
      '/account',
      '/account/',
      '/account/private/deep',
      '/owner-intake',
      '/owner-intake/',
      '/owner-intake/private/deep',
      '/knowledge',
      '/knowledge/',
      '/knowledge/private/deep',
      '/blog/drafts',
      '/blog/drafts/',
      '/blog/drafts/example/deep',
      '/staff',
      '/staff/',
      '/staff/private/deep',
      '/book/thank-you',
      '/book/thank-you/',
      '/free-guide/thank-you',
      '/free-guide/thank-you/',
    ];
    for (const path of protectedPaths) {
      expect(
        config.headers.some(
          (rule) =>
            rule.headers.some(
              (header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow',
            ) && sourceMatches(rule.source, path),
        ),
        path,
      ).toBe(true);
    }
  });
});

function sourceMatches(source: string, path: string) {
  if (source.endsWith('/:path*')) {
    const prefix = source.slice(0, -'/:path*'.length);
    return path.startsWith(`${prefix}/`) && path.length > prefix.length + 1;
  }
  return source === path;
}
