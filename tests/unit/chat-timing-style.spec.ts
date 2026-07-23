import { describe, expect, it } from 'vitest';
import { guideReplyDelay, remainingGuideReplyDelay } from '../../src/lib/platform/timing';
import { hasProhibitedMrxCopy, normalizeMrxText } from '../../src/lib/platform/style';

describe('MRX guide timing', () => {
  it('enforces two seconds in production even when configured lower', () => {
    expect(guideReplyDelay(true, 0)).toBe(2_000);
    expect(guideReplyDelay(true, 1_500)).toBe(2_000);
    expect(guideReplyDelay(true, 2_750)).toBe(2_750);
  });

  it('allows automated tests to disable delay outside production', () => {
    expect(guideReplyDelay(false, 0)).toBe(0);
    expect(remainingGuideReplyDelay(0, 520, 1_000, 1_000)).toBe(0);
  });

  it('measures the threshold from submission and does not add a second delay', () => {
    expect(remainingGuideReplyDelay(2_000, 260, 1_000, 1_500)).toBe(1_500);
    expect(remainingGuideReplyDelay(2_000, 260, 1_000, 3_100)).toBe(0);
  });
});

describe('MRX-authored copy normalization', () => {
  it('removes long dashes and visible separators while preserving ordinary hyphens', () => {
    const value = normalizeMrxText('Mineral-rights answer — plain language --- next step');
    expect(value).toBe('Mineral-rights answer, plain language next step');
    expect(hasProhibitedMrxCopy(value)).toBe(false);
  });
});
