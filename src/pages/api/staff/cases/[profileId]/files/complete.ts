import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  INTERNAL_CASE_FILE_BUCKET,
  auditStaffCaseEvent,
  canFinalizeInternalCaseFile,
  internalCaseFileMatches,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../../lib/platform/security';

const CompleteSchema = z.object({ fileId: z.string().uuid() });

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-file-complete:${clientKey(context)}`, 30, 10 * 60_000);
    const profileId = context.params.profileId!;
    const parsed = CompleteSchema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_internal_file' }, { status: 400 });
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data: existing } = await supabase
      .from('internal_case_files')
      .select(
        'id,profile_id,staff_profile_id,storage_path,status,purpose,visibility,mime_type,size_bytes',
      )
      .eq('id', parsed.data.fileId)
      .eq('profile_id', profileId)
      .eq('visibility', 'internal')
      .single();
    if (!existing) return json({ ok: false, error: 'not_found' }, { status: 404 });
    if (!canFinalizeInternalCaseFile(staff, existing)) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    const { data: object, error: downloadError } = await supabase.storage
      .from(INTERNAL_CASE_FILE_BUCKET)
      .download(existing.storage_path);
    if (downloadError || !object)
      return json({ ok: false, error: 'upload_not_found' }, { status: 400 });
    if (!(await internalCaseFileMatches(object, existing.mime_type, existing.size_bytes))) {
      await supabase.storage.from(INTERNAL_CASE_FILE_BUCKET).remove([existing.storage_path]);
      await supabase
        .from('internal_case_files')
        .update({ status: 'rejected' })
        .eq('id', existing.id)
        .eq('profile_id', profileId);
      await auditStaffCaseEvent({
        actorUserId: user.id,
        profileId,
        eventType: 'staff_internal_file_upload_rejected',
        targetType: 'internal_case_file',
        targetId: existing.id,
        metadata: { staffRole: staff.role, reason: 'file_signature_or_size_mismatch' },
      });
      return json({ ok: false, error: 'file_signature_or_size_mismatch' }, { status: 400 });
    }
    const { data: file, error } = await supabase
      .from('internal_case_files')
      .update({ status: 'ready' })
      .eq('id', existing.id)
      .eq('profile_id', profileId)
      .select(
        'id,profile_id,original_name,mime_type,size_bytes,purpose,status,visibility,created_at,updated_at',
      )
      .single();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_file_upload_completed',
      targetType: 'internal_case_file',
      targetId: existing.id,
      metadata: { staffRole: staff.role, purpose: existing.purpose },
    });
    return json({ ok: true, file });
  } catch (error) {
    return safeError(error);
  }
};
