# MRX rollout status

Verified July 18, 2026.

## Live and verified

- Vercel production deployment `dpl_CsUA8Bd33fpeNR8toTZjCJNdXjAS` is live at `mineralrightsxchange.com` and `www.mineralrightsxchange.com`.
- Supabase production credentials and the owner-memory, communication-control, GHL conversation-sync, U.S. geography, and energy-basin schema are valid.
- The live Ask Tommy session endpoint creates Supabase conversations and restores browser sessions.
- MRX enforces a two-second minimum visible reply delay for guide answers.
- 138 unit tests, 70 Playwright journeys, type checking, compliance, structured-data, sitemap, mobile, and visible-copy checks pass.
- The staging validation passed 100 of 100 distinct fictitious owners with complete transcript persistence, routing, timing, and post-run cleanup.
- GoHighLevel calendar access is live and returns 90 valid openings in the seven-day verification window.
- The Prospects, Appointments, and Sellers pipelines and their initial stages are live.
- All 64 required GHL custom fields exist. The 10 DCF fields remain intentionally unwritten.
- `2. Appointment Confirmation + Reminders` is published and saved with the live MRX calendar and Appointment Booked stage.
- The private document worker is live at `documents.mineralrightsxchange.com`, protected by an application token, and reachable only through Cloudflare and Nginx.
- The worker health gate passes, ClamAV rejects the EICAR malware fixture, OCR succeeds for clean documents, and callbacks are signed.
- Document uploads are enabled in production and Preview. Verified email and document-processing consent are still required before an owner can upload.
- Thinkrr is not used. GHL Voice AI is the only planned AI voice provider and remains disabled until an MRX Voice AI workflow is configured and tested.
- Nationwide education, Texas-first owner pages, and the canonical `/1031-exchange/` route are live.
- Legal-release receipts are not enforced and do not block the production build.

## Deliberately deferred or operational

- GHL Voice AI outbound case updates remain disabled because no tested Voice AI workflow ID or phone-verification flow has been supplied. Website help, contacts, document memory, scheduling, email, and SMS are not blocked by this deferral.
- DCF outputs remain empty until MRX supplies and independently validates the valuation model.
- DocuSign templates, paid-media campaigns, list acquisition, staff procedures, and financial projections remain operational workstreams outside the website code.

## Release rule

Production is released. Future changes must continue to pass the automated application, privacy-isolation, consent, document-worker, and browser suites before promotion. No placeholder DCF result, consent receipt, provider delivery, or Voice AI workflow identifier may be invented.
