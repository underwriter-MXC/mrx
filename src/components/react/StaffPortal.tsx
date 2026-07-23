import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { staffPasswordRecoveryRedirectTo } from '../../lib/platform/staff-auth';
import {
  deriveStaffRowSemantics,
  normalizeStaffSearchQuery,
  type OwnerCaseStatus,
  type StaffCaseListSortKey,
  type StaffRowSemantics,
} from '../../lib/platform/staff';
import type { StaffDashboardCase, StaffDashboardData } from '../../lib/platform/staff-dashboard';
import {
  StaffIcon,
  StaffOverview,
  StaffPipeline,
  type StaffPortalView,
} from './StaffDashboardViews';
import './AccountHub.css';
import './StaffPortal.css';

interface Props {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

type StaffCase = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  residence_city?: string;
  residence_state?: string;
  residence_state_code?: string;
  residence_county?: string;
  residence_geography_status?: string;
  ghl_contact_id?: string;
  created_at: string;
  last_seen_at: string;
  semantics?: StaffRowSemantics;
  conversations?: Array<{
    id: string;
    title?: string;
    summary?: string;
    last_persona?: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  mineral_interests?: Array<{
    id: string;
    label?: string;
    city?: string;
    state?: string;
    state_code?: string;
    county?: string;
    county_fips?: string;
    legal_description?: string;
    parcel_reference?: string;
    basin_name?: string;
    oil_gas_province?: string;
    basin_status?: string;
    basin_needs_confirmation?: boolean;
    operator?: string;
    ownership_type?: string;
    net_mineral_acres?: string | number;
    royalty_decimal?: string | number;
    lease_name?: string;
    well_names?: string[];
    township_district?: string;
    block_section?: string;
    abstract_survey?: string;
    section_township_range?: string;
    gross_acres_under_lease?: string | number;
    lease_status?: string;
    producing_status?: string;
    recent_check_amount?: string;
    unknown_fields?: string[];
    geography_status?: string;
    location_precision?: string;
    status?: string;
  }>;
  owner_facts?: Array<{
    id: string;
    field: string;
    value: unknown;
    status: string;
    source?: string;
  }>;
  attachments?: Array<{
    id: string;
    mineral_interest_id?: string | null;
    original_name: string;
    document_type?: string;
    status: string;
    created_at?: string;
  }>;
  appointments?: Array<{
    id: string;
    starts_at: string;
    ends_at?: string;
    timezone?: string;
    status: string;
  }>;
  internal_case_notes?: Array<{
    id: string;
    body: string;
    note_type: string;
    provenance?: string;
    source_name?: string;
    source_url?: string;
    visibility: 'internal';
    created_at: string;
  }>;
  internal_case_files?: Array<{
    id: string;
    original_name: string;
    purpose: string;
    status: string;
    visibility: 'internal';
  }>;
  internal_case_workspaces?: InternalWorkspace | InternalWorkspace[] | null;
  case_assignments?: Array<{
    id: string;
    staff_profile_id: string;
    assigned_staff?: { display_name?: string; role?: string; active?: boolean } | null;
  }>;
};

type StaffMineralInterest = NonNullable<StaffCase['mineral_interests']>[number];

type RiskFlag = {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'reviewing' | 'resolved';
};

type InternalWorkspace = {
  profile_id: string;
  status:
    | 'intake'
    | 'needs_info'
    | 'research'
    | 'underwriting'
    | 'ready_for_review'
    | 'offer_pending'
    | 'offer_sent'
    | 'due_diligence'
    | 'documents_complete'
    | 'title_review'
    | 'closing_scheduled'
    | 'closed'
    | 'lost'
    | 'on_hold';
  case_rating: 'unrated' | 'cold' | 'warm' | 'hot' | 'priority';
  priority: 'normal' | 'high' | 'urgent';
  intake_confidence_score?: number | null;
  verification_confidence: 'unknown' | 'low' | 'medium' | 'high';
  underwriter_brief: string;
  data_pull_brief: string;
  confidence_gaps: string;
  recommended_focus: string;
  risk_flags: RiskFlag[];
  canonical_extraction_policy: 'full_county_42_column';
  valuation_status: 'blocked_pending_methodology_approval' | 'human_review' | 'approved';
  opportunity_value_cents?: number | null;
  opportunity_size_label?: string | null;
  mineral_rights_count?: number | null;
  last_contact_at?: string | null;
  ghl_opportunity_id?: string | null;
  ghl_pipeline_id?: string | null;
  ghl_pipeline_stage_id?: string | null;
  ghl_pipeline_name?: string | null;
  ghl_pipeline_stage_name?: string | null;
  ghl_pipeline_status?: string | null;
  updated_at: string;
};

type FilterPriority = 'normal' | 'high' | 'urgent';
type FilterVerification = 'unknown' | 'low' | 'medium' | 'high';
type FilterRiskYesNo = 'any' | 'yes' | 'no';
type FilterSeverityFloor = 'any' | 'low+' | 'medium+' | 'high+' | 'critical';
type FilterAssigneeScope = 'any' | 'me' | 'anyone' | 'unassigned';
type FilterLastContactBucket = 'any' | 'never' | '7d' | '30d' | '90d' | 'over90';
type FilterRecommendedFocus = 'any' | 'missing' | 'present';
type MineralCountOp = '>=' | '=' | '<=';

type Filters = {
  q: string;
  status: string;
  rating: string;
  priority: '' | FilterPriority;
  verification: '' | FilterVerification;
  mineralCounty: string;
  mineralState: string;
  mineralBasin: string;
  operator: string;
  mineralCountOp: '' | MineralCountOp;
  mineralCount: string;
  hasOpenRisks: FilterRiskYesNo;
  riskSeverityFloor: FilterSeverityFloor;
  assigneeScope: FilterAssigneeScope;
  lastContactBucket: FilterLastContactBucket;
  recommendedFocus: FilterRecommendedFocus;
  focusSearch: string;
  sort: StaffCaseListSortKey;
  page: number;
  pageSize: number;
};

const EMPTY_FILTERS: Filters = {
  q: '',
  status: '',
  rating: '',
  priority: '',
  verification: '',
  mineralCounty: '',
  mineralState: '',
  mineralBasin: '',
  operator: '',
  mineralCountOp: '',
  mineralCount: '',
  hasOpenRisks: 'any',
  riskSeverityFloor: 'any',
  assigneeScope: 'any',
  lastContactBucket: 'any',
  recommendedFocus: 'any',
  focusSearch: '',
  sort: 'last_activity',
  page: 1,
  pageSize: 25,
};

type PageEnvelope = {
  page: {
    total: number;
    returned: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  facets: {
    mineralCounties: string[];
    mineralStates: string[];
    mineralBasins: (string | null)[];
    operators: (string | null)[];
  };
};

type StaffUnderwritingPacket = {
  packet: {
    readinessStatus: 'blocked' | 'needs_verification' | 'ready';
    canFinalize: boolean;
    isFinalized: boolean;
    sourceFingerprint: string | null;
    counts: { total: number; required: number; complete: number; blockers: number };
    blockers: Array<{ code: string; label: string; requirementKey?: string }>;
    requirements: Array<{
      requirementKey: string;
      mineralInterestId: string | null;
      label: string;
      required: boolean;
      acceptedDocumentTypes: string[];
      effectiveStatus: string;
      attachmentId: string | null;
    }>;
  };
  packetRecord?: {
    readiness_version?: string | null;
    packet_version?: string | null;
    packet_hash?: string | null;
    finalized_at?: string | null;
  } | null;
  requirements: Array<{
    id: string;
    requirement_key: string;
    mineral_interest_id?: string | null;
    label: string;
    required: boolean;
    requirement_level?: 'required' | 'recommended';
    accepted_document_types: string[];
    status: string;
    waiver_reason?: string | null;
  }>;
  attachments: Array<{
    id: string;
    mineral_interest_id?: string | null;
    document_type?: string | null;
    status?: string | null;
    original_name?: string | null;
  }>;
};

const statusOptions = [
  ['intake', 'Intake'],
  ['needs_info', 'Needs info'],
  ['research', 'Research'],
  ['underwriting', 'Underwriting'],
  ['ready_for_review', 'Ready for review'],
  ['offer_pending', 'Offer pending'],
  ['offer_sent', 'Offer sent'],
  ['due_diligence', 'Due diligence'],
  ['documents_complete', 'Documents complete'],
  ['title_review', 'Title review'],
  ['closing_scheduled', 'Closing scheduled'],
  ['closed', 'Closed'],
  ['lost', 'Lost'],
  ['on_hold', 'On hold'],
] as const;

const ratingOptions = [
  ['unrated', 'Unrated'],
  ['cold', 'Cold'],
  ['warm', 'Warm'],
  ['hot', 'Hot'],
  ['priority', 'Priority'],
] as const;

const SORT_OPTIONS: Array<[StaffCaseListSortKey, string]> = [
  ['last_activity', 'Last activity'],
  ['last_contact_at', 'Last contact'],
  ['opportunity_value_cents', 'Opportunity value'],
  ['created_at', 'Created'],
  ['full_name', 'Name'],
  ['status', 'Stage'],
];

const SEVERITY_ORDER: Record<RiskFlag['severity'], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function OwnerProfileInterestEditor({
  interest,
  onSubmit,
}: {
  interest: StaffMineralInterest;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <details className="staff-owner-profile-editor">
      <summary>Update owner-visible property profile</summary>
      <form className="staff-workspace-form" onSubmit={onSubmit}>
        <p>
          Use verified details from an owner text, email, picture, document, or staff source. Saved
          fields appear in the owner’s private profile and the staff audit log.
        </p>
        <label>
          Property label
          <input
            name="label"
            required
            defaultValue={
              interest.label ||
              [interest.county, interest.state].filter(Boolean).join(', ') ||
              'Mineral interest'
            }
          />
        </label>
        <div className="staff-form-row">
          <label>
            State
            <input name="state" defaultValue={interest.state || ''} />
          </label>
          <label>
            County or parish
            <input name="county" defaultValue={interest.county || ''} />
          </label>
        </div>
        <label>
          Legal or property description
          <textarea name="legalDescription" defaultValue={interest.legal_description || ''} />
        </label>
        <div className="staff-form-row">
          <label>
            Parcel or property ID
            <input name="taxParcelId" defaultValue={interest.parcel_reference || ''} />
          </label>
          <label>
            Township or district
            <input name="townshipDistrict" defaultValue={interest.township_district || ''} />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Block / section
            <input name="blockSection" defaultValue={interest.block_section || ''} />
          </label>
          <label>
            Abstract / survey
            <input name="abstractSurvey" defaultValue={interest.abstract_survey || ''} />
          </label>
        </div>
        <label>
          Section / township / range
          <input name="sectionTownshipRange" defaultValue={interest.section_township_range || ''} />
        </label>
        <div className="staff-form-row">
          <label>
            Ownership type
            <select name="ownershipType" defaultValue={interest.ownership_type || 'unknown'}>
              <option value="unknown">Unknown</option>
              <option value="mineral_rights">Mineral rights</option>
              <option value="royalties_only">Royalty interest</option>
              <option value="overriding_royalties">Overriding royalty</option>
              <option value="working_interest">Working interest</option>
            </select>
          </label>
          <label>
            Net mineral acres
            <input
              name="netMineralAcres"
              inputMode="decimal"
              defaultValue={interest.net_mineral_acres || ''}
            />
          </label>
          <label>
            Gross lease acres
            <input
              name="grossAcresUnderLease"
              inputMode="decimal"
              defaultValue={interest.gross_acres_under_lease || ''}
            />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Leased
            <select name="leaseStatus" defaultValue={interest.lease_status || 'unknown'}>
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Producing
            <select name="producingStatus" defaultValue={interest.producing_status || 'unknown'}>
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Recent check
            <input name="recentCheckAmount" defaultValue={interest.recent_check_amount || ''} />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Operator
            <input name="operator" defaultValue={interest.operator || ''} />
          </label>
          <label>
            Lease, unit, or well
            <input name="leaseName" defaultValue={interest.lease_name || ''} />
          </label>
        </div>
        <label>
          Still missing, one item per line
          <textarea
            name="unknownFields"
            defaultValue={(interest.unknown_fields || []).join('\n')}
          />
        </label>
        <div className="staff-form-row">
          <label>
            Update source
            <select name="updateSource" defaultValue="owner_text">
              <option value="owner_text">Owner text or picture</option>
              <option value="owner_email">Owner email or attachment</option>
              <option value="owner_phone">Owner phone call</option>
              <option value="owner_document">Owner profile document</option>
              <option value="staff_research">Staff research</option>
            </select>
          </label>
          <label>
            Source note, optional
            <input name="sourceNote" placeholder="Example: royalty statement dated July 2026" />
          </label>
        </div>
        <button type="submit">Save to owner profile</button>
      </form>
    </details>
  );
}

function bearerHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

function caseWorkspace(owner: StaffCase) {
  const value = owner.internal_case_workspaces;
  return Array.isArray(value) ? value[0] : value;
}

function inferredMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'text/csv';
  if (extension === 'txt') return 'text/plain';
  if (extension === 'xlsx')
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
}

function ownerName(owner: StaffCase) {
  return [owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Unnamed owner';
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString();
}

function staffFactText(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value || typeof value !== 'object') return 'Not provided';
  const record = value as Record<string, unknown>;
  const missing = Array.isArray(record.missingFields)
    ? record.missingFields
    : Array.isArray(record.items)
      ? record.items
      : [];
  if (missing.length) return `Missing: ${missing.join(', ')}`;
  if (typeof record.body === 'string' && record.body.trim()) return record.body;
  return (
    Object.entries(record)
      .filter(
        ([key, item]) =>
          key !== 'attachmentUrls' &&
          item != null &&
          item !== '' &&
          (Array.isArray(item) || typeof item !== 'object'),
      )
      .slice(0, 10)
      .map(
        ([key, item]) =>
          `${key.replaceAll('_', ' ')}: ${Array.isArray(item) ? item.join(', ') : String(item)}`,
      )
      .join(' · ') || 'Saved on owner profile'
  );
}

function staffFactLinks(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  const urls = (value as { attachmentUrls?: unknown }).attachmentUrls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((item): item is string => {
    if (typeof item !== 'string') return false;
    try {
      return new URL(item).protocol === 'https:';
    } catch {
      return false;
    }
  });
}

function relativeDateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months ago`;
  return `${Math.round(diffDays / 365)} years ago`;
}

function localDateTimeValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function isoDateTimeValue(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function moneyLabel(cents?: number | null) {
  if (cents == null) return 'Not recorded';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function labelFor(options: readonly (readonly [string, string])[], value?: string | null) {
  return options.find(([key]) => key === value)?.[1] ?? 'Unmapped';
}

function ghlSummaryLabel(workspace?: InternalWorkspace | null) {
  if (!workspace) return 'Not mapped';
  if (!workspace.ghl_pipeline_id || !workspace.ghl_pipeline_stage_id) return 'Not mapped';
  const pipeline = workspace.ghl_pipeline_name?.trim();
  const stage = workspace.ghl_pipeline_stage_name?.trim();
  if (pipeline && stage) return `${pipeline} · ${stage}`;
  if (stage) return stage;
  return 'Mapped';
}

function severityLabel(value: RiskFlag['severity']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function priorityClass(priority: 'normal' | 'high' | 'urgent') {
  if (priority === 'urgent') return 'staff-case-row__priority--urgent';
  if (priority === 'high') return 'staff-case-row__priority--high';
  return '';
}

function countActiveFilters(filters: Filters) {
  return [
    filters.q,
    filters.status,
    filters.rating,
    filters.priority,
    filters.verification,
    filters.mineralCounty,
    filters.mineralState,
    filters.mineralBasin,
    filters.operator,
    filters.mineralCount && filters.mineralCountOp
      ? `${filters.mineralCountOp}${filters.mineralCount}`
      : '',
    filters.hasOpenRisks !== 'any' ? filters.hasOpenRisks : '',
    filters.riskSeverityFloor !== 'any' ? filters.riskSeverityFloor : '',
    filters.assigneeScope !== 'any' ? filters.assigneeScope : '',
    filters.lastContactBucket !== 'any' ? filters.lastContactBucket : '',
    filters.recommendedFocus !== 'any' ? filters.recommendedFocus : '',
    filters.focusSearch,
  ].filter(Boolean).length;
}

function buildFilterParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.rating) params.set('rating', filters.rating);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.verification) params.set('verification', filters.verification);
  if (filters.mineralCounty) params.set('mineralCounty', filters.mineralCounty);
  if (filters.mineralState) params.set('mineralState', filters.mineralState);
  if (filters.mineralBasin) params.set('mineralBasin', filters.mineralBasin);
  if (filters.operator) params.set('operator', filters.operator);
  if (filters.mineralCount && filters.mineralCountOp) {
    params.set('mineralCountOp', filters.mineralCountOp);
    params.set('mineralCount', filters.mineralCount);
  }
  if (filters.hasOpenRisks !== 'any') params.set('hasOpenRisks', filters.hasOpenRisks);
  if (filters.riskSeverityFloor !== 'any')
    params.set('riskSeverityFloor', filters.riskSeverityFloor);
  if (filters.assigneeScope !== 'any') params.set('assigneeScope', filters.assigneeScope);
  if (filters.lastContactBucket !== 'any')
    params.set('lastContactBucket', filters.lastContactBucket);
  if (filters.recommendedFocus !== 'any') params.set('recommendedFocus', filters.recommendedFocus);
  if (filters.focusSearch) params.set('focusSearch', filters.focusSearch);
  if (filters.sort && filters.sort !== 'last_activity') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize !== 25) params.set('pageSize', String(filters.pageSize));
  return params;
}

function filterSummary(filters: Filters) {
  return { activeCount: countActiveFilters(filters) };
}

export default function StaffPortal({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabase = useMemo(
    () =>
      typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null,
    [supabaseUrl, supabaseAnonKey],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [cases, setCases] = useState<StaffCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<StaffCase | null>(null);
  const [envelope, setEnvelope] = useState<PageEnvelope | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeView, setActiveView] = useState<StaffPortalView>('overview');
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [movingCaseId, setMovingCaseId] = useState<string | null>(null);
  const [underwritingPacket, setUnderwritingPacket] = useState<StaffUnderwritingPacket | null>(
    null,
  );
  const [packetLoading, setPacketLoading] = useState(false);
  const [packetBusy, setPacketBusy] = useState(false);
  const [staffIdentity, setStaffIdentity] = useState<{
    display_name?: string;
    role?: string;
  } | null>(null);
  const deferredQuery = useDeferredValue(filters.q);
  const deferredFocus = useDeferredValue(filters.focusSearch);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session && location.hash.includes('type=recovery')) setIsRecoverySession(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setStatus('Enter a new staff password to finish setup or recovery.');
      }
      if (event === 'SIGNED_OUT') setIsRecoverySession(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session || isRecoverySession) {
      if (!session) {
        setDashboard(null);
        setStaffIdentity(null);
      }
      return;
    }
    const controller = new AbortController();
    setDashboardLoading(true);
    void fetch('/api/staff/dashboard', {
      headers: bearerHeaders(session),
      signal: controller.signal,
    })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) {
          setStatus('Backoffice statistics could not be loaded. Owner cases remain available.');
          return;
        }
        setStaffIdentity(result.staff ?? null);
        setDashboard({
          summary: result.summary,
          byStatus: result.byStatus ?? [],
          cases: result.cases ?? [],
        });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStatus('Backoffice statistics could not be loaded. Owner cases remain available.');
        }
      })
      .finally(() => setDashboardLoading(false));
    return () => controller.abort();
  }, [session, isRecoverySession]);

  useEffect(() => {
    if (!session || isRecoverySession) {
      if (!session) setLoading(false);
      return;
    }
    if (isRecoverySession) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void (async () => {
      if (cases.length === 0) setLoading(true);
      else setRefining(true);
      const params = buildFilterParams({
        ...filters,
        q: deferredQuery,
        focusSearch: deferredFocus,
      });
      const response = await fetch(`/api/staff/cases${params.size ? `?${params}` : ''}`, {
        headers: bearerHeaders(session),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) {
        const message = result?.error?.startsWith('invalid_filter_')
          ? `These filters were rejected: ${(result.invalid ?? []).join(', ') || 'unknown'}.`
          : result?.error === 'request_failed'
            ? 'This account does not have MRX staff access.'
            : 'Cases could not be loaded.';
        setStatus(message);
      } else {
        const nextCases: StaffCase[] = (result.cases ?? []).map((row: StaffCase) => ({
          ...row,
          semantics: row.semantics ?? deriveStaffRowSemantics(row),
        }));
        setCases(nextCases);
        setEnvelope(
          result.page && result.facets
            ? {
                page: result.page,
                facets: result.facets,
              }
            : null,
        );
        setSelectedCase((current) =>
          current && nextCases.some((owner) => owner.id === current.id)
            ? current
            : (nextCases[0] ?? null),
        );
      }
      setLoading(false);
      setRefining(false);
    })().catch((error) => {
      if (error.name !== 'AbortError') setStatus('Cases could not be loaded.');
      setLoading(false);
      setRefining(false);
    });
    return () => controller.abort();
    // We intentionally exclude `cases` so the fetcher does not loop on local
    // mutation. The filters + session identity drive the request shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session,
    isRecoverySession,
    deferredQuery,
    deferredFocus,
    filters.status,
    filters.rating,
    filters.priority,
    filters.verification,
    filters.mineralCounty,
    filters.mineralState,
    filters.mineralBasin,
    filters.operator,
    filters.mineralCount,
    filters.mineralCountOp,
    filters.hasOpenRisks,
    filters.riskSeverityFloor,
    filters.assigneeScope,
    filters.lastContactBucket,
    filters.recommendedFocus,
    filters.sort,
    filters.page,
    filters.pageSize,
    isRecoverySession,
  ]);

  useEffect(() => {
    const ownerId = selectedCase?.id ?? cases[0]?.id;
    if (!session || !ownerId || isRecoverySession) {
      setUnderwritingPacket(null);
      return;
    }
    const controller = new AbortController();
    setPacketLoading(true);
    void fetch(`/api/staff/cases/${ownerId}/underwriting-packet`, {
      headers: bearerHeaders(session),
      signal: controller.signal,
    })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) throw new Error('packet_load_failed');
        setUnderwritingPacket(result);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setUnderwritingPacket(null);
          setStatus('The underwriter-readiness packet could not be loaded.');
        }
      })
      .finally(() => setPacketLoading(false));
    return () => controller.abort();
  }, [session, isRecoverySession, selectedCase?.id, cases]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key !== 'sort' && key !== 'page') next.page = 1;
      return next;
    });
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTERS });
  }

  async function openCase(ownerId: string) {
    if (!session) return;
    const response = await fetch(`/api/staff/cases/${ownerId}`, {
      headers: bearerHeaders(session),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus('The complete owner profile could not be loaded.');
      return;
    }
    setSelectedCase(result.case);
  }

  async function refreshDashboard() {
    if (!session) return;
    setDashboardLoading(true);
    try {
      const response = await fetch('/api/staff/dashboard', { headers: bearerHeaders(session) });
      const result = await response.json();
      if (!response.ok) throw new Error('dashboard_failed');
      setStaffIdentity(result.staff ?? null);
      setDashboard({
        summary: result.summary,
        byStatus: result.byStatus ?? [],
        cases: result.cases ?? [],
      });
    } catch {
      setStatus('Backoffice statistics could not be refreshed.');
    } finally {
      setDashboardLoading(false);
    }
  }

  async function selectDashboardCase(profileId: string) {
    setActiveView('owners');
    await openCase(profileId);
  }

  async function movePipelineCase(item: StaffDashboardCase, nextStatus: OwnerCaseStatus) {
    if (!session || movingCaseId || nextStatus === item.status) return;
    setMovingCaseId(item.id);
    setStatus(`Moving ${item.name} to ${labelFor(statusOptions, nextStatus)}…`);
    try {
      const workspaceResponse = await fetch(`/api/staff/cases/${item.id}/workspace`, {
        headers: bearerHeaders(session),
      });
      const workspaceResult = await workspaceResponse.json();
      if (!workspaceResponse.ok) throw new Error('workspace_load_failed');
      const current = workspaceResult.workspace as InternalWorkspace | null;
      const response = await fetch(`/api/staff/cases/${item.id}/workspace`, {
        method: 'PUT',
        headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          caseRating: current?.case_rating ?? item.rating,
          priority: current?.priority ?? item.priority,
          intakeConfidenceScore: current?.intake_confidence_score ?? null,
          verificationConfidence: current?.verification_confidence ?? 'unknown',
          underwriterBrief: current?.underwriter_brief ?? '',
          dataPullBrief: current?.data_pull_brief ?? '',
          confidenceGaps: current?.confidence_gaps ?? '',
          recommendedFocus: current?.recommended_focus ?? '',
          riskFlags: current?.risk_flags ?? [],
          opportunityValueCents: current?.opportunity_value_cents ?? item.opportunityValueCents,
          opportunitySizeLabel: current?.opportunity_size_label ?? '',
          mineralRightsCount: current?.mineral_rights_count ?? item.mineralRightsCount,
          lastContactAt: current?.last_contact_at ?? null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('stage_update_failed');
      setStatus(
        result.ghlSync?.status === 'sync_failed'
          ? `Saved ${item.name} in MRX. GHL sync failed; review the mapping or retry.`
          : `${item.name} moved to ${labelFor(statusOptions, nextStatus)}.`,
      );
      await refreshDashboard();
      if (selectedCase?.id === item.id) await openCase(item.id);
    } catch {
      setStatus(`${item.name} could not be moved. No pipeline change was applied.`);
    } finally {
      setMovingCaseId(null);
    }
  }

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || authBusy) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    setAuthBusy(true);
    setStatus('Signing in…');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setStatus(
        error
          ? 'Staff sign-in failed. Check your email/password or use password setup/recovery.'
          : 'Staff signed in. Loading role- and assignment-protected cases.',
      );
      if (!error) form.reset();
    } catch {
      setStatus('Staff sign-in is temporarily unavailable. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function requestPasswordRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || authBusy) return;
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    setAuthBusy(true);
    setStatus('Requesting secure password instructions…');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: staffPasswordRecoveryRedirectTo(),
      });
      setStatus(
        error
          ? 'The staff password setup/recovery email could not be sent.'
          : 'If the email belongs to authorized MRX staff, password setup/recovery instructions will be emailed.',
      );
    } catch {
      setStatus('Password setup/recovery is temporarily unavailable. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function setRecoveredPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || authBusy) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    if (newPassword.length < 12) {
      setStatus('Use a staff password with at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('The new staff passwords do not match.');
      return;
    }
    setAuthBusy(true);
    setStatus('Saving your staff password…');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setStatus('The staff password could not be updated from this recovery session.');
        return;
      }
      form.reset();
      setIsRecoverySession(false);
      window.history.replaceState({}, document.title, '/staff/');
      setStatus('Staff password updated. Loading role- and assignment-protected cases.');
    } catch {
      setStatus('The staff password could not be updated. Please request a new recovery email.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function openDocument(id: string) {
    if (!session) return;
    const response = await fetch(`/api/staff/documents/${id}`, { headers: bearerHeaders(session) });
    const result = await response.json();
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
    else setStatus('This document is not available to your assigned staff account.');
  }

  async function updateUnderwritingPacket(
    ownerId: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    if (!session || packetBusy) return;
    setPacketBusy(true);
    try {
      const response = await fetch(`/api/staff/cases/${ownerId}/underwriting-packet`, {
        method: 'POST',
        headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'underwriting_packet_blocked') {
          setStatus(
            `Packet is still blocked: ${(result.blockers ?? []).map((item: { label: string }) => item.label).join(' ')}`,
          );
        } else {
          setStatus('The underwriting packet action could not be completed.');
        }
        return;
      }
      setUnderwritingPacket(result);
      setStatus(successMessage);
      if (
        payload.action === 'finalize' ||
        payload.action === 'reopen_packet' ||
        payload.action === 'confirm_fact' ||
        payload.action === 'reject_fact'
      ) {
        await Promise.all([openCase(ownerId), refreshDashboard()]);
      }
    } catch {
      setStatus('The underwriting packet action could not be completed.');
    } finally {
      setPacketBusy(false);
    }
  }

  async function verifyUnderwritingRequirement(
    ownerId: string,
    requirementId: string,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const attachmentId = String(new FormData(event.currentTarget).get('attachmentId') || '');
    if (!attachmentId) return setStatus('Choose a clean, processed document to verify.');
    await updateUnderwritingPacket(
      ownerId,
      { action: 'verify', requirementId, attachmentId },
      'Document requirement verified and audit-recorded.',
    );
  }

  async function waiveUnderwritingRequirement(ownerId: string, requirementId: string) {
    const reason = window.prompt(
      'Record the specific equivalent evidence or research basis for this waiver (at least 10 characters):',
    );
    if (!reason?.trim() || reason.trim().length < 10) {
      setStatus('A specific waiver reason of at least 10 characters is required.');
      return;
    }
    await updateUnderwritingPacket(
      ownerId,
      { action: 'waive', requirementId, reason: reason.trim() },
      'Requirement formally waived and audit-recorded.',
    );
  }

  async function dispositionOwnerFact(
    ownerId: string,
    factId: string,
    disposition: 'confirm_fact' | 'reject_fact',
  ) {
    await updateUnderwritingPacket(
      ownerId,
      { action: disposition, factId },
      disposition === 'confirm_fact'
        ? 'Extracted fact confirmed and audit-recorded.'
        : 'Extracted fact flagged for follow-up and audit-recorded.',
    );
  }

  async function addInternalNote(ownerId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(`/api/staff/cases/${ownerId}/notes`, {
      method: 'POST',
      headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: String(formData.get('body') || ''),
        noteType: String(formData.get('noteType') || 'case_review'),
        provenance: String(formData.get('provenance') || 'staff_analysis'),
        sourceName: String(formData.get('sourceName') || ''),
        sourceUrl: String(formData.get('sourceUrl') || ''),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus('Internal note could not be saved.');
      return;
    }
    const update = (owner: StaffCase) =>
      owner.id === ownerId
        ? { ...owner, internal_case_notes: [result.note, ...(owner.internal_case_notes ?? [])] }
        : owner;
    setCases((current) => current.map(update));
    setSelectedCase((current) => (current ? update(current) : current));
    form.reset();
    setStatus('Internal note saved for staff only.');
  }

  async function updateOwnerInterest(
    ownerId: string,
    interest: StaffMineralInterest,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(`/api/staff/cases/${ownerId}/interests/${interest.id}`, {
      method: 'PUT',
      headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: String(formData.get('label') || ''),
        state: String(formData.get('state') || '') || null,
        county: String(formData.get('county') || '') || null,
        legalDescription: String(formData.get('legalDescription') || '') || null,
        townshipDistrict: String(formData.get('townshipDistrict') || '') || null,
        taxParcelId: String(formData.get('taxParcelId') || '') || null,
        blockSection: String(formData.get('blockSection') || '') || null,
        abstractSurvey: String(formData.get('abstractSurvey') || '') || null,
        sectionTownshipRange: String(formData.get('sectionTownshipRange') || '') || null,
        ownershipType: String(formData.get('ownershipType') || '') || null,
        netMineralAcres: String(formData.get('netMineralAcres') || '') || null,
        grossAcresUnderLease: String(formData.get('grossAcresUnderLease') || '') || null,
        leaseStatus: String(formData.get('leaseStatus') || 'unknown'),
        producingStatus: String(formData.get('producingStatus') || 'unknown'),
        recentCheckAmount: String(formData.get('recentCheckAmount') || '') || null,
        operator: String(formData.get('operator') || '') || null,
        leaseName: String(formData.get('leaseName') || '') || null,
        unknownFields: String(formData.get('unknownFields') || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        updateSource: String(formData.get('updateSource') || 'staff_research'),
        sourceNote: String(formData.get('sourceNote') || ''),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus('The owner-visible property profile could not be updated.');
      return;
    }
    const update = (owner: StaffCase) =>
      owner.id === ownerId
        ? {
            ...owner,
            mineral_interests: (owner.mineral_interests ?? []).map((item) =>
              item.id === interest.id ? result.interest : item,
            ),
          }
        : owner;
    setCases((current) => current.map(update));
    setSelectedCase((current) => (current ? update(current) : current));
    setStatus('Owner-visible property profile updated and recorded in the staff audit log.');
  }

  async function uploadInternalFile(ownerId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !supabase) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = (formData.get('file') as File | null) ?? null;
    if (!file) return;
    const response = await fetch(`/api/staff/cases/${ownerId}/files`, {
      method: 'POST',
      headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        mimeType: inferredMimeType(file),
        size: file.size,
        purpose: String(formData.get('purpose') || 'case_workspace'),
      }),
    });
    const signed = await response.json();
    if (!response.ok || !signed.path || !signed.token) {
      setStatus('Internal file upload could not be started.');
      return;
    }
    const upload = await supabase.storage
      .from('staff-case-files')
      .uploadToSignedUrl(signed.path, signed.token, file);
    if (upload.error) {
      setStatus('Internal file upload failed before completion.');
      return;
    }
    const complete = await fetch(`/api/staff/cases/${ownerId}/files/complete`, {
      method: 'POST',
      headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: signed.file.id }),
    });
    const result = await complete.json();
    if (!complete.ok) {
      setStatus('Internal file uploaded, but completion could not be verified.');
      return;
    }
    const update = (owner: StaffCase) =>
      owner.id === ownerId
        ? { ...owner, internal_case_files: [result.file, ...(owner.internal_case_files ?? [])] }
        : owner;
    setCases((current) => current.map(update));
    setSelectedCase((current) => (current ? update(current) : current));
    form.reset();
    setStatus('Internal staff-only file saved.');
  }

  async function openInternalFile(ownerId: string, fileId: string) {
    if (!session) return;
    const response = await fetch(`/api/staff/cases/${ownerId}/files/${fileId}`, {
      headers: bearerHeaders(session),
    });
    const result = await response.json();
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
    else setStatus('This internal file is not available to your assigned staff account.');
  }

  async function saveWorkspace(owner: StaffCase, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const existing = caseWorkspace(owner);
    const cents = String(formData.get('opportunityValue') || '').trim();
    const count = String(formData.get('mineralRightsCount') || '').trim();
    const response = await fetch(`/api/staff/cases/${owner.id}/workspace`, {
      method: 'PUT',
      headers: { ...bearerHeaders(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: String(formData.get('status') || 'intake'),
        caseRating: String(formData.get('caseRating') || 'unrated'),
        priority: String(formData.get('priority') || 'normal'),
        intakeConfidenceScore: String(formData.get('intakeConfidenceScore') || '').trim()
          ? Number(formData.get('intakeConfidenceScore'))
          : null,
        verificationConfidence: String(formData.get('verificationConfidence') || 'unknown'),
        underwriterBrief: String(formData.get('underwriterBrief') || ''),
        dataPullBrief: String(formData.get('dataPullBrief') || ''),
        confidenceGaps: String(formData.get('confidenceGaps') || ''),
        recommendedFocus: String(formData.get('recommendedFocus') || ''),
        opportunityValueCents: cents ? Math.round(Number(cents) * 100) : null,
        opportunitySizeLabel: String(formData.get('opportunitySizeLabel') || ''),
        mineralRightsCount: count ? Number(count) : null,
        lastContactAt: isoDateTimeValue(formData.get('lastContactAt')),
        riskFlags: existing?.risk_flags ?? [],
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus('The internal case dossier could not be saved.');
      return;
    }
    const update = (item: StaffCase) =>
      item.id === owner.id ? { ...item, internal_case_workspaces: result.workspace } : item;
    setCases((current) => current.map(update));
    setSelectedCase((current) => (current ? update(current) : current));
    setStatus('Internal case dossier saved for staff only.');
    await refreshDashboard();
  }

  if (isRecoverySession && session)
    return (
      <form className="account-card account-signin" onSubmit={setRecoveredPassword}>
        <p className="account-kicker">Protected MRX portal</p>
        <h2>Set staff password</h2>
        <p>
          This authenticated Supabase recovery session can set a new password. Case access still
          requires an active MRX staff role and assignment.
        </p>
        <label>
          New password
          <input
            name="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={authBusy}>
          {authBusy ? 'Saving password…' : 'Save staff password'}
        </button>
        {status && (
          <p className="account-status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </form>
    );

  if (loading && !cases.length)
    return (
      <div className="account-card" aria-busy="true">
        <p>Loading the protected MRX portal…</p>
      </div>
    );

  if (!session)
    return (
      <div className="account-card account-signin">
        <p className="account-kicker">Protected MRX portal</p>
        <h2>Staff sign in</h2>
        <p>
          Use an authorized MRX staff email and password. Case access is limited by active staff
          role and assignment after authentication.
        </p>
        <form onSubmit={signInWithPassword}>
          <label>
            Staff email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" disabled={authBusy}>
            {authBusy ? 'Signing in…' : 'Sign in to staff portal'}
          </button>
        </form>
        <details className="staff-auth-recovery">
          <summary>Set or reset password</summary>
          <p>
            First-time staff and anyone who forgot their password can request secure setup
            instructions.
          </p>
          <form onSubmit={requestPasswordRecovery}>
            <label>
              Staff email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <button type="submit" disabled={authBusy}>
              {authBusy ? 'Requesting instructions…' : 'Email password instructions'}
            </button>
          </form>
        </details>
        {status && (
          <p className="account-status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </div>
    );

  const selected = selectedCase ?? cases[0] ?? null;
  const workspace = selected ? caseWorkspace(selected) : null;
  const summary = filterSummary(filters);
  const facets = envelope?.facets ?? {
    mineralCounties: [],
    mineralStates: [],
    mineralBasins: [],
    operators: [],
  };
  const pageInfo = envelope?.page;

  return (
    <div className="staff-backoffice-shell">
      <aside className="staff-shell-nav" aria-label="MRX backoffice navigation">
        <div className="staff-shell-brand">
          <span aria-hidden="true">MRX</span>
          <div>
            <strong>Backoffice</strong>
            <small>Protected workspace</small>
          </div>
        </div>
        <nav>
          {(
            [
              ['overview', 'Overview'],
              ['pipeline', 'Deals pipeline'],
              ['owners', 'Owner cases'],
            ] as const
          ).map(([view, label]) => (
            <button
              key={view}
              type="button"
              aria-label={label}
              aria-current={activeView === view ? 'page' : undefined}
              onClick={() => setActiveView(view)}
            >
              <StaffIcon name={view} />
              <span>{label}</span>
              {view === 'pipeline' && dashboard?.summary.needsAttention ? (
                <em>{dashboard.summary.needsAttention}</em>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="staff-shell-private">
          <span aria-hidden="true">◆</span>
          <div>
            <strong>Internal use only</strong>
            <small>Private notes and files are never shown to owners.</small>
          </div>
        </div>
      </aside>

      <div className="staff-shell-content">
        <header className="staff-shell-topbar">
          <div>
            <span className="staff-protected-indicator">
              <i aria-hidden="true" /> Protected MRX portal
            </span>
            <span
              className={`staff-sync-indicator ${dashboard?.summary.ghlSyncFailures ? 'has-exception' : ''}`}
            >
              <StaffIcon name="sync" />
              {dashboard?.summary.ghlSyncFailures
                ? `${dashboard.summary.ghlSyncFailures} GHL sync exception${dashboard.summary.ghlSyncFailures === 1 ? '' : 's'}`
                : 'GHL sync healthy'}
            </span>
          </div>
          <div className="staff-user-menu">
            <span>
              <strong>{staffIdentity?.display_name || session.user.email}</strong>
              <small>
                {staffIdentity?.role || 'staff'} · {session.user.email}
              </small>
            </span>
            <button type="button" onClick={() => supabase?.auth.signOut()}>
              Sign out
            </button>
          </div>
        </header>
        {status && (
          <p className="account-status staff-shell-status" role="status" aria-live="polite">
            {status}
          </p>
        )}

        <main className="staff-shell-main">
          {activeView === 'overview' && (
            <StaffOverview
              dashboard={dashboard}
              loading={dashboardLoading}
              onOpenPipeline={() => setActiveView('pipeline')}
              onOpenCases={() => setActiveView('owners')}
              onSelectCase={selectDashboardCase}
            />
          )}
          {activeView === 'pipeline' && (
            <StaffPipeline
              dashboard={dashboard}
              loading={dashboardLoading}
              movingCaseId={movingCaseId}
              onSelectCase={selectDashboardCase}
              onMoveCase={movePipelineCase}
            />
          )}
          {activeView === 'owners' && (
            <div className="account-hub staff-database">
              <section className="staff-view-heading staff-owner-view-heading">
                <div>
                  <p className="account-kicker">Owner cases database</p>
                  <h2>Find an owner or opportunity</h2>
                  <p>
                    Search every inquiry visible to your role, then open the complete owner profile.
                  </p>
                </div>
                <span className="staff-owner-total">
                  <strong>{pageInfo?.total ?? cases.length}</strong>
                  <small>visible cases</small>
                </span>
              </section>
              <form
                className="staff-search"
                role="search"
                aria-label="Filter owner cases"
                onSubmit={(event) => event.preventDefault()}
              >
                <label>
                  Search owners
                  <input
                    type="search"
                    value={filters.q}
                    onChange={(event) =>
                      updateFilter('q', normalizeStaffSearchQuery(event.target.value))
                    }
                    placeholder="Name, email, phone, city, county, state"
                    aria-describedby="staff-search-help"
                  />
                  <span id="staff-search-help" className="staff-search__help">
                    Searches name, email, phone, residence city, county, and state.
                  </span>
                </label>
                <label>
                  Case status
                  <select
                    value={filters.status}
                    onChange={(event) => updateFilter('status', event.target.value)}
                    aria-label="Case status"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Rating
                  <select
                    value={filters.rating}
                    onChange={(event) => updateFilter('rating', event.target.value)}
                    aria-label="Rating"
                  >
                    <option value="">All ratings</option>
                    {ratingOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <details className="staff-advanced-filters">
                  <summary>
                    More filters
                    <span>
                      {summary.activeCount > 2
                        ? `${summary.activeCount - 2} advanced active`
                        : 'Optional'}
                    </span>
                  </summary>
                  <div className="staff-advanced-filters__grid">
                    <div className="staff-form-row">
                      <label>
                        Priority
                        <select
                          value={filters.priority}
                          onChange={(event) =>
                            updateFilter('priority', event.target.value as Filters['priority'])
                          }
                          aria-label="Priority"
                        >
                          <option value="">All priorities</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </label>
                      <label>
                        Verification
                        <select
                          value={filters.verification}
                          onChange={(event) =>
                            updateFilter(
                              'verification',
                              event.target.value as Filters['verification'],
                            )
                          }
                          aria-label="Verification"
                        >
                          <option value="">Any verification</option>
                          <option value="unknown">Unknown</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>
                      <label>
                        Min mineral interests
                        <div className="staff-form-row">
                          <select
                            value={filters.mineralCountOp}
                            onChange={(event) =>
                              updateFilter(
                                'mineralCountOp',
                                event.target.value as Filters['mineralCountOp'],
                              )
                            }
                            aria-label="Mineral count operator"
                          >
                            <option value="">No filter</option>
                            <option value=">=">At least</option>
                            <option value="=">Equal to</option>
                            <option value="<=">At most</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            value={filters.mineralCount}
                            onChange={(event) => updateFilter('mineralCount', event.target.value)}
                            aria-label="Mineral count value"
                            placeholder="Threshold"
                          />
                        </div>
                        <small className="staff-search__help">
                          Operator and threshold for effective mineral count.
                        </small>
                      </label>
                    </div>

                    <div className="staff-form-row">
                      <label>
                        Mineral county
                        <select
                          value={filters.mineralCounty}
                          onChange={(event) => updateFilter('mineralCounty', event.target.value)}
                          aria-label="Mineral county"
                        >
                          <option value="">Any county</option>
                          {facets.mineralCounties.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Mineral state
                        <select
                          value={filters.mineralState}
                          onChange={(event) => updateFilter('mineralState', event.target.value)}
                          aria-label="Mineral state"
                        >
                          <option value="">Any state</option>
                          {facets.mineralStates.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Mineral basin
                        <select
                          value={filters.mineralBasin}
                          onChange={(event) => updateFilter('mineralBasin', event.target.value)}
                          aria-label="Mineral basin"
                        >
                          <option value="">Any basin</option>
                          <option value="__none__">(Unknown)</option>
                          {facets.mineralBasins
                            .filter((value): value is string => Boolean(value))
                            .map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Operator
                        <select
                          value={filters.operator}
                          onChange={(event) => updateFilter('operator', event.target.value)}
                          aria-label="Operator"
                        >
                          <option value="">Any operator</option>
                          <option value="__none__">(Unknown)</option>
                          {facets.operators
                            .filter((value): value is string => Boolean(value))
                            .map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>

                    <div className="staff-form-row">
                      <label>
                        Has open risks
                        <select
                          value={filters.hasOpenRisks}
                          onChange={(event) =>
                            updateFilter(
                              'hasOpenRisks',
                              event.target.value as Filters['hasOpenRisks'],
                            )
                          }
                          aria-label="Has open risks"
                        >
                          <option value="any">Any</option>
                          <option value="yes">Yes, any open</option>
                          <option value="no">No, none open</option>
                        </select>
                      </label>
                      <label>
                        Open risk severity
                        <select
                          value={filters.riskSeverityFloor}
                          onChange={(event) =>
                            updateFilter(
                              'riskSeverityFloor',
                              event.target.value as Filters['riskSeverityFloor'],
                            )
                          }
                          aria-label="Open risk severity"
                        >
                          <option value="any">Any severity</option>
                          <option value="low+">Low+</option>
                          <option value="medium+">Medium+</option>
                          <option value="high+">High+</option>
                          <option value="critical">Critical only</option>
                        </select>
                      </label>
                      <label>
                        Has assignee
                        <select
                          value={filters.assigneeScope}
                          onChange={(event) =>
                            updateFilter(
                              'assigneeScope',
                              event.target.value as Filters['assigneeScope'],
                            )
                          }
                          aria-label="Has assignee"
                        >
                          <option value="any">Any</option>
                          <option value="me">Assigned to me</option>
                          <option value="anyone">Assigned to anyone</option>
                          <option value="unassigned">Unassigned (admin only)</option>
                        </select>
                      </label>
                      <label>
                        Last contact
                        <select
                          value={filters.lastContactBucket}
                          onChange={(event) =>
                            updateFilter(
                              'lastContactBucket',
                              event.target.value as Filters['lastContactBucket'],
                            )
                          }
                          aria-label="Last contact"
                        >
                          <option value="any">Any time</option>
                          <option value="never">Never contacted</option>
                          <option value="7d">&lt;7 days</option>
                          <option value="30d">8-30 days</option>
                          <option value="90d">31-90 days</option>
                          <option value="over90">&gt;90 days</option>
                        </select>
                      </label>
                    </div>

                    <div className="staff-form-row">
                      <label>
                        Recommended focus
                        <select
                          value={filters.recommendedFocus}
                          onChange={(event) =>
                            updateFilter(
                              'recommendedFocus',
                              event.target.value as Filters['recommendedFocus'],
                            )
                          }
                          aria-label="Recommended focus"
                        >
                          <option value="any">Any</option>
                          <option value="missing">Missing</option>
                          <option value="present">Present</option>
                        </select>
                      </label>
                      <label>
                        Focus search
                        <input
                          type="search"
                          value={filters.focusSearch}
                          onChange={(event) =>
                            updateFilter(
                              'focusSearch',
                              normalizeStaffSearchQuery(event.target.value, 80),
                            )
                          }
                          placeholder="Search recommended focus text"
                          aria-label="Focus search"
                        />
                      </label>
                      <div className="staff-search__actions">
                        <button type="button" onClick={clearFilters}>
                          Clear filters
                        </button>
                        <small aria-live="polite">
                          {summary.activeCount > 0
                            ? `${summary.activeCount} active filter${summary.activeCount === 1 ? '' : 's'}`
                            : 'No filters applied'}
                        </small>
                      </div>
                    </div>
                  </div>
                </details>
                {summary.activeCount > 0 && (
                  <div className="staff-active-filters" aria-live="polite">
                    <span>
                      {summary.activeCount} active filter{summary.activeCount === 1 ? '' : 's'}
                    </span>
                    <button type="button" onClick={clearFilters}>
                      Clear all filters
                    </button>
                  </div>
                )}
              </form>

              <div className="staff-database-meta" aria-live="polite" aria-atomic="true">
                <span>
                  {pageInfo
                    ? `Showing ${pageInfo.returned === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1}-${(pageInfo.page - 1) * pageInfo.pageSize + pageInfo.returned} of ${pageInfo.total} case${pageInfo.total === 1 ? '' : 's'}${summary.activeCount > 0 ? ` matching ${summary.activeCount} filter${summary.activeCount === 1 ? '' : 's'}` : ''}.`
                    : 'Loading case list…'}
                </span>
                <div className="staff-database-meta__sort">
                  <label className="staff-search__help" htmlFor="staff-sort">
                    Sort by
                  </label>
                  <select
                    id="staff-sort"
                    value={filters.sort}
                    onChange={(event) =>
                      updateFilter('sort', event.target.value as StaffCaseListSortKey)
                    }
                    aria-label="Sort owner cases by"
                  >
                    {SORT_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {pageInfo && pageInfo.totalPages > 1 && (
                  <nav className="staff-database-meta__nav" aria-label="Owner cases pagination">
                    <button
                      type="button"
                      onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page <= 1}
                      aria-label="Go to previous page"
                    >
                      ‹ Prev
                    </button>
                    <span
                      aria-current="page"
                      aria-label={`Page ${filters.page} of ${pageInfo.totalPages}`}
                    >
                      {filters.page} / {pageInfo.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFilter('page', Math.min(pageInfo.totalPages, filters.page + 1))
                      }
                      disabled={filters.page >= pageInfo.totalPages}
                      aria-label="Go to next page"
                    >
                      Next ›
                    </button>
                  </nav>
                )}
              </div>

              <div className="staff-database-grid">
                <aside className="staff-case-list" aria-label="Owner cases" aria-busy={refining}>
                  {refining && cases.length > 0 && (
                    <p className="account-status" role="status" aria-live="polite">
                      Filtering cases…
                    </p>
                  )}
                  {!cases.length && !refining ? (
                    <div role="status" aria-live="polite" className="account-empty">
                      <p>No owner cases match this view.</p>
                      <p>
                        <button type="button" onClick={clearFilters}>
                          Clear filters
                        </button>
                      </p>
                      <small>
                        Adjust filters or contact an MRX admin to confirm assignment scope.
                      </small>
                    </div>
                  ) : (
                    cases.map((owner) => {
                      const itemWorkspace = caseWorkspace(owner);
                      const semantics = owner.semantics ?? deriveStaffRowSemantics(owner);
                      const priority = itemWorkspace?.priority ?? 'normal';
                      return (
                        <button
                          className={`staff-case-row ${
                            selected?.id === owner.id ? 'staff-case-row--active' : ''
                          } staff-case-row__priority ${priorityClass(priority)}`}
                          key={owner.id}
                          type="button"
                          aria-current={selected?.id === owner.id ? 'true' : undefined}
                          onClick={() => openCase(owner.id)}
                        >
                          <span>
                            <strong>{ownerName(owner)}</strong>
                            <small>
                              {[owner.email, owner.phone].filter(Boolean).join(' · ') ||
                                'No verified contact shown'}
                            </small>
                          </span>
                          <span
                            className={`staff-pill staff-pill--${itemWorkspace?.case_rating ?? 'unrated'}`}
                            aria-label={`Rating: ${labelFor(ratingOptions, itemWorkspace?.case_rating)}`}
                          >
                            {labelFor(ratingOptions, itemWorkspace?.case_rating)}
                          </span>
                          <small>
                            {labelFor(statusOptions, itemWorkspace?.status ?? 'intake')} ·{' '}
                            {moneyLabel(itemWorkspace?.opportunity_value_cents)} ·{' '}
                            {semantics.effectiveMineralCount} rights
                            <span className="account-visually-hidden">
                              {`source: ${semantics.countSource === 'workspace' ? 'internal_case_workspaces.mineral_rights_count' : 'mineral_interests length'}`}
                            </span>
                          </small>
                          <div className="staff-case-row__chips">
                            <span
                              className={`staff-case-row__chip ${priorityClass(priority)} staff-case-row__priority`}
                              aria-label={`Priority: ${priority}`}
                            >
                              <span className="account-visually-hidden">Priority:</span>
                              Priority: {priority}
                            </span>
                            {semantics.openRiskCount > 0 && (
                              <span
                                className={`staff-pill staff-pill--severity-${semantics.maxOpenSeverity ?? 'low'}`}
                                aria-label={`${semantics.openRiskCount} open risk${semantics.openRiskCount === 1 ? '' : 's'}`}
                              >
                                Risks: {semantics.openRiskCount}
                                {semantics.maxOpenSeverity
                                  ? ` (max: ${severityLabel(semantics.maxOpenSeverity)})`
                                  : ''}
                              </span>
                            )}
                            <span
                              className="staff-case-row__chip"
                              aria-label={`Assigned: ${semantics.assigneeLabel}`}
                            >
                              {semantics.assigneeLabel === 'Unassigned'
                                ? 'Unassigned'
                                : `Assigned: ${semantics.assigneeLabel}`}
                            </span>
                            <span className="staff-case-row__chip">
                              {itemWorkspace?.last_contact_at
                                ? `Last contact: ${relativeDateLabel(itemWorkspace.last_contact_at)}`
                                : 'Never contacted'}
                            </span>
                            <span className="staff-case-row__chip">
                              GHL: {semantics.isGhlMapped ? semantics.ghlDisplay : 'Not mapped'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </aside>

                {selected && (
                  <section className="staff-profile">
                    <section
                      aria-labelledby="staff-profile-identity-heading"
                      className="account-section-head"
                    >
                      <div>
                        <p className="account-kicker">Identity &amp; location</p>
                        <h3 id="staff-profile-identity-heading">{ownerName(selected)}</h3>
                        <p>
                          {[selected.email, selected.phone, selected.timezone]
                            .filter(Boolean)
                            .join(' · ') || 'No verified contact shown'}
                        </p>
                        <small>
                          {[
                            selected.residence_city,
                            selected.residence_county && `${selected.residence_county} County`,
                            selected.residence_state,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'Residence geography not added'}
                          <span className="account-visually-hidden">
                            source: profiles.residence_city, residence_county, residence_state
                          </span>
                        </small>
                        <small>
                          {selected.ghl_contact_id
                            ? `GHL contact ${selected.ghl_contact_id}`
                            : 'No linked GHL contact'}
                        </small>
                      </div>
                      <div className="staff-profile-metrics">
                        <span
                          className={`staff-pill staff-pill--${workspace?.case_rating ?? 'unrated'}`}
                          aria-label={`Rating: ${labelFor(ratingOptions, workspace?.case_rating)}`}
                        >
                          {labelFor(ratingOptions, workspace?.case_rating)}
                        </span>
                        <small>Start {dateLabel(selected.created_at)}</small>
                        <small>
                          Last contact {dateLabel(workspace?.last_contact_at)}{' '}
                          <span className="account-visually-hidden">
                            from internal_case_workspaces.last_contact_at
                          </span>
                        </small>
                        <small>
                          Last activity {dateLabel(selected.last_seen_at)}{' '}
                          <span className="account-visually-hidden">
                            from profiles.last_seen_at
                          </span>
                        </small>
                      </div>
                    </section>

                    <section aria-labelledby="staff-profile-summary-heading">
                      <p className="account-kicker">Case summary</p>
                      <h3 id="staff-profile-summary-heading" className="staff-section-title">
                        Stage, rating, priority, mineral rights, valuation status
                      </h3>
                      <div className="staff-summary-cards">
                        <div>
                          <strong>{labelFor(statusOptions, workspace?.status ?? 'intake')}</strong>
                          <small>
                            Case status ·{' '}
                            <span className="account-visually-hidden">
                              internal_case_workspaces.status
                            </span>
                          </small>
                        </div>
                        <div>
                          <strong>
                            {labelFor(ratingOptions, workspace?.case_rating ?? 'unrated')}
                          </strong>
                          <small>
                            Rating ·{' '}
                            <span className="account-visually-hidden">
                              internal_case_workspaces.case_rating
                            </span>
                          </small>
                        </div>
                        <div>
                          <strong>
                            {(workspace?.priority ?? 'normal').replace(/^./, (c) =>
                              c.toUpperCase(),
                            )}
                          </strong>
                          <small>
                            Priority ·{' '}
                            <span className="account-visually-hidden">
                              internal_case_workspaces.priority
                            </span>
                          </small>
                        </div>
                        <div>
                          <strong>
                            {selected.semantics?.effectiveMineralCount ??
                              workspace?.mineral_rights_count ??
                              selected.mineral_interests?.length ??
                              0}
                          </strong>
                          <small>
                            Mineral rights ·{' '}
                            <span className="account-visually-hidden">
                              effective mineral count · from workspace override or any interest
                            </span>
                          </small>
                        </div>
                        <div>
                          <strong>{moneyLabel(workspace?.opportunity_value_cents)}</strong>
                          <small>{workspace?.opportunity_size_label || 'Opportunity value'}</small>
                        </div>
                        <div className="staff-summary-cards__valuation">
                          <strong>
                            {selected.semantics?.valuationStatusLabel ?? 'Valuation status'}
                          </strong>
                          <small>
                            Valuation status ·{' '}
                            <span className="account-visually-hidden">
                              internal_case_workspaces.valuation_status
                            </span>
                          </small>
                        </div>
                      </div>
                    </section>

                    <section aria-label="Underwriter packet readiness">
                      <p className="account-kicker">Underwriter packet readiness</p>
                      <h3 className="staff-section-title">Underwriter packet readiness</h3>
                      {packetLoading ? (
                        <p aria-busy="true">Reconciling checklist and source evidence…</p>
                      ) : !underwritingPacket ? (
                        <p>Packet status is unavailable. No readiness transition can be made.</p>
                      ) : (
                        <>
                          <div className="staff-summary-cards">
                            <div>
                              <strong>{underwritingPacket.packet.readinessStatus}</strong>
                              <small>Derived readiness</small>
                            </div>
                            <div>
                              <strong>
                                {underwritingPacket.packet.counts.complete} /{' '}
                                {underwritingPacket.packet.counts.total}
                              </strong>
                              <small>Requirements complete</small>
                            </div>
                            <div>
                              <strong>{underwritingPacket.packet.counts.blockers}</strong>
                              <small>Readiness blockers</small>
                            </div>
                            <div>
                              <strong>
                                {underwritingPacket.packetRecord?.packet_version ||
                                  'mrx-underwriting-packet-v1'}
                              </strong>
                              <small>
                                Packet version · hash{' '}
                                {(
                                  underwritingPacket.packetRecord?.packet_hash ||
                                  underwritingPacket.packet.sourceFingerprint ||
                                  'pending'
                                ).slice(0, 12)}
                              </small>
                            </div>
                          </div>

                          {underwritingPacket.packet.blockers.length > 0 && (
                            <div className="staff-alert-list" role="status">
                              {underwritingPacket.packet.blockers.map((blocker) => (
                                <p key={`${blocker.code}:${blocker.requirementKey || ''}`}>
                                  <strong>{blocker.code.replaceAll('_', ' ')}</strong> ·{' '}
                                  {blocker.label}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="account-files">
                            {underwritingPacket.requirements.map((requirement) => {
                              const derived = underwritingPacket.packet.requirements.find(
                                (item) => item.requirementKey === requirement.requirement_key,
                              );
                              const eligibleAttachments = underwritingPacket.attachments.filter(
                                (attachment) =>
                                  attachment.status === 'ready' &&
                                  Boolean(attachment.document_type) &&
                                  requirement.accepted_document_types.includes(
                                    attachment.document_type || '',
                                  ) &&
                                  (!requirement.mineral_interest_id ||
                                    attachment.mineral_interest_id ===
                                      requirement.mineral_interest_id),
                              );
                              const complete = ['verified', 'waived', 'not_applicable'].includes(
                                derived?.effectiveStatus || requirement.status,
                              );
                              return (
                                <div key={requirement.id}>
                                  <span>
                                    <strong>{requirement.label}</strong>
                                    <small>
                                      {requirement.requirement_level === 'recommended' ||
                                      !requirement.required
                                        ? 'Recommended'
                                        : 'Required'}{' '}
                                      · {derived?.effectiveStatus || requirement.status}
                                      {requirement.waiver_reason
                                        ? ` · Waiver: ${requirement.waiver_reason}`
                                        : ''}
                                    </small>
                                  </span>
                                  <div className="staff-dashboard-actions">
                                    {!complete && eligibleAttachments.length > 0 && (
                                      <form
                                        onSubmit={(event) =>
                                          verifyUnderwritingRequirement(
                                            selected.id,
                                            requirement.id,
                                            event,
                                          )
                                        }
                                      >
                                        <label>
                                          <span className="account-visually-hidden">
                                            Document for {requirement.label}
                                          </span>
                                          <select name="attachmentId" required>
                                            <option value="">Choose processed document</option>
                                            {eligibleAttachments.map((attachment) => (
                                              <option key={attachment.id} value={attachment.id}>
                                                {attachment.original_name ||
                                                  attachment.document_type}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                        <button type="submit" disabled={packetBusy}>
                                          Verify
                                        </button>
                                      </form>
                                    )}
                                    {!complete &&
                                      ['admin', 'underwriter'].includes(
                                        staffIdentity?.role || '',
                                      ) && (
                                        <button
                                          type="button"
                                          disabled={packetBusy}
                                          onClick={() =>
                                            waiveUnderwritingRequirement(
                                              selected.id,
                                              requirement.id,
                                            )
                                          }
                                        >
                                          Waive with reason
                                        </button>
                                      )}
                                    {complete &&
                                      ['admin', 'underwriter', 'reviewer'].includes(
                                        staffIdentity?.role || '',
                                      ) && (
                                        <button
                                          type="button"
                                          disabled={packetBusy}
                                          onClick={() =>
                                            updateUnderwritingPacket(
                                              selected.id,
                                              {
                                                action: 'reopen_requirement',
                                                requirementId: requirement.id,
                                              },
                                              'Requirement reopened for review.',
                                            )
                                          }
                                        >
                                          Reopen
                                        </button>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="staff-dashboard-actions">
                            {underwritingPacket.packet.isFinalized ? (
                              <button
                                type="button"
                                disabled={packetBusy}
                                onClick={() => {
                                  const reason = window.prompt(
                                    'Why is this finalized packet being reopened?',
                                  );
                                  if (reason?.trim() && reason.trim().length >= 10) {
                                    void updateUnderwritingPacket(
                                      selected.id,
                                      { action: 'reopen_packet', reason: reason.trim() },
                                      'Underwriter packet reopened and case readiness removed.',
                                    );
                                  } else {
                                    setStatus(
                                      'A packet-reopen reason of at least 10 characters is required.',
                                    );
                                  }
                                }}
                              >
                                Reopen finalized packet
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!underwritingPacket.packet.canFinalize || packetBusy}
                                onClick={() =>
                                  updateUnderwritingPacket(
                                    selected.id,
                                    { action: 'finalize' },
                                    'Packet finalized. Case is ready for Senior Underwriter review.',
                                  )
                                }
                              >
                                Finalize packet readiness
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </section>

                    <section aria-labelledby="staff-profile-ghl-heading">
                      <p className="account-kicker">GHL opportunity</p>
                      <h3 id="staff-profile-ghl-heading" className="staff-section-title">
                        Pipeline, stage, opportunity id, monetary value, GHL pipeline status
                      </h3>
                      <div className="staff-summary-cards">
                        <div>
                          <strong>{workspace?.ghl_pipeline_name || 'Not mapped'}</strong>
                          <small>Pipeline</small>
                        </div>
                        <div>
                          <strong>{workspace?.ghl_pipeline_stage_name || 'Not mapped'}</strong>
                          <small>Stage</small>
                        </div>
                        <div>
                          <strong>{workspace?.ghl_opportunity_id || 'Not mapped'}</strong>
                          <small>Opportunity id</small>
                        </div>
                        <div>
                          <strong>{moneyLabel(workspace?.opportunity_value_cents)}</strong>
                          <small>Monetary value</small>
                        </div>
                        <div>
                          <strong>
                            {workspace?.ghl_pipeline_status?.replaceAll('_', ' ') || 'Not mapped'}
                          </strong>
                          <small>GHL pipeline status</small>
                        </div>
                      </div>
                      <small>
                        Sourced from MRX_GHL_OWNER_CASE_STAGE_MAP_JSON or live sync; never a
                        hardcoded placeholder.
                      </small>
                    </section>

                    <section aria-labelledby="staff-profile-mineral-heading">
                      <p className="account-kicker">Mineral interests</p>
                      <h3 id="staff-profile-mineral-heading" className="staff-section-title">
                        Per-interest detail with geography chips
                      </h3>
                      {(() => {
                        const semantics = selected.semantics ?? deriveStaffRowSemantics(selected);
                        const counties = semantics.uniqueCounties;
                        const states = semantics.uniqueStates;
                        const operators = semantics.uniqueOperators;
                        if (!counties.length && !states.length && !operators.length) {
                          return <small>No mineral interests recorded for this owner yet.</small>;
                        }
                        return (
                          <ul className="staff-chips" aria-label="Mineral geography chips">
                            {counties.map((value) => (
                              <li key={`county-${value}`}>County · {value}</li>
                            ))}
                            {states.map((value) => (
                              <li key={`state-${value}`}>State · {value}</li>
                            ))}
                            {operators.map((value, idx) => (
                              <li key={`operator-${idx}-${value}`}>
                                Operator · {value || 'Unknown'}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                      <div className="account-files">
                        {selected.mineral_interests?.map((interest) => (
                          <div key={interest.id}>
                            <span>
                              <strong>
                                {interest.label ||
                                  [interest.city, interest.county, interest.state]
                                    .filter(Boolean)
                                    .join(', ')}
                              </strong>
                              <small>
                                {[
                                  interest.basin_name,
                                  interest.operator,
                                  interest.ownership_type,
                                  interest.net_mineral_acres && `${interest.net_mineral_acres} NMA`,
                                  interest.gross_acres_under_lease &&
                                    `${interest.gross_acres_under_lease} gross lease acres`,
                                  interest.lease_status && `Leased: ${interest.lease_status}`,
                                  interest.producing_status &&
                                    `Producing: ${interest.producing_status}`,
                                  interest.recent_check_amount &&
                                    `Recent check: ${interest.recent_check_amount}`,
                                  interest.royalty_decimal && `${interest.royalty_decimal} royalty`,
                                  interest.location_precision,
                                  interest.geography_status,
                                  interest.basin_needs_confirmation && 'basin confirmation needed',
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Operator not recorded'}
                              </small>
                              <small>
                                {[
                                  interest.legal_description,
                                  interest.township_district &&
                                    `Township/district: ${interest.township_district}`,
                                  interest.block_section &&
                                    `Block/section: ${interest.block_section}`,
                                  interest.abstract_survey &&
                                    `Abstract/survey: ${interest.abstract_survey}`,
                                  interest.section_township_range &&
                                    `Section-township-range: ${interest.section_township_range}`,
                                  interest.unknown_fields?.length &&
                                    `Unknown: ${interest.unknown_fields.join(', ')}`,
                                  interest.lease_name && `Lease: ${interest.lease_name}`,
                                  interest.well_names?.length &&
                                    `Wells: ${interest.well_names.join(', ')}`,
                                  interest.county_fips && `County FIPS: ${interest.county_fips}`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'No additional mineral detail recorded'}
                              </small>
                            </span>
                            <OwnerProfileInterestEditor
                              interest={interest}
                              onSubmit={(event) =>
                                updateOwnerInterest(selected.id, interest, event)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section aria-labelledby="staff-profile-risk-heading">
                      <p className="account-kicker">Risk flags</p>
                      <h3 id="staff-profile-risk-heading" className="staff-section-title">
                        Open risk codes with severity text
                      </h3>
                      {(() => {
                        const openRisks = (workspace?.risk_flags ?? []).filter(
                          (flag) =>
                            !flag?.status || flag.status === 'open' || flag.status === 'reviewing',
                        );
                        if (!openRisks.length) {
                          return <small>No open risk flags recorded.</small>;
                        }
                        const sorted = [...openRisks].sort(
                          (a, b) =>
                            (SEVERITY_ORDER[b.severity] ?? -1) - (SEVERITY_ORDER[a.severity] ?? -1),
                        );
                        return (
                          <ol className="staff-risk-flags">
                            {sorted.map((flag, idx) => (
                              <li key={`${flag.code}-${idx}`}>
                                <span>
                                  <code>{flag.code}</code>
                                  <small>{flag.description}</small>
                                </span>
                                <span
                                  className={`staff-pill staff-pill--severity-${flag.severity}`}
                                  aria-label={`Severity: ${severityLabel(flag.severity)}`}
                                >
                                  Severity: {severityLabel(flag.severity)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        );
                      })()}
                    </section>

                    <section aria-labelledby="staff-profile-workspace-heading">
                      <p className="account-kicker">Workspace dossier</p>
                      <h3 id="staff-profile-workspace-heading" className="staff-section-title">
                        Editable staff-only dossier
                      </h3>
                      <div className="staff-valuation-transitions" role="note">
                        <strong>Valuation transitions</strong>
                        <span>
                          Valuation transitions are underwriter-admin only and ship in the next
                          release. Contact an MRX admin to request a transition.
                        </span>
                        <small>
                          Current valuation status:{' '}
                          {selected.semantics?.valuationStatusLabel ?? 'Unknown valuation status'}.
                          Workspace updates do not change valuation_status. Use the Valuation
                          transitions section above.
                        </small>
                      </div>
                      <form
                        key={`${selected.id}:${workspace?.updated_at ?? 'new'}`}
                        className="staff-workspace-form"
                        onSubmit={(event) => saveWorkspace(selected, event)}
                      >
                        <div className="staff-form-row">
                          <label>
                            Case status
                            <select name="status" defaultValue={workspace?.status ?? 'intake'}>
                              {statusOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Rating
                            <select
                              name="caseRating"
                              defaultValue={workspace?.case_rating ?? 'unrated'}
                            >
                              {ratingOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Priority
                            <select name="priority" defaultValue={workspace?.priority ?? 'normal'}>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </label>
                          <label>
                            Intake confidence
                            <input
                              name="intakeConfidenceScore"
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={workspace?.intake_confidence_score ?? ''}
                            />
                          </label>
                        </div>
                        <div className="staff-form-row">
                          <label>
                            Opportunity value ($)
                            <input
                              name="opportunityValue"
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={
                                workspace?.opportunity_value_cents
                                  ? workspace.opportunity_value_cents / 100
                                  : ''
                              }
                            />
                          </label>
                          <label>
                            Opportunity size label
                            <input
                              name="opportunitySizeLabel"
                              maxLength={120}
                              defaultValue={workspace?.opportunity_size_label ?? ''}
                            />
                          </label>
                          <label>
                            Number of mineral rights
                            <input
                              name="mineralRightsCount"
                              type="number"
                              min="0"
                              defaultValue={
                                workspace?.mineral_rights_count ??
                                selected.mineral_interests?.length ??
                                ''
                              }
                            />
                          </label>
                          <label>
                            Last contact date
                            <input
                              name="lastContactAt"
                              type="datetime-local"
                              defaultValue={localDateTimeValue(workspace?.last_contact_at)}
                            />
                          </label>
                        </div>
                        <label>
                          Verification
                          <select
                            name="verificationConfidence"
                            defaultValue={workspace?.verification_confidence ?? 'unknown'}
                          >
                            <option value="unknown">Unknown</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                        <label>
                          Underwriter brief
                          <textarea
                            name="underwriterBrief"
                            maxLength={50000}
                            defaultValue={workspace?.underwriter_brief ?? ''}
                          />
                        </label>
                        <label>
                          Data pull brief
                          <textarea
                            name="dataPullBrief"
                            maxLength={50000}
                            defaultValue={workspace?.data_pull_brief ?? ''}
                          />
                        </label>
                        <label>
                          Confidence gaps
                          <textarea
                            name="confidenceGaps"
                            maxLength={10000}
                            defaultValue={workspace?.confidence_gaps ?? ''}
                          />
                        </label>
                        <label>
                          Recommended review focus
                          <textarea
                            name="recommendedFocus"
                            maxLength={10000}
                            defaultValue={workspace?.recommended_focus ?? ''}
                          />
                        </label>
                        <small>
                          Staff-only dossier. Saving a mapped status synchronizes the real GHL
                          opportunity when the owner has a linked GHL contact. Current GHL sync:{' '}
                          {workspace?.ghl_pipeline_status?.replaceAll('_', ' ') || 'not attempted'}.
                        </small>
                        <button type="submit">Save private case dossier</button>
                      </form>
                    </section>

                    <div className="staff-case-grid">
                      <section
                        aria-labelledby="staff-profile-records-heading"
                        className="account-files"
                      >
                        <div>
                          <span>
                            <strong id="staff-profile-records-heading">
                              Owner, mineral-interest, document, appointment, and conversation
                              profile
                            </strong>
                            <small>
                              Complete staff-readable case data collected from owner intake and
                              account activity.
                            </small>
                          </span>
                        </div>
                        {selected.owner_facts?.map((fact) => (
                          <div key={fact.id}>
                            <span>
                              <strong>{fact.field.replaceAll('_', ' ')}</strong>
                              <small>
                                {staffFactText(fact.value)} · {fact.status}
                                {fact.source ? ` · ${fact.source}` : ''}
                              </small>
                              {staffFactLinks(fact.value).map((url, index) => (
                                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                                  Open owner reply attachment {index + 1}
                                </a>
                              ))}
                            </span>
                            {fact.status === 'candidate' && (
                              <span>
                                <button
                                  type="button"
                                  disabled={packetBusy}
                                  onClick={() =>
                                    void dispositionOwnerFact(selected.id, fact.id, 'confirm_fact')
                                  }
                                >
                                  Confirm fact
                                </button>
                                <button
                                  type="button"
                                  disabled={packetBusy}
                                  onClick={() =>
                                    void dispositionOwnerFact(selected.id, fact.id, 'reject_fact')
                                  }
                                >
                                  Flag fact
                                </button>
                              </span>
                            )}
                          </div>
                        ))}
                        {selected.conversations?.map((conversation) => (
                          <div key={conversation.id}>
                            <span>
                              <strong>
                                {conversation.title || conversation.last_persona || 'Conversation'}
                              </strong>
                              <small>
                                {conversation.summary || conversation.status} · updated{' '}
                                {dateLabel(conversation.updated_at)}
                              </small>
                            </span>
                          </div>
                        ))}
                        {selected.appointments?.map((appointment) => (
                          <div key={appointment.id}>
                            <span>
                              <strong>{dateLabel(appointment.starts_at)}</strong>
                              <small>
                                {appointment.status} · {appointment.timezone}
                              </small>
                            </span>
                          </div>
                        ))}
                        {selected.attachments?.map((document) => (
                          <div key={document.id}>
                            <span>
                              <strong>{document.original_name}</strong>
                              <small>
                                {document.document_type || 'document'} · {document.status}
                                {document.mineral_interest_id
                                  ? ` · linked to ${selected.mineral_interests?.find((interest) => interest.id === document.mineral_interest_id)?.label || 'a mineral interest'}`
                                  : ''}
                              </small>
                            </span>
                            {document.status === 'ready' && (
                              <button type="button" onClick={() => openDocument(document.id)}>
                                Open securely
                              </button>
                            )}
                          </div>
                        ))}
                      </section>

                      <section
                        aria-labelledby="staff-profile-internal-heading"
                        className="account-files staff-private-panel"
                      >
                        <div>
                          <span>
                            <strong id="staff-profile-internal-heading">Notes &amp; files</strong>
                            <small>
                              Staff-only notes/files. Assigned staff:{' '}
                              {selected.case_assignments
                                ?.map((assignment) => assignment.assigned_staff?.display_name)
                                .filter(Boolean)
                                .join(', ') || 'admin-only until assigned'}
                            </small>
                          </span>
                        </div>
                        {selected.internal_case_notes?.map((note) => (
                          <div key={note.id}>
                            <span>
                              <strong>
                                {note.note_type.replaceAll('_', ' ')} ·{' '}
                                {(note.provenance || 'staff_analysis').replaceAll('_', ' ')}
                              </strong>
                              <small>{note.body}</small>
                              {(note.source_name || note.source_url) && (
                                <small>
                                  {[note.source_name, note.source_url].filter(Boolean).join(' · ')}
                                </small>
                              )}
                            </span>
                          </div>
                        ))}
                        <form
                          className="staff-workspace-form"
                          onSubmit={(event) => addInternalNote(selected.id, event)}
                        >
                          <div className="staff-form-row">
                            <label>
                              Research area
                              <select name="noteType" defaultValue="case_review">
                                <option value="case_review">Case review</option>
                                <option value="document_review">Document review</option>
                                <option value="research">General research</option>
                                <option value="production">Production & wells</option>
                                <option value="parcel_gis">Parcel & GIS</option>
                                <option value="title">Ownership & title</option>
                                <option value="tax_roll">Tax roll</option>
                                <option value="operator">Operator</option>
                                <option value="comparable">Comparable sales</option>
                                <option value="valuation_prep">Valuation prep</option>
                              </select>
                            </label>
                            <label>
                              Evidence label
                              <select name="provenance" defaultValue="staff_analysis">
                                <option value="confirmed">Confirmed</option>
                                <option value="stated">Stated</option>
                                <option value="estimated">Estimated</option>
                                <option value="assumed">Assumed</option>
                                <option value="not_found">Not found</option>
                                <option value="cannot_verify">Cannot verify</option>
                                <option value="staff_analysis">Staff analysis</option>
                              </select>
                            </label>
                          </div>
                          <label>
                            Add internal note
                            <textarea name="body" required maxLength={10000} />
                          </label>
                          <div className="staff-form-row">
                            <label>
                              Source name
                              <input name="sourceName" maxLength={300} />
                            </label>
                            <label>
                              Source URL
                              <input name="sourceUrl" type="url" maxLength={2000} />
                            </label>
                          </div>
                          <button type="submit">Save staff-only note</button>
                        </form>
                        {selected.internal_case_files?.map((file) => (
                          <div key={file.id}>
                            <span>
                              <strong>{file.original_name}</strong>
                              <small>
                                {file.purpose.replaceAll('_', ' ')} · {file.status}
                              </small>
                            </span>
                            {file.status === 'ready' && (
                              <button
                                type="button"
                                onClick={() => openInternalFile(selected.id, file.id)}
                              >
                                Open internal
                              </button>
                            )}
                          </div>
                        ))}
                        <form
                          className="staff-workspace-form"
                          onSubmit={(event) => uploadInternalFile(selected.id, event)}
                        >
                          <label>
                            Internal file purpose
                            <select name="purpose" defaultValue="case_workspace">
                              <option value="case_workspace">Case workspace</option>
                              <option value="mineralholders_import">
                                MineralHolders 42-column import
                              </option>
                              <option value="research_source">Research source</option>
                              <option value="production">Production & wells</option>
                              <option value="parcel_gis">Parcel & GIS</option>
                              <option value="title_review">Ownership & title</option>
                              <option value="tax_roll">Tax roll</option>
                              <option value="operator">Operator</option>
                              <option value="comparable">Comparable sales</option>
                              <option value="underwriter_brief">Underwriter brief</option>
                              <option value="data_pull_brief">Data pull brief</option>
                              <option value="valuation_support">Valuation support</option>
                            </select>
                          </label>
                          <label>
                            Add internal file
                            <input
                              name="file"
                              type="file"
                              required
                              accept="application/pdf,image/jpeg,image/png,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            />
                          </label>
                          <button type="submit">Upload staff-only file</button>
                        </form>
                      </section>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
