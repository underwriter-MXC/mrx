import type { APIRoute } from 'astro';
import {
  appendGhlConversationText,
  mapContactToBusinessPipeline,
  verifyGhlSignature,
  type MrxPipelineEvent,
} from '../../../lib/platform/ghl';
import { recordCommunicationDispatch } from '../../../lib/platform/communications';
import { syncGhlCallTranscriptEvent } from '../../../lib/platform/crm';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';
import { sendGa4ServerEvent } from '../../../lib/platform/analytics';

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (value && typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      for (const key of ['body', 'message', 'text', 'content', 'html', 'transcript']) {
        if (typeof nested[key] === 'string' && String(nested[key]).trim())
          return String(nested[key]);
      }
    }
  }
  return '';
}

function contactId(event: Record<string, any>) {
  return stringValue(event.contactId, event.contact_id, event.contact?.id);
}

function attachmentUrls(event: Record<string, any>) {
  const candidates = [event.attachments, event.files, event.media, event.message?.attachments];
  return candidates
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((item) => stringValue(item.url, item.link, item.mediaUrl, item.fileUrl, item))
    .filter(Boolean);
}

function isUnderwriterEmailReply(event: Record<string, any>, messageType: string) {
  const emailFields = [event.to, event.toEmail, event.emailTo, event.recipient, event.message?.to]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value || '').toLowerCase());
  return (
    messageType.toLowerCase().includes('email') &&
    emailFields.some((value) => value.includes('underwriter@mineralrightsxchange.com'))
  );
}

function eventName(request: Request, event: Record<string, any>) {
  return stringValue(
    event.type,
    event.eventType,
    event.event,
    request.headers.get('x-ghl-event'),
    request.headers.get('x-event-type'),
  );
}

function appointmentPipelineEvent(event: Record<string, any>): MrxPipelineEvent | null {
  const status = stringValue(
    event.appointmentStatus,
    event.status,
    event.appointment?.status,
  ).toLowerCase();
  if (status.includes('no_show') || status.includes('no show')) return 'appointment.no_show';
  if (status.includes('complete')) return 'appointment.completed';
  if (status.includes('reschedul')) return 'appointment.rescheduled';
  if (status.includes('confirm')) return 'appointment.confirmed';
  if (status.includes('book') || status.includes('new')) return 'appointment.booked';
  return null;
}

function appointmentId(event: Record<string, any>) {
  return stringValue(
    event.appointmentId,
    event.appointment_id,
    event.calendarEventId,
    event.appointment?.id,
  );
}

function appointmentDatabaseStatus(event: Record<string, any>) {
  const status = stringValue(
    event.appointmentStatus,
    event.status,
    event.appointment?.status,
  ).toLowerCase();
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('no_show') || status.includes('no show')) return 'no_show';
  if (status.includes('complete')) return 'completed';
  if (status.includes('reschedul')) return 'confirmed';
  if (status.includes('confirm') || status.includes('book') || status.includes('new')) {
    return 'confirmed';
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    if (!(await verifyGhlSignature(request, rawBody)))
      return json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    const event = JSON.parse(rawBody) as Record<string, any>;
    const type = eventName(request, event) || 'unknown';
    const eventId = event.id || request.headers.get('x-webhook-id') || crypto.randomUUID();
    const supabase = getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.from('crm_sync_events').insert({
        provider: 'ghl',
        external_event_id: eventId,
        event_type: type,
        payload: event,
      });
      if (error?.code === '23505') return json({ ok: true, duplicate: true });
      if (error) throw error;

      const ghlContactId = contactId(event);
      let transcriptPending = false;
      if (ghlContactId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id,first_name,last_name,conversation_id,is_test,test_run_id')
          .eq('ghl_contact_id', ghlContactId)
          .maybeSingle();
        if (profile) {
          const { data: latestConversation } = profile.conversation_id
            ? { data: { id: profile.conversation_id } }
            : await supabase
                .from('conversations')
                .select('id')
                .eq('profile_id', profile.id)
                .neq('status', 'deleted')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
          const conversationId = latestConversation?.id;
          const lowerType = type.toLowerCase();
          const body = stringValue(
            event.body,
            event.message,
            event.text,
            event.content,
            event.email,
          );
          const messageType = stringValue(event.messageType, event.channel, event.message?.type);
          const mediaUrls = attachmentUrls(event);
          const isInternalComment =
            messageType.toLowerCase() === 'internalcomment' || body.startsWith('[MRX ');

          if (
            messageType.toLowerCase().includes('call') &&
            (lowerType.includes('inboundmessage') || lowerType.includes('outboundmessage'))
          ) {
            const result = await syncGhlCallTranscriptEvent(supabase, event);
            transcriptPending = result.status === 'pending';
          }

          if (
            conversationId &&
            (body || mediaUrls.length) &&
            !isInternalComment &&
            (lowerType.includes('inboundmessage') || lowerType.includes('outboundmessage'))
          ) {
            const role = lowerType.includes('inboundmessage') ? 'user' : 'assistant';
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              role,
              content:
                body || (mediaUrls.length ? 'Owner replied with picture attachment(s).' : ''),
              event_type: 'message',
              metadata: {
                source: 'gohighlevel',
                channel: messageType || 'message',
                direction: role === 'user' ? 'inbound' : 'outbound',
                attachmentUrls: mediaUrls,
                replySource: mediaUrls.length
                  ? 'sms_picture'
                  : isUnderwriterEmailReply(event, messageType)
                    ? 'email_underwriter'
                    : null,
              },
              ghl_message_id: stringValue(event.messageId, event.id) || eventId,
              ghl_synced_at: new Date().toISOString(),
            });
            if (
              role === 'user' &&
              (mediaUrls.length || isUnderwriterEmailReply(event, messageType))
            ) {
              await supabase.from('owner_facts').insert({
                conversation_id: conversationId,
                profile_id: profile.id,
                field: 'missing_info_reply',
                value: {
                  body: body || null,
                  attachmentUrls: mediaUrls,
                  source: mediaUrls.length ? 'sms_picture' : 'email_underwriter',
                  receivedAt: new Date().toISOString(),
                },
                source: 'owner_chat',
                confidence: 1,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
              });
              await supabase.from('internal_case_workspaces').upsert({
                profile_id: profile.id,
                status: 'underwriting',
                recommended_focus:
                  'Owner replied to the missing-information checklist; Senior Underwriter should review the text and picture/email attachments on the owner record.',
                last_contact_at: new Date().toISOString(),
              });
            }
          }

          if (lowerType.includes('voiceaicallend')) {
            const transcript = stringValue(event.transcript, event.translation?.transcript);
            const summary = stringValue(event.summary);
            if (conversationId && transcript) {
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'system',
                persona: 'angela',
                event_type: 'notice',
                content: transcript,
                metadata: {
                  source: 'gohighlevel_voice_ai',
                  summary: stringValue(event.summary),
                  duration: event.duration,
                  agentId: event.agentId,
                  fromNumber: event.fromNumber,
                },
                ghl_message_id: stringValue(event.messageId, event.id) || eventId,
                ghl_synced_at: new Date().toISOString(),
              });
              if (summary) {
                await appendGhlConversationText({
                  contactId: ghlContactId,
                  source: 'GHL Voice AI approved summary',
                  text: summary,
                  occurredAt: stringValue(event.createdAt) || new Date().toISOString(),
                  externalId: stringValue(event.messageId, event.id) || eventId,
                });
              }
            }
            await recordCommunicationDispatch({
              profileId: profile.id,
              conversationId,
              channel: 'aiVoice',
              purpose: 'requested_updates',
              provider: 'gohighlevel-voice-ai',
              destination: stringValue(event.fromNumber),
              externalId: stringValue(event.messageId, event.id) || eventId,
              status: 'delivered',
              requestedBy: profile.is_test ? 'test' : 'system',
              isTest: profile.is_test,
              testRunId: profile.test_run_id,
              metadata: {
                duration: event.duration,
                summary: stringValue(event.summary),
                agentId: event.agentId,
              },
            });
          }

          if (lowerType.includes('appointment')) {
            const pipelineEvent = appointmentPipelineEvent(event);
            const localAppointmentStatus = appointmentDatabaseStatus(event);
            const ghlAppointmentId = appointmentId(event);
            if (localAppointmentStatus && ghlAppointmentId) {
              const start = stringValue(
                event.startTime,
                event.start,
                event.appointment?.startTime,
                event.appointment?.start,
              );
              const end = stringValue(
                event.endTime,
                event.end,
                event.appointment?.endTime,
                event.appointment?.end,
              );
              const { data: updatedAppointment, error: appointmentUpdateError } = await supabase
                .from('appointments')
                .update({
                  status: localAppointmentStatus,
                  ...(start ? { starts_at: start } : {}),
                  ...(end ? { ends_at: end } : {}),
                })
                .eq('profile_id', profile.id)
                .eq('ghl_appointment_id', ghlAppointmentId)
                .select('id')
                .maybeSingle();
              if (appointmentUpdateError) throw appointmentUpdateError;
              if (localAppointmentStatus === 'completed' && updatedAppointment) {
                await sendGa4ServerEvent({
                  event: 'appointment_held',
                  profileId: profile.id,
                  params: { mrx_calendar_event_id: ghlAppointmentId },
                }).catch((error) =>
                  console.error(
                    '[GA4 appointment-held event]',
                    error instanceof Error ? error.message : 'send_failed',
                  ),
                );
              }
            }
            if (pipelineEvent) {
              await mapContactToBusinessPipeline({
                contactId: ghlContactId,
                event: pipelineEvent,
                name: `${profile.first_name || 'MRX owner'} ${profile.last_name || ''} appointment`.trim(),
              }).catch(() => null);
            }
          }
        }
      }
      await supabase
        .from('crm_sync_events')
        .update({
          processed_at: transcriptPending ? null : new Date().toISOString(),
          error_code: transcriptPending ? 'transcript_pending' : null,
        })
        .eq('provider', 'ghl')
        .eq('external_event_id', eventId);
    }
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
