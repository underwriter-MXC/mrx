# Handoff and Blockers — Sprint 0 Digital PR Lane

**Task:** `t_260bdc86`
**Owner:** `mrx_cmo`
**Generated:** 2026-07-20
**Companion to:** `INDEX.md` and every artifact in this folder.

## Definition of done — checklist

| Criterion                                                               | Status                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Outreach list, pitch templates, journalist query map saved to workspace | ✅ `03-outreach-list.md`, `04-journalist-query-map.md`, `05-pitch-templates.md`      |
| NAP consistency report saved to workspace                               | ✅ `01-nap-consistency-report.md`                                                    |
| GBP/social/video draft copy saved to workspace                          | ✅ `06-gbp-post-copy.md`, `07-social-post-copy.md`, `08-short-form-video-scripts.md` |
| Citation gap inventory                                                  | ✅ `02-citation-gap-inventory.md`                                                    |
| Human-only gates explicitly listed                                      | ✅ This file                                                                         |
| Handoff comment naming next owner                                       | ✅ Posted via `kanban_comment` on `t_260bdc86`                                       |

## Human-only gates surfaced

The following actions are out of scope for any lane owner and must be performed by Daryl or his explicitly designated human operator. Every item below is also captured in `MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` (universal gates G-01 through G-08) and in `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` (five blocked facts).

### G-01 — Publishing / posting / mutating any third-party profile

- Send any outreach email, DM, or pitch to a real recipient.
- Post on GBP, Google Business Profile, X, LinkedIn, Facebook, Instagram, YouTube, TikTok, Reddit, Quora, or any forum.
- Edit a GBP description, hours, photos, services, or Q&A.
- Create or modify any social profile handle currently listed in JSON-LD `sameAs`.
- Edit a Wikidata entry, a Brand Vault record, a Knowledge Graph record.
- Submit or remove sitemaps in Google Search Console.

### G-02 — Spend / paid placement

- Purchase HARO/Connectively subscription (or any other journalist-query subscription).
- Pay for any directory submission, sponsored post, niche edit, or "featured listing."
- Pay for any social boost, ad, or sponsored placement.
- Pay any creator for sponsorship without disclosure.
- Pay any third-party to acquire a backlink on MRX's behalf.

### G-03 — Secrets and credentials

- Place any API key, OAuth token, GBP verification code, or service-account JSON into a chat, plan, board card, or commit.
- Rotate env values for any production secret.

### G-04 — Live outbound communication

- Any of the sends/posts listed under G-01.
- A single GBP post, a single Reddit comment, a single Quora answer.
- A "Q&A seed" on a MRX-controlled GBP.

### G-05 — Human-in-the-loop proof-of-presence

- Postcard / phone / video verification for GBP.
- MFA challenge, SSO assertion, first-party sign-in to any third-party platform.

### G-06 — CRM pipeline mutation

- Enroll or remove any contact in the Prospects, Appointments, or Sellers pipelines.

### G-07 — Regulated copy

- Finalize the GBP description, hours, or services text.
- Finalize the social bio for any platform.
- Approve any testimonial, customer count, or "trusted by" claim.

### G-08 — Backlink / citation / paid placement

- Submit to any directory not listed in `02-citation-gap-inventory.md`.
- Accept any inbound offer to "feature MRX" on a third-party site.
- Engage any affiliate network, link-exchange, or PBN-adjacent property.

## Blocked facts for Daryl (cannot be invented)

These five items remain gating for the entire lane. Re-stated from `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` §"Blocked facts" so they are visible in this lane folder:

1. **Operating-footprint mode.** Storefront vs. service-area business. Affects GBP category, hours display, and `LocalBusiness` JSON-LD activation.
2. **Single canonical phone.** Consolidate or replace `+1 (432) 400-6198`. Until then, `SITE.phone = ''`.
3. **GBP service-area definition.** Match to the 10 deep-dive states (TX, NM, OK, ND, CO, WY, PA, WV, OH, LA) or tighten/widen.
4. **Hours model.** "By appointment," Mon-Fri, or hidden — affects GBP and any LocalBusiness node.
5. **Existing GBP claim state.** Has anyone claimed "Mineral Rights Xchange" or "MRX" yet? If yes, ownership verification is required before any agent action.

Additional blocked facts surfaced by this lane:

6. **Channel ownership verification.** Every social profile currently referenced in any draft must be confirmed as MRX-owned by Daryl. Unverified handles are not cited.
7. **Spokesperson designation.** MRX editorial team is the default. Daryl may designate a specific human spokesperson; that designation must be recorded before any pitch is sent.
8. **Asset license verification.** Any B-roll, music, or graphic used in the video scripts must be confirmed CC0 / public-domain / MRX-owned by Daryl before production.

## Recommended next owner (per artifact family)

| Artifact family                                        | Recommended next owner                                       | Why                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| NAP consistency report                                 | `mrx_seo_audit` (live-verification lane)                     | Live-verification crawl confirms which external citations actually exist and flags drift                |
| Citation gap inventory                                 | `mrx_seo_audit` (crawl coverage lane)                        | Crawl coverage confirms which directories are reachable for MRX and which are blocked by robots/CAPTCHA |
| Outreach list + journalist query map + pitch templates | `mrx_seo_pr` (after Daryl approves cadence and spokesperson) | Lane-owner match for compliant outreach                                                                 |
| GBP post copy + Q&A seeds                              | `mrx_ghl_local` (after Daryl claims and verifies GBP)        | Lane-owner match for GBP publishing                                                                     |
| Social post copy + video scripts                       | `mrx_ghl_local` (after Daryl confirms every social handle)   | Lane-owner match for social publishing                                                                  |

## Activation sequence (Daryl-approved order)

1. Daryl resolves the 5+3 blocked facts (items 1-8 above).
2. Daryl claims GBP. `mrx_ghl_local` posts the first GBP post from `06-gbp-post-copy.md`.
3. Daryl confirms every social handle. `mrx_ghl_local` posts the first X / LinkedIn / Facebook / Instagram entries from `07-social-post-copy.md`.
4. Daryl approves the pitch cadence. `mrx_seo_pr` sends the first wave of pitches from `03-outreach-list.md` + `05-pitch-templates.md`.
5. `mrx_seo_audit` runs the live-verification crawl against the public web and surfaces citation drift, missing directories, and unindexed pages.
6. `mrx_seo_content` confirms the editorial links in the post copy point to live, canonical URLs and that each URL passes structured-data validation.

## Compliance posture

Every artifact in this folder was reviewed against:

- `compliance/five-hard-rules.json` (5 hard rules)
- `compliance/disallowed.json` (43 disallowed phrases; lexicon clean)
- `compliance/named-competitors.json` (empty by design; no competitors named)
- `MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` §3.6 (this lane's allowed/prohibited actions) + §2 (universal gates)

No artifacts in this folder violate any rule. Every CTA points to a canonical MRX URL. Every deferral to a licensed professional (attorney, CPA, reservoir engineer) is explicit. No live send, no live post, no live profile creation, no paid placement, no profile mutation was attempted.

## Verification performed

- Read policy memo, GBP activation packet, rollout status, sitemap architecture, structured-data source, the inherited-rights and offer-review blog posts, and the compliance lexicon.
- No live curl, no API call, no scraping performed. The external citation surface is documented as observed, not asserted.
- All eight artifacts use only the canonical NAP table (no phone, no address, no hours invented).
- All post bodies fit within the platform's character limits.
- All video scripts are ≤60 seconds and end with a single canonical URL.
- All pitch templates are reviewed against compliance rules and the universal gates.
- No live action attempted on any third-party platform.
