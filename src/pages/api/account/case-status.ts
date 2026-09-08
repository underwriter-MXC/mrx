import type { APIRoute } from 'astro';
import { requireOwnerProfileAccess } from '../../../lib/platform/identity';
import { projectOwnerVisibleCaseStatus } from '../../../lib/platform/staff';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';
import { getSupabaseServer } from '../../../lib/platform/supabase';

export const GET: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`owner-case-status:${clientKey(context)}`, 40, 60_000);
    const session = await requireOwnerProfileAccess(context);
    const supabase = getSupabaseServer()!;
    const [workspaceResult, completedReviewResult] = await Promise.all([
      supabase
        .from('internal_case_workspaces')
        .select('status,updated_at')
        .eq('profile_id', session.profileId)
        .maybeSingle(),
      supabase
        .from('audit_events')
        .select('actor_user_id,created_at,event_type,metadata')
        .eq('profile_id', session.profileId)
        .eq('event_type', 'staff_owner_case_review_completed')
        .eq('metadata->>evidenceLabel', 'actual')
        .order('metadata->>occurredAt', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (workspaceResult.error) throw workspaceResult.error;
    if (completedReviewResult.error) throw completedReviewResult.error;
    const caseStatus = projectOwnerVisibleCaseStatus(workspaceResult.data, {
      reviewerId: completedReviewResult.data?.actor_user_id ?? null,
      reviewedAt:
        typeof completedReviewResult.data?.metadata?.occurredAt === 'string'
          ? completedReviewResult.data.metadata.occurredAt
          : null,
    });

    return json({
      ok: true,
      caseStatus,
      emptyState: caseStatus
        ? null
        : workspaceResult.data
          ? {
              title: 'Case status unavailable',
              message:
                'We do not have a status update to show here yet. Contact MRX for the latest update on your case.',
            }
          : {
            title: 'No MRX case status yet',
            message:
              'When MRX staff start a human review record for your owner profile, a safe high-level status will appear here.',
            },
      notifications: {
        policy: 'no_messages_now',
        message:
          'Case-status updates stay in your private account. Contact preferences are managed separately in your account update settings.',
      },
    });
  } catch (error) {
    return safeError(error);
  }
};