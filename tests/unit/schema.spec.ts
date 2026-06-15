import { describe, it, expect } from 'vitest';
import { siteGraph } from '../../src/structured-data/site';

describe('site-level JSON-LD graph', () => {
  it('includes Organization, ProfessionalService, WebSite, and WebPage', () => {
    const types = siteGraph.map((n) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('ProfessionalService');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
  });

  it('Organization has a logo, URL, and name', () => {
    const org = siteGraph.find((n) => n['@type'] === 'Organization') as any;
    expect(org?.name).toBeTruthy();
    expect(org?.url).toBeTruthy();
    expect(org?.logo).toMatch(/\.svg$/);
  });

  it('WebPage carries the site-wide SpeakableSpecification', () => {
    const wp = siteGraph.find((n) => n['@type'] === 'WebPage') as any;
    expect(wp?.speakable).toBeDefined();
    expect(wp?.speakable['@type']).toBe('SpeakableSpecification');
    expect(wp?.speakable.cssSelector).toEqual(
      expect.arrayContaining(['.mrx-disclaimer-footer', '.mrx-disclaimer-top', '.cited-answer']),
    );
  });

  it('does not include any aggregateRating (per §10)', () => {
    for (const node of siteGraph) {
      expect((node as any).aggregateRating).toBeUndefined();
    }
  });

  it('does not include any unsourced review count or aggregate rating', () => {
    const serialized = JSON.stringify(siteGraph);
    expect(serialized).not.toMatch(/reviewCount/i);
    expect(serialized).not.toMatch(/aggregateRating/i);
  });
});
