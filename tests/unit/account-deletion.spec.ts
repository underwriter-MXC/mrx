import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  session: {
    conversationId: 'conversation-1',
    profileId: '11111111-1111-4111-8111-111111111111',
    deviceHash: 'device-hash',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'owner@example.com',
    emailVerified: true,
    persisted: true,
  },
  requireVerifiedOwner: vi.fn(),
  getSupabaseServer: vi.fn(),
}));

vi.mock('../../src/lib/platform/identity', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/platform/identity')>(
    '../../src/lib/platform/identity',
  );
  return {
    ...actual,
    requireVerifiedOwner: mockState.requireVerifiedOwner,
  };
});

vi.mock('../../src/lib/platform/supabase', () => ({
  getSupabaseServer: mockState.getSupabaseServer,
}));

function context(method: string, path: string, body?: unknown) {
  const url = `https://mineralrightsxchange.com${path}`;
  return {
    request: new Request(url, {
      method,
      headers: {
        authorization: 'Bearer owner-token',
        'content-type': 'application/json',
        origin: 'https://mineralrightsxchange.com',
        'x-forwarded-for': '203.0.113.7',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url: new URL(url),
  } as any;
}

function chain(result: unknown = {}) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return builder;
}

function supabaseMock() {
  const calls = {
    updates: [] as Array<{ table: string; value: unknown }>,
    inserts: [] as Array<{ table: string; value: unknown }>,
    deleteUser: vi.fn(async () => ({ error: null })),
    remove: vi.fn(async () => ({ error: null })),
  };
  const api = {
    from: vi.fn((table: string) => {
      if (table === 'attachments')
        return chain({ data: [{ storage_path: 'docs/statement.pdf' }], error: null });
      return chain({ data: null, error: null });
    }),
    storage: {
      from: vi.fn(() => ({ remove: calls.remove })),
    },
    auth: {
      admin: {
        deleteUser: calls.deleteUser,
      },
    },
  } as any;
  api.from.mockImplementation((table: string) => {
    const builder = chain({
      data: table === 'attachments' ? [{ storage_path: 'docs/statement.pdf' }] : null,
      error: null,
    });
    builder.update.mockImplementation((value: unknown) => {
      calls.updates.push({ table, value });
      return builder;
    });
    builder.insert.mockImplementation((value: unknown) => {
      calls.inserts.push({ table, value });
      return builder;
    });
    return builder;
  });
  return { api, calls };
}

describe('two-step account deletion', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubEnv('ACCOUNT_DELETION_SECRET', 'test-account-deletion-secret');
    mockState.requireVerifiedOwner.mockResolvedValue(mockState.session);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('step 1 issues a short-lived deletion token and writes pending deletion audit state', async () => {
    const { POST } = await import('../../src/pages/api/account/deletion-request');
    const { api, calls } = supabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await POST(context('POST', '/api/account/deletion-request'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deletionToken).toMatch(/^v1\./);
    expect(body.expiresInSeconds).toBe(600);
    expect(calls.updates).toContainEqual(
      expect.objectContaining({
        table: 'profiles',
        value: expect.objectContaining({ pending_deletion_at: expect.any(String) }),
      }),
    );
    expect(calls.inserts).toContainEqual(
      expect.objectContaining({
        table: 'audit_events',
        value: expect.objectContaining({
          actor_user_id: mockState.session.userId,
          profile_id: mockState.session.profileId,
          event_type: 'account_deletion_requested',
          metadata: expect.objectContaining({ clientKey: '203.0.113.7' }),
        }),
      }),
    );
  });

  it('step 1 rejects invalid auth', async () => {
    const { POST } = await import('../../src/pages/api/account/deletion-request');
    mockState.requireVerifiedOwner.mockRejectedValueOnce(
      new Response('Verified email required', { status: 401 }),
    );
    mockState.getSupabaseServer.mockReturnValue(supabaseMock().api);

    const response = await POST(context('POST', '/api/account/deletion-request'));

    expect(response.status).toBe(401);
  });

  it('step 2 rejects a missing token before deleting anything', async () => {
    const { DELETE } = await import('../../src/pages/api/account/index');
    const { api, calls } = supabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await DELETE(context('DELETE', '/api/account', { deletionIntent: true }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('deletion_token_required');
    expect(calls.deleteUser).not.toHaveBeenCalled();
  });

  it('step 2 rejects an expired token before deleting anything', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T12:00:00.000Z'));
    const { createAccountDeletionToken } = await import('../../src/lib/platform/account-deletion');
    const token = await createAccountDeletionToken({
      profileId: mockState.session.profileId,
      nowMs: Date.now() - 11 * 60_000,
      nonce: 'expired-nonce',
    });
    const { DELETE } = await import('../../src/pages/api/account/index');
    const { api, calls } = supabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await DELETE(
      context('DELETE', '/api/account', { deletionIntent: true, deletionToken: token }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('deletion_token_invalid');
    expect(calls.deleteUser).not.toHaveBeenCalled();
  });

  it('step 2 happy path deletes the user, writes a receipt, and writes completion audit state', async () => {
    const { createAccountDeletionToken } = await import('../../src/lib/platform/account-deletion');
    const token = await createAccountDeletionToken({
      profileId: mockState.session.profileId,
      nonce: 'happy-nonce',
    });
    const { DELETE } = await import('../../src/pages/api/account/index');
    const { api, calls } = supabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await DELETE(
      context('DELETE', '/api/account', { deletionIntent: true, deletionToken: token }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(calls.remove).toHaveBeenCalledWith(['docs/statement.pdf']);
    expect(calls.deleteUser).toHaveBeenCalledWith(mockState.session.userId);
    expect(calls.inserts).toContainEqual(
      expect.objectContaining({
        table: 'deletion_receipts',
        value: expect.objectContaining({
          user_hash: expect.any(String),
          scope: 'owner_account_and_content',
        }),
      }),
    );
    expect(calls.inserts).toContainEqual(
      expect.objectContaining({
        table: 'audit_events',
        value: expect.objectContaining({
          actor_user_id: mockState.session.userId,
          profile_id: mockState.session.profileId,
          event_type: 'account_deletion_completed',
          metadata: expect.objectContaining({ clientKey: '203.0.113.7' }),
        }),
      }),
    );
  });
});
