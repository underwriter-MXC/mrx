import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Supabase server runtime', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('creates the server client when the runtime has no global WebSocket', async () => {
    vi.resetModules();
    vi.stubGlobal('WebSocket', undefined);
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

    const { getSupabaseServer } = await import('../../src/lib/platform/supabase');

    expect(() => getSupabaseServer()).not.toThrow();
    expect(getSupabaseServer()).not.toBeNull();
  });
});
