# MRX Daryl Release Runbook

Use this runbook to clear the remaining authority-dependent gates. Do not paste passwords, tokens, API keys, or one-time codes into chat. Enter them only in the named first-party interface.

## 1. Confirm the release candidate

1. Open the MRX repository and switch to `integration/mrx-launch-20260722-aa3986533`.
2. Confirm the application release commit `6fdeff755246d7b621e343e2d4f7a017663c0dbf` is an ancestor of the current branch tip: `git merge-base --is-ancestor 6fdeff755246d7b621e343e2d4f7a017663c0dbf HEAD`.
3. Record the output of `git rev-parse HEAD` as the exact SHA to deploy. This keeps the instruction correct when evidence-only documentation commits are added.
4. Do not include unrelated worktree edits in the production merge: icon-library, knowledge, creative, and QA-export changes are intentionally preserved outside the release commits.

## 2. Add legal and editorial receipts

In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add the approved receipt/reference values (not secrets) as repository-level variables. The workflow reads these values in its release-gate job:

- `MRX_LEGAL_SIGNOFF_1031`
- `MRX_LEGAL_SIGNOFF_AI_VOICE`
- `MRX_LEGAL_SIGNOFF_RECORDING`
- `MRX_LEGAL_SIGNOFF_SELLER_BUYER`
- `MRX_EDITORIAL_SIGNOFF_UNDERWRITER_FAIR_VALUE`

The production workflow forces `MRX_ENFORCE_LEGAL_SIGNOFFS=true`; do not add a bypass or override. Each value must identify a real approved receipt; never invent one. Stop if any approval is missing.

## 3. Configure deployment credentials

In the same Actions settings, add these as repository-level variables:

- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_PROJECT_REF`.

Then open **Settings → Environments → production → Environment secrets** and enter:

- `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.

Use least-privilege project-scoped credentials. Confirm the values are masked and never appear in workflow logs.

## 4. Configure and prove the document worker

In the approved worker/Vercel secret store, configure `DOCUMENT_WORKER_URL`, `DOCUMENT_WORKER_TOKEN`, `DOCUMENT_WORKER_CALLBACK_SECRET`, and `DOCUMENT_ENCRYPTION_KEY`. Keep `DOCUMENT_UPLOADS_ENABLED=false` until all checks below pass:

1. Health endpoint returns healthy.
2. Missing/incorrect authentication is rejected.
3. A clean PDF/image reaches `ready` and its signed callback is accepted.
4. The EICAR fixture is rejected as malware.
5. A retry succeeds after a transient callback failure.
6. The owner workspace reports processing available only after these checks.

If any check fails, leave uploads disabled and report the worker URL/status; do not weaken authentication.

## 5. Run the release workflow

1. Open a pull request from the integration branch to the production branch after code/security review.
2. Confirm the workflow is building the intended SHA, then merge only after all required checks pass.
3. The workflow performs compliance, copy, headings, migration validation, lint, typecheck, unit tests, worker verification, production build, SEO checks, and Playwright tests.
4. It then runs Supabase `db push --dry-run`, applies the migration, builds the Vercel artifact, deploys it, and verifies Vercel origin plus Cloudflare aliases.
5. Stop immediately on any failed gate; do not rerun with a bypass variable.

## 6. Run the controlled appointment test

Use only a Daryl-approved internal test identity entered through the first-party booking UI. Never use a real customer. Test each consent branch:

- Call consent: yes and no.
- Email confirmation consent: yes and no.
- SMS confirmation consent: yes and no.
- AI-voice follow-up consent: yes and no; AI voice must remain disabled unless its workflow is separately approved.

Verify that a missing optional consent suppresses only that channel, and that a missing call consent prevents a phone appointment. Record the appointment ID, Supabase row ID, GHL contact/opportunity IDs, and consent receipt IDs in the release report.

## 7. Prove the owner-to-underwriter path

From the successful internal booking:

1. Confirm the owner is sent to the appointment-context intake, not a generic account landing page.
2. Exercise one situation-specific checklist (producing, inherited/trust, offer review, or uncertain ownership).
3. Upload a clean document with its document type and requirement key.
4. Confirm a missing document does not block booking but does block readiness.
5. Confirm an unprocessed or rejected required document blocks readiness.
6. Verify a staff member can verify or formally waive a requirement, with reason, verifier, and timestamp.
7. Confirm only an underwriter/admin can finalize readiness and generate the versioned staff packet.
8. Confirm raw OCR remains encrypted in Supabase and only redacted text, approved facts, statuses, attribution, and follow-up state reach GHL.

## 8. Verify appointment lifecycle and analytics

Using the same internal appointment, verify confirmation, reminder, reschedule, cancellation, and no-show handling. Confirm the analytics stream contains `booking_opened`, `slot_displayed`, `appointment_booked`, `intake_started`, `intake_completed`, `document_received`, `case_ready`, and `appointment_held`, with landing-page and UTM attribution.

## 9. Verify public discovery after deployment

For both `https://mineralrightsxchange.com` and `https://www.mineralrightsxchange.com`:

1. Confirm the canonical host returns 200 and `www` redirects to it.
2. Confirm every sitemap URL returns 200, has the correct canonical, and is indexable.
3. Confirm dated WordPress-style URLs return 308 to their canonical article.
4. Confirm `/account/`, `/owner-intake/`, `/staff/`, and `/communication-preferences/` are `noindex, nofollow` and absent from sitemaps.
5. Confirm booking availability, intake handoff, and worker availability on the deployed build.

## 10. Complete measurement and handoff

1. In the verified Google Search Console property, submit the canonical sitemap index and confirm ownership/index coverage reporting.
2. In SearchAtlas, apply the prepared corrected Brand Vault profile through the external administrator; do not publish unsupported claims.
3. Attach workflow URLs, deployment URLs, migration result, test totals, worker evidence, appointment identifiers, consent outcomes, GSC/SearchAtlas status, and any exceptions to the release report.
4. Release is complete only when every mandatory gate is green. If any Daryl-only action remains, leave the release marked **NO-GO**.
