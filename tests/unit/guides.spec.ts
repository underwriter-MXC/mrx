import { describe, expect, it } from 'vitest';
import {
  activeGuides,
  getGuide,
  getGuideChatLabel,
  guides,
  routeGuide,
} from '../../src/data/guides';

describe('MRX AI guide routing', () => {
  it('launches exactly the six approved active response modes', () => {
    expect(activeGuides.map((guide) => guide.slug)).toEqual([
      'tommy',
      'cooper',
      'charlie',
      'dale',
      'rebecca',
      'angela',
    ]);
  });

  it.each([
    ['Can I book a phone appointment?', 'angela'],
    ['I inherited a deed and need county records', 'cooper'],
    ['What basin and formation is this nearby well in?', 'charlie'],
    ['Why did my royalty check decline with production?', 'dale'],
    ['What does this contract clause mean for closing?', 'rebecca'],
    ['Is this mineral offer worth considering?', 'tommy'],
  ])('routes “%s” to %s', (question, expected) => {
    expect(routeGuide(question).slug).toBe(expected);
  });

  it('keeps launch directory profiles non-interactive and clearly labeled as AI guides', () => {
    expect(
      guides.filter((guide) => guide.status === 'directory').map((guide) => guide.slug),
    ).toEqual(['walt', 'monty', 'cami', 'ariana', 'ainsley']);
    expect(guides.every((guide) => guide.role.includes('AI Guide'))).toBe(true);
    expect(getGuide('tommy')?.limits).toMatch(/educational information/i);
  });

  it.each([
    ['tommy', 'Tommy MRX Offer and Value Guide'],
    ['cooper', 'Cooper MRX Ownership and Records Guide'],
    ['charlie', 'Charlie MRX Geology and Basin Guide'],
    ['dale', 'Dale MRX Production and Royalty Guide'],
    ['rebecca', 'Rebecca MRX Terms and Professional-Routing Guide'],
    ['angela', 'Angela MRX Scheduling and Next-Steps Guide'],
    ['walt', 'Walt MRX Risk Guide'],
    ['monty', 'Monty MRX Decision-Context Guide'],
    ['cami', 'Cami MRX Decision-Process Guide'],
    ['ariana', 'Ariana MRX Owner-Options Guide'],
    ['ainsley', 'Ainsley MRX Process-Experience Guide'],
  ])('uses the published position for %s in chat', (slug, expected) => {
    expect(getGuideChatLabel(slug)).toBe(expected);
  });
});
