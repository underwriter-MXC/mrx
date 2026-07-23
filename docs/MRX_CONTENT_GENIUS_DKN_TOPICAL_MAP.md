# MRX Content Genius / DKN Topical Map Draft

Task: `t_1119ba20`  
Policy: `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`  
Status: staged planning artifact only — no publishing, no Search Atlas credit spend, no bulk replacement.

## Operating decision

Use Texas as the first verified pillar, then expand the existing 10-state state-guide surface one page at a time. The repo already contains `src/data/states.ts` and `src/pages/mineral-rights/[state].astro` for Texas, New Mexico, Oklahoma, North Dakota, Colorado, Wyoming, Pennsylvania, West Virginia, Ohio, and Louisiana. The post inventory is Texas-heavy and has many near-duplicate underwriter, valuation, predatory-offer, and 1031 articles with weak or unsafe meta descriptions. Therefore the Content Genius lane should reconcile DKN coverage by consolidating intent around pillars and internal links before producing new long-form articles.

## Texas-first topical map

| Priority | Pillar / guide                       | Primary route                                | DKN role                      | Internal-link target                                                                              |
| -------- | ------------------------------------ | -------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| P0       | Texas mineral rights owner guide     | `/mineral-rights/texas/`                     | State/entity pillar           | Link to sale process, value, offer-review, inheritance, royalty/public-records, and 1031 clusters |
| P0       | Sell mineral rights without pressure | `/sell-mineral-rights/`                      | BOFU transaction pillar       | Link from Texas, offer-review, methodology, FAQ, and sale-process articles                        |
| P0       | Mineral rights value methodology     | `/mineral-rights-value/` and `/methodology/` | BOFU trust/methodology pillar | Link from valuation articles; avoid exact-price promises                                          |
| P0       | Offer review / competing offers      | `/offer-review/`                             | BOFU comparison pillar        | Link from predatory-offer and buyer-comparison articles                                           |
| P1       | Inherited mineral rights             | `/inherited-mineral-rights/`                 | MOFU owner-situation pillar   | Link from probate, estate, royalty-after-inheritance, and state pages                             |
| P1       | 1031 exchanger                       | `/1031-exchanger/`                           | MOFU tax-sensitive pillar     | Link from 1031/tax posts with disclaimer-first language                                           |
| P1       | Learning center                      | `/learning-center/`                          | TOFU content hub              | Link to public-records, royalty, production, glossary-style articles                              |
| P2       | 9 non-Texas state guides             | `/mineral-rights/{state}/`                   | State/entity expansion        | Link only after per-state editorial and source review                                             |

## Per-state page briefs

### Texas — P0 Texas-first pillar

- Planned title: Texas Mineral Rights Owner Guide
- Planned meta description (141 chars): Texas mineral rights owner guide for offers, royalties, records, inheritance, and sale timing with MRX review steps and public-source checks.
- Public source citation: [Railroad Commission of Texas](https://www.rrc.texas.gov/)
- Basin/entity coverage: Permian Basin, Eagle Ford, Haynesville, Barnett
- Brief: Upgrade the existing Texas guide into the canonical pillar. Keep answer-first blocks for selling, value, royalties, probate, surface/mineral split, county records, and offer review. Link every Texas cluster back here and avoid valuation guarantees.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### New Mexico — P1 state guide

- Planned title: New Mexico Mineral Rights Owner Guide
- Planned meta description (136 chars): New Mexico mineral rights guide for Permian and San Juan owners reviewing offers, royalty data, county records, and inherited interests.
- Public source citation: [New Mexico Oil Conservation Division](https://www.emnrd.nm.gov/ocd/)
- Basin/entity coverage: Delaware Basin, San Juan Basin
- Brief: Create a state-specific owner guide focused on connecting county records, OCD data, operator letters, inherited interests, and cross-border Permian context. Do not imply state-specific legal advice.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Oklahoma — P1 state guide

- Planned title: Oklahoma Mineral Rights Owner Guide
- Planned meta description (134 chars): Oklahoma mineral rights guide for owners comparing offers, pooling context, operator records, royalty checks, and inherited interests.
- Public source citation: [Oklahoma Corporation Commission](https://oklahoma.gov/occ.html)
- Basin/entity coverage: SCOOP, STACK, Anadarko Basin
- Brief: Frame Oklahoma around pooling orders, changing operators, division orders, royalty history, and county/title documents. Link to general offer-comparison and underwriter-review pages.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### North Dakota — P1 state guide

- Planned title: North Dakota Mineral Rights Owner Guide
- Planned meta description (130 chars): North Dakota mineral rights guide for Bakken owners comparing offers, production history, spacing, royalty statements, and timing.
- Public source citation: [North Dakota Department of Mineral Resources](https://www.dmr.nd.gov/)
- Basin/entity coverage: Bakken, Three Forks
- Brief: Focus on Bakken/Three Forks production history, spacing, operator activity, royalty statements, and inherited mineral questions. Keep sale/hold language neutral.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Colorado — P2 state guide

- Planned title: Colorado Mineral Rights Owner Guide
- Planned meta description (138 chars): Colorado mineral rights guide for owners reviewing offers, county records, operator activity, royalty data, and local development context.
- Public source citation: [Colorado Energy and Carbon Management Commission](https://ecmc.state.co.us/)
- Basin/entity coverage: DJ Basin, Piceance Basin
- Brief: Address local development rules at a high level, ECMC public records, ownership documents, royalty statements, and operator activity. Avoid legal interpretations.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Wyoming — P2 state guide

- Planned title: Wyoming Mineral Rights Owner Guide
- Planned meta description (131 chars): Wyoming mineral rights guide for owners reviewing offers, production context, federal acreage issues, and county ownership records.
- Public source citation: [Wyoming Oil and Gas Conservation Commission](https://wogcc.wyo.gov/)
- Basin/entity coverage: Powder River Basin, Green River Basin
- Brief: Cover conventional fields, federal acreage context, WOGCC records, county/title documents, and sale-readiness questions.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Pennsylvania — P2 state guide

- Planned title: Pennsylvania Mineral Rights Owner Guide
- Planned meta description (135 chars): Pennsylvania mineral rights guide for Marcellus and Utica owners reviewing royalty checks, deductions, leases, and inherited interests.
- Public source citation: [Pennsylvania Department of Environmental Protection](https://www.pa.gov/agencies/dep.html)
- Basin/entity coverage: Marcellus Shale, Utica Shale
- Brief: Prioritize royalty-statement deductions, lease history, inherited interests, DEP records, and offer comparison. Keep all tax/legal statements as question prompts.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### West Virginia — P2 state guide

- Planned title: West Virginia Mineral Rights Owner Guide
- Planned meta description (139 chars): West Virginia mineral rights guide for owners reviewing offers, long title history, production records, royalties, and inherited interests.
- Public source citation: [West Virginia Office of Oil and Gas](https://dep.wv.gov/oil-and-gas/)
- Basin/entity coverage: Marcellus Shale, Utica Shale
- Brief: Center on long title histories, severed interests, county records, operator data, royalty statements, and inherited mineral questions.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Ohio — P2 state guide

- Planned title: Ohio Mineral Rights Owner Guide
- Planned meta description (131 chars): Ohio mineral rights guide for Utica owners comparing offers, division orders, lease terms, royalty checks, and public well records.
- Public source citation: [Ohio Department of Natural Resources](https://ohiodnr.gov/)
- Basin/entity coverage: Utica Shale, Point Pleasant
- Brief: Cover Utica activity, lease/division-order records, ODNR data, inherited ownership, and offer review next steps.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

### Louisiana — P2 state guide

- Planned title: Louisiana Mineral Rights Owner Guide
- Planned meta description (130 chars): Louisiana mineral rights guide for owners comparing offers, parish records, unit data, royalty statements, and production context.
- Public source citation: [Louisiana Department of Energy and Natural Resources](https://www.dnr.louisiana.gov/)
- Basin/entity coverage: Haynesville Shale, Austin Chalk
- Brief: Use Louisiana/parish terminology, unit and production context, DNR records, title documents, and royalty-check questions. Avoid Louisiana legal advice.
- Required links out: state regulator; `/sell-mineral-rights/`; `/mineral-rights-value/`; `/offer-review/`; `/inherited-mineral-rights/`; `/learning-center/`.
- Required links in: matching cluster articles only after editorial review confirms the state context is real, not templated.

## Pillar and cluster briefs

### How to sell mineral rights without pressure (`sell-process`)

- Pillar route: `/sell-mineral-rights/`
- Intent: BOFU
- Answer-first block: Selling mineral rights starts with organizing ownership, lease, division-order, royalty, and offer documents, then comparing the assumptions behind any written offer before deciding whether to proceed.
- Candidate supporting pages:
  - `/blog/how-to-sell-mineral-rights-in-texas/`
  - `/blog/how-the-step-by-step-process-of-selling-texas-mineral-rights-works/`
  - `/blog/how-long-does-it-take-to-sell-mineral-rights-in-texas/`
  - `/blog/closing-costs-and-fees-when-selling-mineral-rights-in-texas/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

### Mineral rights value and underwriter methodology (`value-methodology`)

- Pillar route: `/mineral-rights-value/`
- Intent: BOFU
- Answer-first block: Mineral rights value is directional until ownership, production history, lease terms, operator context, commodity assumptions, and title questions are reviewed together.
- Candidate supporting pages:
  - `/blog/how-are-mineral-rights-valued/`
  - `/blog/how-texas-mineral-rights-are-valued-producing-vs-non-producing-interests/`
  - `/blog/how-oil-price-fluctuations-affect-texas-mineral-rights-values/`
  - `/methodology/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

### Competing offers and buyer comparison (`competing-offers`)

- Pillar route: `/offer-review/`
- Intent: BOFU
- Answer-first block: A mineral-rights offer should be compared by assumptions, deductions, title contingencies, closing timing, buyer disclosures, and written terms rather than the headline number alone.
- Candidate supporting pages:
  - `/blog/how-to-compare-mineral-rights-buyers-in-texas/`
  - `/blog/what-to-do-when-you-have-competing-offers-on-your-mineral-rights-a-guide/`
  - `/blog/signs-of-a-fair-mineral-rights-offer/`
  - `/blog/texas-mineral-rights-valuation-vs-predatory-offers-what-to-know/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

### Inherited mineral rights and probate questions (`inheritance-probate`)

- Pillar route: `/inherited-mineral-rights/`
- Intent: MOFU
- Answer-first block: Inherited mineral rights usually require gathering probate, deed, division-order, lease, and royalty information before an owner can compare options clearly.
- Candidate supporting pages:
  - `/blog/mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling/`
  - `/blog/what-happens-to-mineral-rights-in-probate/`
  - `/blog/understanding-royalty-checks-after-inheriting-mineral-rights/`
  - `/blog/managing-mineral-interests-in-estate-planning-explained/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

### 1031 and tax-sensitive sale questions (`tax-1031`)

- Pillar route: `/1031-exchanger/`
- Intent: MOFU
- Answer-first block: A 1031 exchange or tax-sensitive sale question should be routed to a qualified tax professional; MRX can help organize transaction facts and questions before that conversation.
- Candidate supporting pages:
  - `/blog/1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work/`
  - `/blog/1031-exchange-for-mineral-rights-in-texas-explained/`
  - `/blog/capital-gains-tax-on-mineral-rights-sales-in-texas-what-sellers-need-to-know/`
  - `/blog/how-to-report-a-mineral-rights-sale-on-your-federal-tax-return/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

### Royalty checks, production data, and public records (`royalty-production`)

- Pillar route: `/learning-center/`
- Intent: TOFU
- Answer-first block: Royalty checks and public production records help explain current activity, but they do not settle title, lease interpretation, future drilling, or transaction value by themselves.
- Candidate supporting pages:
  - `/blog/how-to-interpret-your-mineral-rights-royalty-checks/`
  - `/blog/how-royalty-payments-work-for-texas-mineral-rights-owners/`
  - `/blog/texas-railroad-commission-how-to-use-public-records-to-understand-your-mineral-rights/`
  - `/blog/texas-oil-and-gas-production-by-county-what-mineral-rights-owners-should-know/`
- Rewrite rule: point supporting articles to the pillar in the first third of the article, then include one contextual sibling link and one conversion-safe CTA. Do not use 'best', 'guaranteed', 'maximize', or exact-value claims.

## FAQ / AEO answer blocks to add after review

### What documents should I gather before asking MRX to review a mineral-rights offer?

Gather the written offer, recent royalty statements, lease or division order if available, county/legal description, operator letters, and any inheritance or probate documents. If something is missing, note what is missing rather than guessing.

### Can MRX tell me exactly what my mineral rights are worth?

No. MRX can prepare a directional underwriter review based on documents and assumptions, but it is not a certified appraisal, legal opinion, tax opinion, or guarantee of a transaction price.

### Which state pages should be published first?

Publish Texas first, then New Mexico, Oklahoma, and North Dakota, because the existing site and current content inventory are Texas-heavy and the next clusters should extend from the strongest verified pillar.

### How should state guide pages link to articles?

Each state guide should link to one sale-process article, one value/methodology article, one royalty/public-records article, one inheritance/probate article, and one offer-review article, while those articles link back to the state guide only when the state context is materially relevant.

### What has to happen before any Content Genius article is replaced live?

One page must pass editorial review, compliance review, local build/lint/typecheck, sitemap inclusion, structured-data validation, GA4 tag/event presence, and read-only GSC inspection before another page is replaced.

## Internal-link graph rewrites

1. Every state guide links to the five owner-intent pillars: sell, value/methodology, offer review, inherited minerals, learning center/public records.
2. Every Texas cluster article links back to `/mineral-rights/texas/` only when the article specifically discusses Texas records, Texas basins, Texas sale process, or Texas offer comparisons.
3. Near-duplicate article families (1031, predatory offers, underwriter review, value methodology) should be consolidated by intent: one canonical pillar/hub, then supporting articles with distinct owner questions.
4. No more than one article is replaced or materially rewritten before the full verification cycle passes.
5. Link text should describe the owner question, not manipulate exact-match anchors. Use phrases such as 'Texas owner guide', 'offer-review checklist', 'underwriter methodology', and 'documents to gather'.

## Meta-description rewrite rules

- 130–160 characters for Astro schema compliance.
- Answer the owner question directly.
- Avoid guarantees, investment-return language, appraisal language, 'expert advice', 'maximize profits', 'superior offers', and named competitors.
- Include state name only when the page is genuinely state-specific.
- Include MRX only when the page is about MRX process, review, or methodology.

## Human-only gates surfaced

- Final publish/merge of any new pillar or cluster page
- Any live WordPress/Search Atlas/OTTO/GBP/social publication or auto-fix
- Any Search Console mutation including sitemap submit/remove or Request Indexing
- Any regulated legal/tax/valuation copy change that could imply advice, guarantee, appraisal, investment return, or individualized recommendation
- Any credential, OAuth, API token, Vercel, Cloudflare, or billing mutation

## Next owner

Next owner after this lane: `mrx_webdev` for safe rendering/link implementation and `mrx_seo_audit` for structured-data, sitemap, GA4, and GSC read-only verification. Daryl remains the human-only gate for merge, deploy, live publishing, and Search Console mutations.
