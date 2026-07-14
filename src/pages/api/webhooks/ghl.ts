import type { APIRoute } from 'astro';
import { verifyGhlSignature } from '../../../lib/platform/ghl';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    if (!(await verifyGhlSignature(request, rawBody))) return json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    const event = JSON.parse(rawBody);
    const eventId = event.id || request.headers.get('x-webhook-id') || crypto.randomUUID();
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.from('crm_sync_events').insert({
        provider: 'ghl', external_event_id: eventId, event_type: event.type || 'unknown', payload: event,
      });
      if (error?.code === '23505') return json({ ok: true, duplicate: true });
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
