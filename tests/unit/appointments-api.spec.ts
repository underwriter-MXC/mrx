import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  session: {
    conversationId: 'conversation-1',
    profileId: '11111111-1111-4111-8111-111111111111',
    deviceHash: 'device-hash',
    userId: null,
    email: null,
    emailVerified: false,
    persisted: true,
  },
  bookAppointment: vi.fn(),
  getSupabaseServer: vi.fn(),
  recordCommunicationDispatch: vi.fn(),
  testOutboundSuppressionForProfile: vi.fn(),
  provisionAppointmentMemberAccess: vi.fn(),
}));

vi.mock('../../src/lib/platform/ghl', () => ({
  bookAppointment: mockState.bookAppointment,
}));

vi.mock('../../src/lib/platform/supabase', () => ({
  getSupabaseServer: mockState.getSupabaseServer,
}));

vi.mock('../../src/lib/platform/communications', () => ({
  recordCommunicationDispatch: mockState.recordCommunicationDispatch,
  testOutboundSuppressionForProfile: mockState.testOutboundSuppressionForProfile,
}));

vi.mock('../../src/lib/platform/identity', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/platform/identity')>(
    '../../src/lib/platform/identity',
  );
  return {
    ...actual,
    resolveOwnerSession: vi.fn(async () => mockState.session),
    provisionAppointmentMemberAccess: mockState.provisionAppointmentMemberAccess,
  };
});

function appointmentPayload(overrides: Record<string, unknown> = {}) {
  return {
    profile: {
      firstName: 'Riley',
      lastName: 'Owner',
      email: 'owner@example.com',
      phone: '+14325550101',
      timezone: 'America/Chicago',
      location: 'Midland County, Texas',
      permissions: {
        email: true,
        sms: true,
        marketingSms: false,
        call: true,
        aiVoice: false,
      },
      disclosureVersion: '2026-07-17-appointment',
      sourceUrl: 'https://mineralrightsxchange.com/account/',
    },
    option: {
      id: 'slot-1',
      start: '2026-07-23T20:00:00.000Z',
      end: '2026-07-23T20:30:00.000Z',
      label: 'Thursday, Jul 23, 3:00 PM CDT',
      timezone: 'America/Chicago',
    },
    ...overrides,
  };
}

function context(body: unknown, ip = '203.0.113.10') {
  const url = 'https://mineralrightsxchange.com/api/appointments';
  return {
    request: new Request(url, {
      method: 'POST',
      headers: {
        origin: 'https://mineralrightsxchange.com',
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    }),
    url: new URL(url),
  } as any;
}

type SupabaseOptions = {
  existingAppointment?: Record<string, unknown> | null;
};

function supabaseMock(options: SupabaseOptions = {}) {
  const calls = {
    inserts: [] as Array<{ table: string; value: unknown }>,
    updates: [] as Array<{ table: string; value: unknown }>,
  };

  const api = {
    from: vi.fn((table: string) => {
      let result: { data: unknown; error: unknown } = { data: null, error: null };
      const builder: any = {
        select: vi.fn(() => {
          if (table === 'appointments') {
            result = { data: options.existingAppointment ?? null, error: null };
          } else if (table === 'profiles') {
            result = { data: { id: mockState.session.profileId }, error: null };
          } else {
            result = { data: null, error: null };
          }
          return builder;
        }),
        update: vi.fn((value: unknown) => {
          calls.updates.push({ table, value });
          if (table === 'profiles') {
            result = { data: { id: mockState.session.profileId }, error: null };
          }
          return builder;
        }),
        insert: vi.fn((value: unknown) => {
          calls.inserts.push({ table, value });
          return Promise.resolve({ data: { id: `${table}-insert` }, error: null });
        }),
        eq: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => result),
        single: vi.fn(async () => result),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
      };
      return builder;
    }),
  } as any;

  return { api, calls };
}

describe('/api/appointments', () => {
  beforeEach(() => {
    mockState.bookAppointment.mockResolvedValue({
      id: 'appointment-1',
      contactId: 'contact-1',
      notifications: ['email', 'sms'],
      notificationFailures: [],
      workflowEnrolled: false,
    });
    mockState.recordCommunicationDispatch.mockResolvedValue({ id: 'dispatch-1' });
    mockState.testOutboundSuppressionForProfile.mockResolvedValue({
      suppressed: false,
      isTest: false,
      testRunId: null,
    });
    mockState.provisionAppointmentMemberAccess.mockResolvedValue({
      status: 'unavailable',
      linkSent: false,
      redirectTo: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns duplicate 409 before profile mutation or provider booking', async () => {
    const { POST } = await import('../../src/pages/api/appointments/index');
    const { api } = supabaseMock({
      existingAppointment: {
        id: 'existing-appointment',
        starts_at: '2026-07-23T20:00:00.000Z',
      },
    });
    mockState.getSupabaseServer.mockReturnValue(api);

    const response = await POST(context(appointmentPayload()));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: 'appointment_already_booked',
      appointment: {
        id: 'existing-appointment',
        starts_at: '2026-07-23T20:00:00.000Z',
      },
    });
    expect(mockState.bookAppointment).not.toHaveBeenCalled();
    expect(mockState.recordCommunicationDispatch).not.toHaveBeenCalled();
  });

  it('suppresses test-profile appointment booking before any GHL provider call', async () => {
    const { POST } = await import('../../src/pages/api/appointments/index');
    const { api, calls } = supabaseMock({ existingAppointment: null });
    mockState.getSupabaseServer.mockReturnValue(api);
    mockState.testOutboundSuppressionForProfile.mockResolvedValue({
      suppressed: true,
      isTest: true,
      testRunId: '00000000-0000-4000-8000-000000000001',
    });

    const response = await POST(context(appointmentPayload(), '203.0.113.11'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, appointmentId: null, notifications: [], suppressed: true });
    expect(mockState.bookAppointment).not.toHaveBeenCalled();
    expect(calls.inserts.some((entry) => entry.table === 'appointments')).toBe(false);
    expect(mockState.recordCommunicationDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'call',
        status: 'suppressed',
        requestedBy: 'test',
        metadata: { reason: 'test_profile_outbound_suppressed' },
      }),
    );
  });
});
