# MRX1000 Wave 15 Continuous Selection Record — 2026-08-11

Decision ID: `MRX1000-W15-SELECT-2026-08-11`

Authority: Daryl Hill's standing owner directives `D-2026-0804-16` and the `2026-08-11 MRX Two-Image Article Creative Directive`
Recorded by: Codex
Hermes routing note: the configured Chesty, `mrx_ceo`, and MRX specialist profiles were not callable in this runtime; this record does not claim a new Hermes or `mrx_ceo` approval.
Disposition: **SELECTED FOR ARTICLE-SPECIFIC QUALITY-GATED PUBLICATION**

## Selected row

| Rank | Program row    | Canonical slug                                                          | Canonical title                                                         | Cluster                       |
| ---: | -------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------- |
|   95 | `MRX1000-0173` | `converting-monthly-royalty-history-into-a-valuation-baseline`           | Converting Monthly Royalty History Into a Valuation Baseline            | valuation-methodology-drivers |

The canonical ledger classified this row as `planning_only_inventory`. Its slug and title are exact-unique, its nearest same-cluster title has a token-Jaccard score of `0.1667`, and its dedupe review is `exact_and_fuzzy_title_check_pass`. Selection rank 95 continues the valuation-methodology sequence with an owner-facing framework for organizing monthly royalty statements into a documented historical cash-flow baseline. Article count, elapsed time, index coverage, and a future numerical cap decision are not release gates.

## Editorial boundary

The article-specific search job is an evidence hierarchy for turning owner statements into a normalized historical record without presenting that record as a forecast or owner-specific value. It must:

- distinguish production month, statement month, and payment date, and preserve later adjustments or reversals rather than silently overwriting them;
- organize gross volume, realized price, owner decimal, gross owner value, taxes, deductions, adjustments, and net payment as separate fields when the statement provides them;
- reconcile the statement record to public Railroad Commission of Texas production data only as a reasonableness check because public operator-reported production does not prove title, the owner's decimal, private pricing, or all payment details;
- use official Texas statutory, Railroad Commission of Texas, Texas Comptroller, and U.S. Energy Information Administration sources for statement fields, public-data limitations, taxes, price context, and income-analysis principles;
- explain how to identify missing months, changing decimals, property identifiers, one-time adjustments, timing lags, product mix, price movement, downtime, and deductions before calculating a trailing baseline;
- distinguish a historical owner cash-flow baseline from a professional valuation opinion, title opinion, reserve report, engineering forecast, tax return position, audit conclusion, or future drilling schedule;
- disclose that MRX may have an economic interest and is not an independent appraiser, attorney, accountant, tax adviser, landman, geologist, or petroleum engineer; and
- avoid invented statement figures, universal lookback periods, unsupported normalization adjustments, owner-specific value conclusions, underpayment accusations, or predictions of future prices, production, drilling, or checks.

## Two-image release boundary

The article must have:

1. one unique 1200 × 630 hero/share photograph with the exact title `Converting Monthly Royalty History Into a Valuation Baseline` deterministically rendered in the pixels and a filename stem matching that exact-title slug;
2. the same hero binary for the visible hero, `og:image`, `twitter:image`, and Article schema image;
3. one distinct 1200 × 675 in-body photograph with `monthly royalty history worksheet` deterministically rendered in the pixels and a matching filename stem;
4. no generated payment amounts, production volumes, decimal interests, prices, dates, account numbers, tract identifiers, signatures, legal descriptions, logos, seals, checks, tax forms, contracts, or private owner data in either underlying photograph; and
5. full-size, small-preview, OCR, filename, binary-distinctness, rendered-HTML, and live-production verification.

## Required publication evidence

Publication remains fail closed until the article has current editorial, factual-citation, compliance, creative, metadata, build, rollback, deployment, and post-publication verification evidence. The standing owner publication authorization does not waive any article-specific gate.

The decision-file checksum is recorded in `config/mrx1000-release-10-batch.json` under `decision_authority.wave15_selection_decision_sha256` after admission materialization.
