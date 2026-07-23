import type { APIRoute } from 'astro';
import { hasDeviceOwnerProfile, resolveOwnerSession } from '../../../lib/platform/identity';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { assertRateLimit, clientKey, json, safeError } from '../../../lib/platform/security';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import { refreshCompletedLead } from '../../../lib/platform/communications';
import { documentWorkerAvailable } from '../../../lib/platform/documents';
import { isHumanCallChannelEnabled } from '../../../lib/platform/consent';

export const POST: APIRoute = async (context) => {
  try {
    assertRateLimit(`session:${clientKey(context)}`, 20);
    const session = await resolveOwnerSession(context);
    if (session.emailVerified && session.persisted) {
      try {
        await refreshCompletedLead(session.profileId);
        await syncVerifiedOwnerToGhl(session.profileId);
      } catch (error) {
        console.error('[GHL owner sync]', error instanceof Error ? error.message : 'failed');
      }
    }
    return json({
      ok: true,
      conversationId: session.conversationId,
      authenticated: session.emailVerified,
    });
  } catch (error) {
    return safeError(error);
  }
};

export const GET: APIRoute = async (context) => {
  try {
    assertRateLimit(`session:${clientKey(context)}`, 40);
    const session = await resolveOwnerSession(context);
    const supabase = getSupabaseServer();
    if (!supabase || !session.persisted) {
      return json({
        ok: true,
        conversationId: session.conversationId,
        authenticated: session.emailVerified,
        deviceAccess: false,
        messages: [],
        interests: [],
        facts: [],
        documents: [],
        appointments: [],
        conversations: [],
        documentUploadsEnabled: false,
        documentProcessingEnabled: false,
      });
    }

    const profileIds = session.userId ? [session.profileId] : [session.profileId];
    const [messages, profile, facts, interests, documents, appointments, conversations, consent] =
      await Promise.all([
        supabase
          .from('messages')
          .select('id,role,content,persona,citations,event_type,metadata,created_at')
          .eq('conversation_id', session.conversationId)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('profiles')
          .select(
            'id,first_name,last_name,email,normalized_email,phone,normalized_phone,timezone,email_verified_at,primary_mineral_interest_id,residence_city,residence_state,residence_state_code,residence_county,residence_county_fips,residence_geography_status',
          )
          .eq('id', session.profileId)
          .maybeSingle(),
        supabase
          .from('owner_facts')
          .select(
            'id,field,value,status,confidence,mineral_interest_id,source,source_excerpt,created_at',
          )
          .in('profile_id', profileIds)
          .in('status', ['candidate', 'confirmed'])
          .order('created_at', { ascending: false }),
        supabase
          .from('mineral_interests')
          .select(
            'id,label,city,nearest_city,state,state_code,county,county_fips,place_geoid,latitude,longitude,legal_description,parcel_reference,plss_id,location_precision,geography_source,geography_status,geography_confidence,geography_resolved_at,basin_name,basin_code,basin_matches,oil_gas_province,oil_gas_province_code,basin_status,basin_confidence,basin_needs_confirmation,basin_source,basin_source_vintage,basin_resolved_at,operator,lease_name,well_names,ownership_type,net_mineral_acres,royalty_decimal,inherited,status,created_at,updated_at',
          )
          .in('profile_id', profileIds)
          .neq('status', 'archived')
          .order('updated_at', { ascending: false }),
        supabase
          .from('attachments')
          .select(
            'id,original_name,document_type,mime_type,size_bytes,status,rejection_reason,processed_at,created_at,mineral_interest_id',
          )
          .eq('conversation_id', session.conversationId)
          .eq('profile_id', session.profileId)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('id,ghl_appointment_id,starts_at,ends_at,timezone,status,created_at')
          .eq('profile_id', session.profileId)
          .order('starts_at', { ascending: false }),
        session.userId
          ? supabase
              .from('conversations')
              .select(
                'id,title,summary,last_persona,status,created_at,updated_at,messages(id,role,content,persona,created_at),appointments(*)',
              )
              .eq('user_id', session.userId)
              .neq('status', 'deleted')
              .order('updated_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('consent_receipts')
          .select('channel,purpose,granted,created_at')
          .eq('profile_id', session.profileId)
          .order('created_at', { ascending: false }),
      ]);

    const errors = [
      messages.error,
      profile.error,
      facts.error,
      interests.error,
      documents.error,
      appointments.error,
      conversations.error,
      consent.error,
    ].filter(Boolean);
    if (errors.length) throw errors[0];
    const newestFactByField = new Map<string, unknown>();
    for (const fact of facts.data ?? []) {
      if (!newestFactByField.has(fact.field)) newestFactByField.set(fact.field, fact.value);
    }
    const latestPermission = new Map<string, boolean>();
    for (const receipt of consent.data ?? []) {
      const key = `${receipt.channel}:${receipt.purpose}`;
      if (!latestPermission.has(key)) latestPermission.set(key, receipt.granted);
    }
    const deviceAccess = session.emailVerified || hasDeviceOwnerProfile(profile.data);
    const ownerProfile = profile.data
      ? Object.fromEntries(
          Object.entries(profile.data).filter(
            ([key]) => key !== 'normalized_email' && key !== 'normalized_phone',
          ),
        )
      : null;
    return json({
      ok: true,
      conversationId: session.conversationId,
      authenticated: session.emailVerified,
      deviceAccess,
      accessMode: session.emailVerified ? 'verified' : deviceAccess ? 'device' : 'anonymous',
      profile: ownerProfile,
      messages: (messages.data ?? []).reverse(),
      ownerFacts: Object.fromEntries(newestFactByField),
      facts: facts.data ?? [],
      interests: interests.data ?? [],
      documents: documents.data ?? [],
      appointments: appointments.data ?? [],
      conversations: conversations.data ?? [],
      permissions: {
        email: latestPermission.get('email:requested_updates') ?? false,
        sms: latestPermission.get('sms:requested_updates') ?? false,
        aiVoice: latestPermission.get('aiVoice:requested_updates') ?? false,
        marketingSms: latestPermission.get('marketingSms:marketing') ?? false,
        // When the human-call disclosure has not yet been published the channel
        // is treated as disabled regardless of any receipts that pre-date the
        // gate. Compliance must approve HUMAN_CALL_DISCLOSURE_VERSION before
        // any prior receipt can take effect.
        call: isHumanCallChannelEnabled()
          ? (latestPermission.get('call:requested_updates') ??
              latestPermission.get('call:requested_appointment') ??
              false)
          : false,
      },
      documentUploadsEnabled: deviceAccess,
      documentProcessingEnabled: await documentWorkerAvailable(),
    });
  } catch (error) {
    return safeError(error);
  }
};
