import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  INTERNAL_CASE_FILE_BUCKET,
  INTERNAL_CASE_FILE_MAX_BYTES,
  deriveStaffRowSemantics,
  internalCaseFileMatches,
  internalCaseStoragePath,
  normalizeStaffSearchQuery,
  parseStaffCaseListQuery,
  safeInternalFilename,
} from '../../src/lib/platform/staff';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260715090000_mrx_owner_memory.sql', import.meta.url),
  'utf8',
);
const workspaceMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260720133000_mrx_internal_case_workspace.sql',
    import.meta.url,
  ),
  'utf8',
);
const pipelineMigration = readFileSync(
  new URL('../../supabase/migrations/20260720154500_mrx_owner_case_pipeline.sql', import.meta.url),
  'utf8',
);
const ownerExportApi = readFileSync(
  new URL('../../src/pages/api/account/export.ts', import.meta.url),
  'utf8',
);
const ownerSessionApi = readFileSync(
  new URL('../../src/pages/api/chat/session.ts', import.meta.url),
  'utf8',
);
const staffCasesApi = readFileSync(
  new URL('../../src/pages/api/staff/cases.ts', import.meta.url),
  'utf8',
);
const staffNotesApi = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/notes.ts', import.meta.url),
  'utf8',
);
const staffFilesApi = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/files.ts', import.meta.url),
  'utf8',
);
const staffWorkspaceApi = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/workspace.ts', import.meta.url),
  'utf8',
);
const staffOwnerInterestApi = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/interests/[interestId].ts', import.meta.url),
  'utf8',
);
const staffPortalCss = readFileSync(
  new URL('../../src/components/react/StaffPortal.css', import.meta.url),
  'utf8',
);
const staffPortalTsx = readFileSync(
  new URL('../../src/components/react/StaffPortal.tsx', import.meta.url),
  'utf8',
);
const staffTs = readFileSync(new URL('../../src/lib/platform/staff.ts', import.meta.url), 'utf8');

describe('MRX staff-only case review workspace', () => {
  it('adds internal-only notes and files with staff RLS but no owner policies', () => {
    expect(migration).toContain('create table public.internal_case_notes');
    expect(migration).toContain('create table public.internal_case_files');
    expect(migration).toContain(
      "visibility text not null default 'internal' check (visibility = 'internal')",
    );
    expect(migration).toContain('alter table public.internal_case_notes enable row level security');
    expect(migration).toContain('alter table public.internal_case_files enable row level security');
    expect(migration).toContain('Assigned staff read internal case notes');
    expect(migration).toContain('Assigned staff read internal case files');
    expect(migration).not.toContain('Owners read internal case notes');
    expect(migration).not.toContain('Owners read internal case files');
    expect(workspaceMigration).toContain(
      'create table if not exists public.internal_case_workspaces',
    );
    expect(workspaceMigration).toContain('Assigned staff read internal case workspaces');
    expect(workspaceMigration).not.toContain('Owners read internal case workspaces');
  });

  it('uses a private staff storage bucket separate from owner documents', () => {
    expect(INTERNAL_CASE_FILE_BUCKET).toBe('staff-case-files');
    expect(INTERNAL_CASE_FILE_MAX_BYTES).toBe(25 * 1024 * 1024);
    expect(migration).toContain("values ('staff-case-files', 'staff-case-files', false");
  });

  it('keeps internal workspace records out of owner-facing APIs and exports', () => {
    expect(ownerExportApi).not.toContain('internal_case_notes');
    expect(ownerExportApi).not.toContain('internal_case_files');
    expect(ownerExportApi).not.toContain('internal_case_workspaces');
    expect(ownerSessionApi).not.toContain('internal_case_notes');
    expect(ownerSessionApi).not.toContain('internal_case_files');
    expect(ownerSessionApi).not.toContain('internal_case_workspaces');
    expect(ownerExportApi).not.toContain("select('*')");
  });

  it('exposes internal workspace records only through staff-scoped APIs', () => {
    expect(staffCasesApi).toContain('internal_case_notes');
    expect(staffCasesApi).toContain('internal_case_files');
    expect(staffNotesApi).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(staffFilesApi).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(staffNotesApi).toContain('staff_internal_note_created');
    expect(staffFilesApi).toContain('staff_internal_file_upload_signed');
    expect(staffWorkspaceApi).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(staffWorkspaceApi).toContain('staff_internal_workspace_updated');
    expect(staffOwnerInterestApi).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(staffOwnerInterestApi).toContain('staff_owner_profile_interest_updated');
    expect(staffOwnerInterestApi).toContain("field: 'staff_profile_update'");
    expect(staffOwnerInterestApi).toContain('ownerVisible: true');
    expect(staffPortalTsx).toContain('Update owner-visible property profile');
    expect(staffPortalTsx).toContain('Save to owner profile');
  });

  it('adds forward-safe owner-case database columns for searchable staff list and GHL pipeline display', () => {
    expect(workspaceMigration).toContain('case_rating text not null default');
    expect(workspaceMigration).toContain('opportunity_value_cents bigint');
    expect(workspaceMigration).toContain('opportunity_size_label text');
    expect(workspaceMigration).toContain('mineral_rights_count integer');
    expect(workspaceMigration).toContain('last_contact_at timestamptz');
    expect(workspaceMigration).toContain('ghl_opportunity_id text');
    expect(workspaceMigration).toContain('ghl_pipeline_id text');
    expect(workspaceMigration).toContain('ghl_pipeline_stage_id text');
    expect(workspaceMigration).toContain('internal_case_workspaces_search_idx');
    expect(staffCasesApi).toContain('case_rating');
    expect(staffCasesApi).toContain('mineral_rights_count');
    expect(staffCasesApi).toContain('ghl_pipeline_stage_id');
    expect(pipelineMigration).toContain('add column if not exists case_rating');
    expect(pipelineMigration).toContain("notify pgrst, 'reload schema'");
  });

  it('sanitizes internal storage paths under the case profile namespace', () => {
    expect(safeInternalFilename('../Jamie Brief!.pdf')).toBe('Jamie-Brief-.pdf');
    expect(
      internalCaseStoragePath({
        profileId: '11111111-1111-4111-8111-111111111111',
        filename: '../Jamie Brief!.pdf',
        id: 'fixed-id',
      }),
    ).toBe('internal/11111111-1111-4111-8111-111111111111/fixed-id-Jamie-Brief-.pdf');
  });

  it('validates internal file size and signatures before marking uploads ready', async () => {
    const pdf = new Blob([new TextEncoder().encode('%PDF-1.7\ninternal')]);
    await expect(internalCaseFileMatches(pdf, 'application/pdf', pdf.size)).resolves.toBe(true);
    await expect(internalCaseFileMatches(pdf, 'application/pdf', pdf.size + 1)).resolves.toBe(
      false,
    );

    const disguised = new Blob([new TextEncoder().encode('not a PDF')]);
    await expect(
      internalCaseFileMatches(disguised, 'application/pdf', disguised.size),
    ).resolves.toBe(false);

    const csv = new Blob([new TextEncoder().encode('Owner,County\nJane Doe,Reeves')]);
    await expect(internalCaseFileMatches(csv, 'text/csv', csv.size)).resolves.toBe(true);
  });

  it('normalizes search queries while keeping email/phone-friendly characters', () => {
    expect(normalizeStaffSearchQuery('  Jane %Doe_Doe+test  ')).toBe('Jane Doe Doe+test');
    expect(normalizeStaffSearchQuery('!@#$%^&*()').length).toBeGreaterThan(0); // @ is preserved for emails
    expect(normalizeStaffSearchQuery('a'.repeat(200))).toHaveLength(120);
    expect(normalizeStaffSearchQuery(null)).toBe('');
    expect(normalizeStaffSearchQuery('   ')).toBe('');
  });

  it('parses every Owner Cases list filter key and reports invalid entries', () => {
    const params = new URLSearchParams({
      q: 'Jane',
      status: 'underwriting',
      rating: 'hot',
      priority: 'urgent',
      verification: 'medium',
      mineralCounty: 'Reeves',
      mineralState: 'TX',
      mineralBasin: 'Permian',
      operator: 'Pioneer',
      mineralCountOp: '>=',
      mineralCount: '3',
      hasOpenRisks: 'yes',
      riskSeverityFloor: 'high+',
      assigneeScope: 'me',
      lastContactBucket: '7d',
      recommendedFocus: 'present',
      focusSearch: 'title',
      sort: 'opportunity_value_cents',
      page: '2',
      pageSize: '50',
    });
    const parsed = parseStaffCaseListQuery(params);
    expect(parsed.invalid).toEqual([]);
    expect(parsed).toMatchObject({
      q: 'Jane',
      status: 'underwriting',
      rating: 'hot',
      priority: 'urgent',
      verification: 'medium',
      mineralCounty: 'Reeves',
      mineralState: 'TX',
      mineralBasin: 'Permian',
      operator: 'Pioneer',
      mineralCountOp: '>=',
      mineralCountValue: 3,
      hasOpenRisks: 'yes',
      riskSeverityFloor: 'high+',
      assigneeScope: 'me',
      lastContactBucket: '7d',
      recommendedFocus: 'present',
      focusSearch: 'title',
      sort: 'opportunity_value_cents',
      page: 2,
      pageSize: 50,
    });

    const bad = parseStaffCaseListQuery(
      new URLSearchParams({
        status: 'not-a-status',
        priority: 'super-urgent',
        mineralCount: '-5',
        sort: 'mystery',
        page: '0',
      }),
    );
    expect(bad.invalid.sort()).toEqual(
      ['mineralCount', 'page', 'priority', 'sort', 'status'].sort(),
    );
    expect(bad.status).toBeNull();
    expect(bad.priority).toBeNull();
    expect(bad.sort).toBe('last_activity');
    expect(bad.page).toBe(1);
    expect(bad.mineralCountValue).toBeNull();
  });

  it('derives row semantics without leaking internal data through the public exports', () => {
    const row = {
      internal_case_workspaces: {
        status: 'underwriting' as const,
        priority: 'urgent' as const,
        case_rating: 'hot' as const,
        verification_confidence: 'high' as const,
        mineral_rights_count: 4,
        recommended_focus: 'Confirm deed coverage',
        risk_flags: [
          { code: 'T36', severity: 'critical', status: 'open' },
          { code: 'T12', severity: 'low', status: 'reviewing' },
          { code: 'T99', severity: 'medium', status: 'resolved' },
        ],
        last_contact_at: null,
        ghl_pipeline_id: 'pipe-1',
        ghl_pipeline_stage_id: 'stage-1',
        ghl_pipeline_name: 'Sellers',
        ghl_pipeline_stage_name: 'Offer Sent',
        valuation_status: 'blocked_pending_methodology_approval' as const,
      },
      mineral_interests: [
        { county: 'Reeves', state_code: 'TX', basin_name: 'Permian', operator: 'Pioneer' },
        { county: 'Reeves', state_code: 'TX', basin_name: 'Permian', operator: null },
        { county: 'Loving', state: 'TX', basin_name: null, operator: 'Diamondback' },
      ],
      case_assignments: [
        { assigned_staff: { display_name: 'Iris Reviewer', active: true } },
        { assigned_staff: { display_name: null, active: true } },
      ],
    };
    const semantics = deriveStaffRowSemantics(row);
    expect(semantics.workspaceExists).toBe(true);
    expect(semantics.effectiveMineralCount).toBe(4);
    expect(semantics.countSource).toBe('workspace');
    expect(semantics.uniqueCounties).toEqual(['Loving', 'Reeves']);
    expect(semantics.uniqueStates).toEqual(['TX']);
    expect(semantics.uniqueBasins).toEqual(['Permian', null]);
    expect(semantics.uniqueOperators).toEqual(['Diamondback', 'Pioneer', null]);
    expect(semantics.openRiskCount).toBe(2);
    expect(semantics.maxOpenSeverity).toBe('critical');
    expect(semantics.assigneeLabel).toBe('Iris Reviewer');
    expect(semantics.isGhlMapped).toBe(true);
    expect(semantics.ghlDisplay).toBe('Sellers · Offer Sent');
    expect(semantics.valuationStatusLabel).toBe('Blocked · awaiting methodology approval');

    const empty = deriveStaffRowSemantics({});
    expect(empty.workspaceExists).toBe(false);
    expect(empty.effectiveMineralCount).toBe(0);
    expect(empty.countSource).toBe('interests');
    expect(empty.openRiskCount).toBe(0);
    expect(empty.maxOpenSeverity).toBeNull();
    expect(empty.assigneeLabel).toBe('Unassigned');
    expect(empty.ghlDisplay).toBe('Not mapped');
  });

  it('never returns internal_case_* fields through owner-facing APIs (still enforced)', () => {
    expect(ownerExportApi).not.toContain('internal_case_notes');
    expect(ownerExportApi).not.toContain('internal_case_files');
    expect(ownerExportApi).not.toContain('internal_case_workspaces');
    expect(ownerSessionApi).not.toContain('internal_case_notes');
    expect(ownerSessionApi).not.toContain('internal_case_files');
    expect(ownerSessionApi).not.toContain('internal_case_workspaces');
  });

  it('staff cases API exposes every filter, sort, page, and facet accepted by the parser', () => {
    for (const key of [
      'q',
      'status',
      'rating',
      'priority',
      'verification',
      'mineralCounty',
      'mineralState',
      'mineralBasin',
      'operator',
      'mineralCountOp',
      'mineralCount',
      'hasOpenRisks',
      'riskSeverityFloor',
      'assigneeScope',
      'lastContactBucket',
      'recommendedFocus',
      'focusSearch',
      'sort',
      'page',
      'pageSize',
    ]) {
      // The cases API delegates query parsing to parseStaffCaseListQuery,
      // which is the actual surface that consumes these keys.
      expect(staffTs).toContain(`params.get('${key}')`);
    }
    expect(staffCasesApi).toContain('parseStaffCaseListQuery');
    expect(staffCasesApi).toContain('deriveStaffRowSemantics');
    expect(staffCasesApi).toContain('staff_case_list_viewed');
    expect(staffCasesApi).toContain('returnedCount');
    expect(staffCasesApi).toContain('totalCount');
    expect(staffCasesApi).toContain('facets');
    expect(staffCasesApi).toContain('sortKeys');
    expect(staffCasesApi).toContain('invalid_filter_');
    expect(staffCasesApi).toContain('assertSameOrigin');
    expect(staffCasesApi).toContain('assertRateLimit');
  });

  it('forbids mutating valuation_status from the workspace PUT endpoint', () => {
    expect(staffWorkspaceApi).toContain('valuation_status');
    expect(staffWorkspaceApi).not.toMatch(/valuationStatus[^_a-zA-Z]/);
    expect(staffWorkspaceApi).not.toMatch(/valuation_status\s*:\s*parsed\.data\./);
    expect(staffWorkspaceApi).toContain('Underwriting gate');
  });

  it('staff portal UI exposes search filters, sort, pagination, derived row chips, and ARIA labels', () => {
    for (const label of [
      'Search owners',
      'Case status',
      'Rating',
      'Priority',
      'Verification',
      'Mineral county',
      'Mineral state',
      'Mineral basin',
      'Operator',
      'Min mineral interests',
      'Has open risks',
      'Open risk severity',
      'Has assignee',
      'Last contact',
      'Recommended focus',
      'Focus search',
      'Clear filters',
      'Sort owner cases by',
      'Identity &amp; location',
      'Case summary',
      'CRM opportunity',
      'Mineral interests',
      'Risk flags',
      'Workspace dossier',
      'Valuation transitions',
      'Not mapped',
    ]) {
      expect(staffPortalTsx).toContain(label);
    }
    expect(staffPortalTsx).toMatch(/aria-current\s*=\s*\{selected\?\.id === owner\.id/);
    expect(staffPortalTsx).toContain('role="search"');
    expect(staffPortalTsx).toContain('aria-busy');
    expect(staffPortalTsx).toContain('aria-live="polite"');
    expect(staffPortalTsx).toContain('Never contacted');
    expect(staffPortalTsx).toContain('Severity:');
  });

  it('staff portal CSS includes the v1 searchable Owner Cases additions without AccountHub regressions', () => {
    for (const selector of [
      '.staff-search__help',
      '.staff-database-meta',
      '.staff-database-meta__nav',
      '.staff-database-meta__sort',
      '.staff-case-row__chips',
      '.staff-case-row__priority',
      '.staff-case-row__priority--urgent',
      '.staff-case-row--skeleton',
      '.staff-chips',
      '.staff-risk-flags',
      '.staff-pill--severity-critical',
      '.staff-pill--severity-high',
      '.staff-pill--severity-medium',
      '.staff-pill--severity-low',
      '.staff-summary-cards__valuation',
      '.staff-valuation-transitions',
      '@media (prefers-reduced-motion: reduce)',
      '.account-visually-hidden',
    ]) {
      expect(staffPortalCss).toContain(selector);
    }
  });

  it('exposes pure helpers from staff.ts so list UI can derive row semantics client-side too', () => {
    expect(staffTs).toContain('export function deriveStaffRowSemantics');
    expect(staffTs).toContain('export function parseStaffCaseListQuery');
    expect(staffTs).toContain('export function normalizeStaffSearchQuery');
    expect(staffTs).toContain('RISK_SEVERITY_ORDER');
    expect(staffTs).toContain('STAFF_CASE_LIST_SORT_KEYS');
  });
});
