import { describe, expect, it } from 'vitest';
import { buildSocialDescription } from '../../src/lib/social-description.mjs';

describe('social-preview description contract', () => {
  it('preserves descriptions at the budget and short punctuation verbatim', () => {
    expect(buildSocialDescription('Owner records & review.')).toBe('Owner records & review.');
    expect(buildSocialDescription('x'.repeat(125))).toBe('x'.repeat(125));
  });

  it('ends an over-budget preview at a word boundary without trailing punctuation', () => {
    const prefix = `${'owner '.repeat(18)}records,`;
    const source = `${prefix} supporting documents and review`;
    expect(buildSocialDescription(source)).toBe(`${prefix.slice(0, -1)}…`);
    expect(source).toBe(`${prefix} supporting documents and review`);
    expect(buildSocialDescription('x'.repeat(160))).toHaveLength(122);
  });
});
