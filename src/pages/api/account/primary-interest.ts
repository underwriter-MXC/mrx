import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../lib/platform/security';

const Schema = z.object({ interestId: z.string().uuid() });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_interest' }, { status: 400 });
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const { count, error: interestError } = await supabase
      .from('mineral_interests')
      .select('*', { count: 'exact', head: true })
      .eq('id', parsed.data.interestId)
      .eq('profile_id', session.profileId)
      .neq('status', 'archived');
    if (interestError) throw interestError;
    if (count !== 1) return json({ ok: false, error: 'interest_not_found' }, { status: 404 });
    const { error } = await supabase
      .from('profiles')
      .update({
        primary_mineral_interest_id: parsed.data.interestId,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', session.profileId);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
