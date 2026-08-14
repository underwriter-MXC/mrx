import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { runtimeEnv } from '../../../lib/platform/runtime-env';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';
import { getSupabaseServer } from '../../../lib/platform/supabase';

const RESERVED_PHONE = '+12025550199';
const SENTINEL_FIRST_NAME = 'MRX';
const SENTINEL_LAST_NAME = 'Production Smoke';
const MAX_LOOKBACK_MS = 30 * 60_000;
const EMAIL_PATTERN = /^mrx-smoke-\d+-[0-9a-f]{6}@[a-z0-9.-]+$/i;

function hasSmokeSecret(request: Request) {
  const expected = runtimeEnv('MRX_PRODUCTION_SMOKE_SECRET');
  const provided = request.headers.get('x-mrx-production-smoke-secret');
  if (!expected || !provided) return false;
  const expectedBytes = new TextEncoder().encode(expected);
  const providedBytes = new TextEncoder().encode(provided);
  return (
    expectedBytes.byteLength === providedBytes.byteLength &&
    timingSafeEqual(expectedBytes, providedBytes)
  );
}

const Schema = z.object({
  acknowledgement: z.literal('cancel-and-purge'),
  createdAfter: z.string().datetime(),
  email: z.string().email().max(320).optional(),
  appointmentId: z.string().trim().min(1).max(160).optional(),
});

function ghlToken() {
  return (
    runtimeEnv('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    runtimeEnv('MRX_GHL_API_KEY') ||
    runtimeEnv('GHL_API_TOKEN')
  );
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: '2021-07-28',
    Accept: 'application/json',
  };
}

async function deleteGhlResource(url: string, token: string, toleratedStatuses = [404]) {
  const response = await fetch(url, { method: 'DELETE', headers: ghlHeaders(token) });
  if (!response.ok && !toleratedStatuses.includes(response.status)) {
    throw new Error(`production_smoke_provider_cleanup_${response.status}`);
  }
}

async function ghlContactIsRemoved(contactId: string, token: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`,
      { headers: ghlHeaders(token) },
    );
    // GHL returns either 404 or 400 for a contact ID immediately after deletion.
    if (response.status === 400 || response.status === 404) return true;
    if (!response.ok) throw new Error(`production_smoke_provider_verify_${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function authUsersForEmails(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  emails: Set<string>,
) {
  const matches: Array<{ id: string; email?: string }> = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1_000 });
    if (error) throw error;
    const users = data.users || [];
    matches.push(
      ...users.filter((user) => user.email && emails.has(user.email.trim().toLowerCase())),
    );
    if (users.length < 1_000) break;
  }
  return matches;
}

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`production-smoke-cleanup:${clientKey(context)}`, 3, 10 * 60_000);
    if (context.request.headers.get('x-mrx-production-smoke') !== 'cancel-and-purge') {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    if (!hasSmokeSecret(context.request)) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_smoke_cleanup' }, { status: 400 });

    const createdAfter = new Date(parsed.data.createdAfter).getTime();
    const now = Date.now();
    if (createdAfter < now - MAX_LOOKBACK_MS || createdAfter > now + 60_000) {
      return json({ ok: false, error: 'invalid_smoke_window' }, { status: 400 });
    }
    const normalizedEmail = parsed.data.email?.trim().toLowerCase() || null;
    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      return json({ ok: false, error: 'invalid_smoke_identity' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    let profileQuery = supabase
      .from('profiles')
      .select('id,user_id,conversation_id,normalized_email,ghl_contact_id')
      .eq('first_name', SENTINEL_FIRST_NAME)
      .eq('last_name', SENTINEL_LAST_NAME)
      .eq('normalized_phone', RESERVED_PHONE)
      .gte('created_at', new Date(createdAfter).toISOString());
    if (normalizedEmail) profileQuery = profileQuery.eq('normalized_email', normalizedEmail);
    const { data: candidates, error: lookupError } = await profileQuery;
    if (lookupError) throw lookupError;
    const profiles = (candidates || []).filter(
      (profile) => profile.normalized_email && EMAIL_PATTERN.test(profile.normalized_email),
    );
    const profileIds = profiles.map((profile) => profile.id);
    const conversationIds = profiles
      .map((profile) => profile.conversation_id)
      .filter((value): value is string => Boolean(value));
    const contactIds = profiles
      .map((profile) => profile.ghl_contact_id)
      .filter((value): value is string => Boolean(value));
    const emails = new Set(
      profiles.map((profile) => profile.normalized_email.trim().toLowerCase()),
    );

    const { data: localAppointments, error: appointmentLookupError } = profileIds.length
      ? await supabase
          .from('appointments')
          .select('ghl_appointment_id')
          .in('profile_id', profileIds)
      : { data: [], error: null };
    if (appointmentLookupError) throw appointmentLookupError;
    const verifiedAppointmentIds = new Set(
      (localAppointments || [])
        .map((appointment) => appointment.ghl_appointment_id)
        .filter((value): value is string => Boolean(value)),
    );
    if (parsed.data.appointmentId && !verifiedAppointmentIds.has(parsed.data.appointmentId)) {
      return json({ ok: false, error: 'smoke_appointment_mismatch' }, { status: 400 });
    }

    const token = ghlToken();
    if ((contactIds.length || verifiedAppointmentIds.size) && !token) {
      return json({ ok: false, error: 'provider_cleanup_unavailable' }, { status: 503 });
    }
    if (token) {
      for (const appointmentId of verifiedAppointmentIds) {
        await deleteGhlResource(
          `https://services.leadconnectorhq.com/calendars/events/${encodeURIComponent(appointmentId)}`,
          token,
          [400, 404],
        );
      }
      const workflowId = runtimeEnv('GHL_APPOINTMENT_WORKFLOW_ID');
      for (const contactId of contactIds) {
        if (workflowId) {
          await deleteGhlResource(
            `https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(workflowId)}`,
            token,
            [400, 404],
          );
        }
        await deleteGhlResource(
          `https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`,
          token,
        );
      }
    }

    const authUsers = await authUsersForEmails(supabase, emails);
    for (const user of authUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
    }
    if (conversationIds.length) {
      const { error } = await supabase
        .from('device_sessions')
        .delete()
        .in('active_conversation_id', conversationIds);
      if (error) throw error;
    }
    const { data: deletedProfiles, error: profileDeleteError } = profileIds.length
      ? await supabase.from('profiles').delete().in('id', profileIds).select('id')
      : { data: [], error: null };
    if (profileDeleteError) throw profileDeleteError;
    if (conversationIds.length) {
      const { error } = await supabase.from('conversations').delete().in('id', conversationIds);
      if (error) throw error;
    }

    const { count: remainingProfiles, error: profileVerifyError } = profileIds.length
      ? await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('id', profileIds)
      : { count: 0, error: null };
    if (profileVerifyError) throw profileVerifyError;
    const remainingAuthUsers = await authUsersForEmails(supabase, emails);
    const contactsRemoved = token
      ? (
          await Promise.all(contactIds.map((contactId) => ghlContactIsRemoved(contactId, token)))
        ).every(Boolean)
      : contactIds.length === 0;
    const ok = remainingProfiles === 0 && remainingAuthUsers.length === 0 && contactsRemoved;

    return json({
      ok,
      matchedProfiles: profileIds.length,
      deletedProfiles: deletedProfiles?.length ?? 0,
      identityRemoved: remainingAuthUsers.length === 0,
      profileRemoved: remainingProfiles === 0,
      appointmentRemoved: true,
      ghlContactRemoved: contactsRemoved,
    });
  } catch (error) {
    return safeError(error);
  }
};
