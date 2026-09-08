import { runtimeEnv } from './runtime-env';

export const MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION = 'mrx-outcome-attribution-v1.0.0' as const;

export const MRX_OUTCOME_EVENTS = [
  'relevant_case_completed',
  'case_human_review_completed',
  'case_agreed_next_step',
] as const;

export type MrxOutcomeEvent = (typeof MRX_OUTCOME_EVENTS)[number];
export type OutcomeEvidenceLabel = 'actual' | 'estimate' | 'unavailable';
export type AttributionEvidenceLabel = 'actual' | 'unavailable' | 'suppressed';
export type AnalyticsConsentStatus = 'granted' | 'withdrawn' | 'unavailable';
export type RelevantCaseEvidenceSource = 'required_case_fields' | 'authorized_staff_attestation';
export type HumanReviewScope = 'case_review' | 'offer_review' | 'title_review';
export type AgreedNextStepType =
  | 'book_underwriter_call'
  | 'request_documents'
  | 'send_offer_packet'
  | 'owner_requested_follow_up';

export type ConsentReceiptAttribution = {
  channel?: string | null;
  purpose?: string | null;
  source_url?: string | null;
  utm?: Record<string, unknown> | null;
  created_at?: string | null;
  granted?: boolean | null;
};

export type PrivacySafeAttributionContext = {
  contractVersion: typeof MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION;
  privacySafeProfileId: string;
  sourcePath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  sourceRefreshedAt: string;
  attributionLabel: AttributionEvidenceLabel;
  analyticsConsent: AnalyticsConsentStatus;
  retentionPolicy: 'analytics_aggregate_only_no_internal_notes_or_documents';
};

const PUBLIC_SOURCE_ORIGINS = new Set([
  'https://mineralrightsxchange.com',
  'https://www.mineralrightsxchange.com',
]);
const PUBLIC_SOURCE_PATH_BUCKETS = [
  { pattern: /^\/$/, bucket: '/' },
  { pattern: /^\/book\/?$/i, bucket: '/book/' },
  { pattern: /^\/free-guide\/?$/i, bucket: '/free-guide/' },
  { pattern: /^\/offer-review\/?$/i, bucket: '/offer-review/' },
  { pattern: /^\/faq\/?$/i, bucket: '/faq/' },
  { pattern: /^\/blog\/[a-z0-9-]+\/?$/i, bucket: '/blog/' },
] as const;
const APPROVED_UTM_VALUES = {
  utm_source: new Set([
    'google',
    'bing',
    'duckduckgo',
    'facebook',
    'meta',
    'linkedin',
    'youtube',
    'direct',
    'referral',
    'newsletter',
    'mineralrightsxchange',
  ]),
  utm_medium: new Set(['organic', 'cpc', 'paid_search', 'paid_social', 'social', 'referral', 'email', 'direct']),
  utm_campaign: new Set([
    'offer_review',
    'mineral_rights_offer_review',
    'inherited_mineral_rights',
    'mineral_rights_value',
    'owner_intake',
    'appointment_booking',
    'free_guide',
  ]),
} as const;
const PRIVATE_SOURCE_PATH = /^\/(api|account|staff|admin|auth|dashboard|_server-islands)(\/|$)/i;
const DENIED_ANALYTICS_PARAM_KEY =
  /(email|phone|name|address|legal_description|note|body|raw|document|file|storage|excerpt|transcript|summary|valuation|offer_amount|royalty_amount|staff_profile|actor_user_id|profile_id|source_url|utm_content|utm_term)/i;
const ALLOWED_ANALYTICS_PARAM_KEYS = new Set([
  'mrx_contract_version',
  'mrx_privacy_id',
  'outcome_event',
  'outcome_evidence_label',
  'outcome_occurred_at',
  'attribution_label',
  'source_path',
  'source_refreshed_at',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'analytics_consent',
  'retention_policy',
  'evidenceSource',
  'reviewScope',
  'nextStepType',
  'agreementStatus',
  'agreedNextStep',
  'packet_version',
  'readiness_version',
  'mrx_calendar_event_id',
]);
const ANALYTICS_PURPOSE = /(^|[\s_-])analytics($|[\s_-])/i;

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeString(value: unknown, maxLength = 120) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function approvedUtmValue(
  key: keyof typeof APPROVED_UTM_VALUES,
  value: unknown,
) {
  const cleaned = safeString(value, 80).toLowerCase().replace(/-/g, '_');
  return APPROVED_UTM_VALUES[key].has(cleaned) ? cleaned : 'unavailable';
}

export function publicSourcePath(value: unknown) {
  const raw = safeString(value, 500);
  if (!raw) return 'unavailable';
  try {
    const url = new URL(raw, 'https://mineralrightsxchange.com');
    const origin = url.origin.toLowerCase();
    if (!PUBLIC_SOURCE_ORIGINS.has(origin)) return 'unavailable';
    if (PRIVATE_SOURCE_PATH.test(url.pathname)) return 'unavailable';
    const pathname = url.pathname.replace(/\/{2,}/g, '/') || '/';
    return PUBLIC_SOURCE_PATH_BUCKETS.find((entry) => entry.pattern.test(pathname))?.bucket ?? 'unavailable';
  } catch {
    return 'unavailable';
  }
}

function isAnalyticsConsentReceipt(receipt: ConsentReceiptAttribution) {
  const purpose = safeString(receipt.purpose, 120);
  return ANALYTICS_PURPOSE.test(purpose);
}

export function latestAnalyticsConsent(
  receipts: ConsentReceiptAttribution[] | null | undefined,
): ConsentReceiptAttribution | null {
  return (
    receipts
      ?.filter(isAnalyticsConsentReceipt)
      .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))[0] ?? null
  );
}

export function latestAttributionReceipt(
  receipts: ConsentReceiptAttribution[] | null | undefined,
): ConsentReceiptAttribution | null {
  return (
    receipts
      ?.filter((receipt) => receipt?.source_url || Object.keys(receipt?.utm ?? {}).length)
      .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))[0] ?? null
  );
}

export async function privacySafeProfileIdentifier(profileId: string) {
  const pepper = runtimeEnv('MRX_ATTRIBUTION_ID_PEPPER') || 'mrx-attribution-contract-v1';
  const digest = await sha256Hex(`${pepper}:profile:${profileId}`);
  return `mrxpid_${digest.slice(0, 32)}`;
}

export async function buildPrivacySafeAttributionContext(args: {
  profileId: string;
  receipts?: ConsentReceiptAttribution[] | null;
  refreshedAt?: string | null;
}): Promise<PrivacySafeAttributionContext> {
  const consent = latestAnalyticsConsent(args.receipts);
  const analyticsConsent: AnalyticsConsentStatus = consent
    ? consent.granted
      ? 'granted'
      : 'withdrawn'
    : 'unavailable';
  const receipt = latestAttributionReceipt(args.receipts);
  const attribution = (receipt?.utm ?? {}) as Record<string, unknown>;
  const sourcePath = publicSourcePath(receipt?.source_url);
  const hasAllowedSource =
    sourcePath !== 'unavailable' ||
    ['utm_source', 'utm_medium', 'utm_campaign'].some(
      (key) =>
        approvedUtmValue(key as keyof typeof APPROVED_UTM_VALUES, attribution[key]) !== 'unavailable',
    );
  return {
    contractVersion: MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION,
    privacySafeProfileId: await privacySafeProfileIdentifier(args.profileId),
    sourcePath,
    utmSource: approvedUtmValue('utm_source', attribution.utm_source),
    utmMedium: approvedUtmValue('utm_medium', attribution.utm_medium),
    utmCampaign: approvedUtmValue('utm_campaign', attribution.utm_campaign),
    sourceRefreshedAt: safeString(args.refreshedAt || receipt?.created_at, 80) || 'unavailable',
    attributionLabel: analyticsConsent === 'granted' && hasAllowedSource ? 'actual' : 'unavailable',
    analyticsConsent,
    retentionPolicy: 'analytics_aggregate_only_no_internal_notes_or_documents',
  };
}

export function privacySafeAnalyticsParams(params: Record<string, unknown> = {}) {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_ANALYTICS_PARAM_KEYS.has(key)) continue;
    if (DENIED_ANALYTICS_PARAM_KEY.test(key)) continue;
    if (key === 'source_path') {
      const path = publicSourcePath(value);
      if (path !== 'unavailable') safe[key] = path;
    } else if (key === 'utm_source' || key === 'utm_medium' || key === 'utm_campaign') {
      const utm = approvedUtmValue(key, value);
      if (utm !== 'unavailable') safe[key] = utm;
    } else if (typeof value === 'string') safe[key] = safeString(value, 120);
    else if (typeof value === 'number' && Number.isFinite(value)) safe[key] = value;
    else if (typeof value === 'boolean' || value === null) safe[key] = value;
  }
  return safe;
}

export async function buildOutcomeDedupKey(args: {
  profileId: string;
  event: MrxOutcomeEvent;
  actionId: string;
}) {
  return sha256Hex(
    `${MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION}:${args.event}:${args.profileId}:${args.actionId}`,
  );
}

export async function buildOutcomeAnalyticsParams(args: {
  profileId: string;
  event: MrxOutcomeEvent;
  evidenceLabel: OutcomeEvidenceLabel;
  occurredAt: string;
  attribution: PrivacySafeAttributionContext;
  extra?: Record<string, unknown>;
}) {
  return privacySafeAnalyticsParams({
    mrx_contract_version: MRX_OUTCOME_ATTRIBUTION_CONTRACT_VERSION,
    mrx_privacy_id: args.attribution.privacySafeProfileId,
    outcome_event: args.event,
    outcome_evidence_label: args.evidenceLabel,
    outcome_occurred_at: args.occurredAt,
    attribution_label: args.attribution.attributionLabel,
    source_path: args.attribution.sourcePath,
    source_refreshed_at: args.attribution.sourceRefreshedAt,
    utm_source: args.attribution.utmSource,
    utm_medium: args.attribution.utmMedium,
    utm_campaign: args.attribution.utmCampaign,
    analytics_consent: args.attribution.analyticsConsent,
    retention_policy: args.attribution.retentionPolicy,
    ...privacySafeAnalyticsParams(args.extra),
  });
}

export const MRX_OUTCOME_BUSINESS_FORMULA =
  'agreed-next-step cases / completed human reviews, segmented by verified source; relevant completed intake/case submissions reported separately' as const;

export const MRX_OUTCOME_STAGE_MAPPING = {
  relevantCaseCompleted: {
    event: 'relevant_case_completed',
    evidenceSources: ['required_case_fields', 'authorized_staff_attestation'],
    countInFormulaDenominator: false,
    reportSeparately: true,
  },
  completedHumanReview: {
    event: 'case_human_review_completed',
    auditEventType: 'staff_owner_case_review_completed',
    requiresStaffActor: true,
    requiresEvidenceLabel: 'actual',
    countInFormulaDenominator: true,
  },
  agreedNextStep: {
    event: 'case_agreed_next_step',
    auditEventType: 'staff_owner_case_agreed_next_step',
    allowedNextSteps: [
      'book_underwriter_call',
      'request_documents',
      'send_offer_packet',
      'owner_requested_follow_up',
    ],
    countInFormulaNumerator: true,
  },
} as const;
