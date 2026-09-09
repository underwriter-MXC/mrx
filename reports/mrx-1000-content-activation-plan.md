# MRX1000 local content activation plan

Generated from the canonical 1,000-row ledger. This sidecar supplies a **local planning assignment** for each row's internal-link triangle, primary CTA, and appointment handoff. It does not claim those plans are implemented, and it does not edit article bodies/frontmatter, render links, publish routes, deploy, submit indexing, mutate a vendor, or authorize spend.

## Truth boundary

- Planned complete internal-link triangles: **1000**. Pillar and same-cluster sibling guidance exists in this local sidecar.
- Planned primary CTAs: **1000**. This is stage-appropriate nurture or appointment guidance, not rendered coverage.
- Planned appointment CTAs: **1000**. All rows have an explicit `/book/` MRX-team handoff; 375 education rows carry it as a secondary CTA after the primary guide CTA.
- Rendered triangles verified: **0**. No rendered coverage claim is made by this plan.
- Live triangles verified: **0**. No production coverage claim is made by this plan.

The source ledger contains 238 public routes, but source-route publication is tracked separately from rendered/live triangle evidence.

## Deterministic assignment

- Pillar URLs come from the canonical ledger and are checked against the nine cluster-to-pillar mappings.
- The sibling is the next `program_row_id` in the same cluster, wrapping cyclically. Every target is another canonical row; no self-link or cross-cluster target is allowed.
- Education rows use `/free-guide/` as the primary nurture CTA and receive a distinct secondary `/book/` team handoff. Consideration and decision rows use `/book/` as both their primary CTA and appointment handoff.
- Primary and appointment CTA labels, controlled analytics names, placement codes, and placement guidance are explicit per row. The row's funnel stage and search intent are retained in `assignment_basis`.

## Verification

- Rows: **1000**
- Unique row IDs: **1000**
- Unique canonical article URLs: **1000**
- Primary CTA plans: **1000**
- Appointment CTA plans: **1000**
- Appointment CTAs targeting `/book/`: **1000**
- Primary appointment CTAs: **625**
- Secondary appointment CTAs after primary nurture: **375**
- Invalid sibling targets: **0**
- Self sibling targets: **0**
- Cross-cluster sibling targets: **0**
- Noncanonical/non-trailing URLs: **0**
- Canonical-ledger row fingerprint verified: **PASS**
- Exact owner decision SHA-256 verified: **PASS**
- Numerical release cap applies: **false**
- Continuous quality gating active: **true**
- All invariants pass: **PASS**

## Primary CTA distribution

- `/book/`: 625
- `/free-guide/`: 375

- `closing_panel`: 275
- `contextual_inline`: 350
- `mid_article`: 375

## Appointment CTA distribution

- `/book/`: 1000

- `closing_panel`: 275
- `closing_team_handoff`: 375
- `contextual_inline`: 350

## Pillar distribution

- `inherited-mineral-rights`: 100
- `mineral-rights-taxes`: 100
- `mineral-rights-value`: 150
- `mrx-methodology`: 50
- `offer-review`: 125
- `oil-and-gas-royalties`: 100
- `sell-mineral-rights`: 150
- `texas-mineral-rights`: 150
- `title-lease-ownership`: 75

## Continuous quality gate

Owner decision `D-2026-0804-16` is `APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION`. It removes numerical release caps and elapsed-time gates while preserving article-specific editorial, factual, compliance, creative, build, rollback, and production-verification requirements. The exact decision SHA-256 was verified as `edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f`.

Canonical-ledger row fingerprint verified as `3ff1bd05b1af01d887cc316fb3a192d7e895e1eaafaaec125c05e56eff8ee796`.

Activation-plan content fingerprint: `7d460404c27edeb31cca7bab0ee2d0f548655babe179baf783e96e9ff2a07ba2`.
