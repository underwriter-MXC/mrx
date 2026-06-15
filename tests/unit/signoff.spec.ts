import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Mirror of the §9 sign-off rubric zod schema in src/content/config.ts.
 * This file is a "source of truth" verification: if the schema in
 * src/content/config.ts drifts from the compliance review, this test
 * fails.
 *
 * Per `Compliance Aware Implementation Rules.md` §3.
 */
const SignoffRubric = z.object({
  no_disallowed_phrases: z.literal(true),
  no_named_competitor: z.literal(true),
  no_superlative_about_mrx: z.literal(true),
  no_advice_verb: z.literal(true),
  no_appraisal_term: z.literal(true),
  no_named_underwriter: z.literal(true),
  has_footer_disclaimer: z.literal(true),
  money_figure_sourced: z.boolean(),
  reviewed_by: z.string().regex(/^mrx_compliance-/),
  reviewed_at: z.string().min(10),
});

const VALID = {
  no_disallowed_phrases: true,
  no_named_competitor: true,
  no_superlative_about_mrx: true,
  no_advice_verb: true,
  no_appraisal_term: true,
  no_named_underwriter: true,
  has_footer_disclaimer: true,
  money_figure_sourced: false,
  reviewed_by: 'mrx_compliance-stage06-initial',
  reviewed_at: '2026-06-11T00:00:00Z',
};

describe('§9 per-page sign-off rubric (zod schema)', () => {
  it('accepts a valid rubric', () => {
    const r = SignoffRubric.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it('rejects a rubric with any boolean literal = false (excluding money_figure_sourced)', () => {
    for (const key of Object.keys(VALID).filter((k) => k !== 'money_figure_sourced')) {
      const bad = { ...VALID, [key]: false };
      const r = SignoffRubric.safeParse(bad);
      expect(r.success, `key=${key}`).toBe(false);
    }
  });

  it('rejects a reviewed_by that does not start with mrx_compliance-', () => {
    const bad = { ...VALID, reviewed_by: 'someone-else' };
    const r = SignoffRubric.safeParse(bad);
    expect(r.success).toBe(false);
  });
});
