import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const route = readFileSync(
  join(repoRoot, 'src', 'pages', 'mineral-rights-offer-comparison.astro'),
  'utf8',
);
const tool = readFileSync(
  join(repoRoot, 'src', 'components', 'organisms', 'OfferComparisonTool.astro'),
  'utf8',
);

describe('private mineral-rights offer comparison', () => {
  it('ships an indexable answer-first route with FAQ schema inputs', () => {
    expect(route).toContain('path="/mineral-rights-offer-comparison/"');
    expect(route).toContain('<CitedAnswer');
    expect(route).toContain('faq={faqs}');
    expect(route).toContain('<OfferComparisonTool />');
  });

  it('delivers value before offering profile creation', () => {
    const resultPosition = tool.indexOf('data-offer-result');
    const profilePosition = tool.indexOf('offer-comparison-free-profile');

    expect(resultPosition).toBeGreaterThan(-1);
    expect(profilePosition).toBeGreaterThan(resultPosition);
    expect(tool).toContain('Create my free profile');
    expect(tool).toContain('Ask Tommy about these flags');
    expect(tool).toContain('Request a free underwriter review');
  });

  it('keeps entered financial terms in the browser and out of analytics', () => {
    expect(tool).not.toContain('fetch(');
    expect(tool).not.toContain('localStorage');
    expect(tool).not.toContain('sessionStorage');
    expect(tool).toContain("track('offer_comparison_completed'");
    expect(tool).not.toMatch(/track\([^)]*(headline|fees|netA|netB)/s);
  });
});
