# MRX1000 Wave 90 Release Record

- Release-sequence article: `170`
- Program row: `MRX1000-0275`
- Selection decision: `MRX1000-W90-SELECT-2026-08-23`
- Canonical title: `Texas RRC Drilling-Permit Query Retrieval Provenance Worksheet`
- Canonical slug: `texas-rrc-drilling-permit-query-retrieval-provenance-worksheet`
- Release authority: `D-2026-0804-16` and the `2026-08-14` MRX no-approval directive

## Rollback readiness

If the Article 170 deployment fails a production gate, immediately restore every active production alias to the last verified deployment `dpl_3XaCYGDb6pZS4YJr1sQ86YEoP3wV`, then rerun the full production verifier before any ledger reconciliation.

## Pre-publication status

- Identity and cannibalization decision: `PASS`
- Original planning identity: `REJECTED_FOR_VALUATION_AND_LOCATION_DRIVER_CANNIBALIZATION`
- Replacement scope approved by Chesty and `mrx_ceo`: `PASS`
- Authoritative source retrieval: `6/6 PASS`
- Editorial, factual-citation, and compliance review: `3/3 PASS`
- Article body tokens: `1,978`
- FAQ count: `5`
- Article SHA-256: `7db599bed3732224865516d91304b38d17ab613c10ead32e76d35ea7cb34e128`
- Selection-decision SHA-256: `ff9948aacfc68c5cc348672bbf9662439cdf437861af55572e9282e00b95a228`
- Evidence-packet SHA-256: `326f98e8137712235bf2152f5fc36b5876c60a3eb051b72a56e089bd0c827d2e`
- Normalized-review SHA-256: `17b1204b46a439e6573a8f5ced04f37083b62c0b59005d6de42b33dde62599d2`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Hero SHA-256: `71e2deffffa7abccafcfd3799106773a7451da45ef4f68e5cb566ae7266d490e`
- Inline SHA-256: `e5058131e0893078f0299db7070b02a77415314579786ea8b92de287aacef3f0`
- Canonical ledger: `1,000/1,000` unique rows; Article 170 is the exact `MRX1000-0275` replacement identity
- Pre-publication canonical ledger JSON SHA-256: `f5e49d899483600d005e4f09a15689435ad95ce44c05fc7f5cff70555b36de39`
- Pre-publication canonical ledger CSV SHA-256: `c8585f20c758111eb8dee99d523f71a13390cfc0327f5aef48fea661b0bd1a3d`
- Release batch: `170/170` exact admissions
- Release-batch SHA-256: `fe3d51c5dac75f4062e34904840f198129348304908c64328e1e1ef823c519a6`
- Automated release gates: `170/170 PASS`; `0` blocking findings
- Release-gate JSON SHA-256: `dd240b9c4af82799eb9bd4b659299f84c81c463de1eb1cf5bd13add02ced650a`
- Publication manifest: `170/170 READY`
- Production build: `PASS` with `178` public article routes and `356` article-image binaries
- Rendered two-image, visible-copy, and grammar verification: `PASS`
- ESLint: `PASS`
- Unit tests: `596/596 PASS` across `65/65` files
- Deployment, live verification, and reconciliation: `PENDING`

## Production publication and reconciliation

- Publication commit: `PENDING`
- Vercel deployment: `PENDING`
- Active production targets: Vercel protected origin, `mrx-web.vercel.app`, `mineralrightsxchange.com`, `www.mineralrightsxchange.com`, and `mrx-web-team-mrx.vercel.app`
- Canonical route: `https://mineralrightsxchange.com/blog/texas-rrc-drilling-permit-query-retrieval-provenance-worksheet/`
- Required route assertions: `HTTP 200`, exact canonical URL, exact H1, `Article` and `FAQPage` schema, five FAQs, six authoritative source links, and indexable metadata
- Required hero/share assertions: visible hero, `og:image`, `twitter:image`, schema image, image dimensions, alt metadata, and live bytes must all resolve to the canonical exact-title asset
- Required inline-image assertions: distinct composition, exact-keyword alt metadata, expected dimensions, and live bytes must all pass
- Browser verification: `PENDING`
- Production verifier: `PENDING`
- Post-publication evidence SHA-256: `PENDING`
- Reconciliation: `PENDING`
