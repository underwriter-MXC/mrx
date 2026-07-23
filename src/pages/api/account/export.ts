import type { APIRoute } from 'astro';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { json, safeError } from '../../../lib/platform/security';

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabase = getSupabaseServer();
    if (!token || !supabase) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const userId = auth.user.id;
    // Keep this owner-facing export allowlisted so future staff-only columns cannot leak by default.
    const profile = await supabase
      .from('profiles')
      .select(
        'id,conversation_id,first_name,last_name,email,phone,email_verified_at,phone_verified_at,timezone,last_seen_at,created_at,updated_at,primary_mineral_interest_id,residence_city,residence_state,residence_state_code,residence_state_fips,residence_county,residence_county_fips,residence_place_geoid,residence_latitude,residence_longitude,residence_geography_status,residence_geography_updated_at,pending_deletion_at',
      )
      .eq('user_id', userId)
      .maybeSingle();
    const profileId = profile.data?.id;
    const [conversations, attachments, interests, geography, consent, dispatches] =
      await Promise.all([
        supabase
          .from('conversations')
          .select(
            'id,title,summary,status,last_persona,created_at,updated_at,messages(id,role,persona,event_type,content,citations,created_at),owner_facts(id,field,value,source,source_page,source_excerpt,confidence,status,created_at),appointments(id,starts_at,ends_at,timezone,status,created_at)',
          )
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('attachments')
          .select('id,conversation_id,original_name,mime_type,size_bytes,status,created_at')
          .eq('user_id', userId),
        profileId
          ? supabase
              .from('mineral_interests')
              .select(
                'id,conversation_id,label,state,county,legal_description,parcel_reference,operator,lease_name,well_names,ownership_type,net_mineral_acres,royalty_decimal,inherited,status,created_at,updated_at,city,nearest_city,state_code,county_fips,place_geoid,latitude,longitude,plss_id,location_precision,geography_source,geography_status,geography_confidence,geography_resolved_at',
              )
              .eq('profile_id', profileId)
          : Promise.resolve({ data: [] }),
        profileId
          ? supabase
              .from('geography_resolutions')
              .select(
                'id,conversation_id,mineral_interest_id,source_message_id,source_attachment_id,scope,query_type,input_text,status,city,state,state_code,state_fips,county,county_fips,county_candidates,place_geoid,latitude,longitude,precision,confidence,needs_confirmation,provider,provider_vintage,metadata,created_at',
              )
              .eq('profile_id', profileId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        profileId
          ? supabase
              .from('consent_receipts')
              .select(
                'id,channel,purpose,granted,disclosure_version,disclosure_text,submitted_value,source_url,utm,ip_hash,destination,supersedes_id,created_at',
              )
              .eq('profile_id', profileId)
          : Promise.resolve({ data: [] }),
        profileId
          ? supabase
              .from('communication_dispatches')
              .select(
                'id,conversation_id,consent_receipt_id,appointment_id,channel,purpose,provider,external_id,destination_hash,status,error_code,requested_by,is_test,test_run_id,metadata,attempted_at,completed_at,created_at,updated_at',
              )
              .eq('profile_id', profileId)
          : Promise.resolve({ data: [] }),
      ]);
    return json(
      {
        exportedAt: new Date().toISOString(),
        account: { id: userId, email: auth.user.email },
        profile: profile.data,
        conversations: conversations.data ?? [],
        mineralInterests: interests.data ?? [],
        geographyResolutions: geography.data ?? [],
        consentReceipts: consent.data ?? [],
        communicationDispatches: dispatches.data ?? [],
        attachments: attachments.data ?? [],
      },
      {
        headers: {
          'Content-Disposition': `attachment; filename="mrx-account-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      },
    );
  } catch (error) {
    return safeError(error);
  }
};
