import { describe, expect, it } from 'vitest';
import { compareOffer, comparisonEvent, type OfferInput } from '../../src/lib/offer-comparison';
const complete: OfferInput = {
  interestType: 'mineral',
  total: '40000',
  acres: '10',
  property: 'Yes',
  adjustments: 'None stated',
  diligence: 'Unknown',
  closing: 'Unknown',
  effective: 'Unknown',
  notes: 'None stated',
};
describe('owner offer comparison', () => {
  it('calculates only on a mineral interest with positive finite inputs', () => {
    expect(compareOffer(complete).perAcre).toBe(4000);
    expect(compareOffer(complete).calculationNote).toBe(
      'Stated offer total divided by stated net mineral acres.',
    );
    expect(compareOffer({ ...complete, property: ' yes ' }).questions).toEqual(
      compareOffer(complete).questions,
    );
    for (const interestType of ['', 'royalty', 'unknown'] as const) {
      expect(compareOffer({ ...complete, interestType }).perAcre).toBeNull();
    }
    for (const value of ['', '0', '-1', 'Infinity', 'NaN', '1e999']) {
      expect(compareOffer({ ...complete, total: value }).perAcre).toBeNull();
      expect(compareOffer({ ...complete, acres: value }).perAcre).toBeNull();
    }
  });
  it('keeps unknown and unclear fields unresolved and does not certify entered answers', () => {
    expect(compareOffer(complete).questions).toHaveLength(3);
    expect(compareOffer({ ...complete, property: 'Unclear' }).questions).toHaveLength(4);
    expect(compareOffer({ ...complete, adjustments: 'unknown' }).questions).toHaveLength(4);
    expect(compareOffer({ ...complete, interestType: 'royalty' }).questions.join(' ')).toContain(
      'royalty interest',
    );
  });
  it('never emits private inputs or qualification claims', () => {
    expect(comparisonEvent('started')).toEqual({
      event: 'offer_comparison_started',
      tool_version: '2026-09-09',
      page_path: '/mineral-rights-offer-comparison/',
    });
    expect(Object.keys(comparisonEvent('review_selected'))).toEqual([
      'event',
      'tool_version',
      'page_path',
    ]);
  });
});
