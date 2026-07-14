import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertRateLimit, assertSameOrigin, clientKey, json, safeError } from '../../../lib/platform/security';

const Schema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  location: z.string().trim().min(1).max(200).optional(),
}).refine((value) => Boolean(value.firstName || value.location), 'At least one fact is required');

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`facts:${clientKey(context)}`, 20);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    const conversationId = context.cookies.get('mrx_conversation')?.value;
    if (!conversationId) return json({ ok: false, error: 'conversation_required' }, { status: 400 });
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: true, persisted: false });

    if (parsed.data.firstName) {
      const { error } = await supabase.from('profiles').upsert({
        conversation_id: conversationId,
        first_name: parsed.data.firstName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id' });
      if (error) throw error;
    }
    if (parsed.data.location) {
      const { error } = await supabase.from('owner_facts').upsert({
        conversation_id: conversationId,
        field: 'location',
        value: parsed.data.location,
        source: 'owner_chat',
        confidence: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id,field' });
      if (error) throw error;
    }
    return json({ ok: true, persisted: true });
  } catch (error) {
    return safeError(error);
  }
};
