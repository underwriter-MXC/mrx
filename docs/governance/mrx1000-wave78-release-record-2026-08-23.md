# MRX1000 Wave 78 Release Record

- Release-sequence article: `158`
- Program row: `MRX1000-0263`
- Canonical slug: `offset-activity-property-connection-cross-check`
- Pre-release commit and rollback reference: `30e3235edefdcabe60cd9a5ab38d18ccf570de09`
- Prior production deployment: `dpl_C3eWZCHNMzKkjNyiCqS87DKU3GEx`
- Release lane: `/Users/darylhill/Documents/MineralRightsXchange.com/.codex-isolated/mrx-continuous-wave4-20260806`
- Release branch: `owner/continuous-wave4-20260806`

## Rollback procedure

If the Article 158 deployment fails a production gate, immediately restore every active production alias to deployment `dpl_C3eWZCHNMzKkjNyiCqS87DKU3GEx`. If a repository repair is also required, create a forward revert of the Article 158 release commit from the preserved pre-release reference above, rerun the complete Vercel build and release gates, deploy that verified rollback state, and recheck the apex, `www`, article route, retained routes, metadata, schema, and production image bytes. Do not rewrite branch history.

## Pre-deployment evidence

- Chesty and `mrx_ceo` read-only identity review: `APPROVE_REDEFINED`
- Exact-title hero OCR and visual review: `PASS`
- Exact-keyword inline OCR and materially distinct visual review: `PASS`
- Hash-locked editorial review: `PASS`
- Hash-locked factual/citation review: `PASS` (four current official Railroad Commission sources)
- Hash-locked compliance review: `PASS`
- Evidence packets: `158/158 PASS`, zero holds
- Automated release gates: `PASS`, zero blockers
- Lint: `PASS`
- Unit tests: `596/596 PASS`
- Full Vercel production build: `PASS`
- Rendered two-image verification: `166 articles / 332 binaries PASS`
- Rendered visible-copy and grammar gates: `PASS`
- Deployment, live verification, and reconciliation: `PENDING`

Production results are appended only after the verified release is live.
