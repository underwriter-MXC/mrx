import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  INTERNAL_CASE_NOTE_TYPES,
  INTERNAL_CASE_PROVENANCE,
  auditStaffCaseEvent,
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

const NoteSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  noteType: z.enum(INTERNAL_CASE_NOTE_TYPES).default('case_review'),
  provenance: z.enum(INTERNAL_CASE_PROVENANCE).default('staff_analysis'),
  sourceName: z.string().trim().max(300).optional(),
  sourceUrl: z.string().url().max(2_000).optional().or(z.literal('')),
});

export const GET: APIRoute = async (context) => {
  try {
    const profileId = context.params.profileId!;
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data, error } = await supabase
      .from('internal_case_notes')
      .select(
        'id,profile_id,staff_profile_id,body,note_type,provenance,source_name,source_url,visibility,created_at,updated_at,staff_profiles(display_name,role)',
      )
      .eq('profile_id', profileId)
      .eq('visibility', 'internal')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_notes_viewed',
      targetType: 'internal_case_note_list',
      metadata: { staffRole: staff.role, returnedCount: data?.length ?? 0 },
    });
    return json({ ok: true, notes: data ?? [] });
  } catch (error) {
    return safeError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`staff-note:${clientKey(context)}`, 60, 10 * 60_000);
    const profileId = context.params.profileId!;
    const parsed = NoteSchema.safeParse(await context.request.json());
    if (!parsed.success)
      return json({ ok: false, error: 'invalid_internal_note' }, { status: 400 });
    const { user, staff, supabase } = await requireStaff(context);
    await requireStaffCaseAccess(staff, profileId);
    const { data: note, error } = await supabase
      .from('internal_case_notes')
      .insert({
        profile_id: profileId,
        staff_profile_id: staff.id,
        body: parsed.data.body,
        note_type: parsed.data.noteType,
        provenance: parsed.data.provenance,
        source_name: parsed.data.sourceName || null,
        source_url: parsed.data.sourceUrl || null,
        visibility: 'internal',
      })
      .select(
        'id,profile_id,staff_profile_id,body,note_type,provenance,source_name,source_url,visibility,created_at,updated_at',
      )
      .single();
    if (error) throw error;
    await auditStaffCaseEvent({
      actorUserId: user.id,
      profileId,
      eventType: 'staff_internal_note_created',
      targetType: 'internal_case_note',
      targetId: note.id,
      metadata: {
        staffRole: staff.role,
        noteType: parsed.data.noteType,
        provenance: parsed.data.provenance,
      },
    });
    return json({ ok: true, note }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
};
