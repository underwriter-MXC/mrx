# MRX1000 SearchAtlas + ordered LLM local execution manifest

## Disposition

**FAIL-CLOSED / LOCAL-ONLY / NO EXTERNAL WRITES.** This artifact assigns and reconciles work; it does not claim that 1,000 articles were created, reviewed, released, live, indexed, or submitted.

Owner decision **D-2026-0804-16** is checksum-verified at `edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f` and removes numerical release caps and elapsed-time gates. Exact **Claude Opus 4.6** (`claude-opus-4-6`) is unavailable in the captured legacy framework evidence, and the ordered-review sequence recorded by this local artifact is incomplete. Rows remain individually ineligible for an action until their identity, content, and substantive quality evidence is complete; article count is not a blocker.

## Deterministic inventory

| Measure                                                             | Count |
| ------------------------------------------------------------------- | ----: |
| Canonical rows                                                      |  1000 |
| Deterministic 25-row batches                                        |    40 |
| Workspace MDX present                                               |   286 |
| Workspace public-route configurations (not a production-live claim) |   238 |
| Checksummed review candidates with readiness evidence               |   262 |
| Rows without a validated review candidate                           |   738 |
| Pilot QA shells (never review candidates)                           |    25 |
| Pilot workspace shells marked as review candidates                  |     0 |
| Pilot rows with a separately validated review candidate             |     1 |
| Held incumbent drafts                                               |    23 |
| Noindex pilot drafts                                                |    25 |
| Planning-only rows                                                  |   714 |
| Rows with any normalized exact-title vendor candidate               |   147 |
| Unambiguous exact-title candidate rows                              |   141 |
| Ambiguous exact-title candidate rows                                |     6 |
| Exact-title candidate records across matched rows                   |   154 |
| Artifact-bound canonical-row Content Genius UUIDs                   |     2 |
| Rows with any recorded LLM verdict                                  |     0 |
| D12 row-2 ordered-review exceptions                                 |     1 |
| D12 row-2 exceptions dispatch-eligible now                          |     0 |
| D12 row-2 exceptions audit-ready now                                |     1 |
| Release-eligible rows now                                           |     0 |
| Index-submission-eligible rows now                                  |     0 |

## SearchAtlas evidence boundary

- Historical signed D11 vendor snapshot: **299 = 200 NEEDS_REVIEW + 70 COMPLETED + 29 NOT_BEGUN**. D11 is inventory provenance, not current release authority.
- Composition: **297** records in the captured raw Content Genius export plus **2** separately validated canary artifacts.
- Exact-title reconciliation assigns **154** candidate records to **147** ledger rows. The remaining vendor inventory is not silently assigned to canonical rows.
- A topical-map `searchatlas_map_id` or `searchatlas_title_uuid` is retained only as a planning handle and is never treated as Content Genius article-creation proof.
- An unambiguous exact-title match is still a candidate join, not canonical identity proof. Only 2 canary rows have checksum-validated artifact binding between pilot identity and Content Genius article UUID.

## Review-candidate safety boundary

- Workspace MDX existence is inventory evidence, not review-candidate proof.
- The immutable canonical ledger is preserved, while the current workspace publication view projects only byte-proven exact-admission transitions. It therefore records **23** held incumbents and **238** public workspace articles. Checksummed review-candidate status still requires canonical identity, substantive body, review metadata, source path/SHA, publication state, and readiness-row identity to agree.
- All 25 pilot workspace MDX files are explicit QA shells without final article copy. Their workspace paths are never review candidates and every shell has `workspace_mdx_is_review_candidate=false`.
- A pilot row may become reviewable only through a distinct candidate whose exact path, file SHA, body SHA, identity, containment state, and readiness evidence validate together.
- Row 2 distinct-candidate state: `ROW2_REMEDIATED_NOINDEX_CANDIDATE_VALIDATED_FOR_ORDERED_LLM_REVIEW`. Checksummed review candidate present: `true`. Rejection reasons: none.

## D12/D14/D15 row-2-only ordered-review readiness

- Signed `D-2026-0720-12` (`cf1ee52c6239465d257cafdab67715ea60ff618aefe886a06d3128a7b98d4ac1`) authorizes exactly one no-spend, nonpublic, noindex review pass for `MRX1000-PILOT-001-02` in this order: **ChatGPT → Google Gemini → a currently available named Claude-family model captured at action time → Perplexity**.
- Signed `D-2026-0720-14` (`20a57109fcc1332391f2660c6890d21f9efd861c397fceaf550630349dc9c136`) corrects the intended preserved-raw SHA to the 64-character value `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e`. Signed `D-2026-0720-15` (`6390678bd9ec46d373fdc237b1e27a8f3abf7cebd2cb40b5498e2cd09af92dfd`) authorized the exact local recovery and fresh dual audits now reflected here.
- The Claude stage requires the visible signed-in model selector and exact selected model ID immediately before send, plus a verdict `model_substitution_note` naming D12, the model actually used, and why exact 4.6 was unavailable. No named model has been silently guessed or pre-filled.
- Row 2 is **audit-ready now**: candidate `8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d` is checksummed and both fresh audits PASS the same bytes. This local manifest still does not perform or claim external dispatch. Pending action-time/local-only conditions: `ROW2_D12_ACTION_TIME_REVIEW_PREFLIGHT_REQUIRED`, `LOCAL_ONLY_MANIFEST_EXTERNAL_DISPATCH_NOT_PERFORMED`.
- Current formal audit evidence is checksum-pinned and returns compliance `PASS` and SEO/AEO `PASS`. The restored raw draft is 13698 bytes at `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e`, exactly matching the D10/D14 recorded raw provenance.
- The exception does not itself authorize a SearchAtlas write or weaken the recorded review sequence. D-2026-0804-16 separately removes the former numerical cap; the other 999 rows retain their article-specific identity, content, and review requirements.

## Execution order

Batch `MRX1000-SA-BATCH-001` preserves the 25 existing pilot rows in `pilot_article_id` order. Batches 002-040 contain the remaining 975 rows in canonical `program_row_id` order. JSON and CSV rows are physically emitted in `execution_sequence` order 1-1000, so the pilot batch is first for sequential consumers. Every batch has exactly 25 rows. This local manifest performs no external writes; rows wait on identity, content, and review evidence rather than a numerical release cap.

The ordered answer-engine sequence is:

1. **ChatGPT**
2. **Google Gemini** (correct machine/display label; the source request's “Demini” was a typo)
3. **Claude Opus 4.6** — exact `claude-opus-4-6`, no substitution
4. **Perplexity**
5. **Microsoft Copilot** — an additional Bing/Copilot answer surface after the four required reviewers

Every stage includes null input/output checksum, exact-model, run, timestamp, verdict, and evidence-path slots. No verdict is populated by this generator. A later executor must preserve sequence and record a PASS before moving to the next engine.

The sequence above is the default for 999 rows. Row 2 alone uses the four-surface D12 exception described above; Microsoft Copilot is not part of that signed narrow pass.

## Fail-closed stop conditions

Every row stops on its incomplete ordered review sequence and this artifact's local-only no-dispatch posture. Rows without an independently validated candidate also stop on `NO_CHECKSUMMED_REVIEW_CANDIDATE`; row-specific stops additionally cover ambiguous Content Genius identities and unproven canonical row-to-UUID bindings. D-2026-0804-16 supplies program-level release/index authority, but no row may skip its substantive quality evidence.

## Read-only input provenance

| Input                                                                                                                             | SHA-256                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `config/mrx-1000-canonical-content-ledger.json`                                                                                   | `dc4e90b91ff6a218e1204753de861037921268252e2e989e0aed511a7f65fb2c` |
| `reports/mrx-1000-readiness-matrix.json`                                                                                          | `28284b4aa2b438776a0351855cd84123560f9c350e52438c8d6c4b88cae0cda5` |
| `reports/searchatlas-cg-reconciliation-t_0c427a87/content-genius-export-raw-by-status.json`                                       | `a357f3a95fff35d484a6050769c1b77e85ba86de4223e0770269d2cca168563b` |
| `../program-plans/mrx-1000-ceo-decision-no-spend-capacity.md`                                                                     | `46a9d02548e97a794d1cdaa919682bb159bcfbeabb5b9d8e559431c6ca34091d` |
| `docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md`                                                    | `edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f` |
| `../program-plans/mrx-1000-f3-claude-opus-verdict-framework.md`                                                                   | `bde0d3727d91bb261b8a8e9c6005f13eb3a58e3fe36182b3638fb18542481a3a` |
| `reports/mrx1000-pilot-001-preflight-2026-07-20T07-08-39-887Z.md`                                                                 | `942490dbdaf8cbacc79b655dad967f6577cf77efb7b665184dadacf048f3bef5` |
| `config/mrx-1000-pilot-batch-001.json`                                                                                            | `e6922a750847b82a9c8592dcc18c0d2b12ab4addcd9eea3bd39dc8cf7dc40d2a` |
| `../program-plans/mrx-1000-ceo-decision-row2-canary-remediation.md`                                                               | `4fd80d8f3316d06b5b8bd58d028d9c24b0fb4523c1cad0c58a9a2163dbbb6000` |
| `../program-plans/mrx-1000-ceo-decision-exact-claude-gate-and-narrow-no-spend-row2-review.md`                                     | `cf1ee52c6239465d257cafdab67715ea60ff618aefe886a06d3128a7b98d4ac1` |
| `../program-plans/mrx-1000-ceo-decision-d13-row2-source-hash-clerical-correction-supersession.md`                                 | `20a57109fcc1332391f2660c6890d21f9efd861c397fceaf550630349dc9c136` |
| `../program-plans/mrx-1000-ceo-decision-exact-row2-local-recovery-and-final-remediation.md`                                       | `6390678bd9ec46d373fdc237b1e27a8f3abf7cebd2cb40b5498e2cd09af92dfd` |
| `docs/evidence/mrx1000-row2/drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx` | `8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d` |
| `docs/evidence/mrx1000-row2/drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.mdx`                    | `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e` |
| `docs/evidence/mrx1000-row2/reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md`                              | `13e2b8b3cd9babcef42e321a177004628759cebec9b1701a195c5c85c93dd915` |
| `docs/evidence/mrx1000-row2/reports/mrx1000-row2-remediated-fresh-post-recovery-audit-compliance.md`                              | `03437048d097cd95356d99c40653fe6967f8ad9f6c37e84a777404c737b2cdca` |
| `docs/evidence/mrx1000-row2/reports/mrx1000-055-fresh-seo-aeo-audit-after-exact-row2-recovery.md`                                 | `e4de274bccc48d4e614258fd09792c820cea3531366612187cedc4172eda6964` |

Manifest content fingerprint: `3d5d4b7fd80aa142fdb261d62eea15637329cfe958ce61089f2f77b00a8a8c56`.
