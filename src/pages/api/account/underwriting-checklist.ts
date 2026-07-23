import type { APIRoute } from 'astro';
import { requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { json, safeError } from '../../../lib/platform/security';
import { loadUnderwritingPacket } from '../../../lib/platform/underwriting-packet-store';
import { projectOwnerUnderwritingChecklist } from '../../../lib/platform/underwriting-packet';
import { getSupabaseServer } from '../../../lib/platform/supabase';
import { documentWorkerAvailable } from '../../../lib/platform/documents';

export const GET: APIRoute = async (context) => {
  try {
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const { packet } = await loadUnderwritingPacket(supabase, session.profileId, {
      reconcile: true,
    });
    const processingAvailable = await documentWorkerAvailable();
    return json({
      ok: true,
      checklist: projectOwnerUnderwritingChecklist(packet),
      processing: {
        available: processingAvailable,
        uploadsEnabled: processingAvailable,
      },
      readinessBlockers: packet.blockers.map((blocker) => ({
        code: blocker.code,
        label: blocker.label,
        requirementKey: blocker.requirementKey ?? null,
      })),
    });
  } catch (error) {
    return safeError(error);
  }
};
