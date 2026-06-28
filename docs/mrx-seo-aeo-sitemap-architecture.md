# MRX SEO/AEO Sitemap + Sales Spiderweb Architecture

_Last updated: 2026-06-28_

## Commander’s intent

MineralRightsXchange.com should be found by search engines and LLM answer engines when mineral owners ask whether to sell, how to value mineral rights, whether an offer is fair, what inherited rights mean, and what documents are needed. Every useful answer path should drive the owner into Tommy’s AI intake and then into the GHL calendar for a free underwriter review.

Primary conversion paths:

1. Ask Tommy a mineral-rights question.
2. Book a free GHL calendar underwriter review.
3. Submit the `/book` GHL-backed intake form when calendar handoff is unavailable.
4. Click-to-call once `PUBLIC_MRX_PHONE_TEL` is configured.

## Current live sitemap foundation

Canonical domain: `https://mineralrightsxchange.com`

Existing core routes:

- `/` — Tommy AI-first homepage and conversion hub.
- `/book/` — GHL-backed free underwriter review intake.
- `/free-guide/` — lead magnet.
- `/sell-mineral-rights/` — BOFU pillar.
- `/how-it-works/` — process trust page.
- `/methodology/` — DCF/valuation methodology authority page.
- `/faq/` — answer hub.
- `/about/` — entity/trust page.
- `/privacy-policy/` — legal/privacy trust page.
- `/blog/` — learning center hub.

Existing supporting articles:

- `/blog/how-are-mineral-rights-valued/`
- `/blog/how-to-compare-mineral-rights-buyers-in-texas/`
- `/blog/how-to-sell-mineral-rights-in-texas/`
- `/blog/texas-severance-tax-what-mineral-rights-owners-need-to-know/`
- `/blog/what-documents-do-you-need-to-sell-mineral-rights-in-texas/`
- `/blog/what-is-a-clawback-clause-in-a-mineral-rights-sale/`

## Target spiderweb structure

### Pillar 1 — Sell Mineral Rights

Hub URL: `/sell-mineral-rights/`

Purpose: Capture BOFU owner intent and explain a safe selling decision path.

Support pages/articles:

- `/blog/how-to-sell-mineral-rights-in-texas/`
- `/blog/how-to-compare-mineral-rights-buyers-in-texas/`
- `/blog/what-documents-do-you-need-to-sell-mineral-rights-in-texas/`
- Future: `/sell-mineral-rights/texas/`
- Future: `/sell-mineral-rights/mineral-rights-offer-review/`
- Future: `/sell-mineral-rights/royalty-interest/`

Internal-link rule: every article links up to `/sell-mineral-rights/`, sideways to `/methodology/`, and forward to `/book/` or `#mrx-ai-chat`.

### Pillar 2 — Mineral Rights Valuation

Hub URL: `/methodology/`

Purpose: Explain valuation drivers and MRX’s transparent DCF methodology without making binding appraisal claims.

Support pages/articles:

- `/blog/how-are-mineral-rights-valued/`
- Future: `/mineral-rights-value-calculator/` as an educational estimator/intake path, not a binding appraisal.
- Future: `/mineral-rights-valuation/production-history/`
- Future: `/mineral-rights-valuation/decline-curves/`
- Future: `/mineral-rights-valuation/net-royalty-acres/`
- Future: `/mineral-rights-valuation/operator-and-basin-risk/`

Internal-link rule: answer pages link to `/methodology/`, then to Tommy chat and `/book/`.

### Pillar 3 — Offer Review

Hub URL: future `/mineral-rights-offer-review/`

Purpose: Own “I received an offer” queries and convert owners into confidential review calls.

Support pages/articles:

- Future: `/mineral-rights-offer-review/is-my-offer-fair/`
- Future: `/mineral-rights-offer-review/letter-of-intent/`
- Future: `/mineral-rights-offer-review/clawback-clauses/`
- Existing: `/blog/what-is-a-clawback-clause-in-a-mineral-rights-sale/`

Internal-link rule: every offer page should include the checklist “before signing, ask Tommy” and CTA to `/book/`.

### Pillar 4 — Inherited Mineral Rights

Hub URL: future `/inherited-mineral-rights/`

Purpose: Capture heirs/executors/family owners who do not yet know what documents or decisions matter.

Support pages/articles:

- Future: `/inherited-mineral-rights/what-to-do-first/`
- Future: `/inherited-mineral-rights/mineral-deed-division-order-lease/`
- Future: `/inherited-mineral-rights/probate-and-ownership-records/`
- Future: `/inherited-mineral-rights/sell-or-keep/`

Internal-link rule: pages route to Tommy/Cooper for research context, then GHL calendar.

### Pillar 5 — Royalty Checks + Owner Questions

Hub URL: future `/oil-and-gas-royalties/`

Purpose: Capture royalty-check owners who wonder whether checks imply value, decline, or sale timing.

Support pages/articles:

- Future: `/oil-and-gas-royalties/understanding-royalty-checks/`
- Future: `/oil-and-gas-royalties/operator-production-history/`
- Future: `/oil-and-gas-royalties/should-i-sell-royalties/`
- Existing: `/blog/texas-severance-tax-what-mineral-rights-owners-need-to-know/`

Internal-link rule: route engineering/production questions to Dale-style answer blocks, then Tommy booking.

### Pillar 6 — Local / State / County Authority

Hub URL: future `/texas-mineral-rights/`

Purpose: Build crawlable local/entity depth without thin programmatic pages.

Support pages:

- Future: `/texas-mineral-rights/`
- Future county templates only after unique context exists: county overview, basin/operator context, owner checklist, documents, FAQ, CTA.
- Future examples: `/texas-mineral-rights/midland-county/`, `/texas-mineral-rights/reeves-county/`, `/texas-mineral-rights/martin-county/`.

Index rule: do not index local/county pages until each has unique useful content and internal links.

## Page template requirements

Every SEO/AEO page needs:

- One H1 tied to the search intent.
- A direct answer in the first 80–120 words.
- A visible “Ask Tommy” or “Book Free Mineral Review” CTA near the first answer block.
- 3–6 question-style H2s.
- A checklist/table/list that LLMs can extract.
- Internal links to parent, sibling, and conversion pages.
- Schema: BreadcrumbList, Article for articles, FAQPage only when visible FAQ content exists.
- Compliance-safe disclaimer: directional underwriter estimate, not legal/tax/title/investment advice and not a certified appraisal.

## Conversion wiring rules

Homepage:

- Top nav stays visible as native DOM.
- Hero uses live HTML/CSS and separate images/icons — never a full screenshot as the visible UI.
- Tommy AI card answers first questions and points owners to the GHL calendar.
- `Book Free Mineral Review` links to the GHL calendar URL.
- Phone icon is a real `tel:` link only when `PUBLIC_MRX_PHONE_TEL` is configured.

Booking:

- `/book/` continues to POST `/api/book`, upsert to GHL, then redirect to `MRX_GHL_CALENDAR_URL`.
- GHL calendar source of truth: `https://api.leadconnectorhq.com/widget/booking/lg3KcWfsKrR2pCWS6AeL`.
- Form path remains the fallback if public calendar env is unavailable.

AI chat:

- Tommy starts broad.
- First answer routes to the right MRX specialist metadata: Tommy, Cooper, Dale, Rebecca, Monty.
- The response always asks for state/county and document status.
- The response always presents the GHL calendar as the next step when the owner is ready.
- GA4/dataLayer events: `mrx_ai_interaction`, `mrx_calendar_click`, `phone_click`.

## Near-term content production backlog

Priority 1 BOFU pages:

1. `/mineral-rights-offer-review/`
2. `/inherited-mineral-rights/`
3. `/oil-and-gas-royalties/should-i-sell-royalties/`
4. `/mineral-rights-value-calculator/`
5. `/texas-mineral-rights/`

Priority 2 supporting articles:

1. Is my mineral rights offer fair?
2. What documents should I collect before selling mineral rights?
3. Should I sell inherited mineral rights?
4. How royalty checks affect mineral rights value.
5. What does an operator tell you about mineral rights value?
6. How decline curves affect mineral rights offers.
7. Mineral rights sale taxes in Texas.
8. What is a division order?
9. What is net royalty interest?
10. What is a mineral deed?

Priority 3 local/entity expansion:

- Texas basin pages.
- High-value county pages.
- Operator glossary pages.
- Mineral rights glossary pages.

## Verification checklist

Before any page publishes:

- `npx --yes pnpm@9 test`
- `./scripts/build.sh`
- Canonical HTML contains H1/body/CTA/internal links.
- Sitemap includes only intended public canonical URLs.
- `llms.txt` includes the new high-value pages once public.
- Browser check confirms visible content, no screenshot-only UI, and no broken assets.
- Live check confirms canonical domain HTTP 200 and expected markers.
