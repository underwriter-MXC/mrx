import type { APIRoute } from 'astro';
import { z } from 'zod';
import { consentRows, CONSENT_VERSION } from '../../../lib/platform/consent';
import {
  recordCommunicationDispatch,
  testOutboundSuppressionForProfile,
} from '../../../lib/platform/communications';
import { sendGhlIntakeChecklist } from '../../../lib/platform/ghl';
import { requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import type { ContactProfile } from '../../../lib/platform/types';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const Schema = z.object({
  interestId: z.string().uuid(),
  channels: z
    .array(z.enum(['email', 'sms']))
    .min(1)
    .max(2),
  sourceUrl: z.string().url().max(1_000),
});

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`account-intake-follow-up:${clientKey(context)}`, 6, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_intake_follow_up' }, { status: 400 });

    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const [{ data: profile, error: profileError }, { data: interest, error: interestError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('first_name,last_name,email,phone,timezone')
          .eq('id', session.profileId)
          .single(),
        supabase
          .from('mineral_interests')
          .select('id,label,unknown_fields')
          .eq('id', parsed.data.interestId)
          .eq('profile_id', session.profileId)
          .neq('status', 'archived')
          .single(),
      ]);
    if (profileError || interestError) throw profileError || interestError;

    const channels = parsed.data.channels.filter(
      (channel) => channel === 'email' || Boolean(profile.phone),
    );
    if (!profile.email || !channels.length)
      return json({ ok: false, error: 'delivery_destination_missing' }, { status: 400 });

    let missingFields = strings(interest.unknown_fields);
    if (!missingFields.length) {
      const { data: fact } = await supabase
        .from('owner_facts')
        .select('value')
        .eq('profile_id', session.profileId)
        .eq('mineral_interest_id', parsed.data.interestId)
        .eq('field', 'missing_info_checklist')
        .in('status', ['candidate', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      missingFields = strings((fact?.value as { items?: unknown } | null)?.items);
    }
    if (!missingFields.length)
      return json({ ok: true, sent: [], failures: [], nothingMissing: true });

    const contactProfile: ContactProfile = {
      firstName: profile.first_name || 'Owner',
      lastName: profile.last_name || undefined,
      email: profile.email,
      phone: profile.phone || undefined,
      timezone: profile.timezone || undefined,
      permissions: {
        email: channels.includes('email'),
        sms: channels.includes('sms'),
        marketingSms: false,
        call: false,
        aiVoice: false,
      },
      disclosureVersion: CONSENT_VERSION,
      sourceUrl: parsed.data.sourceUrl,
    };
    const { error: consentError } = await supabase.from('consent_receipts').insert(
      consentRows(session.profileId, contactProfile, {
        purpose: 'missing_info_checklist',
        channels,
      }),
    );
    if (consentError) throw consentError;

    const accountLink = 'https://mineralrightsxchange.com/account/';
    const testState = await testOutboundSuppressionForProfile(session.profileId);
    if (testState.suppressed) {
      await Promise.all(
        channels.map((channel) =>
          recordCommunicationDispatch({
            profileId: session.profileId,
            conversationId: session.conversationId,
            channel,
            purpose: 'missing_info_checklist',
            provider: 'gohighlevel',
            destination: channel === 'email' ? profile.email : profile.phone,
            status: 'suppressed',
            requestedBy: 'test',
            isTest: testState.isTest,
            testRunId: testState.testRunId,
            metadata: {
              reason: 'test_profile_outbound_suppressed',
              interestId: interest.id,
              missingFields,
            },
          }),
        ),
      );
      return json({ ok: true, queued: [], failures: [], suppressed: true });
    }

    const result = await sendGhlIntakeChecklist({
      profile: contactProfile,
      channels,
      propertyLabel: interest.label || 'your mineral property',
      missingFields,
      accountLink,
    });
    await Promise.all(
      channels.map((channel) =>
        recordCommunicationDispatch({
          profileId: session.profileId,
          conversationId: session.conversationId,
          channel,
          purpose: 'missing_info_checklist',
          provider: 'gohighlevel',
          destination: channel === 'email' ? profile.email : profile.phone,
          status: result.sent.includes(channel) ? 'queued' : 'failed',
          errorCode: result.failures.includes(channel) ? 'provider_delivery_failed' : null,
          requestedBy: 'owner',
          metadata: {
            interestId: interest.id,
            missingFields,
            contactId: result.contactId,
            providerStatus: result.sent.includes(channel) ? 'pending' : 'failed',
          },
        }),
      ),
    );
    return json(
      { ok: result.sent.length > 0, queued: result.sent, failures: result.failures },
      { status: result.sent.length > 0 ? 200 : 502 },
    );
  } catch (error) {
    return safeError(error);
  }
};
