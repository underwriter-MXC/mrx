# Citation Gap Inventory — Sprint 0 Digital PR Lane

**Task:** `t_260bdc86`
**Owner:** `mrx_cmo`
**Generated:** 2026-07-20
**Anchor:** `01-nap-consistency-report.md`
**Scope:** High-value directories, aggregators, and authority sources where MRX should have a controlled, claim-and-verify citation. **No live submission, no profile creation, no paid placement — all of those are human-only gates (G-01, G-04, G-08).**

## Reading guide

- **Authority score** is editorial judgment based on domain trust, crawl authority, and influence over answer-engine citations. This is not a backlink metric.
- **Relevance score** is editorial judgment based on how often the platform is cited for owner-intent queries ("sell mineral rights," "royalty checks," "inherited mineral rights," etc.).
- **Activation gate** is the human-only step required before MRX should appear on the surface.
- **Priority** = `(Authority × Relevance) − Activation friction`.

## Tier 1 — Required (universal authority graph)

These define the minimum entity graph for any US business. MRX must control these, even if only to suppress duplicate / fraudulent claims.

| Platform                | Type                                      | Authority | Relevance | Activation gate                                       | Priority |
| ----------------------- | ----------------------------------------- | --------- | --------- | ----------------------------------------------------- | -------- |
| Google Business Profile | Local + answer-engine citation            | 10        | 10        | Daryl claim + verification (postcard / phone / video) | Critical |
| Bing Places             | Local + answer-engine citation            | 7         | 7         | Daryl claim via Microsoft account                     | High     |
| Apple Business Connect  | Maps + Siri citation                      | 7         | 6         | Daryl claim via Apple ID                              | High     |
| Facebook Business Page  | Social profile, "social sameAs" signal    | 8         | 6         | Confirm or create as Daryl                            | High     |
| LinkedIn Company Page   | B2B + entity sameAs                       | 8         | 5         | Confirm or create as Daryl                            | Medium   |
| X (Twitter) Profile     | Social sameAs                             | 6         | 4         | Confirm or create as Daryl                            | Medium   |
| Instagram Profile       | Social sameAs                             | 5         | 4         | Confirm or create as Daryl                            | Medium   |
| YouTube Channel         | Video sameAs + entity                     | 8         | 5         | Confirm or create as Daryl                            | Medium   |
| TikTok Account          | Video + discovery                         | 4         | 4         | Confirm or create as Daryl                            | Low      |
| Wikidata entry          | KG seed                                   | 9         | 6         | Human edit only (live-verification lane + Daryl)      | Medium   |
| Crunchbase              | Entity / company graph                    | 7         | 4         | Manual submit                                         | Low      |
| Better Business Bureau  | Trust surface (no paid accreditation yet) | 7         | 4         | Daryl decides whether to claim                        | Low      |

## Tier 2 — Vertical / topical authority

These are where owner-intent queries actually surface in 2026. Many of these are HARO/Sourcebottle-style publisher networks, not directories — see `04-journalist-query-map.md` for the journalist side.

| Platform                                                                        | Type                            | Authority | Relevance | Activation gate                                              | Priority            |
| ------------------------------------------------------------------------------- | ------------------------------- | --------- | --------- | ------------------------------------------------------------ | ------------------- |
| HARO (Connectively)                                                             | Journalist query network        | 7         | 9         | Daryl subscription (paid); daily triage                      | High                |
| Sourcebottle                                                                    | Journalist query (alt)          | 5         | 7         | Daryl subscription (free tier available)                     | Medium              |
| Qwoted                                                                          | Journalist query                | 5         | 7         | Daryl subscription (free tier available)                     | Medium              |
| Reddit r/mineralrights, r/oilandgas, r/PersonalFinance, r/InheritanceTax, r/Tax | Forum citation (LLM crawled)    | 6         | 7         | Human participation only (no sock-puppet, no self-promotion) | Medium              |
| Quora Spaces (mineral rights / royalties / probate)                             | LLM-cited Q&A                   | 6         | 7         | Human answers, no promotional copy                           | Medium              |
| BiggerPockets forum                                                             | Owner community                 | 5         | 6         | Human participation, no spam                                 | Medium              |
| Oil & Gas Law Brief / Mineral Law sections                                      | Legal commentary (comment-only) | 7         | 5         | Editorial submission by a licensed attorney; not MRX         | Low (informational) |

## Tier 3 — Local / regional citation

These matter once a GBP is live and the public-facing service area is finalized.

| Platform                                                                | Activation gate                                                                                                         | Priority       |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------- |
| State bar referral directories (TX, NM, OK, ND, CO, WY, PA, WV, OH, LA) | Daryl only — these are attorney referral tools; MRX does not list itself here because MRX does not provide legal advice | Skip           |
| Texas General Land Office mineral-rights public records                 | No listing required; ensure MRX blog cross-references the public Q&A portal                                             | Reference only |
| Texas Railroad Commission public records                                | Public data; not a citation surface                                                                                     | Reference only |
| County appraisal district public records                                | Public data; not a citation surface                                                                                     | Reference only |
| Chamber of commerce directories (city/state)                            | Daryl decides per market; not necessary for nationwide educational brand                                                | Low            |
| NextDoor / local Facebook groups                                        | Human participation only; no paid placements                                                                            | Low            |

## Tier 4 — Industry-specific directories (handle with care)

These are the ones most likely to look attractive and most likely to be link-schemes.

| Platform                                    | Type                               | Risk                           | Recommendation                                              |
| ------------------------------------------- | ---------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| "Mineral rights buyers directory" sites     | Paid placement, often PBN-adjacent | High (G-08)                    | Do not submit. Daryl reviews any inbound solicitation.      |
| Royalty / mineral rights trade publications | Niche editorial                    | Medium                         | Editorial commentary only via `mrx_seo_pr`; no paid listing |
| Energy / oil & gas trade journals           | Editorial                          | Medium                         | Same as above                                               |
| Investor / passive-income blog networks     | Affiliate / sponsored              | High (G-08)                    | Do not engage                                               |
| "We buy mineral rights" aggregator listings | Lead-gen intermediaries            | High (G-08, also distorts NAP) | Do not submit; do not allow third-party submission          |

## Tier 5 — AEO / LLM answer surfaces

These are not traditional citations but they are how LLMs build their source-of-truth list. MRX does not "submit" to these — MRX produces content that is genuinely useful to them.

| Surface                                                               | Action                                                                               | Owner              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| `llms.txt` and `llms-full.txt` at `https://mineralrightsxchange.com/` | Already published (Sprint 0 follow-up: verify content is current)                    | `mrx_webdev`       |
| Schema.org JSON-LD on every public page                               | Already live; verify completeness via structured-data tester                         | `mrx_seo_audit`    |
| FAQPage schema where the page actually contains FAQs                  | Verify on `/faq/` and qualifying blog posts                                          | `mrx_seo_audit`    |
| Wikipedia (no MRX self-listing)                                       | Daryl decision only; not warranted for a private company with no notability case yet | Defer              |
| Industry glossaries / wikis (mineral-rights.us, etc.)                 | Editorial, not promotional; track only                                               | `mrx_seo_research` |
| Google AI Overviews / Perplexity citation tracking                    | Ongoing log; not a "submit" surface                                                  | `mrx_seo_research` |

## Tier 6 — Review platforms (hard human-only gate)

Reviews are **never** generated, prompted, gated, or incentivized (compliance rule 5 and policy §4). The review surfaces themselves are still part of the citation graph; MRX monitors but does not solicit or seed.

| Platform               | Action                                       | Owner          |
| ---------------------- | -------------------------------------------- | -------------- |
| Google reviews         | Organic only; never prompted, never gated    | Daryl monitors |
| Trustpilot             | Organic only                                 | Daryl monitors |
| Better Business Bureau | Organic only; Daryl decides on accreditation | Daryl          |
| G2 / Capterra          | N/A — MRX is not SaaS                        | Skip           |
| Yelp                   | Organic only; never solicited                | Daryl monitors |

## Tier 7 — Press / earned media targets

See `03-outreach-list.md` and `04-journalist-query-map.md`. These are **not** citations in the directory sense; they are earned editorial placements through compliant journalist outreach.

| Surface                              | Type             | Activation gate                                   |
| ------------------------------------ | ---------------- | ------------------------------------------------- |
| Oil & gas trade press                | Earned editorial | Compliant pitch (see `05-pitch-templates.md`)     |
| Personal finance media               | Earned editorial | Compliant pitch                                   |
| Inheritance / estate planning media  | Earned editorial | Compliant pitch                                   |
| Local newspapers in deep-dive states | Earned editorial | Compliant pitch (regional reporter relationships) |

## Activation sequence (recommended)

This is the order in which a human (Daryl) should attack Tier 1 once he clears the blocked facts:

1. **GBP claim and verification** (postcard / phone / video). Only after Daryl confirms the five blocked facts.
2. **Bing Places, Apple Business Connect** in parallel. Same NAP, same hours decision.
3. **Social profile ownership verification** for every handle currently referenced in any code path.
4. **HARO/Connectively subscription** so journalist-query monitoring begins.
5. **Local newspaper outreach** in TX/NM/OK/ND/CO/WY/PA/WV/OH/LA using the pitch templates.

## Compliance gates enforced

- All directory submissions must match the canonical NAP table. Any deviation is a citation drift and must be repaired (G-04).
- No paid directory submission (G-08). A "featured listing" that requires payment is a link scheme and is rejected.
- No review prompting or gating (rule 5; policy §4).
- No PBN or affiliate-network participation (G-08).
- Every outreach channel uses the canonical email and the canonical "ask Tommy" / "/book" CTA, never a promotional guarantee.

## Verification performed

- Cross-checked every Tier 1 surface against the canonical NAP table in `01-nap-consistency-report.md`.
- All "activation gate" labels reference the corresponding universal gate (G-01, G-04, G-08) in the policy memo.
- No live submission attempted. No profile attempted. No payment attempted.
