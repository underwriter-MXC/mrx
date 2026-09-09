/** Editorial navigation order only. Publication, article identity and URLs stay authoritative. */
export const OWNER_STARTER_SLUGS = [
  'how-to-know-if-your-mineral-rights-offer-is-fair',
  'how-are-mineral-rights-valued',
  'how-the-step-by-step-process-of-selling-texas-mineral-rights-works',
  'what-to-do-when-you-have-competing-offers-on-your-mineral-rights-a-guide',
  'what-documents-do-you-need-to-sell-mineral-rights-in-texas',
  'understand-the-value-of-your-inherited-mineral-rights',
] as const;

export function ownerResourcePriority(slug: string): number {
  const index = (OWNER_STARTER_SLUGS as readonly string[]).indexOf(slug.replace(/\.mdx?$/, ''));
  return index < 0 ? OWNER_STARTER_SLUGS.length : index;
}
