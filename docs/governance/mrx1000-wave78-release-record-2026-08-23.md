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

## Production publication and verification

- Release commit: `40fce98ed25def921639e8480eac945356ce5d1e`
- Production deployment: `dpl_DR4uRmY78KYgGeP4BnBdWD3msUNm`
- Deployment URL: `https://mrx-jkcka7uzn-team-mrx.vercel.app`
- Active aliases: `https://mineralrightsxchange.com`, `https://www.mineralrightsxchange.com`, `https://mrx-web.vercel.app`, and `https://mrx-web-team-mrx.vercel.app`
- Deployment status and alias inspection: `READY / PASS`
- Desktop and mobile browser rendering: `PASS`
- Exact H1, hero/inline source, alt, natural dimensions, rendered ratio, footer, and overflow assertions: `PASS`
- Post-publication verifier: `158/158 PASS`, zero failing articles, `166` public article routes
- Post-publication verification SHA-256: `11a6c0c8486ec6d8fabbfdd25dd9f96736c55a2bd6364d71c5e586fa769d9880`
- Final canonical ledger SHA-256: `dde3145c3e7744bbe849b0253ef7fd8c0a2b9ffdde65b472834dce3f20ab08e5`
- Final canonical ledger CSV SHA-256: `d590babf20b0df22bdb42b7d67eeeccfbbd1a4f8e3320131af7309fbf7979f08`
- Canonical MRX1000 published-and-live-verified count: `158`
- Reconciliation: `PASS`
