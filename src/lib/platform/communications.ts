import { sha256 } from './identity';
import { getSupabaseServer } from './supabase';
import { enrollContactInGhlWorkflow, updateGhlContactFields } from './ghl';
import { runtimeEnv, runtimeFlag } from './runtime-env';
import { normalizeMrxText } from './style';
import { testOutboundSuppressed } from './test-access';

export type CommunicationChannel = 'email' | 'sms' | 'call' | 'aiVoice';
export type DispatchStatus =
  | 'queued'
  | 'suppressed'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'revoked';

export async function latestConsent(
  profileId: string,
  channel: CommunicationChannel,
  purpose: string,
) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('consent_receipts')
    .select('id,granted,destination,created_at')
    .eq('profile_id', profileId)
    .eq('channel', channel)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordCommunicationDispatch(args: {
  profileId: string;
  conversationId?: string | null;
  appointmentId?: string | null;
  channel: CommunicationChannel;
  purpose: string;
  provider: string;
  status: DispatchStatus;
  destination?: string | null;
  externalId?: string | null;
  errorCode?: string | null;
  requestedBy?: 'owner' | 'staff' | 'system' | 'test';
  isTest?: boolean;
  testRunId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const [consent, testState] = await Promise.all([
    latestConsent(args.profileId, args.channel, args.purpose),
    testOutboundSuppressionForProfile(args.profileId),
  ]);
  const isTest = args.isTest ?? testState.isTest;
  const testRunId = args.testRunId ?? testState.testRunId;
  const suppressedByTestState = testOutboundSuppressed({
    is_test: isTest,
    test_run_id: testRunId,
  });
  const effectiveStatus =
    suppressedByTestState || (consent?.granted !== true && args.status !== 'revoked')
      ? 'suppressed'
      : args.status;
  const { data, error } = await supabase
    .from('communication_dispatches')
    .insert({
      profile_id: args.profileId,
      conversation_id: args.conversationId || null,
      appointment_id: args.appointmentId || null,
      consent_receipt_id: consent?.id || null,
      channel: args.channel,
      purpose: args.purpose,
      provider: args.provider,
      external_id: args.externalId || null,
      destination_hash: args.destination
        ? await sha256(args.destination.trim().toLowerCase())
        : null,
      status: effectiveStatus,
      error_code: args.errorCode || null,
      requested_by: args.requestedBy || 'owner',
      is_test: Boolean(isTest),
      test_run_id: testRunId || null,
      metadata: args.metadata || {},
      attempted_at: ['queued', 'suppressed'].includes(effectiveStatus)
        ? null
        : new Date().toISOString(),
      completed_at: ['sent', 'delivered', 'failed', 'cancelled', 'revoked', 'suppressed'].includes(
        effectiveStatus,
      )
        ? new Date().toISOString()
        : null,
    })
    .select('id,status,consent_receipt_id')
    .single();
  if (error) throw error;
  return data;
}

export async function testOutboundSuppressionForProfile(profileId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return { suppressed: false, isTest: false, testRunId: null } as const;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_test,test_run_id')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  const isTest = Boolean(profile?.is_test || profile?.test_run_id);
  return {
    suppressed: profile ? testOutboundSuppressed(profile) : false,
    isTest,
    testRunId: profile?.test_run_id || null,
  } as const;
}

export async function refreshCompletedLead(profileId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('refresh_completed_lead', {
    target_profile_id: profileId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function canDispatchAiVoiceUpdate(profileId: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return { allowed: false, reason: 'persistence_unavailable' } as const;
  const [{ data: profile, error }, consent] = await Promise.all([
    supabase
      .from('profiles')
      .select('normalized_phone,phone_verified_at')
      .eq('id', profileId)
      .maybeSingle(),
    latestConsent(profileId, 'aiVoice', 'requested_updates'),
  ]);
  if (error) throw error;
  if (!profile?.normalized_phone) return { allowed: false, reason: 'phone_missing' } as const;
  if (!profile.phone_verified_at) return { allowed: false, reason: 'phone_unverified' } as const;
  if (!consent?.granted) return { allowed: false, reason: 'consent_missing_or_revoked' } as const;
  return {
    allowed: true,
    reason: null,
    phone: profile.normalized_phone,
    consentReceiptId: consent.id,
  } as const;
}

export async function queueGhlAiVoiceUpdate(args: {
  profileId: string;
  conversationId?: string | null;
  updateText: string;
  requestedBy?: 'owner' | 'staff' | 'system' | 'test';
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return { queued: false, reason: 'persistence_unavailable' } as const;
  const workflowId = runtimeEnv('GHL_AI_VOICE_WORKFLOW_ID');
  if (!runtimeFlag('GHL_AI_VOICE_ENABLED') || !workflowId) {
    return { queued: false, reason: 'ghl_voice_ai_disabled' } as const;
  }
  const eligibility = await canDispatchAiVoiceUpdate(args.profileId);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('ghl_contact_id,is_test,test_run_id')
    .eq('id', args.profileId)
    .maybeSingle();
  if (error) throw error;
  if (profile && testOutboundSuppressed(profile)) {
    await recordCommunicationDispatch({
      profileId: args.profileId,
      conversationId: args.conversationId,
      channel: 'aiVoice',
      purpose: 'requested_updates',
      provider: 'gohighlevel-voice-ai',
      status: 'suppressed',
      destination: eligibility.allowed ? eligibility.phone : null,
      requestedBy: args.requestedBy,
      isTest: profile?.is_test,
      testRunId: profile?.test_run_id,
      metadata: { reason: 'test_profile_outbound_suppressed' },
    });
    return { queued: false, reason: 'test_profile_outbound_suppressed' } as const;
  }
  if (!eligibility.allowed || !profile?.ghl_contact_id) {
    await recordCommunicationDispatch({
      profileId: args.profileId,
      conversationId: args.conversationId,
      channel: 'aiVoice',
      purpose: 'requested_updates',
      provider: 'gohighlevel-voice-ai',
      status: 'suppressed',
      destination: eligibility.allowed ? eligibility.phone : null,
      requestedBy: args.requestedBy,
      isTest: profile?.is_test,
      testRunId: profile?.test_run_id,
      metadata: { reason: eligibility.reason || 'ghl_contact_missing' },
    });
    return { queued: false, reason: eligibility.reason || 'ghl_contact_missing' } as const;
  }
  await updateGhlContactFields(profile.ghl_contact_id, [
    {
      key: 'contact.mrx_ai_voice_update_text',
      fieldValue: normalizeMrxText(args.updateText).slice(0, 20_000),
    },
  ]);
  await enrollContactInGhlWorkflow(profile.ghl_contact_id, workflowId);
  const dispatch = await recordCommunicationDispatch({
    profileId: args.profileId,
    conversationId: args.conversationId,
    channel: 'aiVoice',
    purpose: 'requested_updates',
    provider: 'gohighlevel-voice-ai',
    status: 'queued',
    destination: eligibility.phone,
    requestedBy: args.requestedBy,
    isTest: profile.is_test,
    testRunId: profile.test_run_id,
    metadata: { workflowId, ghlContactId: profile.ghl_contact_id },
  });
  return { queued: true, dispatchId: dispatch?.id || null } as const;
}
