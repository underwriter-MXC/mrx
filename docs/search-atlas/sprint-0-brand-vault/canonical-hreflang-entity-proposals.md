# Canonical, hreflang, and entity-ID proposals — draft

Task: `t_eee35875`
Generated: 2026-07-20T05:07:59Z
Scope: planning artifact only. No Brand Vault, Knowledge Graph, GBP, Wikidata, production schema, canonical, or hreflang records were edited.

## Canonical URL proposal

1. Continue using the non-www canonical domain `https://mineralrightsxchange.com`.
2. Continue enforcing trailing slash canonical routes via `src/lib/seo.ts:48-53`.
3. Treat `https://www.mineralrightsxchange.com/*` as redirect-only, not canonical.
4. Keep `https://mineralrightsxchange.com/sitemap_index.xml` as canonical sitemap per active growth-ops policy.
5. Do not canonicalize protected/noindex utility flows (`/staff/`, account/private document surfaces, thank-you pages) to conversion or article pages; keep their own URL + `noindex` where appropriate.

## Hreflang proposal

Current source state supports only `en-US` (`src/lib/site.ts:15`). Recommended draft rules:

- Add no hreflang alternates until translated/localized pages exist.
- When implemented, emit self-referencing `hreflang="en-US"` and `x-default` on indexable public pages only.
- Do not emit hreflang on noindex/private/protected utility pages.
- Any future state/local page translations must use page-level canonical URLs and reciprocal hreflang clusters; do not auto-generate alternates from English-only content.

## Entity ID assignments

| Entity                 | Proposed ID                               | JSON-LD `@id`                                                         | Notes                                                                 |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Organization           | `mrx:org:mineral-rights-xchange`          | `https://mineralrightsxchange.com/#org`                               | Root identity. Keep sameAs empty until profile ownership is verified. |
| Website                | `mrx:site:mineralrightsxchange.com`       | `https://mineralrightsxchange.com/#site`                              | SearchAction remains tied to Learning Center query URL.               |
| Professional service   | `mrx:service:national-underwriter-review` | `https://mineralrightsxchange.com/#service`                           | Do not enrich with phone/address before Daryl confirmation.           |
| LocalBusiness draft    | `mrx:local:service-area-business`         | `https://mineralrightsxchange.com/#local`                             | Draft/dormant until GBP/service-area activation.                      |
| Editorial organization | `mrx:publisher:editorial-team`            | `https://mineralrightsxchange.com/authors/mrx-editorial-team/#author` | Preferred article author/publisher pattern.                           |
| Tommy AI guide         | `mrx:ai-guide:tommy`                      | `https://mineralrightsxchange.com/team/#tommy`                        | Draft-only Person pattern; legal/compliance gate.                     |
| Angela AI guide        | `mrx:ai-guide:angela`                     | `https://mineralrightsxchange.com/team/#angela`                       | Draft-only Person pattern; legal/compliance and Voice AI gate.        |

## Human-only gates

- G-01/G-03: any Search Console, Vercel, Cloudflare, Brand Vault, Knowledge Graph, or production metadata mutation.
- G-04/G-07: any live communication, GBP/social posting, or regulated legal/tax/valuation representation change.
- G-04 policy-specific: GBP, Wikidata, and Brand Vault record edits.
- Production JSON-LD publication requires PR/build/lint/structured-data/live verification cycle and Daryl approval.

## Recommended next owner

`mrx_webdev` should consume these drafts for a repo-only schema implementation plan after `mrx_ceo`/Daryl approves whether LocalBusiness and AI-guide Person nodes may be represented publicly.
