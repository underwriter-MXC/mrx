import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isProductionHostname } from './lib/production-host.mjs';

const acknowledgement = process.env.MRX_PRODUCTION_SMOKE_ACK;
const smokeSecret = process.env.MRX_PRODUCTION_SMOKE_SECRET;
const baseUrl = String(process.env.MRX_PRODUCTION_SMOKE_BASE_URL || '').replace(/\/$/, '');
const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const runId = randomUUID();
const reportPath = resolve('reports', `mrx-production-owner-journey-smoke-${runId}.json`);
const reservedPhone = '+12025550199';
const state = {
  startedAt: new Date().toISOString(),
  mailAccountId: null,
  mailToken: null,
  email: null,
  deviceToken: null,
  conversationId: null,
  profileId: null,
  userId: null,
  accessToken: null,
  appointmentId: null,
  localAppointmentId: null,
  contactId: null,
  emailDeliveryReceived: false,
  controlledAccessLinkUsed: false,
};

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function redactEmail(value) {
  if (!value) return null;
  const [local, domain] = value.split('@');
  return `${local.slice(0, 8)}…@${domain}`;
}

function cookieValue(response, name) {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

async function productRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: options.redirect || 'follow',
    ...options,
    headers: {
      Origin: baseUrl,
      ...(state.deviceToken ? { Cookie: `mrx_device=${state.deviceToken}` } : {}),
      ...(state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  state.deviceToken ||= cookieValue(response, 'mrx_device');
  return response;
}

async function jsonResponse(response, label) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(`${label}_${response.status}_${body.error || 'request_failed'}`);
  return body;
}

async function mailRequest(path, options = {}) {
  const response = await fetch(`https://api.mail.tm${path}`, {
    ...options,
    headers: {
      Accept: 'application/ld+json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(state.mailToken ? { Authorization: `Bearer ${state.mailToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  return response;
}

async function createDisposableInbox() {
  const domainsResponse = await mailRequest('/domains?page=1');
  const domains = await jsonResponse(domainsResponse, 'mail_domains');
  const domain = domains['hydra:member']?.find((item) => item.isActive)?.domain;
  invariant(domain, 'mail_domain_unavailable');
  const local = `mrx-smoke-${Date.now()}-${randomBytes(3).toString('hex')}`;
  const password = randomBytes(24).toString('base64url');
  state.email = `${local}@${domain}`;
  const account = await jsonResponse(
    await mailRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify({ address: state.email, password }),
    }),
    'mail_account',
  );
  state.mailAccountId = account.id;
  const token = await jsonResponse(
    await mailRequest('/token', {
      method: 'POST',
      body: JSON.stringify({ address: state.email, password }),
    }),
    'mail_token',
  );
  state.mailToken = token.token;
}

function extractMagicLink(message) {
  const source = [message.text || '', ...(message.html || [])].join('\n').replaceAll('&amp;', '&');
  return source.match(/https:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i)?.[0] || null;
}

async function waitForMagicLink() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const inbox = await jsonResponse(await mailRequest('/messages?page=1'), 'mail_messages');
    const candidate = inbox['hydra:member']?.find((message) =>
      /secure MRX owner-account sign-in link/i.test(message.subject || ''),
    );
    if (candidate) {
      const message = await jsonResponse(
        await mailRequest(`/messages/${candidate.id}`),
        'mail_message',
      );
      const link = extractMagicLink(message);
      if (link) {
        state.emailDeliveryReceived = true;
        return link;
      }
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 5_000));
  }
  return null;
}

async function requestControlledAccessLink() {
  invariant(smokeSecret, 'production_smoke_secret_required');
  const result = await jsonResponse(
    await productRequest('/api/maintenance/production-smoke-access-link', {
      method: 'POST',
      headers: {
        'x-mrx-production-smoke': 'issue-sentinel-access-link',
        'x-mrx-production-smoke-secret': smokeSecret,
      },
      body: JSON.stringify({
        acknowledgement: 'issue-sentinel-access-link',
        createdAfter: state.startedAt,
        email: state.email,
      }),
    }),
    'production_smoke_access_link',
  );
  invariant(result.actionLink, 'production_smoke_access_link_missing');
  state.controlledAccessLinkUsed = true;
  return result.actionLink;
}

async function claimMagicLink(actionLink) {
  const verification = await fetch(actionLink, { redirect: 'manual' });
  invariant([301, 302, 303, 307, 308].includes(verification.status), 'magic_link_no_redirect');
  const location = verification.headers.get('location');
  invariant(location, 'magic_link_redirect_missing');
  const redirect = new URL(location);
  invariant(redirect.origin === new URL(baseUrl).origin, 'magic_link_wrong_origin');
  const fragment = new URLSearchParams(redirect.hash.replace(/^#/, ''));
  state.accessToken = fragment.get('access_token');
  invariant(state.accessToken, 'magic_link_access_token_missing');
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: process.env.PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${state.accessToken}`,
    },
  });
  const user = await jsonResponse(userResponse, 'supabase_user');
  state.userId = user.id;
  invariant(user.email?.toLowerCase() === state.email, 'verified_email_mismatch');
  await productRequest(`${redirect.pathname}${redirect.search}`);
  await jsonResponse(
    await productRequest('/api/account/claim', { method: 'POST', body: '{}' }),
    'account_claim',
  );
}

async function signupAndVerifyProfile() {
  const initialSession = await jsonResponse(
    await productRequest('/api/chat/session', { method: 'POST', body: '{}' }),
    'initial_session',
  );
  state.conversationId = initialSession.conversationId;
  invariant(state.deviceToken, 'device_cookie_missing');

  const signup = await jsonResponse(
    await productRequest('/api/chat/identity', {
      method: 'POST',
      body: JSON.stringify({
        action: 'email',
        accountSignup: true,
        fullName: 'MRX Production Smoke',
        email: state.email,
        phone: reservedPhone,
        sourceUrl: `${baseUrl}/account/?welcome=conversation`,
        redirectTo: `${baseUrl}/account/?welcome=angela`,
      }),
    }),
    'free_profile_signup',
  );
  invariant(signup.deviceAccess === true, 'device_profile_access_missing');
  invariant(signup.verificationSent === true, 'verification_email_not_queued');

  const deviceSession = await jsonResponse(
    await productRequest('/api/chat/session'),
    'device_profile_session',
  );
  state.profileId = deviceSession.profile?.id || state.profileId;
  invariant(deviceSession.deviceAccess === true, 'free_profile_not_available_on_device');
  invariant(
    deviceSession.profile?.email?.toLowerCase() === state.email,
    'free_profile_email_mismatch',
  );

  const deliveredLink = await waitForMagicLink();
  await claimMagicLink(deliveredLink || (await requestControlledAccessLink()));
  const verifiedSession = await jsonResponse(
    await productRequest('/api/chat/session'),
    'verified_profile_session',
  );
  state.profileId = verifiedSession.profile?.id || state.profileId;
  state.conversationId = verifiedSession.conversationId || state.conversationId;
  invariant(verifiedSession.authenticated === true, 'account_not_authenticated');
  invariant(verifiedSession.accessMode === 'verified', 'verified_access_mode_missing');

  await jsonResponse(
    await productRequest('/api/account/profile', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'MRX',
        lastName: 'Production Smoke',
        phone: reservedPhone,
        residenceLocation: null,
      }),
    }),
    'profile_save',
  );
}

async function bookAndCancelAppointment() {
  const availability = await jsonResponse(
    await productRequest(
      '/api/appointments/availability?timezone=America%2FChicago&day=next_available',
    ),
    'availability',
  );
  invariant(
    Array.isArray(availability.options) && availability.options.length > 0,
    'no_live_slots',
  );
  const option = availability.options[0];
  invariant(new Date(option.start).getTime() - Date.now() >= 60 * 60_000, 'booking_floor_failed');

  const booked = await jsonResponse(
    await productRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        profile: {
          firstName: 'MRX',
          lastName: 'Production Smoke',
          email: state.email,
          phone: reservedPhone,
          timezone: 'America/Chicago',
          location: 'Production smoke test',
          permissions: {
            email: false,
            sms: false,
            marketingSms: false,
            call: true,
            aiVoice: false,
          },
          disclosureVersion: '2026-07-15-v1',
          sourceUrl: `${baseUrl}/book/`,
        },
        option,
        notes: `MRX production smoke ${runId}; cancel immediately after verification.`,
      }),
    }),
    'appointment_booking',
  );
  state.appointmentId = booked.appointmentId;
  invariant(state.appointmentId, 'appointment_id_missing');
  invariant(booked.memberAccess?.status === 'active', 'appointment_account_not_active');
  invariant(booked.notifications?.length === 0, 'unexpected_appointment_notification');

  const session = await jsonResponse(await productRequest('/api/chat/session'), 'booked_session');
  const local = session.appointments?.find(
    (appointment) => appointment.ghl_appointment_id === state.appointmentId,
  );
  invariant(local?.id, 'local_appointment_missing');
  state.localAppointmentId = local.id;
  const cancelled = await jsonResponse(
    await productRequest(`/api/appointments/${state.localAppointmentId}`, {
      method: 'DELETE',
      body: '{}',
    }),
    'appointment_cancel',
  );
  invariant(cancelled.ok === true, 'appointment_not_cancelled');
  const afterCancel = await jsonResponse(
    await productRequest('/api/chat/session'),
    'cancelled_session',
  );
  invariant(
    afterCancel.appointments?.some(
      (appointment) =>
        appointment.ghl_appointment_id === state.appointmentId &&
        appointment.status === 'cancelled',
    ),
    'appointment_cancel_not_persisted',
  );
}

async function cleanupSupabaseAndGhl() {
  if (!state.email) {
    return {
      identityRemoved: true,
      profileRemoved: true,
      appointmentRemoved: true,
      ghlContactRemoved: true,
    };
  }
  return jsonResponse(
    await productRequest('/api/maintenance/production-smoke-cleanup', {
      method: 'POST',
      headers: {
        'x-mrx-production-smoke': 'cancel-and-purge',
        'x-mrx-production-smoke-secret': smokeSecret,
      },
      body: JSON.stringify({
        acknowledgement: 'cancel-and-purge',
        createdAfter: state.startedAt,
        email: state.email,
        ...(state.appointmentId ? { appointmentId: state.appointmentId } : {}),
      }),
    }),
    'production_smoke_cleanup',
  );
}

async function cleanupInbox() {
  if (!state.mailAccountId || !state.mailToken) return null;
  const response = await mailRequest(`/accounts/${state.mailAccountId}`, { method: 'DELETE' });
  return response.status === 204;
}

async function writeReport(report) {
  await mkdir(resolve('reports'), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  invariant(acknowledgement === 'cancel-and-purge', 'production_smoke_ack_required');
  invariant(smokeSecret, 'production_smoke_secret_required');
  invariant(baseUrl, 'production_smoke_base_url_required');
  invariant(isProductionHostname(new URL(baseUrl).hostname), 'production_hostname_required');
  invariant(
    supabaseUrl && process.env.PUBLIC_SUPABASE_ANON_KEY,
    'supabase_public_configuration_required',
  );

  let journeyError = null;
  let cleanup = null;
  let inboxRemoved = null;
  const startedAt = state.startedAt;
  try {
    await createDisposableInbox();
    await signupAndVerifyProfile();
    await bookAndCancelAppointment();
  } catch (error) {
    journeyError = error instanceof Error ? error.message : 'production_smoke_failed';
  } finally {
    cleanup = await cleanupSupabaseAndGhl().catch((error) => ({
      identityRemoved: false,
      profileRemoved: false,
      appointmentRemoved: false,
      ghlContactRemoved: false,
      error: error instanceof Error ? error.message : 'cleanup_failed',
    }));
    inboxRemoved = await cleanupInbox().catch(() => false);
  }

  const ok =
    !journeyError &&
    cleanup.identityRemoved &&
    cleanup.profileRemoved &&
    cleanup.appointmentRemoved &&
    cleanup.ghlContactRemoved === true &&
    inboxRemoved === true;
  const report = {
    ok,
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl,
    identity: {
      disposableInbox: redactEmail(state.email),
      reservedPhone,
      freeProfileCreated: Boolean(state.profileId),
      magicLinkReceived: state.emailDeliveryReceived,
      controlledAccessLinkUsed: state.controlledAccessLinkUsed,
      verifiedAccountClaimed: Boolean(state.userId && state.accessToken),
    },
    appointment: {
      booked: Boolean(state.appointmentId),
      cancelledThroughProductApi: Boolean(state.localAppointmentId),
      appointmentConfirmationsRequested: [],
    },
    cleanup: { ...cleanup, disposableInboxRemoved: inboxRemoved },
    error: journeyError,
  };
  await writeReport(report);
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  if (!ok) process.exitCode = 1;
}

await main();
