import type { APIRoute } from 'astro';
import { z } from 'zod';
import { deliverMemberAccessLink, normalizeEmail } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const Schema = z.object({ email: z.string().email().max(320) });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`account-link:${clientKey(context)}`, 5, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_email' }, { status: 400 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'account_unavailable' }, { status: 503 });
    const normalized = normalizeEmail(parsed.data.email);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,first_name,ghl_contact_id')
      .eq('normalized_email', normalized)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (profile) {
      try {
        await deliverMemberAccessLink({
          profileId: profile.id,
          email: normalized,
          sourceUrl: new URL('/account/', context.request.url).toString(),
          redirectTo: new URL('/account/', context.request.url).toString(),
          ghlContactId: profile.ghl_contact_id,
          firstName: profile.first_name,
        });
      } catch (deliveryError) {
        console.error(
          '[MRX account link]',
          deliveryError instanceof Error ? deliveryError.message : 'delivery_failed',
        );
      }
    }
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
