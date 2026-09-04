import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  STAFF_PIPELINE_PHASES,
  buildStaffDashboard,
  type StaffDashboardRow,
} from '../../src/lib/platform/staff-dashboard';
import { OWNER_CASE_STATUSES, ownerCaseProfileIds } from '../../src/lib/platform/staff';

const dashboardApi = readFileSync(
  new URL('../../src/pages/api/staff/dashboard.ts', import.meta.url),
  'utf8',
);
const portal = readFileSync(
  new URL('../../src/components/react/StaffPortal.tsx', import.meta.url),
  'utf8',
);
const views = readFileSync(
  new URL('../../src/components/react/StaffDashboardViews.tsx', import.meta.url),
  'utf8',
);

function row(
  id: string,
  workspace: Record<string, unknown>,
  extras: Partial<StaffDashboardRow> = {},
): StaffDashboardRow {
  return {
    id,
    first_name: `Owner ${id}`,
    last_name: 'Example',
    email: `${id}@example.com`,
    phone: '555-0100',
    created_at: '2026-06-01T00:00:00.000Z',
    last_seen_at: '2026-07-20T00:00:00.000Z',
    mineral_interests: [{ id: `${id}-1` }],
    case_assignments: [{ assigned_staff: { display_name: 'Daryl Hill', active: true } }],
    internal_case_workspaces: workspace,
    ...extras,
  } as StaffDashboardRow;
}

describe('staff backoffice dashboard', () => {
  it('builds protected portfolio metrics from canonical owner-case workspaces', () => {
    const dashboard = buildStaffDashboard(
      [
        row('a', {
          status: 'offer_sent',
          case_rating: 'hot',
          priority: 'urgent',
          opportunity_value_cents: 250_000_00,
          mineral_rights_count: 4,
          last_contact_at: '2026-07-19T00:00:00.000Z',
          risk_flags: [],
          ghl_pipeline_id: 'pipeline-1',
          ghl_pipeline_stage_id: 'stage-1',
          ghl_pipeline_name: 'Sellers',
          ghl_pipeline_stage_name: 'Offer Sent',
          ghl_pipeline_status: 'synced',
        }),
        row(
          'b',
          {
            status: 'ready_for_review',
            case_rating: 'priority',
            priority: 'high',
            opportunity_value_cents: 100_000_00,
            mineral_rights_count: null,
            last_contact_at: null,
            risk_flags: [{ code: 'TITLE_GAP', severity: 'high', status: 'open' }],
            ghl_pipeline_status: 'sync_failed',
          },
          { case_assignments: [] },
        ),
        row('c', {
          status: 'closed',
          case_rating: 'warm',
          priority: 'normal',
          opportunity_value_cents: 75_000_00,
          last_contact_at: '2026-07-01T00:00:00.000Z',
          risk_flags: [],
          ghl_pipeline_status: 'synced',
        }),
      ],
      new Date('2026-07-20T12:00:00.000Z'),
    );

    expect(dashboard.summary).toMatchObject({
      visibleCases: 3,
      activeCases: 2,
      openValueCents: 350_000_00,
      valueAtRiskCents: 350_000_00,
      needsAttention: 2,
      readyForReview: 1,
      offersInFlight: 1,
      neverContacted: 1,
      unassignedCases: 1,
      ghlSyncFailures: 1,
      closedCases: 1,
      closedValueCents: 75_000_00,
    });
    expect(dashboard.cases[0].priority).toBe('urgent');
    expect(dashboard.cases.find((item) => item.id === 'b')?.attentionReasons).toEqual([
      'High risk',
      'Never contacted',
      'Unassigned',
      'CRM sync failed',
    ]);
  });

  it('assigns every canonical case status to exactly one pipeline phase', () => {
    const phaseStatuses = STAFF_PIPELINE_PHASES.flatMap((phase) => [...phase.statuses]);
    expect(phaseStatuses).toHaveLength(OWNER_CASE_STATUSES.length);
    expect(new Set(phaseStatuses)).toEqual(new Set(OWNER_CASE_STATUSES));
  });

  it('keeps dashboard data role-protected and excludes staff-only file/note bodies', () => {
    expect(dashboardApi).toContain('requireStaff(context)');
    expect(dashboardApi).toContain("staff.role !== 'admin'");
    expect(dashboardApi).toContain(".from('case_assignments')");
    expect(dashboardApi).toContain('ownerCaseProfileIds');
    expect(dashboardApi).toContain('DASHBOARD_HARD_LIMIT = 500');
    expect(dashboardApi).not.toContain('internal_case_notes');
    expect(dashboardApi).not.toContain('internal_case_files');
  });

  it('resolves only profiles with case evidence for the admin backoffice', async () => {
    const evidence: Record<string, string[]> = {
      internal_case_workspaces: ['workspace-case'],
      mineral_interests: ['mineral-case'],
      conversations: ['conversation-case'],
      case_assignments: ['assigned-case'],
    };
    const supabase = {
      from(table: string) {
        return {
          select() {
            return {
              limit() {
                return Promise.resolve({
                  data: (evidence[table] ?? []).map((profile_id) => ({ profile_id })),
                  error: null,
                });
              },
            };
          },
        };
      },
    };

    await expect(ownerCaseProfileIds(supabase as never, null, 500)).resolves.toEqual([
      'workspace-case',
      'mineral-case',
      'conversation-case',
      'assigned-case',
    ]);
    await expect(
      ownerCaseProfileIds(supabase as never, ['assigned-only', 'assigned-only'], 500),
    ).resolves.toEqual(['assigned-only']);
  });

  it('renders one shell with overview, pipeline, and owner-case views', () => {
    expect(portal).toContain('staff-backoffice-shell');
    expect(portal).toContain("setActiveView('pipeline')");
    expect(portal).toContain("setActiveView('owners')");
    expect(portal).toContain('Internal use only');
    expect(views).toContain('Open opportunity value');
    expect(views).toContain('Move to stage');
    expect(views).toContain('MRX status is authoritative');
  });
});
