import type { APIRoute } from 'astro';
import { z } from 'zod';
import { bookAppointment } from '../../../lib/platform/ghl';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { consentRows, CONSENT_VERSION } from '../../../lib/platform/consent';
import {
  recordCommunicationDispatch,
  testOutboundSuppressionForProfile,
} from '../../../lib/platform/communications';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';
import {
  normalizeEmail,
  provisionAppointmentMemberAccess,
  resolveOwnerSession,
} from '../../../lib/platform/identity';

const Schema = z.object({
  profile: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().max(80).optional(),
    email: z.string().email(),
    phone: z.string().min(7).max(30),
    timezone: z.string().min(1),
    location: z.string().max(200).optional(),
    permissions: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      marketingSms: z.boolean(),
      call: z.boolean(),
      aiVoice: z.boolean().default(false),
    }),
    disclosureVersion: z.string().default(CONSENT_VERSION),
    sourceUrl: z.string().url(),
  }),
  option: z.object({
    id: z.string(),
    start: z.string().datetime(),
    end: z.string().datetime(),
    label: z.string(),
    timezone: z.string(),
  }),
  notes: z.string().max(2000).optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`appointment:${clientKey(context)}`, 5, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    if (!parsed.data.profile.permissions.call)
      return json({ ok: false, error: 'call_permission_required' }, { status: 400 });
    const session = await resolveOwnerSession(context);
    const conversationId = session.conversationId;
    const supabase = getSupabaseServer();
    let profileId: string | null = null;
    if (supabase) {
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id,starts_at')
        .eq('profile_id', session.profileId)
        .eq('status', 'confirmed')
        .gte('ends_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (existingAppointment) {
        return json(
          { ok: false, error: 'appointment_already_booked', appointment: existingAppointment },
          { status: 409 },
        );
      }
      const { data: profileRecord, error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: parsed.data.profile.firstName,
          last_name: parsed.data.profile.lastName,
          email: parsed.data.profile.email,
          normalized_email: normalizeEmail(parsed.data.profile.email),
          phone: parsed.data.profile.phone,
          timezone: parsed.data.profile.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.profileId)
        .select('id')
        .single();
      if (profileError) throw profileError;
      profileId = profileRecord.id;
      const { error: consentError } = await supabase.from('consent_receipts').insert(
        consentRows(profileRecord.id, parsed.data.profile, {
          purpose: 'requested_appointment',
          channels: ['call', 'email', 'sms', 'aiVoice'],
        }),
      );
      if (consentError) throw consentError;
    }
    const testState = await testOutboundSuppressionForProfile(session.profileId);
    if (testState.suppressed) {
      const requestedConfirmationChannels = [
        ...(parsed.data.profile.permissions.email && parsed.data.profile.email
          ? (['email'] as const)
          : []),
        ...(parsed.data.profile.permissions.sms && parsed.data.profile.phone
          ? (['sms'] as const)
          : []),
      ];
      await Promise.all([
        ...requestedConfirmationChannels.map((channel) =>
          recordCommunicationDispatch({
            profileId: session.profileId,
            conversationId,
            channel,
            purpose: 'requested_appointment',
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
        recordCommunicationDispatch({
          profileId: session.profileId,
          conversationId,
          channel: 'call',
          purpose: 'requested_appointment',
          provider: 'mrx-human-team',
          destination: parsed.data.profile.phone,
          status: 'suppressed',
          requestedBy: 'test',
          isTest: testState.isTest,
          testRunId: testState.testRunId,
          metadata: { reason: 'test_profile_outbound_suppressed' },
        }),
      ]);
      return json({ ok: true, appointmentId: null, notifications: [], suppressed: true });
    }

    const booked = await bookAppointment(parsed.data);
    if (supabase) {
      if (profileId)
        await supabase
          .from('profiles')
          .update({ ghl_contact_id: booked.contactId })
          .eq('id', profileId);
      const { error: appointmentError } = await supabase.from('appointments').insert({
        conversation_id: conversationId,
        profile_id: profileId,
        ghl_appointment_id: booked.id,
        ghl_contact_id: booked.contactId,
        starts_at: parsed.data.option.start,
        ends_at: parsed.data.option.end,
        timezone: parsed.data.option.timezone,
        status: 'confirmed',
      });
      if (appointmentError) throw appointmentError;
    }
    let memberAccess: Awaited<ReturnType<typeof provisionAppointmentMemberAccess>> = {
      status: 'unavailable',
      linkSent: false,
      redirectTo: null,
    };
    try {
      memberAccess = await provisionAppointmentMemberAccess({
        profileId: session.profileId,
        email: parsed.data.profile.email,
        sourceUrl: parsed.data.profile.sourceUrl,
        authenticatedEmail: session.email,
        emailVerified: session.emailVerified,
        ghlContactId: booked.contactId,
        firstName: parsed.data.profile.firstName,
      });
    } catch (error) {
      console.error(
        '[MRX member access]',
        error instanceof Error ? error.message : 'provisioning_failed',
      );
    }
    const requestedConfirmationChannels = [
      ...(parsed.data.profile.permissions.email && parsed.data.profile.email
        ? (['email'] as const)
        : []),
      ...(parsed.data.profile.permissions.sms && parsed.data.profile.phone
        ? (['sms'] as const)
        : []),
    ];
    await Promise.all(
      requestedConfirmationChannels.map((channel) =>
        recordCommunicationDispatch({
          profileId: session.profileId,
          conversationId,
          channel,
          purpose: 'requested_appointment',
          provider: 'gohighlevel',
          destination: channel === 'email' ? parsed.data.profile.email : parsed.data.profile.phone,
          status: booked.notifications.includes(channel) ? 'sent' : 'failed',
          errorCode: booked.notificationFailures.includes(channel)
            ? 'provider_delivery_failed'
            : null,
          metadata: { ghlAppointmentId: booked.id, ghlContactId: booked.contactId },
        }),
      ),
    );
    await recordCommunicationDispatch({
      profileId: session.profileId,
      conversationId,
      channel: 'call',
      purpose: 'requested_appointment',
      provider: 'mrx-human-team',
      destination: parsed.data.profile.phone,
      status: 'queued',
      metadata: { ghlAppointmentId: booked.id, startsAt: parsed.data.option.start },
    });
    return json({
      ok: true,
      appointmentId: booked.id,
      start: parsed.data.option.start,
      timezone: parsed.data.option.timezone,
      notifications: booked.notifications,
      notificationFailures: booked.notificationFailures,
      workflowEnrolled: booked.workflowEnrolled,
      memberAccess,
    });
  } catch (error) {
    return safeError(error);
  }
};
