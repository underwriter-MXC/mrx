import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TEST_OWNER_INTERESTS,
  TEST_STATEMENT_TOTALS,
  assessmentDetails,
  buildTestOwnerProfiles,
} from '../../scripts/lib/test-owner-profiles.mjs';
import { isProductionHostname } from '../../scripts/lib/production-host.mjs';
import {
  explicitNonProductionTestGhlSyncAllowed,
  stagingTestAccessAllowed,
  testOutboundSuppressed,
} from '../../src/lib/platform/test-access';
import { TestOwnerSchema } from '../../src/pages/api/test/verify-owner';

const repoFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Ten TEST owner profile fixtures', () => {
  const profiles = buildTestOwnerProfiles();

  it('defines exactly ten unique fictional identities with TEST as the exact last name', () => {
    expect(profiles).toHaveLength(10);
    expect(profiles.map((profile) => profile.displayName)).toEqual(
      Array.from({ length: 10 }, (_, index) => `Dawson${String(index + 1).padStart(2, '0')} TEST`),
    );
    expect(profiles.every((profile) => profile.lastName === 'TEST')).toBe(true);
    expect(new Set(profiles.map((profile) => profile.email)).size).toBe(10);
    expect(new Set(profiles.map((profile) => profile.phone)).size).toBe(10);
    expect(profiles.every((profile) => profile.email.endsWith('@example.com'))).toBe(true);
    expect(profiles.every((profile) => /^\+143255501(?:0[1-9]|10)$/.test(profile.phone))).toBe(
      true,
    );
  });

  it('uses the three approved Panther interests without inventing acreage or lease status', () => {
    expect(TEST_OWNER_INTERESTS).toHaveLength(3);
    expect(TEST_OWNER_INTERESTS.map((interest) => interest.propertyReference)).toEqual([
      'TX1034001',
      'TX1035002',
      'TX1036003',
    ]);
    expect(TEST_OWNER_INTERESTS.map((interest) => interest.royaltyDecimal)).toEqual([
      0.00105976, 0.00038124, 0.00022329,
    ]);
    for (const interest of TEST_OWNER_INTERESTS) {
      expect(interest.operator).toBe('Laguna Resources');
      expect(interest.county).toBe('Dawson');
      expect(interest.state).toBe('Texas');
      expect(interest.ownershipType).toBe('royalties_only');
      expect(interest.producingStatus).toBe('yes');
      expect(interest).not.toHaveProperty('netMineralAcres');
      expect(interest).not.toHaveProperty('grossAcresUnderLease');
      expect(interest).not.toHaveProperty('leaseStatus');
      expect(interest.unknownFields).toContain('Net mineral acres owned');
    }
  });

  it('reconciles the three property payments to the approved statement totals', () => {
    const sum = (key: 'ownerGrossValue' | 'severanceTax' | 'regulatoryFee' | 'recentPaymentNet') =>
      Number(TEST_OWNER_INTERESTS.reduce((total, item) => total + item[key], 0).toFixed(2));
    expect(sum('ownerGrossValue')).toBe(TEST_STATEMENT_TOTALS.ownerGrossValue);
    expect(Number((sum('severanceTax') + sum('regulatoryFee')).toFixed(2))).toBe(
      TEST_STATEMENT_TOTALS.deductions,
    );
    expect(sum('recentPaymentNet')).toBe(TEST_STATEMENT_TOTALS.ownerNetValue);
    expect(
      TEST_OWNER_INTERESTS.every((interest) => assessmentDetails(interest).includes('TEST')),
    ).toBe(true);
  });

  it('accepts at most five reconciled structured interests with an exact TEST last name', () => {
    const owner = buildTestOwnerProfiles()[0];
    const payload = {
      runId: '00000000-0000-4000-8000-000000000001',
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      interests: TEST_OWNER_INTERESTS.map((interest) => ({
        ...interest,
        assessmentDetails: assessmentDetails(interest),
      })),
    };
    const valid = TestOwnerSchema.safeParse(payload);
    expect(valid.success).toBe(true);
    expect(
      TestOwnerSchema.safeParse({
        ...payload,
        lastName: 'Test',
      }).success,
    ).toBe(false);
    expect(
      TestOwnerSchema.safeParse({
        ...payload,
        interests: Array.from({ length: 6 }, () => payload.interests[0]),
      }).success,
    ).toBe(false);
    expect(
      TestOwnerSchema.safeParse({
        runId: payload.runId,
        firstName: 'Legacy',
        lastName: 'Owner',
        email: 'legacy-owner@example.com',
        phone: '+14325550199',
        state: 'Texas',
        county: 'Dawson',
        propertyCount: 2,
      }).success,
    ).toBe(true);
  });

  it('rejects structured payment facts that do not reconcile', () => {
    const owner = buildTestOwnerProfiles()[0];
    expect(
      TestOwnerSchema.safeParse({
        runId: '00000000-0000-4000-8000-000000000001',
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        interests: [
          {
            ...TEST_OWNER_INTERESTS[0],
            recentPaymentNet: 999,
            assessmentDetails: assessmentDetails(TEST_OWNER_INTERESTS[0]),
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps the generated fixture independent of the confidential source document', () => {
    const builder = repoFile('scripts/build-test-owner-fixture.py');
    const runner = repoFile('scripts/run-owner-profiles-10.mjs');
    const combined = `${builder}\n${runner}`;
    expect(builder).toContain('TEST DATA - NOT A REAL OWNER RECORD');
    expect(combined).not.toMatch(/enverus/i);
    expect(combined).not.toContain('/Users/darylhill/Downloads');
    expect(combined).not.toContain('Revenue Statement_LAGUNA');
    expect(runner).toContain('sourcePdfUsed: false');
  });
});

describe('staging test safety contracts', () => {
  it('returns a production-safe 404 for GET requests to every staging test route', async () => {
    const routes = await Promise.all([
      import('../../src/pages/api/test/verify-owner'),
      import('../../src/pages/api/test/run-summary'),
      import('../../src/pages/api/test/cleanup-run'),
      import('../../src/pages/api/test/sync-owner'),
    ]);

    for (const route of routes) {
      const response = await route.GET({} as never);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ ok: false, error: 'not_found' });
    }
  });

  it('denies protected test APIs on production hosts and production Vercel environments', () => {
    expect(isProductionHostname('mineralrightsxchange.com.')).toBe(true);
    expect(isProductionHostname('WWW.MINERALRIGHTSXCHANGE.COM...')).toBe(true);
    expect(isProductionHostname('mrx-preview.vercel.app')).toBe(false);
    const productionRequest = new Request('https://mineralrightsxchange.com/api/test/run-summary', {
      headers: { 'x-mrx-test-secret': 'secret' },
    });
    expect(
      stagingTestAccessAllowed(productionRequest, {
        MRX_TEST_MODE: 'true',
        MRX_STAGING_TEST_SECRET: 'secret',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(false);
    const fullyQualifiedProductionRequest = new Request(
      'https://www.mineralrightsxchange.com./api/test/run-summary',
      { headers: { 'x-mrx-test-secret': 'secret' } },
    );
    expect(
      stagingTestAccessAllowed(fullyQualifiedProductionRequest, {
        MRX_TEST_MODE: 'true',
        MRX_STAGING_TEST_SECRET: 'secret',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(false);
    const previewRequest = new Request('https://mrx-preview.vercel.app/api/test/run-summary', {
      headers: { 'x-mrx-test-secret': 'secret' },
    });
    expect(
      stagingTestAccessAllowed(previewRequest, {
        MRX_TEST_MODE: 'true',
        MRX_STAGING_TEST_SECRET: 'secret',
        VERCEL_ENV: 'production',
      }),
    ).toBe(false);
    expect(
      stagingTestAccessAllowed(previewRequest, {
        MRX_TEST_MODE: 'true',
        MRX_STAGING_TEST_SECRET: 'secret',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(true);
  });

  it('suppresses test-profile GHL writes unless the explicit non-production flags are enabled', () => {
    expect(
      testOutboundSuppressed(
        { is_test: true, test_run_id: '00000000-0000-4000-8000-000000000001' },
        { MRX_TEST_MODE: 'false', MRX_TEST_SYNC_GHL: 'false', VERCEL_ENV: 'preview' },
      ),
    ).toBe(true);
    expect(
      explicitNonProductionTestGhlSyncAllowed({
        MRX_TEST_MODE: 'true',
        MRX_TEST_SYNC_GHL: 'true',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(true);
    expect(
      explicitNonProductionTestGhlSyncAllowed({
        MRX_TEST_MODE: 'true',
        MRX_TEST_SYNC_GHL: 'true',
        VERCEL_ENV: 'production',
      }),
    ).toBe(false);
  });

  it('uses one shared staging guard and storage-aware exact-run cleanup', () => {
    for (const route of [
      'src/pages/api/test/verify-owner.ts',
      'src/pages/api/test/sync-owner.ts',
      'src/pages/api/test/cleanup-run.ts',
      'src/pages/api/test/run-summary.ts',
    ]) {
      expect(repoFile(route)).toContain('stagingTestAccessAllowed');
    }
    const syncOwner = repoFile('src/pages/api/test/sync-owner.ts');
    expect(syncOwner).toContain("error: 'not_found'");
    expect(syncOwner.indexOf('if (!stagingTestAccessAllowed')).toBeLessThan(
      syncOwner.indexOf('if (!explicitNonProductionTestGhlSyncAllowed'),
    );
    const cleanup = repoFile('src/pages/api/test/cleanup-run.ts');
    expect(cleanup).toMatch(/storage\s*\.from\('owner-documents'\)\s*\.remove\(storagePaths\)/);
    expect(cleanup).not.toContain('storagePaths,');
    const crm = repoFile('src/lib/platform/crm.ts');
    expect(crm).toContain('if (testOutboundSuppressed(profile)) return null;');
    expect(crm).not.toContain('encrypted_raw_text');
    expect(crm).not.toContain('mrx_latest_document_ocr');
    expect(crm).toContain(".eq('status', 'confirmed')");
    expect(crm).toContain('contact.mrx_latest_document_summary');
    const webhook = repoFile('src/pages/api/webhooks/ghl.ts');
    expect(webhook).not.toContain('GHL Voice AI raw transcript');
    expect(webhook).toContain('GHL Voice AI approved summary');
    const ghl = repoFile('src/lib/platform/ghl.ts');
    expect(ghl).toContain("throw new Error('test_profile_outbound_suppressed')");
    expect(ghl.indexOf('test_profile_outbound_suppressed')).toBeLessThan(
      ghl.indexOf('const settings = await configWithLocation()', ghl.indexOf('upsertContact')),
    );
    const legacyProfile = repoFile('src/pages/api/profile.ts');
    expect(legacyProfile).toContain('!testState.suppressed');
  });

  it('packages the retained ten-profile runner and validates staff-workspace visibility', () => {
    const pkg = JSON.parse(repoFile('package.json'));
    expect(pkg.scripts['test:owner-profiles:10']).toContain('scripts/run-owner-profiles-10.mjs');
    const runner = repoFile('scripts/run-owner-profiles-10.mjs');
    expect(runner).toContain("'/api/chat/attachments/sign'");
    expect(runner).toContain("'/api/chat/attachments/complete'");
    expect(runner).toContain("'/api/test/run-summary'");
    expect(runner).toContain('retainedProfiles: results.length');
    const summary = repoFile('src/pages/api/test/run-summary.ts');
    const verifier = repoFile('src/pages/api/test/verify-owner.ts');
    expect(verifier).toContain('ensureStagingUnderwriter(supabase)');
    expect(verifier).toContain('mrx-staging-underwriter-test@example.com');
    expect(verifier).toContain("purpose: 'staging_owner_profile_underwriter'");
    expect(summary).toContain('TX1034001');
    expect(summary).toContain('TX1035002');
    expect(summary).toContain('TX1036003');
    expect(summary).toContain('hasExpectedInterests(profile)');
    expect(summary).toContain("profile.workspaceStatus === 'underwriting'");
    expect(summary).toContain('profile.workspaceInterestCount === 3');
    expect(summary).toContain('profile.assignmentCount === 1');
    expect(summary).toContain('profile.hasActiveUnderwriterAssignment');
    expect(summary).toContain('facts.recentPaymentNet');
    expect(summary).toContain("['queued', 'sent', 'delivered', 'failed']");
    expect(summary).toContain('activeDispatches.length === 0');
  });

  it('suppresses account-access GHL delivery for test profiles before contact/message calls', () => {
    const identity = repoFile('src/lib/platform/identity.ts');
    expect(identity).toContain('is_test,test_run_id');
    expect(identity).toContain('if (testOutboundSuppressed(profile))');
    expect(identity).toContain("purpose: 'account_access'");
    expect(identity).toContain("status: 'suppressed'");
    expect(identity).toContain("requested_by: 'test'");
    expect(identity).toContain("reason: 'test_profile_outbound_suppressed'");
    expect(identity.indexOf('if (testOutboundSuppressed(profile))')).toBeLessThan(
      identity.indexOf('generateLink({'),
    );
    expect(identity.indexOf('if (testOutboundSuppressed(profile))')).toBeLessThan(
      identity.indexOf('contactId = await upsertContact('),
    );
  });
});
