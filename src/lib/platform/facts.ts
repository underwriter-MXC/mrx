import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { runtimeEnv } from './runtime-env';
import { getSupabaseServer } from './supabase';
import { persistGeographyResolution, resolveUSGeography } from './geography';
import { runtimeComplianceCheck, normalizeMrxText } from './style';
import { documentMemoryForPrompt } from './documents';

const FactField = z.enum([
  'mineral_location',
  'state',
  'county',
  'city',
  'legal_description',
  'parcel_reference',
  'plss_id',
  'ownership_type',
  'inheritance',
  'net_mineral_acres',
  'offer_amount',
  'royalty_amount',
  'royalty_frequency',
  'operator',
  'lease_name',
  'well_name',
  'document_mentioned',
  'decision_goal',
]);

const ExtractionSchema = z.object({
  facts: z
    .array(
      z.object({
        field: FactField,
        value: z.string().min(1).max(500),
        confidence: z.number().min(0).max(1),
        ownerExplicitlyConfirmed: z.boolean(),
        sourceExcerpt: z.string().min(1).max(300),
        sourcePage: z.number().int().positive().nullable(),
      }),
    )
    .max(12),
  interest: z
    .object({
      label: z.string().max(120),
      state: z.string().max(80),
      county: z.string().max(120),
      city: z.string().max(120),
      operator: z.string().max(160),
      leaseName: z.string().max(160),
      legalDescription: z.string().max(8_000),
      parcelReference: z.string().max(240),
    })
    .nullable(),
});

let client: OpenAI | null | undefined;
function openai() {
  if (client !== undefined) return client;
  const apiKey = runtimeEnv('OPENAI_API_KEY');
  client = apiKey ? new OpenAI({ apiKey }) : null;
  return client;
}

export function sanitizeVisibleFactValue(field: string, value: string) {
  const normalized = normalizeMrxText(value);
  if (!normalized) return null;
  return runtimeComplianceCheck(normalized).flagged ? null : normalized;
}

async function persistFactRuntimeComplianceBlock(args: {
  conversationId: string;
  profileId: string;
  field: string;
  value: string;
  source: 'owner_chat' | 'document_ai';
}) {
  const compliance = runtimeComplianceCheck(args.value);
  await getSupabaseServer()
    ?.from('audit_events')
    .insert({
      profile_id: args.profileId,
      event_type: 'compliance_runtime_block',
      target_type: 'conversation',
      target_id: args.conversationId,
      metadata: {
        source: `facts.${args.source}`,
        field: args.field,
        match: compliance.match,
        rule: compliance.source,
        original_excerpt: args.value.slice(0, 500),
      },
    });
}

export async function extractOwnerFacts(args: {
  conversationId: string;
  profileId: string;
  messageId: string;
  text: string;
  mineralInterestId?: string | null;
}) {
  const ai = openai();
  const supabase = getSupabaseServer();
  if (!ai || !supabase || args.text.length < 3) return;
  const response = await ai.responses.parse({
    model: runtimeEnv('OPENAI_FACT_MODEL') || runtimeEnv('OPENAI_CHAT_MODEL') || 'gpt-5.6-luna',
    instructions:
      'Extract only mineral-owner facts explicitly present in the owner message. Never guess a county from a city or a city from a county. A fact is confirmed only when the owner states it directly; AI interpretation remains a candidate. Preserve legal descriptions exactly and keep the exact short supporting excerpt.',
    input: args.text,
    text: { format: zodTextFormat(ExtractionSchema, 'mrx_owner_facts') },
    reasoning: { effort: 'low' },
    store: false,
  });
  const parsed = response.output_parsed;
  if (!parsed) return;

  let interestId: string | null = args.mineralInterestId ?? null;
  if (
    !interestId &&
    parsed.interest &&
    (parsed.interest.state || parsed.interest.county || parsed.interest.operator)
  ) {
    const { data: existing } = await supabase
      .from('mineral_interests')
      .select('id')
      .eq('profile_id', args.profileId)
      .ilike('state', parsed.interest.state || '%')
      .ilike('county', parsed.interest.county || '%')
      .limit(1)
      .maybeSingle();
    if (existing) interestId = existing.id as string;
    else {
      const { data: created } = await supabase
        .from('mineral_interests')
        .insert({
          profile_id: args.profileId,
          conversation_id: args.conversationId,
          label:
            parsed.interest.label ||
            [parsed.interest.county, parsed.interest.state].filter(Boolean).join(', ') ||
            'Mineral interest',
          city: parsed.interest.city || null,
          state: parsed.interest.state || null,
          county: parsed.interest.county || null,
          operator: parsed.interest.operator || null,
          lease_name: parsed.interest.leaseName || null,
          legal_description: parsed.interest.legalDescription || null,
          parcel_reference: parsed.interest.parcelReference || null,
        })
        .select('id')
        .single();
      interestId = (created?.id as string) ?? null;
    }
  }
  if (interestId && parsed.interest) {
    const { error: interestError } = await supabase
      .from('mineral_interests')
      .update({
        city: parsed.interest.city || undefined,
        state: parsed.interest.state || undefined,
        county: parsed.interest.county || undefined,
        operator: parsed.interest.operator || undefined,
        lease_name: parsed.interest.leaseName || undefined,
        legal_description: parsed.interest.legalDescription || undefined,
        parcel_reference: parsed.interest.parcelReference || undefined,
      })
      .eq('id', interestId)
      .eq('profile_id', args.profileId);
    if (interestError) throw interestError;
  }

  if (!parsed.facts.length) return;
  const visibleFacts = parsed.facts.flatMap((fact) => {
    const value = sanitizeVisibleFactValue(fact.field, fact.value);
    return value ? [{ ...fact, value }] : [];
  });
  await Promise.all(
    parsed.facts
      .filter((fact) => !sanitizeVisibleFactValue(fact.field, fact.value))
      .map((fact) =>
        persistFactRuntimeComplianceBlock({
          conversationId: args.conversationId,
          profileId: args.profileId,
          field: fact.field,
          value: fact.value,
          source: 'owner_chat',
        }),
      ),
  );
  if (!visibleFacts.length) return;
  const { error } = await supabase.from('owner_facts').insert(
    visibleFacts.map((fact) => ({
      conversation_id: args.conversationId,
      profile_id: args.profileId,
      mineral_interest_id: interestId,
      field: fact.field,
      value: fact.value,
      source: 'owner_chat',
      source_message_id: args.messageId,
      source_excerpt: fact.sourceExcerpt,
      source_page: fact.sourcePage,
      confidence: fact.confidence,
      status: fact.ownerExplicitlyConfirmed ? 'confirmed' : 'candidate',
      confirmed_at: fact.ownerExplicitlyConfirmed ? new Date().toISOString() : null,
    })),
  );
  if (error) throw error;
}

export async function extractDocumentFacts(args: {
  attachmentId: string;
  conversationId: string;
  profileId: string;
  mineralInterestId?: string | null;
  redactedText: string;
}): Promise<string | null> {
  const ai = openai();
  const supabase = getSupabaseServer();
  if (!ai || !supabase || !args.redactedText.trim()) return args.mineralInterestId ?? null;
  const response = await ai.responses.parse({
    model: runtimeEnv('OPENAI_COMPLEX_MODEL') || runtimeEnv('OPENAI_FACT_MODEL') || 'gpt-5.6-terra',
    instructions:
      'Extract mineral-rights facts only from this already-redacted owner document. Never infer a county from a city or a city from a county. Preserve legal descriptions exactly. All extracted facts are candidates for owner or staff confirmation. Include the source page only when the redacted OCR clearly preserves page boundaries or page labels.',
    input: args.redactedText.slice(0, 250_000),
    text: { format: zodTextFormat(ExtractionSchema, 'mrx_document_facts') },
    reasoning: { effort: 'low' },
    store: false,
  });
  const parsed = response.output_parsed;
  if (!parsed) return args.mineralInterestId ?? null;
  let interestId = args.mineralInterestId ?? null;
  const geography = await resolveUSGeography(args.redactedText, {
    scope: 'mineral_interest',
    priorState: parsed.interest?.state,
    mode: 'document',
  });
  if (geography && geography.status !== 'not_found') {
    const saved = await persistGeographyResolution({
      sourceAttachmentId: args.attachmentId,
      conversationId: args.conversationId,
      profileId: args.profileId,
      resolution: geography,
    });
    interestId = saved.interestId ?? interestId;
  }
  if (!interestId && parsed.interest) {
    const { data: created, error: interestError } = await supabase
      .from('mineral_interests')
      .insert({
        profile_id: args.profileId,
        conversation_id: args.conversationId,
        label:
          parsed.interest.label ||
          [parsed.interest.county, parsed.interest.state].filter(Boolean).join(', ') ||
          'Mineral interest',
        city: parsed.interest.city || null,
        state: parsed.interest.state || null,
        county: parsed.interest.county || null,
        operator: parsed.interest.operator || null,
        lease_name: parsed.interest.leaseName || null,
        legal_description: parsed.interest.legalDescription || null,
        parcel_reference: parsed.interest.parcelReference || null,
      })
      .select('id')
      .single();
    if (interestError) throw interestError;
    interestId = created.id as string;
  }
  if (interestId) {
    const { data: existingInterest, error: interestLookupError } = await supabase
      .from('mineral_interests')
      .select('operator,lease_name,well_names,legal_description,parcel_reference')
      .eq('id', interestId)
      .eq('profile_id', args.profileId)
      .maybeSingle();
    if (interestLookupError) throw interestLookupError;
    const highConfidenceFactValue = (field: z.infer<typeof FactField>) => {
      const fact = parsed.facts.find((item) => item.field === field && item.confidence >= 0.8);
      return fact ? sanitizeVisibleFactValue(fact.field, fact.value) : null;
    };
    const operator = highConfidenceFactValue('operator');
    const leaseName = highConfidenceFactValue('lease_name');
    const legalDescription = highConfidenceFactValue('legal_description');
    const parcelReference = highConfidenceFactValue('parcel_reference');
    const wellNames = parsed.facts
      .filter((fact) => fact.field === 'well_name' && fact.confidence >= 0.8)
      .flatMap((fact) => {
        const value = sanitizeVisibleFactValue(fact.field, fact.value);
        return value ? [value] : [];
      });
    const interestUpdates = {
      ...(!existingInterest?.operator && operator ? { operator } : {}),
      ...(!existingInterest?.lease_name && leaseName ? { lease_name: leaseName } : {}),
      ...(!existingInterest?.legal_description && legalDescription
        ? { legal_description: legalDescription }
        : {}),
      ...(!existingInterest?.parcel_reference && parcelReference
        ? { parcel_reference: parcelReference }
        : {}),
      ...(!(existingInterest?.well_names as string[] | null)?.length && wellNames.length
        ? { well_names: wellNames }
        : {}),
    };
    if (Object.keys(interestUpdates).length) {
      const { error: interestUpdateError } = await supabase
        .from('mineral_interests')
        .update(interestUpdates)
        .eq('id', interestId)
        .eq('profile_id', args.profileId);
      if (interestUpdateError) throw interestUpdateError;
    }
  }
  if (!parsed.facts.length) return interestId;
  const visibleFacts = parsed.facts.flatMap((fact) => {
    const value = sanitizeVisibleFactValue(fact.field, fact.value);
    return value ? [{ ...fact, value }] : [];
  });
  await Promise.all(
    parsed.facts
      .filter((fact) => !sanitizeVisibleFactValue(fact.field, fact.value))
      .map((fact) =>
        persistFactRuntimeComplianceBlock({
          conversationId: args.conversationId,
          profileId: args.profileId,
          field: fact.field,
          value: fact.value,
          source: 'document_ai',
        }),
      ),
  );
  if (!visibleFacts.length) return interestId;
  const { error } = await supabase.from('owner_facts').insert(
    visibleFacts.map((fact) => ({
      conversation_id: args.conversationId,
      profile_id: args.profileId,
      mineral_interest_id: interestId,
      field: fact.field,
      value: fact.value,
      source: 'document_ai',
      source_attachment_id: args.attachmentId,
      source_page: fact.sourcePage,
      source_excerpt: fact.sourceExcerpt,
      confidence: fact.confidence,
      status: 'candidate',
    })),
  );
  if (error) throw error;
  return interestId;
}

export async function buildOwnerContext(conversationId: string, profileId: string, query = '') {
  const supabase = getSupabaseServer();
  if (!supabase)
    return { history: [], profile: {}, facts: [], interests: [], memory: [], lastPersona: 'travis' };
  const [messages, profile, facts, interests, memory] = await Promise.all([
    supabase
      .from('messages')
      .select('role,content,persona')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant', 'system'])
      .order('created_at', { ascending: false })
      .limit(16),
    supabase
      .from('profiles')
      .select('first_name,last_name,timezone,primary_mineral_interest_id')
      .eq('id', profileId)
      .maybeSingle(),
    supabase
      .from('owner_facts')
      .select('field,value,status,confidence,created_at')
      .eq('profile_id', profileId)
      .in('status', ['confirmed', 'candidate'])
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('mineral_interests')
      .select(
        'id,label,city,state,state_code,county,county_fips,place_geoid,latitude,longitude,location_precision,geography_status,geography_confidence,basin_name,basin_code,oil_gas_province,basin_status,basin_confidence,basin_source,operator,lease_name,well_names,ownership_type,net_mineral_acres,royalty_decimal,legal_description,parcel_reference,plss_id',
      )
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('owner_memory_chunks')
      .select('content,source_type')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);
  const relevantMemory = documentMemoryForPrompt(memory.data ?? [], query);
  const profileData = profile.data ?? {};
  const interestRows = interests.data ?? [];
  const messageRows = messages.data ?? [];
  const lastPersona =
    messageRows.find((message) => typeof message.persona === 'string')?.persona ?? 'travis';
  const primaryInterestId = (profileData as { primary_mineral_interest_id?: string })
    .primary_mineral_interest_id;
  if (primaryInterestId) {
    interestRows.sort(
      (a, b) => Number(b.id === primaryInterestId) - Number(a.id === primaryInterestId),
    );
  }
  return {
    history: [...messageRows]
      .reverse()
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
    profile: profileData,
    facts: facts.data ?? [],
    interests: interestRows,
    memory: relevantMemory,
    lastPersona,
  };
}
