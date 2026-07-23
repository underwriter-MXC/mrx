import type { APIContext } from 'astro';
import { authenticatedOwner } from './identity';
import { runtimeEnv } from './runtime-env';
import { getSupabaseServer } from './supabase';

export const INTERNAL_CASE_FILE_BUCKET = 'staff-case-files';

export const INTERNAL_CASE_FILE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const INTERNAL_CASE_FILE_MAX_BYTES = 25 * 1024 * 1024;

export const INTERNAL_CASE_NOTE_TYPES = [
  'case_review',
  'document_review',
  'research',
  'production',
  'parcel_gis',
  'title',
  'tax_roll',
  'operator',
  'comparable',
  'valuation_prep',
  'assignment',
] as const;

export const INTERNAL_CASE_PROVENANCE = [
  'confirmed',
  'stated',
  'estimated',
  'assumed',
  'not_found',
  'cannot_verify',
  'staff_analysis',
] as const;

export const INTERNAL_CASE_FILE_PURPOSES = [
  'case_workspace',
  'mineralholders_import',
  'research_source',
  'production',
  'parcel_gis',
  'title_review',
  'tax_roll',
  'operator',
  'comparable',
  'underwriter_brief',
  'data_pull_brief',
  'valuation_support',
] as const;

export const OWNER_CASE_STATUSES = [
  'intake',
  'needs_info',
  'research',
  'underwriting',
  'ready_for_review',
  'offer_pending',
  'offer_sent',
  'due_diligence',
  'documents_complete',
  'title_review',
  'closing_scheduled',
  'closed',
  'lost',
  'on_hold',
] as const;

export const OWNER_CASE_RATINGS = ['unrated', 'cold', 'warm', 'hot', 'priority'] as const;

export type OwnerCaseStatus = (typeof OWNER_CASE_STATUSES)[number];
export type OwnerCaseRating = (typeof OWNER_CASE_RATINGS)[number];

export type OwnerCaseStageMapping = Partial<
  Record<
    OwnerCaseStatus,
    { pipelineId?: string; stageId?: string; pipelineName?: string; stageName?: string }
  >
>;

export const DEFAULT_OWNER_CASE_STAGE_NAMES: Record<
  OwnerCaseStatus,
  { pipelineName: string; stageName: string } | null
> = {
  intake: { pipelineName: 'Prospects', stageName: 'Record Added' },
  needs_info: { pipelineName: 'Prospects', stageName: 'Outreach Initiated' },
  research: { pipelineName: 'Prospects', stageName: 'DCF Scored' },
  underwriting: { pipelineName: 'Appointments', stageName: 'Appointment Completed' },
  ready_for_review: { pipelineName: 'Appointments', stageName: 'Offer Pending' },
  offer_pending: { pipelineName: 'Appointments', stageName: 'Offer Pending' },
  offer_sent: { pipelineName: 'Sellers', stageName: 'Offer Sent' },
  due_diligence: { pipelineName: 'Sellers', stageName: 'Due Diligence Active' },
  documents_complete: { pipelineName: 'Sellers', stageName: 'Documents Complete' },
  title_review: { pipelineName: 'Sellers', stageName: 'Title Review' },
  closing_scheduled: { pipelineName: 'Sellers', stageName: 'Closing Scheduled' },
  closed: { pipelineName: 'Sellers', stageName: 'Closed - PLATFORM' },
  lost: { pipelineName: 'Sellers', stageName: 'Dead' },
  on_hold: null,
};

const statusLabels: Record<OwnerCaseStatus, string> = {
  intake: 'Intake',
  needs_info: 'Needs info',
  research: 'Research',
  underwriting: 'Underwriting',
  ready_for_review: 'Ready for review',
  offer_pending: 'Offer pending',
  offer_sent: 'Offer sent',
  due_diligence: 'Due diligence',
  documents_complete: 'Documents complete',
  title_review: 'Title review',
  closing_scheduled: 'Closing scheduled',
  closed: 'Closed',
  lost: 'Lost',
  on_hold: 'On hold',
};

const ratingTones: Record<OwnerCaseRating, 'gray' | 'blue' | 'amber' | 'red' | 'purple'> = {
  unrated: 'gray',
  cold: 'blue',
  warm: 'amber',
  hot: 'red',
  priority: 'purple',
};

function ownerCaseStatus(value: string): OwnerCaseStatus | null {
  return (OWNER_CASE_STATUSES as readonly string[]).includes(value)
    ? (value as OwnerCaseStatus)
    : null;
}

function ownerCaseRating(value: string): OwnerCaseRating | null {
  return (OWNER_CASE_RATINGS as readonly string[]).includes(value)
    ? (value as OwnerCaseRating)
    : null;
}

export function ownerCaseStatusLabel(value: string) {
  const status = ownerCaseStatus(value);
  return status ? statusLabels[status] : 'Unknown status';
}

export function ownerCaseRatingTone(value: string) {
  const rating = ownerCaseRating(value);
  return rating ? ratingTones[rating] : ratingTones.unrated;
}

export function resolveOwnerCaseStageMapping(env: Record<string, string | undefined> = {}) {
  const raw =
    env.MRX_GHL_OWNER_CASE_STAGE_MAP_JSON ?? runtimeEnv('MRX_GHL_OWNER_CASE_STAGE_MAP_JSON');
  if (!raw) return {} satisfies OwnerCaseStageMapping;
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    const mapping: OwnerCaseStageMapping = {};
    for (const [statusKey, value] of Object.entries(parsed)) {
      const status = ownerCaseStatus(statusKey);
      if (!status || !value || typeof value !== 'object') continue;
      const pipelineId = typeof value.pipelineId === 'string' ? value.pipelineId.trim() : '';
      const stageId =
        typeof value.stageId === 'string'
          ? value.stageId.trim()
          : typeof value.pipelineStageId === 'string'
            ? value.pipelineStageId.trim()
            : '';
      const pipelineName = typeof value.pipelineName === 'string' ? value.pipelineName.trim() : '';
      const stageName = typeof value.stageName === 'string' ? value.stageName.trim() : '';
      mapping[status] = {
        ...(pipelineId ? { pipelineId } : {}),
        ...(stageId ? { stageId } : {}),
        ...(pipelineName ? { pipelineName } : {}),
        ...(stageName ? { stageName } : {}),
      };
    }
    return mapping;
  } catch {
    return {} satisfies OwnerCaseStageMapping;
  }
}

export type StaffProfile = {
  id: string;
  user_id: string;
  role: 'admin' | 'underwriter' | 'reviewer';
  display_name: string;
  active: boolean;
};

export type StaffRole = StaffProfile['role'];

export function isAdminStaff(staff: { role: string }) {
  return staff.role === 'admin';
}

export function canFinalizeInternalCaseFile(
  staff: { id: string; role: string },
  file: { staff_profile_id: string; status: string; visibility: string },
) {
  return (
    file.visibility === 'internal' &&
    file.status === 'pending_upload' &&
    (isAdminStaff(staff) || file.staff_profile_id === staff.id)
  );
}

export async function requireStaff(context: APIContext) {
  const user = await authenticatedOwner(context.request);
  const supabase = getSupabaseServer();
  if (!user || !supabase) throw new Response('Staff authentication required', { status: 401 });
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id,user_id,role,display_name,active')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (!staff) throw new Response('Staff access required', { status: 403 });
  return { user, staff: staff as StaffProfile, supabase };
}

export async function requireAdminStaff(context: APIContext) {
  const session = await requireStaff(context);
  if (!isAdminStaff(session.staff))
    throw new Response('Admin staff access required', { status: 403 });
  return session;
}

export async function staffCanAccessProfile(
  staff: { id: string; role: string },
  profileId: string,
) {
  if (staff.role === 'admin') return true;
  const supabase = getSupabaseServer();
  if (!supabase) return false;
  const { count } = await supabase
    .from('case_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('staff_profile_id', staff.id)
    .eq('profile_id', profileId);
  return (count ?? 0) > 0;
}

export async function requireStaffCaseAccess(
  staff: { id: string; role: string },
  profileId: string,
) {
  if (!(await staffCanAccessProfile(staff, profileId))) {
    throw new Response('Case not found', { status: 404 });
  }
}

const OWNER_CASE_SOURCE_TABLES = [
  'internal_case_workspaces',
  'mineral_interests',
  'owner_facts',
  'conversations',
  'attachments',
  'appointments',
  'case_assignments',
] as const;

/**
 * Resolve the profiles that have real owner-case evidence before loading the
 * protected case list/dashboard. This prevents ordinary account profiles from
 * being misclassified as intake opportunities. Assigned IDs stay authoritative
 * for non-admin staff; admins receive the union of all case-bearing tables.
 */
export async function ownerCaseProfileIds(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  assignedProfileIds: string[] | null,
  limit = 500,
) {
  if (assignedProfileIds) return Array.from(new Set(assignedProfileIds)).slice(0, limit);
  const results = await Promise.all(
    OWNER_CASE_SOURCE_TABLES.map((table) =>
      supabase
        .from(table)
        .select('profile_id')
        .limit(limit + 1),
    ),
  );
  const profileIds = new Set<string>();
  for (const result of results) {
    if (result.error) throw result.error;
    for (const item of result.data ?? []) {
      const profileId = (item as { profile_id?: unknown }).profile_id;
      if (typeof profileId === 'string' && profileId) profileIds.add(profileId);
      if (profileIds.size >= limit) break;
    }
    if (profileIds.size >= limit) break;
  }
  return Array.from(profileIds);
}

export function safeInternalFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop() || '';
  const cleaned = basename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(-120);
  return cleaned || 'case-file';
}

export function internalCaseStoragePath(args: {
  profileId: string;
  filename: string;
  id?: string;
}) {
  return `internal/${args.profileId}/${args.id ?? crypto.randomUUID()}-${safeInternalFilename(args.filename)}`;
}

export async function internalCaseFileMatches(
  blob: Blob,
  mimeType: (typeof INTERNAL_CASE_FILE_MIME_TYPES)[number],
  expectedSize: number | string,
) {
  if (blob.size !== Number(expectedSize)) return false;
  const bytes = new Uint8Array(await blob.slice(0, 64 * 1024).arrayBuffer());
  if (mimeType === 'application/pdf') {
    return String.fromCharCode(...bytes.slice(0, 4)) === '%PDF';
  }
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    if (!bytes.length || bytes.includes(0)) return false;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export const RISK_SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'] as const;
export type RiskSeverity = (typeof RISK_SEVERITY_ORDER)[number];

export type DerivableStaffRow = {
  internal_case_workspaces?: InternalWorkspaceLite | InternalWorkspaceLite[] | null;
  mineral_interests?: Array<{
    county?: string | null;
    state?: string | null;
    state_code?: string | null;
    basin_name?: string | null;
    operator?: string | null;
  }> | null;
  case_assignments?: Array<{
    assigned_staff?: { display_name?: string | null; active?: boolean | null } | null;
  }> | null;
};

export type InternalWorkspaceLite = {
  status?: OwnerCaseStatus | null;
  case_rating?: OwnerCaseRating | null;
  priority?: 'normal' | 'high' | 'urgent' | null;
  verification_confidence?: 'unknown' | 'low' | 'medium' | 'high' | null;
  mineral_rights_count?: number | null;
  recommended_focus?: string | null;
  risk_flags?: RiskFlagLike[] | null;
  last_contact_at?: string | null;
  ghl_pipeline_id?: string | null;
  ghl_pipeline_stage_id?: string | null;
  ghl_pipeline_name?: string | null;
  ghl_pipeline_stage_name?: string | null;
  ghl_pipeline_status?: string | null;
  valuation_status?: 'blocked_pending_methodology_approval' | 'human_review' | 'approved' | null;
};

export type RiskFlagLike = {
  code: string;
  severity: RiskSeverity | string;
  status?: 'open' | 'reviewing' | 'resolved' | string;
};

export type StaffRowSemantics = {
  workspaceExists: boolean;
  effectiveMineralCount: number;
  countSource: 'workspace' | 'interests';
  uniqueCounties: string[];
  uniqueStates: string[];
  uniqueBasins: (string | null)[];
  uniqueOperators: (string | null)[];
  openRiskCount: number;
  maxOpenSeverity: RiskSeverity | null;
  assigneeLabel: string;
  ghlDisplay: string;
  isGhlMapped: boolean;
  valuationStatusLabel: string;
};

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function normalizeSeverity(value: unknown): RiskSeverity | null {
  const candidate = typeof value === 'string' ? value.toLowerCase() : '';
  return (RISK_SEVERITY_ORDER as readonly string[]).includes(candidate)
    ? (candidate as RiskSeverity)
    : null;
}

function readWorkspace(row: DerivableStaffRow): InternalWorkspaceLite | null {
  const value = row.internal_case_workspaces;
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) set.add(value.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function uniqueNullable(values: Array<string | null | undefined>): (string | null)[] {
  const set = new Set<string>();
  let sawNull = false;
  for (const value of values) {
    if (value == null || value === '') {
      sawNull = true;
      continue;
    }
    set.add(value);
  }
  const out = Array.from(set).sort((a, b) => a.localeCompare(b));
  return sawNull ? [...out, null] : out;
}

const VALUATION_LABELS: Record<NonNullable<InternalWorkspaceLite['valuation_status']>, string> = {
  blocked_pending_methodology_approval: 'Blocked · awaiting methodology approval',
  human_review: 'Human review',
  approved: 'Approved',
};

/**
 * Pure helper that derives staff-only row semantics for the searchable Owner
 * Cases portal. Server- and client-safe (no IO, no Supabase). All values are
 * null-safe and never throw on missing fields. Used by the cases list API to
 * enrich each row payload and by the React UI to render list rows + profile
 * summary cards.
 */
export function deriveStaffRowSemantics(row: DerivableStaffRow): StaffRowSemantics {
  const workspace = readWorkspace(row);
  const interests = row.mineral_interests ?? [];
  const interestCount = interests.length;
  const override = workspace?.mineral_rights_count;
  const effectiveMineralCount =
    typeof override === 'number' && Number.isFinite(override) ? override : interestCount;
  const countSource: 'workspace' | 'interests' =
    typeof override === 'number' && Number.isFinite(override) ? 'workspace' : 'interests';

  const counties = uniqueStrings(interests.map((item) => item.county));
  const states = uniqueStrings(
    interests.flatMap((item) => [item.state_code, item.state]).filter(Boolean) as string[],
  );
  const basins = uniqueNullable(interests.map((item) => item.basin_name ?? null));
  const operators = uniqueNullable(interests.map((item) => item.operator ?? null));

  const openRisks = (workspace?.risk_flags ?? []).filter(
    (flag) => !flag?.status || flag.status === 'open' || flag.status === 'reviewing',
  );
  const openRiskCount = openRisks.length;
  const severities = openRisks
    .map((flag) => normalizeSeverity(flag?.severity))
    .filter((value): value is RiskSeverity => Boolean(value));
  const maxOpenSeverity =
    severities.length === 0
      ? null
      : severities.reduce((acc, value) =>
          SEVERITY_RANK[value] > SEVERITY_RANK[acc] ? value : acc,
        );

  const assignments = row.case_assignments ?? [];
  const activeNames = assignments
    .map((assignment) => assignment?.assigned_staff?.display_name)
    .filter((name): name is string => Boolean(name && String(name).trim()));
  const assigneeLabel = activeNames.length ? activeNames.join(', ') : 'Unassigned';

  const ghlMapped =
    Boolean(workspace?.ghl_pipeline_id) && Boolean(workspace?.ghl_pipeline_stage_id);
  const ghlDisplay = ghlMapped
    ? [workspace?.ghl_pipeline_name, workspace?.ghl_pipeline_stage_name]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
        .join(' · ') || 'Mapped'
    : 'Not mapped';

  const valuationStatusLabel = workspace?.valuation_status
    ? (VALUATION_LABELS[workspace.valuation_status] ?? workspace.valuation_status)
    : 'Unknown valuation status';

  return {
    workspaceExists: Boolean(workspace),
    effectiveMineralCount,
    countSource,
    uniqueCounties: counties,
    uniqueStates: states,
    uniqueBasins: basins,
    uniqueOperators: operators,
    openRiskCount,
    maxOpenSeverity,
    assigneeLabel,
    ghlDisplay,
    isGhlMapped: ghlMapped,
    valuationStatusLabel,
  };
}

/**
 * Normalize a search query string for safe Supabase ilike matching. Strips
 * PostgREST special characters used in `ilike` patterns (`%`, `_`) and bounds
 * length so a single filter never blows the query budget.
 */
export function normalizeStaffSearchQuery(raw: string | null | undefined, maxLength = 120) {
  if (!raw) return '';
  return raw
    .replace(/[^\p{L}\p{N}@.+\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export const STAFF_CASE_LIST_SORT_KEYS = [
  'last_activity',
  'last_contact_at',
  'opportunity_value_cents',
  'created_at',
  'full_name',
  'status',
] as const;
export type StaffCaseListSortKey = (typeof STAFF_CASE_LIST_SORT_KEYS)[number];

export type ParsedStaffCaseListQuery = {
  q: string;
  status: OwnerCaseStatus | null;
  rating: OwnerCaseRating | null;
  priority: 'normal' | 'high' | 'urgent' | null;
  verification: 'unknown' | 'low' | 'medium' | 'high' | null;
  mineralCounty: string | null;
  mineralState: string | null;
  mineralBasin: string | null;
  operator: string | null;
  mineralCountOp: '>=' | '=' | '<=' | null;
  mineralCountValue: number | null;
  hasOpenRisks: 'any' | 'yes' | 'no';
  riskSeverityFloor: 'any' | 'low+' | 'medium+' | 'high+' | 'critical';
  assigneeScope: 'any' | 'me' | 'anyone' | 'unassigned';
  lastContactBucket: 'any' | 'never' | '7d' | '30d' | '90d' | 'over90';
  recommendedFocus: 'any' | 'missing' | 'present';
  focusSearch: string;
  sort: StaffCaseListSortKey;
  page: number;
  pageSize: number;
  invalid: string[];
};

export type StaffCaseListQuerySpec = {
  sortKeys?: readonly StaffCaseListSortKey[];
  pageSizeDefault?: number;
  pageSizeMax?: number;
};

const DEFAULT_CASE_LIST_SPEC: Required<StaffCaseListQuerySpec> = {
  sortKeys: STAFF_CASE_LIST_SORT_KEYS,
  pageSizeDefault: 25,
  pageSizeMax: 100,
};

const PRIORITIES = ['normal', 'high', 'urgent'] as const;
const VERIFICATIONS = ['unknown', 'low', 'medium', 'high'] as const;
const MINERAL_COUNT_OPS = ['>=', '=', '<='] as const;
const RISK_YES_NO = ['any', 'yes', 'no'] as const;
const SEVERITY_FLOORS = ['any', 'low+', 'medium+', 'high+', 'critical'] as const;
const ASSIGNEE_SCOPES = ['any', 'me', 'anyone', 'unassigned'] as const;
const LAST_CONTACT_BUCKETS = ['any', 'never', '7d', '30d', '90d', 'over90'] as const;
const RECOMMENDED_FOCUS_OPTIONS = ['any', 'missing', 'present'] as const;

function boundedInt(raw: string | null, min: number, max: number, fallback: number) {
  if (!raw) return { value: fallback, valid: true };
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num) || String(num) !== raw.trim()) return { value: fallback, valid: false };
  if (num < min || num > max) return { value: fallback, valid: false };
  return { value: num, valid: true };
}

function enumOrNull<T extends readonly string[]>(raw: string | null, allowed: T): T[number] | null {
  if (!raw) return null;
  return (allowed as readonly string[]).includes(raw) ? (raw as T[number]) : null;
}

/**
 * Parse and validate the staff cases list query string. Pure, with no IO. The
 * `invalid` field lists unknown filter keys for an `invalid_filter_<key>` 400
 * response, so the UI can surface the rejected filter without a full request
 * failure. Defaults are safe and produce the same envelope as before the
 * search enhancement (sorted by last activity, page 1, page size 25).
 */
export function parseStaffCaseListQuery(
  params: URLSearchParams,
  spec: StaffCaseListQuerySpec = {},
): ParsedStaffCaseListQuery {
  const resolved = { ...DEFAULT_CASE_LIST_SPEC, ...spec };
  const invalid: string[] = [];

  const q = normalizeStaffSearchQuery(params.get('q'));

  const statusValue = params.get('status')?.trim() || null;
  const status =
    statusValue && (OWNER_CASE_STATUSES as readonly string[]).includes(statusValue)
      ? (statusValue as OwnerCaseStatus)
      : statusValue
        ? (invalid.push('status'), null)
        : null;

  const ratingValue = params.get('rating')?.trim() || null;
  const rating =
    ratingValue && (OWNER_CASE_RATINGS as readonly string[]).includes(ratingValue)
      ? (ratingValue as OwnerCaseRating)
      : ratingValue
        ? (invalid.push('rating'), null)
        : null;

  const priority = enumOrNull(params.get('priority'), PRIORITIES);
  if (params.get('priority') && priority === null) invalid.push('priority');

  const verification = enumOrNull(params.get('verification'), VERIFICATIONS);
  if (params.get('verification') && verification === null) invalid.push('verification');

  const mineralCounty = params.get('mineralCounty')?.trim() || null;
  const mineralState = params.get('mineralState')?.trim() || null;
  const mineralBasin = params.get('mineralBasin')?.trim() || null;
  const operator = params.get('operator')?.trim() || null;
  const focusSearch = normalizeStaffSearchQuery(params.get('focusSearch'), 80);

  const mineralCountOpValue = params.get('mineralCountOp')?.trim() || null;
  const mineralCountOp = enumOrNull(mineralCountOpValue, MINERAL_COUNT_OPS);
  if (mineralCountOpValue && mineralCountOp === null) invalid.push('mineralCountOp');
  const mineralCountValueRaw = params.get('mineralCount')?.trim() || null;
  let mineralCountValue: number | null = null;
  if (mineralCountValueRaw) {
    const parsed = Number.parseInt(mineralCountValueRaw, 10);
    if (!Number.isFinite(parsed) || String(parsed) !== mineralCountValueRaw || parsed < 0) {
      invalid.push('mineralCount');
    } else {
      mineralCountValue = parsed;
    }
  }
  if (mineralCountValue != null && mineralCountOp == null) {
    invalid.push('mineralCountOp');
  }

  const hasOpenRisksValue = (params.get('hasOpenRisks') ||
    'any') as ParsedStaffCaseListQuery['hasOpenRisks'];
  const hasOpenRisks = (RISK_YES_NO as readonly string[]).includes(hasOpenRisksValue)
    ? (hasOpenRisksValue as ParsedStaffCaseListQuery['hasOpenRisks'])
    : (invalid.push('hasOpenRisks'), 'any');

  const riskSeverityFloorValue = (params.get('riskSeverityFloor') ||
    'any') as ParsedStaffCaseListQuery['riskSeverityFloor'];
  const riskSeverityFloor = (SEVERITY_FLOORS as readonly string[]).includes(riskSeverityFloorValue)
    ? (riskSeverityFloorValue as ParsedStaffCaseListQuery['riskSeverityFloor'])
    : (invalid.push('riskSeverityFloor'), 'any');

  const assigneeScopeValue = (params.get('assigneeScope') ||
    'any') as ParsedStaffCaseListQuery['assigneeScope'];
  const assigneeScope = (ASSIGNEE_SCOPES as readonly string[]).includes(assigneeScopeValue)
    ? (assigneeScopeValue as ParsedStaffCaseListQuery['assigneeScope'])
    : (invalid.push('assigneeScope'), 'any');

  const lastContactBucketValue = (params.get('lastContactBucket') ||
    'any') as ParsedStaffCaseListQuery['lastContactBucket'];
  const lastContactBucket = (LAST_CONTACT_BUCKETS as readonly string[]).includes(
    lastContactBucketValue,
  )
    ? (lastContactBucketValue as ParsedStaffCaseListQuery['lastContactBucket'])
    : (invalid.push('lastContactBucket'), 'any');

  const recommendedFocusValue = (params.get('recommendedFocus') ||
    'any') as ParsedStaffCaseListQuery['recommendedFocus'];
  const recommendedFocus = (RECOMMENDED_FOCUS_OPTIONS as readonly string[]).includes(
    recommendedFocusValue,
  )
    ? (recommendedFocusValue as ParsedStaffCaseListQuery['recommendedFocus'])
    : (invalid.push('recommendedFocus'), 'any');

  const sortValue = (params.get('sort') || 'last_activity') as StaffCaseListSortKey;
  const sort = (resolved.sortKeys as readonly string[]).includes(sortValue)
    ? (sortValue as StaffCaseListSortKey)
    : (invalid.push('sort'), 'last_activity');

  const pageParse = boundedInt(params.get('page'), 1, 10_000, 1);
  if (!pageParse.valid) invalid.push('page');
  const pageSizeParse = boundedInt(
    params.get('pageSize'),
    1,
    resolved.pageSizeMax,
    resolved.pageSizeDefault,
  );
  if (!pageSizeParse.valid) invalid.push('pageSize');

  return {
    q,
    status,
    rating,
    priority,
    verification,
    mineralCounty,
    mineralState,
    mineralBasin,
    operator,
    mineralCountOp,
    mineralCountValue,
    hasOpenRisks,
    riskSeverityFloor,
    assigneeScope,
    lastContactBucket,
    recommendedFocus,
    focusSearch,
    sort,
    page: pageParse.value,
    pageSize: pageSizeParse.value,
    invalid,
  };
}

export async function auditStaffCaseEvent(args: {
  actorUserId: string;
  profileId?: string | null;
  eventType: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const { error } = await supabase.from('audit_events').insert({
    actor_user_id: args.actorUserId,
    profile_id: args.profileId ?? null,
    event_type: args.eventType,
    target_type: args.targetType,
    target_id: args.targetId ?? null,
    metadata: args.metadata ?? {},
  });
  if (error) throw error;
}
