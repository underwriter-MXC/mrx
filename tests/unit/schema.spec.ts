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
    expect(org?.logo).toBe('https://mineralrightsxchange.com/assets/brand/mrx-logo-color.png');
  });

  it('WebPage carries the site-wide SpeakableSpecification', () => {
    const wp = graph.find((n: any) => n['@type'] === 'WebPage') as any;
    expect(wp?.speakable).toBeDefined();
    expect(wp?.speakable['@type']).toBe('SpeakableSpecification');
    expect(wp?.speakable.cssSelector).toEqual(
      expect.arrayContaining(['.mrx-disclaimer-footer', '.mrx-disclaimer-top', '.cited-answer']),
    );
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
