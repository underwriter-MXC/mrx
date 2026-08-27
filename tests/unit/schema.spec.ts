import { describe, it, expect } from 'vitest';
import { siteGraph } from '../../src/structured-data/site';

describe('site-level JSON-LD graph', () => {
  const graph = siteGraph('/', 'Mineral Rights Xchange');

  it('includes Organization, ProfessionalService, WebSite, and WebPage', () => {
    const types = graph.map((n: any) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('ProfessionalService');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
  });

  it('Organization has a logo, URL, and name', () => {
    const org = graph.find((n: any) => n['@type'] === 'Organization') as any;
    expect(org?.name).toBeTruthy();
    expect(org?.url).toBeTruthy();
    expect(org?.logo).toBe('https://mineralrightsxchange.com/assets/brand/mrx-logo-color.webp');
  });

  it('WebPage carries a SpeakableSpecification that nominates at least one answer block', () => {
    const wp = graph.find((n: any) => n['@type'] === 'WebPage') as any;
    expect(wp?.speakable).toBeDefined();
    expect(wp?.speakable['@type']).toBe('SpeakableSpecification');
    // The exact selector set evolves as MRX adds/removes cite-target
    // answer blocks; the contract is "at least one answer-style block
    // is nominated". Both legacy (disclaimer) and current (cited-answer
    // + article-takeaways) selector sets are acceptable.
    const selectors: string[] = wp?.speakable?.cssSelector ?? [];
    const hasAnswerSelector = selectors.some(
      (s: string) =>
        s === '.cited-answer' ||
        s === '.article-takeaways' ||
        s === '.mrx-disclaimer-footer' ||
        s === '.mrx-disclaimer-top',
    );
    expect(
      hasAnswerSelector,
      `speakable.cssSelector empty or non-cite: ${selectors.join(',')}`,
    ).toBe(true);
  });

  it('does not include any aggregateRating (per §10)', () => {
    for (const node of graph) {
      expect((node as any).aggregateRating).toBeUndefined();
    }
  });

  it('does not include any unsourced review count or aggregate rating', () => {
    const serialized = JSON.stringify(graph);
    expect(serialized).not.toMatch(/reviewCount/i);
    expect(serialized).not.toMatch(/aggregateRating/i);
  });
});
