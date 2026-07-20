import { createAnthropicStream } from './anthropic';
import { createOpenAIStream, fallbackAnswer, moderateText, type AIStreamArgs } from './openai';

export type AIProvider = 'openai' | 'anthropic';

export function normalizeAIProvider(value: string | undefined): AIProvider {
  return value?.trim().toLowerCase() === 'anthropic' ? 'anthropic' : 'openai';
}

export function configuredAIProvider(): AIProvider {
  return normalizeAIProvider(import.meta.env.AI_CHAT_PROVIDER);
}

export async function createAIStream(args: AIStreamArgs) {
  if (configuredAIProvider() === 'anthropic') {
    return createAnthropicStream(args);
  }
  return createOpenAIStream(args);
}

export function extractAITextDelta(event: unknown) {
  if (!event || typeof event !== 'object') return '';
  const candidate = event as {
    type?: string;
    delta?: string | { type?: string; text?: string };
  };
  if (candidate.type === 'response.output_text.delta' && typeof candidate.delta === 'string') {
    return candidate.delta;
  }
  if (
    candidate.type === 'content_block_delta' &&
    typeof candidate.delta === 'object' &&
    candidate.delta?.type === 'text_delta'
  ) {
    return candidate.delta.text ?? '';
  }
  return '';
}

export { fallbackAnswer, moderateText };
