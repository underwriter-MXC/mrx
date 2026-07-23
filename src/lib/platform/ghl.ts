import type { AppointmentOption, ContactProfile } from './types';
import { runtimeEnv } from './runtime-env';
import { normalizeMrxText } from './style';
import { testOutboundSuppressed } from './test-access';

const API_BASE = 'https://services.leadconnectorhq.com';
export const DEFAULT_MRX_CALENDAR_ID = 'mEqrbWIelaS7o5TMsqUX';
export const DEFAULT_MRX_EMAIL_FROM = 'underwriter@mineralrightsxchange.com';

type GhlConfig = {
  token: string;
  locationId: string | null;
  calendarId: string;
  assignedUserId: string | null;
  emailFrom: string;
  appointmentWorkflowId: string | null;
  prospectsPipelineId: string | null;
  prospectsStageId: string | null;
  appointmentsPipelineId: string | null;
  appointmentsStageId: string | null;
  sellersPipelineId: string | null;
  sellersStageId: string | null;
};

let resolvedLocation: GhlConfig | null = null;
let resolvedPipelines: {
  token: string;
  locationId: string;
  pipelines: Array<Record<string, any>>;
} | null = null;

function providerWritesDisabled() {
  return ['1', 'true', 'yes'].includes(
    String(runtimeEnv('MRX_DISABLE_GHL_PROVIDER_WRITES') || '').trim().toLowerCase(),
  );
}

function assertProviderWritesEnabled() {
  if (providerWritesDisabled()) throw new Error('ghl_provider_writes_disabled');
}

function config() {
  const token =
    runtimeEnv('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    runtimeEnv('MRX_GHL_API_KEY') ||
    runtimeEnv('GHL_API_TOKEN');
  const locationId = runtimeEnv('GHL_LOCATION_ID') || runtimeEnv('MRX_GHL_LOCATION_ID');
  const calendarId =
    runtimeEnv('GHL_CALENDAR_ID') || runtimeEnv('MRX_GHL_CALENDAR_ID') || DEFAULT_MRX_CALENDAR_ID;
  const assignedUserId = runtimeEnv('GHL_ASSIGNED_USER_ID');
  const emailFrom = runtimeEnv('GHL_EMAIL_FROM') || DEFAULT_MRX_EMAIL_FROM;
  const appointmentWorkflowId = runtimeEnv('GHL_APPOINTMENT_WORKFLOW_ID');
  const prospectsPipelineId = runtimeEnv('GHL_PROSPECTS_PIPELINE_ID');
  const prospectsStageId = runtimeEnv('GHL_PROSPECTS_CONTACTED_STAGE_ID');
  const appointmentsPipelineId = runtimeEnv('GHL_APPOINTMENTS_PIPELINE_ID');
  const appointmentsStageId = runtimeEnv('GHL_APPOINTMENT_BOOKED_STAGE_ID');
  const sellersPipelineId = runtimeEnv('GHL_SELLERS_PIPELINE_ID');
  const sellersStageId = runtimeEnv('GHL_SELLERS_OFFER_SENT_STAGE_ID');
  return token
    ? {
        token,
        locationId: locationId || null,
        calendarId,
        assignedUserId: assignedUserId || null,
        emailFrom,
        appointmentWorkflowId: appointmentWorkflowId || null,
        prospectsPipelineId: prospectsPipelineId || null,
        prospectsStageId: prospectsStageId || null,
        appointmentsPipelineId: appointmentsPipelineId || null,
        appointmentsStageId: appointmentsStageId || null,
        sellersPipelineId: sellersPipelineId || null,
        sellersStageId: sellersStageId || null,
      }
    : null;
}

async function configWithLocation() {
  const settings = config();
  if (!settings) throw new Error('GHL is not configured');
  if (settings.locationId) return settings as GhlConfig & { locationId: string };
  const cached = resolvedLocation;
  if (
    cached &&
    cached.token === settings.token &&
    cached.calendarId === settings.calendarId &&
    cached.locationId
  ) {
    return cached as GhlConfig & { locationId: string };
  }
  const response = await fetch(`${API_BASE}/calendars/${encodeURIComponent(settings.calendarId)}`, {
    headers: headers(settings.token, 'v3'),
  });
  if (!response.ok) throw new Error(`GHL calendar lookup failed (${response.status})`);
  const data = await response.json();
  const locationId = data.calendar?.locationId || data.locationId;
  if (!locationId) throw new Error('GHL calendar location is unavailable');
  resolvedLocation = { ...settings, locationId };
  return resolvedLocation as GhlConfig & { locationId: string };
}

function headers(token: string, version = '2021-07-28') {
  return {
    Authorization: `Bearer ${token}`,
    Version: version,
    'Content-Type': 'application/json',
  };
}

export function ghlConfigured() {
  return Boolean(config());
}

export function ghlMessagingConfigured() {
  return Boolean(config());
}

function channelDndSettings(profile: ContactProfile, restoreGrantedChannels = false) {
  const dndSettings: Record<
    'Email' | 'SMS' | 'Call',
    { status: 'active' | 'inactive'; message?: string; code?: string }
  > = {} as Record<
    'Email' | 'SMS' | 'Call',
    { status: 'active' | 'inactive'; message?: string; code?: string }
  >;
  const permissions = {
    Email: profile.permissions.email,
    SMS: profile.permissions.sms,
    Call: profile.permissions.call,
  } as const;

  for (const [channel, granted] of Object.entries(permissions) as Array<
    ['Email' | 'SMS' | 'Call', boolean]
  >) {
    if (granted) {
      if (restoreGrantedChannels) {
        dndSettings[channel] = { status: 'inactive' };
      }
    } else {
      dndSettings[channel] = {
        status: 'active',
        message: `MRX ${channel.toLowerCase()} permission was declined`,
        code: 'MRX_PERMISSION_DECLINED',
      };
    }
  }

  return dndSettings;
}

function transcriptionText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value.map(transcriptionText).filter(Boolean).join('\n').trim();
  }
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  for (const key of ['transcription', 'transcript', 'plainText', 'text', 'body', 'content']) {
    const result = transcriptionText(record[key]);
    if (result) return result;
  }
  for (const key of ['segments', 'utterances', 'results', 'data', 'message']) {
    const result = transcriptionText(record[key]);
    if (result) return result;
  }
  return '';
}

export function extractGhlTranscription(value: unknown) {
  return transcriptionText(value);
}

export async function getGhlCallTranscription(messageId: string, locationId?: string) {
  const settings = await configWithLocation();
  const resolvedLocationId = locationId || settings.locationId;
  const response = await fetch(
    `${API_BASE}/conversations/locations/${encodeURIComponent(resolvedLocationId)}/messages/${encodeURIComponent(messageId)}/transcription`,
    { headers: headers(settings.token, 'v3') },
  );
  if (!response.ok) {
    if ([400, 404, 409, 425].includes(response.status)) return null;
    throw new Error(`GHL call transcription lookup failed (${response.status})`);
  }
  const raw = await response.text();
  if (!raw.trim()) return null;
  try {
    return extractGhlTranscription(JSON.parse(raw)) || null;
  } catch {
    return raw.trim() || null;
  }
}

async function getBusinessPipelines() {
  const settings = await configWithLocation();
  if (
    resolvedPipelines?.token === settings.token &&
    resolvedPipelines.locationId === settings.locationId
  ) {
    return resolvedPipelines.pipelines;
  }
  const response = await fetch(
    `${API_BASE}/opportunities/pipelines?locationId=${encodeURIComponent(settings.locationId)}`,
    { headers: headers(settings.token, 'v3') },
  );
  if (!response.ok) throw new Error(`GHL pipeline lookup failed (${response.status})`);
  const payload = await response.json();
  const pipelines = Array.isArray(payload.pipelines) ? payload.pipelines : [];
  resolvedPipelines = { token: settings.token, locationId: settings.locationId, pipelines };
  return pipelines;
}

async function resolveBusinessStage(pipelineName: string, stageName: string) {
  const pipelines = await getBusinessPipelines();
  const pipeline = pipelines.find(
    (item: Record<string, any>) =>
      String(item.name || '')
        .trim()
        .toLowerCase() === pipelineName.toLowerCase(),
  );
  const stage = pipeline?.stages?.find(
    (item: Record<string, any>) =>
      String(item.name || '')
        .trim()
        .toLowerCase() === stageName.toLowerCase(),
  );
  return pipeline?.id && stage?.id
    ? { pipelineId: String(pipeline.id), pipelineStageId: String(stage.id) }
    : null;
}

export async function upsertContact(
  profile: ContactProfile,
  options: {
    syncOpportunity?: boolean;
    allowTransactionalEmail?: boolean;
    restoreExplicitlyGrantedChannels?: boolean;
  } = {},
) {
  assertProviderWritesEnabled();
  if (
    testOutboundSuppressed({
      is_test: profile.ownerMetadata?.isTest,
      test_run_id: profile.ownerMetadata?.testRunId,
    })
  ) {
    throw new Error('test_profile_outbound_suppressed');
  }
  const settings = await configWithLocation();
  const dndSettings = channelDndSettings(
    {
      ...profile,
      permissions: {
        ...profile.permissions,
        email: options.allowTransactionalEmail ? true : profile.permissions.email,
      },
    },
    options.restoreExplicitlyGrantedChannels,
  );
  const response = await fetch(`${API_BASE}/contacts/upsert`, {
    method: 'POST',
    headers: headers(settings.token),
    body: JSON.stringify({
      locationId: settings.locationId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      ...(profile.email ? { email: profile.email } : {}),
      ...(profile.phone ? { phone: profile.phone } : {}),
      ...(profile.timezone ? { timezone: profile.timezone } : {}),
      ...(Object.keys(dndSettings).length ? { dndSettings } : {}),
      source: 'Ask Tommy',
      tags: [
        'ask-tommy',
        'website-owner',
        ...(profile.ownerMetadata?.testRunId ? ['mrx-staging-test'] : []),
      ],
      customFields: [
        { key: 'contact.mrx_email_permission', fieldValue: String(profile.permissions.email) },
        { key: 'contact.mrx_sms_permission', fieldValue: String(profile.permissions.sms) },
        {
          key: 'contact.mrx_marketing_sms_permission',
          fieldValue: String(profile.permissions.marketingSms),
        },
        { key: 'contact.mrx_call_permission', fieldValue: String(profile.permissions.call) },
        {
          key: 'contact.mrx_ai_voice_permission',
          fieldValue: String(profile.permissions.aiVoice),
        },
        { key: 'contact.mrx_owner_location', fieldValue: profile.location || '' },
        { key: 'contact.mrx_owner_state', fieldValue: profile.ownerMetadata?.state || '' },
        { key: 'contact.mrx_owner_county', fieldValue: profile.ownerMetadata?.county || '' },
        { key: 'contact.mrx_mineral_city', fieldValue: profile.ownerMetadata?.city || '' },
        {
          key: 'contact.mrx_mineral_state_code',
          fieldValue: profile.ownerMetadata?.stateCode || '',
        },
        {
          key: 'contact.mrx_mineral_county_fips',
          fieldValue: profile.ownerMetadata?.countyFips || '',
        },
        {
          key: 'contact.mrx_geography_status',
          fieldValue: profile.ownerMetadata?.geographyStatus || '',
        },
        {
          key: 'contact.mrx_location_precision',
          fieldValue: profile.ownerMetadata?.locationPrecision || '',
        },
        {
          key: 'contact.mrx_legal_description',
          fieldValue: profile.ownerMetadata?.legalDescription || '',
        },
        { key: 'contact.mrx_plss_id', fieldValue: profile.ownerMetadata?.plssId || '' },
        {
          key: 'contact.mrx_residence_city',
          fieldValue: profile.ownerMetadata?.residenceCity || '',
        },
        {
          key: 'contact.mrx_residence_state',
          fieldValue: profile.ownerMetadata?.residenceState || '',
        },
        {
          key: 'contact.mrx_residence_county',
          fieldValue: profile.ownerMetadata?.residenceCounty || '',
        },
        { key: 'contact.mrx_operator', fieldValue: profile.ownerMetadata?.operator || '' },
        { key: 'contact.mrx_situation', fieldValue: profile.ownerMetadata?.situation || '' },
        { key: 'contact.mrx_offer_status', fieldValue: profile.ownerMetadata?.offerStatus || '' },
        {
          key: 'contact.mrx_document_status',
          fieldValue: profile.ownerMetadata?.documentStatus || '',
        },
        {
          key: 'contact.mrx_documents_needed',
          fieldValue: profile.ownerMetadata?.documentsNeeded || '',
        },
        {
          key: 'contact.mrx_underwriting_readiness',
          fieldValue: profile.ownerMetadata?.underwritingReadiness || '',
        },
        { key: 'contact.mrx_appointment', fieldValue: profile.ownerMetadata?.appointment || '' },
        {
          key: 'contact.mrx_sanitized_summary',
          fieldValue: profile.ownerMetadata?.sanitizedSummary || '',
        },
        {
          key: 'contact.mrx_ownership_type',
          fieldValue: profile.ownerMetadata?.ownershipType || '',
        },
        {
          key: 'contact.mrx_net_mineral_acres',
          fieldValue: profile.ownerMetadata?.netMineralAcres || '',
        },
        {
          key: 'contact.mrx_royalty_decimal',
          fieldValue: profile.ownerMetadata?.royaltyDecimal || '',
        },
        { key: 'contact.mrx_lease_name', fieldValue: profile.ownerMetadata?.leaseName || '' },
        { key: 'contact.mrx_well_names', fieldValue: profile.ownerMetadata?.wellNames || '' },
        { key: 'contact.mrx_offer_amount', fieldValue: profile.ownerMetadata?.offerAmount || '' },
        {
          key: 'contact.mrx_royalty_amount',
          fieldValue: profile.ownerMetadata?.royaltyAmount || '',
        },
        {
          key: 'contact.mrx_royalty_frequency',
          fieldValue: profile.ownerMetadata?.royaltyFrequency || '',
        },
        {
          key: 'contact.mrx_number_of_interests',
          fieldValue: profile.ownerMetadata?.numberOfInterests || '',
        },
        {
          key: 'contact.mrx_primary_operator',
          fieldValue: profile.ownerMetadata?.primaryOperator || '',
        },
        { key: 'contact.mrx_interest_type', fieldValue: profile.ownerMetadata?.interestType || '' },
        { key: 'contact.mrx_operator_tier', fieldValue: profile.ownerMetadata?.operatorTier || '' },
        {
          key: 'contact.mrx_development_status',
          fieldValue: profile.ownerMetadata?.developmentStatus || '',
        },
        { key: 'contact.mrx_basin_region', fieldValue: profile.ownerMetadata?.basinRegion || '' },
        {
          key: 'contact.mrx_rrc_lease_number',
          fieldValue: profile.ownerMetadata?.rrcLeaseNumber || '',
        },
        {
          key: 'contact.mrx_competing_offer_received',
          fieldValue: profile.ownerMetadata?.competingOfferReceived || '',
        },
        {
          key: 'contact.mrx_competing_offer_amount',
          fieldValue: profile.ownerMetadata?.competingOfferAmount || '',
        },
        {
          key: 'contact.mrx_appointment_status',
          fieldValue: profile.ownerMetadata?.appointmentStatus || '',
        },
        { key: 'contact.mrx_booked_by', fieldValue: profile.ownerMetadata?.bookedBy || '' },
        {
          key: 'contact.mrx_consent_version',
          fieldValue: profile.ownerMetadata?.consentVersion || profile.disclosureVersion,
        },
        {
          key: 'contact.mrx_phone_verified',
          fieldValue: profile.ownerMetadata?.phoneVerified || 'false',
        },
        {
          key: 'contact.mrx_1031_interest',
          fieldValue: profile.ownerMetadata?.is1031Interest || '',
        },
        {
          key: 'contact.mrx_full_conversation_synced',
          fieldValue: profile.ownerMetadata?.fullConversationSynced || '',
        },
        {
          key: 'contact.mrx_source_url',
          fieldValue: profile.ownerMetadata?.sourceUrl || profile.sourceUrl,
        },
        { key: 'contact.mrx_utm_source', fieldValue: profile.ownerMetadata?.utmSource || '' },
        { key: 'contact.mrx_utm_medium', fieldValue: profile.ownerMetadata?.utmMedium || '' },
        { key: 'contact.mrx_utm_campaign', fieldValue: profile.ownerMetadata?.utmCampaign || '' },
        { key: 'contact.mrx_utm_content', fieldValue: profile.ownerMetadata?.utmContent || '' },
        { key: 'contact.mrx_utm_term', fieldValue: profile.ownerMetadata?.utmTerm || '' },
        {
          key: 'contact.mrx_lead_source_tag',
          fieldValue: profile.ownerMetadata?.leadSourceTag || 'PLATFORM',
        },
        { key: 'contact.mrx_ai_engaged', fieldValue: 'true' },
        { key: 'contact.mrx_test_run_id', fieldValue: profile.ownerMetadata?.testRunId || '' },
      ],
    }),
  });
  if (!response.ok) throw new Error(`GHL contact upsert failed (${response.status})`);
  const data = await response.json();
  const contactId = data.contact?.id || data.id;
  const prospectsStage =
    options.syncOpportunity === false
      ? null
      : settings.prospectsPipelineId && settings.prospectsStageId
        ? {
            pipelineId: settings.prospectsPipelineId,
            pipelineStageId: settings.prospectsStageId,
          }
        : await resolveBusinessStage('Prospects', 'Contacted').catch(() => null);
  if (contactId && prospectsStage && options.syncOpportunity !== false) {
    await upsertOpportunity({
      contactId,
      ...prospectsStage,
      name: `${profile.firstName} ${profile.lastName || ''} mineral-rights inquiry`.trim(),
      status: 'open',
    });
  }
  return contactId;
}

async function upsertOpportunity(args: {
  contactId: string;
  pipelineId: string;
  pipelineStageId: string;
  name: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
}) {
  assertProviderWritesEnabled();
  const settings = await configWithLocation();
  const response = await fetch(`${API_BASE}/opportunities/upsert`, {
    method: 'POST',
    headers: headers(settings.token, 'v3'),
    body: JSON.stringify({ ...args, locationId: settings.locationId }),
  });
  if (!response.ok) throw new Error(`GHL opportunity upsert failed (${response.status})`);
  const data = await response.json();
  return data.opportunity?.id || data.id || null;
}

export async function syncGhlOwnerCaseOpportunity(args: {
  contactId: string;
  opportunityName: string;
  pipelineId?: string | null;
  pipelineStageId?: string | null;
  pipelineName?: string | null;
  stageName?: string | null;
  monetaryValue?: number | null;
  status: 'open' | 'won' | 'lost' | 'abandoned';
}) {
  assertProviderWritesEnabled();
  if (!config()) return null;
  const resolved =
    args.pipelineId && args.pipelineStageId
      ? { pipelineId: args.pipelineId, pipelineStageId: args.pipelineStageId }
      : args.pipelineName && args.stageName
        ? await resolveBusinessStage(args.pipelineName, args.stageName)
        : null;
  if (!resolved) return null;
  const opportunityId = await upsertOpportunity({
    contactId: args.contactId,
    ...resolved,
    name: args.opportunityName,
    status: args.status,
    ...(args.monetaryValue == null ? {} : { monetaryValue: args.monetaryValue }),
  });
  return {
    opportunityId,
    pipelineId: resolved.pipelineId,
    pipelineStageId: resolved.pipelineStageId,
    pipelineName: args.pipelineName || null,
    stageName: args.stageName || null,
  };
}

export type MrxPipelineEvent =
  | 'prospect.record_added'
  | 'prospect.outreach_initiated'
  | 'prospect.contacted'
  | 'prospect.not_qualified'
  | 'appointment.booked'
  | 'appointment.confirmed'
  | 'appointment.completed'
  | 'appointment.offer_pending'
  | 'appointment.rescheduled'
  | 'appointment.no_show'
  | 'appointment.not_a_fit'
  | 'seller.offer_sent'
  | 'seller.offer_viewed'
  | 'seller.offer_signed'
  | 'seller.due_diligence'
  | 'seller.documents_complete'
  | 'seller.title_review'
  | 'seller.closing_scheduled'
  | 'seller.closed'
  | 'seller.dead';

const pipelineEventMap: Record<MrxPipelineEvent, [string, string]> = {
  'prospect.record_added': ['Prospects', 'Record Added'],
  'prospect.outreach_initiated': ['Prospects', 'Outreach Initiated'],
  'prospect.contacted': ['Prospects', 'Contacted'],
  'prospect.not_qualified': ['Prospects', 'Not Qualified'],
  'appointment.booked': ['Appointments', 'Appointment Booked'],
  'appointment.confirmed': ['Appointments', 'Appointment Confirmed'],
  'appointment.completed': ['Appointments', 'Appointment Completed'],
  'appointment.offer_pending': ['Appointments', 'Offer Pending'],
  'appointment.rescheduled': ['Appointments', 'Rescheduled'],
  'appointment.no_show': ['Appointments', 'No Show'],
  'appointment.not_a_fit': ['Appointments', 'Not a Fit'],
  'seller.offer_sent': ['Sellers', 'Offer Sent'],
  'seller.offer_viewed': ['Sellers', 'Offer Viewed'],
  'seller.offer_signed': ['Sellers', 'Offer Signed'],
  'seller.due_diligence': ['Sellers', 'Due Diligence Active'],
  'seller.documents_complete': ['Sellers', 'Documents Complete'],
  'seller.title_review': ['Sellers', 'Title Review'],
  'seller.closing_scheduled': ['Sellers', 'Closing Scheduled'],
  'seller.closed': ['Sellers', 'Closed - PLATFORM'],
  'seller.dead': ['Sellers', 'Dead'],
};

export async function mapContactToBusinessPipeline(args: {
  contactId: string;
  event: MrxPipelineEvent;
  name: string;
}) {
  assertProviderWritesEnabled();
  const [pipelineName, stageName] = pipelineEventMap[args.event];
  const resolved = await resolveBusinessStage(pipelineName, stageName);
  if (!resolved) return null;
  return upsertOpportunity({
    contactId: args.contactId,
    ...resolved,
    name: args.name,
    status: args.event === 'seller.closed' ? 'won' : args.event === 'seller.dead' ? 'lost' : 'open',
  });
}

export async function completeDocumentFollowUp(contactId: string) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) return null;
  const requests: Array<Promise<Response>> = [
    fetch(`${API_BASE}/contacts/${encodeURIComponent(contactId)}/tags`, {
      method: 'POST',
      headers: headers(settings.token, 'v3'),
      body: JSON.stringify({ tags: ['mrx-documents-received'] }),
    }),
    fetch(`${API_BASE}/contacts/${encodeURIComponent(contactId)}`, {
      method: 'PUT',
      headers: headers(settings.token, 'v3'),
      body: JSON.stringify({
        customFields: [{ key: 'contact.mrx_follow_up_status', fieldValue: 'documents_received' }],
      }),
    }),
  ];
  if (settings.appointmentWorkflowId) {
    requests.push(
      fetch(
        `${API_BASE}/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(settings.appointmentWorkflowId)}`,
        { method: 'DELETE', headers: headers(settings.token, 'v3') },
      ),
    );
  }
  const results = await Promise.allSettled(requests);
  return results.map((result) => result.status === 'fulfilled' && result.value.ok);
}

function localDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatAvailabilitySlots(
  raw: unknown[],
  timezone: string,
  preference?: string,
  requestedDay?: 'tomorrow' | 'next_available',
  now = new Date(),
): AppointmentOption[] {
  const period = preference?.toLowerCase();
  const targetDate =
    requestedDay === 'tomorrow'
      ? localDateKey(new Date(now.getTime() + 24 * 60 * 60_000), timezone)
      : null;
  const seen = new Set<string>();
  return raw
    .map((slot: any) => {
      const startValue = typeof slot === 'string' ? slot : slot?.startTime || slot?.start;
      if (!startValue) return null;
      const startDate = new Date(startValue);
      if (Number.isNaN(startDate.getTime())) return null;
      if (targetDate && localDateKey(startDate, timezone) !== targetDate) return null;
      const endValue =
        typeof slot === 'string'
          ? new Date(startDate.getTime() + 30 * 60_000).toISOString()
          : slot.endTime || slot.end || new Date(startDate.getTime() + 30 * 60_000).toISOString();
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hourCycle: 'h23',
          timeZone: timezone,
        }).format(startDate),
      );
      if (period?.includes('morning') && hour >= 12) return null;
      if (period?.includes('afternoon') && (hour < 12 || hour >= 17)) return null;
      if (period?.includes('evening') && hour < 17) return null;
      const id = startDate.toISOString();
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        start: id,
        end: new Date(endValue).toISOString(),
        timezone,
        label: new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: timezone,
        }).format(startDate),
      } satisfies AppointmentOption;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3) as AppointmentOption[];
}

export function extractAvailabilitySlots(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const value = payload as Record<string, unknown>;
  const direct = value.slots || value.freeSlots;
  if (Array.isArray(direct)) return direct;
  return Object.values(value).flatMap(extractAvailabilitySlots);
}

export async function getAvailability(
  timezone: string,
  preference?: string,
  requestedDay?: 'tomorrow' | 'next_available',
): Promise<AppointmentOption[]> {
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const start = Date.now();
  const end = start + 14 * 24 * 60 * 60 * 1000;
  const url = new URL(`${API_BASE}/calendars/${settings.calendarId}/free-slots`);
  url.searchParams.set('startDate', String(start));
  url.searchParams.set('endDate', String(end));
  url.searchParams.set('timezone', timezone);
  const response = await fetch(url, { headers: headers(settings.token, 'v3') });
  if (!response.ok) throw new Error(`GHL availability failed (${response.status})`);
  const data = await response.json();
  const raw = extractAvailabilitySlots(data);
  return formatAvailabilitySlots(raw, timezone, preference, requestedDay);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ||
      character,
  );
}

function sanitizeGhlErrorDetail(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, '[redacted-url]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

async function ghlErrorDetail(response: Response) {
  const requestId =
    response.headers.get('x-request-id') ||
    response.headers.get('x-correlation-id') ||
    response.headers.get('cf-ray');
  const body = await response.text().catch(() => '');
  const detail = sanitizeGhlErrorDetail(body);
  return [detail, requestId ? `request_id=${requestId}` : ''].filter(Boolean).join('; ');
}

async function sendGhlMessage(args: {
  contactId: string;
  type: 'Email' | 'SMS' | 'InternalComment';
  message: string;
  subject?: string;
  html?: string;
  appointmentId?: string;
  emailTo?: string;
  emailFrom?: string;
  toNumber?: string;
  userId?: string;
}) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL messaging is not configured');
  const outbound =
    args.type === 'InternalComment'
      ? args
      : {
          ...args,
          message: normalizeMrxText(args.message),
          subject: args.subject ? normalizeMrxText(args.subject) : undefined,
          html: args.html ? normalizeMrxText(args.html) : undefined,
        };
  const response = await fetch(`${API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: headers(settings.token, 'v3'),
    body: JSON.stringify({
      ...outbound,
      ...(args.type === 'Email' ? { emailFrom: args.emailFrom || settings.emailFrom } : {}),
      status: args.type === 'InternalComment' ? 'delivered' : 'pending',
    }),
  });
  if (!response.ok) {
    const detail = await ghlErrorDetail(response);
    throw new Error(
      `GHL ${args.type.toLowerCase()} failed (${response.status})${detail ? `: ${detail}` : ''}`,
    );
  }
  const data = await response.json();
  const messageId = data.messageId as string | undefined;
  if (args.type !== 'InternalComment' && !messageId) {
    throw new Error(`GHL ${args.type.toLowerCase()} accepted without a message id`);
  }
  return messageId;
}

function conversationChunks(value: string, max = 12_000) {
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += max) {
    chunks.push(value.slice(offset, offset + max));
  }
  return chunks.length ? chunks : [''];
}

export async function appendGhlConversationText(args: {
  contactId: string;
  source: string;
  text: string;
  occurredAt?: string | null;
  externalId?: string | null;
}) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL messaging is not configured');
  const text = args.text || '(no text provided)';
  const chunks = conversationChunks(text);
  const messageIds: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const label = chunks.length > 1 ? `, part ${index + 1} of ${chunks.length}` : '';
    const header = [
      `[MRX ${args.source}${label}]`,
      args.occurredAt ? `Occurred: ${args.occurredAt}` : '',
      args.externalId ? `Source ID: ${args.externalId}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const messageId = await sendGhlMessage({
      contactId: args.contactId,
      type: 'InternalComment',
      message: `${header}\n\n${chunks[index]}`,
      ...(settings.assignedUserId ? { userId: settings.assignedUserId } : {}),
    });
    if (messageId) messageIds.push(messageId);
  }
  return messageIds;
}

export async function updateGhlContactFields(
  contactId: string,
  customFields: Array<{ key: string; fieldValue: string }>,
) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL is not configured');
  const response = await fetch(`${API_BASE}/contacts/${encodeURIComponent(contactId)}`, {
    method: 'PUT',
    headers: headers(settings.token, 'v3'),
    body: JSON.stringify({ customFields }),
  });
  if (!response.ok) throw new Error(`GHL contact field update failed (${response.status})`);
}

export async function enrollContactInGhlWorkflow(
  contactId: string,
  workflowId: string,
  metadata?: Record<string, unknown>,
) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL is not configured');
  const response = await fetch(
    `${API_BASE}/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(workflowId)}`,
    {
      method: 'POST',
      headers: headers(settings.token, 'v3'),
      body: JSON.stringify(metadata || {}),
    },
  );
  if (!response.ok) throw new Error(`GHL workflow enrollment failed (${response.status})`);
  return response.json().catch(() => ({}));
}

export async function sendRequestedInformation(args: {
  profile: ContactProfile;
  channels: Array<'email' | 'sms'>;
  answer: string;
  link: string;
}) {
  const contactId = await upsertContact(args.profile);
  const sent: Array<'email' | 'sms'> = [];
  const failures: Array<'email' | 'sms'> = [];
  for (const channel of args.channels) {
    try {
      if (channel === 'email' && args.profile.email && args.profile.permissions.email) {
        const normalizedAnswer = normalizeMrxText(args.answer);
        const safeAnswer = escapeHtml(normalizedAnswer).replace(/\n/g, '<br />');
        await sendGhlMessage({
          contactId,
          type: 'Email',
          emailTo: args.profile.email,
          subject: 'The MRX information you asked Tommy to send',
          message: `${normalizedAnswer}\n\nOpen the related MRX page: ${args.link}`,
          html: `<p>Hi ${escapeHtml(args.profile.firstName)},</p><p>${safeAnswer}</p><p><a href="${escapeHtml(args.link)}">Open the related MRX page</a></p><p>Tommy, MRX Offer and Value Guide</p>`,
        });
        sent.push('email');
      } else if (channel === 'sms' && args.profile.phone && args.profile.permissions.sms) {
        await sendGhlMessage({
          contactId,
          type: 'SMS',
          toNumber: args.profile.phone,
          message: `Hi ${args.profile.firstName}, here’s the MRX information you asked Tommy to send: ${args.link} Reply STOP to opt out or HELP for help.`,
        });
        sent.push('sms');
      } else {
        failures.push(channel);
      }
    } catch {
      failures.push(channel);
    }
  }
  return { contactId, sent, failures };
}

export async function sendGhlIntakeChecklist(args: {
  profile: ContactProfile;
  channels: Array<'email' | 'sms'>;
  propertyLabel: string;
  missingFields: string[];
  accountLink: string;
}) {
  const contactId = await upsertContact(args.profile, { syncOpportunity: false });
  const sent: Array<'email' | 'sms'> = [];
  const failures: Array<'email' | 'sms'> = [];
  const checklist = args.missingFields.map((item) => `- ${normalizeMrxText(item)}`).join('\n');
  const plain = [
    `Angela saved ${normalizeMrxText(args.propertyLabel)} to your private MRX owner profile.`,
    '',
    'If you find any of these details, reply to this message or send pictures:',
    checklist,
    '',
    `You may also email pictures or documents to ${DEFAULT_MRX_EMAIL_FROM}.`,
    `Open your private profile: ${args.accountLink}`,
    '',
    'It is okay if you do not have everything. These details simply help the Senior Underwriter prepare a more useful assessment before your call.',
  ].join('\n');

  await Promise.all(
    args.channels.map(async (channel) => {
      try {
        if (channel === 'email' && args.profile.email && args.profile.permissions.email) {
          const items = args.missingFields
            .map((item) => `<li>${escapeHtml(normalizeMrxText(item))}</li>`)
            .join('');
          await sendGhlMessage({
            contactId,
            type: 'Email',
            emailTo: args.profile.email,
            subject: `Your MRX property checklist: ${normalizeMrxText(args.propertyLabel)}`,
            message: plain,
            html: `<p>Hi ${escapeHtml(args.profile.firstName)},</p><p>Angela saved <strong>${escapeHtml(normalizeMrxText(args.propertyLabel))}</strong> to your private MRX owner profile.</p><p>If you find any of these details, reply to this email or send pictures:</p><ul>${items}</ul><p>You may also email pictures or documents to <a href="mailto:${DEFAULT_MRX_EMAIL_FROM}">${DEFAULT_MRX_EMAIL_FROM}</a>.</p><p><a href="${escapeHtml(args.accountLink)}">Open your private MRX profile</a></p><p>It is okay if you do not have everything. These details simply help the Senior Underwriter prepare a more useful assessment before your call.</p>`,
          });
          sent.push('email');
        } else if (channel === 'sms' && args.profile.phone && args.profile.permissions.sms) {
          await sendGhlMessage({
            contactId,
            type: 'SMS',
            toNumber: args.profile.phone,
            message: `Hi ${args.profile.firstName}, Angela saved ${args.propertyLabel}. Helpful if available: ${args.missingFields.join('; ')}. Reply here with details or pictures, or email ${DEFAULT_MRX_EMAIL_FROM}. Profile: ${args.accountLink} Reply STOP to opt out or HELP for help.`,
          });
          sent.push('sms');
        } else {
          failures.push(channel);
        }
      } catch {
        failures.push(channel);
      }
    }),
  );
  return { contactId, sent, failures };
}

export async function sendGhlMemberAccessEmail(args: {
  contactId: string;
  email: string;
  firstName: string;
  actionLink: string;
}) {
  const message = `Open your secure MRX owner account: ${args.actionLink}\n\nThis one-time link connects your appointment, conversations, and private documents.`;
  return sendGhlMessage({
    contactId: args.contactId,
    type: 'Email',
    emailTo: args.email,
    subject: 'Your secure MRX owner-account sign-in link',
    message,
    html: `<p>Hi ${escapeHtml(args.firstName)},</p><p>Your secure MRX owner account is ready.</p><p><a href="${escapeHtml(args.actionLink)}">Open my MRX owner account</a></p><p>This one-time link connects your appointment, conversations, and private documents.</p>`,
  });
}

export async function bookAppointment(args: {
  profile: ContactProfile;
  option: AppointmentOption;
  notes?: string;
}) {
  assertProviderWritesEnabled();
  const settings = await configWithLocation();
  const contactId = await upsertContact(args.profile, {
    restoreExplicitlyGrantedChannels: true,
  });
  const response = await fetch(`${API_BASE}/calendars/events/appointments`, {
    method: 'POST',
    // HighLevel documents assignedUserId on the 2021-07-28 appointment
    // contract. The v3 endpoint accepts the field but can silently drop the
    // owner, which prevents the appointment from syncing to the user's linked
    // Google Calendar.
    headers: headers(settings.token, '2021-07-28'),
    body: JSON.stringify({
      calendarId: settings.calendarId,
      locationId: settings.locationId,
      contactId,
      ...(settings.assignedUserId ? { assignedUserId: settings.assignedUserId } : {}),
      startTime: args.option.start,
      endTime: args.option.end,
      title: `MRX senior underwriter phone review: ${args.profile.firstName}`,
      appointmentStatus: 'confirmed',
      address: 'Phone call',
      // Disable calendar-default notifications so an unselected channel can
      // never send. Explicit confirmations are sent below from the separately
      // recorded email and SMS permission choices.
      toNotify: false,
      ignoreDateRange: false,
      notes: args.notes?.slice(0, 2000),
    }),
  });
  if (!response.ok) throw new Error(`GHL appointment failed (${response.status})`);
  const data = await response.json();
  const appointmentId = data.id || data.event?.id;
  const appointmentStage =
    settings.appointmentsPipelineId && settings.appointmentsStageId
      ? {
          pipelineId: settings.appointmentsPipelineId,
          pipelineStageId: settings.appointmentsStageId,
        }
      : await resolveBusinessStage('Appointments', 'Appointment Booked').catch(() => null);
  if (appointmentStage) {
    await upsertOpportunity({
      contactId,
      ...appointmentStage,
      name: `${args.profile.firstName} MRX senior underwriter appointment`,
      status: 'open',
    });
  }
  let workflowEnrolled = false;
  if (settings.appointmentWorkflowId) {
    try {
      const workflowResponse = await fetch(
        `${API_BASE}/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(settings.appointmentWorkflowId)}`,
        {
          method: 'POST',
          headers: headers(settings.token, 'v3'),
          body: JSON.stringify({ eventStartTime: args.option.start }),
        },
      );
      workflowEnrolled = workflowResponse.ok;
    } catch {
      workflowEnrolled = false;
    }
  }
  const notifications: Array<'email' | 'sms'> = [];
  const notificationFailures: Array<'email' | 'sms'> = [];
  const confirmation = `Your appointment with an MRX senior underwriter team member is confirmed for ${args.option.label}.`;
  if (args.profile.permissions.email && args.profile.email) {
    try {
      await sendGhlMessage({
        contactId,
        type: 'Email',
        appointmentId,
        emailTo: args.profile.email,
        subject: 'Your MRX senior underwriter appointment is confirmed',
        message: confirmation,
        html: `<p>Hi ${escapeHtml(args.profile.firstName)},</p><p>${escapeHtml(confirmation)}</p><p>A senior MRX underwriter team member will call the number you provided.</p>`,
      });
      notifications.push('email');
    } catch {
      notificationFailures.push('email');
    }
  }
  if (args.profile.permissions.sms && args.profile.phone) {
    try {
      await sendGhlMessage({
        contactId,
        type: 'SMS',
        appointmentId,
        toNumber: args.profile.phone,
        message: `${confirmation} Reply STOP to opt out or HELP for help.`,
      });
      notifications.push('sms');
    } catch {
      notificationFailures.push('sms');
    }
  }
  return {
    id: appointmentId,
    contactId,
    notifications,
    notificationFailures,
    workflowEnrolled,
  };
}

export async function rescheduleAppointment(appointmentId: string, option: AppointmentOption) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const response = await fetch(
    `${API_BASE}/calendars/events/appointments/${encodeURIComponent(appointmentId)}`,
    {
      method: 'PUT',
      headers: headers(settings.token, '2021-07-28'),
      body: JSON.stringify({
        startTime: option.start,
        endTime: option.end,
        appointmentStatus: 'confirmed',
      }),
    },
  );
  if (!response.ok) throw new Error(`GHL reschedule failed (${response.status})`);
  return response.json();
}

export async function cancelAppointment(appointmentId: string) {
  assertProviderWritesEnabled();
  const settings = config();
  if (!settings) throw new Error('GHL calendar is not configured');
  const response = await fetch(
    `${API_BASE}/calendars/events/${encodeURIComponent(appointmentId)}`,
    {
      method: 'DELETE',
      headers: headers(settings.token, 'v3'),
    },
  );
  if (!response.ok) throw new Error(`GHL cancellation failed (${response.status})`);
}

export async function verifyGhlSignature(request: Request, rawBody: string) {
  const publicKey = runtimeEnv('GHL_WEBHOOK_PUBLIC_KEY');
  const signature = request.headers.get('x-ghl-signature');
  if (!publicKey || !signature) return false;
  const body = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  const binary = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('spki', binary, { name: 'Ed25519' }, false, ['verify']);
  const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0));
  return crypto.subtle.verify('Ed25519', key, signatureBytes, new TextEncoder().encode(rawBody));
}
