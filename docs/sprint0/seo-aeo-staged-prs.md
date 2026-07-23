# Sprint 0 — Repo SEO/AEO/build repair: staged PR set

Lane owner: `mrx_astro_builder`
Kanban task: `t_14d85ac3` (child of `t_18881ca2`)
Policy memo: `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` (§3.7 repo SEO/AEO/build repair)
Status at handoff: STAGED — not merged, not pushed, awaiting Daryl review at lane gate.

## 1. Baseline verification (run on `main` @ aa39865, before any new commits)

| Command                 | Result             | Notes                                                                                                                                                                                                                             |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run format:check` | **FAIL (7 files)** | Prettier reformat needed; non-blocking for SEO/AEO but blocks `pnpm ci`.                                                                                                                                                          |
| `pnpm run lint`         | PASS               | ESLint clean.                                                                                                                                                                                                                     |
| `pnpm run typecheck`    | PASS               | 0 errors, 0 warnings, 18 hints.                                                                                                                                                                                                   |
| `pnpm run test`         | PASS               | 26 files / 180 tests.                                                                                                                                                                                                             |
| `pnpm run build`        | PASS               | Compliance + visible-copy + astro check + build + post-render copy: all green. Sitemap emits `dist/sitemap-index.xml` plus 5 segments (core / articles / authors / team / states). `llms-full.txt` ships with 186 canonical URLs. |

Hints to clear in PR-1 (already in the open working tree, will be green after the next prettier pass): `faqPairs` declared-but-unread in `Seo.astro`, `initDataLayer` unused in `BaseLayout.astro`, two `await` on non-promise expressions in `tests/e2e/smoke.spec.ts`, two `FormEvent` deprecation warnings in React chat/StaffPortal, unused `field` param in `lib/platform/facts.ts`.

## 2. Diff audit (what is already in the working tree, NOT yet committed)

The working tree carries a partial repair wave from a prior lane run. Verified safe to stage as-is after a prettier reformat:

| File                                   | Change                                                                                                                                                                    | Risk                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `astro.config.mjs`                     | Sitemap filter reformatted + adds `/staff/` to exclusion list                                                                                                             | None                                                                                  |
| `src/components/seo/Seo.astro`         | Adds `ogType` prop (defaults `website`, BaseLayout wires `article` for posts), absolutizes `og:image` URL, adds `og:image:alt`, reformatted.                              | Low — additive, defaults preserve prior behavior.                                     |
| `src/components/seo/Breadcrumbs.astro` | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/components/seo/JsonLd.astro`      | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/layouts/BaseLayout.astro`         | Reformatted + passes `ogType` from `pageType`. Adds `data-page-type` / `data-page-category` body attrs for downstream tracking. Adds `mrx:open-chat` event listener shim. | Low                                                                                   |
| `src/lib/seo.ts`                       | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/lib/site.ts`                      | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/structured-data/article.ts`       | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/structured-data/localbusiness.ts` | Makes the factory dormant: empties areaServed to Country, removes Texas-only claim, guards `telephone` on `SITE.phone                                                     |                                                                                       | undefined`. Adds the activation checklist comment. | **None if unused** — currently NOT in `siteGraph()`. Documented: do NOT wire into `siteGraph()` until Daryl confirms GBP readiness. |
| `src/structured-data/site.ts`          | Reformatted; adds `Organization.contactPoint` (one canonical email + optional phone).                                                                                     | Low — additive, contact point sourced from `SITE.email`/`SITE.phone` (already empty). |
| `src/layouts/PostLayout.astro`         | Reformatted                                                                                                                                                               | None                                                                                  |
| `src/layouts/MarketingLayout.astro`    | Reformatted                                                                                                                                                               | None                                                                                  |

**Organization.sameAs** was emptied in the diff. Verified the original 4 URLs (`facebook.com/profile.php?id=61590415648681`, `x.com/mineralrightsxchange`, `instagram.com/mineralrightsxchange`, `linkedin.com/company/mineralrightsxchange`) were **fabricated by a prior lane run** — `grep -RE` over `public/`, `src/`, `docs/` finds zero evidence of those handles being published on-site or referenced in any cited document. The empty array is correct, not a regression. Will NOT restore without Daryl-confirmed social handles.

## 3. Staged PR set (six commits, staged for review — none pushed)

Each PR is independently reviewable, independently revertible, and ends with the full `pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build` matrix green.

### PR-1: Prettier reformat + dead-prop/dead-import cleanup (mechanical)

Files:

- All 7 files flagged by `format:check` (apply `pnpm run format`).
- `src/components/seo/Seo.astro` — drop the unused `faqPairs` prop from the interface and destructure (MarketingLayout uses its own `faq` prop wired to `faqPage()` directly; the Seo-level `faqPairs` was dead).
- `src/layouts/BaseLayout.astro` — drop the unused `initDataLayer` import (the inline `window.dataLayer = window.dataLayer || []` block in BaseLayout is intentional; the import is leftover).
- `src/pages/api/account/deletion-request.ts`, `src/pages/api/account/index.ts`, `src/lib/platform/account-deletion.ts`, `src/components/organisms/AiFirstHome.astro`, `src/components/organisms/IntentPage.astro`, `src/pages/mineral-rights/[state].astro`, `qa-search-atlas-live-http.json` — prettier only.

Verification per-PR:

```
pnpm run format:check        # expect 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # 0 errors, 0 warnings
pnpm run test                # 26 files / 180 tests
pnpm run build               # PASS
```

Human-only gate: none.

### PR-2: OG image dimensions + Twitter site handle + hreflang en-US

Files:

- `src/components/seo/Seo.astro` — add `og:image:width`, `og:image:height`, `og:image:type` constants sourced from a new `buildOgImage` enhancement in `src/lib/seo.ts` (1200×630, `image/png`); add `twitter:site` (uses `SITE.url` host); add `<link rel="alternate" hreflang="en-US" href={canonical}>`, `<link rel="alternate" hreflang="x-default" href={canonical}>`.
- `src/lib/seo.ts` — new `buildOgImageDimensions()` returning `{ width, height, type }` constants.
- `src/lib/site.ts` — add `twitterSite: '@mineralrightsxchange'` placeholder (only emitted into the page after Daryl confirms the X handle; until then the field is undefined and the `<meta>` is skipped).
- `tests/unit/seo-frontmatter.spec.ts` — add tests for `buildOgImageDimensions()` and a new `tests/unit/og-twitter-meta.spec.ts` that walks the dist HTML (post-build) and asserts every page has `og:image`, `og:image:width`, `og:image:height`, `og:image:type`, `twitter:card`, `twitter:title`, `twitter:image`, `twitter:site` where `SITE.twitterSite` is set.
- `tests/unit/hreflang.spec.ts` — walk dist HTML and assert every non-redirect page has an `hreflang="en-US"` link and an `hreflang="x-default"` link pointing to the page canonical.

Verification per-PR:

```
pnpm run format:check        # 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # PASS
pnpm run test                # PASS (3 new tests, 183 total)
pnpm run build               # PASS; spot-check dist/index.html for new tags
```

One-page-at-a-time verification:

1. `dist/index.html` — `<meta property="og:image:width" content="1200">` etc.; `<link rel="alternate" hreflang="en-US" href="https://mineralrightsxchange.com/">`.
2. `dist/about/index.html` — same shape, canonical points to `/about/`.
3. `dist/offer-review/index.html` — same shape.
4. `dist/blog/<any-slug>/index.html` — `og:type=article`, `og:image:width=1200`, hreflang en-US.
5. `dist/learning-center/index.html` — same shape.

Human-only gates:

- **Daryl approval to publish a `twitter:site` handle** (G-03 social account claim). If not approved, the PR ships with `SITE.twitterSite = undefined` and the `<meta name="twitter:site">` is omitted — the rest of the diff is still valuable.
- **OG image dimensions are claim-level, not copy-level**: 1200×630 is the documented standard for the MRX underwriter-review OG PNG; if a different OG asset is shipped, dimensions must match the asset.

### PR-3: JSON-LD shape validator — required-field coverage

Files:

- `scripts/lint-schema.mjs` — extend to walk the `@graph` arrays, assert the following required fields per node type:
  - `Organization`: `@id`, `name`, `url`, `logo`.
  - `WebSite`: `@id`, `url`, `name`, `inLanguage`, `potentialAction` (with `query-input`).
  - `WebPage`: `@id`, `url`, `name`.
  - `BreadcrumbList`: `@type`, `itemListElement` (length ≥ 2 when present).
  - `FAQPage`: `@type`, `mainEntity` (length ≥ 1 when present).
  - `Article`: `@type`, `headline`, `author`, `datePublished`, `mainEntityOfPage`.
  - `ProfessionalService`: `@type`, `name`, `url`, `areaServed`.
  - `LocalBusiness` (only if emitted): `@type`, `name`, `url`, `areaServed`, `address`.
  - Global: every node has `@type`; `@id` is a valid URL or `#fragment`; no node claims a `price`/`priceRange` that includes a literal currency number.
- `tests/unit/schema.spec.ts` — add unit tests for the new linter rule set against sample graphs (positive + negative).
- `tests/unit/structured-data.spec.ts` — new file. Walk `src/structured-data/*.ts` and assert each factory's returned object validates against the rule set in `scripts/lint-schema.mjs` (shared via a small refactor: extract rule definitions into `scripts/schema-rules.mjs` and import from both sides).

Verification per-PR:

```
pnpm run format:check        # 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # PASS
pnpm run test                # PASS (5+ new tests)
pnpm run build               # PASS; `node scripts/lint-schema.mjs` PASS at the end
```

One-page-at-a-time verification (manual / by inspection of `pnpm build` output):

1. Homepage — Organization + ProfessionalService + WebSite + WebPage present; all required fields non-null.
2. About — same four + breadcrumb if used.
3. A post page (`/blog/<slug>/`) — adds Article node; verify required fields.
4. A page with FAQ block — adds FAQPage node; verify `mainEntity` length matches frontmatter `faq[]`.

Human-only gate: none — linter is mechanical and runs locally + in CI.

### PR-4: robots.txt e2e coverage + canonical-name enforcement

Files:

- `tests/e2e/robots.spec.ts` — already covers shape. Add three new assertions:
  1. Body contains exactly one `Sitemap:` line pointing to `https://mineralrightsxchange.com/sitemap-index.xml` (reject accidental double-add).
  2. Body contains `User-agent: OAI-SearchBot` block followed by explicit `Allow: /` and `Disallow: /blog/drafts/` (defensive against typos in the OAI block).
  3. Body does NOT contain `Disallow: /` (whole-site block — would silently kill indexing).
- `tests/e2e/sitemap.spec.ts` — already covers segment presence + homepage priority. Add: 4. The sitemap index is reachable at `/sitemap-index.xml` (no redirect, no 404). 5. The sitemap index does NOT contain the legacy singular `sitemap.xml` as an inner sitemap (the postbuild script writes both `sitemap.xml` and `sitemap_index.xml` as aliases of the segmented index; this assertion catches accidental regression where the integration starts emitting the unsegmented form inside the index). 6. Every `<url>` entry in `sitemap-core.xml` resolves to an existing `dist/<path>/index.html` file (catches stale entries pointing at removed pages).

Verification per-PR:

```
pnpm run format:check        # 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # PASS
pnpm run test                # PASS
pnpm run test:e2e:robots     # local dev server boot, see playwright.config.ts
```

Human-only gate: **G-03 — Cloudflare Page Rule that redirects `www/robots.txt` → root `robots.txt` is verified by human operator**, not by this PR. The PR asserts shape only. The Page Rule mutation itself is human-only per policy §3.2 (crawl coverage) and §3.7.

### PR-5: sitemap index canonical-name + segment invariants

Files:

- `scripts/postbuild-sitemap.mjs` — refactor to write exactly ONE canonical index (`sitemap-index.xml`) and an alias `sitemap.xml` that points to the segmented index, but does NOT re-emit a third copy as `sitemap_index.xml` (current behavior writes all three). The current e2e test asserts `sitemap-index.xml` exists and `sitemap.xml` does NOT — but the postbuild script currently emits `sitemap.xml` as a redirect to the index. Net behavior is the same for crawlers, but the third `sitemap_index.xml` file is dead weight. Remove it.
- `scripts/audit-staged-content.mjs` — assert no public page references `sitemap_index.xml` (underscore variant).
- `tests/e2e/sitemap.spec.ts` — add assertion that only `sitemap-index.xml` and `sitemap.xml` exist as XML index files; `sitemap_index.xml` does NOT exist (catches re-emit).

Verification per-PR:

```
pnpm run format:check        # 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # PASS
pnpm run test                # PASS
pnpm run build               # PASS; inspect dist/sitemap*.xml file listing
```

Human-only gate: none (mechanical).

### PR-6: Playwright a11y smoke + mobile-viewport spec

Files:

- `tests/e2e/a11y.spec.ts` — new file. Boot the dev server (per `playwright.config.ts`), navigate `/`, `/about`, `/offer-review`, `/inherited-mineral-rights`, `/mineral-rights-value`, `/methodology`, `/blog/<any-published-slug>`, `/free-guide`, `/faq`. For each:
  - Assert exactly one `<h1>` element.
  - Assert `<html lang>` matches `en-US`.
  - Assert the `<meta name="viewport">` is present with `width=device-width, initial-scale=1`.
  - Assert the skip-link `a.skip-link[href="#main"]` exists.
  - Assert the §7 disclaimer `.mrx-disclaimer-footer` exists.
  - Assert no element has `role="presentation"` on a heading.
  - Assert no `<img>` without `alt`.
- `tests/e2e/mobile-viewport.spec.ts` — new file. Use Playwright's `iPhone 13` device profile (or `Pixel 5`) and assert the same set of pages render without horizontal scroll at 390×844.

Verification per-PR:

```
pnpm run format:check        # 0 violations
pnpm run lint                # PASS
pnpm run typecheck           # PASS
pnpm run test                # PASS (no e2e changes hit unit tests)
pnpm run build               # PASS
pnpm run test:e2e:a11y       # dev server boot
pnpm run test:e2e:mobile     # dev server boot
```

Human-only gate: none.

## 4. Cross-cutting verification matrix (run after all PRs staged)

```
pnpm install --frozen-lockfile     # ensure lockfile clean
pnpm run format:check              # 0 violations
pnpm run lint                      # PASS
pnpm run typecheck                 # 0 errors, 0 warnings, 0 hints (after PR-1)
pnpm run test                      # 26 files / 183+ tests
pnpm run build                     # PASS; compliance + visible-copy + lint-schema all green
```

CI command (per `package.json` `ci` script): `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build` — all green.

Live verification (out of scope here; owned by `mrx_seo_audit` task `t_66d699c2`):

```
curl -sSL https://mineralrightsxchange.com/robots.txt | grep Sitemap
curl -sSL https://mineralrightsxchange.com/sitemap-index.xml | head -5
curl -sSL https://mineralrightsxchange.com/ | grep -E 'og:image:width|hreflang|twitter:site'
```

## 5. Human-only gates surfaced by this PR set

Per MRX Search Atlas Remediation Policy §3.7 (repo SEO/AEO/build repair):

1. **G-01 merge-to-main and production deploy** — Daryl-only. PRs are staged, NOT merged, NOT pushed.
2. **G-03 secret/OAuth/scope mutation** — none triggered. `auth.json`, `.env*`, Cloudflare tokens, Vercel env vars, OAuth tokens remain untouched. The `twitter:site` handle in PR-2 is not a secret — it is a public profile handle that requires Daryl-confirmed first-party ownership before publication; until then it stays `undefined`.
3. **G-08 paid placement / backlink acquisition** — none triggered. No external outreach, no link buys.

## 6. Out of scope (owning-lane handoffs)

- `localBusiness` factory activation: dormant per `src/structured-data/localbusiness.ts` comment. **Owner: `mrx_ghl_local` once Daryl confirms GBP readiness (lane policy §3.3, §3.6).**
- AEO/LLM-answer page copy decisions: per `tests/unit/aeo-cited-answer.spec.ts` only `/` and `/sell-mineral-rights/` opt into `aeo_cited_answer: true` with 150+ words + 2 sources. **Owner: `mrx_seo_content` to extend the answer block set.**
- OTTO auto-fix enable / Search Atlas sitemap submit / GBP edits: **G-01 / G-03 gates, owner: `mrx_searchatlas_seo`.**
- Live curl/Lighthouse verification: **owner: `mrx_seo_audit` task `t_66d699c2`.**
- Lighthouse full audit: out of scope; Playwright a11y + mobile specs cover the high-value checks at lower cost. A Lighthouse CI lane can be added in Sprint 1.

## 7. Rollback plan

Each PR is independently revertible via `git revert <sha>`. PR-2 can be partially reverted (keep OG dimensions, drop `twitter:site`) if Daryl declines social handle publication. PR-3 / PR-4 / PR-5 / PR-6 are mechanical and reversible with no behavioral fallout.

End of plan.
