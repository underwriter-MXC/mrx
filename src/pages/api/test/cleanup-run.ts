import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';
import { stagingTestAccessAllowed } from '../../../lib/platform/test-access';

const Schema = z.object({ runId: z.string().uuid() });

export const GET: APIRoute = async () => json({ ok: false, error: 'not_found' }, { status: 404 });

export const POST: APIRoute = async (context) => {
  try {
    if (!stagingTestAccessAllowed(context.request))
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_test_run' }, { status: 400 });

    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'database_unavailable' }, { status: 503 });

    const runId = parsed.data.runId;
    const { data: profilesForStorage, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_test', true)
      .eq('test_run_id', runId);
    if (profileLookupError) throw profileLookupError;
    const profileIds = (profilesForStorage ?? []).map((profile) => profile.id);
    const { data: attachments, error: attachmentLookupError } = profileIds.length
      ? await supabase.from('attachments').select('storage_path').in('profile_id', profileIds)
      : { data: [], error: null };
    if (attachmentLookupError) throw attachmentLookupError;
    const storagePaths = (attachments ?? [])
      .map((attachment) => attachment.storage_path)
      .filter((path): path is string => Boolean(path));
    if (storagePaths.length) {
      const { error: storageError } = await supabase.storage
        .from('owner-documents')
        .remove(storagePaths);
      if (storageError) throw storageError;
    }
    const { data: conversations, error: conversationLookupError } = await supabase
      .from('conversations')
      .select('id')
      .eq('is_test', true)
      .eq('test_run_id', runId);
    if (conversationLookupError) throw conversationLookupError;

    const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
    if (conversationIds.length) {
      const { error: deviceSessionError } = await supabase
        .from('device_sessions')
        .delete()
        .in('active_conversation_id', conversationIds);
      if (deviceSessionError) throw deviceSessionError;
    }

    const { error: conversationDeleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('is_test', true)
      .eq('test_run_id', runId);
    if (conversationDeleteError) throw conversationDeleteError;

    const { data: profiles, error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('is_test', true)
      .eq('test_run_id', runId)
      .select('id');
    if (profileDeleteError) throw profileDeleteError;

    return json({
      ok: true,
      runId,
      removedStorageObjects: storagePaths.length,
      deletedConversations: conversationIds.length,
      deletedProfiles: profiles?.length ?? 0,
    });
  } catch (error) {
    return safeError(error);
  }
};
