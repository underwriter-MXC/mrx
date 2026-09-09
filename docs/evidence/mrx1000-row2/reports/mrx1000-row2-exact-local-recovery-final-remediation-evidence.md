# MRX1000-053 exact row-2 local recovery and final remediation evidence

Generated: 2026-07-20T11:53:49Z
Kanban task: t_ec1ab7df
Mode: local-only, no-spend, no-release, noindex-stage. No SearchAtlas, CMS, src/content, route, asset, publishing, indexing, deploy, external, or paid action was performed.

## Authorization and preconditions

- Parent signed decision: D-2026-0720-15 / AUTHORIZE_EXACT_LOCAL_RECOVERY_AND_TWO_ITEM_FINAL_REMEDIATION.
- Trusted source: `/private/tmp/mrx_row2_vendor_draft.mdx`.
- Trusted source bytes/SHA verified before mutation: 13698 / `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e`.
- Protected raw destination restored byte-for-byte to `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.mdx`.
- Raw destination bytes/SHA after restoration: 13698 / `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e`.
- Raw source/destination byte equality: PASS.

## Exact pre-format candidate reconstruction before substantive edits

Starting candidate path: `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx`.
Only these two formatter reversals were applied before C-5/C-7: removed the single blank line immediately after the closing frontmatter delimiter and restored the five-line comparison table to the compact-pipe form recorded in MRX1000-056 §4.

| Measurement | Required | Verified |
| --- | ---: | ---: |
| Candidate file bytes | 14663 | 14663 |
| Candidate file SHA-256 | `218c319d3a0b34573901d152e16d7dd8627f33c076213765b31ea0e2bf9ea11b` | `218c319d3a0b34573901d152e16d7dd8627f33c076213765b31ea0e2bf9ea11b` |
| Candidate body bytes | 13622 | 13622 |
| Candidate body characters | 13608 | 13608 |
| Candidate body SHA-256 | `d6b283ef8b531e89dc1c9ff1b6c74f1f9d21fb88faed30afa404814cb1a58da5` | `d6b283ef8b531e89dc1c9ff1b6c74f1f9d21fb88faed30afa404814cb1a58da5` |
| Candidate body word count | 1888 | 1888 |

Pre-format reconstruction result: PASS.

## Authorized final remediation performed

- C-5: moved the existing single section-level `**Not legal, tax, or accounting advice.**` notice so it appears immediately before `### Keep title, probate, tax, and contract questions with qualified professionals`; no duplicate section-level notice was created and the canonical footer notice remains separate.
- C-7: added exactly one standalone sentence to the privacy/security section: `We do not sell owner information.`
- Recomputed only `body_checksum_sha256`, `body_length_chars`, and `body_word_count` in candidate frontmatter using the established body split (`text.split('---', 2)[2].lstrip('\n')`) and tokenization (`\\b[\\w'-]+\\b`) method.

## Final candidate metrics

| Measurement | Verified |
| --- | ---: |
| Candidate file bytes | 14699 |
| Candidate file SHA-256 | `8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d` |
| Candidate body bytes | 13658 |
| Candidate body characters / frontmatter `body_length_chars` | 13644 |
| Candidate body SHA-256 / frontmatter `body_checksum_sha256` | `abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07` |
| Candidate body word count / frontmatter `body_word_count` | 1894 |

## Preservation checks

```json
{
  "content_controls": {
    "section_notice_total_in_body": 2,
    "section_notice_outside_footer": 1,
    "privacy_policy_links": 1,
    "terms_links": 1,
    "book_links": 1,
    "inherited_links": 1,
    "methodology_links": 1,
    "offer_review_links": 1,
    "h1_count": 1,
    "h2_count": 6,
    "h3_count": 22,
    "faq_questions": 5,
    "tables": 1,
    "material_disclosures": 1,
    "educational_cta": 1,
    "exact_privacy_sentence": 1,
    "security_warning": 1,
    "domain_warning": 1,
    "placeholder_generating_image": 0
  },
  "frontmatter_controls": {
    "article_id: MRX1000-PILOT-001-02": 1,
    "searchatlas_uuid: 6cfc4a3f-e793-4d20-9a74-a9966c25ee8c": 1,
    "workflow_status: NEEDS_REVIEW_REMEDIATED_NOINDEX": 1,
    "remediated_from_sha256: fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e": 1,
    "raw_body_sha256: a990dd19f532b7197849c99d9acdcddd8538585bc3689d70692f7b0c58b8a8e7": 1,
    "indexable: false": 1,
    "draft: true": 1,
    "noindex: true": 1,
    "publication_state: noindex_stage": 1,
    "meta_robots: noindex,follow": 1,
    "verification_state: local_remediation_pending_second_audits": 1
  }
}
```

Preservation result: PASS for required noindex/draft/nonrelease fields; required links; privacy/terms one each; security and domain warning; canonical disclaimers; one disclosure; one CTA; FAQ/table/H1; no placeholder regression.

## Files written by this task

- `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.mdx`
- `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx`
- `reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md`
- `reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md.sha256`

Final disposition: implementation complete locally; candidate remains noindex/draft/nonrelease and requires fresh independent compliance and SEO/AEO audit cards before any further review lane.
