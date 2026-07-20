import { describe, expect, it } from 'vitest';
import { extractAITextDelta, normalizeAIProvider } from '../../src/lib/platform/ai';
import { tokensMatch } from '../../src/lib/platform/security';

describe('AI provider routing', () => {
  it('keeps OpenAI as the default provider', () => {
    expect(normalizeAIProvider(undefined)).toBe('openai');
    expect(normalizeAIProvider('unsupported')).toBe('openai');
  });

  it('enables Anthropic only through the explicit provider value', () => {
    expect(normalizeAIProvider('anthropic')).toBe('anthropic');
    expect(normalizeAIProvider(' ANTHROPIC ')).toBe('anthropic');
  });

  it('normalizes OpenAI and Anthropic streaming text deltas', () => {
    expect(extractAITextDelta({ type: 'response.output_text.delta', delta: 'OpenAI' })).toBe(
      'OpenAI',
    );
    expect(
      extractAITextDelta({
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'Claude' },
      }),
    ).toBe('Claude');
    expect(extractAITextDelta({ type: 'ping' })).toBe('');
  });
});

describe('health-check token comparison', () => {
  it('requires non-empty equal tokens', () => {
    expect(tokensMatch('', '')).toBe(false);
    expect(tokensMatch('secret-a', 'secret-b')).toBe(false);
    expect(tokensMatch('secret', 'secret-longer')).toBe(false);
    expect(tokensMatch('same-secret', 'same-secret')).toBe(true);
  });
});
