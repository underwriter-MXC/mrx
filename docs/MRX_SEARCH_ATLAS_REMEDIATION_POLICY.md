# MRX Search Atlas Remediation — Executive Policy Memo

Issued by: `mrx_ceo` (Kanban task `t_18881ca2`)
Issued on: 2026-07-20
Scope: all specialist lanes fanning out from the MRX Search Atlas remediation (Search Atlas / GSC / OTTO alignment; crawl coverage; Brand Vault / Knowledge Graph / domain / entity / schema normalization; Content Genius / topical maps / DKN reconciliation; LLM tracking and competitor intelligence; compliant indexing, authority, Digital PR, GBP, local, social activation; repo SEO/AEO/build repair; live verification).
Authority source: `MRX_ROLE.md` compliance guardrails, `MRX_ROLLOUT_STATUS.md` release rule, `MRX_BUSINESS_PLAN_IMPLEMENTATION_MATRIX.md` deferral list, `mrx-growth-ops` skill, prior `t_b7c4f65b` 30-day WARNO/FRAGO sprint backlog.

## 1. Commander's intent

Make `mineralrightsxchange.com` the trusted, indexable, LLM-cited authority on mineral-rights sales so qualified owners book underwriter appointments and receive fair offers. Specialist lanes are empowered to execute any action that is read-only, evidence-based, reversible, and inside the lane's published scope. Anything that touches money, identity, regulated copy, third-party platforms, or production infrastructure requires a human-only gate.

## 2. Universal gates (apply to every lane)

A specialist MUST block and route to Daryl (via `kanban_block(kind='needs_input')`) when ANY of the following is true:

- G-01 The action would publish, edit, or delete content on the live production site or on WordPress, GBP, social platforms, or any third-party property where the agent does not already hold authorized credentials.
- G-02 The action would create, modify, or spend against an ad account, billing line, marketplace listing, paid placement, or affiliate link.
- G-03 The action would create, modify, or revoke user accounts, OAuth grants, API keys, service-account JSON, billing tokens, or webhook secrets — including placing any secret into a chat, plan, board card, or commit.
- G-04 The action would send live outbound communication (email, SMS, voice, push, DM, GBP post, social post) to any real contact or audience.
- G-05 The action would generate, request, or accept a CAPTCHA, MFA challenge, SSO assertion, first-party sign-in, phone-verification OTP, or any human-in-the-loop proof-of-presence step.
- G-06 The action would enroll or remove a contact from a CRM pipeline, workflow, automation, or audience list in production.
- G-07 The action would materially alter legal, tax, valuation, or investment copy in a way that creates individualized advice, a guarantee, a testimonial, an advertisement, or a refund/return promise.
- G-08 The action would acquire, broker, or alter a backlink, citation, press placement, directory listing, paid placement, or guest post that could be construed as a link scheme, paid undisclosed endorsement, or PBN participation.

If a downstream card requires Daryl, the owning specialist writes a single-line `kanban_block(reason='needs Daryl approval: <one-liner>')` and stops. Do not loop, do not fabricate, do not paste placeholders into plans.

## 3. Lane-level policy defaults

### 3.1 Search Atlas / GSC / OTTO alignment

Allowed:

- Read-only `searchatlas` calls (site audit, keyword clusters, entity inventory, DKN reconciliation, OTTO AI suggestions) using env-backed credentials already present.
- Pulling keyword/cluster/topic/export artifacts into the workspace; diffing against the existing `mrx-30-day-sprint-backlog.json`.
- Drafting (not publishing) Content Genius briefs, topical maps, and internal linking plans.

Prohibited:

- Applying Search Atlas recommendations directly to production (publishing, schema injection, page edits, redirect creation).
- Spending Search Atlas credits, enabling paid OTTO runs, or upgrading tiers.
- Submitting or removing sitemaps in GSC; that is a G-01/G-03 gate.

Human-only:

- Sitemap submit/remove decisions in GSC.
- Enabling OTTO auto-fix runs against production URLs.
- Linking Search Atlas OAuth to a new property or scope.

### 3.2 Crawl coverage

Allowed:

- Read-only crawl exports, log-file sampling (when already on disk), and coverage-gap inventories.
- Recommending canonical, redirect, noindex, and `robots.txt` changes in plan form.

Prohibited:

- Editing `robots.txt`, `nginx` rules, Cloudflare Page Rules, DNS, or Vercel routing without Daryl approval (G-01/G-03).

Human-only:

- Final robots/Cloudflare/Vercel routing changes go through Daryl.

### 3.3 Brand Vault / Knowledge Graph / domain / entity / schema normalization

Allowed:

- Building the Brand Vault entity map and source-of-truth table in plan and JSON form.
- Drafting schema.org/JSON-LD blocks (Organization, LocalBusiness, FAQPage, Article, BreadcrumbList, Person) and validating with public schema testers.
- Proposing canonical URL changes, `hreflang` rules, and entity ID assignments.

Prohibited:

- Editing entity records inside Brand Vault, Knowledge Graph, GBP, or Wikidata (G-01/G-04).
- Publishing JSON-LD into production without the live verification cycle (build + lint + structured-data test).

Human-only:

- GBP edits, Wikidata edits, and Brand Vault record creation/update.

### 3.4 Content Genius / topical maps / DKN reconciliation

Allowed:

- Drafting pillar pages, cluster pages, FAQ answers, AEO/LLM answer pages, and topical maps against the existing 10-state + Texas-first scope.
- Internal-link graph rewrites and meta-description rewrites as draft PRs in the repo (`docs/`, `src/content/`, `src/pages/`, `src/components/`).

Prohibited:

- Bulk publishing or replacing more than one article at a time before end-to-end verification (build, lint, sitemap inclusion, structured-data test, GA4 event presence, GSC inspect).
- Mass templated content generation without per-page editorial review. Each page gets a human-checked title, meta description, hero image, and a single source citation.

Human-only:

- Final publish/merge decisions for any new pillar page.

### 3.5 LLM tracking and competitor intelligence

Allowed:

- Reading public LLM responses (Perplexity, ChatGPT browse, Google AI Overviews, Bing Copilot) for MineralRightsXchange and named competitors.
- Tracking citation patterns, prompt clusters, and topic gaps.
- Maintaining a competitor move-log (rankings, content drops, schema additions) in workspace markdown/JSON.

Prohibited:

- Any scraping, scripted probing, or automated account interaction that violates the target platform's TOS or rate limits.
- Logging into third-party LLM platforms to retrieve paywalled or private data.

Human-only:

- Subscriptions, paid competitor-intel tools, and logged-in research against paywalled sources.

### 3.6 Compliant indexing, authority, Digital PR, GBP, local, social activation

Allowed:

- Outreach list drafting, journalist query mapping, and pitch templates (no sends).
- Citation gap inventory and NAP consistency check across already-known directories.
- Drafting GBP post copy, social post copy, and short-form video scripts.

Prohibited:

- Sending any outreach, pitch, DM, email, or social reply to a real recipient (G-04).
- Posting to GBP, Google Business Profile, X, LinkedIn, Facebook, Instagram, YouTube, TikTok, or any forum/Reddit/Quora thread.
- Buying or brokering backlinks, sponsored posts, niche edits, or directory submissions (G-08).
- Creating or modifying business profiles on any platform.

Human-only:

- All live publishing, posting, and outreach sends.
- All backlink acquisitions, paid placements, and partnership agreements.
- GBP verification, reinstatement, or ownership-transfer actions.

### 3.7 Repo SEO/AEO/build repair

Allowed:

- Editing `astro.config.mjs`, `src/layouts`, `src/pages`, `src/content`, `src/components`, `src/lib`, `scripts/`, `tests/`, `docs/`, `package.json`, `pnpm-lock.yaml`, `playwright.config.ts`.
- Adding/updating robots, sitemap, canonical, hreflang, JSON-LD, OG/Twitter, and breadcrumb markup.
- Adding/updating tests, structured-data validators, sitemap checkers, mobile and a11y checks, and visible-copy compliance checks.
- Running `pnpm run test`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, `pnpm run format` locally and in CI.

Prohibited:

- Committing or pushing without Daryl approval unless the task explicitly authorizes the commit. (Default policy: stage changes, report diff, await approval.)
- Modifying `auth.json`, `.env`, `.env.*`, Cloudflare token files, service-account JSON, OAuth tokens, or any credential artifact.
- Changing Vercel project settings, environment variables, build commands, or domain configuration.

Human-only:

- Merge-to-main and production deploy authorization.
- Secret rotation, env-var edits, and OAuth scope changes.

### 3.8 Live verification

Allowed:

- Public `curl`, `whois`, header, robots, sitemap, structured-data, GA4 tag-presence, GSC URL Inspection (read-only), and Lighthouse checks.
- Search Atlas and analytics read-only exports.

Prohibited:

- Submitting URL Inspection "Request Indexing" (G-01).
- Editing Search Console settings, users, or verification records.

Human-only:

- "Request Indexing" and any Search Console mutation.

## 4. Compliance posture (no exceptions)

- No fake reviews, no review gating, no incentivized testimonials. GBP, Trustpilot, G2, BBB, and any third-party review surface is a hard human-only gate (G-04).
- Mineral-rights, legal, tax, valuation, and investment copy must avoid individualized advice, guarantees, and projections of returns. Use the existing legal-claim posture from `MRX_BUSINESS_PLAN_IMPLEMENTATION_MATRIX.md`.
- Tommy and Angela remain the disclosed MRX identities. Thinkrr is not used. GHL Voice AI remains disabled until MRX configures and tests a workflow + phone-verification flow.
- DocuSign, paid media, list acquisition, staff procedures, and financial projections stay outside the website code and are not represented as completed capabilities.
- DCF outputs in GHL remain intentionally empty. No agent may synthesize a placeholder valuation, return, IRR, NPV, or offer range. Use the "no fabricated valuation outputs" rule from `MRX_ROLLOUT_STATUS.md`.

## 5. Definition of done for any lane card

A card is "done" only when it has:

- A concrete artifact (file, JSON, plan, PR diff, report) under `docs/`, `config/`, `src/`, `scripts/`, or its workspace.
- Verification evidence (commands run, URLs hit, files changed, tests passed).
- An explicit list of human-only gates it surfaced, or "none".
- A handoff comment in the kanban thread naming the next owner.

If a card cannot meet those four, it does not auto-complete. It blocks.

## 6. Downstream cards needing Daryl

This memo creates lane-level owner cards (see Section 7). None of those cards require Daryl's pre-approval before starting their read/draft work. They DO require Daryl's approval at the specific human-only gates listed in Section 3 (publish, send, pay, sign in, mutate GSC/GBP/Billing, deploy).

The single immediate item that benefits from Daryl's eyes is the **Sprint 0 launch order** below, which the COO will run as the first execution wave:

## 7. Sprint 0 (lane owner map for `chestyorchestrator`)

The following lane cards will be created on the `mrx-growth` board. Each lane honors the gates above and is owned by the specialist profile listed. The lane is responsible for its own verification; `mrx_ceo` remains the policy gate, not the implementer.

| Lane                                                               | Specialist profile                | First concrete artifact                                                                    | Human-only gate inside the lane                        |
| ------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Search Atlas / GSC / OTTO read-only alignment                      | `mrx_searchatlas_seo`             | search-atlas audit + keyword/cluster/DKN diff vs `mrx-30-day-sprint-backlog.json`          | Sitemap submit/remove; OTTO auto-fix enable            |
| Crawl coverage                                                     | `mrx_seo_audit`                   | coverage gap inventory + robots/redirect recommendation set                                | robots/Cloudflare/Vercel edits                         |
| Brand Vault / KG / entity / schema                                 | `mrx_seo_audit` + `mrx_webdesign` | Brand Vault entity map + JSON-LD draft blocks validated against public testers             | GBP / Wikidata / Brand Vault record edits              |
| Content Genius / topical maps / DKN                                | `mrx_seo_content`                 | pillar/cluster/FAQ/AEO topical map draft + per-page brief                                  | Final publish/merge of any pillar page                 |
| LLM tracking + competitor intel                                    | `mrx_seo_research`                | prompt cluster log + competitor move-log + citation gap report                             | Paid intel subscriptions; logged-in research           |
| Compliant indexing / authority / Digital PR / GBP / local / social | `mrx_seo_pr` + `mrx_ghl_local`    | outreach list + pitch templates + NAP consistency + GBP post drafts                        | Live sends; GBP edits; backlink buys; profile creation |
| Repo SEO/AEO/build repair                                          | `mrx_webdev`                      | staged PR diffs covering canonical/sitemap/JSON-LD/OG/structured-data/lint/typecheck/build | Merge-to-main; deploy; secret/vercel edits             |
| Live verification                                                  | `mrx_seo_audit`                   | public verification report (curl/Lighthouse/sitemap/structured-data/GA4 tag)               | GSC Request Indexing; GSC settings                     |

Sprint 0 ships when (a) every lane has a draft artifact in its workspace, (b) the repo PR wave is staged and tested locally, and (c) the policy memo is acknowledged in the kanban thread. Sprint 1 (publish + verify) opens only after Daryl signs off at the gates listed.

## 8. Escalation path

- Specialist blocked by tool/credential → `kanban_block(kind='capability')` with the exact env var name and placeholder (`YOUR_API_KEY`) required.
- Specialist blocked by Daryl-only gate → `kanban_block(kind='needs_input')` with the one-line decision needed.
- Specialist blocked on another specialist's output → `kanban_block(kind='dependency')` naming the parent card id; do not duplicate work.
- Chesty remains the route for cross-lane handoffs and for surfacing Sprint 0 readiness to Daryl.

End of memo.
