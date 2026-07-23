import { describe, expect, it } from 'vitest';
import { inferUnderwritingSituations } from '../../src/lib/platform/underwriting-packet';

const repoFile = async (path: string) =>
  (await import('node:fs/promises')).readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('situation-aware underwriting intake', () => {
  it('reads a validated situation code saved with owner intake facts', async () => {
    const intakeApi = await repoFile('src/pages/api/account/mineral-interest.ts');
    const accountHub = await repoFile('src/components/react/AccountHub.tsx');

    expect(intakeApi).toContain('situationCode: z.enum(UNDERWRITING_SITUATIONS)');
    expect(intakeApi).toContain('situationCodes: parsed.data.situationCode');
    expect(accountHub).toContain("get('situation')");
    expect(accountHub).toContain('situationCode: accountSituationCode');
  });

  it('maps saved owner situation slugs to underwriting requirement situations', () => {
    expect(
      inferUnderwritingSituations({
        interests: [],
        ownerFacts: [
          { value: { situationCodes: ['estate-heir'] } },
          { value: { situationCodes: ['suspense-funds'] } },
          { value: { situationCodes: ['1031-exchange'] } },
          { value: { situationCodes: ['suspicious-seller'] } },
        ],
      }),
    ).toEqual([
      'inherited_or_probate',
      'offer_review',
      'tax_sensitive_1031',
    ]);
  });
});
