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

## Production publication and verification

- Release commit: `58fad315fd84c20700bbbb2c84194024b0bfee87`
- Production deployment: `dpl_3VVGe8h8izAMbEcnfePjR4XFBkDd`
- Deployment URL: `https://mrx-byfn8b9vj-team-mrx.vercel.app`
- Active aliases: `https://mineralrightsxchange.com`, `https://www.mineralrightsxchange.com`, `https://mrx-web.vercel.app`, and `https://mrx-web-team-mrx.vercel.app`
- Deployment status and alias inspection: `READY / PASS`
- Desktop and mobile browser rendering: `PASS`
- Exact H1, hero/inline source, alt, natural dimensions, rendered ratio, footer, and overflow assertions: `PASS`
- Post-publication verifier: `159/159 PASS`, zero failing articles, `167` public article routes
- Post-publication verification SHA-256: `b22b9fb78417fd24e2f8d6e3ffa456f2ef29ad4bda816091495768b6c35e003f`
- Final canonical ledger SHA-256: `f34eda7dfe854126457ff983570754d3caaea9cd6d326d3cda9dfba94055a2ff`
- Final canonical ledger CSV SHA-256: `2d7eee528f60efec15d335ab3fb039fc335d2dbc3c2bb798e531b573cbf42c3e`
- Canonical MRX1000 published-and-live-verified count: `159`
- Reconciliation: `PASS`
