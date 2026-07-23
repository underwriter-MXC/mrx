# Sprint 0 — Compliant Indexing / Authority / Digital PR / GBP / Local / Social (Draft Only)

**Task:** `t_260bdc86`
**Lane owner:** `mrx_cmo`
**Policy memo:** [`docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`](../MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md) — lane §3.6
**Date:** 2026-07-20
**Posture:** Draft only. No live sends. No profile creation. No paid placements. No GBP posts. Every artifact here is reference material for the human-only gate.

## Scope (lane §3.6, allowed)

- Outreach list, journalist query map, pitch templates (workspace only, no sends)
- Citation gap inventory + NAP consistency check across already-known directories
- GBP post copy, social post copy, short-form video scripts as drafts

## Scope (lane §3.6, prohibited — human-only gates)

- Sending outreach/pitch/email/DM/social reply to any real recipient (universal gate G-04)
- Posting to GBP, X, LinkedIn, Facebook, Instagram, YouTube, TikTok, Reddit, Quora, any forum
- Buying or brokering backlinks, sponsored posts, niche edits, directory submissions (universal gate G-08)
- Creating or modifying business profiles on any platform
- GBP verification, reinstatement, or ownership-transfer actions

## Files in this folder

| #   | File                             | Purpose                                                                                            |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| 01  | `01-nap-consistency-report.md`   | Anchor record + NAP table for all known citation surfaces; flagged gaps and risks                  |
| 02  | `02-citation-gap-inventory.md`   | High-value directories/aggregators MRX is missing from, ranked by authority × relevance            |
| 03  | `03-outreach-list.md`            | Tier-1 journalist/editor/aggregator contact list (outlets, beats, mastheads, no live sends)        |
| 04  | `04-journalist-query-map.md`     | Map of HARO/Connectively/Sourcebottle/QR-style query categories that match MRX's editorial surface |
| 05  | `05-pitch-templates.md`          | Five compliant pitch templates keyed to the journalist query categories                            |
| 06  | `06-gbp-post-copy.md`            | Eight GBP post drafts (4-week rotation) + Q&A seed drafts                                          |
| 07  | `07-social-post-copy.md`         | Channel-specific copy for X, LinkedIn, Facebook, Instagram, Reddit                                 |
| 08  | `08-short-form-video-scripts.md` | TikTok/Reels/Shorts scripts, vertical format, ≤60s each                                            |
| 09  | `09-handoff-and-blockers.md`     | Human-only gate manifest, blockers for Daryl, recommended next owner                               |

## Canonical NAP anchor (single source of truth)

Pulled from `src/lib/site.ts` and `src/structured-data/site.ts` and re-confirmed in `docs/MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md`:

| Field                  | Value                                                                                                                                                                        | Notes                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Brand (legal)          | Mineral Rights Xchange                                                                                                                                                       | `SITE.name`                                                                    |
| Brand (short)          | MRX                                                                                                                                                                          | `SITE.shortName`                                                               |
| Tagline                | Straight answers for mineral owners nationwide                                                                                                                               | `SITE.tagline`                                                                 |
| URL (canonical)        | `https://mineralrightsxchange.com`                                                                                                                                           | `SITE.url`, www→root 308                                                       |
| Locale                 | en-US                                                                                                                                                                        | `SITE.locale`                                                                  |
| Email (public contact) | `underwriter@mineralrightsxchange.com`                                                                                                                                       | `SITE.email`, also JSON-LD `ContactPoint.email`                                |
| Phone (public)         | **Not published site-wide.** Reserved `SITE.phone=''` and `PUBLIC_MRX_PHONE_TEL` empty. Single occurrence `+1 (432) 400-6198` in one blog post is the only published number. | **Decision pending from Daryl.**                                               |
| Street address         | **Not published.**                                                                                                                                                           | SAB model implied by public copy.                                              |
| Service area           | United States (nationwide educational guidance)                                                                                                                              | `about.mdx` line 25; deeper content for TX, NM, OK, ND, CO, WY, PA, WV, OH, LA |
| Hours                  | Not published (async chat + scheduled phone)                                                                                                                                 | Pending Daryl decision for GBP                                                 |
| Founded                | 2026                                                                                                                                                                         | `SITE.foundedYear`; do not embellish                                           |
| SameAs social          | Facebook, X, Instagram, LinkedIn                                                                                                                                             | Listed in Organization JSON-LD `sameAs` array                                  |

Any draft in this folder that conflicts with this table is a drafting error, not an authoritative update. The table is fixed until Daryl confirms items 1-5 in `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` §"Blocked facts for Daryl."

## Compliance gates enforced during drafting

- No fabricated statistics, customer counts, "trusted by," or year-in-business claims (rule 5).
- No guaranteed value, no "we will beat any offer," no "highest price," no "best mineral" superlatives (rules 1, 4).
- No "certified appraisal," "USPAP," "formal appraisal" or any Texas-regulated term (rule 2).
- No individualized legal or tax advice, no "we advise," "we recommend" (rule 3).
- No naming a specific competitor, no attacks, no comparative claims about another business (rule 6 + `compliance/named-competitors.json` which is currently empty by design).
- No phone numbers, addresses, or hours invented; everything in the draft copy cites the canonical NAP table.
- No live CTA on social that would constitute an advertisement or guarantee; CTAs point to the GHL calendar already configured for `/book/`.

## Verification performed

- Read policy memo, GBP activation packet, rollout status, sitemap architecture, and structured-data source.
- Inspected compliance lexicon and competitor blocklist (both empty by design; no need to scrub drafts).
- All drafts defer to canonical NAP and to the unpublished-phone / unpublished-address stance.
- No scripts run; no live curl; no API calls; no external scraping. Everything in this folder is internal drafting output.

## Next owner (recommended)

After Daryl signs off at the gates below, the natural handoff path is:

1. **Daryl (human gate)** reviews `09-handoff-and-blockers.md` and confirms the 5 blocked facts (NAP-1 through NAP-5).
2. **`mrx_ghl_local`** takes the GBP post drafts and the Q&A seeds, attaches them to the live GBP once Daryl claims and verifies the listing.
3. **`mrx_seo_pr`** executes the pitch queue using `03-outreach-list.md` + `05-pitch-templates.md` after Daryl approves the sending cadence and signed disclosures.
4. **`mrx_seo_audit`** runs the `02-citation-gap-inventory.md` recommendations through the live-verification lane before any directory submission is queued.
