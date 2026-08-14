import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/pages/api/maintenance/production-smoke-cleanup';

const url = 'https://mineralrightsxchange.com/api/maintenance/production-smoke-cleanup';

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

describe('production owner-journey smoke cleanup guard', () => {
  beforeEach(() => vi.stubEnv('MRX_PRODUCTION_SMOKE_SECRET', 'unit-smoke-secret'));
  afterEach(() => vi.unstubAllEnvs());

  it('is undiscoverable through GET and without the explicit destructive acknowledgement header', async () => {
    expect((await GET(context({}))).status).toBe(404);
    const response = await POST(
      context({ acknowledgement: 'cancel-and-purge', createdAfter: new Date().toISOString() }),
    );
    expect(response.status).toBe(404);
  });

  it('rejects stale cleanup windows and identities outside the reserved smoke namespace', async () => {
    const headers = {
      'x-mrx-production-smoke': 'cancel-and-purge',
      'x-mrx-production-smoke-secret': 'unit-smoke-secret',
    };
    const stale = await POST(
      context(
        {
          acknowledgement: 'cancel-and-purge',
          createdAfter: new Date(Date.now() - 31 * 60_000).toISOString(),
        },
        headers,
      ),
    );
    expect(stale.status).toBe(400);
    expect(await stale.json()).toMatchObject({ error: 'invalid_smoke_window' });

    const wrongIdentity = await POST(
      context(
        {
          acknowledgement: 'cancel-and-purge',
          createdAfter: new Date().toISOString(),
          email: 'owner@example.com',
        },
        headers,
      ),
    );
    expect(wrongIdentity.status).toBe(400);
    expect(await wrongIdentity.json()).toMatchObject({ error: 'invalid_smoke_identity' });
  });
});
