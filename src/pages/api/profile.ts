import type { APIRoute } from 'astro';
import { z } from 'zod';
import { upsertContact, ghlConfigured } from '../../lib/platform/ghl';
import { getSupabaseServer } from '../../lib/platform/supabase';
import { consentRows, CONSENT_VERSION } from '../../lib/platform/consent';
import { assertRateLimit, assertSameOrigin, clientKey, json, safeError } from '../../lib/platform/security';

const Schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  timezone: z.string().max(80).optional(),
  permissions: z.object({
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    marketingSms: z.boolean().default(false),
    call: z.boolean().default(false),
  }),
  disclosureVersion: z.string().max(40).default(CONSENT_VERSION),
  sourceUrl: z.string().url().max(500),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`profile:${clientKey(context)}`, 8);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    const conversationId = context.cookies.get('mrx_conversation')?.value;
    if (!conversationId) return json({ ok: false, error: 'conversation_required' }, { status: 400 });
    const profile = parsed.data;
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase.from('profiles').upsert({
        conversation_id: conversationId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        timezone: profile.timezone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'conversation_id' }).select('id').single();
      if (error) throw error;
      const { error: consentError } = await supabase.from('consent_receipts').insert(consentRows(data.id, profile));
      if (consentError) throw consentError;
    }
    let ghlContactId: string | null = null;
    if (ghlConfigured()) ghlContactId = await upsertContact(profile);
    return json({ ok: true, ghlContactId });
  } catch (error) {
    return safeError(error);
  }
};
