import type { APIContext } from 'astro';

const CANONICAL_ORIGIN = 'https://mineralrightsxchange.com';
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const allowed =
    origin === requestOrigin ||
    origin === CANONICAL_ORIGIN ||
    origin === 'https://www.mineralrightsxchange.com' ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!allowed) throw new Response('Origin not allowed', { status: 403 });
}

export function clientKey(context: APIContext) {
  const forwarded = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || context.request.headers.get('cf-connecting-ip') || 'anonymous';
}

export function assertRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)) },
    });
  }
}

export function safeError(error: unknown) {
  if (error instanceof Response) return error;
  console.error('[MRX API]', error instanceof Error ? error.message : 'unknown error');
  return json({ ok: false, error: 'request_failed' }, { status: 500 });
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export function tokensMatch(provided: string, expected: string) {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < provided.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
