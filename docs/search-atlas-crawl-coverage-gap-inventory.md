# Search Atlas Crawl Coverage Gap Inventory + Robots/Redirect Recommendations

Generated: 2026-07-20T05:09:25.537768+00:00
Kanban task: `t_6de8d495`
Workspace: `/Users/darylhill/Documents/MineralRightsXchange.com/mrx`

## Situation

This is a read-only Sprint 0 crawl-coverage lane artifact under `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`. I did not edit `robots.txt`, Cloudflare, Vercel, nginx, DNS, GSC, or production settings.

The most important finding is that production crawl-control and content URLs are currently behind a Vercel Security Checkpoint. Public curl checks for `robots.txt`, sitemap variants, `llms.txt`, `llms-full.txt`, and core HTML pages returned HTTP 403 with `x-vercel-mitigated: challenge`. Additional checks using Googlebot and Bingbot user agents also returned 403 challenge.

## Evidence sources used

- Policy: `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`
- Local robots: `public/robots.txt`
- Local sitemap/build artifacts: `dist/sitemap*.xml`, `dist/robots.txt`, `dist/llms*.txt`
- Existing live QA export: `qa-search-atlas-live-http.json`
- Source/config: `astro.config.mjs`, `scripts/postbuild-sitemap.mjs`, `vercel.json`
- Tests: `tests/e2e/robots.spec.ts`, `tests/e2e/sitemap.spec.ts`
- Public curl: default, Googlebot, Bingbot, and Mozilla user agents

No dedicated crawl export files or server log files were found in the workspace by filename search. This did not block the task because existing QA JSON plus local build artifacts and public curl were enough to produce the inventory.

## Coverage inventory snapshot

| Surface                      |                                                                 Local / source evidence |              Live public evidence | Gap                                             |
| ---------------------------- | --------------------------------------------------------------------------------------: | --------------------------------: | ----------------------------------------------- |
| `robots.txt`                 | Exists in `public/` and `dist/`; disallows API/account/knowledge/drafts/thank-you paths |    403 Vercel Security Checkpoint | Critical live fetchability gap                  |
| `sitemap_index.xml`          |                                        Exists in `dist/`; sitemap index with 5 segments |    403 Vercel Security Checkpoint | Critical live fetchability gap                  |
| `sitemap-index.xml`          |                                                      Exists in `dist/`; duplicate alias |    403 Vercel Security Checkpoint | Canonical alias drift                           |
| `sitemap.xml`                |                                               Exists in `dist/`; duplicate legacy alias |    403 Vercel Security Checkpoint | Legacy sitemap should not be relied on          |
| `llms.txt` / `llms-full.txt` |                                                                       Exists in `dist/` |    403 Vercel Security Checkpoint | AEO/LLM fetchability gap                        |
| Core public pages            |                                                            31 core sitemap URLs locally |   403 challenge in QA/live checks | Search/OTTO crawl blocked                       |
| Articles                     |                              125 published post files; 126 article sitemap URLs locally |       not fetchable due challenge | Crawl blocked until checkpoint resolved         |
| Authors/team/states          |                                        7 author, 12 team, 10 state sitemap URLs locally |       not fetchable due challenge | Crawl blocked until checkpoint resolved         |
| Private/utility pages        |        Account/staff/thank-you absent from generated sitemaps; noindex/disallow present | not verifiable live due challenge | Local policy aligned; live verification blocked |

Local segment counts from `dist/`:

- `sitemap-core.xml`: 31 URLs
- `sitemap-articles.xml`: 126 URLs
- `sitemap-authors.xml`: 7 URLs
- `sitemap-team.xml`: 12 URLs
- `sitemap-states.xml`: 10 URLs
- `sitemap-0.xml`: 186 URLs

## Coverage gaps

### CG-01 — Critical — Production crawler access blocked by Vercel Security Checkpoint

Finding: Production public curl returns 403 challenge for robots, sitemaps, llms files, and public HTML. Googlebot and Bingbot user-agent checks also returned 403 challenge.

Impact: SearchAtlas, OTTO, Google/Bing-style crawlers, and LLM consumers may not be able to fetch crawl-control files or page content.

Recommendation: Daryl/Vercel/Cloudflare admin gate. Remove or scope the checkpoint so `robots.txt`, `sitemap*.xml`, `llms*.txt`, and public canonical pages return fetchable 200/301 responses without JavaScript challenge. Verify with default curl plus Googlebot/Bingbot user agents. No agent-side mutation should be applied.

### CG-02 — High — Robots sitemap directive conflicts with canonical underscore policy

Finding: `public/robots.txt` and `dist/robots.txt` point to `https://mineralrightsxchange.com/sitemap-index.xml`. MRX growth ops and the e2e robots spec expect `https://mineralrightsxchange.com/sitemap_index.xml`.

Impact: Crawlers may discover the hyphenated alias instead of the canonical underscore sitemap.

Recommendation: `mrx_webdev` repo draft: change the robots Sitemap directive to `sitemap_index.xml`; publish only after human deploy approval.

### CG-03 — High — Duplicate sitemap aliases generated

Finding: `scripts/postbuild-sitemap.mjs` writes `sitemap-index.xml`, `sitemap.xml`, and `sitemap_index.xml`. Current `dist/` contains all three. The MRX growth policy says not to rely on legacy `sitemap.xml`, and the e2e sitemap test expects only the underscore canonical in `dist/client`.

Impact: Duplicate sitemap entrypoints weaken canonical hygiene and can reintroduce legacy Search Console warnings.

Recommendation: `mrx_webdev` repo draft: generate one canonical `sitemap_index.xml`. If legacy/hyphen paths are kept for compatibility, make them approved 301 redirects to `sitemap_index.xml` rather than duplicate index files.

### CG-04 — Medium — Redirect-source URL appears in sitemap

Finding: `dist/sitemap-core.xml` includes both `/1031-exchange/` and `/1031-exchanger/`. Source and `vercel.json` indicate `/1031-exchanger` redirects permanently to `/1031-exchange/`.

Impact: Redirect sources in sitemaps waste crawl budget and send mixed canonical signals.

Recommendation: `mrx_webdev` repo draft: exclude `/1031-exchanger/` from sitemap generation; keep `/1031-exchange/` only.

### CG-05 — Medium — Sitemap output path/test drift

Finding: Current sitemap files are at `dist/*.xml`; `tests/e2e/sitemap.spec.ts` checks `dist/client/*.xml`. The script handles both paths, but the current generated output and test expectation differ.

Impact: Verification can fail or miss the actual sitemap output depending on adapter/build target.

Recommendation: `mrx_webdev` repo draft: make tests discover the same output path candidates as `scripts/postbuild-sitemap.mjs`, or align build output consistently.

### CG-06 — Low — Private/utility exclusion is locally aligned

Finding: Account/staff/thank-you URLs were not present in local sitemap files. Account/staff/thank-you pages have noindex where expected, and Vercel headers noindex API/blog draft paths.

Impact: No immediate recommendation beyond regression monitoring.

Recommendation: Keep exclusions. Re-verify live once the checkpoint issue is resolved.

## Robots/redirect recommendation queue

| ID    | Priority | Owner                           | Recommendation                                                                                                                                  | Risk/gate                                   |
| ----- | -------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| RR-01 | P0       | Daryl + Vercel/Cloudflare admin | Disable/scope Vercel Security Checkpoint or add approved bypass for crawl-control files and public pages.                                       | High; human-only live security/routing gate |
| RR-02 | P1       | `mrx_webdev`                    | Change robots Sitemap directive from `sitemap-index.xml` to `sitemap_index.xml`.                                                                | Low repo draft; deploy human-only           |
| RR-03 | P1       | `mrx_webdev`                    | Stop generating duplicate `sitemap.xml` and `sitemap-index.xml` aliases unless they redirect to `sitemap_index.xml`.                            | Medium; sequence with GSC cleanup           |
| RR-04 | P2       | `mrx_webdev`                    | Exclude `/1031-exchanger/` redirect source from sitemap.                                                                                        | Low repo draft                              |
| RR-05 | P2       | `mrx_webdev`                    | Align sitemap e2e tests with actual output path/canonical policy.                                                                               | Low repo draft                              |
| RR-06 | P2       | `mrx_gsc` after Daryl approval  | After live `sitemap_index.xml` returns 200, ensure GSC only has canonical sitemap submitted and remove legacy `sitemap.xml` only with approval. | Human-only GSC mutation gate                |

## Human-only gates surfaced

- G-01/G-03: editing robots.txt, Cloudflare Page Rules, Vercel security/routing settings, DNS, or nginx rules is human-only unless explicitly approved.
- G-01/G-03: submitting/removing sitemaps in Google Search Console is human-only.
- Merge-to-main and production deployment for repo fixes is human-only.

## Handoff

Next owner: `mrx_webdev` for repo-side robots/sitemap generation/test drift drafts. Daryl/Vercel/Cloudflare admin must handle the live Security Checkpoint/routing bypass. `mrx_gsc` should verify or mutate GSC only after human approval and after `https://mineralrightsxchange.com/sitemap_index.xml` returns a normal fetchable response.
