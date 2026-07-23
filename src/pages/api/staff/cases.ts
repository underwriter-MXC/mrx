import type { APIRoute } from 'astro';
import {
  STAFF_CASE_LIST_SORT_KEYS,
  auditStaffCaseEvent,
  deriveStaffRowSemantics,
  ownerCaseProfileIds,
  parseStaffCaseListQuery,
  requireStaff,
  type StaffCaseListSortKey,
  type StaffRowSemantics,
} from '../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

export const STAFF_CASE_PROFILE_SELECT = `
  id,first_name,last_name,email,phone,timezone,residence_city,residence_state,residence_county,residence_geography_status,last_seen_at,created_at,ghl_contact_id,
  conversations!conversations_profile_id_fkey(id,title,summary,last_persona,status,created_at,updated_at),
  mineral_interests!mineral_interests_profile_id_fkey(id,label,city,state,state_code,county,county_fips,legal_description,parcel_reference,plss_id,location_precision,geography_status,geography_confidence,basin_name,oil_gas_province,basin_status,basin_confidence,basin_needs_confirmation,basin_source,operator,lease_name,ownership_type,net_mineral_acres,royalty_decimal,well_names,township_district,block_section,abstract_survey,section_township_range,gross_acres_under_lease,lease_status,producing_status,recent_check_amount,unknown_fields,status,updated_at),
  owner_facts(id,field,value,status,confidence,source,created_at),
  attachments(id,mineral_interest_id,original_name,document_type,mime_type,size_bytes,status,created_at),
  appointments(id,starts_at,ends_at,timezone,status,created_at),
  case_assignments(id,staff_profile_id,created_at,assigned_staff:staff_profiles!case_assignments_staff_profile_id_fkey(display_name,role,active)),
  internal_case_workspaces(profile_id,status,case_rating,priority,intake_confidence_score,verification_confidence,underwriter_brief,data_pull_brief,confidence_gaps,recommended_focus,risk_flags,canonical_extraction_policy,valuation_status,opportunity_value_cents,opportunity_size_label,mineral_rights_count,last_contact_at,ghl_opportunity_id,ghl_pipeline_id,ghl_pipeline_stage_id,ghl_pipeline_name,ghl_pipeline_stage_name,ghl_pipeline_status,updated_at),
  internal_case_notes(id,body,note_type,provenance,source_name,source_url,visibility,created_at,staff_profile_id),
  internal_case_files(id,original_name,mime_type,size_bytes,purpose,status,visibility,created_at,staff_profile_id)
`;

const LIST_HARD_LIMIT = 500;
const MIN_LAST_CONTACT_MS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
} as const;
const RISK_SEVERITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 } as const;

type StaffCaseRow = Record<string, any> & {
  id: string;
  internal_case_workspaces?: any;
  mineral_interests?: Array<Record<string, any>> | null;
  case_assignments?: Array<Record<string, any>> | null;
};

type EnrichedCase = {
  case: StaffCaseRow;
  semantics: StaffRowSemantics;
};

type SortConfig = {
  primary: { column: string; ascending: boolean; nullsLast: boolean };
  tieBreaker: { column: string; ascending: boolean };
};

const SORT_PLANS: Record<StaffCaseListSortKey, SortConfig> = {
  last_activity: {
    primary: { column: 'last_seen_at', ascending: false, nullsLast: true },
    tieBreaker: { column: 'created_at', ascending: false },
  },
  last_contact_at: {
    primary: { column: 'last_contact_at', ascending: false, nullsLast: true },
    tieBreaker: { column: 'updated_at', ascending: false },
  },
  opportunity_value_cents: {
    primary: { column: 'opportunity_value_cents', ascending: false, nullsLast: true },
    tieBreaker: { column: 'updated_at', ascending: false },
  },
  created_at: {
    primary: { column: 'created_at', ascending: false, nullsLast: false },
    tieBreaker: { column: 'id', ascending: true },
  },
  full_name: {
    primary: { column: 'last_name', ascending: true, nullsLast: false },
    tieBreaker: { column: 'first_name', ascending: true },
  },
  status: {
    primary: { column: 'status', ascending: true, nullsLast: false },
    tieBreaker: { column: 'updated_at', ascending: false },
  },
};

const STATUS_RANK: Record<string, number> = {
  intake: 0,
  needs_info: 1,
  research: 2,
  underwriting: 3,
  ready_for_review: 4,
  offer_pending: 5,
  offer_sent: 6,
  due_diligence: 7,
  documents_complete: 8,
  title_review: 9,
  closing_scheduled: 10,
  closed: 11,
  lost: 12,
  on_hold: 13,
};

function escapeIlike(value: string) {
  return value.replace(/[%_,]/g, '\\$&');
}

function buildDateThresholdMs(bucket: keyof typeof MIN_LAST_CONTACT_MS): number {
  const days = MIN_LAST_CONTACT_MS[bucket];
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function lastContactBucketRange(bucket: 'never' | '7d' | '30d' | '90d' | 'over90') {
  if (bucket === 'never') return { kind: 'never' as const };
  if (bucket === 'over90') return { kind: 'over90' as const };
  return { kind: 'window' as const, thresholdMs: buildDateThresholdMs(bucket) };
}

function isSeverityFloorSatisfied(floor: string, max: string | null): boolean {
  if (floor === 'any') return true;
  if (!max) return false;
  if (floor === 'critical') return max === 'critical';
  const want = floor.endsWith('+') ? floor.slice(0, -1) : floor;
  const wantRank = RISK_SEVERITY_RANK[want as keyof typeof RISK_SEVERITY_RANK] ?? -1;
  const maxRank = RISK_SEVERITY_RANK[max as keyof typeof RISK_SEVERITY_RANK] ?? -1;
  return maxRank >= wantRank && maxRank >= 0;
}

function applyClientSideFilters(
  rows: StaffCaseRow[],
  filters: ReturnType<typeof parseStaffCaseListQuery>,
  viewer: { id: string; role: string },
) {
  const focusSearch = filters.focusSearch?.toLowerCase() ?? '';
  const range =
    filters.lastContactBucket === 'never'
      ? lastContactBucketRange('never')
      : filters.lastContactBucket === 'over90'
        ? lastContactBucketRange('over90')
        : filters.lastContactBucket === '7d' ||
            filters.lastContactBucket === '30d' ||
            filters.lastContactBucket === '90d'
          ? lastContactBucketRange(filters.lastContactBucket)
          : null;
  return rows.filter((row) => {
    const workspace = Array.isArray(row.internal_case_workspaces)
      ? row.internal_case_workspaces[0]
      : row.internal_case_workspaces;
    if (filters.status && workspace?.status !== filters.status) return false;
    if (filters.rating && workspace?.case_rating !== filters.rating) return false;
    if (filters.priority && workspace?.priority !== filters.priority) return false;
    if (filters.verification && workspace?.verification_confidence !== filters.verification) {
      return false;
    }
    if (
      filters.mineralCounty &&
      !row.mineral_interests?.some((i) => i?.county === filters.mineralCounty)
    ) {
      return false;
    }
    if (filters.mineralState) {
      const matchState = row.mineral_interests?.some(
        (i) => i?.state_code === filters.mineralState || i?.state === filters.mineralState,
      );
      if (!matchState) return false;
    }
    if (filters.mineralBasin) {
      const matchBasin = row.mineral_interests?.some((i) => i?.basin_name === filters.mineralBasin);
      if (!matchBasin) return false;
    }
    if (filters.operator) {
      const matchOperator = row.mineral_interests?.some((i) => i?.operator === filters.operator);
      if (!matchOperator) return false;
    }
    if (filters.mineralCountOp && filters.mineralCountValue != null) {
      const interestCount = row.mineral_interests?.length ?? 0;
      const override =
        typeof workspace?.mineral_rights_count === 'number' ? workspace.mineral_rights_count : null;
      const effective = override ?? interestCount;
      if (filters.mineralCountOp === '>=' && !(effective >= filters.mineralCountValue))
        return false;
      if (filters.mineralCountOp === '=' && !(effective === filters.mineralCountValue))
        return false;
      if (filters.mineralCountOp === '<=' && !(effective <= filters.mineralCountValue))
        return false;
    }
    if (filters.hasOpenRisks !== 'any') {
      const openCount = (workspace?.risk_flags ?? []).filter(
        (flag: any) => !flag?.status || flag.status === 'open' || flag.status === 'reviewing',
      ).length;
      if (filters.hasOpenRisks === 'yes' && openCount === 0) return false;
      if (filters.hasOpenRisks === 'no' && openCount > 0) return false;
    }
    if (filters.riskSeverityFloor !== 'any') {
      const maxSeverity =
        (workspace?.risk_flags ?? [])
          .filter(
            (flag: any) => !flag?.status || flag.status === 'open' || flag.status === 'reviewing',
          )
          .map((flag: any) => String(flag?.severity || '').toLowerCase())
          .filter((s: string) => s in RISK_SEVERITY_RANK)
          .reduce((acc: string | null, value: string) => {
            if (!acc) return value;
            return RISK_SEVERITY_RANK[value as keyof typeof RISK_SEVERITY_RANK] >
              RISK_SEVERITY_RANK[acc as keyof typeof RISK_SEVERITY_RANK]
              ? value
              : acc;
          }, null) ?? null;
      if (!isSeverityFloorSatisfied(filters.riskSeverityFloor, maxSeverity)) return false;
    }
    if (filters.assigneeScope !== 'any') {
      const assignments = row.case_assignments ?? [];
      const isAssigned = assignments.length > 0;
      const assignedToViewer = assignments.some((a) => a?.staff_profile_id === viewer.id);
      if (filters.assigneeScope === 'me' && !assignedToViewer) return false;
      if (filters.assigneeScope === 'anyone' && !isAssigned) return false;
      if (filters.assigneeScope === 'unassigned' && isAssigned) return false;
    }
    if (range) {
      const lastContact = workspace?.last_contact_at;
      if (range.kind === 'never') {
        if (lastContact) return false;
      } else if (range.kind === 'window') {
        if (!lastContact) return false;
        const ts = new Date(lastContact).getTime();
        if (!Number.isFinite(ts) || ts < range.thresholdMs) return false;
      } else if (range.kind === 'over90') {
        if (!lastContact) return false;
        const ts = new Date(lastContact).getTime();
        const ninety = buildDateThresholdMs('90d');
        if (!Number.isFinite(ts) || ts >= ninety) return false;
      }
    }
    if (filters.recommendedFocus !== 'any') {
      const focus = (workspace?.recommended_focus ?? '').trim();
      const hasFocus = focus.length > 0;
      if (filters.recommendedFocus === 'missing' && hasFocus) return false;
      if (filters.recommendedFocus === 'present' && !hasFocus) return false;
    }
    if (focusSearch) {
      const focus = (workspace?.recommended_focus ?? '').toLowerCase();
      if (!focus.includes(focusSearch)) return false;
    }
    return true;
  });
}

function applySort(rows: EnrichedCase[], sort: StaffCaseListSortKey): EnrichedCase[] {
  if (sort === 'status') {
    return [...rows].sort((a, b) => {
      const statusA = a.case.internal_case_workspaces?.status ?? 'intake';
      const statusB = b.case.internal_case_workspaces?.status ?? 'intake';
      const rankA = STATUS_RANK[statusA] ?? Number.MAX_SAFE_INTEGER;
      const rankB = STATUS_RANK[statusB] ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return String(a.case.id).localeCompare(String(b.case.id));
    });
  }
  if (sort === 'full_name') {
    return [...rows].sort((a, b) => {
      const lastA = String(a.case.last_name ?? '').toLowerCase();
      const lastB = String(b.case.last_name ?? '').toLowerCase();
      const cmp = lastA.localeCompare(lastB);
      if (cmp !== 0) return cmp;
      const firstA = String(a.case.first_name ?? '').toLowerCase();
      const firstB = String(b.case.first_name ?? '').toLowerCase();
      return firstA.localeCompare(firstB);
    });
  }
  const plan = SORT_PLANS[sort];
  return [...rows].sort((a, b) => {
    const aWorkspace = a.case.internal_case_workspaces;
    const bWorkspace = b.case.internal_case_workspaces;
    const aValue = aWorkspace ? aWorkspace[plan.primary.column] : a.case[plan.primary.column];
    const bValue = bWorkspace ? bWorkspace[plan.primary.column] : b.case[plan.primary.column];
    const aMissing = aValue == null || aValue === '';
    const bMissing = bValue == null || bValue === '';
    if (plan.primary.nullsLast) {
      if (aMissing && !bMissing) return 1;
      if (!aMissing && bMissing) return -1;
    }
    if (aMissing && bMissing) {
      return String(a.case.id).localeCompare(String(b.case.id));
    }
    let primaryCompare: number;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      primaryCompare = plan.primary.ascending ? aValue - bValue : bValue - aValue;
    } else {
      const aStr = String(aValue ?? '');
      const bStr = String(bValue ?? '');
      primaryCompare = plan.primary.ascending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    }
    if (primaryCompare !== 0) return primaryCompare;
    const tieValue =
      plan.tieBreaker.column === 'id'
        ? a.case.id
        : aWorkspace
          ? aWorkspace[plan.tieBreaker.column]
          : a.case[plan.tieBreaker.column];
    const tieBValue =
      plan.tieBreaker.column === 'id'
        ? b.case.id
        : bWorkspace
          ? bWorkspace[plan.tieBreaker.column]
          : b.case[plan.tieBreaker.column];
    if (tieValue == null && tieBValue == null) return 0;
    if (tieValue == null) return 1;
    if (tieBValue == null) return -1;
    if (typeof tieValue === 'number' && typeof tieBValue === 'number') {
      return plan.tieBreaker.ascending ? tieValue - tieBValue : tieBValue - tieValue;
    }
    const cmp = String(tieValue).localeCompare(String(tieBValue));
    return plan.tieBreaker.ascending ? cmp : -cmp;
  });
}

function computeFacets(rows: StaffCaseRow[]) {
  const counties = new Set<string>();
  const states = new Set<string>();
  const basins = new Set<string | null>();
  const operators = new Set<string | null>();
  for (const row of rows) {
    for (const interest of row.mineral_interests ?? []) {
      if (interest?.county) counties.add(String(interest.county));
      if (interest?.state_code) states.add(String(interest.state_code));
      else if (interest?.state) states.add(String(interest.state));
      basins.add(interest?.basin_name ?? null);
      operators.add(interest?.operator ?? null);
    }
  }
  const sortedCounties = Array.from(counties).sort((a, b) => a.localeCompare(b));
  const sortedStates = Array.from(states).sort((a, b) => a.localeCompare(b));
  const sortedBasins = Array.from(basins).sort((a, b) =>
    a == null ? 1 : b == null ? -1 : a.localeCompare(b),
  );
  const sortedOperators = Array.from(operators).sort((a, b) =>
    a == null ? 1 : b == null ? -1 : a.localeCompare(b),
  );
  return {
    mineralCounties: sortedCounties,
    mineralStates: sortedStates,
    mineralBasins: sortedBasins,
    operators: sortedOperators,
  };
}

export const GET: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-cases-list:${clientKey(context)}`, 120, 60_000);
    const { user, staff, supabase } = await requireStaff(context);
    const url = new URL(context.request.url);
    const filters = parseStaffCaseListQuery(url.searchParams);
    if (filters.invalid.length > 0) {
      return json(
        {
          ok: false,
          error: `invalid_filter_${filters.invalid.join('_')}`,
          invalid: filters.invalid,
        },
        { status: 400 },
      );
    }

    let profileIds: string[] | null = null;
    if (staff.role !== 'admin') {
      const { data: assignments } = await supabase
        .from('case_assignments')
        .select('profile_id')
        .eq('staff_profile_id', staff.id);
      profileIds = (assignments ?? []).map((item: any) => item.profile_id as string);
      if (!profileIds.length) {
        return json({
          ok: true,
          staff,
          cases: [],
          page: { total: 0, returned: 0, page: 1, pageSize: filters.pageSize, totalPages: 0 },
          facets: { mineralCounties: [], mineralStates: [], mineralBasins: [], operators: [] },
          filters,
          sortKeys: STAFF_CASE_LIST_SORT_KEYS,
        });
      }
    }

    const caseProfileIds = await ownerCaseProfileIds(supabase, profileIds, LIST_HARD_LIMIT);
    if (!caseProfileIds.length) {
      return json({
        ok: true,
        staff,
        cases: [],
        page: { total: 0, returned: 0, page: 1, pageSize: filters.pageSize, totalPages: 0 },
        facets: { mineralCounties: [], mineralStates: [], mineralBasins: [], operators: [] },
        filters,
        sortKeys: STAFF_CASE_LIST_SORT_KEYS,
      });
    }

    let query = supabase
      .from('profiles')
      .select(STAFF_CASE_PROFILE_SELECT)
      .in('id', caseProfileIds)
      .limit(LIST_HARD_LIMIT);

    if (filters.q) {
      const escaped = escapeIlike(filters.q);
      query = query.or(
        `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%,residence_city.ilike.%${escaped}%,residence_county.ilike.%${escaped}%,residence_state.ilike.%${escaped}%`,
      );
    }

    // DB-first filters: workspace columns and priority/verification are safe
    // to push into the Supabase query. Mineral geography is filtered
    // client-side because the joins produce multiple rows per owner and we
    // need a per-owner match (ANY interest) that PostgREST cannot express
    // directly. We still cap the pre-filter fetch at LIST_HARD_LIMIT rows.
    const applied: string[] = [];
    if (filters.status) {
      query = query.eq('internal_case_workspaces.status', filters.status);
      applied.push('status');
    }
    if (filters.rating) {
      query = query.eq('internal_case_workspaces.case_rating', filters.rating);
      applied.push('rating');
    }
    if (filters.priority) {
      query = query.eq('internal_case_workspaces.priority', filters.priority);
      applied.push('priority');
    }
    if (filters.verification) {
      query = query.eq('internal_case_workspaces.verification_confidence', filters.verification);
      applied.push('verification');
    }

    const { data, error } = await query;
    if (error) throw error;

    const rawRows: StaffCaseRow[] = (data ?? []) as StaffCaseRow[];
    const filtered = applyClientSideFilters(rawRows, filters, { id: staff.id, role: staff.role });

    const enriched: EnrichedCase[] = filtered.map((row) => ({
      case: row,
      semantics: deriveStaffRowSemantics(row),
    }));
    const sorted = applySort(enriched, filters.sort);
    const total = sorted.length;
    const startIndex = (filters.page - 1) * filters.pageSize;
    const paged = sorted.slice(startIndex, startIndex + filters.pageSize);

    const facets = computeFacets(filtered);

    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId: staff.role === 'admin' ? null : profileIds?.[0] || null,
      eventType: 'staff_case_list_viewed',
      targetType: 'case_list',
      metadata: {
        staffRole: staff.role,
        returnedCount: paged.length,
        totalCount: total,
        page: filters.page,
        pageSize: filters.pageSize,
        search: Boolean(filters.q),
        status: filters.status,
        rating: filters.rating,
        priority: filters.priority,
        verification: filters.verification,
        mineralCounty: filters.mineralCounty,
        mineralState: filters.mineralState,
        mineralBasin: filters.mineralBasin,
        operator: filters.operator,
        mineralCountOp: filters.mineralCountOp,
        mineralCountValue: filters.mineralCountValue,
        hasOpenRisks: filters.hasOpenRisks,
        riskSeverityFloor: filters.riskSeverityFloor,
        assigneeScope: filters.assigneeScope,
        lastContactBucket: filters.lastContactBucket,
        recommendedFocus: filters.recommendedFocus,
        focusSearch: Boolean(filters.focusSearch),
        sort: filters.sort,
        dbFilters: applied,
      },
    });

    return json({
      ok: true,
      staff,
      cases: paged.map((item) => ({ ...item.case, semantics: item.semantics })),
      page: {
        total,
        returned: paged.length,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      },
      facets,
      filters,
      sortKeys: STAFF_CASE_LIST_SORT_KEYS,
    });
  } catch (error) {
    return safeError(error);
  }
};
