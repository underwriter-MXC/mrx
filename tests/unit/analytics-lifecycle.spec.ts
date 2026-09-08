import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendGa4ServerEvent } from '../../src/lib/platform/analytics';

const webhookSource = readFileSync(
  new URL('../../src/pages/api/webhooks/ghl.ts', import.meta.url),
  'utf8',
);
const staffPacketSource = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/underwriting-packet.ts', import.meta.url),
  'utf8',
);

describe('server-side funnel lifecycle analytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('does not contact GA4 when Measurement Protocol is not configured', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', '');
    vi.stubEnv('GA4_API_SECRET', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      sendGa4ServerEvent({
        event: 'case_ready',
        profileId: crypto.randomUUID(),
        analyticsConsent: 'granted',
      }),
    ).resolves.toEqual({ sent: false, reason: 'not_configured' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not contact GA4 without explicit analytics consent', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST123');
    vi.stubEnv('GA4_API_SECRET', 'test-api-secret');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      sendGa4ServerEvent({ event: 'case_ready', profileId: crypto.randomUUID() }),
    ).resolves.toEqual({ sent: false, reason: 'consent_not_granted' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends only the approved lifecycle event and non-document parameters', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST123');
    vi.stubEnv('GA4_API_SECRET', 'test-api-secret');
    vi.stubEnv('MRX_ATTRIBUTION_ID_PEPPER', 'analytics-test-pepper');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    const profileId = crypto.randomUUID();

    await expect(
      sendGa4ServerEvent({
        event: 'appointment_held',
        profileId,
        analyticsConsent: 'granted',
        params: { mrx_calendar_event_id: 'appointment-1' },
      }),
    ).resolves.toEqual({ sent: true });

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('measurement_id=G-TEST123');
    expect(url).toContain('api_secret=test-api-secret');
    const payload = JSON.parse(String(options.body));
    expect(payload.client_id).toMatch(/^mrxpid_[a-f0-9]{32}$/);
    expect(payload.user_id).toBe(payload.client_id);
    expect(payload.client_id).not.toContain(profileId);
    expect(payload.events).toEqual([
      {
        name: 'appointment_held',
        params: { engagement_time_msec: 1, mrx_calendar_event_id: 'appointment-1' },
      },
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/rawText|encrypted_raw_text|storage_path|profileId/i);
  });

  it('wires appointment-held and finalized-case events to their authoritative transitions', () => {
    expect(webhookSource).toContain("event: 'appointment_held'");
    expect(webhookSource).toContain("localAppointmentStatus === 'completed'");
    expect(staffPacketSource).toContain("event: 'case_ready'");
    expect(staffPacketSource).toContain("rpc('finalize_underwriting_packet'");
  });

  it('supports the extended case outcome event names without exposing profile IDs', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST123');
    vi.stubEnv('GA4_API_SECRET', 'test-api-secret');
    vi.stubEnv('MRX_ATTRIBUTION_ID_PEPPER', 'analytics-test-pepper');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    const profileId = crypto.randomUUID();

    await expect(
      sendGa4ServerEvent({
        event: 'case_agreed_next_step',
        profileId,
        analyticsConsent: 'granted',
        params: {
          outcome_evidence_label: 'actual',
          source_path: '/book/',
          internalNote: 'staff-only note must be stripped',
        },
      }),
    ).resolves.toEqual({ sent: true });

    const payload = JSON.parse(String((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body));
    expect(payload.events[0].name).toBe('case_agreed_next_step');
    expect(payload.events[0].params.outcome_evidence_label).toBe('actual');
    expect(JSON.stringify(payload)).not.toContain(profileId);
    expect(JSON.stringify(payload)).not.toMatch(/internalNote|staff-only note/i);
  });
});
