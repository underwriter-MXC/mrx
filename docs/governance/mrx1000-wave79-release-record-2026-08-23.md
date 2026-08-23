# MRX1000 Wave 79 Release Record

- Release-sequence article: `159`
- Program row: `MRX1000-0264`
- Canonical slug: `mineral-rights-operator-name-change-log`
- Pre-release commit and rollback reference: `7e18dfdcb901c732519e6c8e847fcde78f705f60`
- Prior production deployment: `dpl_DR4uRmY78KYgGeP4BnBdWD3msUNm`
- Release lane: `/Users/darylhill/Documents/MineralRightsXchange.com/.codex-isolated/mrx-continuous-wave4-20260806`
- Release branch: `owner/continuous-wave4-20260806`

## Rollback procedure

If the Article 159 deployment fails a production gate, immediately restore every active production alias to deployment `dpl_DR4uRmY78KYgGeP4BnBdWD3msUNm`. If a repository repair is also required, create a forward revert of the Article 159 release commit from the preserved pre-release reference above, rerun the complete Vercel build and release gates, deploy that verified rollback state, and recheck the apex, `www`, article route, retained routes, metadata, schema, and production image bytes. Do not rewrite branch history.

## Pre-deployment evidence

- Chesty and `mrx_ceo` read-only identity review: `APPROVE_REDEFINED`
- Original operator-track-record/development-risk identity: `REJECTED_FOR_CANNIBALIZATION`
- Exact-title hero OCR and visual review: `PASS`
- Exact-keyword inline OCR and materially distinct visual review: `PASS`
- Hash-locked editorial review: `PASS`
- Hash-locked factual/citation review: `PASS` (four current official Railroad Commission sources)
- Hash-locked compliance review: `PASS`
- Evidence packets: `159/159 PASS`, zero holds
- Automated release gates: `PASS`, zero blockers
- Lint: `PASS`
- Unit tests: `596/596 PASS`
- Full Vercel production build: `PASS`
- Rendered two-image verification: `167 articles / 334 binaries PASS`
- Rendered visible-copy and grammar gates: `PASS`
- Deployment, live verification, and reconciliation: `PENDING`

Production results are appended only after the verified release is live.
