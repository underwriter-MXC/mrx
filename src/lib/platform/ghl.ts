import type { AppointmentOption, ContactProfile } from './types';

const API_BASE = 'https://services.leadconnectorhq.com';
export const DEFAULT_MRX_CALENDAR_ID = 'lg3KcWfsKrR2pCWS6AeL';

type GhlConfig = {
  token: string;
  locationId: string | null;
  calendarId: string;
};

let resolvedLocation: GhlConfig | null = null;

function config() {
  const token = import.meta.env.GHL_PRIVATE_INTEGRATION_TOKEN || import.meta.env.MRX_GHL_API_KEY;
  const locationId = import.meta.env.GHL_LOCATION_ID || import.meta.env.MRX_GHL_LOCATION_ID;
  const calendarId =
    import.meta.env.GHL_CALENDAR_ID ||
    import.meta.env.MRX_GHL_CALENDAR_ID ||
    DEFAULT_MRX_CALENDAR_ID;
  return token ? { token, locationId: locationId || null, calendarId } : null;
}

async function configWithLocation() {
  const settings = config();
  if (!settings) throw new Error('GHL is not configured');
  if (settings.locationId) return settings as GhlConfig & { locationId: string };
  const cached = resolvedLocation;
  if (
    cached &&
    cached.token === settings.token &&
    cached.calendarId === settings.calendarId &&
    cached.locationId
  ) {
    return cached as GhlConfig & { locationId: string };
  }
  const response = await fetch(`${API_BASE}/calendars/${encodeURIComponent(settings.calendarId)}`, {
    headers: headers(settings.token, 'v3'),
  });
  if (!response.ok) throw new Error(`GHL calendar lookup failed (${response.status})`);
  const data = await response.json();
  const locationId = data.calendar?.locationId || data.locationId;
  if (!locationId) throw new Error('GHL calendar location is unavailable');
  resolvedLocation = { ...settings, locationId };
  return resolvedLocation as GhlConfig & { locationId: string };
}

function headers(token: string, version = '2021-07-28') {
  return {
    Authorization: `Bearer ${token}`,
    Version: version,
    'Content-Type': 'application/json',
  };
}

export function ghlConfigured() {
  return Boolean(config());
}

export function ghlMessagingConfigured() {
  return Boolean(config());
}

export async function upsertContact(profile: ContactProfile) {
  const settings = await configWithLocation();
  const response = await fetch(`${API_BASE}/contacts/upsert`, {
    method: 'POST',
    headers: headers(settings.token),
    body: JSON.stringify({
      locationId: settings.locationId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      ...(profile.email ? { email: profile.email } : {}),
      ...(profile.phone ? { phone: profile.phone } : {}),
      source: 'Ask Tommy',
      tags: ['ask-tommy', 'website-owner'],
      customFields: [
        { key: 'contact.timezone', field_value: profile.timezone || '' },
        { key: 'contact.mrx_email_permission', field_value: String(profile.permissions.email) },
        { key: 'contact.mrx_sms_permission', field_value: String(profile.permissions.sms) },
        {
          key: 'contact.mrx_marketing_sms_permission',
          field_value: String(profile.permissions.marketingSms),
        },
        { key: 'contact.mrx_call_permission', field_value: String(profile.permissions.call) },
        { key: 'contact.mrx_owner_location', field_value: profile.location || '' },
      ],
    }),
  });
  if (!response.ok) throw new Error(`GHL contact upsert failed (${response.status})`);
  const data = await response.json();
  return data.contact?.id || data.id;
}

function localDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatAvailabilitySlots(
  raw: unknown[],
  timezone: string,
  preference?: string,
  requestedDay?: 'tomorrow' | 'next_available',
  now = new Date(),
): AppointmentOption[] {
  const period = preference?.toLowerCase();
  const targetDate =
    requestedDay === 'tomorrow'
      ? localDateKey(new Date(now.getTime() + 24 * 60 * 60_000), timezone)
      : null;
  const seen = new Set<string>();
  return raw
    .map((slot: any) => {
      const startValue = typeof slot === 'string' ? slot : slot?.startTime || slot?.start;
      if (!startValue) return null;
      const startDate = new Date(startValue);
      if (Number.isNaN(startDate.getTime())) return null;
      if (targetDate && localDateKey(startDate, timezone) !== targetDate) return null;
      const endValue =
        typeof slot === 'string'
          ? new Date(startDate.getTime() + 30 * 60_000).toISOString()
          : slot.endTime || slot.end || new Date(startDate.getTime() + 30 * 60_000).toISOString();
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hourCycle: 'h23',
          timeZone: timezone,
        }).format(startDate),
      );
      if (period?.includes('morning') && hour >= 12) return null;
      if (period?.includes('afternoon') && (hour < 12 || hour >= 17)) return null;
      if (period?.includes('evening') && hour < 17) return null;
      const id = startDate.toISOString();
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        start: id,
        end: new Date(endValue).toISOString(),
        timezone,
        label: new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: timezone,
        }).format(startDate),
      } satisfies AppointmentOption;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3) as AppointmentOption[];
}

export function extractAvailabilitySlots(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const value = payload as Record<string, unknown>;
  const direct = value.slots || value.freeSlots;
  if (Array.isArray(direct)) return direct;
  return Object.values(value).flatMap(extractAvailabilitySlots);
}

export async function getAvailability(
  timezone: string,
  preference?: string,
  requestedDay?: 'tomorrow' | 'next_available',
): Promise<AppointmentOption[]> {
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const start = Date.now();
  const end = start + 14 * 24 * 60 * 60 * 1000;
  const url = new URL(`${API_BASE}/calendars/${settings.calendarId}/free-slots`);
  url.searchParams.set('startDate', String(start));
  url.searchParams.set('endDate', String(end));
  url.searchParams.set('timezone', timezone);
  const response = await fetch(url, { headers: headers(settings.token, 'v3') });
  if (!response.ok) throw new Error(`GHL availability failed (${response.status})`);
  const data = await response.json();
  const raw = extractAvailabilitySlots(data);
  return formatAvailabilitySlots(raw, timezone, preference, requestedDay);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ||
      character,
  );
}

async function sendGhlMessage(args: {
  contactId: string;
  type: 'Email' | 'SMS';
  message: string;
  subject?: string;
  html?: string;
  appointmentId?: string;
  emailTo?: string;
  toNumber?: string;
}) {
  const settings = config();
  if (!settings) throw new Error('GHL messaging is not configured');
  const response = await fetch(`${API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: headers(settings.token, 'v3'),
    body: JSON.stringify({ ...args, status: 'pending' }),
  });
  if (!response.ok) throw new Error(`GHL ${args.type.toLowerCase()} failed (${response.status})`);
  const data = await response.json();
  return data.messageId as string | undefined;
}

export async function sendRequestedInformation(args: {
  profile: ContactProfile;
  channels: Array<'email' | 'sms'>;
  answer: string;
  link: string;
}) {
  const contactId = await upsertContact(args.profile);
  const sent: Array<'email' | 'sms'> = [];
  const failures: Array<'email' | 'sms'> = [];
  const tasks = args.channels.map(async (channel) => {
    try {
      if (channel === 'email' && args.profile.email && args.profile.permissions.email) {
        const safeAnswer = escapeHtml(args.answer).replace(/\n/g, '<br />');
        await sendGhlMessage({
          contactId,
          type: 'Email',
          emailTo: args.profile.email,
          subject: 'The MRX information you asked Tommy to send',
          message: `${args.answer}\n\nOpen the related MRX page: ${args.link}`,
          html: `<p>Hi ${escapeHtml(args.profile.firstName)},</p><p>${safeAnswer}</p><p><a href="${escapeHtml(args.link)}">Open the related MRX page</a></p><p>— Tommy, MRX AI Guide</p>`,
        });
        sent.push('email');
      } else if (channel === 'sms' && args.profile.phone && args.profile.permissions.sms) {
        await sendGhlMessage({
          contactId,
          type: 'SMS',
          toNumber: args.profile.phone,
          message: `Hi ${args.profile.firstName}, here’s the MRX information you asked Tommy to send: ${args.link} Reply STOP to opt out or HELP for help.`,
        });
        sent.push('sms');
      } else {
        failures.push(channel);
      }
    } catch {
      failures.push(channel);
    }
  });
  await Promise.all(tasks);
  return { contactId, sent, failures };
}

export async function bookAppointment(args: {
  profile: ContactProfile;
  option: AppointmentOption;
  notes?: string;
}) {
  const settings = await configWithLocation();
  const contactId = await upsertContact(args.profile);
  const response = await fetch(`${API_BASE}/calendars/events/appointments`, {
    method: 'POST',
    headers: headers(settings.token, 'v3'),
    body: JSON.stringify({
      calendarId: settings.calendarId,
      locationId: settings.locationId,
      contactId,
      startTime: args.option.start,
      endTime: args.option.end,
      title: `MRX mineral-owner phone review — ${args.profile.firstName}`,
      appointmentStatus: 'confirmed',
      address: 'Phone call',
      // Disable calendar-default notifications so an unselected channel can
      // never send. Explicit confirmations are sent below from the separately
      // recorded email and SMS permission choices.
      toNotify: false,
      ignoreDateRange: false,
      notes: args.notes?.slice(0, 2000),
    }),
  });
  if (!response.ok) throw new Error(`GHL appointment failed (${response.status})`);
  const data = await response.json();
  const appointmentId = data.id || data.event?.id;
  const notifications: Array<'email' | 'sms'> = [];
  const notificationFailures: Array<'email' | 'sms'> = [];
  const confirmation = `Your MRX phone appointment is confirmed for ${args.option.label}.`;
  const sends: Promise<void>[] = [];
  if (args.profile.permissions.email && args.profile.email)
    sends.push(
      (async () => {
        try {
          await sendGhlMessage({
            contactId,
            type: 'Email',
            appointmentId,
            emailTo: args.profile.email,
            subject: 'Your MRX phone appointment is confirmed',
            message: confirmation,
            html: `<p>Hi ${escapeHtml(args.profile.firstName)},</p><p>${escapeHtml(confirmation)}</p><p>We’ll call the number you provided.</p>`,
          });
          notifications.push('email');
        } catch {
          notificationFailures.push('email');
        }
      })(),
    );
  if (args.profile.permissions.sms && args.profile.phone)
    sends.push(
      (async () => {
        try {
          await sendGhlMessage({
            contactId,
            type: 'SMS',
            appointmentId,
            toNumber: args.profile.phone,
            message: `${confirmation} Reply STOP to opt out or HELP for help.`,
          });
          notifications.push('sms');
        } catch {
          notificationFailures.push('sms');
        }
      })(),
    );
  await Promise.all(sends);
  return { id: appointmentId, contactId, notifications, notificationFailures };
}

export async function rescheduleAppointment(appointmentId: string, option: AppointmentOption) {
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const response = await fetch(
    `${API_BASE}/calendars/events/appointments/${encodeURIComponent(appointmentId)}`,
    {
      method: 'PUT',
      headers: headers(settings.token, 'v3'),
      body: JSON.stringify({
        startTime: option.start,
        endTime: option.end,
        appointmentStatus: 'confirmed',
      }),
    },
  );
  if (!response.ok) throw new Error(`GHL reschedule failed (${response.status})`);
  return response.json();
}

export async function cancelAppointment(appointmentId: string) {
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const response = await fetch(
    `${API_BASE}/calendars/events/${encodeURIComponent(appointmentId)}`,
    {
      method: 'DELETE',
      headers: headers(settings.token, 'v3'),
    },
  );
  if (!response.ok) throw new Error(`GHL cancellation failed (${response.status})`);
}

export async function verifyGhlSignature(request: Request, rawBody: string) {
  const publicKey = import.meta.env.GHL_WEBHOOK_PUBLIC_KEY;
  const signature = request.headers.get('x-ghl-signature');
  if (!publicKey || !signature) return false;
  const body = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  const binary = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('spki', binary, { name: 'Ed25519' }, false, ['verify']);
  const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0));
  return crypto.subtle.verify('Ed25519', key, signatureBytes, new TextEncoder().encode(rawBody));
}
