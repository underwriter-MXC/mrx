import { describe, expect, it } from 'vitest';
import { OWNER_STARTER_SLUGS, ownerResourcePriority } from '../../src/lib/owner-resource-priority';
describe('owner resource curation', () => {
  it('orders owner decisions before specialist records without removing either', () => {
    const slugs = ['technical-worksheet', OWNER_STARTER_SLUGS[1], OWNER_STARTER_SLUGS[0]];
    const sorted = [...slugs].sort((a, b) => ownerResourcePriority(a) - ownerResourcePriority(b));
    expect(sorted).toEqual([OWNER_STARTER_SLUGS[0], OWNER_STARTER_SLUGS[1], 'technical-worksheet']);
    expect(ownerResourcePriority(OWNER_STARTER_SLUGS[0] + '.mdx')).toBe(0);
    expect(new Set(OWNER_STARTER_SLUGS).size).toBe(OWNER_STARTER_SLUGS.length);
  });
});
