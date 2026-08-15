import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canonicalizeInternalHref,
  loadRedirectRules,
} from '../../scripts/postbuild-canonical-links.mjs';

describe('rendered internal-link canonicalization', () => {
  it('normalizes ordinary page links to the slash-canonical route', () => {
    expect(canonicalizeInternalHref('/about')).toBe('/about/');
    expect(canonicalizeInternalHref('/book?source=footer#form')).toBe('/book/?source=footer#form');
  });

  it('leaves files, action endpoints, fragments, and external links alone', () => {
    expect(canonicalizeInternalHref('/blog/rss.xml')).toBe('/blog/rss.xml');
    expect(canonicalizeInternalHref('/api/book')).toBe('/api/book');
    expect(canonicalizeInternalHref('#faq')).toBe('#faq');
    expect(canonicalizeInternalHref('https://example.com/about')).toBe('https://example.com/about');
  });

  it('rewrites governed legacy article aliases without changing article source', async () => {
    const rules = await loadRedirectRules();
    expect(canonicalizeInternalHref('/blog/hidden-terms-in-a-mineral-rights-offer/', rules)).toBe(
      '/blog/how-to-know-if-your-mineral-rights-offer-is-fair/',
    );
    expect(canonicalizeInternalHref('/2026/06/02/example-article?ref=legacy', rules)).toBe(
      '/blog/example-article/?ref=legacy',
    );
  });

  it('keeps every intentional account anchor marked nofollow', () => {
    const files = [
      'src/components/organisms/Header.astro',
      'src/components/organisms/OfferComparisonTool.astro',
      'src/components/react/AskTommy.tsx',
      'src/pages/contact.astro',
      'src/pages/communication-preferences.astro',
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<a\b[^>]*href=["']\/account\/[^>]*>/g)) {
        expect(match[0], `${file} account anchor`).toMatch(/rel=["'][^"']*nofollow/);
      }
    }
  });
});
