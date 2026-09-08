import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  buildOutcomeAnalyticsParams,
  buildOutcomeDedupKey,
  buildPrivacySafeAttributionContext,
  MRX_OUTCOME_BUSINESS_FORMULA,
  MRX_OUTCOME_STAGE_MAPPING,
  privacySafeAnalyticsParams,
  publicSourcePath,
} from '../../src/lib/platform/attribution-outcomes';
import { outcomeReport } from '../../src/pages/api/staff/cases/[profileId]/outcome';

const outcomeRouteSource = readFileSync(
  new URL('../../src/pages/api/staff/cases/[profileId]/outcome.ts', import.meta.url),
  'utf8',
);
const ownerCaseStatusApi = readFileSync(
  new URL('../../src/pages/api/account/case-status.ts', import.meta.url),
  'utf8',
);
const dedupMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260908185000_mrx_outcome_attribution_dedup.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('MRX privacy-safe attribution outcome contract', () => {
  it('declares the canonical stage/event mapping and business formula', () => {
    expect(MRX_OUTCOME_STAGE_MAPPING.relevantCaseCompleted).toMatchObject({
      event: 'relevant_case_completed',
      evidenceSources: ['required_case_fields', 'authorized_staff_attestation'],
      reportSeparately: true,
    });
    expect(MRX_OUTCOME_STAGE_MAPPING.completedHumanReview).toMatchObject({
      event: 'case_human_review_completed',
      auditEventType: 'staff_owner_case_review_completed',
      requiresStaffActor: true,
      requiresEvidenceLabel: 'actual',
      countInFormulaDenominator: true,
    });
    expect(MRX_OUTCOME_STAGE_MAPPING.agreedNextStep).toMatchObject({
      event: 'case_agreed_next_step',
      auditEventType: 'staff_owner_case_agreed_next_step',
      countInFormulaNumerator: true,
    });
    expect(MRX_OUTCOME_BUSINESS_FORMULA).toContain(
      'agreed-next-step cases / completed human reviews',
    );
    expect(MRX_OUTCOME_BUSINESS_FORMULA).toContain('segmented by verified source');
  });

  it('uses route buckets and a positive UTM registry instead of raw query values', async () => {
    vi.stubEnv('MRX_ATTRIBUTION_ID_PEPPER', 'test-pepper');
    const profileId = '11111111-1111-4111-8111-111111111111';
    const attribution = await buildPrivacySafeAttributionContext({
      profileId,
      receipts: [
        {
          channel: 'account',
          purpose: 'analytics',
          source_url: 'https://mineralrightsxchange.com/blog/how-title-defects-change-mineral-rights-offer/?gclid=jane-doe#secret',
          utm: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'offer-review',
            utm_content: 'jane-doe',
            utm_term: '5551234567',
          },
          created_at: '2026-09-08T20:00:00.000Z',
          granted: true,
        },
      ],
      refreshedAt: '2026-09-08T21:00:00.000Z',
    });
    const params = await buildOutcomeAnalyticsParams({
      profileId,
      event: 'case_agreed_next_step',
      evidenceLabel: 'actual',
      occurredAt: '2026-09-08T22:00:00.000Z',
      attribution,
      extra: {
        nextStepType: 'book_underwriter_call',
        ownerEmail: 'owner@example.com',
        internalNote: 'do not leak',
        rawDocumentText: 'do not leak either',
      },
    });

    expect(attribution.privacySafeProfileId).toMatch(/^mrxpid_[a-f0-9]{32}$/);
    expect(attribution.sourcePath).toBe('/blog/');
    expect(params.mrx_privacy_id).toBe(attribution.privacySafeProfileId);
    expect(params.utm_source).toBe('google');
    expect(params.utm_medium).toBe('cpc');
    expect(params.utm_campaign).toBe('offer_review');
    expect(JSON.stringify(params)).not.toContain(profileId);
    expect(JSON.stringify(params)).not.toMatch(/jane-doe|5551234567|owner@example|internalNote|rawDocumentText|do not leak/i);
    vi.unstubAllEnvs();
  });

  it('rejects private paths, arbitrary public paths, and unregistered UTM values', async () => {
    expect(publicSourcePath('https://mineralrightsxchange.com/account/?owner=jane')).toBe(
      'unavailable',
    );
    expect(publicSourcePath('https://mineralrightsxchange.com/book/?owner=jane')).toBe('/book/');
    expect(publicSourcePath('https://mineralrightsxchange.com/custom/jane-doe-token')).toBe(
      'unavailable',
    );
    const attribution = await buildPrivacySafeAttributionContext({
      profileId: '11111111-1111-4111-8111-111111111111',
      receipts: [
        {
          purpose: 'analytics',
          granted: true,
          source_url: 'https://mineralrightsxchange.com/custom/jane-doe-token',
          utm: { utm_source: '5551234567', utm_medium: 'jane-doe', utm_campaign: 'personal-case' },
          created_at: '2026-09-08T20:00:00.000Z',
        },
      ],
    });
    expect(attribution.attributionLabel).toBe('unavailable');
    expect(attribution.utmSource).toBe('unavailable');
    expect(attribution.utmMedium).toBe('unavailable');
    expect(attribution.utmCampaign).toBe('unavailable');
  });

  it('requires explicit analytics-purpose consent and lets latest revocation win', async () => {
    const noAnalyticsConsent = await buildPrivacySafeAttributionContext({
      profileId: '11111111-1111-4111-8111-111111111111',
      receipts: [
        {
          channel: 'account',
          purpose: 'communication',
          granted: true,
          source_url: 'https://mineralrightsxchange.com/book/',
          utm: { utm_source: 'google' },
          created_at: '2026-09-08T20:00:00.000Z',
        },
      ],
    });
    expect(noAnalyticsConsent.analyticsConsent).toBe('unavailable');
    expect(noAnalyticsConsent.attributionLabel).toBe('unavailable');

    const revoked = await buildPrivacySafeAttributionContext({
      profileId: '11111111-1111-4111-8111-111111111111',
      receipts: [
        { purpose: 'analytics', granted: true, created_at: '2026-09-08T20:00:00.000Z' },
        { purpose: 'analytics', granted: false, created_at: '2026-09-08T21:00:00.000Z' },
      ],
    });
    expect(revoked.analyticsConsent).toBe('withdrawn');
    expect(revoked.attributionLabel).toBe('unavailable');
  });

  it('generates stable dedup keys only from required action IDs', async () => {
    const base = {
      profileId: '11111111-1111-4111-8111-111111111111',
      event: 'case_human_review_completed' as const,
      actionId: 'staff-action-1',
    };
    await expect(buildOutcomeDedupKey(base)).resolves.toBe(await buildOutcomeDedupKey(base));
    await expect(buildOutcomeDedupKey({ ...base, actionId: 'staff-action-2' })).resolves.not.toBe(
      await buildOutcomeDedupKey(base),
    );
  });

  it('drops internal notes, document contents, and PII-looking params before transport', () => {
    expect(
      privacySafeAnalyticsParams({
        source_path: '/book/',
        referrer: 'https://example.com/?owner=jane',
        query: 'owner=jane&phone=5555555555',
        actor_user_id: 'staff-user',
        phone: '555-555-5555',
        body: 'conversation body',
        storage_path: 'private/file.pdf',
        outcome_evidence_label: 'actual',
      }),
    ).toEqual({
      source_path: '/book/',
      outcome_evidence_label: 'actual',
    });
  });

  it('records outcomes only through staff-authorized explicit actions and a DB replay guard', () => {
    expect(outcomeRouteSource).toContain('requireStaff(context)');
    expect(outcomeRouteSource).toContain('requireStaffCaseAccess(staff, profileId)');
    expect(outcomeRouteSource).toContain("action: z.literal('complete_human_review')");
    expect(outcomeRouteSource).toContain('actionId: ActionId');
    expect(outcomeRouteSource).toContain("evidenceLabel: z.literal('actual')");
    expect(outcomeRouteSource).toContain(".eq('metadata->>dedupKey', args.dedupKey)");
    expect(outcomeRouteSource).toContain(".insert({");
    expect(outcomeRouteSource).toContain("insertResult.error.code === '23505'");
    expect(outcomeRouteSource).toContain("analyticsStatus: 'suppressed_consent'");
    expect(outcomeRouteSource).toContain("analyticsStatus: 'failed'");
    expect(outcomeRouteSource).toContain('reconciliationRequired');
    expect(outcomeRouteSource).not.toContain('replayAnalyticsIfRetryable');
    expect(outcomeRouteSource).toContain('case_outcome_occurred_at_in_future');
    expect(outcomeRouteSource).toContain(".select('channel,purpose,source_url,utm,created_at,granted')");
    expect(outcomeRouteSource).toContain(".from('owner_facts')");
    expect(outcomeRouteSource).toContain(".in('field', ['decision_goal', 'owner_objective', 'assessment_details'])");
    expect(outcomeRouteSource).toContain("agreementStatus: z.literal('agreed')");
    expect(outcomeRouteSource).toContain('.strict()');
    expect(outcomeRouteSource).toContain('outcomeSequenceError');
    expect(outcomeRouteSource).toContain('export const GET');
    expect(outcomeRouteSource.indexOf('const existing = await findExisting')).toBeLessThan(
      outcomeRouteSource.indexOf('const sequenceError = await outcomeSequenceError'),
    );
    expect(outcomeRouteSource).not.toMatch(/internal_case_notes|internal_case_files|underwriter_brief|packet_snapshot|source_excerpt/);
    expect(ownerCaseStatusApi).toContain(".eq('metadata->>evidenceLabel', 'actual')");
    expect(ownerCaseStatusApi).toContain(".order('metadata->>occurredAt', { ascending: false })");
    expect(dedupMigration).toContain('audit_events_profile_type_dedup_key_idx');
    expect(dedupMigration).toContain("where metadata ? 'dedupKey'");
  });

  it('reports per-owner case flags instead of counting repeated actions as multiple cases', () => {
    const report = outcomeReport([
      {
        event_type: 'staff_owner_relevant_case_completed',
        metadata: {
          dedupKey: 'case-1',
          event: 'relevant_case_completed',
          evidenceLabel: 'actual',
          attributionLabel: 'actual',
          sourcePath: '/book/',
        },
      },
      {
        event_type: 'staff_owner_case_review_completed',
        metadata: {
          dedupKey: 'review-1',
          event: 'case_human_review_completed',
          evidenceLabel: 'actual',
          attributionLabel: 'actual',
          sourcePath: '/book/',
        },
      },
      {
        event_type: 'staff_owner_case_agreed_next_step',
        metadata: {
          dedupKey: 'next-step-1',
          event: 'case_agreed_next_step',
          evidenceLabel: 'actual',
          attributionLabel: 'actual',
          sourcePath: '/book/',
        },
      },
      {
        event_type: 'staff_owner_case_agreed_next_step',
        metadata: {
          dedupKey: 'next-step-2',
          event: 'case_agreed_next_step',
          evidenceLabel: 'actual',
          attributionLabel: 'actual',
          sourcePath: '/book/',
        },
      },
    ]);

    expect(report.relevantCompletedCase).toBe(1);
    expect(report.completedHumanReview).toBe(1);
    expect(report.agreedNextStepCase).toBe(1);
    expect(report.conversionRate).toBe(1);
    expect(report.byVerifiedSource['/book/']).toEqual({
      completedHumanReview: 1,
      agreedNextStepCase: 1,
    });
  });

  it('marks empty history, denominator-zero, and unknown source coverage truthfully', () => {
    expect(outcomeReport([])).toMatchObject({
      observationCoverage: 'unavailable',
      relevantCompletedCase: 'unavailable',
      completedHumanReview: 'unavailable',
      agreedNextStepCase: 'unavailable',
      conversionRate: 'unavailable',
      byVerifiedSource: {},
    });

    const report = outcomeReport([
      {
        event_type: 'staff_owner_relevant_case_completed',
        metadata: {
          dedupKey: 'case-1',
          event: 'relevant_case_completed',
          evidenceLabel: 'actual',
          attributionLabel: 'unavailable',
          sourcePath: 'unavailable',
        },
      },
    ]);
    expect(report).toMatchObject({
      observationCoverage: 'instrumented',
      relevantCompletedCase: 1,
      completedHumanReview: 0,
      agreedNextStepCase: 0,
      conversionRate: 'unavailable',
      byVerifiedSource: {},
    });
  });
});
