# MRX1000-PILOT-001 noindex-stage implementation plan

> For Hermes: implement only after independent review and a separate CEO/Daryl merge gate. Use test-driven development and preserve every release hard stop below.

Goal: Provide an isolated Astro QA shell for exactly 25 MRX1000 pilot records, with enforced taxonomy/compliance/asset/link contracts, `noindex, follow` on every rendered stage page, and a separate unsubmitted `sitemap-staged.xml`.

Architecture: Each pilot record is a draft MDX QA shell selected by explicit `content_program`, `content_batch`, and `noindex` fields. A dedicated static route renders those records under `/staged/mrx1000/pilot-001/{slug}/`; the public blog route continues to reject draft posts. Astro’s public sitemap excludes `/staged/`, while the postbuild hook writes a separate staged URL set that is never referenced by robots.txt or the public sitemap index.

Tech stack: Astro 5 content collections, Zod, MDX, Vitest, pnpm, Cloudflare adapter.

## Scope and hard stops

- This branch contains QA-shell copy only. It does not contain final SearchAtlas article bodies and is not editorial publication approval.
- All 25 source files are `draft: true` and `noindex: true`.
- No deploy, merge, publication, GSC submission, Request Indexing, SearchAtlas write, paid quota, or Claude substitution was performed.
- The shared dirty `main` checkout was not modified. Worktree: `/Users/darylhill/Documents/MineralRightsXchange.com/mrx/.worktrees/t_5a00649d`.
- Source/build SHA: `aa3986533f1a6a738738e0a71e3969c3697a5202`.
- Branch: `mrx1000-pilot-001/t_5a00649d`.

## Gate C schema contract

`src/content/config.ts` enforces the Gate C §4.1 fields verbatim:

- `hero_image`: required object; `src`, `alt`, and bounded local/social metadata fields.
- `disclaimer_top`: required boolean; `tax-legal` must be `true`.
- `has_footer_disclaimer`: boolean, default `true`; every pilot shell sets it explicitly to `true`.
- `money_figure_sourced`: required boolean.
- `reviewed_by`: required traceable `mrx_compliance-*` profile ID.
- `reviewed_at`: required date/timestamp string of at least ten characters.
- `title`: hard 30–60 character source budget for the 25 pilot records, tested against each file.
- `description`: hard 130–160 character meta-description budget.

MRX1000-only `superRefine` behavior requires `content_cluster`, `content_intent`, `content_guide`, `content_batch`, `internal_links`, `hero_image.social_src`, and `hero_image.social_alt`. A `content_batch: pilot-001` record fails schema validation unless `noindex: true`.

## Frontmatter and taxonomy

Every `config/mrx-1000-pilot-batch-001.json` row maps to one `src/content/posts/{slug}.mdx` file with:

- `content_program: mrx1000`
- `content_cluster`: exact manifest `cluster_id`
- `content_intent`: controlled GA4 value
- `content_guide`: controlled guide slug
- `content_batch: pilot-001`
- `draft: true`
- `noindex: true`

The manifest is pinned in this branch so an isolated worktree can deterministically verify all 25 slugs without reading the dirty shared checkout.

## Internal-link triangle

Every pilot file explicitly declares:

- `internal_links.hub`: the cluster’s primary existing hub.
- `internal_links.sibling`: an existing related authority/process route, distinct from the hub.
- `internal_links.conversion: /book/`.

The staged route renders hub and sibling links and supplies a closing CTA whose exact href is `/book/`. It also renders up to three staged sibling posts in the same MRX1000 cluster. The contract test fails if any triangle field is missing, malformed, or the conversion path drifts.

## Hero and social metadata

Every pilot QA shell contains `hero_image.src`, `alt`, dimensions/MIME, `social_src`, `social_alt`, social dimensions/MIME, source, and license. The local verification script checks that both source paths resolve under `public/` and that built OG/Twitter metadata resolves locally.

The current branch intentionally uses the owned 1200×630 MRX stage placeholder for all 25 shells. Unique F5 hero/social assets, source records, pHashes, and F5 per-asset review remain a hard release dependency. The placeholder must not survive the later public-release gate.

## Noindex and sitemap behavior

- `Seo.astro` preserves `noindex, nofollow` as the safe default for existing private/utility pages, while the pilot route passes the exact custom robots value `noindex, follow`.
- `BaseLayout.astro` forwards the noindex and robots props without changing the pilot’s exact directive.
- The dedicated route renders only records selected by `isMrx1000PilotPost`.
- `astro.config.mjs` excludes every `/staged/` URL from the public sitemap integration.
- `scripts/postbuild-sitemap.mjs` emits `dist/sitemap-staged.xml` with exactly 25 stage URLs.
- `sitemap-staged.xml` is not included in `dist/sitemap-index.xml`, not advertised in `public/robots.txt`, and was not submitted to GSC.

## TDD and implementation sequence

1. Test: `tests/unit/mrx1000-pilot-stage.spec.ts`
   - Initial run failed because the manifest and staged route did not exist.
   - Implement the pinned manifest and 25 shells; rerun until taxonomy, budgets, assets, and triangle tests pass.
2. Schema: update `src/content/config.ts` and `src/lib/astro/content.ts`.
   - Add MRX1000 enums/fields and fail-closed refinements.
   - Run `pnpm run typecheck`.
3. Render: add `src/lib/mrx1000-pilot.ts` and `src/pages/staged/mrx1000/pilot-001/[slug].astro`.
   - Select only pilot/noindex records and render the stage-only path.
4. SEO: update `Seo.astro`, `BaseLayout.astro`, and `PostLayout.astro`.
   - Emit `noindex, follow` and permit the pilot’s already-budgeted source title to avoid appending a brand suffix that would exceed 60 characters.
5. Sitemap: exclude `/staged/` from the public sitemap and emit `sitemap-staged.xml` separately.
6. Verify: run the focused test, typecheck, full test suite, lint, production build, and `pnpm run verify:mrx1000:pilot-stage`.

## Verification commands and acceptance

```text
pnpm install --frozen-lockfile
pnpm exec vitest run tests/unit/mrx1000-pilot-stage.spec.ts
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run build
pnpm run verify:mrx1000:pilot-stage
```

Required outputs:

- `reports/mrx1000-pilot-001/build.log`: clean build command log, `BUILD_EXIT=0`.
- `reports/mrx1000-pilot-001/test.log`: full Vitest output.
- `reports/mrx1000-pilot-001/lint.log`: ESLint output.
- `reports/mrx1000-pilot-001/typecheck.log`: Astro check output.
- `reports/mrx1000-pilot-001/stage-verification.log`: 25/25 summary.
- `reports/mrx1000-pilot-001/verification.json`: per-URL robots, canonical, CTA, sitemap, hero, and social checks.
- `dist/sitemap-staged.xml`: generated 25-URL staged sitemap; unsubmitted.

## Promotion checklist (not authorized by this task)

Before any merge/deploy/public release:

1. Replace QA-shell body text with final approved copy and record the required Claude Opus 4.6 verdict after first-party auth is restored.
2. Re-run compliance/editorial review on final bodies; manifest-only review is not body approval.
3. Replace shared placeholder art with F5’s 25 unique hero/social asset pairs and verified pHash/source manifest.
4. Set a complete rollback manifest and independent `verified_by` value.
5. Resolve SearchAtlas row handles/status without treating dashboard publication state as live proof.
6. Obtain separate CEO/Daryl merge/deploy/public-release authorization.
7. Only after that gate may routes move from `/staged/...` to canonical `/blog/...`, `draft` become false, and public sitemap/indexing workflows run.

## Rollback

Because no merge/deploy occurred, rollback is local: delete the branch/worktree. If later merged but not deployed, revert this branch’s change set. If later deployed under a separate gate, remove the 25 stage MDX files and stage route, rebuild, verify that `sitemap-staged.xml` is empty/removed per the release decision, and confirm the public sitemap never acquired `/staged/` URLs.
