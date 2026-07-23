import type { APIRoute } from 'astro';
import { z } from 'zod';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';
import {
  explicitNonProductionTestGhlSyncAllowed,
  stagingTestAccessAllowed,
} from '../../../lib/platform/test-access';

const Schema = z.object({ runId: z.string().uuid(), profileId: z.string().uuid().optional() });

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

export const POST: APIRoute = async (context) => {
  try {
    if (!stagingTestAccessAllowed(context.request))
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    if (!explicitNonProductionTestGhlSyncAllowed())
      return json({ ok: false, error: 'test_crm_sync_disabled' }, { status: 409 });
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_test_run' }, { status: 400 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const session = parsed.data.profileId ? null : await resolveOwnerSession(context);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,is_test,test_run_id')
      .eq('id', parsed.data.profileId || session!.profileId)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.is_test || profile.test_run_id !== parsed.data.runId) {
      return json({ ok: false, error: 'test_owner_mismatch' }, { status: 403 });
    }
    const contactId = await syncVerifiedOwnerToGhl(profile.id);
    return json({ ok: true, synced: Boolean(contactId), contactId: contactId || null });
  } catch (error) {
    return safeError(error);
  }
};
