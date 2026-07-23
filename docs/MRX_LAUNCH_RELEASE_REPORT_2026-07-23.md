# MRX Launch Release Report — 2026-07-23

## Release decision

**NO-GO for production publication.** The launch implementation is committed and locally verified, but the production release gate correctly remains closed until Daryl-owned credentials, legal receipts, and a controlled internal production appointment are supplied. No customer-facing production mutation, deployment, migration push, GSC submission, or SearchAtlas external update was performed.

## Verified implementation

- Release commit: `6fdeff755246d7b621e343e2d4f7a017663c0dbf` on `integration/mrx-launch-20260722-aa3986533`.
- Conditional document requirements, typed uploads, processing/outage state, waivers, candidate-fact review, versioned readiness, role-gated finalization, staff packet generation, and raw-OCR privacy boundaries are implemented.
- Booking consent receipts, appointment persistence, GHL synchronization, confirmation/reminder paths, reschedule/cancellation endpoints, appointment-context intake handoff, and funnel events are implemented.
- Vercel-behind-Cloudflare is the declared production topology; the legacy Cloudflare Pages configuration is marked preview/local only. Dated WordPress-style URLs redirect to canonical articles, private routes are excluded from sitemaps, and the rendered SEO audit passes.

## Evidence

- `CI=1 pnpm lint` — pass.
- `CI=1 pnpm typecheck` — pass (0 errors, 0 warnings; 30 existing hints).
- `CI=1 pnpm test -- --reporter=dot` — **61 files / 560 tests pass**.
- `CI=1 pnpm check:mrx1000:release-gates` — pass (10/10 packets, 0 blocking findings).
- `CI=1 pnpm check:seo:rendered` — pass (112 rendered HTML pages).
- `pnpm check-compliance` — pass; `pnpm check:copy` — pass; `pnpm db:validate` — pass (10 migration files / 260 statements).
- `CI=1 MRX_SKIP_RELEASE_GATE=1 pnpm build:vercel` — pass. The normal build remains correctly blocked without legal signoff receipts.
- `pnpm verify:document-worker` — pass: health OK, unauthorized request rejected, clean OCR ready, malware/EICAR rejected, three signed callbacks verified.
- Live read-only checks: canonical home, robots, and sitemap return 200; sitemap contains no private routes; dated legacy URLs return 308 to canonical; `/account/`, `/owner-intake/`, and `/staff/` are `noindex, nofollow`; Cloudflare/Vercel headers are present.

## Unresolved release blockers / Daryl-only actions

1. Enter the five approved legal/editorial receipts in the approved secret store/GitHub environment (1031 claims, AI voice consent, call recording, seller/buyer positioning, and underwriter/fair-value language). The release gate must not be bypassed.
2. Configure GitHub/Vercel/Supabase production credentials and the document-worker URL/token/callback/encryption secrets directly in their first-party secret interfaces. Never paste secrets into chat.
3. Run the Daryl-approved internal test contact through booking, confirmation/reminders, reschedule, cancellation, no-show, consent branches, intake, clean upload, malware rejection, verification/waiver, packet generation, and readiness. Record appointment/contact identifiers only after that controlled run.
4. Apply/verify the production migration, deploy this exact commit to every active Vercel/Cloudflare target, and run post-deploy HTTP/funnel assertions.
5. Verify the canonical Google Search Console property and submit the sitemap index. Apply the prepared SearchAtlas Brand Vault correction through the external administrator; it has not been published by this run.

## Important source/live mismatch

The source now marks `/communication-preferences/` as `noindex, nofollow` and excludes it from sitemap generation, but the current live site still returns `index, follow` because this commit has not been deployed. This is an explicit pre-release verification item.

## Preserved worktree state

The integration commit contains the reviewed launch implementation. Existing unrelated edits (icon library, knowledge files, creative assets, QA exports, and other untracked user files) were preserved and intentionally left outside the release commit; no destructive cleanup or overwrite was performed.
