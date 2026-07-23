import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  recordCommunicationDispatch,
  refreshCompletedLead,
} from '../../../lib/platform/communications';
import { consentRows, CONSENT_VERSION, isHumanCallChannelEnabled } from '../../../lib/platform/consent';
import { normalizePhone, resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import type { ContactProfile } from '../../../lib/platform/types';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const CommunicationChannelSchema = z.enum(['email', 'sms', 'call', 'aiVoice']);

const Schema = z.object({
  email: z.string().email().max(320),
  phone: z.string().max(40).nullable(),
  permissions: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    call: z.boolean(),
    aiVoice: z.boolean(),
  }),
  channels: z.array(CommunicationChannelSchema).min(1).max(4).optional(),
  sourceUrl: z.string().url().max(1_000),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`permissions:${clientKey(context)}`, 12, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_permissions' }, { status: 400 });
    const session = await resolveOwnerSession(context);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: false, error: 'persistence_unavailable' }, { status: 503 });
    const normalizedPhone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
    if (parsed.data.phone && !normalizedPhone)
      return json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    if (
      !normalizedPhone &&
      (parsed.data.permissions.sms ||
        parsed.data.permissions.call ||
        parsed.data.permissions.aiVoice)
    )
      return json({ ok: false, error: 'phone_required_for_phone_permissions' }, { status: 400 });

    const profile: ContactProfile = {
      firstName: 'Owner',
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      permissions: {
        email: parsed.data.permissions.email,
        sms: parsed.data.permissions.sms,
        aiVoice: parsed.data.permissions.aiVoice,
        marketingSms: false,
        // Per CEO P3 the human-call channel must not grant itself consent
        // before compliance approves the disclosure. When the gate is closed
        // we treat any submitted `call: true` as `false` and drop `call`
        // from the channels we persist.
        call: isHumanCallChannelEnabled() ? parsed.data.permissions.call : false,
      },
      disclosureVersion: CONSENT_VERSION,
      sourceUrl: parsed.data.sourceUrl,
    };
    const submittedChannels = parsed.data.channels ?? (['email', 'sms', 'call', 'aiVoice'] as const);
    const channels = isHumanCallChannelEnabled()
      ? submittedChannels
      : (submittedChannels.filter((channel) => channel !== 'call') as typeof submittedChannels);
    if (channels.length === 0) {
      return json({ ok: false, error: 'no_channels' }, { status: 400 });
    }
    const { data: existingReceipts, error: receiptLookupError } = await supabase
      .from('consent_receipts')
      .select('id,channel,granted,created_at')
      .eq('profile_id', session.profileId)
      .eq('purpose', 'requested_updates')
      .in('channel', channels)
      .order('created_at', { ascending: false });
    if (receiptLookupError) throw receiptLookupError;
    const latest = new Map<string, { id: string; granted: boolean }>();
    for (const receipt of existingReceipts ?? []) {
      if (!latest.has(receipt.channel)) latest.set(receipt.channel, receipt);
    }
    const rows = consentRows(session.profileId, profile, {
      purpose: 'requested_updates',
      channels: [...channels],
    }).map((row) => ({ ...row, supersedes_id: latest.get(row.channel)?.id || null }));
    const { error } = await supabase.from('consent_receipts').insert(rows);
    if (error) throw error;
    await Promise.all(
      channels
        .filter((channel) => latest.get(channel)?.granted && !parsed.data.permissions[channel])
        .map((channel) =>
          recordCommunicationDispatch({
            profileId: session.profileId,
            conversationId: session.conversationId,
            channel,
            purpose: 'requested_updates',
            provider: 'owner-preferences',
            destination: channel === 'email' ? parsed.data.email : parsed.data.phone,
            status: 'revoked',
            metadata: { sourceUrl: parsed.data.sourceUrl },
          }),
        ),
    );
    const completedLead = await refreshCompletedLead(session.profileId);
    return json({
      ok: true,
      completedLead,
      aiVoiceEligible: false,
      phoneVerificationRequired: Boolean(parsed.data.permissions.aiVoice),
    });
  } catch (error) {
    return safeError(error);
  }
};
