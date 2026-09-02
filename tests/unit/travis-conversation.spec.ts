import { describe, expect, it } from 'vitest';
import { fallbackAnswer } from '../../src/lib/platform/openai';
import { fallbackConversationAnswer, questionForAnswer } from '../../src/lib/platform/conversation';

const citations = [
  {
    id: 'sell-mineral-rights',
    title: 'How to Sell Mineral Rights',
    url: '/blog/sell-mineral-rights/',
    excerpt: 'A reviewed article.',
  },
];

describe('Ask Travis conversational replies', () => {
  it('responds to selling intent with a short, plainspoken answer and one question', () => {
    const answer = fallbackAnswer('I want to sell', 'travis', citations);

    expect(answer).toContain('Whether selling makes sense depends on your goals');
    expect(answer.split(/\s+/).length).toBeLessThan(55);
    expect(answer.match(/\?/g)).toHaveLength(1);
    expect(answer).not.toMatch(/\[\d+\]|useful review|documents below/i);
  });

  it('asks for one detail at a time instead of giving an intake checklist', () => {
    const answer = fallbackAnswer('I received an offer', 'travis', citations);

    expect(answer.split(/\s+/).length).toBeLessThan(40);
    expect(answer.match(/\?/g)).toHaveLength(1);
    expect(answer).not.toMatch(/acres and depths|net or gross|title review|royalty documents/i);
  });

  it('explains the benefit of basin context without calling it a recording jurisdiction', () => {
    const answer = fallbackAnswer('The property is in Midland', 'travis', citations, {
      status: 'resolved',
      scope: 'mineral_interest',
      city: 'Midland',
      state: 'Texas',
      county: 'Midland',
      basin: 'Permian Basin',
      counties: [{ name: 'Midland', fips: '48329' }],
    } as any);

    expect(answer).toContain('maps to the Permian Basin');
    expect(answer).toContain('county and state remain the legal recording jurisdiction');
    expect(answer).not.toMatch(/registered in (?:the )?Permian Basin/i);
  });

  it.each([
    {
      name: 'answers the reported Odessa basin question',
      message: "I'm in Odessa TX, what basin am I in?",
      expected: /Odessa is in the broader Permian Basin region/i,
    },
    {
      name: 'recovers the unanswered Odessa question on retry',
      message: 'answer my question',
      history: [
        { role: 'user' as const, content: "I'm in Odessa TX, what basin am I in?" },
        { role: 'assistant' as const, content: 'What worries you most right now?' },
      ],
      expected: /Odessa is in the broader Permian Basin region/i,
    },
    {
      name: 'answers a Midland basin question',
      message: 'My minerals are near Midland, Texas. Which basin is that?',
      expected: /Permian Basin region.+Midland Basin/i,
    },
    {
      name: 'answers a Carlsbad basin question',
      message: 'What basin is Carlsbad, NM in?',
      expected: /Permian Basin region.+Delaware Basin/i,
    },
    {
      name: 'answers a Williston basin question',
      message: 'Which basin is Williston, North Dakota in?',
      expected: /Williston Basin region/i,
    },
    {
      name: 'gives useful offer comparison factors',
      message: 'How should I compare this mineral offer?',
      expected: /complete offer.+exact rights conveyed.+obligations that survive closing/i,
    },
    {
      name: 'starts an inherited-interest answer with records',
      message: 'I inherited mineral rights. What should I do first?',
      expected: /confirming what the estate or deed conveyed/i,
    },
    {
      name: 'explains common royalty decline causes',
      message: 'Why did my royalty check decline?',
      expected: /lower production.+commodity prices.+downtime/i,
    },
    {
      name: 'defines a division order',
      message: 'What is a division order?',
      expected: /tells the operator or payor how your decimal share/i,
    },
    {
      name: 'defines net mineral acres',
      message: 'What are net mineral acres?',
      expected: /gross tract acres multiplied by the fraction/i,
    },
  ])('$name', ({ message, history = [], expected }) => {
    const answer = fallbackConversationAnswer(message, undefined, history);
    expect(answer).toMatch(expected);
    expect(answer.match(/\?/g)).toHaveLength(1);
    expect(answer).not.toMatch(/what (?:is )?the one thing.+worried/i);
  });

  it('selects the most recent specific user question for a retry', () => {
    expect(
      questionForAnswer('Please answer my original question.', [
        { role: 'user', content: 'What is a division order?' },
        { role: 'assistant', content: 'Tell me more.' },
      ]),
    ).toBe('What is a division order?');
  });
});
