import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  deliverMemberAccessLink,
  normalizeEmail,
  normalizePhone,
  ownerAccountRedirectTo,
  resolveOwnerSession,
} from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const IdentitySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('name'),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal('email'),
    email: z.string().email().max(320),
    redirectTo: z.string().url().max(1_000),
    accountSignup: z.boolean().optional(),
    fullName: z.string().trim().min(2).max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    sourceUrl: z.string().url().max(1_000).optional(),
    permissions: z
      .object({
        email: z.boolean(),
        sms: z.boolean(),
        call: z.boolean(),
        aiVoice: z.boolean(),
      })
      .optional(),
  }),
  z.object({ action: z.literal('phone'), phone: z.string().max(40).nullable() }),
]);

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`identity:${clientKey(context)}`, 10, 10 * 60_000);
    const parsed = IdentitySchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_identity' }, { status: 400 });
    const session = await resolveOwnerSession(context);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'persistence_unavailable' }, { status: 503 });

    if (parsed.data.action === 'name') {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: parsed.data.firstName.trim(),
          last_name: parsed.data.lastName.trim(),
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', session.profileId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (parsed.data.action === 'email') {
      const accountSignup =
        parsed.data.accountSignup === true ||
        typeof parsed.data.fullName !== 'undefined' ||
        typeof parsed.data.phone !== 'undefined';
      if (accountSignup && !parsed.data.fullName) {
        return json({ ok: false, error: 'invalid_full_name' }, { status: 400 });
      }
      if (accountSignup && !parsed.data.phone) {
        return json({ ok: false, error: 'phone_required' }, { status: 400 });
      }
      const normalized = normalizeEmail(parsed.data.email);
      const normalizedPhone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
      if (parsed.data.phone && !normalizedPhone) {
        return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
      }
      const nameParts = parsed.data.fullName?.split(/\s+/).filter(Boolean) ?? [];
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      if (parsed.data.fullName && (!firstName || !lastName)) {
        return json({ ok: false, error: 'invalid_full_name' }, { status: 400 });
      }
      const verifiedMatchesSession =
        session.emailVerified && normalizeEmail(session.email || '') === normalized;
      const redirectTo = ownerAccountRedirectTo(
        new URL('/account/', context.request.url).toString(),
        parsed.data.redirectTo,
      );
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          email: parsed.data.email.trim(),
          normalized_email: normalized,
          ...(parsed.data.phone
            ? { phone: parsed.data.phone.trim(), normalized_phone: normalizedPhone }
            : {}),
          ...(!verifiedMatchesSession ? { email_verified_at: null } : {}),
          ...(parsed.data.phone ? { phone_verified_at: null } : {}),
        })
        .eq('id', session.profileId);
      if (profileError) throw profileError;
      const { error: staleIdentifierError } = await supabase
        .from('profile_identifiers')
        .delete()
        .eq('profile_id', session.profileId)
        .eq('kind', 'email')
        .is('verified_at', null);
      if (staleIdentifierError) throw staleIdentifierError;
      const { error: identifierError } = await supabase.from('profile_identifiers').upsert(
        {
          profile_id: session.profileId,
          kind: 'email',
          normalized_value: normalized,
          display_value: parsed.data.email.trim(),
          verified_at: verifiedMatchesSession ? new Date().toISOString() : null,
          is_primary: true,
        },
        { onConflict: 'profile_id,kind,normalized_value' },
      );
      if (identifierError) throw identifierError;
      if (normalizedPhone) {
        const { error: stalePhoneError } = await supabase
          .from('profile_identifiers')
          .delete()
          .eq('profile_id', session.profileId)
          .eq('kind', 'phone');
        if (stalePhoneError) throw stalePhoneError;
        const { error: phoneIdentifierError } = await supabase.from('profile_identifiers').upsert(
          {
            profile_id: session.profileId,
            kind: 'phone',
            normalized_value: normalizedPhone,
            display_value: parsed.data.phone?.trim(),
            verified_at: null,
            is_primary: true,
          },
          { onConflict: 'profile_id,kind,normalized_value' },
        );
        if (phoneIdentifierError) throw phoneIdentifierError;
      }
      // Identity capture and the transactional return-access email do not grant
      // requested-update permission. Cached older clients may still submit a
      // permissions object, so accept it in the schema but deliberately ignore it.
      const requestedPermissions = {
        email: false,
        sms: false,
        call: false,
        aiVoice: false,
      };
      const sourceUrl = parsed.data.sourceUrl || redirectTo;
      try {
        await deliverMemberAccessLink({
          profileId: session.profileId,
          email: normalized,
          sourceUrl,
          redirectTo,
          permissions: requestedPermissions,
        });
      } catch (error) {
        console.error(
          '[MRX member access]',
          error instanceof Error ? error.message : 'verification_delivery_failed',
        );
        return json({
          ok: true,
          deviceAccess: true,
          verificationSent: false,
          verificationStatus: 'unavailable',
        });
      }
      return json({
        ok: true,
        deviceAccess: true,
        verificationSent: true,
        verificationStatus: 'queued',
      });
    }

    const normalized = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
    if (parsed.data.phone && !normalized) {
      return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('normalized_phone')
      .eq('id', session.profileId)
      .single();
    if (currentProfileError) throw currentProfileError;
    const phoneChanged = currentProfile.normalized_phone !== normalized;
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: parsed.data.phone?.trim() || null,
        normalized_phone: normalized,
        ...(phoneChanged ? { phone_verified_at: null } : {}),
      })
      .eq('id', session.profileId);
    if (error) throw error;
    if (phoneChanged) {
      const { error: staleIdentifierError } = await supabase
        .from('profile_identifiers')
        .delete()
        .eq('profile_id', session.profileId)
        .eq('kind', 'phone');
      if (staleIdentifierError) throw staleIdentifierError;
    }
    if (normalized) {
      await supabase.from('profile_identifiers').upsert(
        {
          profile_id: session.profileId,
          kind: 'phone',
          normalized_value: normalized,
          display_value: parsed.data.phone,
          verified_at: null,
          is_primary: true,
        },
        { onConflict: 'profile_id,kind,normalized_value' },
      );
    }
    return json({ ok: true, phoneSaved: Boolean(normalized) });
  } catch (error) {
    return safeError(error);
  }
};
