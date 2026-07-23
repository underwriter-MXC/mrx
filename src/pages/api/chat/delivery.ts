import type { APIRoute } from 'astro';
import { z } from 'zod';
import { consentRows, CONSENT_VERSION } from '../../../lib/platform/consent';
import {
  recordCommunicationDispatch,
  testOutboundSuppressionForProfile,
} from '../../../lib/platform/communications';
import { ghlMessagingConfigured, sendRequestedInformation } from '../../../lib/platform/ghl';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { runtimeIsProduction } from '../../../lib/platform/runtime-env';

const Schema = z
  .object({
    profile: z.object({
      firstName: z.string().min(1).max(80),
      lastName: z.string().max(80).optional(),
      email: z.union([z.string().email(), z.literal('')]).optional(),
      phone: z.string().max(30).optional(),
      timezone: z.string().max(80).optional(),
      location: z.string().max(200).optional(),
      permissions: z.object({
        email: z.boolean(),
        sms: z.boolean(),
        marketingSms: z.boolean(),
        call: z.boolean(),
        aiVoice: z.boolean().default(false),
      }),
      disclosureVersion: z.string().default(CONSENT_VERSION),
      sourceUrl: z.string().url().max(500),
    }),
    channels: z
      .array(z.enum(['email', 'sms']))
      .min(1)
      .max(2),
    answer: z.string().min(1).max(8_000),
    link: z.string().url().max(500),
  })
  .superRefine((value, context) => {
    if (
      value.channels.includes('email') &&
      (!value.profile.email || !value.profile.permissions.email)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Email address and permission are required.',
        path: ['profile', 'email'],
      });
    }
    if (
      value.channels.includes('sms') &&
      (!value.profile.phone || !value.profile.permissions.sms)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Phone number and SMS permission are required.',
        path: ['profile', 'phone'],
      });
    }
  });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`delivery:${clientKey(context)}`, 5, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    const deliveryUrl = new URL(parsed.data.link);
    const allowedHosts = new Set(['mineralrightsxchange.com', 'www.mineralrightsxchange.com']);
    const isLocalPreview =
      !runtimeIsProduction() && ['127.0.0.1', 'localhost'].includes(deliveryUrl.hostname);
    if (!allowedHosts.has(deliveryUrl.hostname) && !isLocalPreview) {
      return json({ ok: false, error: 'invalid_delivery_link' }, { status: 400 });
    }
    if (!ghlMessagingConfigured())
      return json({ ok: false, error: 'delivery_not_configured' }, { status: 503 });
    const session = await resolveOwnerSession(context);

    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          first_name: parsed.data.profile.firstName,
          last_name: parsed.data.profile.lastName,
          email: parsed.data.profile.email || null,
          phone: parsed.data.profile.phone || null,
          timezone: parsed.data.profile.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.profileId)
        .select('id')
        .single();
      if (error) throw error;
      const { error: consentError } = await supabase.from('consent_receipts').insert(
        consentRows(profile.id, parsed.data.profile, {
          purpose: 'answer_delivery',
          channels: parsed.data.channels,
        }),
      );
      if (consentError) throw consentError;
    }

    const testState = await testOutboundSuppressionForProfile(session.profileId);
    if (testState.suppressed) {
      await Promise.all(
        parsed.data.channels.map((channel) =>
          recordCommunicationDispatch({
            profileId: session.profileId,
            conversationId: session.conversationId,
            channel,
            purpose: 'answer_delivery',
            provider: 'gohighlevel',
            destination:
              channel === 'email' ? parsed.data.profile.email : parsed.data.profile.phone,
            status: 'suppressed',
            requestedBy: 'test',
            isTest: testState.isTest,
            testRunId: testState.testRunId,
            metadata: { reason: 'test_profile_outbound_suppressed' },
          }),
        ),
      );
      return json({ ok: true, sent: [], failures: [], suppressed: true });
    }

    const result = await sendRequestedInformation(parsed.data);
    await Promise.all(
      parsed.data.channels.map((channel) =>
        recordCommunicationDispatch({
          profileId: session.profileId,
          conversationId: session.conversationId,
          channel,
          purpose: 'answer_delivery',
          provider: 'gohighlevel',
          destination: channel === 'email' ? parsed.data.profile.email : parsed.data.profile.phone,
          status: result.sent.includes(channel) ? 'sent' : 'failed',
          errorCode: result.failures.includes(channel) ? 'provider_delivery_failed' : null,
          metadata: { contactId: result.contactId },
        }),
      ),
    );
    return json(
      { ok: result.sent.length > 0, ...result },
      { status: result.sent.length ? 200 : 502 },
    );
  } catch (error) {
    return safeError(error);
  }
};
