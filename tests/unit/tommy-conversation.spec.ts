import { describe, expect, it } from 'vitest';
import { fallbackAnswer } from '../../src/lib/platform/openai';

const citations = [
  {
    id: 'sell-mineral-rights',
    title: 'How to Sell Mineral Rights',
    url: '/blog/sell-mineral-rights/',
    excerpt: 'A reviewed guide.',
  },
];

describe('Ask Tommy conversational replies', () => {
  it('responds to selling intent with a short, plainspoken answer and one question', () => {
    const answer = fallbackAnswer('I want to sell', 'tommy', citations);

    expect(answer).toBe(
      'Got it. I can help you figure out whether selling makes sense and what a fair offer might look like. What state and county are the mineral rights in?',
    );
    expect(answer.split(/\s+/).length).toBeLessThan(35);
    expect(answer.match(/\?/g)).toHaveLength(1);
    expect(answer).not.toMatch(/\[\d+\]|useful review|documents below/i);
  });

  it('asks for one detail at a time instead of giving an intake checklist', () => {
    const answer = fallbackAnswer('I received an offer', 'tommy', citations);

    expect(answer.split(/\s+/).length).toBeLessThan(40);
    expect(answer.match(/\?/g)).toHaveLength(1);
    expect(answer).not.toMatch(/acres and depths|net or gross|title review|royalty documents/i);
  });
});
