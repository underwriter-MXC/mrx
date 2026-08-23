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

## Production publication and reconciliation

- Release commit: `6d334612d405f3966a014d1a0b575eedf314eb12`
- Production deployment: `dpl_C3eWZCHNMzKkjNyiCqS87DKU3GEx`
- Deployment state and target: `READY`, `production`
- Active aliases attached: apex, `www`, `mrx-web.vercel.app`, and `mrx-web-team-mrx.vercel.app`
- Canonical article HTTP result: `200`
- `www` article result: permanent `308` redirect to the apex canonical URL
- Exact H1, canonical, Article schema headline/image, five-question FAQ schema, `og:image`, and `twitter:image`: `PASS`
- Canonical hero binary: `1200×630` WebP, SHA-256 `d830e39261c419ed2f40daec98a4ac05c5076c29a786ba9aed76a1c8b90df989`
- Inline binary: `1200×675` WebP, SHA-256 `1bc9091084c13bed12db357ee2627fa41fce333ccf991f875aa3d88b8ad2bcc6`
- Desktop and mobile rendered browser gate for the current ten-article release window: `PASS`
- Post-publication verification artifact SHA-256: `c8cfb25078d2613dc431bb7f8ad847b05497cc1ce17875fb1d661481fa3e5ca5`
- Canonical MRX1000 live-verified count: `157`
- Public article-route count: `165`
