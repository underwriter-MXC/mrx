# MRX keyword research gathered from Search Atlas

Date: 2026-07-20  
Scope: keyword research only; existing Search Atlas data was read without launching new keyword lookups, DKN changes, article generation, publishing, or OTTO actions.

## Search Atlas sources

- Keyword Research project `4520906`: 10 measured seed terms.
- Keyword Research project `4467370`: 25 measured owner-decision terms. Search Atlas lists 150 inputs for this project, but only 25 rows currently return complete volume/difficulty/CPC metrics; unmeasured rows are not treated as validated demand.
- Existing one-keyword research projects: selected commercial, educational, state, basin, tax, title, and process terms.
- Keyword Rank Tracker project `79292`: 133 tracking rows, 124 unique keywords, and 56 county-modified terms.
- Site Explorer project `702293`: 11 stored organic keyword rows across 3 URLs.

No new keyword-research project, SERP refresh, lookup, keyword-gap analysis, or tracking keyword was created. The Search Atlas `Max Keyword Lookups` ledger remained unchanged at `81 consumed / 4,919 remaining`; Hyperdrive consumption remained `0`.

## OTTO read-only cross-check

OTTO project `e4bab8bb-717e-480c-8dea-1de1b8596eb7` was used only for zero-credit reads:

- Project status: engaged; Cloudflare Worker installed; daily crawl configured.
- OTTO SEO score: `93`; Technical `93`, Content `13`, Authority `4`, UX Signals `0`.
- Current crawl state: `crawl_in_progress=true`, but the project still reports only `1` crawled page.
- Existing audit `138239`: `failed` / post-processing `failed`, one page, eight reported issue groups.
- Current OTTO issue inventory reports zero missing-keyword and zero internal-link recommendations because only one page is represented. That is an incomplete crawl result, not evidence that the full site has no keyword or linking gaps.

Accordingly, OTTO was not asked to generate recommendations or start another crawl. The keyword-priority decisions below come from the existing Keyword Research, KRT, and Site Explorer datasets. A post-crawl OTTO read may be used later if the existing daily crawl completes successfully and still consumes no quota.

## Highest-priority measured opportunities

| Keyword | US volume | KD | CPC | Intent | Recommended canonical target |
|---|---:|---:|---:|---|---|
| sell mineral rights | 390 | 9 | $14.01 | Commercial | `/sell-mineral-rights/` |
| mineral rights value | 260 | 11 | $4.45 | Commercial investigation | `/mineral-rights-value/` |
| how to sell mineral rights | 170 | 8 | $14.89 | Commercial/informational | `/sell-mineral-rights/` plus one supporting guide |
| how much are mineral rights worth | 170 | 9 | $3.12 | Commercial investigation | `/mineral-rights-value/` |
| mineral rights buyers | 140 | 8 | $12.51 | Commercial | `/sell-mineral-rights/` and the reviewed buyer-comparison article |
| mineral rights calculator | 140 | 9 | $3.69 | Tool/commercial investigation | Research signal only until a real, reviewed calculator exists |
| mineral rights buyer | 110 | 9 | $12.68 | Commercial | `/sell-mineral-rights/` |
| inherited mineral rights | 90 | 9 | $0.00 | Owner problem | `/inherited-mineral-rights/` |
| oil and gas mineral rights | 90 | 45 | $3.59 | Educational | `/learning-center/` |
| who buys mineral rights | 70 | 11 | $13.46 | Commercial investigation | Buyer-comparison article and `/sell-mineral-rights/` |
| mineral rights royalties | 50 | 28 | $2.50 | Educational | `/learning-center/oil-and-gas-royalties/` |
| mineral rights tax implications | 50 | 9 | $0.00 | Tax education | `/learning-center/mineral-rights-taxes/` |
| mineral rights marketplace | 30 | 26 | $3.67 | Commercial comparison | Research signal; do not imply MRX operates a marketplace |
| 1031 exchange mineral rights | 10 | 26 | $4.33 | Tax/transaction education | `/1031-exchange/` |
| mineral rights purchase agreement | 10 | 19 | $0.00 | Contract education | `/offer-review/` with legal-scope guardrails |
| mineral rights price per acre | 10 | 10 | $0.00 | Valuation investigation | `/mineral-rights-value/`; explain limitations of per-acre comparisons |

## Large educational terms

| Keyword | US volume | KD | CPC | Recommended use |
|---|---:|---:|---:|---|
| mineral rights | 3,600 | 80 | $1.97 | Long-term entity/pillar term; not a near-term standalone quick win |
| what are mineral rights | 1,300 | 40 | $0.13 | `/learning-center/` or a canonical fundamentals guide |
| mineral rights title search | 1,300 | 28 | $2.47 | Educational records/title guide; never imply MRX issues a title opinion |
| mineral rights appraisal | 260 | 9 | $4.53 | Appraisal-vs-directional-review explainer only; do not present MRX as an appraiser |
| mineral rights valuation | 260 | 26 | $4.45 | `/mineral-rights-value/` and `/methodology/`, using the published scope limitations |
| mineral rights royalty calculator | 140 | 4 | $2.69 | Strong tool demand, but hold until a real reviewed product exists |
| mineral rights companies | 110 | 44 | $6.84 | Neutral buyer/company evaluation guide; avoid unsupported comparisons |
| mineral rights inheritance | 90 | 13 | $3.21 | `/inherited-mineral-rights/` |

## State and basin demand already stored in Search Atlas

| Keyword | US volume | KD | CPC | Existing target |
|---|---:|---:|---:|---|
| texas mineral rights | 1,300 | 8 | $2.62 | `/mineral-rights/texas/` |
| mineral rights oklahoma | 390 | 8 | $3.03 | `/mineral-rights/oklahoma/` |
| mineral rights north dakota | 320 | 28 | $2.16 | `/mineral-rights/north-dakota/` |
| mineral rights colorado | 260 | 34 | $5.66 | `/mineral-rights/colorado/` |
| mineral rights wyoming | 210 | 6 | $0.00 | `/mineral-rights/wyoming/` |
| mineral rights west virginia | 170 | 4 | $3.58 | `/mineral-rights/west-virginia/` |
| mineral rights louisiana | 170 | 4 | $2.44 | `/mineral-rights/louisiana/` |
| mineral rights pennsylvania | 140 | 13 | $5.87 | `/mineral-rights/pennsylvania/` |
| mineral rights new mexico | 70 | 13 | $3.22 | `/mineral-rights/new-mexico/` |
| permian basin royalties | 590 | 49 | $1.18 | Texas/New Mexico basin-supporting guide |
| permian basin mineral rights | 20 | 6 | $0.00 | Texas/New Mexico basin-supporting guide |
| eagle ford mineral rights | 0 | 8 | $0.00 | Do not prioritize from this snapshot |

Search Atlas has no stored measured result in the selected MRX research projects for the existing Ohio state page. That is a research gap, not evidence of zero demand.

## Existing ranking signals

The KRT project currently shows 15 unique keywords with a reported position. Best signals:

| Keyword | Position | Search Atlas ranking URL |
|---|---:|---|
| mineral rights underwriter review | 3 | `/blog/mineral-rights-appraisal-vs-underwriter-review/` |
| oil and gas royalty valuation | 13 | `/blog/oil-and-gas-royalties-what-owners-need-to-know/` |
| is my mineral rights offer fair | 22 | `/blog/fair-market-value-of-mineral-rights-explained/` |
| oil royalties Texas | 39 | `/blog/oil-and-gas-royalties-what-owners-need-to-know/` |
| mineral rights royalty income | 43 | `/blog/oil-and-gas-royalties-what-owners-need-to-know/` |
| mineral rights tax basis | 47 | `/blog/tax-on-sale-of-inherited-mineral-rights/` |
| taxes on selling mineral rights | 57 | `/blog/tax-on-sale-of-inherited-mineral-rights/` |
| heirs mineral rights | 60 | `/blog/mineral-rights-and-estate-planning-for-heirs/` |

Some reported ranking URLs are not current canonical sitemap entries. Treat these as demand/legacy-equity evidence, not an automatic instruction to republish or generate new pages.

## Recommended keyword architecture

1. **Sell/transaction pillar:** `sell mineral rights`, `how to sell mineral rights`, `mineral rights buyers`, `mineral rights buyer`, `who buys mineral rights`.
2. **Value/review pillar:** `mineral rights value`, `how much are mineral rights worth`, `mineral rights valuation`, `mineral rights price per acre`, `is my mineral rights offer fair`, `mineral rights offer review`.
3. **Inheritance pillar:** `inherited mineral rights`, `mineral rights inheritance`, `probate mineral rights`, `heirs mineral rights`.
4. **Royalty pillar:** `mineral rights royalties`, `oil and gas royalty valuation`, `royalty income`, `royalty payments`, `how to read a royalty statement`.
5. **Tax/1031 pillar:** `mineral rights tax implications`, `mineral rights tax basis`, `taxes on selling mineral rights`, `1031 exchange mineral rights`.
6. **Ownership/title education:** `mineral rights title search`, `mineral rights ownership records`, `how to find out if you own mineral rights`, `what documents prove mineral rights ownership`.
7. **State pages:** prioritize Texas, Oklahoma, Wyoming, West Virginia, Louisiana, North Dakota, Colorado, Pennsylvania, then New Mexico based on the stored volume/KD balance. Preserve one canonical state URL per state.

## Exclusions and guardrails

- The 56 county-modified KRT terms are all unranked. Keep them as research rows only; do not turn them into doorway pages without verified local proof and genuinely unique content.
- `appraisal`, `title search`, `tax`, `1031`, `probate`, and agreement terms are valid search demand but require educational scoping and qualified-professional disclaimers.
- Calculator terms show demand but are not evidence that MRX currently has a calculator. Do not promise a tool until one is implemented and reviewed.
- Buyer, marketplace, acquisition, investment, and “for sale” terms must be separated by intent; several describe people buying assets rather than mineral owners seeking a review or sale.
- Do not create multiple pages for singular/plural or word-order variants. Consolidate them into the canonical pillar above.

## If additional fresh research is desired

The next useful paid/quota-bearing step would be a deliberately capped lookup batch for missing or stale terms, especially Ohio, royalty-statement questions, offer-review variants, and state-specific owner questions. No such lookup was run. Before doing so, provide the proposed keyword list and exact lookup count for Daryl's approval.
