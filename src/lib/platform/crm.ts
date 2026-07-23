import {
  appendGhlConversationText,
  completeDocumentFollowUp,
  getGhlCallTranscription,
  ghlConfigured,
  updateGhlContactFields,
  upsertContact,
} from './ghl';
import { getSupabaseServer } from './supabase';
import { testOutboundSuppressed } from './test-access';
import type { ContactProfile } from './types';

type SupabaseServer = NonNullable<ReturnType<typeof getSupabaseServer>>;

function clean(value: unknown, max = 240) {
  const serialized =
    value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  return serialized
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function syncOwnerConversationHistoryToGhl(
  supabase: SupabaseServer,
  profileId: string,
  contactId: string,
  lastSyncedAt?: string | null,
) {
  let conversationQuery = supabase
    .from('conversations')
    .select('id,summary,updated_at')
    .eq('profile_id', profileId)
    .neq('status', 'deleted')
    .not('summary', 'is', null)
    .order('updated_at', { ascending: true });
  if (lastSyncedAt) conversationQuery = conversationQuery.gt('updated_at', lastSyncedAt);
  const { data: conversations, error: conversationError } = await conversationQuery;
  if (conversationError) throw conversationError;
  let synced = 0;
  for (const conversation of conversations ?? []) {
    const summary = clean(conversation.summary, 5_000);
    if (!summary) continue;
    try {
      await appendGhlConversationText({
        contactId,
        source: 'approved owner conversation summary',
        text: summary,
        occurredAt: conversation.updated_at,
        externalId: `conversation-summary:${conversation.id}:${conversation.updated_at}`,
      });
      synced += 1;
    } catch (error) {
      console.error(
        '[GHL conversation summary sync]',
        error instanceof Error ? error.message.slice(0, 500) : 'sync_failed',
      );
    }
  }
  if (synced) {
    await supabase
      .from('profiles')
      .update({ ghl_last_conversation_sync_at: new Date().toISOString() })
      .eq('id', profileId);
  }
  return synced;
}

async function syncOwnerDocumentOcrToGhl(
  supabase: SupabaseServer,
  profileId: string,
  contactId: string,
) {
  const { data: attachments, error: attachmentError } = await supabase
    .from('attachments')
    .select('id,original_name,processed_at')
    .eq('profile_id', profileId)
    .eq('status', 'ready')
    .order('processed_at', { ascending: true });
  if (attachmentError) throw attachmentError;
  const attachmentIds = (attachments ?? []).map((attachment) => attachment.id);
  if (!attachmentIds.length) return 0;
  const attachmentById = new Map(
    (attachments ?? []).map((attachment) => [attachment.id, attachment]),
  );
  const { data: extractions, error: extractionError } = await supabase
    .from('document_extractions')
    .select('id,attachment_id,redacted_text,created_at')
    .in('attachment_id', attachmentIds)
    .is('ghl_synced_at', null)
    .order('created_at', { ascending: true });
  if (extractionError) throw extractionError;
  let synced = 0;
  for (const extraction of extractions ?? []) {
    const attachment = attachmentById.get(extraction.attachment_id);
    try {
      const redactedText = extraction.redacted_text || '';
      const messageIds = await appendGhlConversationText({
        contactId,
        source: `redacted document summary, ${attachment?.original_name || 'owner document'}`,
        text: redactedText,
        occurredAt: attachment?.processed_at || extraction.created_at,
        externalId: extraction.attachment_id,
      });
      const syncedAt = new Date().toISOString();
      await supabase
        .from('document_extractions')
        .update({
          ghl_message_ids: messageIds,
          ghl_synced_at: syncedAt,
          ghl_sync_error: null,
        })
        .eq('id', extraction.id);
      await updateGhlContactFields(contactId, [
        {
          key: 'contact.mrx_latest_document_name',
          fieldValue: attachment?.original_name || 'Owner document',
        },
        { key: 'contact.mrx_latest_document_summary', fieldValue: redactedText.slice(0, 20_000) },
        { key: 'contact.mrx_document_summary_last_synced_at', fieldValue: syncedAt },
      ]);
      synced += 1;
    } catch (error) {
      await supabase
        .from('document_extractions')
        .update({
          ghl_sync_error: error instanceof Error ? error.message.slice(0, 500) : 'sync_failed',
        })
        .eq('id', extraction.id);
    }
  }
  return synced;
}

function webhookString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export async function syncGhlCallTranscriptEvent(
  supabase: SupabaseServer,
  event: Record<string, any>,
) {
  const messageType = webhookString(event.messageType, event.messageTypeString).toLowerCase();
  if (!messageType.includes('call')) return { status: 'ignored' as const };
  const messageId = webhookString(event.messageId, event.message?.id);
  const ghlContactId = webhookString(event.contactId, event.contact_id, event.contact?.id);
  if (!messageId || !ghlContactId) return { status: 'ignored' as const };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,conversation_id,is_test,test_run_id')
    .eq('ghl_contact_id', ghlContactId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return { status: 'ignored' as const };
  if (testOutboundSuppressed(profile)) return { status: 'ignored' as const };

  const { data: existing, error: existingError } = await supabase
    .from('messages')
    .select('id')
    .eq('ghl_message_id', messageId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { status: 'synced' as const, messageId };

  const { data: latestConversation, error: conversationError } = profile.conversation_id
    ? { data: { id: profile.conversation_id }, error: null }
    : await supabase
        .from('conversations')
        .select('id')
        .eq('profile_id', profile.id)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
  if (conversationError) throw conversationError;
  if (!latestConversation?.id) return { status: 'ignored' as const };

  let transcript: string | null = null;
  for (const delay of [0, 1_200, 2_500]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    transcript = await getGhlCallTranscription(
      messageId,
      webhookString(event.locationId, event.location_id) || undefined,
    );
    if (transcript) break;
  }
  if (!transcript) return { status: 'pending' as const, messageId };

  const direction = webhookString(event.direction).toLowerCase() || 'unknown';
  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: latestConversation.id,
    role: 'system',
    event_type: 'notice',
    content: transcript,
    metadata: {
      source: 'gohighlevel_call',
      direction,
      duration: event.callDuration,
      callStatus: event.callStatus || event.status,
      from: event.from,
      to: event.to,
    },
    ghl_message_id: messageId,
    ghl_synced_at: new Date().toISOString(),
  });
  if (insertError?.code !== '23505') {
    if (insertError) throw insertError;
  }
  return { status: 'synced' as const, messageId };
}

function booleanText(value: unknown) {
  if (typeof value === 'boolean') return String(value);
  const normalized = clean(value).toLowerCase();
  return String(['true', 'yes', '1', 'y'].includes(normalized));
}

export async function syncVerifiedOwnerToGhl(profileId: string) {
  const supabase = getSupabaseServer();
  if (!supabase || !ghlConfigured()) return null;
  const [
    profileResult,
    interestsResult,
    factsResult,
    documentsResult,
    appointmentResult,
    consentResult,
    requirementsResult,
    packetResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id,first_name,last_name,email,phone,timezone,email_verified_at,phone_verified_at,ghl_contact_id,ghl_last_conversation_sync_at,is_test,test_run_id,residence_city,residence_state,residence_county',
      )
      .eq('id', profileId)
      .single(),
    supabase
      .from('mineral_interests')
      .select(
        'city,state,state_code,county,county_fips,geography_status,location_precision,legal_description,plss_id,basin_name,oil_gas_province,basin_status,basin_source,operator,label,ownership_type,net_mineral_acres,royalty_decimal,lease_name,well_names',
      )
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('owner_facts')
      .select('field,value,status')
      .eq('profile_id', profileId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('attachments')
      .select('status')
      .eq('profile_id', profileId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('appointments')
      .select('starts_at,status')
      .eq('profile_id', profileId)
      .order('starts_at', { ascending: false })
      .limit(1),
    supabase
      .from('consent_receipts')
      .select('channel,granted,source_url,utm,disclosure_version,created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('underwriting_document_requirements')
      .select('label,required,status')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
    supabase
      .from('underwriting_packets')
      .select('status,readiness_version,updated_at')
      .eq('profile_id', profileId)
      .maybeSingle(),
  ]);
  const profile = profileResult.data;
  if (!profile?.first_name || (!profile.email_verified_at && !profile.ghl_contact_id)) return null;
  if (testOutboundSuppressed(profile)) return null;
  const latestPermissions = new Map<string, boolean>();
  for (const receipt of consentResult.data ?? []) {
    if (!latestPermissions.has(receipt.channel))
      latestPermissions.set(receipt.channel, receipt.granted);
  }
  const facts = new Map<string, unknown>();
  for (const fact of factsResult.data ?? []) {
    if (!facts.has(fact.field)) facts.set(fact.field, fact.value);
  }
  const interests = interestsResult.data ?? [];
  const interest = interests[0];
  const document = documentsResult.data?.[0];
  const appointment = appointmentResult.data?.[0];
  const incompleteRequirements = (requirementsResult.data ?? []).filter(
    (requirement) =>
      requirement.required && !['verified', 'waived', 'not_applicable'].includes(requirement.status),
  );
  const checklistStatus = packetResult.data?.status === 'ready'
    ? 'ready'
    : incompleteRequirements.length
      ? `${incompleteRequirements.length} required item${incompleteRequirements.length === 1 ? '' : 's'} unresolved`
      : 'staff verification pending';
  const attributionReceipt = (consentResult.data ?? []).find(
    (receipt) => receipt.source_url || Object.keys(receipt.utm ?? {}).length,
  );
  const attribution = (attributionReceipt?.utm ?? {}) as Record<string, unknown>;
  const metadata = {
    city: clean(interest?.city),
    state: clean(interest?.state),
    stateCode: clean(interest?.state_code),
    county: clean(interest?.county),
    countyFips: clean(interest?.county_fips),
    geographyStatus: clean(interest?.geography_status),
    locationPrecision: clean(interest?.location_precision),
    legalDescription: clean(interest?.legal_description, 20_000),
    plssId: clean(interest?.plss_id),
    residenceCity: clean(profile.residence_city),
    residenceState: clean(profile.residence_state),
    residenceCounty: clean(profile.residence_county),
    operator: clean(interest?.operator),
    situation: clean(facts.get('decision_goal')),
    offerStatus: facts.has('offer_amount')
      ? `Offer mentioned: ${clean(facts.get('offer_amount'))}`
      : '',
    documentStatus: clean(document?.status),
    documentsNeeded: clean(
      incompleteRequirements.map((requirement) => requirement.label).join('; '),
      20_000,
    ),
    underwritingReadiness: clean(checklistStatus),
    appointment: appointment ? `${clean(appointment.status)} ${clean(appointment.starts_at)}` : '',
    ownershipType: clean(interest?.ownership_type),
    netMineralAcres: clean(interest?.net_mineral_acres),
    royaltyDecimal: clean(interest?.royalty_decimal),
    leaseName: clean(interest?.lease_name),
    wellNames: clean(Array.isArray(interest?.well_names) ? interest.well_names.join(', ') : ''),
    offerAmount: clean(facts.get('offer_amount')),
    royaltyAmount: clean(facts.get('royalty_amount')),
    royaltyFrequency: clean(facts.get('royalty_frequency')),
    numberOfInterests: String(interests.length),
    primaryOperator: clean(interest?.operator),
    interestType: clean(facts.get('interest_type') || interest?.ownership_type),
    operatorTier: clean(facts.get('operator_tier')),
    developmentStatus: clean(facts.get('development_status')),
    basinRegion: clean(interest?.basin_name || facts.get('basin_region')),
    rrcLeaseNumber: clean(facts.get('rrc_lease_number')),
    competingOfferReceived: facts.has('offer_amount')
      ? 'true'
      : booleanText(facts.get('competing_offer_received')),
    competingOfferAmount: clean(facts.get('competing_offer_amount') || facts.get('offer_amount')),
    appointmentStatus: clean(appointment?.status),
    bookedBy: appointment ? 'Ask Tommy / Angela' : '',
    consentVersion: clean((consentResult.data ?? [])[0]?.disclosure_version),
    phoneVerified: String(Boolean(profile.phone_verified_at)),
    is1031Interest: booleanText(facts.get('1031_interest')),
    fullConversationSynced: '',
    isTest: Boolean(profile.is_test),
    sourceUrl: clean(attributionReceipt?.source_url, 500),
    utmSource: clean(attribution.utm_source),
    utmMedium: clean(attribution.utm_medium),
    utmCampaign: clean(attribution.utm_campaign),
    utmContent: clean(attribution.utm_content),
    utmTerm: clean(attribution.utm_term),
    leadSourceTag: 'PLATFORM',
    testRunId: profile.is_test ? clean(profile.test_run_id) : '',
  };
  const contact: ContactProfile = {
    firstName: clean(profile.first_name, 80),
    lastName: clean(profile.last_name, 80),
    email: profile.email,
    phone: profile.phone || undefined,
    timezone: profile.timezone || undefined,
    location:
      [
        metadata.residenceCity,
        metadata.residenceCounty && `${metadata.residenceCounty} County`,
        metadata.residenceState,
      ]
        .filter(Boolean)
        .join(', ') || [metadata.city, metadata.county, metadata.state].filter(Boolean).join(', '),
    permissions: {
      email: latestPermissions.get('email') ?? false,
      sms: latestPermissions.get('sms') ?? false,
      marketingSms: latestPermissions.get('marketingSms') ?? false,
      call: latestPermissions.get('call') ?? false,
      aiVoice: latestPermissions.get('aiVoice') ?? false,
    },
    disclosureVersion: 'database-receipts',
    sourceUrl: metadata.sourceUrl || 'https://mineralrightsxchange.com/',
    ownerMetadata: {
      ...metadata,
      sanitizedSummary: clean(
        [
          metadata.county && metadata.state
            ? `${metadata.city ? `${metadata.city}, ` : ''}${metadata.county} County, ${metadata.state}`
            : metadata.state,
          metadata.operator ? `Operator: ${metadata.operator}` : '',
          metadata.situation,
          metadata.offerStatus,
          metadata.documentStatus ? `Document: ${metadata.documentStatus}` : '',
          metadata.ownershipType ? `Ownership: ${metadata.ownershipType}` : '',
          metadata.netMineralAcres ? `Net acres: ${metadata.netMineralAcres}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        500,
      ),
    },
  };
  const contactId = await upsertContact(contact, {
    syncOpportunity: !profile.ghl_contact_id,
  });
  if (metadata.documentStatus === 'ready') await completeDocumentFollowUp(contactId);
  const [messageCount, documentCount] = await Promise.all([
    syncOwnerConversationHistoryToGhl(
      supabase,
      profileId,
      contactId,
      profile.ghl_last_conversation_sync_at,
    ),
    syncOwnerDocumentOcrToGhl(supabase, profileId, contactId),
  ]);
  if (messageCount || documentCount) {
    await updateGhlContactFields(contactId, [
      { key: 'contact.mrx_full_conversation_synced', fieldValue: new Date().toISOString() },
    ]);
  }
  await supabase.from('profiles').update({ ghl_contact_id: contactId }).eq('id', profileId);
  return contactId;
}
