import {
  OWNER_CASE_STATUSES,
  deriveStaffRowSemantics,
  ownerCaseStatusLabel,
  type OwnerCaseRating,
  type OwnerCaseStatus,
  type RiskSeverity,
} from './staff';

export const STAFF_PIPELINE_PHASES = [
  {
    id: 'prospects',
    label: 'Prospect qualification',
    description: 'New inquiries, missing information, and early research.',
    statuses: ['intake', 'needs_info', 'research'],
  },
  {
    id: 'valuation',
    label: 'Valuation & offer prep',
    description: 'Underwriting, review, and offer preparation.',
    statuses: ['underwriting', 'ready_for_review', 'offer_pending'],
  },
  {
    id: 'seller',
    label: 'Seller conversion',
    description: 'Offers, diligence, title, and closing coordination.',
    statuses: [
      'offer_sent',
      'due_diligence',
      'documents_complete',
      'title_review',
      'closing_scheduled',
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes & exceptions',
    description: 'Closed, lost, and intentionally parked cases.',
    statuses: ['closed', 'lost', 'on_hold'],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  statuses: readonly OwnerCaseStatus[];
}>;

type DashboardWorkspace = {
  status?: OwnerCaseStatus | null;
  case_rating?: OwnerCaseRating | null;
  priority?: 'normal' | 'high' | 'urgent' | null;
  opportunity_value_cents?: number | null;
  mineral_rights_count?: number | null;
  last_contact_at?: string | null;
  risk_flags?: Array<{
    code: string;
    severity: string;
    status?: string;
  }> | null;
  ghl_opportunity_id?: string | null;
  ghl_pipeline_id?: string | null;
  ghl_pipeline_stage_id?: string | null;
  ghl_pipeline_name?: string | null;
  ghl_pipeline_stage_name?: string | null;
  ghl_pipeline_status?: string | null;
};

export type StaffDashboardRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  last_seen_at?: string | null;
  ghl_contact_id?: string | null;
  mineral_interests?: Array<{
    id?: string | null;
    county?: string | null;
    state?: string | null;
    state_code?: string | null;
    basin_name?: string | null;
    operator?: string | null;
  }> | null;
  case_assignments?: Array<{
    assigned_staff?: { display_name?: string | null; active?: boolean | null } | null;
  }> | null;
  internal_case_workspaces?: DashboardWorkspace | DashboardWorkspace[] | null;
};

export type StaffDashboardCase = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  status: OwnerCaseStatus;
  statusLabel: string;
  rating: OwnerCaseRating;
  priority: 'normal' | 'high' | 'urgent';
  opportunityValueCents: number | null;
  mineralRightsCount: number;
  lastContactAt: string | null;
  daysSinceContact: number | null;
  assigneeLabel: string;
  openRiskCount: number;
  maxOpenSeverity: RiskSeverity | null;
  ghlContactLinked: boolean;
  ghlMapped: boolean;
  ghlDisplay: string;
  ghlSyncStatus: string;
  attentionReasons: string[];
};

export type StaffDashboardSummary = {
  visibleCases: number;
  activeCases: number;
  openValueCents: number;
  valueAtRiskCents: number;
  needsAttention: number;
  readyForReview: number;
  offersInFlight: number;
  recentlyContacted: number;
  staleCases: number;
  neverContacted: number;
  unassignedCases: number;
  ghlMappedCases: number;
  ghlSyncFailures: number;
  closedCases: number;
  closedValueCents: number;
};

export type StaffDashboardData = {
  summary: StaffDashboardSummary;
  byStatus: Array<{
    status: OwnerCaseStatus;
    label: string;
    count: number;
    valueCents: number;
  }>;
  cases: StaffDashboardCase[];
};

function workspaceFor(row: StaffDashboardRow) {
  const value = row.internal_case_workspaces;
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function fullName(row: StaffDashboardRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed owner';
}

function wholeDaysSince(value: string | null | undefined, now: Date) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / (24 * 60 * 60 * 1000)));
}

function isOpenStatus(status: OwnerCaseStatus) {
  return status !== 'closed' && status !== 'lost';
}

function attentionReasons(item: Omit<StaffDashboardCase, 'attentionReasons'>) {
  const reasons: string[] = [];
  if (item.priority === 'urgent') reasons.push('Urgent priority');
  if (item.maxOpenSeverity === 'critical' || item.maxOpenSeverity === 'high') {
    reasons.push(`${item.maxOpenSeverity === 'critical' ? 'Critical' : 'High'} risk`);
  }
  if (item.daysSinceContact == null) reasons.push('Never contacted');
  else if (item.daysSinceContact > 30) reasons.push('Contact overdue');
  if (item.assigneeLabel === 'Unassigned') reasons.push('Unassigned');
  if (item.ghlSyncStatus === 'sync_failed') reasons.push('CRM sync failed');
  return reasons;
}

export function buildStaffDashboard(
  rows: StaffDashboardRow[],
  now = new Date(),
): StaffDashboardData {
  const cases = rows.map((row): StaffDashboardCase => {
    const workspace = workspaceFor(row);
    const semantics = deriveStaffRowSemantics(row);
    const status = workspace?.status ?? 'intake';
    const base = {
      id: row.id,
      name: fullName(row),
      email: row.email ?? null,
      phone: row.phone ?? null,
      createdAt: row.created_at,
      lastActivityAt: row.last_seen_at ?? null,
      status,
      statusLabel: ownerCaseStatusLabel(status),
      rating: workspace?.case_rating ?? 'unrated',
      priority: workspace?.priority ?? 'normal',
      opportunityValueCents:
        typeof workspace?.opportunity_value_cents === 'number'
          ? workspace.opportunity_value_cents
          : null,
      mineralRightsCount: semantics.effectiveMineralCount,
      lastContactAt: workspace?.last_contact_at ?? null,
      daysSinceContact: wholeDaysSince(workspace?.last_contact_at, now),
      assigneeLabel: semantics.assigneeLabel,
      openRiskCount: semantics.openRiskCount,
      maxOpenSeverity: semantics.maxOpenSeverity,
      ghlContactLinked: Boolean(row.ghl_contact_id),
      ghlMapped: semantics.isGhlMapped,
      ghlDisplay: semantics.ghlDisplay,
      ghlSyncStatus: workspace?.ghl_pipeline_status ?? 'not_started',
    } satisfies Omit<StaffDashboardCase, 'attentionReasons'>;
    return { ...base, attentionReasons: attentionReasons(base) };
  });

  cases.sort((a, b) => {
    const priorityRank = { urgent: 2, high: 1, normal: 0 } as const;
    const priority = priorityRank[b.priority] - priorityRank[a.priority];
    if (priority !== 0) return priority;
    const value = (b.opportunityValueCents ?? 0) - (a.opportunityValueCents ?? 0);
    if (value !== 0) return value;
    return (
      (b.daysSinceContact ?? Number.MAX_SAFE_INTEGER) -
      (a.daysSinceContact ?? Number.MAX_SAFE_INTEGER)
    );
  });

  const byStatus = OWNER_CASE_STATUSES.map((status) => {
    const matching = cases.filter((item) => item.status === status);
    return {
      status,
      label: ownerCaseStatusLabel(status),
      count: matching.length,
      valueCents: matching.reduce((sum, item) => sum + (item.opportunityValueCents ?? 0), 0),
    };
  });

  const active = cases.filter((item) => isOpenStatus(item.status));
  const needsAttention = active.filter((item) => item.attentionReasons.length > 0);
  const closed = cases.filter((item) => item.status === 'closed');
  const summary: StaffDashboardSummary = {
    visibleCases: cases.length,
    activeCases: active.length,
    openValueCents: active.reduce((sum, item) => sum + (item.opportunityValueCents ?? 0), 0),
    valueAtRiskCents: needsAttention.reduce(
      (sum, item) => sum + (item.opportunityValueCents ?? 0),
      0,
    ),
    needsAttention: needsAttention.length,
    readyForReview: active.filter((item) => item.status === 'ready_for_review').length,
    offersInFlight: active.filter(
      (item) => item.status === 'offer_pending' || item.status === 'offer_sent',
    ).length,
    recentlyContacted: active.filter(
      (item) => item.daysSinceContact != null && item.daysSinceContact <= 7,
    ).length,
    staleCases: active.filter((item) => item.daysSinceContact != null && item.daysSinceContact > 30)
      .length,
    neverContacted: active.filter((item) => item.daysSinceContact == null).length,
    unassignedCases: active.filter((item) => item.assigneeLabel === 'Unassigned').length,
    ghlMappedCases: cases.filter((item) => item.ghlMapped).length,
    ghlSyncFailures: cases.filter((item) => item.ghlSyncStatus === 'sync_failed').length,
    closedCases: closed.length,
    closedValueCents: closed.reduce((sum, item) => sum + (item.opportunityValueCents ?? 0), 0),
  };

  return { summary, byStatus, cases };
}
