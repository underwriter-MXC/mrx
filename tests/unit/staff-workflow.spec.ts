import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OWNER_CASE_STAGE_NAMES,
  canFinalizeInternalCaseFile,
  isAdminStaff,
  ownerCaseRatingTone,
  ownerCaseStatusLabel,
  ownerVisibleCaseStatusForInternalStatus,
  projectOwnerVisibleCaseStatus,
  resolveOwnerCaseStageMapping,
} from '../../src/lib/platform/staff';
import {
  staffLoginRedirectTo,
  staffPasswordRecoveryRedirectTo,
} from '../../src/lib/platform/staff-auth';
const repoFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('staff case-review workflow guardrails', () => {
  it('recognizes only admin staff as assignment managers', () => {
    expect(isAdminStaff({ role: 'admin' })).toBe(true);
    expect(isAdminStaff({ role: 'underwriter' })).toBe(false);
    expect(isAdminStaff({ role: 'reviewer' })).toBe(false);
  });

  it('allows only the uploader or an admin to finalize pending internal files', () => {
    const pendingFile = {
      staff_profile_id: 'staff-1',
      status: 'pending_upload',
      visibility: 'internal',
    };
    expect(canFinalizeInternalCaseFile({ id: 'staff-1', role: 'reviewer' }, pendingFile)).toBe(
      true,
    );
    expect(canFinalizeInternalCaseFile({ id: 'staff-2', role: 'reviewer' }, pendingFile)).toBe(
      false,
    );
    expect(canFinalizeInternalCaseFile({ id: 'staff-2', role: 'admin' }, pendingFile)).toBe(true);
    expect(
      canFinalizeInternalCaseFile(
        { id: 'staff-1', role: 'reviewer' },
        { ...pendingFile, status: 'ready' },
      ),
    ).toBe(false);
    expect(
      canFinalizeInternalCaseFile(
        { id: 'staff-1', role: 'reviewer' },
        { ...pendingFile, visibility: 'owner' },
      ),
    ).toBe(false);
  });

  it('keeps owner account export free of internal staff-only tables', () => {
    const ownerExport = repoFile('src/pages/api/account/export.ts');
    expect(ownerExport).not.toMatch(
      /internal_case_notes|internal_case_files|case_assignments|staff_profiles/,
    );
  });

  it('keeps staff owner-document downloads limited to ready assigned documents', () => {
    const staffDocumentRoute = repoFile('src/pages/api/staff/documents/[id].ts');
    expect(staffDocumentRoute).toContain("attachment.status !== 'ready'");
    expect(staffDocumentRoute).toContain('staffCanAccessProfile(staff, attachment.profile_id)');
  });

  it('selects the profile conversation collection through an explicit relationship', () => {
    const staffCasesRoute = repoFile('src/pages/api/staff/cases.ts');
    expect(staffCasesRoute).toContain(
      'conversations!conversations_profile_id_fkey(id,title,summary,last_persona,status,created_at,updated_at)',
    );
    expect(staffCasesRoute).toContain(
      'mineral_interests!mineral_interests_profile_id_fkey(id,label,city,state,state_code,county',
    );
  });

  it('exposes assignment management only through the admin staff route', () => {
    const assignmentRoute = repoFile('src/pages/api/staff/cases/[profileId]/assignments.ts');
    expect(assignmentRoute).toContain('requireAdminStaff(context)');
    expect(assignmentRoute).toContain("eventType: 'staff_case_assignment_created'");
    expect(assignmentRoute).toContain("eventType: 'staff_case_assignment_removed'");
  });

  it('maps owner-case statuses and ratings to staff-visible colors without fake GHL ids', () => {
    expect(ownerCaseStatusLabel('underwriting')).toBe('Underwriting');
    expect(ownerCaseStatusLabel('unknown-status')).toBe('Unknown status');
    expect(ownerCaseRatingTone('hot')).toBe('red');
    expect(ownerCaseRatingTone('warm')).toBe('amber');
    expect(ownerCaseRatingTone('cold')).toBe('blue');

    const mapping = resolveOwnerCaseStageMapping({
      MRX_GHL_OWNER_CASE_STAGE_MAP_JSON: JSON.stringify({
        intake: {
          pipelineId: 'pipe-real',
          stageId: 'stage-real',
          pipelineName: 'Prospects',
          stageName: 'Record Added',
        },
      }),
    });
    expect(mapping.intake).toEqual({
      pipelineId: 'pipe-real',
      stageId: 'stage-real',
      pipelineName: 'Prospects',
      stageName: 'Record Added',
    });
    expect(resolveOwnerCaseStageMapping({})).toEqual({});
    expect(DEFAULT_OWNER_CASE_STAGE_NAMES.offer_sent).toEqual({
      pipelineName: 'Sellers',
      stageName: 'Offer Sent',
    });
    expect(DEFAULT_OWNER_CASE_STAGE_NAMES.on_hold).toBeNull();
  });

  it('maps internal case statuses to the four approved owner-visible labels only', () => {
    expect(ownerVisibleCaseStatusForInternalStatus('intake')).toBe('received');
    expect(ownerVisibleCaseStatusForInternalStatus('research')).toBe('received');
    expect(ownerVisibleCaseStatusForInternalStatus('underwriting')).toBe('received');
    expect(ownerVisibleCaseStatusForInternalStatus('on_hold')).toBeNull();
    expect(ownerVisibleCaseStatusForInternalStatus('needs_info')).toBe('information_requested');
    expect(ownerVisibleCaseStatusForInternalStatus('ready_for_review')).toBe('ready_for_review');
    expect(ownerVisibleCaseStatusForInternalStatus('documents_complete')).toBe('ready_for_review');
    for (const status of [
      'offer_pending',
      'offer_sent',
      'due_diligence',
      'title_review',
      'closing_scheduled',
      'closed',
      'lost',
    ]) {
      expect(ownerVisibleCaseStatusForInternalStatus(status)).toBeNull();
    }

    const projection = projectOwnerVisibleCaseStatus({
      status: 'offer_sent',
      updated_at: '2026-09-08T21:00:00.000Z',
    });
    expect(projection).toBeNull();
    expect(
      projectOwnerVisibleCaseStatus(
        { status: 'title_review', updated_at: '2026-09-08T21:00:00.000Z' },
        { reviewerId: 'staff-1', reviewedAt: '2026-09-08T22:00:00.000Z' },
      ),
    ).toEqual({
      status: 'review_completed',
      label: 'Review completed',
      description: expect.stringContaining('completed a human review'),
      updatedAt: '2026-09-08T22:00:00.000Z',
      source: 'staff_case_workspace',
    });
    expect(
      projectOwnerVisibleCaseStatus(
        { status: 'needs_info', updated_at: '2026-09-08T23:00:00.000Z' },
        { reviewerId: 'staff-1', reviewedAt: '2026-09-08T22:00:00.000Z' },
      )?.status,
    ).toBe('information_requested');
    expect(
      projectOwnerVisibleCaseStatus(
        { status: 'on_hold', updated_at: '2026-09-08T23:00:00.000Z' },
        { reviewerId: 'staff-1', reviewedAt: '2026-09-08T22:00:00.000Z' },
      ),
    ).toBeNull();
    expect(
      projectOwnerVisibleCaseStatus(
        { status: 'closed', updated_at: '2026-09-08T23:00:00.000Z' },
        { reviewerId: 'staff-1', reviewedAt: '2026-09-08T22:00:00.000Z' },
      ),
    ).toBeNull();
    expect(JSON.stringify(projection)).not.toMatch(
      /offer_sent|case_rating|opportunity|valuation|internal_case_notes|internal_case_files/,
    );
    expect(projectOwnerVisibleCaseStatus(null)).toBeNull();
  });

  it('keeps GHL identifiers server-owned and attempts a nonblocking live opportunity sync', () => {
    const workspaceRoute = repoFile('src/pages/api/staff/cases/[profileId]/workspace.ts');
    expect(workspaceRoute).toContain('syncGhlOwnerCaseOpportunity');
    expect(workspaceRoute).toContain("ghl_pipeline_status: 'sync_failed'");
    expect(workspaceRoute).not.toContain('ghlPipelineId: z.string');
    expect(workspaceRoute).not.toContain('ghlPipelineStageId: z.string');
  });

  it('adds a dedicated staff profile route for complete owner-case records', () => {
    const staffCaseProfileRoute = repoFile('src/pages/api/staff/cases/[profileId].ts');
    const staffCasesRoute = repoFile('src/pages/api/staff/cases.ts');
    expect(staffCaseProfileRoute).toContain('staff_case_profile_viewed');
    expect(staffCaseProfileRoute).toContain('STAFF_CASE_PROFILE_SELECT');
    expect(staffCasesRoute).toContain('internal_case_notes');
    expect(staffCasesRoute).toContain('internal_case_files');
    expect(staffCasesRoute).toContain('ghl_pipeline_stage_id');
  });

  it('pins staff magic-link redirects to the canonical staff route for the current origin', () => {
    expect(staffLoginRedirectTo('https://mineralrightsxchange.com')).toBe(
      'https://mineralrightsxchange.com/staff/',
    );
    expect(staffLoginRedirectTo('http://localhost:3000')).toBe('http://localhost:3000/staff/');
    expect(
      staffLoginRedirectTo('https://mineralrightsxchange.com/some/path#access_token=secret'),
    ).toBe('https://mineralrightsxchange.com/staff/');
  });

  it('pins staff password setup and recovery redirects to the live staff route', () => {
    expect(staffPasswordRecoveryRedirectTo()).toBe('https://mineralrightsxchange.com/staff/');
  });

  it('supports direct staff email password sign-in and recovery without bypassing staff RBAC', () => {
    const staffPortal = repoFile('src/components/react/StaffPortal.tsx');
    expect(staffPortal).toContain('signInWithPassword');
    expect(staffPortal).toContain('resetPasswordForEmail');
    expect(staffPortal).toContain('updateUser({ password: newPassword })');
    expect(staffPortal).toContain('PASSWORD_RECOVERY');
    expect(staffPortal).toContain('staffPasswordRecoveryRedirectTo()');
    expect(staffPortal).toContain('Set or reset password');
    expect(staffPortal).toContain('disabled={authBusy}');
    expect(staffPortal.indexOf('if (isRecoverySession && session)')).toBeLessThan(
      staffPortal.indexOf('if (loading && !cases.length)'),
    );
    expect(staffPortal).toContain('/api/staff/cases');

    const staffGuard = repoFile('src/lib/platform/staff.ts');
    expect(staffGuard).toContain(".from('staff_profiles')");
    expect(staffGuard).toContain(".eq('active', true)");
    expect(staffGuard).toContain('staffCanAccessProfile(staff, profileId)');
  });
});
