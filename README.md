# Mineral Rights Xchange — Public Website

The official public website for [Mineral Rights Xchange](https://mineralrightsxchange.com), built on Astro 5 with Cloudflare Pages.

## What this site is

A free, transparent underwriter review service for Texas mineral rights owners. The site explains the review process, hosts the FAQ, lists the published DCF methodology, and captures two lead forms (`/book` for the calendar booking, `/free-guide` for the lead magnet PDF).

## Stack

- **Astro 5** with `output: 'static'` and `@astrojs/cloudflare` adapter (directory mode)
- **MDX** for marketing pages and blog posts
- **TypeScript** strict
- **Cloudflare Pages** hosting (Cloudflare Web Analytics + GTM/GA4 client-side)
- **Playwright** for E2E, **Vitest** for unit
- **pnpm** package manager, **Node 20** LTS

## Local development

```bash
pnpm install
pnpm dev            # http://localhost:4321
```

## Build

```bash
pnpm build          # runs compliance check, typecheck, then astro build
```

The compliance check is the first step of `pnpm build`. It fails the build if any §4 disallowed phrase is found in any MDX, JSON-LD, or rendered HTML. See `compliance/README.md` for the lexicon source.

## Deploy

Push to `main` → Cloudflare Pages production. Stage 09 (`devops-engineer`) owns the deploy card and the Cloudflare configuration.

## Project structure

See `project-pack/05-astro-arch/Repo File Tree Proposal.md` for the canonical file tree. Quick map:

- `src/pages/` — file-based routing (9 marketing pages + blog + 2 hybrid API routes)
- `src/layouts/` — 3 layouts: `BaseLayout`, `MarketingLayout`, `PostLayout`
- `src/content/` — 5 Astro content collections (pages, posts, categories, testimonials, team)
- `src/components/` — atomic design: 6 atoms, 9 molecules, 7 organisms
- `src/lib/` — pure functions (site config, disclaimer, JSON-LD, form zod, analytics)
- `src/structured-data/` — JSON-LD factories
- `compliance/` — build-time grep + sign-off data (NOT a runtime directory)
- `tests/` — Vitest unit + Playwright E2E

## Compliance posture

Every page carries a `compliance_signoff` frontmatter block (per the §9 sign-off rubric). The build's zod schema validates it. A Vitest unit test re-verifies on every CI run. The `pnpm check-compliance` script is the first step of every build and pre-commit hook.

The §7 disclaimer is a single global component rendered in every layout footer (and at the top of every tax/legal/methodology page). Its text lives in `compliance/disclaimer.ts` and is imported by `src/lib/disclaimer.ts`.

## License

Proprietary. © Mineral Rights Xchange. All rights reserved.
