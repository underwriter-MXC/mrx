import type { APIRoute } from 'astro';
import {
  INTERNAL_CASE_FILE_BUCKET,
  auditStaffCaseEvent,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../../../lib/platform/staff';
import { json, safeError } from '../../../../../../lib/platform/security';

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data: file } = await supabase
      .from('internal_case_files')
      .select('id,profile_id,storage_path,original_name,status,purpose,visibility')
      .eq('id', context.params.id!)
      .eq('profile_id', profileId)
      .eq('visibility', 'internal')
      .single();
    if (!file || file.status !== 'ready')
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    const { data, error } = await supabase.storage
      .from(INTERNAL_CASE_FILE_BUCKET)
      .createSignedUrl(file.storage_path, 60, { download: file.original_name });
    if (error || !data?.signedUrl) throw error || new Error('internal_download_unavailable');
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_file_access',
      targetType: 'internal_case_file',
      targetId: file.id,
      metadata: { staffRole: staff.role, purpose: file.purpose },
    });
    return json({ ok: true, url: data.signedUrl, expiresIn: 60 });
  } catch (error) {
    return safeError(error);
  }
};
