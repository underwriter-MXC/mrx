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
export const DISCLAIMER_TEXT = `Mineral Rights Xchange ("MRX") provides nationwide educational information and directional underwriter assessments based on available public records, production data, owner-provided documents, and published assumptions. They are not certified appraisals, USPAP appraisals, legal opinions, tax opinions, accounting advice, or guarantees of market value, sale price, title, or future production. Ownership, acreage, royalty, title, tax, and production assumptions should be verified with qualified professionals in the state where the interests are located before completing a transaction. MRX guidance is available at no cost and with no obligation to sell; MRX may be a buyer in transactions that result from a review, and that relationship will be disclosed in writing before any agreement is signed.`;

export const DISCLAIMER_SHORT = `MRX guidance is nationwide educational information and directional assessment, not certified appraisals, legal opinions, or tax opinions. Verify ownership, royalty, title, tax, and production assumptions with qualified professionals in the applicable state. MRX may be a buyer in a resulting transaction; that relationship will be disclosed in writing.`;
