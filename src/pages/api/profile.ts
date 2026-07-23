import type { APIRoute } from 'astro';
import { z } from 'zod';
import { upsertContact, ghlConfigured } from '../../lib/platform/ghl';
import { testOutboundSuppressionForProfile } from '../../lib/platform/communications';
import { getSupabaseServer } from '../../lib/platform/supabase';
import { consentRows, CONSENT_VERSION } from '../../lib/platform/consent';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../lib/platform/security';
import { normalizeEmail, normalizePhone, resolveOwnerSession } from '../../lib/platform/identity';

const Schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  timezone: z.string().max(80).optional(),
  permissions: z.object({
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    marketingSms: z.boolean().default(false),
    call: z.boolean().default(false),
    aiVoice: z.boolean().default(false),
  }),
  disclosureVersion: z.string().max(40).default(CONSENT_VERSION),
  sourceUrl: z.string().url().max(500),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`profile:${clientKey(context)}`, 8);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json(
        { ok: false, error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    const session = await resolveOwnerSession(context);
    const profile = parsed.data;
    const normalizedEmail = normalizeEmail(profile.email);
    const normalizedPhone = profile.phone ? normalizePhone(profile.phone) : null;
    const verifiedEmailMatchesSession =
      session.emailVerified && normalizeEmail(session.email || '') === normalizedEmail;
    if (profile.phone && !normalizedPhone) {
      return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('normalized_phone')
        .eq('id', session.profileId)
        .single();
      if (currentProfileError) throw currentProfileError;
      const phoneChanged = currentProfile.normalized_phone !== normalizedPhone;
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          normalized_email: normalizedEmail,
          phone: profile.phone,
          normalized_phone: normalizedPhone,
          ...(!verifiedEmailMatchesSession ? { email_verified_at: null } : {}),
          ...(phoneChanged ? { phone_verified_at: null } : {}),
          timezone: profile.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.profileId)
        .select('id')
        .single();
      if (error) throw error;
      const { error: staleEmailError } = await supabase
        .from('profile_identifiers')
        .delete()
        .eq('profile_id', data.id)
        .eq('kind', 'email')
        .is('verified_at', null);
      if (staleEmailError) throw staleEmailError;
      if (phoneChanged) {
        const { error: stalePhoneError } = await supabase
          .from('profile_identifiers')
          .delete()
          .eq('profile_id', data.id)
          .eq('kind', 'phone');
        if (stalePhoneError) throw stalePhoneError;
      }
      const identifiers = [
        {
          profile_id: data.id,
          kind: 'email',
          normalized_value: normalizedEmail,
          display_value: profile.email,
          verified_at: verifiedEmailMatchesSession ? new Date().toISOString() : null,
          is_primary: true,
        },
        ...(normalizedPhone
          ? [
              {
                profile_id: data.id,
                kind: 'phone',
                normalized_value: normalizedPhone,
                display_value: profile.phone,
                verified_at: null,
                is_primary: true,
              },
            ]
          : []),
      ];
      const { error: identifierError } = await supabase
        .from('profile_identifiers')
        .upsert(identifiers, { onConflict: 'profile_id,kind,normalized_value' });
      if (identifierError) throw identifierError;
      const { error: consentError } = await supabase
        .from('consent_receipts')
        .insert(consentRows(data.id, profile, { purpose: 'profile_preferences' }));
      if (consentError) throw consentError;
    }
    let ghlContactId: string | null = null;
    const testState = await testOutboundSuppressionForProfile(session.profileId);
    if (ghlConfigured() && !testState.suppressed) ghlContactId = await upsertContact(profile);
    return json({ ok: true, ghlContactId });
  } catch (error) {
    return safeError(error);
  }
};
