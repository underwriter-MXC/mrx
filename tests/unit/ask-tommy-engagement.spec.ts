import { describe, expect, it } from 'vitest';
import {
  classifyOwnerQuestion,
  getBenefitSuggestion,
  normalizeSuggestionCopyVariant,
} from '../../src/lib/ask-tommy-engagement';

describe('Ask Tommy value-first engagement', () => {
  it.each([
    ['I received a written offer from a buyer', 'offer'],
    ['I inherited minerals through probate', 'inheritance'],
    ['Why did my royalty check go down?', 'royalty'],
    ['Which deed proves what I own?', 'ownership'],
    ['How does my oil and gas lease work?', 'lease'],
    ['Should I sell or hold my mineral rights?', 'sell_or_hold'],
    ['The property is in Reeves County, Texas', 'location'],
    ['What are my mineral rights worth?', 'value'],
  ])('classifies %s as %s', (question, intent) => {
    expect(classifyOwnerQuestion(question)).toBe(intent);
  });

  it('keeps the suggested question fixed while testing only the benefit wording', () => {
    const benefitLed = getBenefitSuggestion('I received an offer', 'benefit-led');
    const outcomeLed = getBenefitSuggestion('I received an offer', 'outcome-led');

    expect(benefitLed.intent).toBe('offer');
    expect(outcomeLed.intent).toBe('offer');
    expect(benefitLed.question).toBe(outcomeLed.question);
    expect(benefitLed.benefit).not.toBe(outcomeLed.benefit);
  });

  it('accepts only the two approved low-cardinality experiment variants', () => {
    expect(normalizeSuggestionCopyVariant('benefit-led')).toBe('benefit-led');
    expect(normalizeSuggestionCopyVariant('outcome-led')).toBe('outcome-led');
    expect(normalizeSuggestionCopyVariant('unknown')).toBeNull();
  });
});
