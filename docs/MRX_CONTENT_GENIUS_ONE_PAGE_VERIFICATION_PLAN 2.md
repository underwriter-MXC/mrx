# MRX Content Genius One-Page Verification Plan

Task: `t_1119ba20`  
Scope: verify exactly one Content Genius / DKN page replacement or new pillar before another page is published or replaced.

## Candidate first page

Use `/mineral-rights/texas/` as the first page because it already exists as a dynamic state guide, is aligned with the Texas-first business scope, and can be improved without creating a brand-new article wave.

## Required sequence

1. Draft-only: update the page brief and copy in a branch/worktree; do not publish to WordPress, Search Atlas, OTTO, GBP, social, or production.
2. Editorial review: confirm the title, H1, meta description, hero/image alt, cited source, answer-first block, and internal links are page-specific and not templated.
3. Compliance review: scan for legal/tax/valuation advice, appraisal wording, guarantees, exact dollar outputs, individualized recommendations, fake testimonials, review-gating, and superlative claims.
4. Local checks: run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, and `pnpm run build`.
5. Sitemap check: after build, confirm the route appears in the generated sitemap or sitemap index for the target deployment mode.
6. Structured-data check: validate Organization/LocalBusiness, BreadcrumbList, Article/FAQPage where present, and confirm no unsupported/false claims were inserted.
7. GA4 tag/event check: verify the public frontend contains `G-CL1YSRNNXJ` / `GT-WFMD2MXW`; for the page CTA, confirm the intended book/guide/chat event path exists before release.
8. GSC read-only inspection: inspect URL state without clicking Request Indexing. Any Request Indexing action is a human-only gate.
9. Human approval: Daryl approves merge/deploy/publish; no agent commits, pushes, merges, deploys, or publishes without approval.
10. Post-release read-only check: curl page, robots, sitemap, canonical, schema, and GA4 tag. Then open the next page only after the first passes.

## Stop conditions

- Build/lint/typecheck/test failure that cannot be fixed within lane scope.
- Compliance fail on legal/tax/valuation copy.
- Missing cited source for page-specific claims.
- Need for Search Atlas credit spend, Search Console mutation, WordPress publish, Vercel/Cloudflare settings, OAuth, API key, payment, or live outreach.

## Human-only gates

- Publish/merge/deploy approval.
- Search Console Request Indexing or sitemap submit/remove.
- Search Atlas/OTTO live auto-fix or Content Genius credit spend beyond approved single-page workflow.
- Credential/OAuth/API/billing changes.
- Regulated legal/tax/valuation copy decisions that could be construed as advice, guarantee, appraisal, or individualized recommendation.
