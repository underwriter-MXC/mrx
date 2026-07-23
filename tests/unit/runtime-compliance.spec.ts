import { describe, expect, it } from 'vitest';
import { sanitizeVisibleFactValue } from '../../src/lib/platform/facts';
import { runtimeComplianceCheck } from '../../src/lib/platform/style';

const SAFE_RUNTIME_BLOCK =
  "MRX cannot share a specific value or guarantee here. Reply with what you'd like the underwriter to review.";

describe('runtime compliance checks for streamed assistant chunks', () => {
  it('flags a disallowed stream answer and provides the safe replacement', () => {
    const result = runtimeComplianceCheck(
      'We guarantee the highest price for your mineral rights.',
    );
    expect(result.flagged).toBe(true);
    expect(result.safeText).toBe(SAFE_RUNTIME_BLOCK);
  });

  it('allows denial-context language required by disclaimers', () => {
    expect(
      runtimeComplianceCheck('MRX is not a certified appraisal and never guarantees an outcome.')
        .flagged,
    ).toBe(false);
  });

  it('allows clean underwriter-review language', () => {
    expect(
      runtimeComplianceCheck(
        'An underwriter can review your documents and explain the directional assessment.',
      ).flagged,
    ).toBe(false);
  });
});

describe('runtime compliance checks for visible extracted fact values', () => {
  it('blocks a visible fact value with a guarantee claim', () => {
    expect(sanitizeVisibleFactValue('decision_goal', 'guaranteed highest offer')).toBeNull();
  });

  it('allows a visible fact value that denies a prohibited claim', () => {
    expect(sanitizeVisibleFactValue('document_mentioned', 'no appraisal here')).toBe(
      'no appraisal here',
    );
  });

  it('allows a clean visible fact value', () => {
    expect(sanitizeVisibleFactValue('decision_goal', 'compare documents with an underwriter')).toBe(
      'compare documents with an underwriter',
    );
  });
});

describe('runtime compliance negative cases', () => {
  it('allows currency mentions that do not guarantee a price', () => {
    expect(
      runtimeComplianceCheck('The royalty statement mentions a $450 payment from last month.')
        .flagged,
    ).toBe(false);
  });

  it('allows guarantee denials', () => {
    expect(runtimeComplianceCheck('We never guarantee a price or outcome.').flagged).toBe(false);
  });

  it('allows appraisal denials', () => {
    expect(runtimeComplianceCheck('No appraisal here, just an underwriter review.').flagged).toBe(
      false,
    );
  });

  it('allows empty strings', () => {
    expect(runtimeComplianceCheck('').flagged).toBe(false);
  });
});
