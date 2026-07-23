import type { CollectionEntry } from 'astro:content';

export const MRX1000_CONTENT_PROGRAM = 'mrx1000' as const;
export const MRX1000_PILOT_BATCH = 'pilot-001' as const;

export const MRX1000_CLUSTERS = [
  'sell-mineral-rights-decision-process',
  'valuation-methodology-drivers',
  'offer-review-buyer-comparison-safety',
  'inherited-estate-probate',
  'royalties-owner-operations',
  'tax-1031-legal-education',
  'texas-county-basin-local-intent',
  'title-lease-ownership-documents',
  'mrx-methodology-transparency-underwriter-process',
] as const;

export type Mrx1000Cluster = (typeof MRX1000_CLUSTERS)[number];
export type Mrx1000PilotPost = CollectionEntry<'posts'>;

export const MRX1000_PILOT_PREFIX = '/staged/mrx1000/pilot-001';

export function isMrx1000PilotPost(post: Mrx1000PilotPost): boolean {
  return (
    post.data.content_program === MRX1000_CONTENT_PROGRAM &&
    post.data.content_batch === MRX1000_PILOT_BATCH &&
    post.data.noindex === true
  );
}

export function pilotStagePath(slug: string): string {
  return `${MRX1000_PILOT_PREFIX}/${slug}/`;
}
