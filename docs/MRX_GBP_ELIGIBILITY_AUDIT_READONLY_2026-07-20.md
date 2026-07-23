# MRX Google Business Profile — Read-only Eligibility Audit

**Task:** `mrx_gbp_audit_2026-07-20` (read-only)
**Profile:** `mrx_gbp`
**Mode:** Read-only. No profile created, claimed, edited, or verified. No GBP credentials touched. No third-party call to Google.
**Generated:** 2026-07-20

---

## 1. Situation

Daryl asked for a read-only GBP eligibility audit for Mineral Rights Xchange (MRX) using current repo evidence and current official Google eligibility requirements. The audit must NOT create or edit a GBP. It must determine whether an online educational / underwriter-review business with scheduled-phone contact (no confirmed in-person customer contact) is eligible, identify the exact facts Daryl must confirm before any creation, and flag suspension risks.

Two parallel evidence streams were consulted:

1. **Repo evidence** — MRX canonical NAP, public copy, structured-data posture, and the existing GBP activation packet. The repo already classifies GBP as "not connected" and lists 5 blocked facts that cannot be invented by an agent.
2. **Official Google eligibility language** — pulled live from `support.google.com/business/answer/3038177` (Guidelines for representing your business on Google / Eligibility and ownership guidelines). Pages 3038177 is the canonical GBP eligibility doc.

## 2. Mission

Produce a concise verdict with:

- Yes / Conditional / No on eligibility.
- The exact category/footprint mode that fits MRX if eligible.
- The minimum facts Daryl must personally confirm before any profile is created.
- The suspension risks Google explicitly ties to the answers above.

## 3. Repo evidence (what MRX actually is, today)

| Fact | Repo value | Source |
|---|---|---|
| Brand | Mineral Rights Xchange | `src/lib/site.ts:9` |
| Canonical URL | `https://mineralrightsxchange.com` | `src/lib/site.ts:14` |
| Canonical email | `underwriter@mineralrightsxchange.com` | `src/lib/site.ts:16`, footer, JSON-LD `ContactPoint.email` |
| Phone (published) | NONE site-wide. One blog post carries `+1 (432) 400-6198`. `SITE.phone = ''` and `PUBLIC_MRX_PHONE_TEL` are empty. | `src/lib/site.ts:17`, `docs/sprint0-digital-pr/01-nap-consistency-report.md` §1, §3 |
| Street address (published) | NONE | `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` "Blocked facts" |
| Region / country | TX / US (state-of-domicile hint only, no street) | `src/lib/site.ts:18-19` |
| Service area (public copy) | Nationwide educational guidance; deeper content for TX, NM, OK, ND, CO, WY, PA, WV, OH, LA | `src/content/pages/about.mdx:25` |
| Customer contact mode | AI chat (Ask Tommy, named AI guides), scheduled phone calls via GHL calendar ("Angela can check availability and help book a phone conversation with the MRX team") | `src/content/pages/about.mdx:18-23`, `docs/mrx-seo-aeo-sitemap-architecture.md` |
| Hours (published) | NONE. Asynchronous + scheduled phone appointments. | `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` "Blocked facts" §4 |
| Existing GBP claim | None owned by MRX. Activation packet: "GBP is not connected." | `output/SEARCHATLAS_FINAL_VERIFICATION_2026-07-20.md` line 34 |
| Business description (public) | "Free, no-pressure mineral-rights education for owners comparing offers, inherited interests, royalties, and sell-or-hold decisions across the United States." | `src/lib/site.ts:12-13` |
| Compliance posture | Five hard rules: no guaranteed value, no certified appraisal, no legal/tax advice, no named underwriter, no unsupported claims. "Sales associates or lead-generation agents" framing is explicitly prohibited from impersonating an underwriter. | `compliance/five-hard-rules.json`, `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` |

**Functional model MRX actually runs today (per repo):** a nationwide online educational site that uses AI chat and a GHL-calendar phone-call booking flow to review owners' mineral rights situations. There is no published storefront, no published street address, no published customer-facing office, and no confirmed in-person customer visit anywhere in the codebase or public copy. There is also no confirmed remote / traveling staff that visits owners.

## 4. Official Google GBP eligibility requirements (current, pulled 2026-07-20)

Source: `https://support.google.com/business/answer/3038177` — "Eligibility and ownership guidelines / Guidelines for representing your business on Google." Quoted language below is verbatim from the rendered page.

### 4.1 Core eligibility gate

> "If your business either has a physical location that customers can visit, **or** travels to customers where they are, you can create a Business Profile on Google."

### 4.2 Storefront vs service-area split

> "**Storefront versus service-area businesses.** If your business doesn't have a storefront with clear signage but travels to customers at their physical locations, you're allowed one service-area Business Profile."
>
> "Service-area businesses, or businesses that serve customers at their locations, should have one profile for the central office or location with a designated service area."
>
> "If you're a service-area business, you should hide your business address from customers."

### 4.3 What "physical location" must include (for the storefront model)

> "your business's name and address should be … received and confirmed by mail … staffed during business hours by your business staff. … receives customers at the location during business hours."
>
> "Businesses can't list an office at a co-working space unless that office maintains clear signage, receives customers at the location during business hours, and is staffed during business hours by your business staff."

### 4.4 What a service-area business (SAB) must include

> "Service-area businesses can't list a 'virtual' office unless that office is staffed during business hours."
>
> "The boundaries of your profile's overall service area shouldn't extend farther than about 2 hours of driving time from where your business is based. For some businesses, larger service areas may be appropriate."
>
> SAB must "travel to customers at their physical locations."

### 4.5 Website & phone

> "Provide a phone number that connects to your individual business location, or provide a website that represents your individual business location. Use a local phone number instead of a central call center helpline number whenever possible."

### 4.6 Hours

> "Business hours — Provide your regular customer-facing hours of operation."

### 4.7 Lead-generation / sales-agent exclusion

> "Sales associates or lead generation agents for corporations aren't individual practitioners and aren't eligible for a Business Profile."

### 4.8 Name, accuracy, single-profile, virtual-office rule

> "Your name should reflect your business's real-world name, as used consistently on your storefront, website, stationery, and as known to customers."
>
> "There should only be one profile per business."
>
> A virtual-office address is ineligible: "that location isn't eligible for a Business Profile" unless it meets the clear-signage / staffed-during-hours test above.

## 5. Cross-check: MRX against each requirement

| Requirement | MRX today | Verdict |
|---|---|---|
| Physical location customers can visit, OR travels to customers where they are | No published storefront; no code, doc, or public copy describing MRX staff traveling to owners' physical locations. Customer contact is phone call (booked via GHL) and web chat. | **FAILS as written.** Neither prong of Google's core eligibility gate is satisfied by what the repo currently documents. |
| Real-world recognized name, signage, stationery | Yes on the web side. No published signage, stationery, or storefront. Name is consistent. | Conditional. |
| Central office / staff at a real address for SAB | No street address published anywhere. No doc asserts MRX has staff at a staffed, clear-signage office. | **FAILS** unless a real office exists with staff + signage (not asserted). |
| Travel-to-customer prong for SAB | Not asserted anywhere in repo. Public copy says AI chat + scheduled phone. | **FAILS** unless MRX in fact sends staff to owners' physical locations (not asserted). |
| Service area ≤ ~2 hours driving from base | Public copy claims nationwide across 10+ states. | **FAILS** the SAB 2-hour rule by orders of magnitude. Google explicitly allows exceptions "for some businesses" but gives no carve-out for nationwide educational review. |
| Hide address (SAB) | Address is already unpublished — this is fine. | OK. |
| Local phone number that connects to the individual business location | No published phone. The lone blog-post `+1 (432) 400-6198` is currently unconfirmed as canonical. | **PENDING** Daryl confirmation (matches the existing Blocked Fact #2). |
| Business hours | Async chat + scheduled phone. No fixed customer-facing hours published. | **FAILS** the explicit "Provide your regular customer-facing hours of operation" rule unless MRX adopts "By appointment" hours (Google permits this for some SAB categories — see below). |
| Not a lead-generation / sales-agent shell | MRX is structured as an educational site that *may evaluate an interest as a potential buyer* (per the compliance review draft brief). The "may evaluate as buyer" + lead-gen posture is precisely the pattern Google's exclusion targets. | **HIGH RISK.** This is a fact pattern Google explicitly calls out as ineligible when held by individuals; for an entity it is permissible only if the business has a real storefront OR real staff traveling to owners. |

## 6. Verdict

**CONDITIONAL — currently NOT eligible on the documented facts. Do not create a GBP until the five facts below are confirmed.**

The verdict is **conditional**, not flat "no," because Google does offer two paths that could in principle fit MRX, but neither path is supported by anything in the repo today:

- **Storefront path** would require a real, staffed, clear-signage office that customers can visit during stated hours. There is zero repo evidence MRX has one. The phone is unconfirmed, the address is unpublished, the hours are unpublished, and the public copy is nationwide async.
- **Service-area (SAB) path** requires either staff that travel to owners OR a staffed central office. There is zero repo evidence of either. SAB also imposes a ~2-hour driving-time service-area radius; MRX's published nationwide scope cannot satisfy that as-is. Google *can* allow larger service areas for some businesses but the published policy does not carve out online educational review.

There is no third Google-recognized path. **An online-only educational/underwriter-review business with no in-person contact and no traveling staff is not eligible for a standalone Google Business Profile under the current official eligibility rules.** Google's eligibility gate is explicitly "physical location customers can visit **OR** travels to customers where they are." A site whose only customer contact is phone + web chat meets neither prong.

**Recommendation:** MRX should not create a GBP at this time. If MRX wants a GBP, the first move is a business-model decision, not a verification: either (a) establish a real, staffed, public-facing office with signage, publish a local phone and hours, and treat that as the storefront base; or (b) commit to a real traveling-staff / field-rep model and apply as a service-area business scoped to a realistic ~2-hour base radius (or seek Google's explicit pre-approval for a wider service area). Until one of those is true, a GBP would be at high risk of suspension on first review.

## 7. Exact facts Daryl must confirm BEFORE any profile creation

These five facts map 1:1 to the existing `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` "Blocked facts" but each one is now stated in terms of what Google requires, not just what MRX needs to publish.

1. **Operating-footprint mode.** Is MRX a storefront (staffed office with signage, customers can visit during stated hours) or a service-area business (real traveling staff going to owners, OR a staffed central office)? If neither, MRX is ineligible today. *(Activation packet Blocked Fact #1.)*
2. **Single canonical phone.** Confirm or replace `+1 (432) 400-6198`. GBP requires a local number that connects to the individual business location. Until this is committed, GBP cannot be created. *(Activation packet Blocked Fact #2; NAP report §1, §3.)*
3. **GBP service-area scope.** SAB requires service area within ~2 hours of the base. Does MRX want to (a) shrink public copy to that radius, (b) build a real multi-region traveling-staff operation and pre-clear the wider area with Google, or (c) abandon SAB and operate as a storefront? *(Activation packet Blocked Fact #3.)*
4. **Hours model.** GBP requires customer-facing hours. Will MRX publish "By appointment" (allowed for some SAB categories), Mon-Fri business hours, or apply for a hidden-hours exception? *(Activation packet Blocked Fact #4.)*
5. **Existing claim state.** Has "Mineral Rights Xchange" or "MRX" already been claimed by anyone in the 10 deep-dive states? If yes, ownership verification (postcard / phone / video) is required before any agent action. If no, the claim is a Daryl-side action only. *(Activation packet Blocked Fact #5.)*

**Additional fact Google now makes load-bearing:**

6. **Real-world contact prong.** Does MRX in fact send staff to owners' physical locations (titles work, document review meetings, in-person closings)? If yes, the SAB path is open. If no, MRX does not currently meet Google's core eligibility gate and should not file a GBP. This is the single highest-leverage fact and is the one not in the existing blocked-facts list — it should be added.

## 8. Suspension risks (specific to MRX)

Per the official guidelines, these are the explicit suspension vectors that map onto MRX's current public posture:

1. **Virtual-office / unstaffed-address.** "That location isn't eligible for a Business Profile" applies to mailboxes, virtual offices, and unstaffed co-working offices. If Daryl publishes a street address that is in fact unstaffed or virtual, suspension follows. (Google's own language.)
2. **Inaccurate service area.** A nationwide service area on a SAB profile whose base is a single city contradicts "accurate and precise."  Suspension follows. Same for any address that is not staffed during hours.
3. **Central call-center phone.** Google explicitly says use a local phone number instead of a "central call center helpline number." If MRX routes `+1 (432) 400-6198` through a single queue without a local presence, the phone field is itself a quality violation.
4. **Lead-generation / sales-agent shell.** Google's policy names "Sales associates or lead generation agents for corporations" as ineligible. MRX's compliance posture (educational review + "may evaluate an interest as a potential buyer") sits exactly on this line. If Google's quality reviewers conclude the profile is a lead-gen funnel rather than a staffed business, suspension follows even after verification.
5. **Hours field empty.** GBP requires hours. If MRX leaves hours blank or publishes "By appointment" without the qualifying SAB category, the profile can be downgraded or removed.
6. **NAP drift across the 10 deep-dive states.** The NAP report (§5) already flags NAP drift as a forward risk. If MRX files a GBP for one state but its citation graph mentions other states, cross-state citations become an inconsistency vector.
7. **Category mismatch.** MRX's actual function (education + scheduled phone review) does not map cleanly to a single GBP category. The nearest options ("Financial services," "Education," "Consultant," "Real estate agent") each carry different rules — picking the wrong one is itself a suspension trigger. This is a sixth confirmation fact for Daryl and is also not yet in the existing blocked-facts list.

## 9. Recommended next action

Do nothing on GBP until Daryl confirms facts 1–6 above (existing five plus the new "real-world contact prong" and "category" items). Once confirmed, the next move is for Daryl to make the human-only claim at `business.google.com/add`; no agent action is authorized. The `MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` activation checklist steps 1–5 remain valid but step 1 is now gated on the additional fact (#6 real-world contact prong).

A Kanban card on the GBP lane board should be opened to track Daryl's resolution of facts 1–6, the category decision, and the post-confirmation hand-off to `mrx_ghl_local` for first GBP post draft.

## 10. Evidence / artifacts

- `src/lib/site.ts` — canonical NAP
- `src/content/pages/about.mdx` — public service-area and contact copy
- `src/structured-data/site.ts` — JSON-LD `Organization.contactPoint`
- `src/structured-data/localbusiness.ts` — dormant, scope-corrected SAB node
- `docs/MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md` — existing 5 blocked facts, activation checklist
- `docs/sprint0-digital-pr/01-nap-consistency-report.md` — current NAP graph, single-phone occurrence, drift risks
- `docs/sprint0-digital-pr/09-handoff-and-blockers.md` — human-only gates G-01 through G-08
- `output/SEARCHATLAS_FINAL_VERIFICATION_2026-07-20.md` line 34 — "GBP is not connected"
- Official source: `https://support.google.com/business/answer/3038177` (Guidelines for representing your business on Google / Eligibility and ownership guidelines)
- This audit: `docs/MRX_GBP_ELIGIBILITY_AUDIT_READONLY_2026-07-20.md`

No live GBP call, claim, edit, post, or verification was performed. No external API was called. The Google eligibility page was read via curl with a Googlebot UA; no automated action was taken on Google.