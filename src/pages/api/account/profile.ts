import type { APIRoute } from 'astro';
import { z } from 'zod';
import { normalizePhone, requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  persistGeographyResolution,
  publicGeography,
  resolveUSGeography,
} from '../../../lib/platform/geography';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const Schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).nullable().optional(),
  residenceLocation: z.string().trim().max(500).nullable().optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`account-profile:${clientKey(context)}`, 20, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_profile' }, { status: 400 });
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const normalizedPhone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
    if (parsed.data.phone && !normalizedPhone) {
      return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('normalized_phone')
      .eq('id', session.profileId)
      .single();
    if (currentProfileError) throw currentProfileError;
    const phoneChanged = currentProfile.normalized_phone !== normalizedPhone;
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        phone: parsed.data.phone || null,
        normalized_phone: normalizedPhone,
        ...(phoneChanged ? { phone_verified_at: null } : {}),
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', session.profileId);
    if (error) throw error;
    if (phoneChanged) {
      const { error: oldIdentifierError } = await supabase
        .from('profile_identifiers')
        .delete()
        .eq('profile_id', session.profileId)
        .eq('kind', 'phone');
      if (oldIdentifierError) throw oldIdentifierError;
    }
    if (normalizedPhone) {
      const { error: identifierError } = await supabase.from('profile_identifiers').upsert(
        {
          profile_id: session.profileId,
          kind: 'phone',
          normalized_value: normalizedPhone,
          display_value: parsed.data.phone,
          verified_at: null,
          is_primary: true,
        },
        { onConflict: 'profile_id,kind,normalized_value' },
      );
      if (identifierError) throw identifierError;
    }

    let geography = null;
    if (parsed.data.residenceLocation) {
      geography = await resolveUSGeography(parsed.data.residenceLocation, {
        scope: 'residence',
        mode: 'profile',
      });
      if (geography && geography.status !== 'not_found') {
        await persistGeographyResolution({
          conversationId: session.conversationId,
          profileId: session.profileId,
          resolution: geography,
        });
      }
    }
    try {
      await syncVerifiedOwnerToGhl(session.profileId);
    } catch (syncError) {
      console.error(
        '[GHL profile sync]',
        syncError instanceof Error ? syncError.message : 'failed',
      );
    }
    return json({
      ok: true,
      geography: geography ? publicGeography(geography) : null,
    });
  } catch (error) {
    return safeError(error);
  }
};
