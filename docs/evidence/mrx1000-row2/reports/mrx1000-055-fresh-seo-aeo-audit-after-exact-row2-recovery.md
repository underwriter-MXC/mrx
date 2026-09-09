# MRX1000-055 fresh SEO/AEO audit after exact row-2 recovery

Generated: 2026-07-20T11:59:26Z
Kanban task: t_ae786c0c
Mode: local-only, read-only audit of raw/candidate content; wrote only this report and SHA sidecar. No content/source, SearchAtlas, CMS, route, asset, publishing, indexing, deployment, image, paid, or external platform mutation was performed.

## Mission received

Fresh independent SEO/AEO audit of the current restored/remediated row-2 candidate and protected raw draft after exact local recovery. This audit recomputed all hashes and metrics from current bytes, re-ran prior SEO/AEO criteria, and intentionally did not overwrite prior failed audit reports.

## Overall verdict

Overall SEO/AEO audit verdict: PASS.

Reason: current raw draft bytes match the required protected raw artifact, candidate frontmatter checksum/length/word metrics match the current body bytes, noindex containment is intact, and all audited SEO/AEO remediation criteria passed on the current local candidate.

This report does not authorize publication, indexing, SearchAtlas writeback, CMS action, OTTO action, deployment, image generation, paid action, or spend.

## Source handles audited

- Protected raw draft: `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.mdx`
- Remediated noindex candidate: `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx`
- Parent evidence context: `reports/mrx1000-row2-exact-local-recovery-final-remediation-evidence.md`
- Prior failed formal audit retained separately: `reports/mrx1000-row2-remediated-formal-second-audit-seo-aeo.md`
- Remediation specification criteria: `reports/mrx1000-row2-seo-aeo-remediation-spec.md`

## Recomputed current hashes and metrics

| Item | Current recomputation | Expected/frontmatter | Verdict |
| --- | --- | --- | --- |
| Raw file bytes | `13698` | `13698` | PASS |
| Raw file SHA-256 | `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e` | `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e` | PASS |
| Candidate file bytes | `14699` | informational | PASS |
| Candidate file SHA-256 | `8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d` | informational | PASS |
| Candidate body bytes | `13658` | informational | PASS |
| Candidate body chars | `13644` | frontmatter `body_length_chars: 13644` | PASS |
| Candidate body SHA-256 | `abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07` | frontmatter `body_checksum_sha256: abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07` | PASS |
| Candidate body word count | `1894` | frontmatter `body_word_count: 1894` | PASS |
| Candidate raw provenance | `fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e` | current raw file SHA | PASS |

## Noindex containment

| Check | Evidence | Verdict |
| --- | --- | --- |
| Candidate path | `drafts/mrx1000/pilot-001/searchatlas/inherited-mineral-rights-buyers-compared.remediated.noindex.mdx` under `drafts/`, not a publishable `src/content` path | PASS |
| workflow_status | `NEEDS_REVIEW_REMEDIATED_NOINDEX` | PASS |
| indexable | `false` | PASS |
| draft | `true` | PASS |
| noindex | `true` | PASS |
| publication_state | `noindex_stage` | PASS |
| meta_robots | `noindex,follow` | PASS |

## Criterion-by-criterion SEO/AEO audit matrix

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Exact H1 | PASS | Found 1 H1: `# Inherited Mineral Rights Buyers Compared: What to Look For`. Frontmatter title is `Inherited Mineral Rights Buyers Compared: What to Look For`. |
| Answer-first intent | PASS | The paragraph immediately after the H1 starts with owner comparison guidance before the first H2 and covers coverage, value explanation, title review changes, closing speed, review time, assumptions, privacy, and conflict disclosure. |
| H2/H3 hierarchy | PASS | Found 6 H2s and 22 H3s; required six H2 hierarchy and body H3 set are present in order. |
| Comparison table | PASS | Found 1 markdown pipe table with `Buyer / process type` header and three concise rows. |
| Five FAQs | PASS | Found 5 FAQ H3 questions under the FAQ section. |
| Required internal links exactly once | PASS | Counts: /inherited-mineral-rights/=1, /methodology/=1, /book/=1, /offer-review/=1. |
| Privacy/terms support links exactly once | PASS | Counts: /privacy-policy/=1, /terms/=1. |
| Required local route files exist | PASS | /inherited-mineral-rights/->src/pages/inherited-mineral-rights.astro=True, /methodology/->src/pages/methodology.astro=True, /book/->src/pages/book.astro=True, /offer-review/->src/pages/offer-review.astro=True. |
| No placeholders | PASS | `Generating image` count: 0. |
| Unsupported statistics removed | PASS | Raw regional-stat strings count zero; unsupported numeric market/stat hits: 0. |
| Malformed sentence removed | PASS | `holder to 'inherited mineral rights'` count: 0. |
| Duplication/generic filler control | PASS | Prohibited filler counts: best possible outcome=0, best deal=0, maximize value=0, secure favorable outcomes=0, significantly impact=0. |
| Target length/local quality | PASS | Candidate body word count is 1894, within the local 1,200-2,200 range used for this compliance-heavy noindex candidate. |
| CTA quality | PASS | CTA is educational/no-pressure, includes `/offer-review/` and `/book/` once each, states no cost/no obligation, and keeps no-guarantee language. |
| Schema/metadata readiness | PASS | Identity fields, current body checksum, body character count, body word count, and raw provenance fields match current bytes. |
| Noindex containment | PASS | Draft/noindex/nonrelease frontmatter and draft path remain intact. |
| Disclosures/privacy sentence | PASS | Canonical disclaimer appears twice, material relationship disclosure once, legal/tax notice twice, and `We do not sell owner information.` once. |

## Heading detail checked

H2s present:
1. `## Quick buyer-comparison checklist for inherited mineral rights`
2. `## What inherited mineral rights owners should confirm before comparing buyers`
3. `## How to compare mineral rights buyer offer structures`
4. `## Red flags when comparing mineral rights buyers`
5. `## How MRX supports a no-pressure offer review`
6. `## Frequently asked questions about comparing mineral rights buyers`

FAQ H3s present:
- `### What is the first thing to compare between mineral rights buyers?`
- `### How can I tell whether a mineral rights buyer is explaining value clearly?`
- `### Should inherited mineral rights owners get legal or tax advice before selling?`
- `### Is it safe to compare buyers using only the highest offer?`
- `### Can MRX review an offer without requiring me to sell?`

## Internal-link count detail

| Path | Count | Route evidence | Verdict |
| --- | ---: | --- | --- |
| `/inherited-mineral-rights/` | 1 | `src/pages/inherited-mineral-rights.astro` exists | PASS |
| `/methodology/` | 1 | `src/pages/methodology.astro` exists | PASS |
| `/book/` | 1 | `src/pages/book.astro` exists | PASS |
| `/offer-review/` | 1 | `src/pages/offer-review.astro` exists | PASS |
| `/privacy-policy/` | 1 | support/privacy link | PASS |
| `/terms/` | 1 | support/privacy link | PASS |

## Unsupported-claim and cleanup detail

- Placeholder count: 0.
- Regional unsupported-stat strings: Southwest=0, Northeast=0, Midwest=0, 2025-2026 heading=0.
- Unsupported numeric market/stat hit count for `$`, `15%`, `10%`, `12%`, `2025`, or `2026`: 0.
- Malformed sentence count: 0.
- Filler phrase counts: {"best possible outcome": 0, "best deal": 0, "maximize value": 0, "secure favorable outcomes": 0, "significantly impact": 0}.

## Check summary JSON

```json
{
  "overall": "PASS",
  "failed_checks": [],
  "checks": {
    "raw_exact_bytes_sha": true,
    "candidate_frontmatter_body_sha_matches": true,
    "candidate_frontmatter_body_length_matches": true,
    "candidate_frontmatter_word_count_matches": true,
    "identity_fields": true,
    "raw_provenance_field": true,
    "exact_h1_once": true,
    "answer_first": true,
    "hierarchy": true,
    "comparison_table": true,
    "five_faqs": true,
    "required_internal_links_once": true,
    "support_links_once": true,
    "no_placeholders": true,
    "no_unsupported_stats": true,
    "malformed_sentence_removed": true,
    "duplication_filler_control": true,
    "target_length": true,
    "cta_quality": true,
    "schema_metadata_readiness": true,
    "noindex_containment": true,
    "route_files_exist": true,
    "disclosures": true
  },
  "metrics": {
    "raw": {
      "file_bytes": 13698,
      "file_sha256": "fa7664878de826d1fb7723d4b50dc2d2c65f5dbb72857307b39432093bc07e9e",
      "body_bytes": 12944,
      "body_chars": 12942,
      "body_sha256": "16c84a397b7e29f667e9ea9bb7c672e9c934c7c6fbc653a7bfcdaddecd12040f",
      "body_word_count": 1769
    },
    "candidate": {
      "file_bytes": 14699,
      "file_sha256": "8733083dca7e5b6417bad06c7e6d993f3589890ebfdbf7d8e8404ef2b88fd74d",
      "body_bytes": 13658,
      "body_chars": 13644,
      "body_sha256": "abcbcbb0eb97e9b3c03da786e092ed6f425d991cef80600018ccf19f5bb46d07",
      "body_word_count": 1894
    }
  },
  "link_counts": {
    "/inherited-mineral-rights/": 1,
    "/methodology/": 1,
    "/book/": 1,
    "/offer-review/": 1,
    "/privacy-policy/": 1,
    "/terms/": 1
  }
}
```

## Final disposition

Fresh SEO/AEO audit disposition: PASS.

Limitations: this is a local audit artifact only. It does not approve or perform SearchAtlas, CMS, WordPress, OTTO, indexing, recrawl, deployment, publication, image-generation, paid action, or spend. Candidate remains noindex/draft/nonrelease pending the rest of the MRX1000 review lane.
