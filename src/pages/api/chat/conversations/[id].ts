import type { APIRoute } from 'astro';
import { requireVerifiedOwner } from '../../../../lib/platform/identity';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../../lib/platform/security';

export const DELETE: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const session = await requireVerifiedOwner(context);
    const supabase = getSupabaseServer()!;
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', context.params.id!)
      .eq('user_id', session.userId)
      .single();
    if (!conversation) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const { data: attachments } = await supabase
      .from('attachments')
      .select('storage_path')
      .eq('conversation_id', conversation.id)
      .neq('status', 'deleted');
    if (attachments?.length) {
      await supabase.storage
        .from('owner-documents')
        .remove(attachments.map((item) => item.storage_path));
    }
    const { error } = await supabase.from('conversations').delete().eq('id', conversation.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
