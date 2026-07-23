import type { APIRoute } from 'astro';
import { z } from 'zod';
import { auditStaffCaseEvent, requireAdminStaff } from '../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../lib/platform/security';

const AssignmentSchema = z.object({ staffProfileId: z.string().uuid() });

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireAdminStaff(context);
    const [assignments, staffProfiles] = await Promise.all([
      supabase
        .from('case_assignments')
        .select(
          'id,profile_id,staff_profile_id,created_at,assigned_staff:staff_profiles!case_assignments_staff_profile_id_fkey(display_name,role,active)',
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false }),
      supabase
        .from('staff_profiles')
        .select('id,display_name,role,active')
        .eq('active', true)
        .order('display_name', { ascending: true }),
    ]);
    if (assignments.error) throw assignments.error;
    if (staffProfiles.error) throw staffProfiles.error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_case_assignments_viewed',
      targetType: 'case_assignment_list',
      metadata: { staffRole: staff.role, returnedCount: assignments.data?.length ?? 0 },
    });
    return json({
      ok: true,
      assignments: assignments.data ?? [],
      staffProfiles: staffProfiles.data ?? [],
    });
  } catch (error) {
    return safeError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-assignment:${clientKey(context)}`, 30, 10 * 60_000);
    const profileId = context.params.profileId!;
    const parsed = AssignmentSchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_assignment' }, { status: 400 });
    const { user, staff, supabase } = await requireAdminStaff(context);
    const { data: targetStaff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id,role,active')
      .eq('id', parsed.data.staffProfileId)
      .eq('active', true)
      .single();
    if (staffError || !targetStaff)
      return json({ ok: false, error: 'staff_profile_not_found' }, { status: 404 });
    const { data: assignment, error } = await supabase
      .from('case_assignments')
      .upsert(
        {
          profile_id: profileId,
          staff_profile_id: targetStaff.id,
          assigned_by: staff.id,
        },
        { onConflict: 'profile_id,staff_profile_id' },
      )
      .select(
        'id,profile_id,staff_profile_id,created_at,assigned_staff:staff_profiles!case_assignments_staff_profile_id_fkey(display_name,role,active)',
      )
      .single();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_case_assignment_created',
      targetType: 'case_assignment',
      targetId: assignment.id,
      metadata: { assignedStaffProfileId: targetStaff.id, assignedRole: targetStaff.role },
    });
    return json({ ok: true, assignment }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-assignment:${clientKey(context)}`, 30, 10 * 60_000);
    const profileId = context.params.profileId!;
    const parsed = AssignmentSchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_assignment' }, { status: 400 });
    const { user, supabase } = await requireAdminStaff(context);
    const { data: assignment, error: lookupError } = await supabase
      .from('case_assignments')
      .select('id,staff_profile_id')
      .eq('profile_id', profileId)
      .eq('staff_profile_id', parsed.data.staffProfileId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!assignment) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const { error } = await supabase.from('case_assignments').delete().eq('id', assignment.id);
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_case_assignment_removed',
      targetType: 'case_assignment',
      targetId: assignment.id,
      metadata: { assignedStaffProfileId: assignment.staff_profile_id },
    });
    return json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
};
