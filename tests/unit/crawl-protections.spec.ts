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
        '/api/',
        '/account/',
        '/book/thank-you/',
        '/free-guide/thank-you/',
        '/knowledge/',
        '/blog/drafts/',
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
      '/api/(.*)',
      '/account/(.*)',
      '/knowledge/(.*)',
      '/blog/drafts/(.*)',
      '/staff/(.*)',
      '/book/thank-you',
      '/free-guide/thank-you',
    ]) {
      const rule = config.headers.find((candidate) => candidate.source === source);
      expect(rule, source).toBeDefined();
      expect(rule?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    }
  });
});
