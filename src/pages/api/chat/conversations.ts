import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireVerifiedOwner } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../lib/platform/security';

const Schema = z.object({ conversationId: z.string().uuid() });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_conversation' }, { status: 400 });
    const session = await requireVerifiedOwner(context);
    const supabase = getSupabaseServer()!;
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', parsed.data.conversationId)
      .eq('user_id', session.userId)
      .neq('status', 'deleted')
      .single();
    if (!conversation) return json({ ok: false, error: 'not_found' }, { status: 404 });
    await supabase
      .from('device_sessions')
      .update({ active_conversation_id: conversation.id, last_seen_at: new Date().toISOString() })
      .eq('token_hash', session.deviceHash)
      .eq('user_id', session.userId);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
