import type { APIRoute } from 'astro';
import {
  auditStaffCaseEvent,
  requireStaff,
  staffCanAccessProfile,
} from '../../../../lib/platform/staff';
import { json, safeError } from '../../../../lib/platform/security';

export const GET: APIRoute = async (context) => {
  try {
    const { user, staff, supabase } = await requireStaff(context);
    const { data: attachment } = await supabase
      .from('attachments')
      .select('id,profile_id,storage_path,original_name,status')
      .eq('id', context.params.id!)
      .single();
    if (
      !attachment ||
      attachment.status !== 'ready' ||
      !(await staffCanAccessProfile(staff, attachment.profile_id))
    ) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    const { data, error } = await supabase.storage
      .from('owner-documents')
      .createSignedUrl(attachment.storage_path, 60, { download: attachment.original_name });
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId: attachment.profile_id,
      eventType: 'staff_document_access',
      targetType: 'attachment',
      targetId: attachment.id,
      metadata: { staffRole: staff.role },
    });
    return json({ ok: true, url: data.signedUrl, expiresIn: 60 });
  } catch (error) {
    return safeError(error);
  }
};
