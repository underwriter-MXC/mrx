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
- Evidence-packet SHA-256: `81bfbbe87f0c6619ac800e23de731ad4eae151c0f7219af673ce15181775f251`
- Normalized-review SHA-256: `17b1204b46a439e6573a8f5ced04f37083b62c0b59005d6de42b33dde62599d2`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Hero SHA-256: `71e2deffffa7abccafcfd3799106773a7451da45ef4f68e5cb566ae7266d490e`
- Inline SHA-256: `e5058131e0893078f0299db7070b02a77415314579786ea8b92de287aacef3f0`
- Canonical ledger: `1,000/1,000` unique rows; Article 170 is the exact `MRX1000-0275` replacement identity
- Reconciled canonical ledger JSON SHA-256: `2a992462b1a2cadd39e0aa7b77f7caa125749d56299548718e494d39cdba8522`
- Reconciled canonical ledger CSV SHA-256: `d42cb3ab022be966bc8d232bd940b3dd96a61d0b959f5df4e46e93a1b1245608`
- Release batch: `170/170` exact admissions
- Release-batch SHA-256: `3138526bfb4397b1760af01ec98ae6a3fa2372f4d771de24b7c05c02289abe46`
- Automated release gates: `170/170 PASS`; `0` blocking findings
- Release-gate JSON SHA-256: `e103d4fb06a08422da731f8b74153bd083e476b5ab72750aac8bb09cfa83a435`
- Publication manifest: `170/170 READY`
- Production build: `PASS` with `178` public article routes and `356` article-image binaries
- Rendered two-image, visible-copy, and grammar verification: `PASS`
- ESLint: `PASS`
- Unit tests: `596/596 PASS` across `65/65` files
- Deployment, live verification, and reconciliation: `PASS`

## Production publication and reconciliation

- Publication commit: `3449e1b`
- Vercel deployment: `dpl_4BgiTiR5vNdHqABNmoW15Pc4GtQd` (`READY`)
- Deployment origin: `https://mrx-g2aaw0dqq-team-mrx.vercel.app`
- Active production targets verified: Vercel protected origin, `mrx-web.vercel.app`, `mineralrightsxchange.com`, `www.mineralrightsxchange.com`, and `mrx-web-team-mrx.vercel.app`
- Canonical route: `https://mineralrightsxchange.com/blog/texas-rrc-drilling-permit-query-retrieval-provenance-worksheet/`
- Route assertions: `HTTP 200`, exact canonical URL, exact H1, `Article` and `FAQPage` schema, five FAQs, six authoritative source links, and indexable metadata
- Hero/share assertions: visible hero, `og:image`, `twitter:image`, schema image, image dimensions, alt metadata, and live bytes all resolve to the canonical exact-title asset; SHA-256 `71e2deffffa7abccafcfd3799106773a7451da45ef4f68e5cb566ae7266d490e`
- Inline-image assertions: distinct composition, exact-keyword alt metadata, expected dimensions, and live bytes; SHA-256 `e5058131e0893078f0299db7070b02a77415314579786ea8b92de287aacef3f0`
- Browser verification: `PASS` in extension-backed Google Chrome at `1440x1000` and `390x844`; exact title and both article images rendered without clipping or horizontal overflow
- Browser-verification evidence SHA-256: `0214fb52fe47346427ad83a837474cd134d3b0a063811c89b497eef09ae7eca3`
- Production verifier: `170/170 PASS`, `0` failures, `178` live public article routes, retained-baseline `PASS`, deployment `PASS`, interface `PASS`, overall `PASS`
- Post-publication evidence SHA-256: `75876beb183adcc504a119ee09b05d1983aeed4aa12b9fa5a399a5d98f4ce1c0`
- Reconciliation: canonical MRX1000 ledger records `170` publication-and-production-verified articles; signed release batch and all derived lifecycle artifacts regenerated without blockers
