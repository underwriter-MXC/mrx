import type { APIContext } from 'astro';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { sendGhlMemberAccessEmail, upsertContact } from './ghl';
import { getSupabasePublicConfig, getSupabaseServer } from './supabase';
import { runtimeIsProduction } from './runtime-env';
import { testOutboundSuppressed } from './test-access';
import { safeConsentSourceUrl } from './consent';
import type { ContactProfile } from './types';

const DEVICE_COOKIE = 'mrx_device';
const LEGACY_COOKIE = 'mrx_conversation';
const DEVICE_MAX_AGE = 60 * 60 * 24 * 365;
const DEVICE_UPLOAD_OWNER_EMAIL =
  'owner-intake-upload-placeholder@invalid.mineralrightsxchange.com';
let deviceUploadOwnerId: string | null = null;

export type OwnerSession = {
  conversationId: string;
  profileId: string;
  deviceHash: string;
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  persisted: boolean;
};

export type OwnerAccessMode = 'verified' | 'device';

type DeviceOwnerProfile = {
  first_name?: string | null;
  last_name?: string | null;
  normalized_email?: string | null;
  normalized_phone?: string | null;
};

export function hasDeviceOwnerProfile(profile: DeviceOwnerProfile | null | undefined) {
  return Boolean(
    profile?.first_name?.trim() &&
    profile?.last_name?.trim() &&
    profile?.normalized_email?.trim() &&
    profile?.normalized_phone?.trim(),
  );
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(data), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string, defaultCountry: 'US' | 'CA' = 'US') {
  const parsed = parsePhoneNumberFromString(value, defaultCountry);
  return parsed?.isValid() ? parsed.number : null;
}

export function ownerAccountRedirectTo(sourceUrl: string, candidate?: string | null) {
  const source = new URL(sourceUrl);
  const fallback = new URL('/account/', source).toString();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate, source);
    const canonicalOrigins = new Set([
      source.origin,
      'https://mineralrightsxchange.com',
      'https://www.mineralrightsxchange.com',
    ]);
    return canonicalOrigins.has(url.origin) && url.pathname.startsWith('/account/')
      ? url.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

export type MemberAccessResult = {
  status: 'active' | 'link_sent' | 'unavailable';
  linkSent: boolean;
  redirectTo: string | null;
};

export async function deliverMemberAccessLink(args: {
  profileId: string;
  email: string;
  sourceUrl: string;
  redirectTo?: string;
  ghlContactId?: string | null;
  firstName?: string | null;
  permissions?: Pick<ContactProfile['permissions'], 'email' | 'sms' | 'call' | 'aiVoice'>;
}): Promise<MemberAccessResult> {
  const supabase = getSupabaseServer();
  if (!supabase) return { status: 'unavailable', linkSent: false, redirectTo: null };
  const normalized = normalizeEmail(args.email);
  const redirectTo = ownerAccountRedirectTo(args.sourceUrl, args.redirectTo);
  const sourceUrl = safeConsentSourceUrl(args.sourceUrl || redirectTo);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name,last_name,phone,timezone,ghl_contact_id,is_test,test_run_id')
    .eq('id', args.profileId)
    .single();
  if (profileError) throw profileError;

  let contactId = args.ghlContactId || profile.ghl_contact_id || null;
  const firstName = args.firstName?.trim() || profile.first_name?.trim() || 'Mineral owner';
  if (testOutboundSuppressed(profile)) {
    await supabase.from('communication_dispatches').insert({
      profile_id: args.profileId,
      channel: 'email',
      purpose: 'account_access',
      provider: 'gohighlevel',
      destination_hash: await sha256(normalized),
      status: 'suppressed',
      requested_by: 'test',
      is_test: Boolean(profile.is_test),
      test_run_id: profile.test_run_id || null,
      attempted_at: null,
      completed_at: new Date().toISOString(),
      metadata: { reason: 'test_profile_outbound_suppressed', redirectTo, sourceUrl },
    });
    return { status: 'unavailable', linkSent: false, redirectTo };
  }

  const { data: generated, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: normalized,
    options: { redirectTo },
  });
  const actionLink = generated?.properties?.action_link;
  if (linkError || !actionLink) throw linkError || new Error('member_access_link_unavailable');

  if (!contactId) {
    contactId = await upsertContact(
      {
        firstName,
        lastName: profile.last_name || undefined,
        email: normalized,
        phone: profile.phone || undefined,
        timezone: profile.timezone || undefined,
        permissions: {
          email: args.permissions?.email ?? false,
          sms: args.permissions?.sms ?? false,
          marketingSms: false,
          call: args.permissions?.call ?? false,
          aiVoice: args.permissions?.aiVoice ?? false,
        },
        disclosureVersion: '2026-07-17-account-access',
        sourceUrl,
      },
      { syncOpportunity: false, allowTransactionalEmail: true },
    );
    if (!contactId) throw new Error('member_access_contact_unavailable');
    await supabase.from('profiles').update({ ghl_contact_id: contactId }).eq('id', args.profileId);
  }

  const disclosure =
    'MRX may email a one-time secure owner-account sign-in link to the address provided by the owner.';
  const { data: receipt, error: receiptError } = await supabase
    .from('consent_receipts')
    .insert({
      profile_id: args.profileId,
      channel: 'email',
      purpose: 'account_access',
      granted: true,
      disclosure_version: '2026-07-17-account-access',
      disclosure_text: disclosure,
      submitted_value: 'true',
      destination: normalized,
      source_url: sourceUrl,
    })
    .select('id')
    .single();
  if (receiptError) throw receiptError;

  try {
    const messageId = await sendGhlMemberAccessEmail({
      contactId,
      email: normalized,
      firstName,
      actionLink,
    });
    await supabase.from('communication_dispatches').insert({
      profile_id: args.profileId,
      consent_receipt_id: receipt.id,
      channel: 'email',
      purpose: 'account_access',
      provider: 'gohighlevel',
      external_id: messageId || null,
      destination_hash: await sha256(normalized),
      status: 'queued',
      requested_by: 'owner',
      attempted_at: new Date().toISOString(),
      completed_at: null,
      metadata: { redirectTo, providerStatus: 'pending' },
    });
  } catch (error) {
    await supabase.from('communication_dispatches').insert({
      profile_id: args.profileId,
      consent_receipt_id: receipt.id,
      channel: 'email',
      purpose: 'account_access',
      provider: 'gohighlevel',
      destination_hash: await sha256(normalized),
      status: 'failed',
      error_code: 'provider_delivery_failed',
      requested_by: 'owner',
      attempted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: { redirectTo },
    });
    throw error;
  }
  return { status: 'link_sent', linkSent: true, redirectTo };
}

export async function provisionAppointmentMemberAccess(args: {
  profileId: string;
  email: string;
  sourceUrl: string;
  authenticatedEmail?: string | null;
  emailVerified?: boolean;
  ghlContactId?: string | null;
  firstName?: string | null;
}): Promise<MemberAccessResult> {
  const supabase = getSupabaseServer();
  const normalized = normalizeEmail(args.email);
  const redirectTo = new URL('/account/?welcome=appointment', args.sourceUrl).toString();
  if (!supabase) return { status: 'unavailable', linkSent: false, redirectTo: null };

  const verifiedCurrentOwner =
    Boolean(args.emailVerified) && normalizeEmail(args.authenticatedEmail || '') === normalized;
  const now = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      email: args.email.trim(),
      normalized_email: normalized,
      ...(verifiedCurrentOwner ? { email_verified_at: now } : {}),
      last_seen_at: now,
    })
    .eq('id', args.profileId);
  if (profileError) throw profileError;

  const { data: existingIdentifier, error: existingIdentifierError } = await supabase
    .from('profile_identifiers')
    .select('verified_at')
    .eq('profile_id', args.profileId)
    .eq('kind', 'email')
    .eq('normalized_value', normalized)
    .maybeSingle();
  if (existingIdentifierError) throw existingIdentifierError;

  const { error: identifierError } = await supabase.from('profile_identifiers').upsert(
    {
      profile_id: args.profileId,
      kind: 'email',
      normalized_value: normalized,
      display_value: args.email.trim(),
      verified_at: verifiedCurrentOwner ? now : (existingIdentifier?.verified_at ?? null),
      is_primary: true,
    },
    { onConflict: 'profile_id,kind,normalized_value' },
  );
  if (identifierError) throw identifierError;

  if (verifiedCurrentOwner) {
    await supabase.from('audit_events').insert({
      profile_id: args.profileId,
      event_type: 'appointment_member_access_active',
      target_type: 'profile',
      target_id: args.profileId,
      metadata: { email: normalized },
    });
    return { status: 'active', linkSent: false, redirectTo };
  }

  let delivery: MemberAccessResult;
  try {
    delivery = await deliverMemberAccessLink({
      profileId: args.profileId,
      email: normalized,
      sourceUrl: args.sourceUrl,
      redirectTo,
      ghlContactId: args.ghlContactId,
      firstName: args.firstName,
    });
  } catch {
    delivery = { status: 'unavailable', linkSent: false, redirectTo: null };
  }
  await supabase.from('audit_events').insert({
    profile_id: args.profileId,
    event_type: delivery.linkSent
      ? 'appointment_member_access_link_sent'
      : 'appointment_member_access_link_failed',
    target_type: 'profile',
    target_id: args.profileId,
    metadata: { email: normalized, redirectTo, provider: 'gohighlevel' },
  });
  return delivery;
}

function getOrCreateDeviceToken(context: APIContext) {
  let token = context.cookies.get(DEVICE_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    token = randomToken();
    context.cookies.set(DEVICE_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: runtimeIsProduction(),
      path: '/',
      maxAge: DEVICE_MAX_AGE,
    });
  }
  context.cookies.delete(LEGACY_COOKIE, { path: '/' });
  return token;
}

export async function authenticatedOwner(request: Request) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return null;
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${bearer}`, apikey: config.anonKey },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as {
    id?: string;
    email?: string;
    email_confirmed_at?: string;
  };
  return user.id && user.email_confirmed_at
    ? {
        id: user.id,
        email: user.email ?? '',
        emailVerifiedAt: user.email_confirmed_at,
      }
    : null;
}

async function createAnonymousSession(deviceHash: string) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      conversationId: crypto.randomUUID(),
      profileId: crypto.randomUUID(),
    };
  }
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({ anonymous_session_hash: deviceHash })
    .select('id')
    .single();
  if (conversationError) throw conversationError;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({ conversation_id: conversation.id })
    .select('id')
    .single();
  if (profileError) throw profileError;
  const { error: linkError } = await supabase
    .from('conversations')
    .update({ profile_id: profile.id })
    .eq('id', conversation.id);
  if (linkError) throw linkError;
  const { error: deviceError } = await supabase.from('device_sessions').upsert(
    {
      token_hash: deviceHash,
      active_conversation_id: conversation.id,
      user_id: null,
      expires_at: new Date(Date.now() + DEVICE_MAX_AGE * 1_000).toISOString(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'token_hash' },
  );
  if (deviceError) throw deviceError;
  return { conversationId: conversation.id as string, profileId: profile.id as string };
}

function syntheticUuid(seed: string) {
  const hex = seed.slice(0, 32).padEnd(32, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function resolveOwnerSession(context: APIContext): Promise<OwnerSession> {
  const token = getOrCreateDeviceToken(context);
  const deviceHash = await sha256(token);
  const authenticated = await authenticatedOwner(context.request);
  const supabase = getSupabaseServer();
  if (!supabase) {
    const synthetic = await createAnonymousSession(deviceHash);
    return {
      ...synthetic,
      deviceHash,
      userId: authenticated?.id ?? null,
      email: authenticated?.email ?? null,
      emailVerified: Boolean(authenticated),
      persisted: false,
    };
  }

  const { data: device, error: deviceLookupError } = await supabase
    .from('device_sessions')
    .select('id,active_conversation_id,user_id,expires_at')
    .eq('token_hash', deviceHash)
    .maybeSingle();
  if (deviceLookupError?.code === 'PGRST205') {
    return {
      conversationId: syntheticUuid(deviceHash),
      profileId: syntheticUuid(await sha256(`${deviceHash}:profile`)),
      deviceHash,
      userId: authenticated?.id ?? null,
      email: authenticated?.email ?? null,
      emailVerified: Boolean(authenticated),
      persisted: false,
    };
  }
  if (deviceLookupError) throw deviceLookupError;

  let conversationId = device?.active_conversation_id as string | null;
  let profileId: string | null = null;
  let conversationUserId: string | null = null;
  if (conversationId) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id,profile_id,user_id,status')
      .eq('id', conversationId)
      .maybeSingle();
    if (
      !conversation ||
      conversation.status === 'deleted' ||
      (conversation.user_id && conversation.user_id !== authenticated?.id)
    ) {
      conversationId = null;
    } else {
      profileId = conversation.profile_id as string | null;
      conversationUserId = conversation.user_id as string | null;
    }
  }

  if (authenticated && conversationId && !conversationUserId) {
    const normalized = normalizeEmail(authenticated.email);
    const { data, error } = await supabase.rpc('claim_owner_conversation', {
      target_conversation_id: conversationId,
      target_user_id: authenticated.id,
      verified_email: authenticated.email,
      normalized_verified_email: normalized,
      target_device_hash: deviceHash,
    });
    if (error) throw error;
    profileId = data as string;
    conversationUserId = authenticated.id;
    const { error: attachmentClaimError } = await supabase
      .from('attachments')
      .update({ user_id: authenticated.id })
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId)
      .neq('user_id', authenticated.id);
    if (attachmentClaimError) throw attachmentClaimError;
  }

  if (authenticated && !conversationId) {
    const { data: latest } = await supabase
      .from('conversations')
      .select('id,profile_id')
      .eq('user_id', authenticated.id)
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) {
      conversationId = latest.id as string;
      profileId = latest.profile_id as string;
      conversationUserId = authenticated.id;
    }
  }

  if (!conversationId || !profileId) {
    const created = await createAnonymousSession(deviceHash);
    conversationId = created.conversationId;
    profileId = created.profileId;
    if (authenticated) {
      const normalized = normalizeEmail(authenticated.email);
      const { data, error } = await supabase.rpc('claim_owner_conversation', {
        target_conversation_id: conversationId,
        target_user_id: authenticated.id,
        verified_email: authenticated.email,
        normalized_verified_email: normalized,
        target_device_hash: deviceHash,
      });
      if (error) throw error;
      profileId = data as string;
      conversationUserId = authenticated.id;
      const { error: attachmentClaimError } = await supabase
        .from('attachments')
        .update({ user_id: authenticated.id })
        .eq('conversation_id', conversationId)
        .eq('profile_id', profileId)
        .neq('user_id', authenticated.id);
      if (attachmentClaimError) throw attachmentClaimError;
    }
  } else {
    await supabase.from('device_sessions').upsert(
      {
        token_hash: deviceHash,
        active_conversation_id: conversationId,
        user_id: conversationUserId,
        expires_at: new Date(Date.now() + DEVICE_MAX_AGE * 1_000).toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token_hash' },
    );
  }

  return {
    conversationId,
    profileId,
    deviceHash,
    userId: conversationUserId,
    email: authenticated?.email ?? null,
    emailVerified: Boolean(authenticated),
    persisted: true,
  };
}

export async function requireVerifiedOwner(context: APIContext) {
  const session = await resolveOwnerSession(context);
  if (!session.userId || !session.emailVerified) {
    throw new Response('Verified email required', { status: 401 });
  }
  if (!session.persisted) throw new Response('Owner database unavailable', { status: 503 });
  return { ...session, userId: session.userId } as OwnerSession & {
    userId: string;
    emailVerified: true;
  };
}

/**
 * Allows a completed signup to continue on the same browser before the email
 * link is opened. The device cookie is a 256-bit HttpOnly bearer credential,
 * stored server-side only as a hash and mapped to exactly one open profile.
 */
export async function requireOwnerProfileAccess(context: APIContext) {
  const session = await resolveOwnerSession(context);
  if (!session.persisted) throw new Response('Owner database unavailable', { status: 503 });
  if (session.userId && session.emailVerified) {
    return { ...session, accessMode: 'verified' as const };
  }
  const supabase = getSupabaseServer();
  if (!supabase) throw new Response('Owner database unavailable', { status: 503 });
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name,last_name,normalized_email,normalized_phone')
    .eq('id', session.profileId)
    .eq('conversation_id', session.conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!hasDeviceOwnerProfile(profile)) {
    throw new Response('Completed owner signup required', { status: 401 });
  }
  return { ...session, accessMode: 'device' as const };
}

/**
 * attachments.user_id predates same-device intake and is intentionally NOT
 * nullable. Until email claim, records use a banned, server-owned auth subject;
 * resolveOwnerSession reassigns them to the verified owner during claim.
 */
export async function ownerAttachmentUserId(session: OwnerSession) {
  if (session.userId && session.emailVerified) return session.userId;
  if (deviceUploadOwnerId) return deviceUploadOwnerId;
  const supabase = getSupabaseServer();
  if (!supabase) throw new Response('Owner database unavailable', { status: 503 });

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1_000 });
    if (error) throw error;
    const existing = data.users.find(
      (user) => normalizeEmail(user.email || '') === DEVICE_UPLOAD_OWNER_EMAIL,
    );
    if (existing) {
      if (!existing.banned_until || new Date(existing.banned_until).getTime() < Date.now()) {
        const { error: banError } = await supabase.auth.admin.updateUserById(existing.id, {
          ban_duration: '876000h',
        });
        if (banError) throw banError;
      }
      deviceUploadOwnerId = existing.id;
      return existing.id;
    }
    if (data.users.length < 1_000) break;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEVICE_UPLOAD_OWNER_EMAIL,
    password: randomToken(),
    email_confirm: false,
    user_metadata: { systemRole: 'unverified_owner_intake_uploads' },
  });
  if (error || !data.user) throw error || new Error('device_upload_owner_unavailable');
  const { error: banError } = await supabase.auth.admin.updateUserById(data.user.id, {
    ban_duration: '876000h',
  });
  if (banError) {
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    throw banError;
  }
  deviceUploadOwnerId = data.user.id;
  return data.user.id;
}
