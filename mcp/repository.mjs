import { createClient } from '@supabase/supabase-js';

const INTEREST_COLUMNS = [
  'id',
  'label',
  'state',
  'state_code',
  'county',
  'county_fips',
  'basin_name',
  'basin_code',
  'oil_gas_province',
  'operator',
  'lease_name',
  'well_names',
  'ownership_type',
  'net_mineral_acres',
  'royalty_decimal',
  'inherited',
  'status',
  'geography_status',
  'geography_confidence',
  'basin_status',
  'basin_confidence',
  'updated_at',
].join(',');

function requireResult(error, context) {
  if (!error) return;
  const wrapped = new Error(`${context} failed`);
  wrapped.code = error.code;
  throw wrapped;
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function applyInterestFilters(query, filters = {}) {
  let next = query;
  if (filters.profileId) next = next.eq('profile_id', filters.profileId);
  if (filters.stateCode) next = next.eq('state_code', filters.stateCode.toUpperCase());
  if (filters.county) next = next.ilike('county', escapeLike(filters.county.trim()));
  if (filters.operator) next = next.ilike('operator', `%${escapeLike(filters.operator.trim())}%`);
  return next;
}

async function exactCount(query, context) {
  const { count, error } = await query;
  requireResult(error, context);
  return count ?? 0;
}

export function createSupabaseClientFromEnv(environment = process.env) {
  const url = environment.SUPABASE_URL || environment.PUBLIC_SUPABASE_URL;
  const serviceRole = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the MRX MCP server.',
    );
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'mrx-mcp/0.1.0' } },
  });
}

export function createSupabaseRepository({ client, auditEnabled = true }) {
  if (!client) throw new Error('A Supabase client is required.');

  return {
    async getSystemStatus() {
      const profileCount = await exactCount(
        client.from('profiles').select('id', { count: 'exact', head: true }),
        'Profile readiness check',
      );
      return {
        service: 'mrx-mcp',
        version: '0.1.0',
        accessMode: 'read-only',
        database: 'connected',
        profileCount,
        sensitiveFieldsExcluded: [
          'email',
          'phone',
          'message content',
          'raw OCR',
          'storage paths',
          'credentials',
        ],
      };
    },

    async getPipelineSummary(filters = {}) {
      const countInterests = (extra = {}) => {
        let query = client.from('mineral_interests').select('id', { count: 'exact', head: true });
        query = applyInterestFilters(query, filters);
        if (extra.status) query = query.eq('status', extra.status);
        if (extra.inherited !== undefined) query = query.eq('inherited', extra.inherited);
        return query;
      };

      const [total, active, sold, unknown, archived, inherited] = await Promise.all([
        exactCount(countInterests(), 'Interest count'),
        exactCount(countInterests({ status: 'active' }), 'Active interest count'),
        exactCount(countInterests({ status: 'sold' }), 'Sold interest count'),
        exactCount(countInterests({ status: 'unknown' }), 'Unknown interest count'),
        exactCount(countInterests({ status: 'archived' }), 'Archived interest count'),
        exactCount(countInterests({ inherited: true }), 'Inherited interest count'),
      ]);

      return {
        filters: {
          stateCode: filters.stateCode?.toUpperCase() ?? null,
          county: filters.county ?? null,
        },
        interests: { total, active, sold, unknown, archived, inherited },
        valuationStatus: 'disabled_pending_independent_validation',
      };
    },

    async searchMineralInterests(filters) {
      let query = client
        .from('mineral_interests')
        .select(INTEREST_COLUMNS)
        .order('updated_at', { ascending: false })
        .limit(filters.limit);
      query = applyInterestFilters(query, filters);
      const { data, error } = await query;
      requireResult(error, 'Mineral interest search');
      return { results: data ?? [], count: data?.length ?? 0, limit: filters.limit };
    },

    async getCaseSnapshot({ profileId, includeCandidates = false }) {
      const factsQuery = client
        .from('owner_facts')
        .select(
          'id,mineral_interest_id,field,value,source,confidence,status,confirmed_at,created_at',
        )
        .eq('profile_id', profileId)
        .in('status', includeCandidates ? ['confirmed', 'candidate'] : ['confirmed'])
        .order('created_at', { ascending: false })
        .limit(250);

      const [profileResult, interestsResult, factsResult, attachmentsResult, appointmentsResult] =
        await Promise.all([
          client
            .from('profiles')
            .select(
              'id,first_name,last_name,timezone,email_verified_at,phone_verified_at,last_seen_at,created_at,primary_mineral_interest_id',
            )
            .eq('id', profileId)
            .maybeSingle(),
          client
            .from('mineral_interests')
            .select(INTEREST_COLUMNS)
            .eq('profile_id', profileId)
            .order('updated_at', { ascending: false })
            .limit(100),
          factsQuery,
          client
            .from('attachments')
            .select(
              'id,mineral_interest_id,document_type,mime_type,size_bytes,status,processed_at,created_at',
            )
            .eq('profile_id', profileId)
            .neq('status', 'deleted')
            .order('created_at', { ascending: false })
            .limit(100),
          client
            .from('appointments')
            .select('id,starts_at,ends_at,timezone,status,created_at')
            .eq('profile_id', profileId)
            .order('starts_at', { ascending: false })
            .limit(50),
        ]);

      requireResult(profileResult.error, 'Profile lookup');
      requireResult(interestsResult.error, 'Case interest lookup');
      requireResult(factsResult.error, 'Case fact lookup');
      requireResult(attachmentsResult.error, 'Case document lookup');
      requireResult(appointmentsResult.error, 'Case appointment lookup');
      if (!profileResult.data) return null;

      const profile = profileResult.data;
      return {
        profile: {
          id: profile.id,
          displayName:
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Mineral owner',
          timezone: profile.timezone,
          primaryMineralInterestId: profile.primary_mineral_interest_id,
          contactVerification: {
            email: Boolean(profile.email_verified_at),
            phone: Boolean(profile.phone_verified_at),
          },
          lastSeenAt: profile.last_seen_at,
          createdAt: profile.created_at,
        },
        mineralInterests: interestsResult.data ?? [],
        facts: factsResult.data ?? [],
        documents: attachmentsResult.data ?? [],
        appointments: appointmentsResult.data ?? [],
        excluded: ['email', 'phone', 'message content', 'raw OCR', 'storage paths'],
      };
    },

    async searchKnowledge({ query, stateCode, limit }) {
      let request = client
        .from('knowledge_documents')
        .select(
          'id,canonical_url,title,author_slug,reviewer_slugs,categories,tags,states,reviewed_at,updated_at',
        )
        .eq('published', true)
        .ilike('title', `%${escapeLike(query.trim())}%`)
        .order('reviewed_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (stateCode) request = request.contains('states', [stateCode.toUpperCase()]);
      const { data, error } = await request;
      requireResult(error, 'Knowledge search');
      return { results: data ?? [], count: data?.length ?? 0, limit };
    },

    async getKnowledgeDocument({ documentId }) {
      const { data, error } = await client
        .from('knowledge_documents')
        .select(
          'id,canonical_url,title,body,author_slug,reviewer_slugs,categories,tags,states,sources,reviewed_at,updated_at',
        )
        .eq('id', documentId)
        .eq('published', true)
        .maybeSingle();
      requireResult(error, 'Knowledge document lookup');
      return data ?? null;
    },

    async auditToolRead({ tool, success, durationMs, profileId, targetId, transport }) {
      if (!auditEnabled) return;
      const { error } = await client.from('audit_events').insert({
        profile_id: profileId ?? null,
        event_type: 'mcp.tool.read',
        target_type: tool,
        target_id: targetId ?? null,
        metadata: {
          success,
          duration_ms: durationMs,
          transport,
          access_mode: 'read-only',
        },
      });
      if (error) console.error(`[MRX MCP] audit insert failed: ${error.code}`);
    },
  };
}
