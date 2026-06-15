/**
 * MRX §7 Standard Public Disclaimer.
 *
 * SINGLE SOURCE OF TRUTH for the disclaimer text. This file is imported
 * by both `src/lib/disclaimer.ts` (which the Disclaimer.astro molecule
 * consumes) and by the unit test suite (tests/unit/disclaimer.spec.ts).
 *
 * The wording is drawn verbatim from project-pack/04-compliance/MRX
 * Compliance Review.md §7. Per the review, the last sentence ("MRX may
 * be a buyer...") is a material addition and MUST NOT be removed.
 *
 * The build-time grep check (compliance/scripts/check-compliance.mjs)
 * allowlists this file so the phrase "not certified appraisals" does
 * not trip the §4 disallowed phrase check.
 */
export const DISCLAIMER_TEXT = `Mineral Rights Xchange ("MRX") reviews are directional underwriter assessments based on available records, production data, owner-provided documents, and published valuation assumptions. They are not certified appraisals, USPAP appraisals, legal opinions, tax opinions, accounting advice, or guarantees of market value, sale price, or future production. All ownership, acreage, royalty, title, tax, and production assumptions should be verified by the owner with qualified professionals (e.g., a Texas-licensed attorney and CPA) before completing any transaction. Free underwriter reviews are provided at no cost and with no obligation to sell; MRX may be a buyer in transactions that result from a review, in which case that relationship will be disclosed in writing before any agreement is signed.`;

export const DISCLAIMER_SHORT = `MRX reviews are directional underwriter assessments, not certified appraisals, legal opinions, or tax opinions. Verify ownership, royalty, tax, and production assumptions with a Texas-licensed attorney and CPA. MRX may be a buyer in transactions that result from a review; that relationship will be disclosed in writing.`;
