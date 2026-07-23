import type { APIRoute } from 'astro';
import { buildStaffDashboard, type StaffDashboardRow } from '../../../lib/platform/staff-dashboard';
import {
  auditStaffCaseEvent,
  ownerCaseProfileIds,
  requireStaff,
} from '../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const DASHBOARD_HARD_LIMIT = 500;

const DASHBOARD_PROFILE_SELECT = `
  id,first_name,last_name,email,phone,created_at,last_seen_at,ghl_contact_id,
  mineral_interests!mineral_interests_profile_id_fkey(id),
  case_assignments(id,staff_profile_id,assigned_staff:staff_profiles!case_assignments_staff_profile_id_fkey(display_name,role,active)),
  internal_case_workspaces(profile_id,status,case_rating,priority,opportunity_value_cents,mineral_rights_count,last_contact_at,risk_flags,ghl_opportunity_id,ghl_pipeline_id,ghl_pipeline_stage_id,ghl_pipeline_name,ghl_pipeline_stage_name,ghl_pipeline_status)
`;

export const GET: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-dashboard:${clientKey(context)}`, 120, 60_000);
    const { user, staff, supabase } = await requireStaff(context);

    let profileIds: string[] | null = null;
    if (staff.role !== 'admin') {
      const { data: assignments, error: assignmentError } = await supabase
        .from('case_assignments')
        .select('profile_id')
        .eq('staff_profile_id', staff.id);
      if (assignmentError) throw assignmentError;
      profileIds = (assignments ?? []).map((item: any) => item.profile_id as string);
      if (!profileIds.length) {
        return json({
          ok: true,
          staff,
          ...buildStaffDashboard([]),
          source: { limit: DASHBOARD_HARD_LIMIT, truncated: false },
        });
      }
    }

    const caseProfileIds = await ownerCaseProfileIds(supabase, profileIds, DASHBOARD_HARD_LIMIT);
    if (!caseProfileIds.length) {
      return json({
        ok: true,
        staff,
        ...buildStaffDashboard([]),
        source: { limit: DASHBOARD_HARD_LIMIT, truncated: false },
      });
    }

    const query = supabase
      .from('profiles')
      .select(DASHBOARD_PROFILE_SELECT)
      .in('id', caseProfileIds)
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .limit(DASHBOARD_HARD_LIMIT);

    const { data, error } = await query;
    if (error) throw error;
    const dashboard = buildStaffDashboard((data ?? []) as StaffDashboardRow[]);

    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId: null,
      eventType: 'staff_dashboard_viewed',
      targetType: 'staff_dashboard',
      metadata: {
        staffRole: staff.role,
        visibleCases: dashboard.summary.visibleCases,
        activeCases: dashboard.summary.activeCases,
        dashboardLimit: DASHBOARD_HARD_LIMIT,
      },
    });

    return json({
      ok: true,
      staff,
      ...dashboard,
      source: {
        limit: DASHBOARD_HARD_LIMIT,
        truncated: (data ?? []).length >= DASHBOARD_HARD_LIMIT,
      },
    });
  } catch (error) {
    return safeError(error);
  }
};
