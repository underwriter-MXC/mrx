# Changelog

All notable changes to the MRX public website are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-11 — MVP

### Added
- Initial Astro 5 + Cloudflare Pages scaffold.
- 9 marketing pages: `/`, `/how-it-works`, `/about`, `/faq`, `/free-guide`, `/book`, `/privacy-policy`, `/methodology`, `/sell-mineral-rights`.
- 2 hybrid Cloudflare Functions for `/api/book` (POST) and `/api/free-guide` (POST); env-var contract reserved for stage 08 (GHL).
- 3 layouts: `BaseLayout`, `MarketingLayout`, `PostLayout`.
- 22 components (atomic design: 6 atoms, 9 molecules, 7 organisms, plus 3 SEO, 5 prose wrappers, 6 icons).
- 5 content collections: `pages` (9 MDX), `posts` (5+ migrated MDX), `categories` (TS), `testimonials` (empty JSON, awaiting W-1 resolution), `team` (MDX).
- Per-page SEO/AEO metadata + JSON-LD graph (Organization, ProfessionalService, WebSite, BreadcrumbList, FAQPage, Article, SpeakableSpecification pointing at the §7 disclaimer).
- §7 disclaimer as a build-time enforced global component in every layout footer; `<Disclaimer variant="top" />` slot in `MarketingLayout` and `PostLayout` for the 4 categories that need it.
- §9 per-page sign-off rubric as zod-validated frontmatter on every page.
- §10 first-200-chars snippet test as a Playwright E2E test.
- §4 build-time grep check (`compliance/scripts/check-compliance.mjs`) as the first step of every build.
- Cloudflare adapter (directory mode) with 2 POST endpoints bound.
- Sitemap (`sitemap-index.xml` only) + `robots.txt` (Disallow `/blog/drafts/`).
- TypeScript strict; Prettier + ESLint + prettier-plugin-astro.
- Vitest unit suite (signoff, schema, disclaimer, seo-frontmatter, posts-zod, pages-zod, team-zod).
- Playwright E2E suite (smoke, snippet, sitemap, robots, schema-markup, form, a11y).
- WP migration script `scripts/migrate-wp.mjs` (idempotent, reads from `project-pack/01-wordpress-content/content_inventory.json`).
- GitHub Actions: `ci.yml` (PR + push to main: lint, typecheck, test, build, deploy-preview) and `deploy.yml` (main → Cloudflare Pages production).

### Compliance
- All 7 HIGH-severity items from `project-pack/04-compliance/MRX Compliance Review.md` §5 resolved in the page frontmatter (W-1, Q-1, Q-3, L-2..L-9, L-6, P-1). See page `compliance_signoff` blocks.
- §7 disclaimer carries the MRX-as-buyer disclosure (compliance review §7, last sentence).
- Per-page sign-off rubric populated on every shipping page with `reviewed_by: 'mrx_compliance-stage06-initial'` and `reviewed_at: 2026-06-11`.

### Out of scope (deferred to follow-up cards)
- CMS layer, team page route, i18n, blog search, comments, paid pixels, AI chatbot (Ava persona).
- Full WP migration of 101 published posts (only 5+ migrated for the MVP scaffold; the script handles the rest idempotently).
