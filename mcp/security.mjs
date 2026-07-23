import { timingSafeEqual } from 'node:crypto';

export function splitCsv(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function bearerToken(request) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export function tokensMatch(actual, expected) {
  if (!actual || !expected) return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

export function requestHostAllowed(request, allowedHosts) {
  if (!allowedHosts.length) return false;
  const host = request.headers.host?.toLowerCase();
  return Boolean(host && allowedHosts.some((allowed) => allowed.toLowerCase() === host));
}

export function requestOriginAllowed(request, allowedOrigins) {
  const origin = request.headers.origin;
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

export function createRateLimiter({ limit, windowMs = 60_000 }) {
  const buckets = new Map();
  return function rateLimit(key, now = Date.now()) {
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
    }
    current.count += 1;
    return {
      allowed: current.count <= limit,
      remaining: Math.max(0, limit - current.count),
      resetAt: current.resetAt,
    };
  };
}

export async function readJsonBody(request, maxBytes) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > maxBytes) {
      const error = new Error('request_too_large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('invalid_json');
    error.statusCode = 400;
    throw error;
  }
}
