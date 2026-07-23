import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260715090000_mrx_owner_memory.sql', import.meta.url),
  'utf8',
);
const communicationMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260715170000_mrx_communication_controls.sql',
    import.meta.url,
  ),
  'utf8',
);
const ghlSyncMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260715200000_mrx_ghl_conversation_sync.sql',
    import.meta.url,
  ),
  'utf8',
);
const geographyMigration = readFileSync(
  new URL('../../supabase/migrations/20260716120000_mrx_us_geography.sql', import.meta.url),
  'utf8',
);
const basinMigration = readFileSync(
  new URL('../../supabase/migrations/20260716180000_mrx_energy_basins.sql', import.meta.url),
  'utf8',
);
const internalWorkspaceMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260720133000_mrx_internal_case_workspace.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('MRX owner-memory baseline migration', () => {
  it('uses a 14-digit baseline and contains required owner-memory tables', () => {
    for (const table of [
      'device_sessions',
      'mineral_interests',
      'owner_facts',
      'document_processing_jobs',
      'document_extractions',
      'owner_memory_chunks',
      'staff_profiles',
      'case_assignments',
      'internal_case_notes',
      'internal_case_files',
      'audit_events',
    ]) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it('protects owner records with RLS and purges anonymous data after a retention window', () => {
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('purge_abandoned_anonymous_data');
    expect(migration).toContain('where user_id is null');
  });

  it('does not grant identifier-based claiming to browser roles', () => {
    expect(migration).toContain(
      'revoke all on function public.claim_owner_conversation(uuid, uuid, text, text, text) from public, anon, authenticated',
    );
    expect(migration).toContain(
      'grant execute on function public.claim_owner_conversation(uuid, uuid, text, text, text) to service_role',
    );
  });
});

describe('MRX communication-control migration', () => {
  it('adds explicit AI voice consent, completed leads, test isolation, and dispatch auditing', () => {
    expect(communicationMigration).toContain("'aiVoice'");
    expect(communicationMigration).toContain('completed_lead_at');
    expect(communicationMigration).toContain('test_run_id');
    expect(communicationMigration).toContain(
      'create table if not exists public.communication_dispatches',
    );
    expect(communicationMigration).toContain('consent_receipt_id');
  });

  it('keeps dispatch history private and server controlled', () => {
    expect(communicationMigration).toContain('enable row level security');
    expect(communicationMigration).toContain('refresh_completed_lead');
    expect(communicationMigration).toContain(
      'grant execute on function public.refresh_completed_lead(uuid) to service_role',
    );
  });
});

describe('MRX GHL conversation-sync migration', () => {
  it('tracks website messages while keeping raw OCR out of the GHL conversation', () => {
    expect(ghlSyncMigration).toContain('ghl_message_id');
    expect(ghlSyncMigration).toContain('ghl_synced_at');
    expect(ghlSyncMigration).toContain('document_extractions_pending_ghl_sync_idx');
    expect(ghlSyncMigration).toContain('AES-GCM encrypted raw OCR');
    expect(ghlSyncMigration).toContain('must not be copied to GHL');
  });
});

describe('MRX U.S. geography migration', () => {
  it('stores auditable geography and preserves the full owner case when profiles merge', () => {
    expect(geographyMigration).toContain('create table if not exists public.geography_resolutions');
    expect(geographyMigration).toContain('residence_county_fips');
    expect(geographyMigration).toContain(
      'update public.attachments set profile_id = canonical_profile_id',
    );
    expect(geographyMigration).toContain(
      'update public.communication_dispatches set profile_id = canonical_profile_id',
    );
    expect(geographyMigration).toContain('insert into public.case_assignments');
    expect(geographyMigration).toContain(
      'grant execute on function public.claim_owner_conversation',
    );
  });

  it('stores sourced basin matches separately from the legal recording geography', () => {
    expect(basinMigration).toContain('basin_name');
    expect(basinMigration).toContain('oil_gas_province');
    expect(basinMigration).toContain('basin_source_vintage');
    expect(basinMigration).toContain('This is not the county or state recording jurisdiction');
  });
});

describe('MRX private internal case workspace migration', () => {
  it('is forward-safe and keeps the dossier restricted to assigned staff', () => {
    expect(internalWorkspaceMigration).toContain(
      'create table if not exists public.internal_case_workspaces',
    );
    expect(internalWorkspaceMigration).toContain('enable row level security');
    expect(internalWorkspaceMigration).toContain('public.can_access_profile(profile_id)');
    expect(internalWorkspaceMigration).toContain(
      "canonical_extraction_policy = 'full_county_42_column'",
    );
    expect(internalWorkspaceMigration).toContain('blocked_pending_methodology_approval');
  });

  it('preserves internal notes, files, and the private dossier when owner profiles merge', () => {
    expect(internalWorkspaceMigration).toContain(
      'update public.internal_case_notes set profile_id = canonical_profile_id',
    );
    expect(internalWorkspaceMigration).toContain(
      'update public.internal_case_files set profile_id = canonical_profile_id',
    );
    expect(internalWorkspaceMigration).toContain('--- MERGED INTAKE ---');
  });

  it('does not merge profiles through unverified email identifiers', () => {
    expect(internalWorkspaceMigration).toMatch(
      /where kind = 'email'\s+and normalized_value = normalized_verified_email\s+and verified_at is not null/,
    );
  });
});
