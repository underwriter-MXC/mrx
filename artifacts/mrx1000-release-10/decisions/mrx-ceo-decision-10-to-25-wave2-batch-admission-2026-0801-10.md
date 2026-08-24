# CEO Decision D-2026-0801-10 — Wave 2 Exact Batch Admission (10 → 25, exact 15)

Decision ID: D-2026-0801-10
Program: MRX 1,000 Article SEO+AEO Production Program
Artifact: authorized_release_10_batch → cap-25 / exact-25 admission
Decision authority: mrx_ceo
Disposition: PASS — admit exact 15 (3 of 25 withheld)
Signed at UTC: 2026-08-01T00:50:00Z
Authoring run: kanban t_6396e688 / run 256

## 1. Scope and authority

This decision is issued under the standing CEO authority captured in D-2026-0731-09 (10 → 25 planning cap, but explicitly admitting no new MDX and leaving the release config at cap 10 until SCALE-10 exact-batch admission). Its sole purpose is to authorize the exact-batch transition from `authorized_release_10_batch` (cap 10) to a fail-closed `cap=25 / exact=25` release config that recognizes exactly the 15 Wave 2 MDX rows enumerated below and rejects substitutions or any 26th MRX1000 row. It does not authorize production deployment, do not publish or flip MDX; it authorizes the package that downstream t_1131d6f5 will execute in an isolated payload.

## 2. Mandatory parents — all PASS at signing time

| Parent | What it proves | Verifying artifact | Verifying SHA-256 (first 16) |
|---|---|---|---|
| t_2e9dd5de | Wave 2 strict pre-release QA: 15/15 PASS, all draft/noindex, >500 words, unique 1200×630 WebPs, D-04 unchanged | `reports/mrx1000-wave2-pre-release-qa.json` | `66b07a621a0c511d` |
| t_b19f5dd8 | Authoritative numeric-exit QA packet `20260801T003929Z` | `reports/mrx1000-wave2-final2-gates.log` | `c66a572ee9a33a7c` |
| t_6ecbd24a | Original durable GSC URL inspection receipts (post-build) | `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.json` | (recorded in D-2026-0731-09) |
| t_6348c65e | Late-stale-sidecar repaired by fresh read-only 10-URL reinspection (final disk state) | `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.json` | `92ef1116d4978714` |
| t_d9c13bd9 | Canonical D-04 ledger identity restored and tests non-destructive | `config/mrx-1000-canonical-content-ledger.json` | `897de9c3aa0f40bc` |
| t_ef242edd (D-2026-0731-09A) | Batch-config hash correction; binding hash below | `config/mrx1000-release-10-batch.json` | `9fe2474131062dba` |

Independent re-verification of every SHA sidecar listed above was performed by run 256 immediately before signing; all `sha256sum -c` checks returned `OK` from within each file's directory.

## 3. Canonical ledger identity preserved (D-04)

The controlled canonical identity of record remains unchanged. This admission is appended onto, not substituted into, that identity.

- canonical_ledger_sha256 (JSON): `897de9c3aa0f40bc32f63638f2fd847e9788b7100a1c97d6ffbe23f226957559`
- canonical_ledger_sha256 (CSV):  `027691327d6c7cb93a2ab93340275e48c9ccfa21caf01fe3a01d0830e4b8006a`
- batch_config_sha256 (current cap-10 state): `9fe2474131062dba5961ae9248b7e93271e0e9b54d60b60351da40ad04e278ec`
- identity authority: D-2026-0723-LEDGER-04 (`artifacts/mrx1000-release-10/decisions/mrx-ceo-ledger-provenance-successor-20260723-04.md`, SHA-256 `09eca24bcd0e71563f2ac4197f564eec0ccb43a5ee955216da5c4a2543d04978`); extended by t_d9c13bd9.
- program_row_id naming: byte-identical uppercase `MRX1000-####`, sourced from the canonical ledger and reconciled in t_d9c13bd9.

## 4. Wave 2 QA evidence bound (immutable current bytes)

The decision binds exclusively to the authoritative packet generated at `20260801T003929Z`. Earlier packet hashes in Codex comment history are superseded and not admissible as evidence.

- Wave 2 QA JSON: `reports/mrx1000-wave2-pre-release-qa.json` — SHA-256 `66b07a621a0c511d7aa2bb1e964d8a6412388b1bcbe205588168b782a3c766fb` (decision: PASS; 15 PASS / 0 HOLD; all draft/noindex; all >500 words; 15 unique 1200×630 WebPs; D-04 hashes unchanged; no publication/deployment/SearchAtlas/GSC mutation).
- Wave 2 QA markdown: `reports/mrx1000-wave2-pre-release-qa.md` — SHA-256 `9d3e5d30e82bbcdc429f0a7c083b7888a8149aac2b2086ffbcdd2e8da8d60968`.
- Versioned release manifest: `reports/mrx1000-wave2-release-manifest-20260801T003929Z.json` — SHA-256 `03d699d872df26f17449e65452a87527cf836aa19be52edebb1dcc4e4ba967d6`.
- Rollback packet: `reports/mrx1000-wave2-rollback-packet-20260801T003929Z.json` — SHA-256 `4c1aa511ee347189609ce31fd1502befecdc58eeb388c22b614eaa642af7e71d`.
- Final gates log: `reports/mrx1000-wave2-final2-gates.log` — SHA-256 `c66a572ee9a33a7c3981d51f0af544ab3ae01cbc19757d62f3fc17e506087dc0`.

## 5. GSC URL inspection parent — final disk state

Final fresh read-only reinspection at `2026-08-01T00:44:44Z`, after writer quiescence; both sidecars passed twice and confirm 10/10 URLs on Google, all canonical/indexing assertions true, read-only/no mutation.

- `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.json` — SHA-256 `92ef1116d49787144e887c87005547207a5172940a3e7e130ca83867136a89e0`.
- `reports/mrx1000-release-10-lifecycle/gsc-url-inspection-2026-07-31.md` — SHA-256 `2ad8df6f506876ead5947b0cf1d8161b60fd5b82c392bc0899961735c6b8c8fd`.

## 6. Authorized exact 15 rows — Wave 2

The following 15 MDX rows are admitted. All values were mechanically extracted from `reports/mrx1000-wave2-pre-release-qa.json` (SHA-256 `66b07a621a0c511d…`); every `program_row_id` is byte-identical uppercase per §3. Every MDX file remains `publication_status: "draft"` and `noindex: true` until the downstream t_1131d6f5 release workflow flips the admitted subset as defined in §9. All 15 rows pass `final_status: "PASS"` with `hold_reasons: []`.

| program_row_id | canonical slug | finalized title | article SHA-256 | hero SHA-256 | words |
|---|---|---|---|---|---|
| MRX1000-0736 | `what-are-mineral-rights-a-complete-guide-for-texas-landowners` | What Are Mineral Rights? A Complete Guide for Texas Landowners | `b24c1e1da727689305355708081b78b301a7b58942e084c44a40738761e6749d` | `2f4fdbf69d6d44a55e8ae0c04a1320394653292aecac1f533f12308be8eb2ff1` | 655 |
| MRX1000-0876 | `how-to-find-out-if-you-own-mineral-rights-in-texas` | How to Find Out If You Own Mineral Rights in Texas | `6f7fa0ff0d863774c52e81f0167dff79ab59aeb56b13c0eb8dd041c86ad756ab` | `f2662764cce19f9cf20ddea775299646e7fc6d76c67d001b53af7a5e3146f086` | 561 |
| MRX1000-0429 | `how-to-trust-that-your-mineral-rights-will-be-valued-fairly` | How to Trust That Your Mineral Rights Will Be Valued Fairly | `27528ce4d7a610694f4fe7dc505c7880dc8d6d2f40b2b2c8509c777ef083fcac` | `4e1337b1a4e09229f88434e996e0f3f9e6814f7fd5a0d52128237bd0941952f8` | 557 |
| MRX1000-0632 | `how-texas-mineral-rights-ownership-works-deeds-conveyances-and-title` | How Texas Mineral Rights Ownership Works: Deeds, Conveyances, and Title | `3c145fb97ab7e7112b8c80440ec2721fc0fa1f0651cf6442eb874a643b149786` | `613e0cd7d76d33f8d4be77266c71e4707e942288f774a94fc313025011073d91` | 515 |
| MRX1000-0303 | `how-to-find-a-reputable-mineral-rights-buyer-in-texas` | How to Find a Reputable Mineral Rights Buyer in Texas | `c92d82150c14af9b36748e0fd2d3d1416b13995fa09619caeac0b9a1e7452f44` | `50b60a104f5fa55a82b4ff28107889a7f2b2e2716e48eea57c3045645026224c` | 504 |
| MRX1000-0970 | `understanding-our-transparent-approach-to-mineral-rights-reviews-versus-traditional-selling-tactics` | Understanding Our Transparent Approach to Mineral Rights Reviews Versus Traditional Selling Tactics | `7c3929b9df488aa0336aa93b110267f7606650bab5c1a9ea3b11d5fc4752b44b` | `81c92aae49b92197bb298cf9b400a21719a5990888451649f5a45adeac4b3059` | 514 |
| MRX1000-0001 | `can-you-sell-part-of-your-mineral-rights-partial-interest-sales-explained` | Can You Sell Part of Your Mineral Rights? Partial Interest Sales Explained | `9e90ad08d21c010641dcc6f12d68522b3e0e67cdd6ebbc03ff349032479d664f` | `43858d61baa12079d4950b8c68a0be2134f69ed334ef3a9f3fd6d451bb47ad03` | 532 |
| MRX1000-0160 | `understanding-the-risks-of-skipping-an-independent-assessment-for-your-mineral-rights` | Understanding the Risks of Skipping an Independent Assessment for Your Mineral Rights | `097c738c326ee7863ae92f27f84db9e7b0c8786b5763cdb76d20653096cea6d8` | `6ef30ebaa0e7f5da0e2a24874556ddace4b156f91dd3b8d74459f4ada881184c` | 513 |
| MRX1000-0528 | `steps-to-take-if-your-royalty-checks-are-inconsistent-a-mineral-owners-guide` | Steps to Take if Your Royalty Checks Are Inconsistent: A Mineral Owner's Guide | `45718f12f425e8e4754ff946e3a1ed2cd443a62c7c1b8ecf08e08fa986a75077` | `ed8823c9546ac010eb6551d1b62e5529a17af1ca7f807cea3996cd34f6d6b006` | 536 |
| MRX1000-0737 | `what-is-your-texas-mineral-rights-worth` | What Is Your Texas Mineral Rights Worth? | `cba2a771f5b4aa61b64cf307d782a66d096e0b83a76a517bc6b26ea046b191d8` | `ae4fffeca4df8226fd52bde816de28fcbcfc2e7c639273b998b72489fe7ad30a` | 528 |
| MRX1000-0880 | `types-of-mineral-rights-in-texas-royalty-interests-working-interests-and-overriding-royalties-explained` | Types of Mineral Rights in Texas: Royalty Interests, Working Interests, and Overriding Royalties Explained | `9a104d6e247ce9b92dd90f84fbe0d40dba7336b3b1997949d0247a5338f2b5c2` | `8add19f905c1331035897210477a314c30afc495c974baa0ddceee7a6a7b5723` | 539 |
| MRX1000-0630 | `closing-costs-and-fees-when-selling-mineral-rights-in-texas` | Closing Costs and Fees When Selling Mineral Rights in Texas | `58cbeb7f8c9d9e837042bbe4d88fc1aa4c5cf591d374c7e28ae0313a810ea438` | `82f4693e8dfc844391fecc4794f902adeb354550bfcd384070869970c0a0d275` | 510 |
| MRX1000-0637 | `title-curative-for-mineral-rights-what-it-is-and-why-it-matters-before-you-sell` | Title Curative for Mineral Rights: What It Is and Why It Matters Before You Sell | `ed6e547bd789843f42acee5a569caa079cb95bb30ef638999ecdc99dce62914f` | `0bff11a938c5efd71b307a1e538449e1663d8f40ceeb1cae15a6a9957355e7e1` | 503 |
| MRX1000-0642 | `what-is-a-mineral-rights-purchase-agreement-and-what-should-it-include` | What Is a Mineral Rights Purchase Agreement and What Should It Include? | `24161c29ad76ca410cfe7f34bb8872ccf0ef7033c6bfd7305c8449f8b355b885` | `107bbc257e03ad114cd957777c70e2ea34380459c59f2e8007424a7626bfb758` | 532 |
| MRX1000-0886 | `why-mineral-rights-are-separate-from-surface-rights-in-texas-a-landowners-guide` | Why Mineral Rights Are Separate From Surface Rights in Texas: A Landowner's Guide | `7e15432ac09c7dc8c56ae4a8d0df88e2710799f4eb9bad3a4b0fcdeeef6fb7e1` | `3e2de648206102d07faeb3ed859c1171ac3430cc447962d0d4037965e12c6593` | 539 |

Cumulative authorized count after this admission: 10 (existing) + 15 (Wave 2) = 25 of 25 cap. The next 10 cap slots are reserved for the next cap-25→cap-50 batch admission (D-2026-0721-23 pending).

## 7. Fail-closed config and gate transition (the implementation contract)

This section is binding on t_1131d6f5. The release pipeline must apply this transition atomically and reject any deviation.

### 7.1 File under edit (only one)

`config/mrx1000-release-10-batch.json` (current bytes SHA-256 `9fe2474131062dba5961ae9248b7e93271e0e9b54d60b60351da40ad04e278ec`).

### 7.2 Required post-edit invariants (all must hold simultaneously)

- `policy.fail_closed`: `true` (already true; verify and preserve).
- `policy.authorization_cap_released_articles`: `25` (changed from `10`).
- `articles`: a single array of exactly 25 entries.
  - The existing 10 entries in `articles` (rows 1..10) are preserved **verbatim** — no field changes, no reordering, no slug/title/hash rewrites on those 10.
  - The array is modified **only** by appending the 15 new entries enumerated in §6 (rows 11..25), in the order listed in §6.
  - Each of the 15 appended entries must use `program_row_id` set byte-identically to the exact uppercase string in §6 (e.g. `MRX1000-0736`), not lowercase, and must include all canonical fields (`slug`, `title`, `canonical_url`, `article_sha256`, `hero_asset_sha256` if used, `finalization_state: "draft_noindex_admitted"`).
  - No removal, substitution, replacement, shuffle, or extra entries; a 26th entry fails closed.
- New `policy.exact_admitted_count`: `25`.
- New `policy.exact_admitted_slate_sha256`: SHA-256 over the canonicalized 25-row payload (rows array only, JSON-canonicalized). This must be recorded before edit; do not generate after the fact.
- New `decision_authority.batch_admission_decision_id`: `"D-2026-0801-10"`.
- New `decision_authority.batch_admission_decision_sha256`: the SHA-256 of this decision file (see §10 sidecar).
- Reproduce `identity_authority.canonical_ledger_sha256` etc. — never edit them; only verification.

### 7.3 Required release-gate transition

The current release gate (see `config/mrx1000-release-10-batch.json` and `artifacts/mrx1000-release-10/release/post-publication-verification.json`) accepts `cap_audit.cap_mismatch: false` only when `policy.authorization_cap_released_articles` equals `len(articles)` **and** `policy.exact_admitted_count`. After this edit:

- Gate type changes from `cap-10 / exact-10` to `cap-25 / exact-25`. The pipeline must explicitly assert both `cap==25` and `exact==25` against the §6 SHA-256 slate.
- Rejected substitutions: any MDX row whose `program_row_id`, `article_sha256`, or `slug` does not match the §6 record byte-for-byte fails closed and aborts the build.
- Rejected over-scope: any 26th MRX1000 row or any non-MRX1000 row beyond the existing 10 history fails closed.
- Rejected under-scope: a 24-row or smaller `articles` array fails closed.
- Forbidden inputs: any other `policy` field edits (e.g. changing `fail_closed`, `earned_scale_gates`, `continuing_batch_thresholds_after_50`) are out of scope for this decision and would invalidate it.

### 7.4 Required order of operations for the downstream release task t_1131d6f5

This admission is non-mutating on its own — it authorizes the downstream release to do the actual work in this exact order. Do not skip, do not reorder, do not publish first.

1. Build/verify packets and config gate — re-hash all of: pre-release QA JSON, versioned release manifest, rollback packet, final gates log, and pre-edit batch config. All must match §2/§4/§7.1 sidecar SHA-256s.
2. In an isolated payload, apply the single config edit per §7.2. Recompute `policy.exact_admitted_slate_sha256`, write the post-edit SHA-256 sidecar.
3. In the same isolated payload, **flip only the admitted 15** to `publication_status: "published"` and `noindex: false` in front matter and content-collection metadata. Leave the existing 10 unaffected (their state is already `published`, `indexed`); do not touch them.
4. Rerun the full required test suite, all three builds (default, Hetzner, Vercel), and the release gate that asserts cap-25/exact-25 against the slate SHA.
5. Deploy. Then live-verify on each active production target; roll back via the `reports/mrx1000-wave2-rollback-packet-20260801T003929Z.json` packet on any failure.
6. Publishing live, indexable HTML is the result of step 5, not a separate step — the previous draft of this decision incorrectly implied that; it is fixed here.

### 7.5 Standing reservation

Production deployment/publication remains conditional on the standing release authority (D-2026-0722-01 GO/NO-GO and any successor decisions). This admission authorizes t_1131d6f5 to execute steps 1–5 in an isolated payload; it does **not** itself publish, deploy, or flip MDX.

## 8. What is explicitly NOT authorized by this decision

- Publishing any of the 15 admitted rows live, or to any production target.
- Flipping any front-matter state (draft→published, noindex=true→false) in the live repo.
- Modifying any field other than `articles`, `policy.authorization_cap_released_articles`, and the two new `policy.exact_admitted_*` keys plus the two new `decision_authority.batch_admission_decision_*` keys specified in §7.2.
- Editing D-04 identity, the canonical ledger, or the existing 10-row history.
- Admitting a 26th MRX1000 row, removing any of the 15 enumerated rows, substituting row IDs, or reordering rows.
- Mutating any of the bound evidence artifacts (QA JSON, versioned manifest, rollback packet, gates log, GSC URL inspection files, canonical ledger, batch config).

## 9. Disposition and downstream action

Decision: PASS. Disposition authorizes t_1131d6f5 to execute steps (a)–(c) of the order in §7.4 in an isolated payload, with (d) deployment and (e) live-verification subject to the standing release authority. This decision itself is non-mutating. The release pipeline's cap-25/exact-25 gate transition is specified authoritatively in §7.3.

Upon confirmation that t_1131d6f5's pre-conditions hold (SHA-256s of §4/§5 evidence files unchanged, `articles` array of post-edit batch config matches §6 enumeration byte-for-byte, `policy.exact_admitted_slate_sha256` matches the slate-computed value, cap-25/exact-25 release gate passes), unblock t_1131d6f5 only for the exact 15 admitted rows in §6.

## 10. SHA-256 sidecar

See companion sidecar `mrx-ceo-decision-10-to-25-wave2-batch-admission-2026-0801-10.md.sha256` containing `<hex64>  mrx-ceo-decision-10-to-25-wave2-batch-admission-2026-0801-10.md` against the bytes of this file as written by kanban run 256. Independently verifiable with `cd artifacts/mrx1000-release-10/decisions && shasum -a 256 -c mrx-ceo-decision-10-to-25-wave2-batch-admission-2026-0801-10.md.sha256`.

Signed: mrx_ceo, 2026-08-01T00:50:00Z
