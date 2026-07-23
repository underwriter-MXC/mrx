import type { APIRoute } from 'astro';
import { syncGhlCallTranscriptEvent } from '../../../lib/platform/crm';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { runtimeEnv } from '../../../lib/platform/runtime-env';
import { json, safeError } from '../../../lib/platform/security';

export const GET: APIRoute = async (context) => {
  try {
    const secret = runtimeEnv('CRON_SECRET') || runtimeEnv('MAINTENANCE_CRON_SECRET');
    const authorization = context.request.headers.get('authorization');
    if (!secret || authorization !== `Bearer ${secret}`) {
      return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });
    const { data, error } = await supabase.rpc('purge_abandoned_anonymous_data', {
      retention_days: 30,
    });
    if (error) throw error;
    const { data: pendingProfiles, error: pendingProfileError } = await supabase
      .from('profiles')
      .select('id,user_id,pending_deletion_at')
      .not('pending_deletion_at', 'is', null)
      .lte('pending_deletion_at', new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString())
      .limit(100);
    if (pendingProfileError) throw pendingProfileError;
    let accountsDeleted = 0;
    for (const profile of pendingProfiles ?? []) {
      if (!profile.user_id) continue;
      await supabase.from('audit_events').insert({
        actor_user_id: profile.user_id,
        profile_id: profile.id,
        event_type: 'account_deletion_completed',
        target_type: 'profile',
        target_id: profile.id,
        metadata: { source: 'retention_cron', pendingDeletionAt: profile.pending_deletion_at },
      });
      const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (deleteError) throw deleteError;
      accountsDeleted += 1;
    }
    const { data: pendingEvents, error: pendingError } = await supabase
      .from('crm_sync_events')
      .select('external_event_id,payload')
      .eq('provider', 'ghl')
      .eq('error_code', 'transcript_pending')
      .is('processed_at', null)
      .order('created_at', { ascending: true })
      .limit(100);
    if (pendingError) throw pendingError;
    let transcriptsSynced = 0;
    let transcriptsPending = 0;
    for (const pendingEvent of pendingEvents ?? []) {
      const result = await syncGhlCallTranscriptEvent(supabase, pendingEvent.payload);
      const synced = result.status !== 'pending';
      await supabase
        .from('crm_sync_events')
        .update({
          processed_at: synced ? new Date().toISOString() : null,
          error_code: synced ? null : 'transcript_pending',
        })
        .eq('provider', 'ghl')
        .eq('external_event_id', pendingEvent.external_event_id);
      if (synced) transcriptsSynced += 1;
      else transcriptsPending += 1;
    }
    return json({
      ok: true,
      conversationsDeleted: data,
      accountsDeleted,
      transcriptsSynced,
      transcriptsPending,
    });
  } catch (error) {
    return safeError(error);
  }
};
