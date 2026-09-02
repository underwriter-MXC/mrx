import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  session: {
    conversationId: 'conversation-1',
    profileId: '11111111-1111-4111-8111-111111111111',
    deviceHash: 'device-hash',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'owner@example.com',
    emailVerified: false,
    persisted: true,
  },
  getSupabaseServer: vi.fn(),
  deliverMemberAccessLink: vi.fn(),
  recordCommunicationDispatch: vi.fn(),
  refreshCompletedLead: vi.fn(),
}));

vi.mock('../../src/lib/platform/supabase', () => ({
  getSupabaseServer: mockState.getSupabaseServer,
}));

vi.mock('../../src/lib/platform/identity', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/platform/identity')>(
    '../../src/lib/platform/identity',
  );
  return {
    ...actual,
    resolveOwnerSession: vi.fn(async () => mockState.session),
    deliverMemberAccessLink: mockState.deliverMemberAccessLink,
  };
});

vi.mock('../../src/lib/platform/communications', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/platform/communications')>(
    '../../src/lib/platform/communications',
  );
  return {
    ...actual,
    recordCommunicationDispatch: mockState.recordCommunicationDispatch,
    refreshCompletedLead: mockState.refreshCompletedLead,
  };
});

function context(path: string, body: unknown) {
  const url = `https://mineralrightsxchange.com${path}`;
  return {
    request: new Request(url, {
      method: 'POST',
      headers: {
        origin: 'https://mineralrightsxchange.com',
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify(body),
    }),
    url: new URL(url),
  } as any;
}

function createSupabaseMock(
  options: {
    existingConsentReceipts?: Array<Record<string, unknown>>;
  } = {},
) {
  const calls = {
    updates: [] as Array<{ table: string; value: unknown }>,
    deletes: [] as Array<{ table: string }>,
    upserts: [] as Array<{ table: string; value: unknown; options: unknown }>,
    inserts: [] as Array<{ table: string; value: unknown }>,
  };

  const api = {
    from: vi.fn((table: string) => {
      let result: { data: unknown; error: unknown } = { data: null, error: null };
      const builder: any = {
        select: vi.fn(() => {
          result = {
            data: table === 'consent_receipts' ? (options.existingConsentReceipts ?? []) : null,
            error: null,
          };
          return builder;
        }),
        update: vi.fn((value: unknown) => {
          calls.updates.push({ table, value });
          return builder;
        }),
        delete: vi.fn(() => {
          calls.deletes.push({ table });
          return builder;
        }),
        insert: vi.fn((value: unknown) => {
          calls.inserts.push({ table, value });
          return Promise.resolve({ error: null });
        }),
        upsert: vi.fn((value: unknown, upsertOptions: unknown) => {
          calls.upserts.push({ table, value, options: upsertOptions });
          return Promise.resolve({ error: null });
        }),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        is: vi.fn(() => builder),
        order: vi.fn(() => builder),
        single: vi.fn(async () => result),
        maybeSingle: vi.fn(async () => result),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
      };
      return builder;
    }),
  } as any;

  return { api, calls };
}

describe('account signup consent APIs', () => {
  beforeEach(() => {
    mockState.deliverMemberAccessLink.mockResolvedValue({
      status: 'link_sent',
      linkSent: true,
      redirectTo: 'https://mineralrightsxchange.com/account/?welcome=conversation',
    });
    mockState.recordCommunicationDispatch.mockResolvedValue({ ok: true });
    mockState.refreshCompletedLead.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('does not fabricate requested_updates receipts during account creation', async () => {
    const { POST } = await import('../../src/pages/api/chat/identity');
    const { api, calls } = createSupabaseMock({
      existingConsentReceipts: [
        {
          id: 'receipt-email-old',
          channel: 'email',
          created_at: '2026-07-20T10:00:00.000Z',
        },
        {
          id: 'receipt-call-old',
          channel: 'call',
          created_at: '2026-07-20T11:00:00.000Z',
        },
      ],
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await POST(
      context('/api/chat/identity', {
        action: 'email',
        fullName: 'Riley Owner',
        email: 'owner@example.com',
        phone: '(432) 555-0101',
        sourceUrl: 'https://mineralrightsxchange.com/account/?welcome=conversation',
        redirectTo: 'https://mineralrightsxchange.com/account/?welcome=conversation',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deviceAccess).toBe(true);
    expect(body.verificationSent).toBe(true);
    expect(mockState.deliverMemberAccessLink).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: mockState.session.profileId,
        email: 'owner@example.com',
        permissions: {
          email: false,
          sms: false,
          call: false,
          aiVoice: false,
        },
      }),
    );

    const consentInsert = calls.inserts.find((entry) => entry.table === 'consent_receipts');
    expect(consentInsert).toBeUndefined();
  });

  it('ignores stale permissions on signup so a tampered client cannot grant itself consent', async () => {
    const { POST } = await import('../../src/pages/api/chat/identity');
    const { api, calls } = createSupabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await POST(
      context('/api/chat/identity', {
        action: 'email',
        accountSignup: true,
        fullName: 'Riley Owner',
        email: 'owner@example.com',
        phone: '(432) 555-0101',
        permissions: { email: true, sms: true, call: true, aiVoice: true },
        sourceUrl: 'https://mineralrightsxchange.com/account/?welcome=conversation',
        redirectTo: 'https://mineralrightsxchange.com/account/?welcome=conversation',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockState.deliverMemberAccessLink).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: {
          email: false,
          sms: false,
          call: false,
          aiVoice: false,
        },
      }),
    );

    const consentInsert = calls.inserts.find((entry) => entry.table === 'consent_receipts');
    expect(consentInsert).toBeUndefined();
  });

  it('strips the call channel from a tampered POST while the disclosure is pending', async () => {
    const { POST } = await import('../../src/pages/api/chat/permissions');
    const { api, calls } = createSupabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);

    // A tampered client tries to grant itself call permission even though the
    // disclosure is still pending. The server must drop the channel from both
    // the persisted permissions and the channels list.
    const response = await POST(
      context('/api/chat/permissions', {
        email: 'owner@example.com',
        phone: '(432) 555-0101',
        permissions: { email: true, sms: false, call: true, aiVoice: false },
        sourceUrl: 'https://mineralrightsxchange.com/account/',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const consentInsert = calls.inserts.find((entry) => entry.table === 'consent_receipts');
    expect(consentInsert).toBeDefined();
    const rows = consentInsert?.value as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.channel === 'call')).toBeUndefined();
    expect(rows.find((row) => row.channel === 'email')).toMatchObject({ granted: true });
    expect(rows.find((row) => row.channel === 'sms')).toMatchObject({ granted: false });
    expect(rows.find((row) => row.channel === 'aiVoice')).toMatchObject({ granted: false });
  });

  it('records paired granted=true and granted=false rows when Ask Travis asks each channel explicitly', async () => {
    const { POST } = await import('../../src/pages/api/chat/permissions');
    const { api, calls } = createSupabaseMock({
      existingConsentReceipts: [
        {
          id: 'receipt-email-old',
          channel: 'email',
          granted: false,
          created_at: '2026-07-20T09:00:00.000Z',
        },
        {
          id: 'receipt-sms-old',
          channel: 'sms',
          granted: false,
          created_at: '2026-07-20T09:01:00.000Z',
        },
      ],
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    // Simulate Ask Travis submitting the full consent profile after explicit
    // yes/no answers for every channel: email granted, sms denied, call
    // granted, aiVoice denied. The human-call channel is gated (pending
    // disclosure version) so call is dropped server-side and no receipt is
    // written for it.
    const response = await POST(
      context('/api/chat/permissions', {
        email: 'owner@example.com',
        phone: '(432) 555-0101',
        permissions: {
          email: true,
          sms: false,
          call: true,
          aiVoice: false,
        },
        sourceUrl: 'https://mineralrightsxchange.com/account/?welcome=conversation',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);

    const consentInsert = calls.inserts.find((entry) => entry.table === 'consent_receipts');
    expect(consentInsert).toBeDefined();
    const rows = consentInsert?.value as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(3);
    const byChannel = Object.fromEntries(rows.map((row) => [row.channel, row]));
    expect(byChannel.email).toMatchObject({ granted: true, supersedes_id: 'receipt-email-old' });
    expect(byChannel.sms).toMatchObject({ granted: false, supersedes_id: 'receipt-sms-old' });
    expect(byChannel.aiVoice).toMatchObject({ granted: false, supersedes_id: null });
    // No call row is written while the disclosure is pending.
    expect(rows.find((row) => row.channel === 'call')).toBeUndefined();
  });

  it('requires a phone number when call or aiVoice permissions stay enabled', async () => {
    const { POST } = await import('../../src/pages/api/chat/permissions');
    mockState.getSupabaseServer.mockReturnValue(createSupabaseMock().api);

    const response = await POST(
      context('/api/chat/permissions', {
        email: 'owner@example.com',
        phone: null,
        permissions: {
          email: true,
          sms: false,
          call: true,
          aiVoice: false,
        },
        sourceUrl: 'https://mineralrightsxchange.com/account/',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('phone_required_for_phone_permissions');
  });

  it('records revocations for call and aiVoice from the manage-preferences API', async () => {
    const { POST } = await import('../../src/pages/api/chat/permissions');
    const { api, calls } = createSupabaseMock({
      existingConsentReceipts: [
        {
          id: 'receipt-email-old',
          channel: 'email',
          granted: true,
          created_at: '2026-07-20T09:00:00.000Z',
        },
        {
          id: 'receipt-call-old',
          channel: 'call',
          granted: true,
          created_at: '2026-07-20T10:00:00.000Z',
        },
        {
          id: 'receipt-ai-old',
          channel: 'aiVoice',
          granted: true,
          created_at: '2026-07-20T11:00:00.000Z',
        },
      ],
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await POST(
      context('/api/chat/permissions', {
        email: 'owner@example.com',
        phone: '(432) 555-0101',
        permissions: {
          email: true,
          sms: false,
          call: false,
          aiVoice: false,
        },
        sourceUrl: 'https://mineralrightsxchange.com/account/',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.completedLead).toBe(true);

    const consentInsert = calls.inserts.find((entry) => entry.table === 'consent_receipts');
    expect(consentInsert).toBeDefined();
    const rows = consentInsert?.value as Array<Record<string, unknown>>;
    // Call is gated (pending disclosure version) so the server drops it from
    // the persisted channels. Only email/sms/aiVoice are written.
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.channel === 'email')).toMatchObject({ granted: true });
    expect(rows.find((row) => row.channel === 'sms')).toMatchObject({ granted: false });
    expect(rows.find((row) => row.channel === 'aiVoice')).toMatchObject({
      granted: false,
      supersedes_id: 'receipt-ai-old',
    });
    expect(rows.find((row) => row.channel === 'call')).toBeUndefined();

    // No revoked dispatch is recorded for call because no new receipt was
    // written for the channel.
    const revokedCalls = mockState.recordCommunicationDispatch.mock.calls.filter(
      (call) => (call[0] as { status?: string })?.status === 'revoked',
    );
    expect(revokedCalls).toHaveLength(1);
    expect(revokedCalls[0][0]).toMatchObject({
      profileId: mockState.session.profileId,
      channel: 'aiVoice',
      purpose: 'requested_updates',
      destination: '(432) 555-0101',
    });
  });
});
