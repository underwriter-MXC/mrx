import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  session: {
    conversationId: 'conversation-1',
    profileId: '11111111-1111-4111-8111-111111111111',
    deviceHash: 'device-hash',
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'owner@example.com',
    emailVerified: true,
    persisted: true,
    accessMode: 'verified' as const,
  },
  requireOwnerProfileAccess: vi.fn(),
  getSupabaseServer: vi.fn(),
}));

vi.mock('../../src/lib/platform/identity', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/platform/identity')>(
    '../../src/lib/platform/identity',
  );
  return {
    ...actual,
    requireOwnerProfileAccess: mockState.requireOwnerProfileAccess,
  };
});

vi.mock('../../src/lib/platform/supabase', () => ({
  getSupabaseServer: mockState.getSupabaseServer,
}));

function context(path = '/api/account/case-status') {
  const url = `https://mineralrightsxchange.com${path}`;
  return {
    request: new Request(url, {
      method: 'GET',
      headers: {
        authorization: 'Bearer owner-token',
        origin: 'https://mineralrightsxchange.com',
        'x-forwarded-for': '203.0.113.7',
      },
    }),
    url: new URL(url),
  } as any;
}

function supabaseMock(
  workspace: Record<string, unknown> | null,
  completedReview: Record<string, unknown> | null = null,
) {
  const calls = {
    tables: [] as string[],
    selects: [] as string[],
    eq: [] as Array<[string, unknown]>,
  };
  const builders = {
    internal_case_workspaces: null as any,
    audit_events: null as any,
    underwriting_packets: null as any,
  };
  function builderFor(result: Record<string, unknown> | null) {
    const builder: any = {
    select: vi.fn((value: string) => {
      calls.selects.push(value);
      return builder;
    }),
    eq: vi.fn((field: string, value: unknown) => {
      calls.eq.push([field, value]);
      return builder;
    }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({ data: result, error: null })),
    };
    return builder;
  }
  builders.internal_case_workspaces = builderFor(workspace);
  builders.audit_events = builderFor(completedReview);
  builders.underwriting_packets = builderFor(null);
  const api = {
    from: vi.fn((table: string) => {
      calls.tables.push(table);
      return builders[table as keyof typeof builders];
    }),
  } as any;
  return { api, calls };
}

describe('owner private case status API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockState.requireOwnerProfileAccess.mockResolvedValue(mockState.session);
  });

  it('returns only the owner-safe status projection for the authenticated owner profile', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    const { api, calls } = supabaseMock({
      status: 'needs_info',
      updated_at: '2026-09-08T21:00:00.000Z',
      case_rating: 'hot',
      underwriter_brief: 'internal note',
      valuation_status: 'approved',
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await GET(context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(calls.tables).toContain('internal_case_workspaces');
    expect(calls.tables).toContain('audit_events');
    expect(calls.tables).not.toContain('underwriting_packets');
    expect(calls.selects).toContain('status,updated_at');
    expect(calls.selects).toContain('actor_user_id,created_at,event_type,metadata');
    expect(calls.eq).toContainEqual(['profile_id', mockState.session.profileId]);
    expect(calls.eq).toContainEqual(['event_type', 'staff_owner_case_review_completed']);
    expect(body.caseStatus).toEqual({
      status: 'information_requested',
      label: 'Information requested',
      description: expect.stringContaining('additional owner-provided information'),
      updatedAt: '2026-09-08T21:00:00.000Z',
      source: 'staff_case_workspace',
    });
    expect(JSON.stringify(body)).not.toMatch(
      /needs_info|case_rating|underwriter_brief|valuation_status|internal note|staff_profile|opportunity/i,
    );
    expect(body.notifications.policy).toBe('no_messages_now');
  });

  it('does not project review completed from terminal-looking pipeline statuses without review evidence', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    for (const internalStatus of ['title_review', 'lost', 'closed']) {
      const { api } = supabaseMock({
        status: internalStatus,
        updated_at: '2026-09-08T21:00:00.000Z',
      });
      mockState.getSupabaseServer.mockReturnValue(api);

      const response = await GET(context(`/api/account/case-status?case=${internalStatus}`));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.caseStatus).toBeNull();
      expect(body.emptyState.title).toBe('Case status unavailable');
      expect(JSON.stringify(body)).not.toMatch(/review_completed|Review completed/);
    }
  });

  it('ignores stale document-readiness finalization records and keeps terminal stages non-completed', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    const { api, calls } = supabaseMock({
      status: 'closed',
      updated_at: '2026-09-08T21:00:00.000Z',
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await GET(context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(calls.tables).not.toContain('underwriting_packets');
    expect(body.caseStatus).toBeNull();
    expect(body.emptyState.title).toBe('Case status unavailable');
    expect(JSON.stringify(body)).not.toMatch(/review_completed|Review completed|Document readiness reviewed/);
  });

  it('projects review completed only when a case-review-completed audit event exists', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    const { api } = supabaseMock(
      { status: 'closed', updated_at: '2026-09-08T21:00:00.000Z' },
      {
        actor_user_id: 'reviewer-user-1',
        created_at: '2026-09-08T22:00:00.000Z',
        event_type: 'staff_owner_case_review_completed',
        metadata: { evidenceLabel: 'actual', occurredAt: '2026-09-08T22:00:00.000Z' },
      },
    );
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await GET(context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.caseStatus).toEqual({
      status: 'review_completed',
      label: 'Review completed',
      description: expect.stringContaining('completed a human review'),
      updatedAt: '2026-09-08T22:00:00.000Z',
      source: 'staff_case_workspace',
    });
    expect(JSON.stringify(body)).not.toMatch(
      /reviewer-user-1|actor_user_id|staff_owner_case_review_completed|closed/,
    );
  });

  it('does not let older review-completed evidence override newer information-needed or hold state', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    for (const internalStatus of ['needs_info', 'on_hold']) {
      const { api } = supabaseMock(
        { status: internalStatus, updated_at: '2026-09-08T23:00:00.000Z' },
        {
          actor_user_id: 'reviewer-user-1',
          created_at: '2026-09-08T23:30:00.000Z',
          event_type: 'staff_owner_case_review_completed',
          metadata: { evidenceLabel: 'actual', occurredAt: '2026-09-08T22:00:00.000Z' },
        },
      );
      mockState.getSupabaseServer.mockReturnValue(api);

      const response = await GET(context(`/api/account/case-status?case=${internalStatus}`));
      const body = await response.json();

      expect(response.status).toBe(200);
      if (internalStatus === 'needs_info') {
        expect(body.caseStatus.status).toBe('information_requested');
        expect(body.caseStatus.label).toBe('Information requested');
      } else {
        expect(body.caseStatus).toBeNull();
        expect(body.emptyState.title).toBe('Case status unavailable');
      }
      expect(JSON.stringify(body)).not.toMatch(/review_completed|Review completed|reviewer-user-1/);
    }
  });

  it('uses owner access enforcement and an accessible empty state without enumeration details', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    const { api } = supabaseMock(null);
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await GET(context());
    const body = await response.json();

    expect(mockState.requireOwnerProfileAccess).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body.caseStatus).toBeNull();
    expect(body.emptyState).toEqual({
      title: 'No MRX case status yet',
      message: expect.stringContaining('safe high-level status'),
    });
    expect(JSON.stringify(body.emptyState)).not.toMatch(/profile_id|internal_case_workspaces|not found/i);
  });

  it('returns the same safe auth failure for unauthorized profile access', async () => {
    const { GET } = await import('../../src/pages/api/account/case-status');
    mockState.requireOwnerProfileAccess.mockRejectedValueOnce(
      new Response('Completed owner signup required', { status: 401 }),
    );
    mockState.getSupabaseServer.mockReturnValue(supabaseMock(null).api);

    const response = await GET(context());

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Completed owner signup required');
  });
});