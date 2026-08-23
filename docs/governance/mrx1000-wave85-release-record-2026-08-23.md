# MRX1000 Wave 85 Release Record

- Release-sequence article: `165`
- Program row: `MRX1000-0741`
- Selection decision: `MRX1000-W85-SELECT-2026-08-23`
- Canonical title: `How to Build an Andrews County Mineral Rights Public-Record Locator`
- Canonical slug: `andrews-county-mineral-rights-public-record-locator`
- Release authority: `D-2026-0804-16` and the `2026-08-14` MRX no-approval directive

## Rollback readiness

If the Article 165 deployment fails a production gate, immediately restore every active production alias to the last verified deployment `dpl_CtLCA26n4AvudY5Xcq5vTAeNQBpy`, then rerun the full production verifier before any ledger reconciliation.

## Pre-publication status

- Identity and cannibalization decision: `PASS`
- Original planning identity: `REJECTED_FOR_CANNIBALIZATION`
- Replacement scope approved by Chesty and `mrx_ceo`: `PASS`
- Authoritative source retrieval: `8/8 PASS`
- Editorial, factual-citation, and compliance review: `PASS`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Article SHA-256: `a4764e033823a46aec67b0df58da1bd8227c2248078d0c6f0ecda06aea538fcc`
- Selection-decision SHA-256: `73cfad9f5f2fe682f1d653afa5939b7605baa6eb17d9195b09ec4b99a575d293`
- Hero SHA-256: `c651b77b496cbdc25491617dd50872f972eb2c01fa0575ef0062c13e935b41bc`
- Inline SHA-256: `7be198091d268da2ef4da4c44353876b2594cc93ff16c45cc8070772d8d088e0`
- Article body and FAQ depth: `2,022 words / 5 FAQs`
- Release packets and gates: `165/165 PASS`, zero blocking findings
- Production build and rendered-HTML assertions: `PASS` (`173` public article routes; `346` image binaries)
- Built hero and inline asset byte assertions: `PASS`
- Lint: `PASS`
- Unit tests: `596/596 PASS`
- Pre-publication canonical-ledger JSON SHA-256: `ddecefdd136ff59cf8235c07c368539859371a32a82dbfc87f1bed798df771e4`
- Pre-publication canonical-ledger CSV SHA-256: `f8de67dd2dc9190c1e166a4829ae86c399d24979354ece94d57108233b4a5e33`
- Pre-publication release-batch SHA-256: `3bc5247030c22a2e32741b8141d4451353108f99d7786c6697d881e55fc109f8`
- Deployment, live verification, and reconciliation: `PASS`

## Production result

- Publication commit: `a2ed8c0df083505387175081750684977ca7e43b`
- Final deployment ID: `dpl_CRK5MiFGJ3K36wCFpyhGpmBsoFHz`
- Final deployment URL: `https://mrx-n7ji2rtyj-team-mrx.vercel.app`
- Vercel inspection: `READY`; all four active production aliases attached
- Active production aliases: apex, `www`, `mrx-web.vercel.app`, and `mrx-web-team-mrx.vercel.app`
- Fresh exact-title/metadata/schema assertions: `PASS` on apex, `www`, `mrx-web.vercel.app`, and the protected team alias
- Fresh hero and inline HTTP/MIME/byte assertions: `PASS`; production bytes match the admitted SHA-256 values
- Exact live inline-image occurrence count: `1` per verified target
- Browser desktop/mobile disposition: `PASS`; no clipping, overlap, garbling, or horizontal overflow
- Production verifier: `165/165 PASS`, zero failing articles, retained baseline `PASS`, deployment `PASS`, interface `PASS`; evidence SHA-256 `32f5cc27c63b8df68f30ee5c6806950ba9cbe5c93e7849948509a5bc9188c962`
- Canonical MRX1000 published-and-live-verified count: `165`
- Final canonical-ledger JSON SHA-256: `5c66315537a92ab53ffaef108d53496bedbf3d40cf1995986d366b883c9f28f6`
- Final canonical-ledger CSV SHA-256: `2f460aec8f00a3535ae8d31c5e2d099d4d6793622f57e1937b1244280209e221`
- Final release-batch SHA-256: `246b826acc64dddd8f4e7b02736f6fe8cfcbeac29baa1139d41bddc172c7036d`
- Reconciliation disposition: `PASS`; program row `MRX1000-0741` is `live_public_published_route_release_10_verified`
