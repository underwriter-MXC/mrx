import { systemInstructions, type AIStreamArgs } from './openai';

const API_URL = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function apiKey() {
  return import.meta.env.ANTHROPIC_API_KEY;
}

function model() {
  return import.meta.env.ANTHROPIC_CHAT_MODEL || DEFAULT_MODEL;
}

function headers(key: string) {
  return {
    'x-api-key': key,
    'anthropic-version': API_VERSION,
    'content-type': 'application/json',
  };
}

export function anthropicConfigured() {
  return Boolean(apiKey());
}

export async function createAnthropicStream(args: AIStreamArgs) {
  const key = apiKey();
  if (!key) return null;

  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify({
      model: model(),
      max_tokens: 700,
      system: systemInstructions(args.persona, args.citations, args.context),
      messages: [
        ...(args.history ?? []).slice(-8).map((message) => ({
          role: message.role,
          content: message.content.slice(0, 4_000),
        })),
        { role: 'user', content: args.message },
      ],
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Anthropic response failed (${response.status})`);
  }
  return response;
}

export async function runAnthropicHealthCheck() {
  const key = apiKey();
  if (!key) return { ok: false, latencyMs: 0 };

  const startedAt = Date.now();
  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify({
      model: model(),
      max_tokens: 32,
      temperature: 0,
      messages: [{ role: 'user', content: 'Reply with exactly MRX_CLAUDE_OK' }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic health check failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const reply = (payload.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  return {
    ok: reply === 'MRX_CLAUDE_OK',
    latencyMs: Date.now() - startedAt,
  };
}
