# Owner Cases searchable database / profile UX spec

Status: design v1, contract for `mrx_astro_builder` implementation parent `t_bc7b8fd3`.
Authority: `t_c2aa5254` (scope + G1–G7 release gates), `t_9f5de201` (GHL mapping), `t_fc166ce1` (underwriting contract).
Code context verified: `src/pages/staff/index.astro`, `src/components/react/StaffPortal.tsx`, `src/components/react/StaffPortal.css`, `src/components/react/AccountHub.css`, `src/pages/api/staff/cases.ts`, `src/pages/api/staff/cases/[profileId]/workspace.ts`, `src/lib/platform/staff.ts`, `supabase/migrations/20260720133000_mrx_internal_case_workspace.sql`, `tests/unit/staff-case-review.spec.ts`.

This spec is intentionally prescriptive so the builder can land v1 without re‑negotiating UX choices. It does not require a new design system; every class continues a pattern already in `StaffPortal.css` / `AccountHub.css`.

## 1. Goals & non‑goals

In scope (v1 must‑haves from `t_c2aa5254`):

- Search, filter, and sort the staff‑accessible owner case list.
- Open a single owner profile detail view that exposes every staff‑readable field plus a derived semantic summary.
- Stay behind the existing `/staff/` AuthN/RBAC gate. Never expose owner or internal data outside authenticated staff context.
- Honor the underwriting filters (DB‑first) and GHL opportunity display (runtime stage map) without hardcoded IDs.

Explicitly out of scope (v1 — refer to parent memo):

- Automated seller valuation, bidirectional GHL write‑back (read/snapshot only), bulk export, owner‑visible valuation under approved.

## 2. Page shell

Keep the existing Astro shell at `src/pages/staff/index.astro` unchanged: `MarketingLayout` with `pageType="utility"`, `pageCategory="staff"`, `noindex={true}`, and the `StaffPortal` React island with `client:load`. The mount is already protected and noindex. No new page is required.

The component keeps its existing outer wrapper `<div className="account-hub staff-database">` so global `AccountHub.css` rules continue to apply (`padding`, `border-radius`, `header` style, kicker color, button color).

## 3. Layout (desktop ≥ 980px)

```
account-hub staff-database
├── header (account-hub) — identity + sign-out
├── status banner (.account-status) — non-blocking feedback
├── .staff-search — filter bar
├── .staff-database-meta — count + sort + pagination controls
├── .staff-database-grid
│   ├── .staff-case-list — scrollable results (max-height 82vh)
│   └── .staff-profile — selected case detail
└── (per-section profile panels — see §7)
```

At ≥ 980px the profile column sits to the right of the list at the existing `minmax(260px, 0.8fr) minmax(0, 1.8fr)` ratio.

`<840px` collapses to one column; `.staff-case-list` loses its `max-height` so the list flows naturally above the profile (`max-height: none`).

≤ 600px further stacks header rows (`display: grid`) and aligns `align-items: start` on file rows; those rules already exist in `AccountHub.css` and apply unchanged.

## 4. Filter bar `.staff-search`

Existing three‑column grid (`240px 1.4fr / 160px 0.7fr / 140px 0.6fr`). Extend to a fourth responsive row at ≥ 980px; on `<840px` it becomes one column (existing rule).

Order and minimum copy (English, MRX staff tone — direct, no marketing language):

| # | Label | Type | Options | Notes |
|---|-------|------|---------|-------|
| 1 | Search owners | search (input type="search") | – | Placeholder: "Name, email, phone, city, county, state". |
| 2 | Case status | select | 13 OWNER_CASE_STATUSES + "All statuses" (default) | Use the existing `statusOptions` list and `ownerCaseStatusLabel`. |
| 3 | Rating | select | OWNER_CASE_RATINGS + "All ratings" | Existing `ratingOptions`. |
| 4 | Priority | select | normal, high, urgent + "All priorities" (add new). | |
| 5 | Verification | select | unknown, low, medium, high + "Any verification" | |
| 6 | Mineral county | select | dynamic options from server response `mineralCounties` (sorted, with "Any county" default). | |
| 7 | Mineral state | select | dynamic from `mineralStates`. | |
| 8 | Mineral basin | select | dynamic from `mineralBasins` (allow null/unknown to filter those lacking a basin). | |
| 9 | Operator | select | dynamic from `operators` ("Any operator", plus "(Unknown)" selector for nulls). | |
| 10 | Min mineral interests | number input + operator select | operator ≥ / = / ≤; default no filter. | |
| 11 | Has open risks | select | "Any", "Yes — any open", "No — none open" (default Any). | |
| 12 | Open risk severity | select | "Any severity", "Low+", "Medium+", "High+", "Critical only". | |
| 13 | Recommended focus | select | "Any", "Missing", "Present", with text input that searches focus text. | |
| 14 | Has assignee | select | "Any", "Assigned to me", "Assigned to anyone", "Unassigned (admin only)". | |
| 15 | Last contact | select | "Never contacted", "<7 days", "8-30 days", "31-90 days", ">90 days". | Distinct from `last_seen_at` — must use `internal_case_workspaces.last_contact_at` with `null` meaning "never". |

The first three controls keep the existing three‑column grid; rows 4–8 wrap to a second physical row at ≥ 980px using the existing `.staff-form-row` two‑column pattern. At `≥ 980px` the `.staff-search` grid becomes `repeat(3, minmax(0, 1fr))` with a sub `staff-form-row` for the rest, mirroring `.staff-workspace-form` so styles stay consistent.

Each `<label>` wraps a control and uses the existing `.staff-search label` typography (uppercase 0.78rem, weight 800, color #243e50). Controls reuse `.staff-search input`/`.staff-search select` rules — same border `#bdcbd5`, radius 10px, background `#fbfcfd`, focus ring matching AccountHub (border-color `#365f7a`, `box-shadow 0 0 0 3px rgba(54,95,122,.13)`).

Behavior:

- Inputs are uncontrolled‑ish: the form still has `onSubmit={(event) => event.preventDefault()}` and updates component state on change; we keep `useDeferredValue` for the free‑text search box only (matches existing perf pattern).
- Filters dispatch a single GET request to `/api/staff/cases` with serialized query params; debounce text input at 250 ms via `useDeferredValue`.
- A "Clear filters" button (existing button class, label "Clear filters") sits at the end of row 1 alongside a "Saved views" placeholder slot (later phase — no UI required here).
- Form is wrapped as `<form role="search" aria-label="Filter owner cases">`.

## 5. Sort + pagination controls `.staff-database-meta`

Sits directly between `.staff-search` and `.staff-database-grid`.

```
[ Showing N of M cases ]                       [ Sort by: <select> ]   [ Page ‹ 1 2 3 › ]
```

Layout:

- Grid `display: flex; justify-content: space-between; gap: .75rem; padding: .5rem 0; color: #243e50;`.
- Left text uses `aria-live="polite"` and reads "Showing X–Y of Z cases matching N filters" (when no filter, omit the trailing clause). Counts must come from the API envelope, never computed locally.
- Right side: sort `<select>` (`aria-label="Sort owner cases"`) with options: Last activity (default), Last contact, Opportunity value, Created, Name, Stage. Pagination: `‹ prev` / numeric page / `next ›` buttons styled like `.account-hub button` ghost variant.
- At `<840px` the meta row collapses to a stacked column.

Sort options map to API query params:

| UI label | API `sort` | Direction |
|----------|-----------|-----------|
| Last activity (default) | `last_activity` | desc |
| Last contact | `last_contact_at` | desc nulls last |
| Opportunity value | `opportunity_value_cents` | desc nulls last |
| Created | `created_at` | desc |
| Name | `full_name` | asc |
| Stage | `status` | asc by canonical pipeline order |

Pagination is cursor‑based (`after=<opaque>` `before=<opaque>` plus `limit=`); the UI exposes classic page numbers for staff ergonomics, server returns the cursor map. Default `limit=25`, max `100`. Page size toggle is "Show 25 / 50 / 100" select (later phase — keep fixed at 25 for v1; add toggle as commented expansion only).

## 6. Case list `.staff-case-list`

Same shell, deeper content.

Each `.staff-case-row` becomes a `<button type="button">` with three vertical regions (existing markup pattern):

```
[ full name + email/phone ]                                 [ rating pill ]
[ residence, mineral summary, owner status pill ]          [ status pill ]
[ priority dot • risk count • assignee tag • GHL pill ]    [ updated date ]
```

Add (all conditional, never color‑only):

- `aria-current="true"` on the selected row (replace existing class‑only highlight).
- A priority indicator. Replace text with a dot prefix and aria‑label: `aria-label="Priority: urgent/high/normal"`. Render as `::before` content with a 10px circle: `normal` `#9aa6b0`, `high` `#b88725`, `urgent` `#9d261f`. Add `.staff-case-row__priority` rule.
- A risk badge: `staff-pill staff-pill--risk-N` only when `openRiskCount > 0`; label "Risks: N". Severity indicator: beside the count a small text token "(max: critical|high|medium|low)" rather than relying on color.
- An assignee tag: existing layout already renders `case_assignments` in profile header — lift a compact "Assigned: name" or "Unassigned" text to list rows too. Use `aria-label` for screen readers.
- A `last contact` chip if `last_contact_at`, otherwise a muted "Never contacted" text — does not fall back to `last_seen_at` (underwriting contract).
- GHL pill: existing pill is rating — keep rating. The GHL stage is a small text after the stage pill: `GHL: <pipeline>·<stage>` or `GHL: Not mapped`.

Add a `.staff-case-row__chips` flex container that wraps and gaps small chips. Chips are pill‑shaped but smaller (`font-size: 0.7rem; padding: 0.18rem 0.5rem;`).

The empty state replaces the current `account-empty` text with:

```jsx
<div role="status" aria-live="polite">
  <p>No owner cases match this view.</p>
  <p><button onClick={clearFilters}>Clear filters</button></p>
  <small>Adjust filters or contact an MRX admin to confirm assignment scope.</small>
</div>
```

The loading state keeps the existing `account-card` skeleton (no change) and adds `aria-busy="true"` and a polite `aria-live="polite"` region.

The error state replaces the inline `.account-status` text with a styled `.account-card--error` block that uses the existing `.account-status` colors plus a retry button calling the same fetcher.

## 7. Profile detail `.staff-profile`

Existing markup is reorganized into named sections with `<section aria-labelledby="…">`. Each section header is the small uppercase `account-kicker` styled label + h3 + `<small>` description.

Sections (order):

1. **Identity & location** — heading, owner name, residence, owner status pill, last contact, last activity, staff sign‑in email.
2. **Case summary cards** (existing `.staff-summary-cards` four cells). Extend to five cells: Stage, Rating, Priority, Mineral rights count, Valuation status. Every staff‑only value displays with its underlying semantic beside the formatted text (e.g., "Priority · high", "Mineral rights · 3 · workspace value", "Last contact · 2 days ago · from internal_case_workspaces"). Each `<strong>` wraps the formatted value and an adjacent visually‑hidden span exposes the source field name to assistive tech (`<span class="account-visually-hidden">source: internal_case_workspaces.priority</span>`).
3. **GHL opportunity** — dedicated section showing pipeline, stage, opportunity id, monetary value, `ghl_pipeline_status`. Render `Not mapped` only when `ghl_pipeline_id` is null AND `ghl_pipeline_stage_id` is null. Include a `<small>` reading exactly "Sourced from MRX_GHL_OWNER_CASE_STAGE_MAP_JSON or live sync; never a hardcoded placeholder.".
4. **Mineral interests** — existing card list. Add filter/sort inside the section: chips per unique mineral county/state/operator alongside the heading. Already part of the contract — render as `<ul class="staff-chips" aria-label="Mineral geography chips">`.
5. **Workspace dossier** — existing form. Add a section note `staff-private-panel` that exposes `valuation_status` as the first field (read‑only display) before the editable cards. Wrap any underwriter/admin‑only valuation transition in a separate section ("Valuation transitions") described in §8.
6. **Notes & files** — existing two‑column layout (`.staff-case-grid`), unchanged.

Add a panel between identity and summary: **Risk flags**. Renders an `<ol class="staff-risk-flags">` of `RiskFlag` rows with severity rendered as a badge (existing pill colors but never color‑only — add the severity text "Critical" / "High" / etc.). Each row carries a `button` to "Mark reviewing" or "Mark resolved" only if API support exists (later phase; v1 displays status pill only).

### 7.1 Identity verification

All section `<small>` readable copy must mention what the value represents:

- Residence: "Residence (from owner onboarding)".
- `last_seen_at`: "Last activity · 2 days ago".
- `last_contact_at`: "Last contact · from internal_case_workspaces".
- `mineral_rights_count`: "Effective mineral count · from workspace override or any interest". If `countSource === "interests"`, append a visually‑hidden span "derived from mineral_interests length, fall back if workspace override is null".

The reviewer section hooks:

- `Underwriter brief` and `Data pull brief` display a `staff-private-panel` warning above the form: "Saving a mapped status synchronizes the real GHL opportunity when the owner has a linked GHL contact. Current GHL sync: <status>." (Existing sentence reused.)
- Add a sentence: "Workspace updates do not change valuation_status. Use the Valuation transitions section below."

## 8. Underwriter / admin valuation transitions (read‑only display + later action)

The display layer v1 must clearly show `valuation_status` (e.g., "Blocked · awaiting methodology approval", "Human review", "Approved") beside every workspace field. No write UI is added in v1; the section displays a placeholder `staff-pill` plus a sentence:

> Valuation transitions are underwriter‑admin only and ship in the next release. Contact an MRX admin to request a transition.

The builder must still thread the value through the form's state so the section can appear with the existing `staff-workspace-form` styling without changing the schema.

## 9. Loading, empty, and error states

Map to existing classes — never invent:

- Loading (initial): keep `account-card` with `<p>Loading the protected MRX portal…</p>` and add `aria-busy="true"`.
- Loading (re‑filter): keep the list mounted; overlay `aria-live="polite"` text "Filtering cases…", show 8 skeleton rows using `.staff-case-row` with a `staff-case-row--skeleton` modifier that adds a moving gradient — style only (`.staff-case-row--skeleton > * { background: linear-gradient(...) }`).
- Empty: `<div role="status" aria-live="polite" class="account-empty">No owner cases match this view.</div>` with a Clear filters action.
- Error: render an `.account-status` with `role="alert"` reading "Cases could not be loaded." and a Retry button. If `result.error === 'request_failed'` show "This account does not have MRX staff access.".
- 403 (not assigned): show "You don't have any owner cases assigned yet. MRX admins assign cases in the admin console." plus the identity pill.
- 5xx (anything else): "Cases could not be loaded. Retry" button.

## 10. Accessibility checklist

- The `<form>` carries `role="search"` and `aria-label="Filter owner cases"`.
- Each `<label>` wraps the control it describes; never use placeholder‑as‑label.
- Search input `aria-describedby="search-help"` plus a visually‑hidden `<span id="search-help">Searches name, email, phone, residence city, county, and state.</span>`.
- Filter `<select>` controls each have `aria-label` mirroring their visible label (technically redundant but survives translation strips).
- Active row: `aria-current="true"`.
- Selected owner: pill text alternative `aria-label="Rating: priority"` etc. (Never color‑only — the visible text already encodes the rating label.)
- Priority indicator: never color alone. The dot is preceded by visually‑hidden "Priority —".
- Risk severity: pill text includes severity word; never relies on color alone.
- Pagination buttons: `aria-label="Go to page N"`; `aria-current="page"` on the active page.
- Sort select: `aria-label="Sort owner cases by"`.
- Counts region: `aria-live="polite"`; `aria-atomic="true"`.
- Result announcements for filter changes: filter inputs update a hidden `aria-live` region with the new count after each request resolves.
- Focus ring: never disabled. Existing rules already include `box-shadow: 0 0 0 3px rgba(54,95,122,.13)`.
- Keyboard: all controls native — Tab order goes header → search → filters left‑to‑right, top‑to‑bottom → sort → page nav → list → profile detail. The list is a `<button>`‑per‑row and supports ArrowUp/Down navigation (the spec lists the optional later enhancement — required for v1 to satisfy "keyboard‑friendly controls"; the builder adds `onKeyDown` that focuses the next/previous row when the user presses ArrowUp/ArrowDown while focus is on a row).
- Screen reader safe status counts: section headers include "5 cases in this view" only when a case list section is open — for the profile view this is unnecessary because one owner is in view.
- `prefers-reduced-motion`: skeleton animation duration only when the user has not requested reduced motion (`@media (prefers-reduced-motion: reduce) { .staff-case-row--skeleton > * { animation: none } }`).

## 11. Component structure (for `mrx_astro_builder`)

Single‑file change is acceptable. Recommended split inside `StaffPortal.tsx` (cheap, matches existing module style):

```
StaffPortal (existing entry)
├── <StaffPortalHeader /> — header + sign out
├── <StaffPortalFilters /> — the .staff-search form
├── <StaffPortalResultsMeta /> — count/sort/pagination
├── <StaffPortalCaseList /> — list + empty/loading skeleton rows
└── <StaffPortalProfile /> — section list
    ├── <StaffPortalIdentitySection />
    ├── <StaffPortalCaseSummary />
    ├── <StaffPortalGhlSection />
    ├── <StaffPortalMineralSection />
    ├── <StaffPortalRiskFlagsSection />
    ├── <StaffPortalWorkspaceForm /> (existing form)
    └── <StaffPortalNotesAndFiles /> (existing two-column layout)
```

State model (recommended, deliberately React‑idiomatic, mirror existing patterns):

```ts
type Filters = {
  q: string;
  status: OwnerCaseStatus | '';
  rating: OwnerCaseRating | '';
  priority: 'normal' | 'high' | 'urgent' | '';
  verification: 'unknown' | 'low' | 'medium' | 'high' | '';
  mineralCounty: string;
  mineralState: string;
  mineralBasin: string;
  operator: string;
  mineralCountOp: '>=' | '=' | '<=' | '';
  mineralCount: string;
  hasOpenRisks: 'any' | 'yes' | 'no';
  riskSeverityFloor: 'any' | 'low+' | 'medium+' | 'high+' | 'critical';
  hasAssignee: 'any' | 'me' | 'anyone' | 'unassigned';
  lastContactBucket: 'never' | '7d' | '30d' | '90d' | 'over90' | 'any';
  recommendedFocus: 'any' | 'missing' | 'present';
  focusSearch: string;
  sort: SortKey;
  page: number;
  pageSize: 25;
};

type PageEnvelope = {
  cases: StaffCase[];
  page: { total: number; returned: number; cursor: { before?: string; after?: string } };
  facets: {
    mineralCounties: string[];
    mineralStates: string[];
    mineralBasins: (string | null)[];
    operators: (string | null)[];
  };
  staffRole: 'admin' | 'underwriter' | 'reviewer';
};
```

Keep using `useDeferredValue` only for `filters.q`, `filters.focusSearch`. Other filters update synchronously. The fetch effect tracks filters plus page; reset `page=1` whenever any filter except sort changes.

Derived client semantics for the list row:

```ts
type RowSemantics = {
  workspaceExists: boolean;
  effectiveMineralCount: number;
  countSource: 'workspace' | 'interests';
  uniqueCounties: string[];
  uniqueStates: string[];
  uniqueOperators: (string | null)[];
  openRiskCount: number;
  maxOpenSeverity: 'low' | 'medium' | 'high' | 'critical' | null;
  assigneeLabel: string; // 'Unassigned' or join of assigned_staff.display_name
};
```

These are computed either on the server (preferred — under `staff.ts` pure helpers) or in a small client `deriveRowSemantics(owner: StaffCase)` hook. Server is cleaner because it lets the API drop them into the row payload; client is acceptable if the builder keeps the function pure and tested.

## 12. CSS additions

Append to `src/components/react/StaffPortal.css` only. Variables re‑use existing colors (`#243e50`, `#152f42`, `#bdcbd5`, `#9aa6b0`, `#b88725`, `#9d261f`, `#365f7a`, etc.). No new design tokens.

```css
.staff-search { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.staff-search > .staff-form-row { grid-column: 1 / -1; }
.staff-search__help { position: absolute; left: -10000px; }

.staff-database-meta {
  display: flex; justify-content: space-between; gap: 0.75rem;
  align-items: center; padding: 0.5rem 0.25rem; color: #243e50;
  font-size: 0.85rem;
}
.staff-database-meta__nav { display: inline-flex; gap: 0.35rem; }
.staff-database-meta__nav button {
  background: #fff; color: #071e34; border: 1px solid #bdcbd5; padding: 0.4rem 0.7rem;
}
.staff-database-meta__nav button[aria-current='page'] {
  border-color: #b88725; box-shadow: 0 0 0 3px rgba(184,135,37,.15);
}

.staff-case-row__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.2rem; }
.staff-case-row__chip {
  border-radius: 999px; padding: 0.18rem 0.5rem;
  font-size: 0.7rem; font-weight: 700; background: #eef1f4; color: #243e50;
}
.staff-case-row__priority::before {
  content: ''; display: inline-block; width: 0.55rem; height: 0.55rem;
  border-radius: 999px; margin-right: 0.4rem; vertical-align: middle;
  background: #9aa6b0;
}
.staff-case-row__priority--high::before { background: #b88725; }
.staff-case-row__priority--urgent::before { background: #9d261f; }

.staff-case-row--skeleton > * {
  background: linear-gradient(90deg, #eef1f4 0%, #f7f9fb 50%, #eef1f4 100%);
  background-size: 200% 100%; animation: staff-row-shimmer 1.4s linear infinite;
  color: transparent;
}
@keyframes staff-row-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
@media (prefers-reduced-motion: reduce) { .staff-case-row--skeleton > * { animation: none; } }

.account-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.staff-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; padding: 0; margin: 0; list-style: none; }
.staff-chips li {
  border-radius: 999px; padding: 0.2rem 0.55rem; background: #eef1f4; color: #243e50;
  font-size: 0.74rem; font-weight: 700;
}

.staff-risk-flags { display: grid; gap: 0.5rem; padding: 0; margin: 0; list-style: none; }
.staff-risk-flags li {
  display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0.85rem; border: 1px solid #d9e0e4; border-radius: 12px; background: #fff;
}
.staff-risk-flags code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem;
  padding: 0.1rem 0.35rem; border-radius: 6px; background: #eef1f4;
}
.staff-pill--risk-N { background: #fdecd6; color: #6f4a12; }
.staff-pill--severity-critical { background: #fbd2cd; color: #6b1612; }
.staff-pill--severity-high { background: #ffe0dc; color: #9d261f; }
.staff-pill--severity-medium { background: #fff1cb; color: #79500d; }
.staff-pill--severity-low { background: #eaf3ff; color: #1b3b6b; }

@media (max-width: 840px) {
  .staff-search { grid-template-columns: 1fr; }
  .staff-database-meta { flex-direction: column; align-items: stretch; }
}
```

Existing rules are preserved. New selectors are namespace‑prefixed `staff-` or `account-` so no collision with `AccountHub.css` or other islands.

## 13. Copy labels (minimum set, locked)

Use these strings verbatim in the UI (no marketing language, sentence case):

- Page header kicker: "Protected MRX portal"
- H2: "Owner cases database"
- Search label: "Search owners"
- Search placeholder: "Name, email, phone, city, county, state"
- Status filter: "Case status"
- Rating filter: "Rating"
- Priority filter: "Priority"
- Verification filter: "Verification"
- Mineral filters: "Mineral county", "Mineral state", "Mineral basin", "Operator"
- Min mineral interests: "Min mineral interests" with helper "Operator and threshold for effective mineral count."
- Risk filters: "Has open risks", "Open risk severity"
- Recommended focus filter: "Recommended focus"
- Assignee filter: "Has assignee"
- Last contact filter: "Last contact"
- Sort label: "Sort owner cases by"
- Page count label: "Showing X–Y of Z cases."
- Filtered count label: "Showing X–Y of Z cases matching N filters."
- Empty results CTA: "Clear filters" / "No owner cases match this view."
- Error banner CTA: "Retry" / "Cases could not be loaded."
- Profile sections kickers: "Identity & location", "Case summary", "GHL opportunity", "Mineral interests", "Risk flags", "Workspace dossier", "Notes & files".
- Valuation status header: "Valuation status"
- Valuation transitions placeholder: "Valuation transitions are underwriter‑admin only and ship in the next release. Contact an MRX admin to request a transition."

## 14. Implementation handoff for `mrx_astro_builder`

### Files in scope

- `src/components/react/StaffPortal.tsx` — refactor to the recommended component split (above) and wire the new filters / pagination / derived semantics.
- `src/components/react/StaffPortal.css` — append the CSS block in §12.
- `src/pages/api/staff/cases.ts` — extend `GET` to accept the new query params, DB‑first filter, cursor pagination, facet derivation, return the envelope in §11. Map unhandled params to `400 invalid_filter_<key>` and audit `staff_case_list_viewed` with the full metadata.
- `src/pages/api/staff/cases/[profileId]/workspace.ts` — no PUT schema change required for v1 (still must not touch `valuation_status`), but add explicit comments referencing the underwriter gate.
- `src/lib/platform/staff.ts` — export `deriveStaffRowSemantics(owner)` helper (pure function) and the `OWNER_CASE_STATUSES`/`OWNER_CASE_RATINGS` enums if not already exported (already are).
- `tests/unit/staff-case-review.spec.ts` — add content‑level asserts: filter param keys (`mineralCounty`, `mineralState`, `operator`, `priority`, `verificationConfidence`, `hasOpenRisks`, `riskSeverityFloor`, `assigneeScope`, `lastContactBucket`, `recommendedFocus`, `focusSearch`, `sort`, `page`, `pageSize`), facet derivation presence in cases.ts, derived `countSource` and `openRiskCount` helper output, owner‑facing APIs (export.ts, session.ts) never leak `internal_case_*`, CSS classes present in `StaffPortal.css`.

### Files explicitly NOT in scope

- `src/pages/staff/index.astro` — unchanged.
- `src/pages/api/account/export.ts`, `src/pages/api/chat/session.ts` — unchanged; tests must continue to assert they never include `internal_case_*`.
- `supabase/migrations/*.sql` — no new migration for v1; existing `internal_case_workspaces_search_idx` already covers `(case_rating, status, last_contact_at desc, updated_at desc)`. If a builder needs a new index, propose it in a child card rather than mutate this migration.
- `src/lib/platform/security.ts` — unchanged; reuse `assertSameOrigin`, `assertRateLimit`, `clientKey`, `safeError`, `json`.

### Verification gates (carry these forward to parent `t_bc7b8fd3`)

- `pnpm vitest run tests/unit/staff-case-review.spec.ts tests/unit/staff-workflow.spec.ts` — extend the existing assertions; both files already exercise this surface.
- `pnpm run typecheck` (or narrower project‑accepted equivalent).
- Browser smoke (manual): staff/assigned reviewer can list + filter + sort + open profile + save workspace; admin can also include "Unassigned" toggle; underwriter sees the same v1 (no transition controls yet). Document screenshots in the completion handoff.

### Risks to call out

- Search through JSONB risk_flags (parent contract requires filtering by open risk code/severity) — recommend a partial GIN index introduced in a follow‑up migration card, not in this build.
- `last_contact_at` filter should never fall back to `last_seen_at` even in `Never contacted` semantics (the underwriting contract makes that explicit).
- GHL absence must always render "Not mapped" rather than `null` or empty string, and no hardcoded IDs leak into the UI (GHL contract is already enforced server‑side via `resolveOwnerCaseStageMapping`).
- v1 forbids writes to `valuation_status`; the workspace PUT must continue to reject any new field. If a builder is tempted to add a transition endpoint, open a new card rather than scope‑creep.
- `countSource` is a derived semantic — `profiles.mineral_interests.length` is the natural fallback, but the spec reserves the workspace override (`internal_case_workspaces.mineral_rights_count`) as the source of truth when non‑null.

## 15. Acceptance review checklist

1. Every filter from §4 is present and wired through query string, with a value reflected in `.account-status` counts.
2. List rows render priority dot, risk badge with severity text, assignee label, last contact chip with explicit "Never contacted" fallback, and a `aria-current="true"` on the selected row.
3. Profile sections render in the order listed in §7, each with `aria-labelledby` and the source‑field visually‑hidden spans described in §7.2.
4. Loading, empty, and error states render with the strings in §9 and `role`/`aria-live`/`aria-busy` per §10.
5. Keyboard navigation: Tab moves through header, search, each filter (in DOM order), sort, page nav, list rows, then the profile sections. ArrowUp/ArrowDown moves focus between list rows.
6. CSS class additions live only in `StaffPortal.css`; `AccountHub.css` is untouched.
7. No new file outside the listed scope. No new design system tokens.
8. Owner‑facing endpoints (`/api/account/export`, `/api/chat/session`) remain untouched and the test file still asserts they include zero `internal_case_*` references.
9. The `StaffPortal` component still loads `AccountHub.css` and `StaffPortal.css` and uses only those classes for styling (no inline color hex).
10. `kanban_complete` is called only after the parent `t_bc7b8fd3` runtime lands implementation; this design task itself is reported via `kanban_complete` with this artifact as the deliverable, because acceptance criterion 5 of the original card mandates "Complete with artifact/spec text in the task handoff; no code edits required unless explicitly scoped."

— End of spec —
