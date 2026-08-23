# MRX1000 Wave 77 Release Record

- Release-sequence article: `157`
- Program row: `MRX1000-0262`
- Canonical slug: `mineral-rights-worksheet-question-locator`
- Pre-release commit and rollback reference: `84d6566da946e3a0c34eef46c7f07571e08fb844`
- Prior production deployment: `dpl_BLac1YkujxhL9U7HMH6esnWwdW8o`
- Release lane: `/Users/darylhill/Documents/MineralRightsXchange.com/.codex-isolated/mrx-continuous-wave4-20260806`
- Release branch: `owner/continuous-wave4-20260806`

## Rollback procedure

If the Article 157 deployment fails a production gate, immediately restore every active production alias to deployment `dpl_BLac1YkujxhL9U7HMH6esnWwdW8o`. If a repository repair is also required, create a forward revert of the Article 157 release commit from the preserved pre-release reference above, rerun the complete Vercel build and release gates, deploy that verified rollback state, and recheck the apex, `www`, article route, retained routes, metadata, schema, and production image bytes. Do not rewrite branch history.

## Pre-deployment evidence

- Chesty prompt update and read-only identity review: `PASS`
- Independent `mrx_ceo` identity decision: `APPROVE_REDEFINED`
- Exact-title hero OCR and visual review: `PASS`
- Exact-keyword inline OCR and materially distinct visual review: `PASS`
- Hash-locked editorial review: `PASS`
- Hash-locked factual/citation review with four current source checks: `PASS`
- Hash-locked compliance review: `PASS`
- Evidence packets: `157/157 PASS`
- Release blockers: `0`
- Lint: `PASS`
- Unit/regression tests: `596/596 PASS`
- Vercel production build: `PASS`
- Rendered two-image verification: `165 articles / 330 binaries PASS`
- Rendered copy and grammar: `PASS`

Deployment, live verification, final production hashes, and ledger reconciliation are recorded after publication in the canonical release evidence.
