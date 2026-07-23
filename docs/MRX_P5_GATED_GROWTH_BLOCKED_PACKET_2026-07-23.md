# MRX P5 — Gated Growth: Meta ads, GBP validation, Jamie test access/docs

**Decision ID:** D-2026-0723-01
**Issued by:** `mrx_ceo` (Kanban task `t_53585343`)
**Issued on:** 2026-07-23
**Source plan:** `reports/jamie-mcilvain-all-meetings-execution-plan.md` §P5 (Gated growth work)
**Status:** BLOCKED — gated decision packet only. No contact, no spend, no ads, no document requests, no GBP claim, no test invitation will be issued under this decision.

**Supersedes / preserves:** Nothing. This packet does not alter prior decisions `D-2026-0720-11` (no-spend capacity), `D-2026-0721-21` (successor editorial gate), `D-2026-0722-01` (release-10 go/no-go), or `D-2026-0720-11` GBP ceiling. It creates a new, narrower decision ID for the P5 sub-packet only.

**Authorizing authority:** `MRX_ROLE.md` compliance guardrails, `MRX_ROLLOUT_STATUS.md` no-fabricated-valuation rule, `MRX_BUSINESS_PLAN_IMPLEMENTATION_MATRIX.md` deferral list, `MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` (universal gates G-01 through G-08), prior `mrx_gbp_audit_2026-07-20` read-only eligibility verdict, prior `t_f7ea370c` GBP activation packet.

---

## 1. Commander's intent

Produce a single, gated decision packet covering the three sub-deliverables of the source plan §P5:

1. A **GBP validation packet** built only from truthful first-party evidence and the prior read-only eligibility audit, with a clear conditional verdict and the exact facts Daryl must personally confirm before any profile is created.
2. A **Meta ads plan / budget / compliance gate package** that is complete on paper (objective, audience, creative, landing flow, conversion events, compliance review, stop conditions, capped budget) but explicitly NOT launched, NOT budgeted into Meta, and NOT published.
3. An **approved Jamie test-access and document-request package** that is complete on paper (test invitation script, feedback template, privacy/consent/redaction/retention/test-use checklist, document request template) but explicitly NOT sent until Daryl signs off and any consent artifact is returned.

Every action under this packet that touches money, identity, regulated copy, third-party platforms, Jamie's documents, or any real contact stays in the **blocked / human-only** column. This is not advisory; it is a hard hold.

---

## 2. Authority chain and lane routing

| Item | Owner | Allowed | Gated to Daryl |
|---|---|---|---|
| Plan drafting (this packet) | `mrx_ceo` | yes | — |
| GBP eligibility research (read-only) | `mrx_gbp` | yes (already done, `mrx_gbp_audit_2026-07-20`) | claim, post, verify, edit |
| GBP profile creation at `business.google.com/add` | — | none | yes (G-01, G-04) |
| Meta Business Manager / Ads account work | `mrx_searchatlas_seo` (drafting only) | plan, audience brief, creative brief, compliance checklist | any account touch, OAuth, spend, pixel mutation (G-02, G-03, G-04) |
| Meta ad spend, pixel, conversion API, audience publish | — | none | yes (G-02, G-03, G-04, G-08) |
| Jamie test invitation email | `mrxemailops` (draft only) | plan, test script, feedback template | send (G-04) |
| Jamie test calendar booking | `mrxcalendarops` (draft only) | non-production calendar test plan | any booking that lands on a real Jamie/MRX slot |
| Jamie document request | `mrx_project_manager` (draft only) | privacy/consent/redaction/retention/test-use checklist, request template | send (G-04); receive/process real documents (G-04, G-07) |
| MRX Google work | `underwriter@mineralrightsxchange.com` only | any | always |
| Compliance review of all three packets | `mrx_compliance` | yes | final sign-off |

Routing: `chestyorchestrator` is the orchestrator of record. `mrx_project_manager` owns P0–P4 (already in flight). `mrx_ceo` owns P5 and this decision packet only.

---

## 3. Sub-deliverable A — GBP validation packet (truthful first-party evidence)

### 3.1 Verdict (independent re-confirmation today)

**CONDITIONAL — currently NOT eligible on the documented facts.** MRX should not create a GBP at this time.

This verdict was first issued by the read-only audit `MRX_GBP_ELIGIBILITY_AUDIT_READONLY_2026-07-20.md` (Owner: `mrx_gbp`, Profile: `mrx_gbp`, Date: 2026-07-20, Mode: read-only, no profile created / claimed / edited / verified, no GBP credentials touched, no third-party call to Google). I have re-confirmed it against the source plan, the GBP activation packet, and live public state today, with no facts changing on the ground:

- **Live public-state checks (this run, 2026-07-23):**
  - `https://mineralrightsxchange.com/` — HTTP 200, `text/html; charset=utf-8`, no payload tampering.
  - `https://mineralrightsxchange.com/robots.txt` — HTTP 200, canonical sitemap line present (`Sitemap: https://mineralrightsxchange.com/sitemap_index.xml`).
  - `https://mineralrightsxchange.com/sitemap_index.xml` — HTTP 200, lists `sitemap-core.xml`, `sitemap-articles.xml`, `sitemap-authors.xml`, `sitemap-team.xml`, `sitemap-states.xml`, `sitemap-images.xml`. No GBP `LocalBusiness` node is included in any sitemap, consistent with the dormant state of `src/structured-data/localbusiness.ts`.
- **Repo evidence (re-confirmed from prior audit and prior activation packet):**
  - Brand `Mineral Rights Xchange`, canonical URL `https://mineralrightsxchange.com`, canonical email `underwriter@mineralrightsxchange.com` (`src/lib/site.ts`).
  - Phone `+1 (432) 400-6198` appears in one blog post only; `SITE.phone` is empty; `PUBLIC_MRX_PHONE_TEL` is empty.
  - Street address: NONE published.
  - Hours: NONE published.
  - Customer contact mode: AI chat + GHL-calendar scheduled phone calls; no storefront, no traveling staff.
  - Existing GBP claim: NONE owned by MRX; activation packet explicitly says "GBP is not connected."

### 3.2 Cross-check vs Google's current eligibility language (re-verified)

Source: `https://support.google.com/business/answer/3038177` (Guidelines for representing your business on Google / Eligibility and ownership guidelines, pulled live by the prior audit 2026-07-20).

| Google's gate | MRX today | Verdict |
|---|---|---|
| Physical location customers can visit **OR** travels to customers where they are | No storefront, no traveling staff, phone + chat only | **FAILS** |
| Storefront: real name, signage, staffed during hours, mail confirmed, receives customers | Not present anywhere | **FAILS** |
| Service-area (SAB): staffed central office OR traveling staff | Not present | **FAILS** |
| Service area ≤ ~2 hours driving time from base | Public copy is nationwide across 10+ states | **FAILS** |
| Local phone number that connects to individual location | None committed | **PENDING Daryl** |
| Customer-facing hours | Async + by-appointment only | **PENDING Daryl** |
| Not a lead-gen / sales-agent shell | Educational + may-evaluate-as-buyer posture sits exactly on Google's exclusion line | **HIGH RISK** |
| Single profile, real-world name, accurate, no virtual office | OK on name; address is unpublished so virtual-office rule does not yet bite | OK as long as no fake address is published |

### 3.3 Facts Daryl must personally confirm BEFORE any profile is created

These are the eight facts that gate any GBP action (the prior five from `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACK.md` plus the two added by the read-only audit, plus a category decision). Each is restated in Google's terms, not MRX's.

1. **Operating-footprint mode.** Storefront (staffed, clear-signage office customers visit during stated hours) **or** SAB with traveling staff or a staffed central office? If neither, MRX is not eligible today. *(Blocked Fact #1)*
2. **Real-world contact prong.** Does MRX in fact send staff to owners' physical locations for titles work, document review meetings, or closings? If no, MRX does not currently meet Google's core eligibility gate. *(new in the read-only audit)*
3. **Single canonical phone.** Confirm or replace `+1 (432) 400-6198`. GBP needs a local number that connects to the individual business location. Until committed, GBP cannot be created. *(Blocked Fact #2)*
4. **GBP service-area scope.** SAB requires service area within ~2 hours of base. Options: shrink public copy to that radius, build a real multi-region traveling-staff operation and pre-clear with Google, or abandon SAB and operate as a storefront. *(Blocked Fact #3)*
5. **Hours model.** Publish "By appointment" (allowed for some SAB categories), publish Mon-Fri business hours, or seek a hidden-hours exception. *(Blocked Fact #4)*
6. **Existing claim state.** Has "Mineral Rights Xchange" or "MRX" already been claimed in the 10 deep-dive states? If yes, ownership / access must be resolved before any agent action. *(Blocked Fact #5)*
7. **Primary category.** If eligibility is met, pick the category that matches the real operating model (financial services / education / consultant / real estate agent each carry different rules). Picking the wrong category is itself a suspension trigger. *(new in the read-only audit)*
8. **Lead-gen / sales-agent posture.** Confirm whether MRX's compliance posture will remain education-first with no lead-gen framing. Any "we will buy your mineral rights" or "sell us your minerals" headline triggers Google's lead-gen exclusion regardless of eligibility on the other facts.

### 3.4 GBP activation checklist (blocked, but ready for Daryl)

The `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` checklist steps 1–5 remain valid; step 1 is now gated on fact #2 (real-world contact prong) and fact #7 (category). I am not running them. No profile creation, claim, edit, post, or verification will be initiated by any agent under this decision.

### 3.5 GBP packet summary

- Verdict: CONDITIONAL — do not create GBP until facts 1–8 above are resolved by Daryl.
- Packet artifacts: this decision packet plus the prior read-only audit and the prior activation packet.
- Suspension risks documented: virtual-office / unstaffed-address; nationwide SAB; central-call-center phone; lead-gen shell; empty hours; NAP drift across 10 states; category mismatch.
- Human-only gates surfaced: G-01 (live profile mutation), G-04 (any GBP post, reply, Q&A), and the physical verification challenges Google requires (postcard, phone, video).

---

## 4. Sub-deliverable B — Meta ads plan / budget / compliance gate package

### 4.1 Status

**Draft only. Not budgeted into Meta. Not uploaded to Business Manager. Not published.** No agent action will be taken on Meta, Facebook, Instagram, the Meta pixel, the Conversions API, or any associated ad account under this decision.

This packet satisfies the source-plan §P5 requirement to "Prepare a Facebook/Instagram test plan with objective, audience, creative, landing flow, conversion events, compliance review, stop conditions, and capped budget." It does **not** satisfy the Meta spend authorization rule from `MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` universal gate G-02 ("spend against an ad account"), which is a Daryl-only gate.

### 4.2 Objective (capped experiment, no commitment to launch)

Drive qualified mineral-rights owners in the 10 deep-dive states (TX/NM/OK/ND/CO/WY/PA/WV/OH/LA, per `src/content/pages/about.mdx`) to a low-friction, non-promised educational landing flow on `mineralrightsxchange.com`. The objective is informational click-through and a measured micro-conversion (page depth ≥ 2 OR a GHL calendar open), not a "sell us your minerals" lead-gen outcome. Any lead-gen framing will trigger Google's lead-gen exclusion (see §3.3 fact #8) and breach `compliance/five-hard-rules.json` rule #1 (no guaranteed value / no guaranteed offer) and rule #5 (no unsupported claims).

### 4.3 Audience brief (draft)

- **Geo:** the 10 deep-dive states above. **Excluded:** the other 40 states where MRX has no deeper content (so we do not create a mismatch between ad claim and landing-page depth).
- **Age:** 35+ (mineral-rights ownership skews older; this is a behavioral heuristic, not a protected-class targeting claim).
- **Interests (draft):** royalty / mineral-rights / oil-and-gas royalty / inherited property / estate planning (broad categories only, no proxy discrimination).
- **Exclusions (mandatory):** no lookalike of any compliance-flagged audience, no retargeting of users who hit the legal/tax/valuation pages without an explicit opt-in event, no custom-audience upload of any Jamie / MRX-internal list.
- **Custom audiences:** none at launch; no email-list upload, no pixel-based retargeting pool until GA4 / GTM conversion events are verified end-to-end (lane `mrx_searchatlas_seo` is responsible for that verification).

### 4.4 Creative brief (draft; not produced)

- **Format:** 3 static-feed variations + 1 short-form vertical video variant per audience cell.
- **Hook angles:** "Understand your mineral rights before you decide," "What your royalty statement actually says," "Inherited mineral interests — what now."
- **Mandatory disclaimer overlay:** "Educational information, not legal or tax advice. Mineral-rights values vary; nothing here is a guaranteed offer." — required on every creative, derived from `compliance/five-hard-rules.json`.
- **Prohibited claims (hard-coded):** no guaranteed payout, no "we will buy," no appraised-value ranges, no testimonials, no before/after dollar figures, no named underwriter, no comparisons to competitors by name.
- **Landing flow:** ad → canonical MRX educational pillar for the state → optional GHL calendar open. **No direct ad-to-GHL-booking shortcut** at this stage.
- **Creative production is NOT authorized under this packet.** Production requires Daryl sign-off + `mrx_compliance` review of each creative + `mrx_webdev` confirmation that the landing flow carries the correct disclaimer and that GA4 / GTM events fire.

### 4.5 Conversion events and measurement

Conversion events are gated on the **P0/P4 launch-blocker lanes** finishing end-to-end verification of GA4 + GTM + GSC + Search Atlas. Until those gates close, the experiment has no defensible attribution model. The events to be tracked once verification closes:

| Event | Source | Verified by |
|---|---|---|
| `page_view` (landing) | GA4 via GTM `GT-WFMD2MXW` | `mrx_searchatlas_seo` read-only verification |
| `scroll_depth_50` / `scroll_depth_100` | GA4 scroll event | `mrx_searchatlas_seo` |
| `cta_click_phone_or_email` | GA4 CTA event | `mrx_searchatlas_seo` |
| `ghl_calendar_open` | GA4 + GHL webhook | `mrx_ghl` + `mrx_searchatlas_seo` |
| `ghl_appointment_booked` (test only, not in production) | GHL webhook | `mrx_ghl` |

**Meta pixel + Conversions API**: not installed under this packet. Installation is a Daryl-only gate (G-02, G-03). Until installed, Meta campaign optimization will rely on URL parameters + UTM + GA4 import, which is acceptable for a capped learning-only experiment but not for a budgeted conversion-optimization campaign.

### 4.6 Compliance review (gate)

Before any creative can run, `mrx_compliance` must run `compliance/scripts/check-compliance.mjs` against the rendered landing page for every audience cell and against each creative's caption + disclaimer overlay. Outputs go into a per-campaign compliance evidence packet. Negative reviews block the creative, full stop.

`compliance/five-hard-rules.json` gates each creative against:

- Rule 1 (no guaranteed value) — including no implied "we will pay $X."
- Rule 2 (no certified appraisal language) — including no "appraised value" or "USPAP" phrasing.
- Rule 3 (no legal/tax advice) — including no "you qualify for §1031" or "our legal opinion."
- Rule 4 (no named underwriter) — no personal-name attribution in copy or creative.
- Rule 5 (no unsupported claims) — every statistic must trace to a verifiable source.

### 4.7 Budget cap and stop conditions

**Cap (if and when Daryl authorizes spend):** $500 total over 14 days, no daily cap above $75, no auto-bid optimization, no lookalike expansion, no automatic placements beyond manual feed + Instagram feed. This is well under the threshold at which Meta's "small advertiser" carve-outs apply and is sized so the maximum loss is recoverable from the existing no-spend capacity decision `D-2026-0720-11`.

**Hard stop conditions (no Daryl override required):**

1. Cost per qualified landing-page-view above $4.00 after 1,000 impressions in any cell.
2. Any compliance review flag from `mrx_compliance` against any live creative.
3. Any GHL calendar event firing on a real contact without their documented consent.
4. Any creative accumulating more than 1 negative feedback rate than the Meta benchmark for the cell.
5. Any landing-page 4xx/5xx rate above 1% over a 30-minute window (signals page is down).
6. Any signal that the campaign is being optimized toward a "sell us your minerals" outcome instead of the educational objective.

### 4.8 Meta packet summary

- Plan: complete on paper; no spend, no upload, no publish.
- Budget: capped at $500 / 14 days IF Daryl signs off; otherwise zero.
- Compliance: gated through `mrx_compliance` per the rules above.
- Measurement: gated through `mrx_searchatlas_seo` GA4/GTM verification end-to-end.
- Stop conditions: six hard stops documented, no override.

---

## 5. Sub-deliverable C — Jamie test-access and document-request package

### 5.1 Status

**Draft only. No contact sent.** No invitation, no calendar booking, no document request will be issued by any agent under this decision. The source plan §P5 line "Do not launch ads, spend money, publish, deploy, send invitations, or request documents without approval" is treated as a hard hold here.

### 5.2 Test invitation (draft, not sent)

**Channel:** the existing `underwriter@mineralrightsxchange.com` mailbox (per `src/lib/site.ts` and the GHL outbound configuration) — never a personal mailbox, never a non-`mineralrightsxchange.com` domain.

**Recipient:** Jamie Mcilvain, only via the email address Daryl has on file for Jamie. No agent will look up, scrape, or invent Jamie's contact info.

**Subject:** `MRX test access — invitation to review the live AI version (no rush, no documents)`

**Body (draft, template only — not sent):**

```
Hi Jamie,

Following our conversations, we'd like to invite you to a short, no-pressure
test of the live MRX site so you can see the experience first-hand.

What we'd ask you to do:
  1. Create a test account using a non-production email you don't mind
     receiving MRX notifications on.
  2. Walk through the educational flow for your state (Texas by default).
  3. Try the AI guides (Charlie / Cooper / Tommy / Rebecca / Angela or
     whatever names are live today) and the calendar booking flow.
  4. Note anything confusing, anything that didn't work, and anything that
     felt like overpromise.

What we will NOT ask you to do:
  - Upload any royalty statement, offer letter, deed, or other real document.
  - Use your real contact info for the test account.
  - Move at any particular pace.

If you'd rather not, just say "no thanks" — there's no obligation and no
follow-up. If you say yes, we'll set you up in a test environment, not on
the production site, and we'll keep the test isolated.

Reply to underwriter@mineralrightsxchange.com with a yes/no only.

— Daryl & the MRX team
```

**Compliance:** the invitation does not request documents, does not promise outcomes, does not name a specific underwriter, and uses the `underwriter@` mailbox as the only reply address. It is not a marketing email and contains no claim that requires substantiation under `compliance/five-hard-rules.json`.

### 5.3 Calendar test plan (draft)

- **Calendar:** GHL production calendar (`mrx_ghl` owns), but only via a non-production test appointment type that does not appear on the public booking page.
- **Test slots:** synthetic only, never a real Jamie / MRX slot, never overlapping with an existing customer appointment.
- **Confirmation:** no SMS / no outbound voice under this packet. Email confirmation only, from `underwriter@mineralrightsxchange.com`.
- **Consent:** Jamie must opt in to the calendar test in writing (reply to the invitation) before any slot is offered. Until that reply is on file in the `underwriter@` mailbox, no calendar action is taken.

### 5.4 Privacy / consent / redaction / retention / test-use checklist (draft)

This is the gate that protects Jamie before any document is ever requested. It is a checklist, not a process that has started.

| # | Item | Status | Owner | Required before any document is received |
|---|---|---|---|---|
| C-1 | Written consent from Jamie to receive specific document types | pending | Daryl + Jamie | yes |
| C-2 | Document types limited to what is needed for evaluation (e.g., redacted sample royalty statement, redacted offer letter) — no deeds, no SSN, no tax docs, no bank info | pending | `mrx_project_manager` | yes |
| C-3 | Redaction standard: legal description acceptable; personal identifiers (full SSN, full account number, full DOB) removed before upload | pending | `mrx_project_manager` | yes |
| C-4 | Object-level access: only authorized MRX staff + named reviewer; no default-share with the whole org | pending | `mrx_project_manager` | yes |
| C-5 | Retention window: documents retained only for the duration of the evaluation, then deleted; deletion is logged | pending | `mrx_project_manager` | yes |
| C-6 | Storage location: only the MRX document store with at-rest encryption and audit logging; never a personal Drive / Dropbox / iCloud / chat-attachment | pending | `mrx_project_manager` | yes |
| C-7 | Audit log: every view, every export, every share is recorded with user + timestamp | pending | `mrx_project_manager` | yes |
| C-8 | Synthetic / redacted fixtures preferred over real documents for as long as the benchmark can run on them | pending | `mrx_project_manager` | yes |
| C-9 | Right of withdrawal: Jamie can request deletion at any time and it is honored within 5 business days | pending | `mrx_project_manager` | yes |
| C-10 | No copy into test fixtures / training data / model fine-tuning without a separate, explicit, written consent | pending | `mrx_project_manager` + `mrx_compliance` | yes |

**No agent will request, accept, process, store, view, or otherwise touch any document from Jamie or any customer until C-1 through C-10 are satisfied and Daryl signs off.**

### 5.5 Document request template (draft, not sent)

**Channel:** `underwriter@mineralrightsxchange.com` only.

**Subject:** `MRX document review — optional, no rush, you can say no`

**Body (draft):**

```
Hi Jamie,

If you ever want to share an example royalty statement or offer letter
for our extraction benchmark, here is what we'd need and what we would
do with it:

  - We'd need a redacted sample. No full SSN, no full account number,
    no full DOB, no bank routing, no tax IDs. A redacted legal
    description is fine.
  - We'd use it only to test our extraction and review tooling. We
    would not put it into training data, fine-tuning, marketing copy,
    or any published asset.
  - We would keep it for the duration of the evaluation only, then
    delete it. The deletion would be logged.
  - You can ask us to delete it at any time and we will, within five
    business days.

If you'd rather not share any document at all, that's completely fine.
Just say "no thanks" and we'll drop the topic.

— Daryl & the MRX team
```

**This template is not sent under this decision.** It exists as a paper artifact so Daryl can approve / edit / reject without an agent making contact first.

### 5.6 Jamie packet summary

- Invitation: drafted; gated on Daryl sign-off + a yes-reply from Jamie to `underwriter@`.
- Calendar: non-production test slots only; gated on opt-in reply.
- Document request: drafted; gated on Daryl sign-off + Jamie's explicit, separate written consent for each document type, plus C-1 through C-10 of the privacy checklist.
- No contact, no calendar booking, no document request is in flight.

---

## 6. Universal gates surfaced

Every sub-deliverable above trips one or more universal gates from `MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`. They are listed once here for clarity:

- **G-01** (live mutation of GBP / Meta / Vercel / WordPress / production): all three sub-deliverables. Blocked.
- **G-02** (spend against an ad account): Meta sub-deliverable. Blocked.
- **G-03** (secrets, OAuth, billing tokens, Meta pixel, Conversions API): Meta sub-deliverable. Blocked.
- **G-04** (live outbound communication to any real contact): Jamie sub-deliverable (invitation, calendar confirmation, document request). Blocked.
- **G-07** (legal / tax / valuation / investment copy): every creative, every landing flow, every GBP post if and when live. Gated through `mrx_compliance`.
- **G-08** (paid placements / sponsored posts): Meta sub-deliverable (no paid placements other than the capped Meta spend, which itself is blocked). Blocked.

The high-risk investment packet (Fireflies `01KRBHW04KHH6A2GS8BKJX4DKM`) is **out of scope** for this P5 packet. It remains a separate executive due-diligence record per the source plan §"Separate high-risk investment packet." No introduction, contact sharing, claim, commitment, transfer, solicitation, or external communication will be made by any agent on that basis.

---

## 7. Definition of done for this decision packet (DoD)

This packet is "done" when, and only when, all of the following are true:

1. A signed executive decision artifact exists at `mrx/docs/MRX_P5_GATED_GROWTH_BLOCKED_PACKET_2026-07-23.md` with this decision ID. ✅ (this artifact).
2. The three sub-deliverables are complete on paper, gated against the right human-only gate, and cross-referenced to the prior `mrx_gbp_audit_2026-07-20` and `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET` artifacts. ✅.
3. Live public-state checks for `mineralrightsxchange.com` are recorded with command + result. ✅ (`urllib.request` GET on root, robots, sitemap — all 200, no payload tampering).
4. No GBP claim, post, edit, or verification was attempted. ✅.
5. No Meta account, pixel, conversion API, creative upload, audience publish, or spend was attempted. ✅.
6. No email, SMS, voice, calendar booking, or document request was sent to Jamie or any contact. ✅.
7. A kanban thread comment on `t_53585343` summarizes this packet and surfaces the eight GBP facts, the Meta budget cap and stop conditions, and the C-1 through C-10 Jamie document checklist as the items awaiting Daryl. ✅ (separate `kanban_comment` call).

---

## 8. Definition of NOT done (explicit hold list)

Under this decision, the following actions are NOT done and remain NOT done until a separately signed executive decision authorizes them:

- GBP profile creation, claim, edit, post, Q&A, review response, ownership transfer, or verification.
- Meta Business Manager setup, ad-account touch, pixel install, Conversions API install, audience publish, creative upload, campaign activation, or any spend.
- Any outbound communication to Jamie Mcilvain or any other real contact (email, SMS, voice, push, DM, GBP post, social post).
- Any document request, receipt, processing, storage, or viewing of a real customer or Jamie document.
- Any backlink acquisition, citation submission, paid placement, niche edit, or guest post that could be construed as a link scheme.
- Any change to the no-spend capacity decision `D-2026-0720-11`, the successor editorial gate `D-2026-0721-21`, or the release-10 go/no-go `D-2026-0722-01`.

This list is the operational contract for this packet. If any of those actions becomes necessary, it triggers a new CEO decision packet, not a unilateral agent action.

---

## 9. Risks and routing rules

1. **Source-plan recoverability:** the source plan `reports/jamie-mcilvain-all-meetings-execution-plan.md` was recovered by the parent task from the kanban attachment store and is referenced here verbatim. If a future revision of the source plan changes §P5, this packet must be re-issued.
2. **Board recovery:** when `mrx-live-astro-website` is recovered, these three sub-deliverables should be deduped against that board's GBP / ads / Jamie-test lanes before additional cards are spawned.
3. **Compliance:** any change to landing-page copy, creative copy, GBP post copy, or invitation copy must re-enter `mrx_compliance` review. The current copy blocks are evidence-only and not a permanent license.
4. **Access:** private docs, Jamie/customer documents, Google authenticated data, GHL/CRM records, and ad accounts require configured env / OAuth access, never pasted secrets and never chat-provided credentials. `MRX_MCP_INTEGRATION.md` and the GHL env keys (`GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GHL_COMMAND_PURCHASE_EMAIL`, `GHL_COMMAND_LICENSE_KEY`) are the only authorized access paths.
5. **Cross-lane handoffs:** if the launch-blocker / release-readiness lanes (P0/P4) finish after this packet lands, `chestyorchestrator` must re-open this P5 packet for a fresh CEO decision before any sub-deliverable can advance. The cap on Meta spend, the GBP eligibility facts, and the Jamie document checklist are time-sensitive: they each need a fresh re-confirmation against the as-built state of the product, the analytics, and the CRM at the moment of any actual launch.

---

## 10. Signature

This decision issues a **blocked packet**, not an authorization.

- Status: BLOCKED — gated decision packet only.
- Sub-deliverables complete on paper: A (GBP), B (Meta), C (Jamie). All gated.
- Spend: $0.00. Profile mutation: 0. Contact sent: 0. Document request sent: 0.
- Supersedes: nothing. Preserves: prior capping, successor editorial, and release-10 decisions.

**Signed:** mrx_ceo
**Role:** Executive stakeholder, MineralRightsXchange.com
**Decision ID:** D-2026-0723-01
**Signature timestamp (UTC):** 2026-07-23T00:55:00Z
**Effective:** immediately; fail-closed.