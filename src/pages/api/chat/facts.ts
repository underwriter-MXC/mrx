import type { APIRoute } from 'astro';
import { z } from 'zod';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const IntroSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    location: z.string().trim().min(1).max(200).optional(),
  })
  .refine((value) => Boolean(value.firstName || value.lastName || value.location));

const FactActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), factId: z.string().uuid() }),
  z.object({ action: z.literal('reject'), factId: z.string().uuid() }),
  z.object({ action: z.literal('correct'), factId: z.string().uuid(), value: z.unknown() }),
]);

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`facts:${clientKey(context)}`, 30);
    const raw = await context.request.json();
    const session = await resolveOwnerSession(context);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: true, persisted: false });

    const action = FactActionSchema.safeParse(raw);
    if (action.success) {
      const { data: current } = await supabase
        .from('owner_facts')
        .select('*')
        .eq('id', action.data.factId)
        .eq('profile_id', session.profileId)
        .single();
      if (!current) return json({ ok: false, error: 'fact_not_found' }, { status: 404 });
      if (action.data.action === 'correct') {
        const { data: replacement, error } = await supabase
          .from('owner_facts')
          .insert({
            conversation_id: session.conversationId,
            profile_id: session.profileId,
            mineral_interest_id: current.mineral_interest_id,
            field: current.field,
            value: action.data.value,
            source: 'owner_profile',
            confidence: 1,
            status: 'confirmed',
            supersedes_id: current.id,
            confirmed_at: new Date().toISOString(),
            corrected_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) throw error;
        await supabase
          .from('owner_facts')
          .update({ status: 'superseded', corrected_at: new Date().toISOString() })
          .eq('id', current.id);
        return json({ ok: true, factId: replacement.id });
      }
      const status = action.data.action === 'confirm' ? 'confirmed' : 'rejected';
      const { error } = await supabase
        .from('owner_facts')
        .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null })
        .eq('id', current.id);
      if (error) throw error;
      return json({ ok: true });
    }

    const parsed = IntroSchema.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    if (parsed.data.firstName || parsed.data.lastName) {
      const update: Record<string, string> = {};
      if (parsed.data.firstName) update.first_name = parsed.data.firstName;
      if (parsed.data.lastName) update.last_name = parsed.data.lastName;
      const { error } = await supabase.from('profiles').update(update).eq('id', session.profileId);
      if (error) throw error;
    }
    if (parsed.data.location) {
      const { error } = await supabase.from('owner_facts').insert({
        conversation_id: session.conversationId,
        profile_id: session.profileId,
        field: 'mineral_location',
        value: parsed.data.location,
        source: 'owner_chat',
        confidence: 1,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return json({ ok: true, persisted: true });
  } catch (error) {
    return safeError(error);
  }
};
