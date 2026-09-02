import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canonicalizeInternalHref,
  loadRedirectRules,
  rewriteInternalAnchorMarkup,
  shouldSuppressInternalHref,
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
    expect(canonicalizeInternalHref('/1031-exchanger/', rules)).toBe('/1031-exchange/');
    expect(canonicalizeInternalHref('/2026/06/02/example-article?ref=legacy', rules)).toBe(
      '/blog/example-article/?ref=legacy',
    );
    const approvedMappings = {
      '/blog/how-to-understand-mineral-rights-valuation-in-texas/':
        '/blog/understanding-texas-mineral-rights-valuation-process/',
      '/blog/mineral-rights-closing-costs-and-fees/':
        '/blog/closing-costs-and-fees-when-selling-mineral-rights-in-texas/',
      '/blog/1031-exchange-rules-for-mineral-rights-owners/':
        '/blog/1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work/',
      '/blog/understanding-probate-mineral-rights-in-texas/':
        '/blog/understanding-the-probate-process-for-mineral-interests/',
      '/blog/what-makes-your-mineral-rights-valuable/':
        '/blog/what-determines-the-value-of-your-mineral-rights/',
      '/blog/factors-that-affect-mineral-rights-value/':
        '/blog/what-determines-the-value-of-your-mineral-rights/',
      '/blog/hidden-terms-in-a-mineral-rights-offer/':
        '/blog/identifying-red-flags-in-mineral-rights-transactions/',
      '/blog/understanding-our-valuation-methodology-ensuring-fairness-and-accuracy-in-your-mineral-rights-review/':
        '/blog/understanding-valuation-methodology-how-it-affects-your-mineral-rights-final-price/',
      '/blog/how-mineral-rights-ownership-works/':
        '/blog/how-texas-mineral-rights-ownership-works-deeds-conveyances-and-title/',
    };
    for (const [source, destination] of Object.entries(approvedMappings)) {
      expect(canonicalizeInternalHref(source, rules), source).toBe(destination);
    }
  });

  it('unwraps held draft destinations without publishing or redirecting them', () => {
    const held = [
      '/blog/1031-exchange-fees-for-mineral-rights-sales/',
      '/blog/understanding-1031-exchange-benefits-for-mineral-rights-owners/',
      '/blog/how-a-1031-exchange-benefits-mineral-rights-owners/',
      '/blog/how-to-navigate-a-1031-exchange-for-mineral-rights/',
      '/blog/how-to-evaluate-mineral-production-in-texas/',
    ];
    for (const href of held) expect(shouldSuppressInternalHref(href), href).toBe(true);
    const source = `<p>Read <a class="related" href="${held[0]}"><strong>the fee guide</strong></a>.</p>`;
    expect(rewriteInternalAnchorMarkup(source).html).toBe(
      '<p>Read <strong>the fee guide</strong>.</p>',
    );
  });

  it('keeps every intentional account anchor marked nofollow', () => {
    const files = [
      'src/components/organisms/Header.astro',
      'src/components/react/AskTravis.tsx',
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
