import type { APIRoute } from 'astro';
import { z } from 'zod';
import { bookAppointment } from '../../../lib/platform/ghl';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { consentRows, CONSENT_VERSION } from '../../../lib/platform/consent';
import { assertRateLimit, assertSameOrigin, clientKey, json, safeError } from '../../../lib/platform/security';

const Schema = z.object({
  profile: z.object({
    firstName: z.string().min(1).max(80), lastName: z.string().max(80).optional(), email: z.union([z.string().email(), z.literal('')]).optional(), phone: z.string().min(7).max(30), timezone: z.string().min(1), location: z.string().max(200).optional(),
    permissions: z.object({ email: z.boolean(), sms: z.boolean(), marketingSms: z.boolean(), call: z.boolean() }),
    disclosureVersion: z.string().default(CONSENT_VERSION), sourceUrl: z.string().url(),
  }),
  option: z.object({ id: z.string(), start: z.string().datetime(), end: z.string().datetime(), label: z.string(), timezone: z.string() }),
  notes: z.string().max(2000).optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`appointment:${clientKey(context)}`, 5, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    if (!parsed.data.profile.permissions.call) return json({ ok: false, error: 'call_permission_required' }, { status: 400 });
    const conversationId = context.cookies.get('mrx_conversation')?.value;
    if (!conversationId) return json({ ok: false, error: 'conversation_required' }, { status: 400 });
    const supabase = getSupabaseServer();
    let profileId: string | null = null;
    if (supabase) {
      const { data: profileRecord, error: profileError } = await supabase.from('profiles').upsert({
        conversation_id: conversationId,
        first_name: parsed.data.profile.firstName,
        last_name: parsed.data.profile.lastName,
        email: parsed.data.profile.email,
        phone: parsed.data.profile.phone,
        timezone: parsed.data.profile.timezone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id' }).select('id').single();
      if (profileError) throw profileError;
      profileId = profileRecord.id;
      const { error: consentError } = await supabase.from('consent_receipts').insert(consentRows(profileRecord.id, parsed.data.profile));
      if (consentError) throw consentError;
    }
    const booked = await bookAppointment(parsed.data);
    if (supabase) {
      if (profileId) await supabase.from('profiles').update({ ghl_contact_id: booked.contactId }).eq('id', profileId);
      const { error: appointmentError } = await supabase.from('appointments').insert({
        conversation_id: conversationId,
        ghl_appointment_id: booked.id,
        ghl_contact_id: booked.contactId,
        starts_at: parsed.data.option.start,
        ends_at: parsed.data.option.end,
        timezone: parsed.data.option.timezone,
        status: 'confirmed',
      });
      if (appointmentError) throw appointmentError;
    }
    return json({
      ok: true,
      appointmentId: booked.id,
      start: parsed.data.option.start,
      timezone: parsed.data.option.timezone,
      notifications: booked.notifications,
      notificationFailures: booked.notificationFailures,
    });
  } catch (error) {
    return safeError(error);
  }
};
