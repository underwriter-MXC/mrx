import { describe, it, expect } from 'vitest';
import { TITLE_MIN, TITLE_MAX, DESC_MIN, DESC_MAX, validateTitle, validateDescription } from '../../src/lib/seo';

describe('seo metadata validators', () => {
  it('title length budget: 30-60', () => {
    expect(TITLE_MIN).toBe(30);
    expect(TITLE_MAX).toBe(60);
  });

  it('description length budget: 130-160', () => {
    expect(DESC_MIN).toBe(130);
    expect(DESC_MAX).toBe(160);
  });

  it('validates a healthy title', () => {
    const t = 'How It Works: A Free Underwriter Review · MRX';
    expect(t.length).toBeLessThanOrEqual(60);
    const r = validateTitle(t);
    expect(r.ok).toBe(true);
  });

  it('rejects a too-short title', () => {
    const r = validateTitle('Too short');
    expect(r.ok).toBe(false);
  });

  it('rejects a too-long title', () => {
    const r = validateTitle('x'.repeat(70));
    expect(r.ok).toBe(false);
  });

  it('validates a healthy description', () => {
    const d = 'A free, no-pressure underwriter review of your Texas mineral rights. Transparent DCF methodology, plain-language output, no clawback clauses, no teaser numbers.';
    expect(d.length).toBeLessThanOrEqual(160);
    const r = validateDescription(d);
    expect(r.ok).toBe(true);
  });

  it('rejects a too-short description', () => {
    const r = validateDescription('too short');
    expect(r.ok).toBe(false);
  });
});
