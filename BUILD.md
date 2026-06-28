# Build Verification — MRX Public Website

This is the canonical build-verification procedure for the `mrx-web` (MineralRightsXchange.com)
public Astro 5 site. Every change to this repo MUST pass this verification before the work is
considered "done". A Kanban delivery card that touches Astro code is not complete without a
green build captured as evidence.

## TL;DR — the one command

```bash
pnpm build 2>&1 | tee /tmp/mrx-build.log
```

If `pnpm` is not installed on your machine, use the shim:

```bash
./scripts/build.sh 2>&1 | tee /tmp/mrx-build.log
```

Both commands exit `0` on success and non-zero on any failure. Capture the exit code with
`"${PIPESTATUS[0]}"` immediately after the pipe.

## What the build does

The `build` script in `package.json` chains three steps; ALL must pass:

1. `node compliance/scripts/check-compliance.mjs` — scans every MDX, JSON-LD, and rendered
   HTML for the §4 disallowed-phrase lexicon. **This is the compliance gate.** Build fails
   immediately on any hit.
2. `astro check` — TypeScript / Astro typecheck across the whole project.
3. `astro build` — produces `dist/` with prerendered HTML, the Cloudflare `_worker.js`,
   the `_routes.json` route manifest, sitemap, and RSS.

`astro build` also runs `scripts/postbuild-sitemap.mjs` which rewrites `<priority>` on
18 sitemap entries to the values defined in the marketing hierarchy.

## Environment requirements

- **Node.js** ≥ 20.0.0 (see `engines.node` in `package.json`)
- **pnpm** (the repo's package manager). Install with `npm i -g pnpm` or `corepack enable`.
- Internet access for first install (registry fetches).

## Acceptance criteria (the build is "done" only when ALL of these are true)

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Exit code is `0` | `echo "${PIPESTATUS[0]}"` after the pipe |
| 2 | `dist/` exists | `test -d dist && echo OK` |
| 3 | HTML pages were generated | `find dist -name '*.html' \| wc -l` → expect ≥ 25 |
| 4 | Cloudflare `_worker.js` was emitted | `test -e dist/_worker.js && echo OK` |
| 5 | Sitemap has entries | `grep -oE '<loc>[^<]+</loc>' dist/sitemap-0.xml \| wc -l` → expect ≥ 20 |
| 6 | Route manifest exists | `test -f dist/_routes.json && echo OK` |
| 7 | Compliance check did not silently skip | compliance log line shows `0 violations` (or equivalent) |

Reference values from a clean build on this branch after the Cloudflare adapter / current route
shape reconciliation (2026-06-28, commit `557d46c`):

- **HTML pages**: 29
- **Total files in `dist/`**: 2437
- **`dist/` size**: 43 MB
- **Sitemap URLs**: 25
- **Routes (include + exclude in `_routes.json`)**: 38
- **Compliance check**: clean (0 violations)
- **Astro build wall time**: ~2.5s server build + ~0.1s prerender = ~2.6s after typecheck

If your numbers diverge by more than ±4 on HTML pages or ±2 on routes, investigate before
shipping — something rendered (or failed to render) differently. Server-rendered routes are
not counted as static `.html` files; use sitemap/route counts as companion checks.

## Evidence to attach to a Kanban delivery card

When you finish an Astro change and the build is green, post on the card:

1. **Exit code line** — `astro build exit: 0` (or the failing step).
2. **One build-log snippet** — at minimum the prerendered-route list (the table Astro
   prints of `src/pages/...` → `dist/.../index.html`).
3. **Route / page counts** — copy from the table above or recompute.
4. **`tree dist -L 1`** or `ls dist` capture so reviewers can see the output shape.

A canonical evidence block lives in `scripts/build.sh` itself — re-running it prints a
ready-to-paste summary.

## If the build fails

1. **Compliance check fails first** — read the lexicon hit; fix the offending MDX / JSON-LD /
   copy in `src/content/` or `src/pages/`. Do NOT loosen the lexicon.
2. **`astro check` (typecheck) fails** — the error message names the file and line. Fix in
   place; do NOT add `// @ts-ignore` without a justification comment.
3. **`astro build` itself fails** — usually a missing import, a bad frontmatter shape, or a
   content-collection schema violation. The stack trace is the source of truth.

If you cannot resolve in one focused hour, **block the card** with the failure pasted into a
comment and ask for human review. Do not mark "done" against a red build.

## See also

- `README.md` — full project orientation.
- `compliance/README.md` — what the compliance lexicon forbids and why.
- `scripts/build.sh` — one-shot shim that runs the canonical command and prints evidence.
- `kanban card t_73548512` — the delivery card that introduced this file.