# NAP Consistency Report — Sprint 0 Digital PR Lane

**Task:** `t_260bdc86`
**Owner:** `mrx_cmo`
**Generated:** 2026-07-20
**Canonical NAP source:** `src/lib/site.ts`, `src/structured-data/site.ts`, `docs/MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md`

## Executive summary

Mineral Rights Xchange currently publishes a **partial NAP graph**. The canonical email is live site-wide; the canonical phone, street address, hours, and service-area list are intentionally not published. Any third-party citation that does not match the canonical values below is a citation gap to repair (human-only gate G-01/G-04) or a profile that should not have been created in the first place.

NAP consistency today is therefore measured **against the published values**, not against an aspirational GBP record. The "blocked facts" listed in `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` are the gating inputs for any future NAP expansion.

## 1. Canonical NAP anchor (must match every citation)

| Field                      | Published value                                                     | Source                                                                     |
| -------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Brand                      | Mineral Rights Xchange                                              | `src/lib/site.ts:9`                                                        |
| Short name                 | MRX                                                                 | `src/lib/site.ts:10`                                                       |
| URL (canonical)            | `https://mineralrightsxchange.com`                                  | `src/lib/site.ts:14`                                                       |
| Email (contact)            | `underwriter@mineralrightsxchange.com`                              | `src/lib/site.ts:16`, JSON-LD `ContactPoint.email`                         |
| Phone (public)             | Not published site-wide                                             | `src/lib/site.ts:17` — reserved empty; `PUBLIC_MRX_PHONE_TEL` empty in env |
| Phone (single occurrence)  | `+1 (432) 400-6198`                                                 | One blog post only — see §3                                                |
| Address (street)           | Not published                                                       | `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` §"Blocked facts"               |
| Address (region/country)   | TX / US                                                             | `src/lib/site.ts:18-19`, `ProfessionalService.address`                     |
| Service area (public copy) | Nationwide (deeper content: TX, NM, OK, ND, CO, WY, PA, WV, OH, LA) | `src/content/pages/about.mdx:25`                                           |
| Hours                      | Not published (async chat + scheduled phone)                        | `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` §"Blocked facts"               |
| Locale                     | en-US                                                               | `src/lib/site.ts:15`                                                       |

## 2. Internal NAP check (first-party surface)

| Surface                     | URL             | NAP values present                                          | Status                              |
| --------------------------- | --------------- | ----------------------------------------------------------- | ----------------------------------- |
| Home                        | `/`             | email, name, canonical URL                                  | ✅ Consistent                       |
| About                       | `/about`        | email, name, service-area description, ten deep-dive states | ✅ Consistent                       |
| Team                        | `/team/`        | name, email in footer, canonical URL                        | ✅ Consistent                       |
| Methodology                 | `/methodology`  | email, name, canonical URL                                  | ✅ Consistent                       |
| How It Works                | `/how-it-works` | email, name, canonical URL                                  | ✅ Consistent                       |
| Book                        | `/book`         | email, name, calendar handoff                               | ✅ Consistent                       |
| FAQ                         | `/faq`          | email, name, canonical URL                                  | ✅ Consistent                       |
| Free Guide                  | `/free-guide`   | email, name                                                 | ✅ Consistent                       |
| Blog posts (sample)         | `/blog/...`     | email, canonical URL                                        | ✅ Consistent                       |
| Footer                      | site-wide       | `underwriter@mineralrightsxchange.com`                      | ✅ Consistent                       |
| Organization JSON-LD        | rendered        | email + ContactPoint; telephone omitted                     | ✅ Consistent with no-phone policy  |
| ProfessionalService JSON-LD | rendered        | region/country only; telephone omitted                      | ✅ Consistent                       |
| LocalBusiness JSON-LD       | dormant         | scope-corrected, not emitted                                | ⚠️ Dormant, not in production graph |
| Robots / sitemap / llms.txt | rendered        | canonical domain only                                       | ✅ Consistent                       |

No internal NAP drift detected on the live site.

## 3. Single published phone occurrence

`+1 (432) 400-6198` appears in **one** blog post (`src/content/posts/...`). It does **not** appear in:

- `src/lib/site.ts` (`SITE.phone = ''`)
- `src/structured-data/site.ts` (`ContactPoint.telephone` omitted because `SITE.phone` is empty)
- Header, footer, About, Book, Free Guide, or any pillar page

If a citation captures this number, the citation must either:

- Display the same number verbatim, **or**
- Display no phone (preferred until Daryl consolidates).

The number is currently flagged in `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` §"Blocked facts" as a consolidation decision for Daryl.

## 4. External citation surface (known to this agent)

This agent has no live GBP access, no third-party directory account, and no scraping authority. The following surfaces are the **known published citation graph as observed from the first-party code and from any public reference in repo docs**:

| Surface                                  | Type                       | Observed NAP                                       | Risk                                                        |
| ---------------------------------------- | -------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `mineralrightsxchange.com`               | First-party                | email + region/country                             | ✅ Canonical                                                |
| `www.mineralrightsxchange.com`           | First-party redirect (308) | inherits from canonical                            | ✅ Canonical                                                |
| Facebook (handle in JSON-LD `sameAs`)    | Social profile             | name only (canonical email not displayed publicly) | ⚠️ Handle is in code but not yet confirmed; do not send DMs |
| X / Twitter (handle in JSON-LD `sameAs`) | Social profile             | name only                                          | ⚠️ Same as above                                            |
| Instagram (handle in JSON-LD `sameAs`)   | Social profile             | name only                                          | ⚠️ Same                                                     |
| LinkedIn (handle in JSON-LD `sameAs`)    | Social profile             | name only                                          | ⚠️ Same                                                     |

`src/structured-data/site.ts:17` notes: **"Populate only after mrx_ceo/Daryl confirms first-party ownership of each profile. Do not publish guessed social handles into Knowledge Graph."** Today `sameAs: []` is empty in the rendered graph; the social handles listed in the table above are placeholders until Daryl confirms ownership.

No Facebook / X / Instagram / LinkedIn / YouTube / TikTok / Reddit / Quora / Yelp / BBB / Trustpilot / G2 / Apple Maps / Bing Places / Apple Business Connect / Yellow Pages / Manta / ChamberOfCommerce / Hotfrog / MapQuest / Superpages / Citysearch / Foursquare / Alignable citation has been **verified** by this agent. All such citations must be verified by the live-verification lane before they are listed as "confirmed" in any future artifact.

## 5. NAP drift risks (forward-looking)

| Risk                                                                                                                      | Why it matters                                                                                       | Gate                                        |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A third-party directory or social profile uses a phone that is not `+1 (432) 400-6198`                                    | Breaks NAP; if Daryl later publishes a different canonical phone, every citation needs re-correction | G-01 (profile creation), G-04 (live update) |
| A third-party directory lists an address (street + city) that MRX has not published                                       | Breaks NAP; potential GBP suspension vector                                                          | G-01, G-08 (paid placements)                |
| A directory lists "Mineral Rights Xchange" with a different short-form ("MRX Holdings", "MRW", "Mineral Rights Exchange") | Brand fragmentation; "Exchange" vs "Xchange" is a common trap                                        | G-04 (live update)                          |
| A directory places MRX in a single state (e.g., TX) when the public copy is nationwide                                    | Local SEO contradiction; penalizes out-of-state owners                                               | G-04                                        |
| A citation source describes MRX as "appraisers," "USPAP certified," or a "brokerage"                                      | Triggers Texas appraisal-board and FTC-compliance review (rules 2, 4)                                | G-01, G-04, G-07                            |

## 6. Repair priorities

These are the actions that **must wait for the human-only gate**, but that are listed here so Daryl/Chesty can scope the work:

1. **Confirm or delete the lone phone `+1 (432) 400-6198`.** Decide whether MRX publishes it; if yes, gate `SITE.phone` and `PUBLIC_MRX_PHONE_TEL` behind it; if no, edit the blog post to remove the number. (G-01 + G-03 + G-07.)
2. **Claim or formally abandon any GBP listing** for "Mineral Rights Xchange" or "MRX" in the 10 deep-dive states. (G-01.)
3. **Confirm ownership of every social profile** referenced in any draft. If a profile is unclaimed, do not post; do not list in JSON-LD `sameAs`. (G-01.)
4. **Define a single business description** (≤750 chars) and a single bio per social channel that does not violate rules 1-5. The drafts in `06-gbp-post-copy.md` and `07-social-post-copy.md` are content templates, not the description itself.
5. **Run the live-verification lane** (`mrx_seo_audit`) to crawl the public web for MRX citations and resolve drift before any outreach begins.

## 7. Compliance posture (no exceptions)

- No phone invented. No address invented. No hours invented. No customer count invented. No "trusted by" invented.
- All drafts in this Sprint 0 folder defer to the canonical NAP table.
- Any future change to the canonical NAP table requires updating `src/lib/site.ts`, `src/structured-data/site.ts`, the JSON-LD output, and every citation — which is a G-01 + G-03 + G-07 gate.

## Verification commands run

- `read_file src/lib/site.ts` — canonical NAP confirmed
- `read_file src/structured-data/site.ts` — JSON-LD scope confirmed
- `read_file src/content/pages/about.mdx` — service-area list confirmed
- `read_file docs/MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` — five blocked facts confirmed
- `read_file compliance/five-hard-rules.json` and `compliance/named-competitors.json` — lexicon confirmed (competitor list intentionally empty)
- No live curl, no API call, no scraping performed. The external citation surface is documented as observed, not asserted.
