# MRX1000 Wave 86 Release Record

- Release-sequence article: `166`
- Program row: `MRX1000-0270`
- Selection decision: `MRX1000-W86-SELECT-2026-08-23`
- Canonical title: `How to Extract Shut-In Clause Conditions Before a Valuation Review`
- Canonical slug: `how-to-extract-shut-in-clause-conditions-before-a-valuation-review`
- Release authority: `D-2026-0804-16` and the `2026-08-14` MRX no-approval directive

## Rollback readiness

If the Article 166 deployment fails a production gate, immediately restore every active production alias to the last verified deployment `dpl_CRK5MiFGJ3K36wCFpyhGpmBsoFHz`, then rerun the full production verifier before any ledger reconciliation.

## Pre-publication status

- Identity and cannibalization decision: `PASS`
- Original planning identity: `REJECTED_FOR_CANNIBALIZATION`
- Replacement scope approved by Chesty and `mrx_ceo`: `PASS`
- Authoritative source retrieval: `7/7 PASS`
- Editorial, factual-citation, and compliance review: `PASS`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Hero SHA-256: `7832571f916ec9ad8bbee6d242c9dbe2517569382e8b4a06e9dfdd1050b35380`
- Inline SHA-256: `2635883b58e314541c671c83e6dc82b244ebde01b59c3f9b196f20f62cee8452`
- Article SHA-256: `6bcbb31c3e2ffd22de4503f2a64cf4d6216382a855b17167ef6cac788bdfe066`
- Selection-decision SHA-256: `61a183cc90c768f5b9d815e2228ecde5d8dd8c5ec56b03abab698a206cecc746`
- Article length and structured answers: `1,947 words; 5 FAQs`
- Release gates: `166/166 PASS; 0 blocking findings`
- Production build: `PASS; 174 public article routes; 348 article-image binaries`
- Lint: `PASS`
- Unit tests: `596/596 PASS across 65 files`
- Canonical pre-publication ledger JSON SHA-256: `57012a177a3fb80b4d69c55ed64d88e9517521d30ebfbb80f5578f2b4e5e7a7c`
- Canonical pre-publication ledger CSV SHA-256: `906d487cc8da82e26993bfe8828a473d5af66b32f32bdcd4a8326829bb52c6df`
- Signed pre-publication batch SHA-256: `0f2a25850211270f80e92e7bbca49de20dc21b375f69ee09058bd766c2a093b8`
- Deployment, live verification, and reconciliation: `PASS`

## Production publication and reconciliation

- Publication commit: `49ccaef`
- Vercel deployment: `dpl_554zByksoyEu3r5trzrHDKzvE59f`
- Deployment URL: `https://mrx-ho86xogg2-team-mrx.vercel.app`
- Inspect URL: `https://vercel.com/team-mrx/mrx-web/554zByksoyEu3r5trzrHDKzvE59f`
- Active targets: `vercel-origin-via-cloudflare-apex`, `vercel-www-redirect`, `vercel-project-alias`, and `vercel-protected-team-alias`
- Article route: `HTTP 200` with exact canonical URL, H1, Article and FAQ schema, five FAQs, seven reviewed sources, and indexable robots state
- Canonical image identity: visible hero, `og:image`, `twitter:image`, and Article schema all use the same exact hero asset and verified production bytes
- Inline image identity: exact distinct inline asset, keyword text, alt text, dimensions, MIME type, and production bytes verified
- Browser verification: `PASS` on desktop and mobile with no clipping, overlap, garbling, or horizontal overflow
- Post-publication verifier: `166/166 PASS`; `174` live public article routes; `0` failures
- Post-publication evidence SHA-256: `bd1214ea25e110b308c7d8905ccaf03c90008fed1b623e049a9617bbab703c6e`
- Canonical reconciled ledger JSON SHA-256: `c9d3c59276b0f127d9c5440ec09f26e9897afc286fc4d52040d50efd1f9bf9da`
- Canonical reconciled ledger CSV SHA-256: `cd408120cfcc8f2af7ab75f9274460d0ba1123ceae75b84ef617bd4960eb30ec`
- Reconciled signed batch SHA-256: `bc6bde73b0dc7fc6be53fc3c12879fe701dddbcd93db065ac368ecabbf5bbebe`
