import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repoFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const migration = repoFile('supabase/migrations/20260722120000_mrx_underwriting_intake_packet.sql');
const ownerChecklistApi = repoFile('src/pages/api/account/underwriting-checklist.ts');
const staffPacketApi = repoFile('src/pages/api/staff/cases/[profileId]/underwriting-packet.ts');
const attachmentSignApi = repoFile('src/pages/api/chat/attachments/sign.ts');
const accountHub = repoFile('src/components/react/AccountHub.tsx');
const staffPortal = repoFile('src/components/react/StaffPortal.tsx');
const staffCaseSelect = repoFile('src/pages/api/staff/cases.ts');

describe('underwriting packet persistence and API boundaries', () => {
  it('stores typed requirements and immutable-ready packet snapshots behind staff-only RLS', () => {
    expect(migration).toContain(
      'create table if not exists public.underwriting_document_requirements',
    );
    expect(migration).toContain('create table if not exists public.underwriting_packets');
    expect(migration).toContain('accepted_document_types text[]');
    expect(migration).toContain('requirement_level text');
    expect(migration).toContain('waiver_reason text');
    expect(migration).toContain('source_fingerprint text');
    expect(migration).toContain('packet_snapshot jsonb');
    expect(migration).toContain('create policy "Staff manages underwriting requirements"');
    expect(migration).toContain('public.is_mrx_admin() or exists');
    expect(migration).toContain('case_assignments');
    expect(migration).toContain('sp.user_id = auth.uid()');
    expect(migration).not.toContain('Owners read underwriting');
    expect(migration).toContain('attachments_document_type_check');
    expect(migration).toContain('finalize_underwriting_packet');
    expect(migration).toContain('reopen_underwriting_packet');
    expect(migration).toContain('to service_role');
  });

  it('requires a typed owner upload and stores the selected document type', () => {
    expect(attachmentSignApi).toContain('documentType: z.enum(UNDERWRITING_DOCUMENT_TYPES)');
    expect(attachmentSignApi).toContain('requirementKey: z.string()');
    expect(attachmentSignApi).toContain('invalid_document_requirement');
    expect(attachmentSignApi).toContain('document_type: parsed.data.documentType');
    expect(accountHub).toContain('Document type');
    expect(accountHub).toContain('documentType: uploadDocumentType');
    expect(accountHub).toContain('requirementKey: uploadRequirementKey');
    expect(accountHub).toContain('Underwriter preparation checklist');
  });

  it('returns only a sanitized owner checklist through the owner-access guard', () => {
    expect(ownerChecklistApi).toContain('requireOwnerProfileAccess(context)');
    expect(ownerChecklistApi).toContain('projectOwnerUnderwritingChecklist');
    expect(ownerChecklistApi).toContain('documentWorkerAvailable');
    expect(ownerChecklistApi).toContain('readinessBlockers');
    expect(ownerChecklistApi).not.toContain('waiver_reason');
    expect(ownerChecklistApi).not.toContain('verified_by');
    expect(ownerChecklistApi).not.toContain('underwriter_brief');
  });

  it('gates verification, waiver, and final readiness through the staff case route', () => {
    expect(staffPacketApi).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(staffPacketApi).toContain('canStaffPerformPacketAction');
    expect(staffPacketApi).toContain("action: z.literal('verify')");
    expect(staffPacketApi).toContain("action: z.literal('waive')");
    expect(staffPacketApi).toContain("action: z.literal('confirm_fact')");
    expect(staffPacketApi).toContain("action: z.literal('reject_fact')");
    expect(staffPacketApi).toContain("action: z.literal('finalize')");
    expect(staffPacketApi).toContain('source_fingerprint');
    expect(staffPacketApi).toContain("rpc('finalize_underwriting_packet'");
    expect(staffPacketApi).toContain("rpc('reopen_underwriting_packet'");
    expect(staffPacketApi).toContain("eventType: 'staff_underwriting_requirement_verified'");
    expect(staffPacketApi).toContain("eventType: 'staff_underwriting_requirement_waived'");
    expect(staffPacketApi).toContain("eventType: 'staff_underwriting_packet_finalized'");
    expect(staffPacketApi).toContain("eventType: 'staff_underwriting_fact_confirmed'");
    expect(staffPacketApi).toContain('documentWorkerAvailable');
    expect(staffPortal).toContain('Underwriter packet readiness');
    expect(staffPortal).toContain('Finalize packet readiness');
    expect(staffPortal).toContain('Waive with reason');
  });

  it('loads typed documents and updated timestamps into the auditable staff packet', () => {
    expect(staffCaseSelect).toContain('document_type');
    expect(staffCaseSelect).toContain(
      'attachments(id,mineral_interest_id,original_name,document_type',
    );
    expect(staffCaseSelect).toContain('updated_at');
  });
});
