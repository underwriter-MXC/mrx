import type { APIRoute } from 'astro';
import { runAnthropicHealthCheck } from '../../../lib/platform/anthropic';
import {
  assertRateLimit,
  bearerToken,
  clientKey,
  json,
  safeError,
  tokensMatch,
} from '../../../lib/platform/security';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    if (import.meta.env.ANTHROPIC_HEALTHCHECK_ENABLED !== 'true') {
      return json({ ok: false, status: 'not_found' }, { status: 404 });
    }

    assertRateLimit(`anthropic-health:${clientKey(context)}`, 5);
    if (
      !tokensMatch(bearerToken(context.request), import.meta.env.MRX_ANTHROPIC_HEALTH_TOKEN ?? '')
    ) {
      return json(
        { ok: false, status: 'unauthorized' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    const result = await runAnthropicHealthCheck();
    if (!result.ok) {
      return json({ ok: false, provider: 'anthropic', status: 'unavailable' }, { status: 503 });
    }

    return json({
      ok: true,
      provider: 'anthropic',
      status: 'ready',
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    return safeError(error);
  }
};

export const GET: APIRoute = async () =>
  json({ ok: false, status: 'method_not_allowed' }, { status: 405 });
