/**
 * The §7 standard disclaimer. This module re-exports from the canonical
 * source at `compliance/disclaimer.ts`. The build-time grep allowlists
 * both files so the phrase "not certified appraisals" does not trip
 * the §4 disallowed phrase check.
 *
 * Per Architecture Plan §2 (the Disclaimer molecule imports from here)
 * and `Compliance Aware Implementation Rules.md` §2.
 */
export { DISCLAIMER_TEXT, DISCLAIMER_SHORT } from '../../compliance/disclaimer';
