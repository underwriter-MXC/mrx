# MRX1000 Wave 89 Release Record

- Release-sequence article: `169`
- Program row: `MRX1000-0286`
- Selection decision: `MRX1000-W89-SELECT-2026-08-23`
- Canonical title: `Texas RRC Pooling-Filing Retrieval Provenance Worksheet`
- Canonical slug: `texas-rrc-pooling-filing-retrieval-provenance-worksheet`
- Release authority: `D-2026-0804-16` and the `2026-08-14` MRX no-approval directive

## Rollback readiness

If the Article 169 deployment fails a production gate, immediately restore every active production alias to the last verified deployment `dpl_D43eA2vPg3MdWnzAJpFQbgboZtV2`, then rerun the full production verifier before any ledger reconciliation.

## Pre-publication status

- Identity and cannibalization decision: `PASS`
- Original planning identity: `REJECTED_FOR_CANNIBALIZATION_AND_RISKY_POOLING_OR_VALUATION_INTERPRETATION`
- Replacement scope approved by Chesty and `mrx_ceo`: `PASS`
- Authoritative source retrieval: `6/6 PASS`
- Editorial, factual-citation, and compliance review: `3/3 PASS`
- Article body tokens: `1,924`
- FAQ count: `5`
- Article SHA-256: `67973f95b615135a2bb8f0d7bf16b59ea2cb803634e3c7eff3d2f0198a1b4dbd`
- Selection-decision SHA-256: `abd592e9d3db9cf5373b66753c024246fff9044b1e7680c043d5eb82c0d7c332`
- Evidence-packet SHA-256: `fc3735b96404bafd264d70b0a144badba3c82ebebd76eaca9c6982b2e6074f55`
- Normalized-review SHA-256: `9e06f793d4998518bab2d2dd429816e32e38e3cdfbd69521846343dd00d6f2af`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Hero SHA-256: `6e9fe5ef10871a17083fc832d893d14eb611c77d9098e18af0c2ac0909643440`
- Inline SHA-256: `76e9a86fad240955f518f9087f8daf6ca475ede4d8fadf26fa224617d3e340f1`
- Canonical ledger: `1,000/1,000` unique rows; Article 169 is the exact `MRX1000-0286` replacement identity
- Reconciled canonical ledger JSON SHA-256: `cf4e044a7b5ec331131ba16f6b257e7435617018fe443762d08c4fc75e20a9e9`
- Reconciled canonical ledger CSV SHA-256: `8f34e721ec42b2a1401d335d825b5be732a1e9598154ccdd7bbf7b2f7d9f6a1a`
- Release batch: `169/169` exact admissions
- Release-batch SHA-256: `c4cb130b828d342d63570a5063c155e83e107e2748b03faa158b7f1c5507684f`
- Automated release gates: `169/169 PASS`; `0` blocking findings
- Release-gate JSON SHA-256: `9184b57201273f3328303d45e63bc448ce275bb90d59e9a41afe3a3d291b614a`
- Publication manifest: `169/169 READY`
- Production build: `PASS` with `177` public article routes and `354` article-image binaries
- Rendered two-image, visible-copy, and grammar verification: `PASS`
- ESLint: `PASS`
- Unit tests: `596/596 PASS` across `65/65` files
- Deployment, live verification, and reconciliation: `PASS`

## Production publication and reconciliation

- Publication commit: `3357923`
- Vercel deployment: `dpl_3XaCYGDb6pZS4YJr1sQ86YEoP3wV` (`READY`)
- Deployment origin: `https://mrx-nhh3l6ggb-team-mrx.vercel.app`
- Active production targets verified: Vercel protected origin, `mrx-web.vercel.app`, `mineralrightsxchange.com`, `www.mineralrightsxchange.com`, and `mrx-web-team-mrx.vercel.app`
- Canonical route: `https://mineralrightsxchange.com/blog/texas-rrc-pooling-filing-retrieval-provenance-worksheet/`
- Route assertions: `HTTP 200`, exact canonical URL, exact H1, `Article` and `FAQPage` schema, five FAQs, six authoritative source links, and indexable metadata
- Hero/share assertions: visible hero, `og:image`, `twitter:image`, schema image, image dimensions, alt metadata, and live bytes all resolve to the canonical exact-title asset; SHA-256 `6e9fe5ef10871a17083fc832d893d14eb611c77d9098e18af0c2ac0909643440`
- Inline-image assertions: distinct composition, exact-keyword alt metadata, expected dimensions, and live bytes; SHA-256 `76e9a86fad240955f518f9087f8daf6ca475ede4d8fadf26fa224617d3e340f1`
- Browser verification: `PASS` in configured Google Chrome at `1440x1000` and `390x844`; exact title and both article images rendered without clipping or horizontal overflow. The extension-backed surface was temporarily unavailable, so the same configured Chrome binary was exercised headlessly.
- Browser-verification evidence SHA-256: `34f3e8a5ce9ebb6dfed145e041e964b826b75bccc4d83f7113c1be54220905e8`
- Production verifier: `169/169 PASS`, `0` failures, `177` live public article routes, retained-baseline `PASS`, deployment `PASS`, interface `PASS`, overall `PASS`
- Post-publication evidence SHA-256: `53eb356a7412e5de7c6eb7a0b2761e38f200e0e2612c37324afb376859203af6`
- Reconciliation: canonical MRX1000 ledger now records `169` publication-and-production-verified articles; signed release batch and all derived lifecycle artifacts regenerated without blockers
