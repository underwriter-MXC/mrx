import type { APIRoute } from 'astro';
import {
  auditStaffCaseEvent,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../lib/platform/staff';
import { json, safeError } from '../../../../lib/platform/security';
import { STAFF_CASE_PROFILE_SELECT } from '../cases';

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data: ownerCase, error } = await supabase
      .from('profiles')
      .select(STAFF_CASE_PROFILE_SELECT)
      .eq('id', profileId)
      .single();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_case_profile_viewed',
      targetType: 'case_profile',
      targetId: profileId,
      metadata: { staffRole: staff.role },
    });
    return json({ ok: true, case: ownerCase });
  } catch (error) {
    return safeError(error);
  }
};
