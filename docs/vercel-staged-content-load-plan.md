# MRX staged content load plan for the Vercel website preview

Prepared for Kanban task `t_cce89eaa`.

## Target and guardrails

- Target: the GitHub-backed, Vercel-hosted MRX website preview for `mineralrightsxchange.com`.
- Source of truth for staged content: local factory/RAG artifacts under `/Users/darylhill/.hermes/kanban/boards/mrx-growth/`.
- Do not create, edit, or publish MRX content in WordPress.
- Do not publish/index bulk content from this wave until SearchAtlas, copy, compliance, schema, internal-link, image/alt, sitemap, robots, LLM-file, and customer-journey QA pass.
- Default preview state: draft/noindex/staged. Production indexing requires explicit approval and QA evidence.

## Repo findings

Current repo path:

`/Users/darylhill/.hermes/kanban/boards/mrx-live-astro-website/workspaces/t_723fa824/mrx-web`

Current relevant website shape:

- Package manager: pnpm.
- Vercel build command: `pnpm build:vercel` from `vercel.json`.
- Vercel install command: `pnpm install --frozen-lockfile`.
- Adapter selection: `DEPLOY_TARGET=vercel` uses `@astrojs/vercel` in `astro.config.mjs`.
- Canonical site URL is `https://mineralrightsxchange.com` in `astro.config.mjs` and `src/lib/site.ts`.
- Existing public SEO/LLM files: `public/robots.txt`, `public/llms.txt`, `public/llm.txt`.
- Existing content routes:
  - `src/pages/blog/[...slug].astro` renders `src/content/posts/*` where `draft !== true`.
  - `src/pages/blog/index.astro` lists non-draft posts.
  - `src/pages/blog/category/[category].astro` lists non-draft category posts.
- Existing post schema is strict in `src/content/config.ts` and requires:
  - `title` 30-60 chars
  - `description` 130-160 chars
  - `published_at`
  - `author` as a reference to `src/content/team/*`
  - one of seven enum categories
  - `hero_image.src` and `hero_image.alt`
  - `excerpt` 40-220 chars
  - `disclaimer_top`
  - `money_figure_sourced`
  - `reviewed_at`
  - `reviewed_by` matching `mrx_compliance-*`
- Current team collection only has `src/content/team/organization.mdx`; staged author names such as Tommy/Ariana/Cooper will not satisfy the current `reference('team')` schema unless team entries are added or the import normalizes author to `organization`.

## Staged source findings

Run the repo-local audit with:

```bash
pnpm audit:staged-content
```

Observed source inventory:

1. `/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_factory_1000/`
   - README states 1,000 Wave 1 article drafts.
   - `article_manifest.json` contains 1,000 items.
   - `drafts/` currently contains 1,121 Markdown files, including additional WordPress/SearchAtlas-export drafts beyond the 1,000 manifest rows.
   - Status: `draft_needs_editorial_review`.
   - Main gap for direct website ingestion: 121 files are missing the newer Wave 2 fields such as `internal_links`; 271 scanned files have titles outside the website schema's 30-60 char budget; 121 scanned files have missing/out-of-range meta descriptions.

2. `/Users/darylhill/.hermes/kanban/boards/mrx-growth/content_factory_9000/`
   - README states 9,000 Wave 2 article drafts.
   - `article_manifest.json` contains 9,000 items.
   - `drafts/` contains 9,000 Markdown files.
   - Status in Markdown: `draft_needs_searchatlas_validation_editorial_review`.
   - Clusters: 4,000 state/county, plus 1,000 each for valuation, offer-review, inherited, royalties, and tax-1031.
   - Main gap for direct website ingestion: 5,174 scanned files have titles outside the website schema's 30-60 char budget and all files still need compliance-reviewed `reviewed_by`/`reviewed_at` values before they can be treated as indexable content.

3. `/Users/darylhill/.hermes/kanban/boards/mrx-growth/mrx_team_rag_databases_full/`
   - Full per-agent RAG packs exist with `documents.jsonl`, `rag.sqlite`, `source_docs/`, and README files.
   - README counts total 10,121 docs across agent packs:
     - Ariana 2,632
     - Tommy 2,625
     - Cooper 1,743
     - Monty 1,531
     - Dale 915
     - Walt 307
     - Rebecca 194
     - Angela 140
     - Ainsley 34
     - Cami 0
   - These should power text/email/chat recommendations and QA, not become public routes by themselves.

## Required import normalization

The staged Markdown is useful, but it is not drop-in compatible with `src/content/posts` yet. The import step must normalize each selected staged source document to the current website post schema.

Minimum normalized frontmatter shape for preview posts:

```yaml
title: '30-60 char page title'
description: '130-160 char meta description'
published_at: '2026-06-15'
updated_at: '2026-06-15'
draft: true
author: 'organization'
category: 'mineral-rights'
tags:
  - 'source queue id or cluster'
hero_image:
  src: '/og-default.svg'
  alt: 'keyword-relevant, unique image alt text'
excerpt: '40-220 char owner-friendly summary'
featured: false
disclaimer_top: false
money_figure_sourced: false
reviewed_at: 'TBD-after-compliance-review'
reviewed_by: 'mrx_compliance-TBD'
```

Important: that shape is only for staged preview. Before public indexing, `reviewed_by` and `reviewed_at` must be replaced by real compliance signoff values and each page needs its actual hero image/alt text decision.

Recommended category mapping:

- `valuation` cluster or value/valuation keywords -> `valuation`
- `tax-1031` or tax/1031 keywords -> `tax-legal` with `disclaimer_top: true`
- `offer-review`, offer, buyer keywords -> `competing-offers`
- royalty keywords -> `texas-oil-gas`
- sell/selling-process keywords -> `selling-process`
- inherited/heir/probate keywords -> `understanding-mineral-rights`
- remaining state/county/general education pages -> `mineral-rights`

Recommended author handling for the first preview load:

- Use `author: organization` so the existing `reference('team')` schema passes.
- Preserve the staged MRX team owner in extra internal metadata only if the post schema is extended first, or include it in the body as an author box for human QA.
- If the user wants team-persona bylines publicly, add `src/content/team/tommy.mdx`, `cooper.mdx`, etc. and update the layout/byline intentionally in a separate reviewed change.

## Route and batching strategy

### Phase 0: no-route dry run

- Use `pnpm audit:staged-content` to verify source counts and import gaps.
- Generate a proposed import manifest outside `src/content/posts` first, e.g. `content-load-manifests/vercel-preview-import-manifest.json`.
- Do not change sitemap/LLM files in this phase.

### Phase 1: small Vercel preview slice

- Import 10-25 representative posts into `src/content/posts/staged/` or `src/content/posts/` with `draft: true`.
- Add a separate staging-only route, e.g. `/staging/articles/[...slug]`, gated by an env var such as `PUBLIC_MRX_ENABLE_STAGED_CONTENT=true` and rendered with `noindex`.
- Keep the current production `/blog/[...slug]` route filtering drafts out.
- Do not include staged routes in the public sitemap.
- Use `robots.txt` to disallow the staged prefix.

### Phase 2: larger Vercel preview batches

- Load batches by cluster in this order:
  1. Core seller-intent/pillar-adjacent pages.
  2. Offer review and valuation pages.
  3. Inherited/royalty/tax pages.
  4. State/county long-tail pages.
- Suggested batch size for preview QA: 100-250 pages per deployment, not all 10,000 at once.
- Measure Vercel build time and output size after each batch.
- Keep every page noindex/draft until QA gates pass.

### Phase 3: indexable publish waves after approval

- Only move a page from staged/draft to public `/blog/` or a future pillar route after:
  - SearchAtlas validates keyword intent/topical map/cannibalization.
  - Copy QA confirms owner-first education and non-pressure CTA flow.
  - Compliance signs off legal/tax/title/investment language and no guaranteed price/fake proof claims.
  - Image filename and alt text are unique and keyword-relevant.
  - JSON-LD validates.
  - Internal links point to the correct subpillar/pillar/homepage/book path.
  - `/llms.txt`, `/llm.txt`, sitemap, and robots behavior are correct for the page's index state.

## Sitemap, robots, and LLM files

Current `public/robots.txt` allows `/`, disallows `/blog/drafts/` and `/api/`, and points to `https://mineralrightsxchange.com/sitemap-index.xml`.

Required staging changes before any large preview load:

- Add a staged prefix, e.g. `Disallow: /staging/`, if staged content is rendered under `/staging/articles/...`.
- Keep `/api/` disallowed.
- Keep sitemap pointing at the canonical production sitemap for production domains.
- Do not add draft/staging routes to `sitemap-index.xml` or `sitemap-0.xml`.
- Update `/llms.txt` and `/llm.txt` only with approved/indexable public pages, not the full draft library.
- For preview-only QA, optionally add an internal staged-content inventory file outside the public LLM map, e.g. `knowledge/staged-content-inventory.md`, rather than exposing all draft URLs to crawlers.

## Environment requirements for Vercel preview

Minimum Vercel env vars already identified by the MRX runbook:

```bash
PUBLIC_GTM_ID=GT-WFMD2MXW
MRX_GHL_LOCATION_ID=jjYm9OmYrCzClPff91X7
MRX_GHL_CALENDAR_URL=https://api.leadconnectorhq.com/widget/booking/lg3KcWfsKrR2pCWS6AeL
```

Sensitive env vars must be placed in Vercel/GitHub/env files, never committed or pasted in chat:

```bash
MRX_GHL_API_KEY=...
MRX_CONTACT_NOTIFY_EMAIL=... # optional
VERCEL_TOKEN=...             # only if CLI automation is required
GITHUB_TOKEN=...             # only if repo creation/push automation is required
```

Optional staging control env vars to add when implementing routes:

```bash
PUBLIC_MRX_ENABLE_STAGED_CONTENT=false
PUBLIC_MRX_STAGED_NOINDEX=true
```

## Build and QA commands

Run locally before creating or sharing a Vercel preview URL:

```bash
pnpm audit:staged-content
pnpm run test
pnpm run lint
pnpm run typecheck
pnpm run build:vercel
pnpm run lint:schema
node scripts/check-secrets.mjs
```

After Vercel deploy, verify the preview URL:

```bash
curl -sSI https://<vercel-preview-url>/
curl -sSI https://<vercel-preview-url>/book/
curl -sSL https://<vercel-preview-url>/robots.txt
curl -sSL https://<vercel-preview-url>/llms.txt
curl -sSL https://<vercel-preview-url>/llm.txt
curl -sSL https://<vercel-preview-url>/sitemap-index.xml
```

Preview QA must also include browser checks for:

- Homepage AI card loads and starter prompt behavior works.
- `/book/` booking path works or clearly falls back to approved GHL calendar flow.
- Staged article pages, if enabled, carry `noindex,nofollow` or equivalent staging robots metadata.
- No draft/staged pages appear in sitemap or public LLM map.
- JSON-LD exists and passes `pnpm run lint:schema` after build.
- Internal links do not point to non-existent subpillar paths unless those subpillars are part of the same preview batch.
- Hero image references exist; no broken WordPress-upload image URLs are left as required page assets.

## Exact blockers before bulk load/indexing

1. The staged factories are draft-stage content, not SearchAtlas Content Genius final-public articles with verified article UUID/editor URLs.
2. The current website post schema does not accept the staged frontmatter directly; normalization/import scripting is required.
3. Team-persona author bylines are not currently represented as content collection entries; use `organization` for first preview import or add team MDX entries in a reviewed change.
4. Many staged titles exceed the 30-60 char schema budget; the importer must produce compliant display/meta titles before `astro check` will pass.
5. Wave 1 contains 121 older files with missing newer fields such as `internal_links`; the importer must use fallbacks or exclude them from early batches.
6. Real compliance signoff is required before moving any page from staged/draft/noindex to indexable public routes.
7. Vercel/GitHub automation may be blocked if `VERCEL_TOKEN`, Vercel OAuth, or `GITHUB_TOKEN` are unavailable or expired; do not print or commit secrets.
8. No production DNS cutover or bulk indexing is approved by this task.
