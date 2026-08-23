# MRX1000 Wave 81 Release Record

- Release-sequence article: `161`
- Program row: `MRX1000-0266`
- Selection decision: `MRX1000-W81-SELECT-2026-08-23`
- Canonical title: `Post-Production Cost Evidence Packet for Royalty Records`
- Canonical slug: `post-production-cost-evidence-packet-for-royalty-records`
- Release authority: `D-2026-0804-16` and the `2026-08-14` MRX no-approval directive

## Rollback readiness

If the Article 161 deployment fails a production gate, immediately restore every active production alias to the last verified deployment `dpl_HVk7jXLaQatZL4Tu7v4z2iTwQJHa`, then rerun the full production verifier before any ledger reconciliation.

## Pre-publication status

- Identity and cannibalization decision: `PASS`
- Authoritative source retrieval: `5/5 PASS`
- Editorial, factual-citation, and compliance review: `PASS`
- Exact-title hero/share and distinct exact-keyword inline image: `PASS`
- Article SHA-256: `8528e6f97b85b6ad8fac6f77a71920371e60321d96ccceb3fb2fedbc114dfb0b`
- Selection-decision SHA-256: `638a424ab8c7ff96de80950e23d0b86dc93dcf54a39bcd66eae2ef9b860d3046`
- Hero SHA-256: `106beb6e191e5d937db37ba4218c513f220dae1d5b5ce0af5d487b65dd2dd64a`
- Inline SHA-256: `621be9597c40952fe865fcd156e77ddd716333ffba311efa774903fbbce6d74f`
- Article body and FAQ depth: `1,707 words / 5 FAQs`
- Release packets and gates: `161/161 PASS`, zero blocking findings
- Production build and rendered-HTML assertions: `PASS`
- Built hero and inline asset byte assertions: `PASS`
- Lint: `PASS`
- Unit tests: `596/596 PASS`
- Pre-publication canonical-ledger JSON SHA-256: `0a053f88ec3658f8253e0a0fa3ef1210a23232d0aeea1316e4b6f52c89f2ce61`
- Pre-publication canonical-ledger CSV SHA-256: `e36764ecb4e65c52ac956dd02e59467102352239bcf3840f6e558bc57cdb1bf3`
- Pre-publication release-batch SHA-256: `53540f523c312ddef4f6579cf3d8c6bdcbfd5ffa668a9c0db4f64ca2a0083859`
- Deployment, live verification, and reconciliation: `PASS`

## Production result

- Publication commit: `c0c0978445ee7eaea117a8a1612ab1faa5f82136`
- Final corrective release commit: `06bf592cc095812d56de625b8b81cd86ebca1c5d`
- Visual-QA correction before reconciliation: removed one redundant Markdown image so the layout-managed inline image renders exactly once
- Final deployment ID: `dpl_F6p59tHPZVWs74s735oNe83yZj58`
- Final deployment URL: `https://mrx-c3k4wxngp-team-mrx.vercel.app`
- Vercel inspection: `https://vercel.com/team-mrx/mrx-web/F6p59tHPZVWs74s735oNe83yZj58`
- Active production aliases: apex, `www`, `mrx-web.vercel.app`, and `mrx-web-team-mrx.vercel.app`
- Fresh apex, `www`, and public Vercel exact-title/metadata/schema assertions: `PASS`
- Fresh apex hero and inline HTTP/MIME/byte assertions: `PASS`
- Exact live inline-image occurrence count: `1 PASS`
- Browser verification generated at: `2026-08-23T11:05:15.087Z`
- Browser verification SHA-256: `19506be0999d9a3bde4b05254f49b39def92fc195666088b0e4ab9daed5e19d8`
- Browser desktop/mobile disposition: `PASS`
- Production verifier generated at: `2026-08-23T11:06:27.470Z`
- Production verifier SHA-256: `2b3516a240e7bcbbc38aad1eda7df582ad432f79a8c350cc2e21e3291f9c9f3a`
- Production verifier: `161/161 PASS`, zero failures, `169` public article routes
- Canonical MRX1000 published-and-live-verified count: `161`
- Final canonical-ledger JSON SHA-256: `faa936b12fe0a5de09c3d36f96e1f10733be05b391a7ef950de12002b926971f`
- Final canonical-ledger CSV SHA-256: `d8da958e39209500f449344a674bfb2e69b6c6da8256da193ca6a44e550db9e6`
- Final release-batch SHA-256: `c2ebc98f8a3011fba82da97bd64c176f0cf52ed666eaa138a85a01349058ead3`
- Reconciliation disposition: `PASS`
