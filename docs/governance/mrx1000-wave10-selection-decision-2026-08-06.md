# MRX1000 Wave 10 Selection Decision — 2026-08-06

Decision ID: `MRX1000-W10-SELECT-2026-08-06`

Authority: `D-2026-0804-16` and the 2026-08-04 MRX Continuous Article Publication Directive
Decision owner / signer: `mrx_ceo`
Signed at: `2026-08-06T13:03:36Z`
Disposition: **APPROVED FOR ARTICLE-SPECIFIC QUALITY-GATED PUBLICATION**

## Purpose

Select the next ten incumbent draft rows for continuous publication without treating article count, elapsed time, index coverage, or a future cap-lift decision as a release gate. Every selected row remains fail closed on its own editorial, factual, citation, compliance, originality, exact-title creative, metadata, build, deployment, and live-verification evidence. Wave 10 selection ranks 81–90 follow Wave 9 ranks 71–80 and continue the same quality-gated pipeline without raising any publication cap.

## Source-of-truth ledger

- Canonical ledger: `config/mrx-1000-canonical-content-ledger.json` (SHA-256 `3f708fb9b91571b43453efa4be6dad7d543b2b7c185b26d088d04475fe7b4b7c`, generated_at `2026-07-20T13:35:37.315Z`, identity strategy `preserve_program_row_id_by_canonical_slug`).
- Reconciled counts at commit `6513566`: 89 `live_public_published_route`, 39 `incumbent_draft_nonpublic_held`, 25 `pilot_draft_noindex_stage`, 847 `planning_only_inventory`.
- This selection draws exclusively from the 39 `incumbent_draft_nonpublic_held` rows.

## Selected rows

| Rank | Program row | Canonical slug | Canonical title | Cluster |
| ---: | --- | --- | --- | --- |
| 81 | MRX1000-0627 | `1031-exchange-for-mineral-rights-in-texas-explained` | 1031 Exchange for Mineral Rights in Texas Explained | tax-1031-legal-education |
| 82 | MRX1000-0635 | `maximize-gains-with-1031-exchange-for-texas-mineral-rights` | Maximize Gains With 1031 Exchange for Texas Mineral Rights | tax-1031-legal-education |
| 83 | MRX1000-0437 | `what-happens-to-mineral-rights-in-probate` | What Happens to Mineral Rights in Probate? | inherited-estate-probate |
| 84 | MRX1000-0433 | `understanding-estate-planning-for-inherited-mineral-rights` | Understanding Estate Planning for Inherited Mineral Rights | inherited-estate-probate |
| 85 | MRX1000-0529 | `understanding-your-mineral-royalty-checks-value` | Understanding Your Mineral Royalty Checks Value | royalties-owner-operations |
| 86 | MRX1000-0730 | `how-to-determine-the-value-of-texas-mineral-rights` | How to Determine the Value of Texas Mineral Rights | texas-county-basin-local-intent |
| 87 | MRX1000-0735 | `unlocking-value-assessing-your-texas-mineral-rights` | Unlocking Value: Assessing Your Texas Mineral Rights | texas-county-basin-local-intent |
| 88 | MRX1000-0311 | `how-to-spot-predatory-mineral-rights-offers` | How to Spot Predatory Mineral Rights Offers | offer-review-buyer-comparison-safety |
| 89 | MRX1000-0320 | `what-to-do-when-you-have-competing-offers-on-your-mineral-rights-a-guide` | What to Do When You Have Competing Offers on Your Mineral Rights: A Guide | offer-review-buyer-comparison-safety |
| 90 | MRX1000-0161 | `understanding-the-value-of-your-mineral-rights` | Understanding the Value of Your Mineral Rights | valuation-methodology-drivers |

## Cluster balance and selection rationale

- The 39 held rows are concentrated in mrx-methodology-transparency-underwriter-process (17) and offer-review-buyer-comparison-safety (8). Wave 10 deliberately moves the slate toward the underrepresented clusters: tax-1031-legal-education (2), inherited-estate-probate (2), royalties-owner-operations (1), texas-county-basin-local-intent (2), valuation-methodology-drivers (1), and offer-review-buyer-comparison-safety (2). Zero mrx-methodology rows are admitted in Wave 10 to give the compliance-review lane time to retune the fairness, "guarantees," and "appraisal" language in the heaviest drafts before another batch ships.
- The two 1031 rows split cleanly. The Texas-specific explanation (rank 81) is the lowest compliance-signal-density draft in the entire held pool (2 hits across all risk markers) and is the only held 1031 row whose nearest cluster-mate is also held, providing clean separation from the eligibility and mechanics already live. The maximize-gains Texas row (rank 82) carries the owner-gains framing rather than the eligibility or mechanics already shipped, and it is paired with `maximize-value-of-your-mineral-rights-1031-exchange` (planning-only inventory), not with the eligibility/mechanics articles that are already live.
- The two inherited-estate-probate rows round out the cluster. The probate-consequences article (rank 83) is distinct from Wave 9 and live process/probate coverage by focusing on what happens to mineral rights after death (ownership transfer mechanics, payor updates, basis), not the procedural how-to. The estate-planning article (rank 84) is distinct from Wave 9's "Managing Mineral Interests in Estate Planning Explained" by focusing on the planning lifecycle (successor instructions, record custody, ongoing administration), not the administration itself.
- The single royalties-owner-operations row (rank 85) targets the value-framing of royalty checks, distinct from Wave 9's gross-to-net breakdown and from the live decoding and interpretation articles. It must remain owner-education only and must not present itself as a pricing tool or substitute for payor inquiries.
- The two texas-county-basin-local-intent rows (ranks 86 and 87) are deliberately distinct from Wave 9's "How to Accurately Assess Your Texas Mineral Rights Value." Rank 86 is a "determine the value" walkthrough for Texas owners; rank 87 is the "unlocking value" framing. Both must remain non-formulaic, source-anchored in RRC production data and EIA price data, and may not offer a guaranteed valuation or substitute for a registered appraisal.
- The two offer-review rows (ranks 88 and 89) carry the lowest compliance-signal density among the held offer-review pool. Rank 88 is a spotting guide for predatory offers that complements (rather than duplicates) Wave 9's "How to Identify Predatory Mineral Buyers" by focusing on offer-side red flags rather than buyer-side categorization. Rank 89 is a competing-offers action guide that complements Wave 9's "Navigating Competing Offers" by providing owner-side step sequencing before the assessment call. Neither row may label a counterparty predatory or fraudulent without evidence, promise a fair price, or substitute for legal review.
- The single valuation-methodology-drivers row (rank 90) is the lowest-cannibalization held row in that cluster (score 0.5) and the only held valuation row without a `manual_cannibalization_review_required` flag. It is positioned as an owner-education value primer that complements Wave 9's comprehensive assessment workbook and does not present a universal pricing formula.

## Overlap boundaries with prior waves and live corpus

- The 10 selected slugs are disjoint from the 80 already-live slugs and from the 80 admitted program_row_ids in `config/mrx1000-release-10-batch.json`.
- No selected row carries a `manual_cannibalization_review_required` flag; all 10 are `exact_and_fuzzy_title_check_pass` with `cannibalization_score` between 0.3333 and 0.6667.
- Five held rows with `cannibalization_score = 1` and `manual_cannibalization_review_required` are deliberately excluded: MRX1000-0960 (`get-your-free-underwriter-review-for-mineral-rights`), MRX1000-0631 (`how-a-1031-exchange-benefits-mineral-rights-owners`), MRX1000-0638 (`understanding-1031-exchange-benefits-for-mineral-rights-owners`), MRX1000-0155 (`how-to-assess-the-value-of-your-mineral-rights`), and MRX1000-0156 (`how-to-assess-your-mineral-rights-value`).
- The two valuation held rows `how-to-assess-the-value-of-your-mineral-rights` (MRX1000-0155) and `how-to-assess-your-mineral-rights-value` (MRX1000-0156) cannibalize each other and the already-live `unlocking-value-a-comprehensive-guide-to-assessing-your-mineral-rights-worth` (rank 71, MRX1000-0163); both are held back until the editorial team resolves the pair.

## Compliance, source, and review lanes required for each selected row

- **MRX1000-0627 (rank 81) — Texas 1031 explained.** Primary sources: IRC §1031; Treas. Reg. §1.1031(a)-1 and §1.1031(k)-1; IRS Publication 544; and Form 8824 instructions. Review lanes: editorial, factual-citation, compliance (must include "this article is not tax or legal advice" disclaimer), and a primary-source-only rewrite from the existing MDX because the held draft is recycled and contains stale boilerplate.
- **MRX1000-0635 (rank 82) — Maximize gains with 1031 in Texas.** Primary sources: IRC §1031; Treas. Reg. §1.1031(k)-1 for identification, exchange-period, safe-harbor, and qualified-intermediary rules; IRS Publication 544; and Form 8824 instructions. Review lanes: editorial, factual-citation, compliance (must remove any "guaranteed tax savings" or "no risk" framing), and primary-source rewrite.
- **MRX1000-0437 (rank 83) — What happens to mineral rights in probate.** Primary sources: Texas Estates Code chapters 101, 201–205, 256, 301, and 351; county real-property records; and IRC §1014 plus IRS Publication 559 for basis administration. Review lanes: editorial, factual-citation, compliance (must include "not legal advice" disclaimer and not characterize court outcomes), and primary-source rewrite.
- **MRX1000-0433 (rank 84) — Estate planning for inherited mineral rights.** Primary sources: Texas Estates Code chapters 101, 201–205, 256, 301, and 351; Texas Property Code Title 9, Subtitle B for trusts; county real-property records; and IRS Publication 559. Review lanes: editorial, factual-citation, compliance, and primary-source rewrite.
- **MRX1000-0529 (rank 85) — Royalty checks value.** Primary sources: Texas Natural Resources Code §§91.401–91.406 for payment and division-order rules; EIA monthly crude-oil and natural-gas price reports; Texas Comptroller oil-and-gas severance-tax guidance; and RRC Texas production data. Review lanes: editorial, factual-citation, compliance (must not represent MRX as a payor or pricing source), and primary-source rewrite.
- **MRX1000-0730 (rank 86) — How to determine the value of Texas mineral rights.** Primary sources: RRC public production query; EIA Texas monthly crude/natural-gas price; Texas General Land Office mineral classified-land data; county appraisal district records (information-only, not a substitute for a registered appraisal). Review lanes: editorial, factual-citation, compliance (must include "not a certified appraisal" disclaimer), and primary-source rewrite.
- **MRX1000-0735 (rank 87) — Unlocking value: assessing your Texas mineral rights.** Primary sources: RRC public records (lease records, proration units, drilling permits); EIA basin-level production trend data; USGS hydrocarbon assessments for the Permian, Eagle Ford, and Haynesville; basin geology references. Review lanes: editorial, factual-citation, compliance (must not promise a value range or a guaranteed offer), and primary-source rewrite.
- **MRX1000-0311 (rank 88) — Spotting predatory mineral rights offers.** Primary sources: Texas Railroad Commission operator, permit, and production records for factual cross-checks; county real-property records; and Federal Trade Commission consumer guidance on impersonation, urgency, payment, and information-security red flags. Review lanes: editorial, factual-citation, compliance (must not label any specific counterparty as predatory or fraudulent without adjudicative evidence; must include owner-action-only framing and "not legal advice" disclaimer), and primary-source rewrite.
- **MRX1000-0320 (rank 89) — Competing-offers guide.** Primary sources: Texas Property Code conveyance and recording statutes; standard mineral-rights purchase agreement terms (closing, inspection, title, lease-review conditions); RRC and county records. Review lanes: editorial, factual-citation, compliance (must not promise the highest offer or imply MRX is a buyer), and primary-source rewrite.
- **MRX1000-0161 (rank 90) — Understanding the value of your mineral rights.** Primary sources: RRC Texas monthly production by county; EIA price reports; USGS basin geology references; Texas Comptroller severance-tax guidance. Review lanes: editorial, factual-citation, compliance (must not provide a price-per-acre formula or a guaranteed valuation; must include "not a registered appraisal" disclaimer), and primary-source rewrite.

## Required release evidence (unchanged from Wave 9)

Each row must have:

1. a rewritten, source-backed article with five bounded FAQs;
2. a unique 1200 × 630 hero/share asset with the exact canonical title rendered in the pixels;
3. identical hero, `og:image`, `twitter:image`, and Article-schema image identity;
4. current review artifacts and a PASS evidence packet;
5. clean copy, headings, compliance, schema, build, and automated tests;
6. a READY production deployment with all legal release gates approved; and
7. live HTTP, metadata, image, sitemap, indexability, and Chrome visual verification on every active production target.

## Identity-update scope (minimal)

Identities reconcile:

- All 10 selected `program_row_id`s are present in `config/mrx-1000-canonical-content-ledger.json` and tagged `incumbent_draft_nonpublic_held`.
- All 10 selected `canonical_slug`s are present in the ledger, are not in `live_public_published_route`, are not in `pilot_draft_noindex_stage`, and are not in `planning_only_inventory`.
- All 10 selected slugs are disjoint from the 80 admitted slugs and 80 admitted program_row_ids in `config/mrx1000-release-10-batch.json`.
- All 10 selected rows have an MDX file on disk at the recorded `repo_path`.
- The 10 selection ranks 81–90 are disjoint from the 80 already-recorded ranks 1–80.

Therefore the only repository changes required to record the Wave 10 selection are:

1. Add this decision file (`docs/governance/mrx1000-wave10-selection-decision-2026-08-06.md`).
2. Append the three Wave-10 selection-identity fields to `decision_authority` in `config/mrx1000-release-10-batch.json`.
3. Recompute `config/mrx1000-release-10-batch.json.sha256`.

The canonical ledger (`config/mrx-1000-canonical-content-ledger.json`) is not modified; selection does not change the held/inventory classification. No production change, no commit, no push.

## Checksum (SHA-256)

- `MRX1000-W10-SELECT-2026-08-06` decision-file SHA-256 (integrity binding for this document only): see the value recorded in `config/mrx1000-release-10-batch.json` under `decision_authority.wave10_selection_decision_sha256`. The current batch SHA-256 is in `config/mrx1000-release-10-batch.json.sha256` and is intentionally not inlined here, because a self-referential checksum in this file would require a fixed-point iteration that the document cannot guarantee at write time.
- `config/mrx-1000-canonical-content-ledger.json` SHA-256 (unchanged): `3f708fb9b91571b43453efa4be6dad7d543b2b7c185b26d088d04475fe7b4b7c`
- `docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md` SHA-256 (unchanged): `edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f`

_Signed by `mrx_ceo` at `2026-08-06T13:03:36Z`._
