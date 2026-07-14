import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookAppointment, sendRequestedInformation } from '../../src/lib/platform/ghl';
import type { AppointmentOption, ContactProfile } from '../../src/lib/platform/types';

const profile: ContactProfile = {
  firstName: 'Daryl',
  lastName: 'Hill',
  email: 'daryl@example.com',
  phone: '+12125550199',
  timezone: 'America/New_York',
  location: 'Reeves County, Texas',
  permissions: { email: true, sms: true, marketingSms: false, call: true },
  disclosureVersion: 'test',
  sourceUrl: 'https://mineralrightsxchange.com/',
};

const option: AppointmentOption = {
  id: '2026-07-14T22:00:00.000Z',
  start: '2026-07-14T22:00:00.000Z',
  end: '2026-07-14T22:30:00.000Z',
  label: 'Tuesday, Jul 14 at 6:00 PM',
  timezone: 'America/New_York',
};

describe('HighLevel conversational delivery contract', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('GHL_PRIVATE_INTEGRATION_TOKEN', 'test-token');
    vi.stubEnv('GHL_LOCATION_ID', 'location-1');
    vi.stubEnv('GHL_CALENDAR_ID', 'calendar-1');
    fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/contacts/upsert')) {
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      }
      if (url.endsWith('/calendars/events/appointments')) {
        return new Response(JSON.stringify({ event: { id: 'appointment-1' } }), { status: 200 });
      }
      if (url.endsWith('/conversations/messages')) {
        const body = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ messageId: `message-${body.type}` }), { status: 200 });
      }
      return new Response('unexpected URL', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the full answer by email and a mobile link by SMS only after both permissions are granted', async () => {
    const result = await sendRequestedInformation({
      profile,
      channels: ['email', 'sms'],
      answer: 'Review the acreage, depths, title-review terms, and adjustment language.',
      link: 'https://mineralrightsxchange.com/offer-review/',
    });

    expect(result).toEqual({ contactId: 'contact-1', sent: ['email', 'sms'], failures: [] });
    const messageCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).endsWith('/conversations/messages'),
    );
    expect(messageCalls).toHaveLength(2);
    const payloads = messageCalls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    const email = payloads.find((payload) => payload.type === 'Email');
    const sms = payloads.find((payload) => payload.type === 'SMS');
    expect(email.emailTo).toBe('daryl@example.com');
    expect(email.message).toContain('Review the acreage');
    expect(email.message).toContain('/offer-review/');
    expect(sms.toNumber).toBe('+12125550199');
    expect(sms.message).toContain('/offer-review/');
    expect(sms.message).toMatch(/STOP.*HELP/);
    expect((messageCalls[0][1] as RequestInit).headers).toMatchObject({ Version: 'v3' });
  });

  it('does not send through a channel whose permission is false', async () => {
    const emailOnly = { ...profile, permissions: { ...profile.permissions, sms: false } };
    const result = await sendRequestedInformation({
      profile: emailOnly,
      channels: ['email', 'sms'],
      answer: 'Requested information.',
      link: 'https://mineralrightsxchange.com/learning-center/',
    });
    expect(result.sent).toEqual(['email']);
    expect(result.failures).toEqual(['sms']);
    const payloads = fetchSpy.mock.calls
      .filter(([url]) => String(url).endsWith('/conversations/messages'))
      .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(payloads.map((payload) => payload.type)).toEqual(['Email']);
  });

  it('books the selected slot with default notifications disabled, then sends only explicit confirmations', async () => {
    const result = await bookAppointment({ profile, option, notes: 'Offer review requested.' });
    expect(result).toEqual({
      id: 'appointment-1',
      contactId: 'contact-1',
      notifications: ['email', 'sms'],
      notificationFailures: [],
    });

    const appointmentCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/calendars/events/appointments'),
    );
    expect(appointmentCall).toBeTruthy();
    const appointmentPayload = JSON.parse(String((appointmentCall?.[1] as RequestInit).body));
    expect(appointmentPayload).toMatchObject({
      calendarId: 'calendar-1',
      contactId: 'contact-1',
      startTime: option.start,
      endTime: option.end,
      toNotify: false,
    });
    expect((appointmentCall?.[1] as RequestInit).headers).toMatchObject({ Version: 'v3' });

    const confirmations = fetchSpy.mock.calls
      .filter(([url]) => String(url).endsWith('/conversations/messages'))
      .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(confirmations.map((message) => message.type).sort()).toEqual(['Email', 'SMS']);
    expect(confirmations.every((message) => message.appointmentId === 'appointment-1')).toBe(true);
  });

  it('keeps the appointment confirmed when a selected confirmation channel fails', async () => {
    fetchSpy.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/contacts/upsert'))
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      if (url.endsWith('/calendars/events/appointments'))
        return new Response(JSON.stringify({ id: 'appointment-1' }), { status: 200 });
      if (url.endsWith('/conversations/messages')) {
        const body = JSON.parse(String(init?.body));
        return body.type === 'SMS'
          ? new Response('provider unavailable', { status: 503 })
          : new Response(JSON.stringify({ messageId: 'message-email' }), { status: 200 });
      }
      return new Response('unexpected URL', { status: 404 });
    });

    const result = await bookAppointment({ profile, option });
    expect(result.id).toBe('appointment-1');
    expect(result.notifications).toEqual(['email']);
    expect(result.notificationFailures).toEqual(['sms']);
  });

  it('resolves the HighLevel location from the MRX calendar when no location environment value is set', async () => {
    vi.stubEnv('GHL_LOCATION_ID', '');
    fetchSpy.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/calendars/calendar-1')) {
        return new Response(
          JSON.stringify({ calendar: { id: 'calendar-1', locationId: 'resolved-location' } }),
          { status: 200 },
        );
      }
      if (url.endsWith('/contacts/upsert')) {
        const body = JSON.parse(String(init?.body));
        expect(body.locationId).toBe('resolved-location');
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      }
      if (url.endsWith('/calendars/events/appointments')) {
        return new Response(JSON.stringify({ id: 'appointment-1' }), { status: 200 });
      }
      return new Response('unexpected URL', { status: 404 });
    });

    const noConfirmationProfile = {
      ...profile,
      permissions: { ...profile.permissions, email: false, sms: false },
    };
    const result = await bookAppointment({ profile: noConfirmationProfile, option });
    expect(result.id).toBe('appointment-1');
    expect(
      fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/calendars/calendar-1')),
    ).toHaveLength(1);
  });
});
