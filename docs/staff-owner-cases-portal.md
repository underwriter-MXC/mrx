# Staff Owner Cases portal

The protected `/staff/` portal is the staff-only owner/inquiry database for MRX.

## Authentication and recovery

The `/staff/` portal supports direct Supabase email/password sign-in in the React island. Authentication alone does not grant staff data access: every staff API route still calls `requireStaff`, which requires an active row in `staff_profiles`, and owner-case detail/mutation routes also require `requireStaffCaseAccess` so non-admin staff remain limited to assigned cases.

First-time setup and forgot-password use Supabase Auth recovery email delivery through `resetPasswordForEmail`. The browser never creates, prints, logs, or transmits a generated password or recovery token. The recovery redirect is pinned to the live staff route, `https://mineralrightsxchange.com/staff/`, so a Supabase-authenticated recovery session lands on the production staff portal.

When Supabase emits a `PASSWORD_RECOVERY` auth event on `/staff/`, the portal shows a set-password form before loading case data. That form calls `supabase.auth.updateUser({ password })` from the authenticated recovery session, enforces a 12-character minimum in the browser, clears the recovery URL fragment from history after success, and then resumes the same role- and assignment-protected case loading path.

## Data model

Supabase remains the source of truth. The staff portal reads `profiles` and scoped child records for owner/contact details, mineral interests, owner facts, conversations, documents, appointments, staff assignments, private workspace fields, internal notes, and internal files.

The private workspace table is `public.internal_case_workspaces`. The forward-safe migration adds searchable operations fields:

- `status` — staff case status.
- `case_rating` — color-coded staff rating: `unrated`, `cold`, `warm`, `hot`, or `priority`.
- `opportunity_value_cents` and `opportunity_size_label` — opportunity value/size display.
- `mineral_rights_count` — explicit count when staff need to override inferred mineral-interest rows.
- `last_contact_at` — most recent human/GHL/contact date for staff sorting and display.
- `ghl_opportunity_id`, `ghl_pipeline_id`, `ghl_pipeline_stage_id`, `ghl_pipeline_name`, `ghl_pipeline_stage_name`, `ghl_pipeline_status` — real GHL identifiers and labels.

Internal notes/files remain staff-only. Owner account, chat, and export APIs must not select `internal_case_notes`, `internal_case_files`, `internal_case_workspaces`, `case_assignments`, or `staff_profiles`.

## API routes

- `GET /api/staff/cases` lists staff-accessible cases with full filter, sort, and pagination support. Query parameters:
  - `q` — free-text search across `first_name`, `last_name`, `email`, `phone`, `residence_city`, `residence_county`, `residence_state`.
  - `status`, `rating`, `priority`, `verification` — workspace enum filters (DB-first when applicable).
  - `mineralCounty`, `mineralState`, `mineralBasin`, `operator` — facet-driven mineral geography filters (any-interest match, owner appears once).
  - `mineralCountOp` + `mineralCount` — `>=` / `=` / `<=` against the effective mineral count (workspace override falls back to `mineral_interests.length`).
  - `hasOpenRisks` (`any` / `yes` / `no`) and `riskSeverityFloor` (`any` / `low+` / `medium+` / `high+` / `critical`) — derive from `internal_case_workspaces.risk_flags` with `open` or `reviewing` status.
  - `assigneeScope` (`any` / `me` / `anyone` / `unassigned`) — admin-only filtering unassigned cases.
  - `lastContactBucket` (`any` / `never` / `7d` / `30d` / `90d` / `over90`) — based on `internal_case_workspaces.last_contact_at` (never falls back to `last_seen_at`).
  - `recommendedFocus` (`any` / `missing` / `present`) and `focusSearch` — case-insensitive substring match on the `recommended_focus` text.
  - `sort` — `last_activity` (default), `last_contact_at`, `opportunity_value_cents`, `created_at`, `full_name`, `status`.
  - `page`, `pageSize` — server-enforced page navigation; defaults to page 1 with `pageSize=25`, max `pageSize=100`.
  - Unrecognised keys return `400 invalid_filter_<key>` and list every offending parameter in the `invalid` field; nothing is silently dropped.
  - Every list call writes a `staff_case_list_viewed` audit event with the full filter and pagination metadata.
  - The response envelope is `{ ok, staff, cases: [...], page: { total, returned, page, pageSize, totalPages }, facets, filters, sortKeys }` and every case carries a server-derived `semantics` payload (`workspaceExists`, `effectiveMineralCount`, `countSource`, unique geography/operator chips, `openRiskCount`, `maxOpenSeverity`, `assigneeLabel`, `ghlDisplay`, `valuationStatusLabel`).
- `GET /api/staff/cases/:profileId` returns the complete staff profile for one person after `requireStaffCaseAccess`.
- `PUT /api/staff/cases/:profileId/workspace` validates the editable dossier via zod and intentionally does **not** accept `valuation_status` — that field is underwriter/admin-only and is reserved for a future role-gated transition endpoint. A source-level comment names the underwriting gate so reviewers see the guard.
- Existing workspace, notes, files, documents, and assignments routes keep staff access checks and audit events.

Every staff list/profile/workspace change writes an audit event via `auditStaffCaseEvent`.

## GHL pipeline mapping

GHL IDs are never hard-coded as fake placeholders. Configure real values in server env when available:

`MRX_GHL_OWNER_CASE_STAGE_MAP_JSON`

Example shape:

```json
{
  "intake": {
    "pipelineId": "YOUR_GHL_PIPELINE_ID",
    "stageId": "YOUR_GHL_STAGE_ID",
    "pipelineName": "Prospects",
    "stageName": "Record Added"
  }
}
```

If this env var or the normal GHL secrets are absent, the portal still works. Staff can view and manage Supabase-backed cases, and GHL fields display as unmapped/blank instead of inventing IDs.

When GHL is configured and the profile has a real `ghl_contact_id`, saving a mapped case status upserts the matching GHL opportunity and monetary value. The server resolves configured IDs first and otherwise resolves the documented MRX pipeline/stage names from the live GHL account. A GHL outage never rolls back the Supabase case update; staff see `sync_failed`, `stage_unmapped`, `not_configured`, or `contact_not_linked` until the next save retries synchronization. GHL identifiers are server-owned and are not accepted from the browser form.

## Staff UI behavior

The portal is one protected backoffice shell with three views over the same canonical owner-case records:

- **Overview** — portfolio-level open value, active deals, cases needing attention, ready-for-review count, pipeline phase totals, GHL sync health, and assignment coverage.
- **Deals pipeline** — grouped operational phases for Prospect Qualification, Valuation & Offer Prep, Seller Conversion, and Outcomes & Exceptions. Each deal card shows rating, priority, MRX status, value, mineral-interest count, assignee, contact freshness, GHL sync state, and attention reasons. Staff can move a case through the canonical MRX statuses; the existing server-owned workspace route resolves and mirrors the approved GHL pipeline/stage mapping. Browser clients never submit GHL IDs.
- **Owner Cases** — the searchable database and complete individual profile workflow described below. Common search/status/rating controls remain visible while the full filter matrix is collapsed under **More filters**.

The shared shell exposes the signed-in staff identity/role, GHL sync exception count, internal-use-only notice, and sign-out action. Role and assignment protection remain server-enforced; navigation does not widen data access.

`GET /api/staff/dashboard` provides the dashboard and pipeline read model for up to 500 role-visible cases. It calls `requireStaff`, applies the same assignment restriction for non-admin staff, returns aggregate summary metrics and a minimal operational case projection, and intentionally excludes internal note/file bodies. Every dashboard read writes a `staff_dashboard_viewed` audit event.

The dashboard KPI definitions in this release are:

- **Active cases** — every visible case except `closed` and `lost`; `on_hold` remains an active internal exception.
- **Open opportunity value** — the sum of `opportunity_value_cents` for active cases.
- **Needs attention** — active cases with urgent priority, a high/critical open risk, no last contact, last contact older than 30 days, no assignee, or `ghl_pipeline_status = sync_failed`.
- **Value at risk** — open opportunity value for cases meeting the needs-attention definition.
- **Ready for review** — `status = ready_for_review`.
- **Offers in flight** — `offer_pending` or `offer_sent`.
- **Recently contacted** — explicit `last_contact_at` within seven days; never falls back to `last_seen_at`.

Advanced velocity metrics such as days in stage and conversion rates remain intentionally absent until MRX adds an audit-grade case status history model.

The filter bar exposes: search input, case status, rating, priority, verification, mineral county/state/basin/operator (facet-driven), min mineral interests (with operator), has open risks, open risk severity, has assignee (admin-only "Unassigned"), last-contact bucket, recommended focus, and a focus search field. Every filter maps to the corresponding `GET /api/staff/cases` query parameter.

The results region shows total/returned/totalPages counts, an `aria-live="polite"` count line, a sort selector (Last activity, Last contact, Opportunity value, Created, Name, Stage), and Prev/Next pagination when more than one page exists.

Each list row renders priority dot (with aria-label and `staff-case-row__priority--{high,urgent}` modifier), risk badge with severity text (e.g., `Risks: 3 (max: Critical)`), assignee label, last-contact chip with the explicit `Never contacted` fallback (never substitutes `last_seen_at`), a `GHL: <pipeline> · <stage>` chip (or `Not mapped`), and `aria-current="true"` on the selected row.

The profile view is split into labelled sections: **Identity & location**, **Case summary**, **GHL opportunity**, **Mineral interests**, **Risk flags**, **Workspace dossier**, **Notes & files**. Each section carries an `aria-labelledby` heading and a visually-hidden span exposing the source field. The Case summary cell exposes valuation status as a read-only display; the Workspace dossier surfaces a placeholder note that valuation transitions are underwriter-admin only and ship in the next release.

Profile data exposes:

- owner/contact/location metadata with the underlying source field annotated for assistive tech;
- start date, last contact (from `internal_case_workspaces.last_contact_at`), and last activity (`profiles.last_seen_at`) — last contact never falls back to last activity;
- color-coded rating and staff case status, priority, mineral rights count (effective count with source), opportunity value/size, and valuation status;
- GHL pipeline/opportunity data when configured or synced, or `Not mapped` text otherwise;
- mineral interests, geography chips (unique counties / states / operators), facts, conversations, documents, appointments, and assignments;
- staff-only workspace, notes, and internal files.

## Verification

Focused tests:

```bash
pnpm vitest run tests/unit/staff-case-review.spec.ts tests/unit/staff-workflow.spec.ts tests/unit/ghl-business-plan.spec.ts
```

Targeted typecheck (project-accepted equivalent of `pnpm run typecheck`, scoped to the changed files):

```bash
npx tsc --noEmit -p tsconfig.json
```

Broader release gates before production deployment remain the repo defaults: typecheck, lint, unit tests, build/compliance/legal-release gates, then verified production target checks per `AGENTS.md`. The release gate for this change is reviewer-approved because it touches a staff-only route that mutates the staff dossier.
