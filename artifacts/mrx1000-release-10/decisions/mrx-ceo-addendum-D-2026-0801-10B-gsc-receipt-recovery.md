# MRX CEO Addendum — D-2026-0801-10B — GSC Replacement Receipt Rebinding to D-2026-0801-10

## 1. Decision control

- Addendum ID: **D-2026-0801-10B**
- Parent decision: **D-2026-0801-10**
- Related prior addendum: **D-2026-0801-10A**
- Classification: **SIGNED — GSC RECEIPT REBIND ONLY — FAIL CLOSED**
- Scope: supersede only the missing historical GSC receipt hash bindings in D-2026-0801-10 with the fresh settled-byte replacement evidence verified below
- Signer: mrx_ceo
- Role: Executive stakeholder, MineralRightsXchange.com
- Signature timestamp (UTC): 2026-08-01T02:45:05Z

## 2. Trigger and authority basis

D-2026-0801-10 admitted the exact 15 Wave 2 rows and correctly established the controlling cap-25 / exact-25 release gate, but its GSC receipt binding in §5 no longer reflects the final durable replacement receipts recovered by the later fresh read-only Search Console URL Inspection run. Parent task t_42b25b9e recovered those settled replacement receipts and verified their sidecars and shared-copy parity.

This addendum therefore preserves the entirety of D-2026-0801-10 except for the historical GSC receipt hash literals in parent §5. Those parent §5 GSC hash bindings are superseded solely by the replacement evidence in §5 of this addendum.

## 3. Verification performed immediately before signing

The following artifacts and sidecars were independently re-verified at signing time:

1. Controlling parent decision:
   - `artifacts/mrx1000-release-10/decisions/mrx-ceo-decision-10-to-25-wave2-batch-admission-2026-0801-10.md`
   - SHA-256 `d78eba9cd8ce17b50a70331f6c5a3cb3bd4f4537f7c2ea9d3d0084fc6c1562c7`
   - sidecar check returned `OK`
2. Controlling hero-hash addendum:
   - `artifacts/mrx1000-release-10/decisions/mrx-ceo-addendum-D-2026-0801-10A-wave2-hero-hash-rebinding.md`
   - SHA-256 `b82d00241a3038089fb9856fae4f5409e4cf4003c203320271bc824a4901694d`
   - sidecar check returned `OK`
3. Replacement GSC JSON receipt:
   - `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.json`
   - SHA-256 `2cb5dc4c292a85dae696155c88659a0cd9975a38393a2ea478fd339e27a1af24`
   - sidecar check returned `OK`
4. Replacement GSC markdown receipt:
   - `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.md`
   - SHA-256 `a88750d69d0e37490d5659efd572bcfdcc2407d141258501eb48b1f6ff4b60fe`
   - sidecar check returned `OK`

Independent re-verification of the replacement GSC receipts also confirmed all of the following from settled bytes:

- shared repo copy is byte-identical to the isolated workspace copy for both the JSON and markdown receipts
- `batch_sha256` remains `9fe2474131062dba5961ae9248b7e93271e0e9b54d60b60351da40ad04e278ec`
- exactly 10 URL records are present
- raw verdict summary is `PASS: 10`, `FAIL: 0`, `NEUTRAL: 0`
- indexing state summary is `INDEXING_ALLOWED: 10`
- property is `sc-domain:mineralrightsxchange.com`
- scope is `https://www.googleapis.com/auth/webmasters.readonly`
- `request_indexing_mutation_used` is `false`

## 4. Preserved invariants and fail-closed constraints

This addendum does not supersede, expand, or narrow any part of D-2026-0801-10 or D-2026-0801-10A except the parent decision's historical GSC receipt hash bindings. It preserves unchanged:

1. Every admitted row from D-2026-0801-10, including all exact row identities and the exact row order.
2. Every article SHA-256 and every hero SHA-256 as controlled after D-2026-0801-10A.
3. The cumulative cap of 25, exact admitted count of 25, and fail-closed no-26th-row rule.
4. The D-04 canonical ledger identity and parent decision authority chain.
5. All parent release gates, fail-closed controls, and no-bypass policy.
6. All publication, deployment, MDX, config, asset, script, test, and receipt non-mutation constraints already stated by the parent and prior addendum.

If any downstream consumer cannot bind the parent decision, addendum 10A, and the replacement GSC receipts in §5 together without changing any admitted row, order, article binding, hero binding, cap control, D-04 identity, or gate control, it must fail closed.

## 5. Superseding GSC replacement receipt binding

The parent decision's historical GSC receipt hash bindings in D-2026-0801-10 §5 are superseded only by the following replacement evidence bindings:

- `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.json` — SHA-256 `2cb5dc4c292a85dae696155c88659a0cd9975a38393a2ea478fd339e27a1af24`
- `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.md` — SHA-256 `a88750d69d0e37490d5659efd572bcfdcc2407d141258501eb48b1f6ff4b60fe`

These are replacement evidence bindings only. They do not create any extra admission, do not authorize any indexing request or Search Console mutation, and do not confer any deploy, publish, or release authority.

## 6. Disposition

Disposition: PASS.

D-2026-0801-10 remains controlling for the exact Wave 2 admission, cap-25 / exact-25 gate, D-04 identity, and all fail-closed release constraints, as already narrowed by D-2026-0801-10A for hero SHA rebinding. This addendum only replaces the missing historical GSC receipt hash bindings with the exact settled replacement hashes in §5.

## 7. Non-authorization statement

This addendum does not authorize extra admission, a 26th row, publication, deployment, MDX frontmatter flips, release-config edits, receipt regeneration, Search Console mutation, request indexing, script execution, test execution, shared-repo modification, or any bypass of the parent gate structure.

## 8. SHA-256 sidecar

See companion sidecar `mrx-ceo-addendum-D-2026-0801-10B-gsc-receipt-recovery.md.sha256` containing `<hex64>  mrx-ceo-addendum-D-2026-0801-10B-gsc-receipt-recovery.md` against the bytes of this file. Independently verifiable with:

`cd artifacts/mrx1000-release-10/decisions && shasum -a 256 -c mrx-ceo-addendum-D-2026-0801-10B-gsc-receipt-recovery.md.sha256`

— Signed, mrx_ceo, 2026-08-01T02:45:05Z
