import { describe, expect, it } from 'vitest';
import {
  activeGuides,
  getGuide,
  getGuideChatLabel,
  guides,
  routeGuide,
  routeGuideDecision,
} from '../../src/data/guides';

describe('MRX AI guide routing', () => {
  it('launches exactly the six approved active response modes', () => {
    expect(activeGuides.map((guide) => guide.slug)).toEqual([
      'travis',
      'connor',
      'clay',
      'owen',
      'laurel',
      'elena',
    ]);
  });

  it.each([
    ['Can I book a phone appointment?', 'elena'],
    ['I want to talk with someone at MRX about next steps.', 'elena'],
    ['I inherited a deed and need county records', 'connor'],
    ['What basin and formation is this nearby well in?', 'clay'],
    ['Why did my royalty check decline with production?', 'owen'],
    ['What does this contract clause mean for closing?', 'laurel'],
    ['Is this mineral offer worth considering?', 'travis'],
  ])('routes “%s” to %s', (question, expected) => {
    expect(routeGuide(question).slug).toBe(expected);
  });

  it('hands an active specialist to the next guide when the owner changes topics', () => {
    const decision = routeGuideDecision(
      'Which county records and deed should I request?',
      'clay',
    );
    expect(decision).toMatchObject({
      from: { slug: 'clay' },
      guide: { slug: 'connor' },
      shouldHandoff: true,
      reason: 'ownership and county records',
    });
    expect(decision.handoffMessage).toContain('Connor can use what you have already shared');
  });

  it('keeps the current guide for a follow-up in the same conversation', () => {
    const decision = routeGuideDecision('What does that mean for this property?', 'clay');
    expect(decision.guide.slug).toBe('clay');
    expect(decision.shouldHandoff).toBe(false);
    expect(decision.handoffMessage).toBeNull();
  });

  it('can hand a specialist back to Travis for offer and value questions', () => {
    const decision = routeGuideDecision('What is the offer worth?', 'clay');
    expect(decision).toMatchObject({
      from: { slug: 'clay' },
      guide: { slug: 'travis' },
      shouldHandoff: true,
      reason: 'offer and value context',
    });
  });

  it('keeps launch directory profiles non-interactive and clearly labeled as AI guides', () => {
    expect(
      guides.filter((guide) => guide.status === 'directory').map((guide) => guide.slug),
    ).toEqual(['wade', 'graham', 'cora', 'marisol', 'paige']);
    expect(guides.every((guide) => guide.role.includes('AI Guide'))).toBe(true);
    expect(getGuide('travis')?.limits).toMatch(/educational information/i);
  });

  it.each([
    ['travis', 'Travis MRX Offer and Value Guide'],
    ['connor', 'Connor MRX Ownership and Records Guide'],
    ['clay', 'Clay MRX Geology and Basin Guide'],
    ['owen', 'Owen MRX Production and Royalty Guide'],
    ['laurel', 'Laurel MRX Terms and Professional-Routing Guide'],
    ['elena', 'Elena MRX Scheduling and Next-Steps Guide'],
    ['wade', 'Wade MRX Risk Guide'],
    ['graham', 'Graham MRX Decision-Context Guide'],
    ['cora', 'Cora MRX Decision-Process Guide'],
    ['marisol', 'Marisol MRX Owner-Options Guide'],
    ['paige', 'Paige MRX Process-Experience Guide'],
  ])('uses the published position for %s in chat', (slug, expected) => {
    expect(getGuideChatLabel(slug)).toBe(expected);
  });
});
