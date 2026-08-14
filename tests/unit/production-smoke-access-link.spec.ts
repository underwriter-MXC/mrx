import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/pages/api/maintenance/production-smoke-access-link';

const url = 'https://mineralrightsxchange.com/api/maintenance/production-smoke-access-link';

function context(body: unknown, headers: Record<string, string> = {}) {
  return {
    request: new Request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://mineralrightsxchange.com',
        'x-forwarded-for': `unit-${crypto.randomUUID()}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    url: new URL(url),
  } as any;
}

describe('production smoke controlled access-link guard', () => {
  beforeEach(() => vi.stubEnv('MRX_PRODUCTION_SMOKE_SECRET', 'unit-smoke-secret'));
  afterEach(() => vi.unstubAllEnvs());

  it('is undiscoverable through GET, a missing secret, or an incorrect secret', async () => {
    expect((await GET(context({}))).status).toBe(404);
    const body = {
      acknowledgement: 'issue-sentinel-access-link',
      createdAfter: new Date().toISOString(),
      email: `mrx-smoke-${Date.now()}-abcdef@example.com`,
    };
    expect(
      (
        await POST(
          context(body, { 'x-mrx-production-smoke': 'issue-sentinel-access-link' }),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await POST(
          context(body, {
            'x-mrx-production-smoke': 'issue-sentinel-access-link',
            'x-mrx-production-smoke-secret': 'wrong-secret',
          }),
        )
      ).status,
    ).toBe(404);
  });

  it('rejects identities outside the exact recent disposable sentinel namespace', async () => {
    const response = await POST(
      context(
        {
          acknowledgement: 'issue-sentinel-access-link',
          createdAfter: new Date().toISOString(),
          email: 'owner@example.com',
        },
        {
          'x-mrx-production-smoke': 'issue-sentinel-access-link',
          'x-mrx-production-smoke-secret': 'unit-smoke-secret',
        },
      ),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_smoke_access_identity' });
  });
});
