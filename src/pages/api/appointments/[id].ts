import type { APIRoute } from 'astro';
import { z } from 'zod';
import { cancelAppointment, rescheduleAppointment } from '../../../lib/platform/ghl';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertRateLimit, assertSameOrigin, clientKey, json, safeError } from '../../../lib/platform/security';

async function ownedAppointment(id: string, conversationId?: string) {
  const supabase = getSupabaseServer();
  if (!supabase || !conversationId) return null;
  const { data } = await supabase.from('appointments').select('*').eq('id', id).eq('conversation_id', conversationId).single();
  return data;
}

export const PATCH: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`appointment-update:${clientKey(context)}`, 5, 10 * 60_000);
    const record = await ownedAppointment(context.params.id!, context.cookies.get('mrx_conversation')?.value);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const schema = z.object({ option: z.object({ id: z.string(), start: z.string().datetime(), end: z.string().datetime(), label: z.string(), timezone: z.string() }) });
    const parsed = schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    await rescheduleAppointment(record.ghl_appointment_id, parsed.data.option);
    const supabase = getSupabaseServer()!;
    await supabase.from('appointments').update({ starts_at: parsed.data.option.start, ends_at: parsed.data.option.end, timezone: parsed.data.option.timezone, status: 'confirmed' }).eq('id', record.id);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const record = await ownedAppointment(context.params.id!, context.cookies.get('mrx_conversation')?.value);
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    await cancelAppointment(record.ghl_appointment_id);
    const supabase = getSupabaseServer()!;
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', record.id);
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
