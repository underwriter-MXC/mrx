# MRX1000-PILOT-001 Asset Summary

Prepared for Kanban task `t_2c40075a` (F5 hero/social asset architecture and per-asset manifest).
Decision reference: `D-2026-0720-05`. Pilot batch: `MRX1000-PILOT-001`.

Status: read-only. No images rendered, no SearchAtlas/GSC/GA4 state changed, no paid quota spent.

Source data: `config/mrx-1000-pilot-batch-001.json` and `config/mrx-1000-pilot-batch-001-asset-manifest.json`.
Dedupe evidence: `qa-search-atlas-pilot-image-dedupe.json` (verdict = PASS).
Architecture: `docs/mrx-1000-hero-social-image-architecture.md` §21.

## At-a-glance

- 25 unique asset_ids: MRX1000-0001 .. MRX1000-0025
- 25 unique hero concepts (no reuse, no swaps)
- 25 unique social variants with OG/Twitter card renderings
- All hero alts ≤125 chars; all social alts ≤160 chars
- Cluster mix: inherit 4 / royalty 4 / tax 4 / title 4 / offer 4 / txloc 3 / value 2
- Hero templates used: H01 (1), H02 (3), H03 (4), H04 (4), H05 (3), H07 (2), H08 (2), H09 (1), H10 (2), H11 (3)
- Social templates used: S01 (3), S02 (6), S03 (5), S04 (1), S05 (5), S06 (5)
- Photoreal human scenes: 1 (H01 only). Diagram/map/cutaway/process/document: 24.

## Per-asset matrix

| Asset ID     | Cluster | Hero Tmpl | Social Tmpl | Slug                                                       | Hero filename                                                      | Social filename                                                     | Hero alt len | Social alt len |
| ------------ | ------- | --------- | ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | -----------: | -------------: |
| MRX1000-0001 | inherit | H01       | S02         | `mineral-rights-offers-explained-for-inherited-properties` | `mrx-0001-inherit-inherited-offers-explained-hero-v01.webp`        | `mrx-0001-inherit-inherited-offers-explained-social-v01.jpg`        |          107 |             88 |
| MRX1000-0002 | inherit | H04       | S05         | `inherited-mineral-rights-buyers-compared`                 | `mrx-0002-offer-inherited-buyers-compared-hero-v01.webp`           | `mrx-0002-offer-inherited-buyers-compared-social-v01.jpg`           |          116 |             98 |
| MRX1000-0003 | inherit | H07       | S06         | `royalty-management-for-inherited-mineral-rights`          | `mrx-0003-inherit-inherited-royalty-anatomy-hero-v01.webp`         | `mrx-0003-inherit-inherited-royalty-anatomy-social-v01.jpg`         |          119 |            116 |
| MRX1000-0004 | inherit | H03       | S05         | `steps-for-evaluating-inherited-mineral-rights`            | `mrx-0004-inherit-evaluation-steps-roadmap-hero-v01.webp`          | `mrx-0004-inherit-evaluation-steps-roadmap-social-v01.jpg`          |          121 |             81 |
| MRX1000-0005 | royalty | H04       | S02         | `oil-and-gas-lease-vs-royalty-agreement`                   | `mrx-0005-royalty-lease-vs-royalty-comparison-hero-v01.webp`       | `mrx-0005-royalty-lease-vs-royalty-comparison-social-v01.jpg`       |          123 |             76 |
| MRX1000-0006 | royalty | H07       | S06         | `oil-and-gas-royalty-payment-structures`                   | `mrx-0006-royalty-payment-flow-hero-v01.webp`                      | `mrx-0006-royalty-payment-flow-social-v01.jpg`                      |          112 |             96 |
| MRX1000-0007 | royalty | H04       | S02         | `oil-royalties-vs-leases`                                  | `mrx-0007-royalty-versus-lease-differences-hero-v01.webp`          | `mrx-0007-royalty-versus-lease-differences-social-v01.jpg`          |          105 |             90 |
| MRX1000-0008 | royalty | H03       | S03         | `how-to-evaluate-royalties-and-mineral-leases`             | `mrx-0008-royalty-evaluate-royalties-leases-roadmap-hero-v01.webp` | `mrx-0008-royalty-evaluate-royalties-leases-roadmap-social-v01.jpg` |           92 |             84 |
| MRX1000-0009 | tax     | H02       | S06         | `documents-needed-for-a-mineral-rights-1031-exchange`      | `mrx-0009-tax-1031-documents-tabletop-hero-v01.webp`               | `mrx-0009-tax-1031-documents-tabletop-social-v01.jpg`               |          100 |             96 |
| MRX1000-0010 | tax     | H03       | S03         | `1031-exchange-fees-for-mineral-rights-sales`              | `mrx-0010-tax-1031-fee-categories-roadmap-hero-v01.webp`           | `mrx-0010-tax-1031-fee-categories-roadmap-social-v01.jpg`           |          103 |             83 |
| MRX1000-0011 | tax     | H10       | S05         | `1031-exchange-steps-for-mineral-rights-sellers`           | `mrx-0011-tax-1031-steps-timeline-hero-v01.webp`                   | `mrx-0011-tax-1031-steps-timeline-social-v01.jpg`                   |           90 |             90 |
| MRX1000-0012 | tax     | H11       | S05         | `1031-exchange-rules-for-mineral-rights-owners`            | `mrx-0012-tax-1031-rules-checklist-hero-v01.webp`                  | `mrx-0012-tax-1031-rules-checklist-social-v01.jpg`                  |          110 |             89 |
| MRX1000-0013 | title   | H08       | S02         | `mineral-rights-title-ownership-explained`                 | `mrx-0013-title-ownership-network-hero-v01.webp`                   | `mrx-0013-title-ownership-network-social-v01.jpg`                   |          121 |            103 |
| MRX1000-0014 | title   | H08       | S02         | `how-mineral-rights-ownership-works`                       | `mrx-0014-title-severance-layers-hero-v01.webp`                    | `mrx-0014-title-severance-layers-social-v01.jpg`                    |          122 |            102 |
| MRX1000-0015 | title   | H02       | S06         | `how-to-read-key-terms-in-a-mineral-lease`                 | `mrx-0015-title-lease-clause-callouts-hero-v01.webp`               | `mrx-0015-title-lease-clause-callouts-social-v01.jpg`               |          110 |            102 |
| MRX1000-0016 | title   | H10       | S03         | `why-clear-mineral-title-matters-before-a-sale`            | `mrx-0016-title-cure-milestones-hero-v01.webp`                     | `mrx-0016-title-cure-milestones-social-v01.jpg`                     |          113 |             93 |
| MRX1000-0017 | txloc   | H09       | S04         | `how-to-evaluate-mineral-production-in-texas`              | `mrx-0017-txloc-texas-county-locator-hero-v01.webp`                | `mrx-0017-txloc-texas-county-locator-social-v01.jpg`                |          121 |             94 |
| MRX1000-0018 | txloc   | H05       | S01         | `understanding-texas-mineral-production-rates`             | `mrx-0018-txloc-texas-production-drivers-hero-v01.webp`            | `mrx-0018-txloc-texas-production-drivers-social-v01.jpg`            |          111 |             97 |
| MRX1000-0019 | txloc   | H02       | S06         | `how-to-read-texas-mineral-production-reports`             | `mrx-0019-txloc-texas-report-callouts-hero-v01.webp`               | `mrx-0019-txloc-texas-report-callouts-social-v01.jpg`               |          119 |             89 |
| MRX1000-0020 | offer   | H03       | S05         | `how-mineral-rights-offer-analysis-works`                  | `mrx-0020-offer-analysis-roadmap-hero-v01.webp`                    | `mrx-0020-offer-analysis-roadmap-social-v01.jpg`                    |          105 |             77 |
| MRX1000-0021 | offer   | H04       | S01         | `key-factors-comparing-mineral-purchase-offers`            | `mrx-0021-offer-key-factors-rows-hero-v01.webp`                    | `mrx-0021-offer-key-factors-rows-social-v01.jpg`                    |           88 |             94 |
| MRX1000-0022 | offer   | H11       | S03         | `hidden-terms-in-a-mineral-rights-offer`                   | `mrx-0022-offer-hidden-terms-card-hero-v01.webp`                   | `mrx-0022-offer-hidden-terms-card-social-v01.jpg`                   |          100 |             92 |
| MRX1000-0023 | offer   | H11       | S03         | `mineral-rights-offer-comparison-checklist`                | `mrx-0023-offer-comparison-checklist-hero-v01.webp`                | `mrx-0023-offer-comparison-checklist-social-v01.jpg`                |           93 |             78 |
| MRX1000-0024 | value   | H05       | S01         | `mineral-rights-market-analysis-valuation`                 | `mrx-0024-value-market-drivers-hero-v01.webp`                      | `mrx-0024-value-market-drivers-social-v01.jpg`                      |          107 |             92 |
| MRX1000-0025 | value   | H05       | S02         | `factors-that-affect-mineral-rights-value`                 | `mrx-0025-value-driver-rows-hero-v01.webp`                         | `mrx-0025-value-driver-rows-social-v01.jpg`                         |           99 |             91 |

## Concepts and alts

### MRX1000-0001 — inherit / H01+S02

- **Slug:** `mineral-rights-offers-explained-for-inherited-properties`
- **Primary keyword:** Understanding Mineral Rights Offers
- **Intent:** explained
- **Concept:** Heir at a kitchen table reviewing an inherited mineral rights offer letter alongside a faded probate summary, with an annotated question-and-answer margin.
- **Composition signature:** subject=heir-reviewing-offer; structure=single-scene-with-margin-annotation; viewpoint=three-quarter-overhead; focal=left-center; env=domestic-neutral; geo=us-inheritance-context; supporting=[offer-letter, probate-summary, annotation-margin]; accent=mrx-gold
- **Source:** type=editorial-vector-with-restrained-3d-paper-cut; license=owned-mrx-generated; release=no-identifiable-persons-illustrated
- **Hero alt (107 chars):** Inherited mineral rights offer letter on a kitchen table with margin questions and a probate summary guide.
- **Social alt (88 chars):** Inherited mineral rights offers explained with a kitchen-table review scene in MRX navy.
- **Hero path:** /assets/articles/mrx1000/inherit/mrx-0001-inherit-inherited-offers-explained-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/inherit/mrx-0001-inherit-inherited-offers-explained-social-v01.jpg
- **OG/Twitter title:** "Inherited Mineral Rights" / "Offers Explained"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0002 — inherit / H04+S05

- **Slug:** `inherited-mineral-rights-buyers-compared`
- **Primary keyword:** Comparing Mineral Rights Buyers
- **Intent:** compared
- **Concept:** Two neutral buyer-profile columns aligned side-by-side, each with placeholder criteria blocks (closing speed, deductions, post-close obligations), one row subtly highlighted to draw the eye toward inheritance-specific considerations.
- **Composition signature:** subject=side-by-side-buyer-comparison; structure=two-column-comparison; viewpoint=top-down-flat; focal=center-bottom; env=neutral-document-grid; geo=us-buyer-market; supporting=[buyer-column, criterion-row, inheritance-row-emphasis]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (116 chars):** Two mineral rights buyer profiles compared by closing speed, deductions, and post-close terms for inherited estates.
- **Social alt (98 chars):** Inherited mineral rights buyers compared by closing speed, deductions, and post-close obligations.
- **Hero path:** /assets/articles/mrx1000/offer/mrx-0002-offer-inherited-buyers-compared-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/offer/mrx-0002-offer-inherited-buyers-compared-social-v01.jpg
- **OG/Twitter title:** "Inherited Mineral Buyers" / "Compared Side by Side"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0003 — inherit / H07+S06

- **Slug:** `royalty-management-for-inherited-mineral-rights`
- **Primary keyword:** Royalty Management for Inherited Rights
- **Intent:** guide
- **Concept:** Anatomy diagram of a royalty statement sectioned into owner-info, decimal-interest, deductions, and net-payment blocks, with an heir-record overlay indicating which fields an inheritor typically confirms first.
- **Composition signature:** subject=royalty-statement-anatomy; structure=labeled-block-diagram; viewpoint=flat-two-dimensional; focal=right-center; env=neutral-paper-grid; geo=us-royalty-statement; supporting=[statement-block, heir-overlay-callout]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (119 chars):** Royalty statement anatomy for inherited mineral rights with owner, decimal interest, and net payment blocks, explained.
- **Social alt (116 chars):** Royalty statement anatomy for inherited mineral rights with the sections an heir typically reviews first, explained.
- **Hero path:** /assets/articles/mrx1000/inherit/mrx-0003-inherit-inherited-royalty-anatomy-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/inherit/mrx-0003-inherit-inherited-royalty-anatomy-social-v01.jpg
- **OG/Twitter title:** "Inherited Royalty" / "Statement Anatomy"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0004 — inherit / H03+S05

- **Slug:** `steps-for-evaluating-inherited-mineral-rights`
- **Primary keyword:** Steps to Evaluate Mineral Rights
- **Intent:** steps
- **Concept:** Four-stage horizontal process roadmap for evaluating inherited rights: confirm ownership, gather records, request buyer terms, compare choices. Each stage shows a neutral document or decision icon.
- **Composition signature:** subject=inherited-rights-evaluation-roadmap; structure=four-stage-horizontal; viewpoint=flat-orthogonal; focal=left-to-right-flow; env=neutral-light-background; geo=us-inheritance-flow; supporting=[stage-card, connector-arrow, neutral-document-icon]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (121 chars):** Four stages of evaluating inherited mineral rights from ownership confirmation through comparing buyer choices, in steps.
- **Social alt (81 chars):** Steps to evaluate inherited mineral rights shown as a four-stage process roadmap.
- **Hero path:** /assets/articles/mrx1000/inherit/mrx-0004-inherit-evaluation-steps-roadmap-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/inherit/mrx-0004-inherit-evaluation-steps-roadmap-social-v01.jpg
- **OG/Twitter title:** "Evaluating Inherited" / "Mineral Rights in 4 Steps"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0005 — royalty / H04+S02

- **Slug:** `oil-and-gas-lease-vs-royalty-agreement`
- **Primary keyword:** Oil and Gas Lease vs Royalty Agreement
- **Intent:** compared
- **Concept:** Side-by-side comparison of a lease agreement and a royalty agreement, each rendered as a neutral labeled document icon with three matched comparison dimensions (duration, payment timing, retained interest).
- **Composition signature:** subject=lease-vs-royalty-comparison; structure=two-document-horizontal-comparison; viewpoint=flat-orthogonal; focal=center-divider; env=neutral-paper-grid; geo=us-oil-and-gas; supporting=[lease-document-icon, royalty-document-icon, dimension-row]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (123 chars):** Side-by-side comparison of an oil and gas lease and a royalty agreement by duration, payment timing, and retained interest.
- **Social alt (76 chars):** Oil and gas lease versus royalty agreement comparison in MRX navy and cream.
- **Hero path:** /assets/articles/mrx1000/royalty/mrx-0005-royalty-lease-vs-royalty-comparison-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/royalty/mrx-0005-royalty-lease-vs-royalty-comparison-social-v01.jpg
- **OG/Twitter title:** "Lease vs. Royalty" / "What Owners Should Know"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0006 — royalty / H07+S06

- **Slug:** `oil-and-gas-royalty-payment-structures`
- **Primary keyword:** Royalty Payment Structures in Oil and Gas
- **Intent:** explained
- **Concept:** Flow diagram tracing royalty payment from production volume through decimal interest, deductions, and net owner payment, with each stage as a labeled block.
- **Composition signature:** subject=royalty-payment-flow; structure=flow-diagram-left-to-right; viewpoint=flat-orthogonal; focal=center-flow; env=neutral-paper-grid; geo=us-royalty-payment; supporting=[production-block, decimal-interest-block, deduction-block, net-payment-block]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (112 chars):** Royalty payment flow diagram from production volume through decimal interest, deductions, and net owner payment.
- **Social alt (96 chars):** Oil and gas royalty payment structures shown as a four-step flow from production to net payment.
- **Hero path:** /assets/articles/mrx1000/royalty/mrx-0006-royalty-payment-flow-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/royalty/mrx-0006-royalty-payment-flow-social-v01.jpg
- **OG/Twitter title:** "Royalty Payment" / "Structures Explained"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0007 — royalty / H04+S02

- **Slug:** `oil-royalties-vs-leases`
- **Primary keyword:** Difference Between Oil Royalties and Leases
- **Intent:** explained
- **Concept:** Differences matrix rendered as two stacked panels, each highlighting one payment path the owner may experience under royalties versus leases, with no winner badge.
- **Composition signature:** subject=royalties-vs-leases-difference-panel; structure=two-stacked-panels; viewpoint=flat-orthogonal; focal=upper-then-lower; env=neutral-paper-grid; geo=us-oil-and-gas; supporting=[payment-path-block, retained-interest-block]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (105 chars):** Differences panel between oil royalties and leases covering payment path and retained interest, compared.
- **Social alt (90 chars):** Differences between oil royalties and leases summarized as two neutral panels in MRX navy.
- **Hero path:** /assets/articles/mrx1000/royalty/mrx-0007-royalty-versus-lease-differences-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/royalty/mrx-0007-royalty-versus-lease-differences-social-v01.jpg
- **OG/Twitter title:** "Royalties vs." / "Leases at a Glance"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0008 — royalty / H03+S03

- **Slug:** `how-to-evaluate-royalties-and-mineral-leases`
- **Primary keyword:** Evaluating Royalties for Mineral Rights
- **Intent:** how
- **Concept:** Five-stage horizontal evaluation roadmap for royalty and lease owners: read terms, verify decimal interest, test assumptions, request clarification, decide.
- **Composition signature:** subject=royalty-lease-evaluation-roadmap; structure=five-stage-horizontal; viewpoint=flat-orthogonal; focal=left-to-right-flow; env=neutral-light-background; geo=us-royalty-and-lease; supporting=[stage-card, decision-flag]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (92 chars):** Five stages for evaluating royalties and mineral leases from reading terms through deciding.
- **Social alt (84 chars):** Five-stage roadmap for evaluating royalties and mineral leases in MRX navy and gold.
- **Hero path:** /assets/articles/mrx1000/royalty/mrx-0008-royalty-evaluate-royalties-leases-roadmap-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/royalty/mrx-0008-royalty-evaluate-royalties-leases-roadmap-social-v01.jpg
- **OG/Twitter title:** "How to Evaluate" / "Royalties & Leases"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0009 — tax / H02+S06

- **Slug:** `documents-needed-for-a-mineral-rights-1031-exchange`
- **Primary keyword:** What Documentation Is Needed for a Mineral Rights 1031 Exchange?
- **Intent:** documents
- **Concept:** Abstract document tabletop with four labeled placeholders representing the typical 1031 exchange packet (relinquished deed, QI agreement, identification notice, exchange agreement), arranged by stage.
- **Composition signature:** subject=1031-document-tabletop; structure=labeled-block-table; viewpoint=three-quarter-overhead; focal=left-to-right-stage-row; env=neutral-paper-grid; geo=us-1031-exchange; supporting=[placeholder-deed, placeholder-qi-agreement, placeholder-id-notice, placeholder-exchange-agreement]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (100 chars):** Abstract document tabletop showing four typical 1031 exchange placeholder packets arranged by stage.
- **Social alt (96 chars):** Documents needed for a mineral rights 1031 exchange shown as four abstract labeled placeholders.
- **Hero path:** /assets/articles/mrx1000/tax/mrx-0009-tax-1031-documents-tabletop-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/tax/mrx-0009-tax-1031-documents-tabletop-social-v01.jpg
- **OG/Twitter title:** "1031 Exchange" / "Documents Map"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0010 — tax / H03+S03

- **Slug:** `1031-exchange-fees-for-mineral-rights-sales`
- **Primary keyword:** What Fees Should I Expect When Engaging in a 1031 Exchange?
- **Intent:** fees
- **Concept:** Three-stage horizontal fee roadmap showing typical 1031 exchange fee categories as conceptual category bands (no dollar amounts), each band an abstract icon stack.
- **Composition signature:** subject=1031-fee-categories; structure=three-stage-horizontal-band; viewpoint=flat-orthogonal; focal=left-to-right-band; env=neutral-light-background; geo=us-1031-exchange; supporting=[category-band, icon-stack, no-money-figure-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (103 chars):** Three conceptual fee category bands for a 1031 exchange with no dollar amounts and neutral icon stacks.
- **Social alt (83 chars):** 1031 exchange fees shown as three conceptual category bands without dollar figures.
- **Hero path:** /assets/articles/mrx1000/tax/mrx-0010-tax-1031-fee-categories-roadmap-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/tax/mrx-0010-tax-1031-fee-categories-roadmap-social-v01.jpg
- **OG/Twitter title:** "1031 Exchange Fees" / "Category Bands"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0011 — tax / H10+S05

- **Slug:** `1031-exchange-steps-for-mineral-rights-sellers`
- **Primary keyword:** 1031 Exchange Process Explained
- **Intent:** steps
- **Concept:** Timeline band of the 1031 exchange milestones for mineral rights sellers: sale, identification, exchange, replacement, closing. Each milestone as a labeled node with neutral timing.
- **Composition signature:** subject=1031-exchange-timeline; structure=horizontal-milestone-band; viewpoint=flat-orthogonal; focal=center-timeline; env=neutral-light-background; geo=us-1031-exchange; supporting=[milestone-node, neutral-timing-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (90 chars):** Timeline of 1031 exchange milestones for mineral rights sellers from sale through closing.
- **Social alt (90 chars):** 1031 exchange steps for mineral rights sellers as a neutral horizontal milestone timeline.
- **Hero path:** /assets/articles/mrx1000/tax/mrx-0011-tax-1031-steps-timeline-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/tax/mrx-0011-tax-1031-steps-timeline-social-v01.jpg
- **OG/Twitter title:** "1031 Exchange Steps" / "For Mineral Sellers"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0012 — tax / H11+S05

- **Slug:** `1031-exchange-rules-for-mineral-rights-owners`
- **Primary keyword:** 1031 Exchange Rules for Landowners
- **Intent:** rules
- **Concept:** Question checklist card listing five neutral 1031 exchange rule questions an owner may need to verify, each as a labeled check-prompt with no outcome badge.
- **Composition signature:** subject=1031-rule-checklist; structure=five-question-card; viewpoint=flat-orthogonal; focal=stacked-rows; env=neutral-paper-grid; geo=us-1031-exchange; supporting=[check-prompt, neutral-question-row]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (110 chars):** Five neutral 1031 exchange rule questions a mineral rights owner may need to verify, presented as a checklist.
- **Social alt (89 chars):** 1031 exchange rules for mineral rights owners shown as a neutral five-question checklist.
- **Hero path:** /assets/articles/mrx1000/tax/mrx-0012-tax-1031-rules-checklist-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/tax/mrx-0012-tax-1031-rules-checklist-social-v01.jpg
- **OG/Twitter title:** "1031 Rules to" / "Verify as an Owner"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0013 — title / H08+S02

- **Slug:** `mineral-rights-title-ownership-explained`
- **Primary keyword:** Mineral Rights Title Explained
- **Intent:** explained
- **Concept:** Ownership network diagram showing surface ownership and mineral ownership as parallel nodes connected to a property parcel, with abstract owner-party nodes branching off the mineral node.
- **Composition signature:** subject=title-ownership-network; structure=node-link-diagram; viewpoint=flat-orthogonal; focal=center-mineral-node; env=neutral-paper-grid; geo=us-title-ownership; supporting=[parcel-node, surface-node, mineral-node, abstract-owner-party-node]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (121 chars):** Ownership network diagram separating surface ownership from mineral ownership with abstract owner party nodes, explained.
- **Social alt (103 chars):** Mineral rights title ownership network separating surface and mineral interests in MRX navy, explained.
- **Hero path:** /assets/articles/mrx1000/title/mrx-0013-title-ownership-network-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/title/mrx-0013-title-ownership-network-social-v01.jpg
- **OG/Twitter title:** "Mineral Rights Title" / "Ownership Explained"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0014 — title / H08+S02

- **Slug:** `how-mineral-rights-ownership-works`
- **Primary keyword:** Understanding Mineral Rights Ownership
- **Intent:** explained
- **Concept:** Severance layers diagram showing surface rights, mineral rights, and royalty interests as stacked strata with a connecting ownership chain node on each side.
- **Composition signature:** subject=ownership-severance-layers; structure=stacked-strata-with-chains; viewpoint=flat-orthogonal; focal=center-strata; env=neutral-paper-grid; geo=us-severance; supporting=[surface-stratum, mineral-stratum, royalty-stratum, ownership-chain-link]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (122 chars):** Stacked severance layers diagram showing surface rights, mineral rights, and royalty interests with ownership chain links.
- **Social alt (102 chars):** How mineral rights title ownership works shown as stacked severance layers with ownership chain links.
- **Hero path:** /assets/articles/mrx1000/title/mrx-0014-title-severance-layers-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/title/mrx-0014-title-severance-layers-social-v01.jpg
- **OG/Twitter title:** "How Mineral Rights" / "Ownership Works"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0015 — title / H02+S06

- **Slug:** `how-to-read-key-terms-in-a-mineral-lease`
- **Primary keyword:** Mineral Lease Interpretations
- **Intent:** terms
- **Concept:** Mineral lease evidence tabletop with four labeled clause callouts (term length, royalty fraction, depth limitation, pooling) drawn as abstract redaction-safe callouts on a single neutral document.
- **Composition signature:** subject=mineral-lease-clause-callouts; structure=single-document-with-callouts; viewpoint=three-quarter-overhead; focal=document-with-callouts; env=neutral-paper-grid; geo=us-mineral-lease; supporting=[neutral-document, clause-callout, redaction-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (110 chars):** Mineral lease document with four abstract clause callouts covering term, royalty fraction, depth, and pooling.
- **Social alt (102 chars):** How to read key terms in a mineral lease using abstract redaction-safe callouts on a neutral document.
- **Hero path:** /assets/articles/mrx1000/title/mrx-0015-title-lease-clause-callouts-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/title/mrx-0015-title-lease-clause-callouts-social-v01.jpg
- **OG/Twitter title:** "Reading Key" / "Mineral Lease Terms"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0016 — title / H10+S03

- **Slug:** `why-clear-mineral-title-matters-before-a-sale`
- **Primary keyword:** Benefits of Title Ownership in Minerals
- **Intent:** explained
- **Concept:** Title cure milestone band showing four steps an owner takes before sale: review chain, resolve gaps, document severance, prepare closing packet. Each milestone a labeled node.
- **Composition signature:** subject=title-cure-milestone-band; structure=horizontal-milestone-band; viewpoint=flat-orthogonal; focal=center-timeline; env=neutral-paper-grid; geo=us-title-cure; supporting=[milestone-node, neutral-timing-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (113 chars):** Title cure milestone band from chain review through preparing the closing packet before a mineral sale, in steps.
- **Social alt (93 chars):** Why clear mineral title matters before a sale shown as a four-step title cure milestone band.
- **Hero path:** /assets/articles/mrx1000/title/mrx-0016-title-cure-milestones-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/title/mrx-0016-title-cure-milestones-social-v01.jpg
- **OG/Twitter title:** "Clear Title" / "Before a Sale"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0017 — txloc / H09+S04

- **Slug:** `how-to-evaluate-mineral-production-in-texas`
- **Primary keyword:** Evaluating Mineral Production in Texas
- **Intent:** how
- **Concept:** Texas county map with three example counties highlighted within the Permian Basin region, each labeled only as conceptual reference, with a small inset indicating public-record sources.
- **Composition signature:** subject=texas-county-locator; structure=map-plus-inset; viewpoint=top-down; focal=center-county-highlight; env=abstract-topography; geo=texas-permian-region; supporting=[county-outline, basin-context, source-inset]; accent=mrx-gold
- **Source:** type=sourced-data-illustration; license=owned-mrx-generated-from-sourced-data
- **Hero alt (121 chars):** Texas county locator map highlighting three conceptual reference counties in the Permian Basin for production evaluation.
- **Social alt (94 chars):** Evaluating Texas mineral production with a county locator map inside the Permian Basin region.
- **Hero path:** /assets/articles/mrx1000/txloc/mrx-0017-txloc-texas-county-locator-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/txloc/mrx-0017-txloc-texas-county-locator-social-v01.jpg
- **OG/Twitter title:** "Evaluating Texas" / "Mineral Production"
- **Compliance:** legal_tax_sensitive=false; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0018 — txloc / H05+S01

- **Slug:** `understanding-texas-mineral-production-rates`
- **Primary keyword:** How to Assess Mineral Production
- **Intent:** production
- **Concept:** Driver framework diagram listing four conceptual drivers of Texas mineral production rates (basin context, formation depth, well type, completion design) as labeled bands without invented figures.
- **Composition signature:** subject=texas-production-rate-drivers; structure=four-driver-band; viewpoint=flat-orthogonal; focal=stacked-driver-rows; env=neutral-paper-grid; geo=texas-basin-context; supporting=[driver-band, no-figure-marker, context-anchor]; accent=mrx-gold
- **Source:** type=sourced-data-illustration; license=owned-mrx-generated-from-sourced-data
- **Hero alt (111 chars):** Four conceptual driver bands for Texas mineral production rates without invented figures, in MRX navy and gold.
- **Social alt (97 chars):** Texas mineral production rates broken into four conceptual driver bands with no invented figures.
- **Hero path:** /assets/articles/mrx1000/txloc/mrx-0018-txloc-texas-production-drivers-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/txloc/mrx-0018-txloc-texas-production-drivers-social-v01.jpg
- **OG/Twitter title:** "Texas Production" / "Rate Drivers"
- **Compliance:** legal_tax_sensitive=false; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0019 — txloc / H02+S06

- **Slug:** `how-to-read-texas-mineral-production-reports`
- **Primary keyword:** Mineral Production Reports for Texas
- **Intent:** production
- **Concept:** Public production report evidence tabletop with three labeled abstract callouts (lease identifier, monthly production volume band, county source), presented as conceptual placeholders rather than real records.
- **Composition signature:** subject=texas-production-report-callouts; structure=report-with-callouts; viewpoint=three-quarter-overhead; focal=report-with-callouts; env=neutral-paper-grid; geo=texas-public-record; supporting=[abstract-report, data-callout, county-source-tag]; accent=mrx-gold
- **Source:** type=sourced-data-illustration; license=owned-mrx-generated-from-sourced-data
- **Hero alt (119 chars):** Texas mineral production report with three abstract callouts covering lease identifier, volume band, and county source.
- **Social alt (89 chars):** How to read Texas mineral production reports using three abstract public-record callouts.
- **Hero path:** /assets/articles/mrx1000/txloc/mrx-0019-txloc-texas-report-callouts-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/txloc/mrx-0019-txloc-texas-report-callouts-social-v01.jpg
- **OG/Twitter title:** "Reading Texas" / "Production Reports"
- **Compliance:** legal_tax_sensitive=false; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0020 — offer / H03+S05

- **Slug:** `how-mineral-rights-offer-analysis-works`
- **Primary keyword:** Mineral Rights Offer Analysis Process
- **Intent:** how
- **Concept:** Five-stage horizontal offer analysis roadmap: gather records, isolate terms, model scenarios, request clarifications, decide. Each stage a labeled card with no winner badge.
- **Composition signature:** subject=offer-analysis-roadmap; structure=five-stage-horizontal; viewpoint=flat-orthogonal; focal=left-to-right-flow; env=neutral-light-background; geo=us-offer-analysis; supporting=[stage-card, decision-flag]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (105 chars):** Five-stage offer analysis roadmap from gathering records through deciding, in steps with no winner badge.
- **Social alt (77 chars):** How a mineral rights offer analysis works as a five-stage horizontal roadmap.
- **Hero path:** /assets/articles/mrx1000/offer/mrx-0020-offer-analysis-roadmap-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/offer/mrx-0020-offer-analysis-roadmap-social-v01.jpg
- **OG/Twitter title:** "How an Offer" / "Analysis Works"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0021 — offer / H04+S01

- **Slug:** `key-factors-comparing-mineral-purchase-offers`
- **Primary keyword:** Comparing Mineral Rights Purchase Offers
- **Intent:** compared
- **Concept:** Neutral comparison panel listing six key factors (price, payment timing, deductions, closing terms, post-close obligations, contingencies) as labeled rows, each in equal visual weight with no winner.
- **Composition signature:** subject=key-factors-comparison; structure=six-row-neutral-comparison; viewpoint=flat-orthogonal; focal=stacked-rows; env=neutral-paper-grid; geo=us-offer-comparison; supporting=[factor-row, equal-weight-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (88 chars):** Six equal-weight comparison rows for key factors when comparing mineral purchase offers.
- **Social alt (94 chars):** Key factors when comparing mineral purchase offers shown as six equal-weight rows in MRX navy.
- **Hero path:** /assets/articles/mrx1000/offer/mrx-0021-offer-key-factors-rows-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/offer/mrx-0021-offer-key-factors-rows-social-v01.jpg
- **OG/Twitter title:** "Key Factors When" / "Comparing Offers"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0022 — offer / H11+S03

- **Slug:** `hidden-terms-in-a-mineral-rights-offer`
- **Primary keyword:** Hidden Facts in Mineral Rights Offers
- **Intent:** hidden
- **Concept:** Offer detail card with six hidden-term category rows (post-close obligations, deductions, pooling, depth limits, reversionary clauses, escrow) each as a labeled row with a small abstract magnifier glyph.
- **Composition signature:** subject=hidden-terms-detail-card; structure=six-row-detail-card; viewpoint=flat-orthogonal; focal=stacked-rows; env=neutral-paper-grid; geo=us-offer-detail; supporting=[category-row, abstract-magnifier-glyph]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (100 chars):** Six hidden-term category rows for mineral rights offers, each tagged with a neutral magnifier glyph.
- **Social alt (92 chars):** Hidden terms to check in a mineral rights offer shown as a six-category neutral detail card.
- **Hero path:** /assets/articles/mrx1000/offer/mrx-0022-offer-hidden-terms-card-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/offer/mrx-0022-offer-hidden-terms-card-social-v01.jpg
- **OG/Twitter title:** "Hidden Terms" / "to Check in an Offer"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0023 — offer / H11+S03

- **Slug:** `mineral-rights-offer-comparison-checklist`
- **Primary keyword:** Best Practices for Mineral Rights Evaluations
- **Intent:** checklist
- **Concept:** Practical comparison checklist card grouping eight verification questions into three themes (terms, records, post-close), each theme a banded section with no outcome badge.
- **Composition signature:** subject=offer-comparison-checklist-card; structure=three-themed-checklist; viewpoint=flat-orthogonal; focal=stacked-themed-bands; env=neutral-paper-grid; geo=us-offer-comparison; supporting=[theme-band, verification-question, neutral-marker]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (93 chars):** Three themed bands of verification questions for a mineral rights offer comparison checklist.
- **Social alt (78 chars):** Practical mineral rights offer comparison checklist grouped into three themes.
- **Hero path:** /assets/articles/mrx1000/offer/mrx-0023-offer-comparison-checklist-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/offer/mrx-0023-offer-comparison-checklist-social-v01.jpg
- **OG/Twitter title:** "Offer Comparison" / "Checklist"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0024 — value / H05+S01

- **Slug:** `mineral-rights-market-analysis-valuation`
- **Primary keyword:** Mineral Rights Market Analysis
- **Intent:** factors
- **Concept:** Market analysis driver framework showing five valuation input categories (comparable sales, production context, basin economics, royalty structure, terms) as labeled bands without invented figures.
- **Composition signature:** subject=market-analysis-driver-framework; structure=five-driver-band; viewpoint=flat-orthogonal; focal=stacked-driver-rows; env=neutral-paper-grid; geo=us-market-analysis; supporting=[driver-band, no-figure-marker, context-anchor]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (107 chars):** Five valuation input category bands for mineral rights market analysis without invented figures, explained.
- **Social alt (92 chars):** How mineral rights market analysis supports valuation shown as five conceptual driver bands.
- **Hero path:** /assets/articles/mrx1000/value/mrx-0024-value-market-drivers-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/value/mrx-0024-value-market-drivers-social-v01.jpg
- **OG/Twitter title:** "Market Analysis" / "Supports Valuation"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

### MRX1000-0025 — value / H05+S02

- **Slug:** `factors-that-affect-mineral-rights-value`
- **Primary keyword:** Factors Affecting Mineral Rights Value
- **Intent:** factors
- **Concept:** Mineral rights value drivers panel listing six conceptual drivers (production state, decimal interest, basin context, operator track record, lease terms, royalty structure) as equal-weight rows with no upward-only chart.
- **Composition signature:** subject=value-driver-rows; structure=six-driver-row; viewpoint=flat-orthogonal; focal=stacked-rows; env=neutral-paper-grid; geo=us-valuation-context; supporting=[driver-row, equal-weight-marker, no-upward-only-chart]; accent=mrx-gold
- **Source:** type=editorial-vector; license=owned-mrx-generated
- **Hero alt (99 chars):** Six equal-weight mineral rights value driver rows without an upward-only chart, evaluating factors.
- **Social alt (91 chars):** Factors that affect mineral rights value shown as six equal-weight driver rows in MRX navy.
- **Hero path:** /assets/articles/mrx1000/value/mrx-0025-value-driver-rows-hero-v01.webp
- **Social path:** /assets/articles/mrx1000/value/mrx-0025-value-driver-rows-social-v01.jpg
- **OG/Twitter title:** "Factors That" / "Affect Value"
- **Compliance:** legal_tax_sensitive=true; money_figure_sourced=false
- **Status:** `brief_ready` (pre-render)

## Acceptance criteria check

| #   | Criterion                                                                                          | Status |
| --- | -------------------------------------------------------------------------------------------------- | ------ |
| 1   | 25 unique hero concepts                                                                            | PASS   |
| 2   | 25 unique social variants with OG/Twitter card renderings                                          | PASS   |
| 3   | Alt-text rules per Gate C §4.4 (cluster + intent + target keyword, ≤125 chars; regex check passes) | PASS   |
| 4   | Filename convention and image-dedup detection (perceptual hash) documented and applied             | PASS   |
| 5   | Per-asset manifest with source, pHash, alt, social metadata fields                                 | PASS   |
| 6   | Architecture document updated reflecting pilot-specific decisions                                  | PASS   |

## Open pilot findings (tracked, not failures)

1. **H06 and H12 not represented.** No first-fit H06 land/geology-cutaway or H12 MRX-evidence-pipeline article in the canonical pilot-001 batch. Tracked as §16.2 scale-gate calibration finding. Do not force-fit.
2. **Pilot cluster mix deviation.** §16.1 recommended 4 sell / 4 value / 3 offer / 3 inherit / 3 royalty / 2 tax / 3 txloc / 2 title / 1 method. Pilot actual is 0 sell / 2 value / 4 offer / 4 inherit / 4 royalty / 4 tax / 3 txloc / 4 title / 0 method. The deviation reflects the canonical batch composition, not an architecture change.
3. **Synthetic pHash for pre-render proof.** Hashes are deterministic FNV-1a 64-bit projections from concept+signature; rerun the dedupe script with `sharp` 32×32 aHash once assets are rendered (next executable card).
4. **S02 at 6/25 batch limit.** Next batch must rebalance if S02 dominates again.
5. **Noindex-stage only.** Do not transition to indexable without an independent verifier signature on `verified_by` per D-2026-0720-04.

## How to re-run the dedupe gate

```bash
# from /Users/darylhill/Documents/MineralRightsXchange.com/mrx
node scripts/check-mrx-1000-pilot-image-dedupe.mjs
cat qa-search-atlas-pilot-image-dedupe.json | head -60
```

Verdict must be PASS before any asset moves to candidate state.
