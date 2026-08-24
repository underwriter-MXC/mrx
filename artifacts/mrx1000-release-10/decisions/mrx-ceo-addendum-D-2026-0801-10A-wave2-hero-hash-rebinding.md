# MRX CEO Addendum — D-2026-0801-10A — Wave 2 Exact-15 Hero Hash Rebinding to D-2026-0801-10

## 1. Decision control

- Addendum ID: **D-2026-0801-10A**
- Parent decision: **D-2026-0801-10**
- Classification: **SIGNED — HERO-SHA REBIND ONLY — FAIL CLOSED**
- Scope: preserve the exact 15-row Wave 2 admission from D-2026-0801-10 and supersede only the 15 hero asset SHA-256 literals bound in parent §6
- Signer: mrx_ceo
- Role: Executive stakeholder, MineralRightsXchange.com
- Signature timestamp (UTC): 2026-08-01T02:19:16Z

## 2. Trigger and authority basis

D-2026-0801-10 correctly admitted the exact Wave 2 row slate and correctly bound the exact 15 `program_row_id` / slug / title / article SHA-256 values, but it bound hero SHA-256 values that were later invalidated by a systematic garbled metadata rendering defect in the prior creative path. The controlling remediation and independent revalidation artifacts now show 15/15 PASS for the corrected exact-15 creative assets.

This addendum therefore preserves the parent decision's exact row slate and article hashes and replaces only each row's hero SHA-256 with the independently verified corrected SHA-256 listed in §5 below.

## 3. Verification performed immediately before signing

The following artifacts and sidecars were independently re-verified at signing time:

1. Parent decision sidecar:
   - `artifacts/mrx1000-release-10/decisions/mrx-ceo-decision-10-to-25-wave2-batch-admission-2026-0801-10.md`
   - SHA-256 `d78eba9cd8ce17b50a70331f6c5a3cb3bd4f4537f7c2ea9d3d0084fc6c1562c7`
   - sidecar check returned `OK`
2. Original controlling Wave 2 exact-admission QA packet preserved from the parent decision:
   - `reports/mrx1000-wave2-pre-release-qa.json` — SHA-256 `66b07a621a0c511d7aa2bb1e964d8a6412388b1bcbe205588168b782a3c766fb`
   - `reports/mrx1000-wave2-pre-release-qa.md` — SHA-256 `9d3e5d30e82bbcdc429f0a7c083b7888a8149aac2b2086ffbcdd2e8da8d60968`
   - both sidecar checks returned `OK`
3. Creative remediation artifact set (corrected exact-15 hero bytes):
   - `artifacts/mrx1000-release-10/creative-remediation-15d/wave2-creative-remediation-15d-20260801T020500Z.json` — SHA-256 `7fdd3759452a4cc2313470e54174652379ca376b07aaa921a2044fea54818a62`
   - `artifacts/mrx1000-release-10/creative-remediation-15d/wave2-creative-remediation-15d-20260801T020500Z.md` — SHA-256 `059e84804055aacd150a3d8fa5afade8866e528007423d430a4bbeff6fa8a951`
   - both sidecar checks returned `OK`
4. Independent final revalidation artifact set (production 9x8 method):
   - `reports/mrx1000-wave2-creative-revalidate-9x8-20260801T021210Z/mrx1000-wave2-creative-revalidate-9x8-20260801T021210Z.json` — SHA-256 `b2994f8479beedf959e06901b8532e3564b045f4c561bc848e6ce10075bd723b`
   - `reports/mrx1000-wave2-creative-revalidate-9x8-20260801T021210Z/mrx1000-wave2-creative-revalidate-9x8-20260801T021210Z.md` — SHA-256 `71370c7fd5791b6e3d459f035af5ee16b3e9afbd7e96fe42fd01696f2d3fdb4d`
   - both sidecar checks returned `OK`
5. Official asset-evidence artifact pair referenced by the remediation report:
   - `artifacts/mrx1000-release-10/assets/asset-evidence.json` — SHA-256 `5d8d7c6071db7837d2962b287bc2388f9c07b8fbe0801ada9432feb7c29846c2`
   - `artifacts/mrx1000-release-10/assets/asset-evidence.md` — SHA-256 `8b8d1aaf29d72704ceed701026a48b1b506ad6c566d23b055a9e75256ccf21cf`
   - both sidecar checks returned `OK`

Independent row-level verification also confirmed:

- creative remediation JSON and independent revalidation JSON agree on the corrected hero SHA-256 for all 15 rows
- the parent decision's exact row order, slugs, titles, and article SHA-256 values are preserved byte-for-byte across the corrected evidence
- the independent revalidation disposition is PASS for all 15 rows, with same hero/social/schema path wiring true on all 15 rows

## 4. Preserved invariants and fail-closed constraints

This addendum does not supersede, expand, or narrow any part of D-2026-0801-10 except the 15 hero SHA-256 literals in parent §6. It preserves unchanged:

1. The exact 15 admitted Wave 2 rows, in the exact order listed in D-2026-0801-10 §6.
2. Every `program_row_id`, canonical slug, finalized title, and article SHA-256 in D-2026-0801-10 §6.
3. The cumulative authorization cap of 25 and exact admitted count of 25.
4. The D-04 canonical ledger identity and all parent decision authority chains.
5. Publication state, deployment state, shared-repo state, and all non-creative release controls.
6. The parent decision's non-authorization of release on the basis of admission alone.

This card does not mutate `config/mrx1000-release-10-batch.json`, the shared repo, MDX publication state, or production. If any downstream consumer cannot bind the corrected hero SHA-256 values from this addendum together with the verified remediation and revalidation artifacts below, it must fail closed.

## 5. Superseding exact-15 hero SHA binding

The table below preserves the original row slate and article hashes from D-2026-0801-10 while superseding only the hero SHA-256 field for each row.

| program_row_id | canonical slug | finalized title | article SHA-256 | prior hero SHA-256 (superseded) | corrected hero SHA-256 |
|---|---|---|---|---|---|
| MRX1000-0736 | `what-are-mineral-rights-a-complete-guide-for-texas-landowners` | What Are Mineral Rights? A Complete Guide for Texas Landowners | `b24c1e1da727689305355708081b78b301a7b58942e084c44a40738761e6749d` | `2f4fdbf69d6d44a55e8ae0c04a1320394653292aecac1f533f12308be8eb2ff1` | `a58aa883cf9684b7cd9dec63ed34df492f8d9cab670c5037bb5f1f8584ed8d25` |
| MRX1000-0876 | `how-to-find-out-if-you-own-mineral-rights-in-texas` | How to Find Out If You Own Mineral Rights in Texas | `6f7fa0ff0d863774c52e81f0167dff79ab59aeb56b13c0eb8dd041c86ad756ab` | `f2662764cce19f9cf20ddea775299646e7fc6d76c67d001b53af7a5e3146f086` | `185fca9f780564d50575c93a510c065ea7c6ca99e7de14577fb5baf40aad82e5` |
| MRX1000-0429 | `how-to-trust-that-your-mineral-rights-will-be-valued-fairly` | How to Trust That Your Mineral Rights Will Be Valued Fairly | `27528ce4d7a610694f4fe7dc505c7880dc8d6d2f40b2b2c8509c777ef083fcac` | `4e1337b1a4e09229f88434e996e0f3f9e6814f7fd5a0d52128237bd0941952f8` | `58a456b846f4d7d41149c4363465e8d4a93c4ee5aef3fd483ba9256ccc496340` |
| MRX1000-0632 | `how-texas-mineral-rights-ownership-works-deeds-conveyances-and-title` | How Texas Mineral Rights Ownership Works: Deeds, Conveyances, and Title | `3c145fb97ab7e7112b8c80440ec2721fc0fa1f0651cf6442eb874a643b149786` | `613e0cd7d76d33f8d4be77266c71e4707e942288f774a94fc313025011073d91` | `8e09d28960248de7c59db0acc552a46c894d0dac4bd1264394f15e8613f6314a` |
| MRX1000-0303 | `how-to-find-a-reputable-mineral-rights-buyer-in-texas` | How to Find a Reputable Mineral Rights Buyer in Texas | `c92d82150c14af9b36748e0fd2d3d1416b13995fa09619caeac0b9a1e7452f44` | `50b60a104f5fa55a82b4ff28107889a7f2b2e2716e48eea57c3045645026224c` | `c25e9582f697dac9340b018fd8bea31f96d136443111d47fec06744a389d242c` |
| MRX1000-0970 | `understanding-our-transparent-approach-to-mineral-rights-reviews-versus-traditional-selling-tactics` | Understanding Our Transparent Approach to Mineral Rights Reviews Versus Traditional Selling Tactics | `7c3929b9df488aa0336aa93b110267f7606650bab5c1a9ea3b11d5fc4752b44b` | `81c92aae49b92197bb298cf9b400a21719a5990888451649f5a45adeac4b3059` | `736991e4de773e2703ebce9d35312cfd71d3b527fc2137e2b593885ae0c9fec7` |
| MRX1000-0001 | `can-you-sell-part-of-your-mineral-rights-partial-interest-sales-explained` | Can You Sell Part of Your Mineral Rights? Partial Interest Sales Explained | `9e90ad08d21c010641dcc6f12d68522b3e0e67cdd6ebbc03ff349032479d664f` | `43858d61baa12079d4950b8c68a0be2134f69ed334ef3a9f3fd6d451bb47ad03` | `2a2b6f9be5a47b27babe339c1f166690c8d33c2beac142ed81ab9a3d20c90266` |
| MRX1000-0160 | `understanding-the-risks-of-skipping-an-independent-assessment-for-your-mineral-rights` | Understanding the Risks of Skipping an Independent Assessment for Your Mineral Rights | `097c738c326ee7863ae92f27f84db9e7b0c8786b5763cdb76d20653096cea6d8` | `6ef30ebaa0e7f5da0e2a24874556ddace4b156f91dd3b8d74459f4ada881184c` | `9f2f63fb37f9e6b00ea8ba6606010f0549f6c496b250bfcd43d18c9024a37d1f` |
| MRX1000-0528 | `steps-to-take-if-your-royalty-checks-are-inconsistent-a-mineral-owners-guide` | Steps to Take if Your Royalty Checks Are Inconsistent: A Mineral Owner's Guide | `45718f12f425e8e4754ff946e3a1ed2cd443a62c7c1b8ecf08e08fa986a75077` | `ed8823c9546ac010eb6551d1b62e5529a17af1ca7f807cea3996cd34f6d6b006` | `7a38173699e2e85cf7d0dc0d025eb6b7220fc27ec6d1274b20f82529bc30126b` |
| MRX1000-0737 | `what-is-your-texas-mineral-rights-worth` | What Is Your Texas Mineral Rights Worth? | `cba2a771f5b4aa61b64cf307d782a66d096e0b83a76a517bc6b26ea046b191d8` | `ae4fffeca4df8226fd52bde816de28fcbcfc2e7c639273b998b72489fe7ad30a` | `997740163e40a740b514f10732011dc89cd79665d0413a214ebb9f0d51ed5ac5` |
| MRX1000-0880 | `types-of-mineral-rights-in-texas-royalty-interests-working-interests-and-overriding-royalties-explained` | Types of Mineral Rights in Texas: Royalty Interests, Working Interests, and Overriding Royalties Explained | `9a104d6e247ce9b92dd90f84fbe0d40dba7336b3b1997949d0247a5338f2b5c2` | `8add19f905c1331035897210477a314c30afc495c974baa0ddceee7a6a7b5723` | `979cc3d7ad4ab9d83c0939fe60247ee8c3e3ae8850861a35161682d17daf1c3b` |
| MRX1000-0630 | `closing-costs-and-fees-when-selling-mineral-rights-in-texas` | Closing Costs and Fees When Selling Mineral Rights in Texas | `58cbeb7f8c9d9e837042bbe4d88fc1aa4c5cf591d374c7e28ae0313a810ea438` | `82f4693e8dfc844391fecc4794f902adeb354550bfcd384070869970c0a0d275` | `744c59a79d92f0ae9cf053c5fe186f3d273bddf127927915cdc01644c4047c4b` |
| MRX1000-0637 | `title-curative-for-mineral-rights-what-it-is-and-why-it-matters-before-you-sell` | Title Curative for Mineral Rights: What It Is and Why It Matters Before You Sell | `ed6e547bd789843f42acee5a569caa079cb95bb30ef638999ecdc99dce62914f` | `0bff11a938c5efd71b307a1e538449e1663d8f40ceeb1cae15a6a9957355e7e1` | `3cbfc96287a4c8947c6780a8d869d9cfa61d630cd18c18f6a78e0fe84fa45551` |
| MRX1000-0642 | `what-is-a-mineral-rights-purchase-agreement-and-what-should-it-include` | What Is a Mineral Rights Purchase Agreement and What Should It Include? | `24161c29ad76ca410cfe7f34bb8872ccf0ef7033c6bfd7305c8449f8b355b885` | `107bbc257e03ad114cd957777c70e2ea34380459c59f2e8007424a7626bfb758` | `e899154dbd361aa60353dfd4ea811ec5b65b30fd7ddc6f0ea76451971c899d81` |
| MRX1000-0886 | `why-mineral-rights-are-separate-from-surface-rights-in-texas-a-landowners-guide` | Why Mineral Rights Are Separate From Surface Rights in Texas: A Landowner's Guide | `7e15432ac09c7dc8c56ae4a8d0df88e2710799f4eb9bad3a4b0fcdeeef6fb7e1` | `3e2de648206102d07faeb3ed859c1171ac3430cc447962d0d4037965e12c6593` | `286969babce22ea681f888a452425bf2561d93368d25b95a6f1983763d1cd46e` |

## 6. Disposition

Disposition: PASS.

The corrected exact-15 hero SHA-256 values in §5 are the controlling CEO binding for these rows. The prior hero SHA-256 literals in D-2026-0801-10 §6 are superseded solely because the prior creative evidence path was invalidated by the systematic garbled metadata rendering defect and the corrected hero assets were later remediated and independently revalidated 15/15 PASS.

## 7. Non-authorization statement

This addendum does **not** authorize publication, deployment, SearchAtlas mutation, GSC mutation, MDX frontmatter flips, batch-config edits, asset-evidence rewrites, shared-repo changes, or any release action. No release occurs on this card.

If a later release-control task needs corrected hero bindings for these exact 15 rows, it must consume this addendum together with the verified remediation and revalidation artifacts in §3 and must preserve the parent decision's exact row slate and article hashes without substitution or reordering.

## 8. SHA-256 sidecar

See companion sidecar `mrx-ceo-addendum-D-2026-0801-10A-wave2-hero-hash-rebinding.md.sha256` containing `<hex64>  mrx-ceo-addendum-D-2026-0801-10A-wave2-hero-hash-rebinding.md` against the bytes of this file. Independently verifiable with:

`cd artifacts/mrx1000-release-10/decisions && shasum -a 256 -c mrx-ceo-addendum-D-2026-0801-10A-wave2-hero-hash-rebinding.md.sha256`

— Signed, mrx_ceo, 2026-08-01T02:19:16Z
