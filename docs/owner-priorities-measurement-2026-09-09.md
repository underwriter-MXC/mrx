# Owner decision resources: measurement contract

Scope: curate six existing public starter resources, improve the existing offer comparison worksheet, and make methodology and MRX's role visible. No article identity changes, verified human credential claims, database migration, or paid placement is part of this release.

## Milestones

The worksheet emits `offer_comparison_started`, `offer_comparison_questions_viewed`, `offer_comparison_print_requested`, and `offer_comparison_review_selected` once each per page lifetime. These are engagement milestones, not qualified leads or transactions. The final event means the user selected the fixed review link; it does not certify review, qualification, or an offer.

The dataLayer event contains only a fixed event name, tool version, and fixed page path. The Google tag event uses the same fixed name/version and a constant canonical page location with an empty referrer. No worksheet values, notes, acreage, totals, property details, calculated amounts, or query strings are attached by this event implementation. Inputs stay in the page and are cleared by the worksheet's reset button. Browser printing remains a user action. Existing sitewide analytics behavior is independent of this bounded event contract.

Verify delivery in GA4 before reporting these events as collected. Source dispatch and regression assertions prove implementation behavior; they do not prove GA4 ingestion or a configured key-event definition.

## Baseline and interpretation

Search Atlas GA4 property 540855585, verified hostname mineralrightsxchange.com, worldwide, August 9 through September 5, 2026: overview reported 5,801 sessions and 5,737 users; organic reported 22 sessions and 19 users. The returned event report contained generic site events and did not show the new worksheet milestones or downstream `case_ready` / `appointment_held`. Absence from that returned report is not proof of zero business outcomes. Search Atlas did not expose a confirmed GSC-to-GA mapping for this property.

The GSC response for the same dates reported 18 clicks and 2,552 impressions, but its summary CTR and device totals were inconsistent with the supplied breakdowns. Preserve the raw response in the execution evidence; do not combine those fields into an invented reconciled baseline.

## Qualified demand

`case_ready` currently means a packet was finalized through the staff RPC. It does not prove a commercially qualified opportunity. `appointment_held` depends on the completed appointment webhook and is not independently proven unique. Server GA delivery requires its existing configured measurement ID and API secret; this release does not create credentials.

Use verified CRM records to assess qualification, attended appointments, and completed transactions. The current dashboard's recorded opportunity amounts are not realized revenue. Do not multiply event counts by assumed deal values or report channel-attributed revenue without a verified join and reconciliation. The pending attribution/dedup database changes remain held outside this release.

## Review plan

After GA4 ingestion is verified, compare equal 28-day periods for organic landing-page sessions and worksheet milestones. Record actual observation windows and separate release-day QA traffic. Review search impressions/clicks by affected page and query without claiming causation from a short observation window. Assess qualified opportunities only after record-level verification. No ranking, AI citation, conversion, or revenue lift is claimed by this implementation.
