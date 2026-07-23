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
      sendGa4ServerEvent({ event: 'case_ready', profileId: crypto.randomUUID() }),
    ).resolves.toEqual({ sent: false, reason: 'not_configured' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends only the approved lifecycle event and non-document parameters', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST123');
    vi.stubEnv('GA4_API_SECRET', 'test-api-secret');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    const profileId = crypto.randomUUID();

    await expect(
      sendGa4ServerEvent({
        event: 'appointment_held',
        profileId,
        params: { mrx_calendar_event_id: 'appointment-1' },
      }),
    ).resolves.toEqual({ sent: true });

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('measurement_id=G-TEST123');
    expect(url).toContain('api_secret=test-api-secret');
    const payload = JSON.parse(String(options.body));
    expect(payload.events).toEqual([
      {
        name: 'appointment_held',
        params: { engagement_time_msec: 1, mrx_calendar_event_id: 'appointment-1' },
      },
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/rawText|encrypted_raw_text|storage_path/i);
  });

  it('wires appointment-held and finalized-case events to their authoritative transitions', () => {
    expect(webhookSource).toContain("event: 'appointment_held'");
    expect(webhookSource).toContain("localAppointmentStatus === 'completed'");
    expect(staffPacketSource).toContain("event: 'case_ready'");
    expect(staffPacketSource).toContain("rpc('finalize_underwriting_packet'");
  });
});
