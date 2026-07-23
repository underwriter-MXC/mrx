import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  INTERNAL_CASE_FILE_BUCKET,
  INTERNAL_CASE_FILE_MAX_BYTES,
  INTERNAL_CASE_FILE_MIME_TYPES,
  INTERNAL_CASE_FILE_PURPOSES,
  auditStaffCaseEvent,
  internalCaseStoragePath,
  requireStaff,
  requireStaffCaseAccess,
} from '../../../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../../../lib/platform/security';

const FileSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(INTERNAL_CASE_FILE_MIME_TYPES),
  size: z.number().int().positive().max(INTERNAL_CASE_FILE_MAX_BYTES),
  purpose: z.enum(INTERNAL_CASE_FILE_PURPOSES).default('case_workspace'),
});

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data, error } = await supabase
      .from('internal_case_files')
      .select(
        'id,profile_id,staff_profile_id,original_name,mime_type,size_bytes,purpose,status,visibility,created_at,updated_at,staff_profiles(display_name,role)',
      )
      .eq('profile_id', profileId)
      .eq('visibility', 'internal')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_files_viewed',
      targetType: 'internal_case_file_list',
      metadata: { staffRole: staff.role, returnedCount: data?.length ?? 0 },
    });
    return json({ ok: true, files: data ?? [] });
  } catch (error) {
    return safeError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-file-sign:${clientKey(context)}`, 20, 10 * 60_000);
    const profileId = context.params.profileId!;
    const parsed = FileSchema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_internal_file' }, { status: 400 });
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const storagePath = internalCaseStoragePath({ profileId, filename: parsed.data.filename });
    const { data: signed, error: signedError } = await supabase.storage
      .from(INTERNAL_CASE_FILE_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (signedError || !signed?.signedUrl)
      throw signedError || new Error('internal_upload_unavailable');
    const { data: file, error } = await supabase
      .from('internal_case_files')
      .insert({
        profile_id: profileId,
        staff_profile_id: staff.id,
        storage_bucket: INTERNAL_CASE_FILE_BUCKET,
        storage_path: storagePath,
        original_name: parsed.data.filename,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.size,
        purpose: parsed.data.purpose,
        status: 'pending_upload',
        visibility: 'internal',
      })
      .select(
        'id,profile_id,original_name,mime_type,size_bytes,purpose,status,visibility,created_at',
      )
      .single();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_file_upload_signed',
      targetType: 'internal_case_file',
      targetId: file.id,
      metadata: {
        staffRole: staff.role,
        purpose: parsed.data.purpose,
        mimeType: parsed.data.mimeType,
      },
    });
    return json(
      {
        ok: true,
        file,
        path: storagePath,
        token: signed.token,
        signedUrl: signed.signedUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    return safeError(error);
  }
};
