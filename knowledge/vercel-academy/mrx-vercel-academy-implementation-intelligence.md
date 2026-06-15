# MRX Vercel Academy Implementation Intelligence

**Audience:** Mineral Rights Xchange (MRX) product, SEO/AEO, engineering, and growth teams  
**Source archive:** `knowledge/vercel-academy/raw` downloaded Vercel Academy markdown/HTML-derived files  
**MRX context:** Astro 5 public site today, Cloudflare Pages deployment in README, with planned/possible Next.js + Vercel capabilities for AI, workflows, previews, and edge/server workloads. MRX is a mineral-rights SEO/AEO platform focused on Texas mineral owners, transparent underwriter review, DCF methodology, FAQ, free-guide leads, and booking leads.

## Executive takeaways

1. **Highest immediate advantage: agent-readable content.** Vercel Academy repeatedly models `llms.txt`, `llms-full.txt`, markdown endpoints, summaries, filtering, structured output, and machine-readable docs. MRX should treat AI crawlers and answer engines as first-class users, not as a byproduct of HTML SEO.
2. **Next.js/Vercel patterns still transfer to Astro.** Static shells, image/font/script discipline, dynamic metadata, no-waterfall data loading, clean error surfaces, and route-level rendering decisions apply directly to Astro and to any future Next/Vercel migration.
3. **MRX should build an AEO content/API layer.** The competitive moat is not only more blog posts; it is a structured corpus of mineral-rights answers, counties, valuation methodology, disclaimers, lead actions, and citations exposed through predictable text, JSON, and markdown surfaces.
4. **AI features must be governed.** Academy courses stress AI Gateway, model selection, fallbacks, observability, structured outputs, token budgets, and error fallback UI. MRX can use AI for summaries, owner intake, county briefs, DCF explainers, and content QA, but only behind compliance guardrails.
5. **Operational maturity is a ranking advantage.** Preview deployments, observability, remote caching, CI, sandboxed reviews, deterministic tests, and compliance gates reduce regressions in content accuracy, Core Web Vitals, schema, disclaimers, and lead capture.

## Priority roadmap

| Priority | Initiative | Academy areas | Why MRX should do it |
|---|---|---|---|
| P0 | Add `/llms.txt`, `/llms-full.txt`, markdown content exports, and structured answer indexes | Agent-Friendly APIs, AI SDK, AI Summary App | Direct AEO/AI-search discoverability and source-of-truth control. |
| P0 | Harden technical SEO/CWV baseline | Next.js Foundations, Nuxt/Svelte on Vercel | Faster pages and more reliable crawling for high-intent mineral-rights queries. |
| P0 | Add compliance-aware structured data and metadata factories | Next.js Foundations, Agent-Friendly APIs | Rich results, answer extractability, and safer claims governance. |
| P1 | Build AI-assisted owner-facing and internal summaries | AI SDK, AI Summary App | Turns complex DCF/mineral data into understandable explanations and lead qualification. |
| P1 | Add workflow-backed lead and document processing | Workflow Foundations, Visual Workflow Builder, Slack Agents | Reliable multi-step follow-up, CRM handoff, email, reminders, and human review. |
| P1 | Introduce Vercel/preview-style content QA gates even if hosting remains Cloudflare | Vercel Sandbox, Production Monorepos, Build AI Agent Harness | Prevents broken SEO, disclaimers, forms, and schema from shipping. |
| P2 | Modularize UI/content systems | shadcn/ui, Production Monorepos, Microfrontends | Faster landing-page experimentation without brand/compliance drift. |
| P2 | Explore FastAPI/Python valuation services | Python on Vercel | Isolates DCF calculators, county-data enrichment, and document parsing. |

---

## 1. Agent-Friendly APIs and Agent-Readable Documentation

**What was learned**
- Academy's strongest pattern is to publish API/content surfaces for agents: `/llms.txt` as a root index, `/llms-full.txt` for one-shot context loading, markdown docs, summary endpoints, filtering/details endpoints, feedback endpoints, and HATEOAS-style links.
- The `llms.txt` lesson emphasizes a simple structure: H1 project name, blockquote summary, contextual description, H2 sections, and link lists to machine-readable resources.
- HTML files in the archive explicitly tell agents to prefer markdown because it is more token-efficient, includes metadata, and is easier to parse.

**Why it matters to MRX**
- Mineral-rights decisions are complex, local, and high-value. AI answer engines need clear, authoritative, citation-ready material to quote MRX instead of competitors.
- Search is shifting from page-ranking to answer retrieval. MRX should make its methodology, FAQ, county pages, booking path, guide, and disclaimers easy for AI systems to ingest.

**How MRX should implement it**
- Add static Astro routes:
  - `/llms.txt`: concise index of MRX's best resources.
  - `/llms-full.txt`: bundled canonical knowledge pack for AI systems.
  - `/faq.md`, `/methodology.md`, `/sell-mineral-rights.md`, `/free-guide.md`, and future `/counties/{county}.md` exports.
  - `/api/answers/summary.json`: concise structured summary of MRX topics, lead paths, and compliance disclaimers.
  - `/api/answers/search.json?q=` or static generated search chunks if runtime is unavailable.
- Include sections in `llms.txt` for: Mineral rights basics, Texas county valuation, DCF methodology, selling process, tax/legal disclaimers, MRX buyer disclosure, FAQ, lead actions, and contact/booking.
- Keep all AI-facing text generated from the same content collections/frontmatter used by pages, not hand-maintained duplicates.
- Add build tests that verify content type, URL existence, canonical links, no disallowed compliance phrases, and presence of disclaimer references.

**Expected impact**
- High. MRX becomes easier for ChatGPT, Perplexity, Claude, Google AI Overviews, Bing Copilot, and future agents to cite accurately.

**Effort**
- Low to Medium. Static Astro endpoints plus a content aggregation script can ship quickly; semantic chunking/search is a follow-up.

**SEO impact**
- Medium to High. `llms.txt` is not traditional SEO alone, but markdown mirrors and clean metadata improve crawlability, content governance, and internal linking discipline.

**AI Search impact**
- Very High. This is the most direct Academy-derived AEO implementation for MRX.

**Competitive advantage**
- Most mineral-rights sites optimize only HTML landing pages. MRX can be one of the first in the niche to provide a machine-readable mineral-rights knowledge graph with transparent methodology and compliant source text.

---

## 2. Next.js Foundations: Routing, Rendering, Metadata, Performance, and Security

**What was learned**
- Major themes: App Router, server/client boundaries, nested layouts, data fetching without waterfalls, dynamic metadata, not-found/error surfaces, Core Web Vitals, image/font/script optimization, environment security, cache components, forms/server actions, and API/config security reviews.
- Course patterns translate to Astro: decide static vs dynamic per route, avoid client JS by default, stream/defer where useful, generate metadata from typed content, and keep third-party scripts under control.

**Why it matters to MRX**
- MRX competes for high-intent queries such as selling mineral rights, mineral valuation, royalty interests, Texas county terms, and tax/process questions. Slow pages, weak metadata, and broken schema waste authority.
- The current README says Astro static output, MDX collections, JSON-LD factories, Playwright/Vitest, and compliance checks already exist. The Academy patterns reinforce that MRX should double down on typed, static, low-JS pages.

**How MRX should implement it**
- Maintain Astro static generation for marketing, methodology, FAQ, blog, and future county/topic pages.
- Create typed metadata factories for every content collection: title, description, canonical, OG image, `FAQPage`, `Article`, `BreadcrumbList`, `Organization`, and `Service` JSON-LD where appropriate.
- Add route-level performance budgets: LCP image priority, no unapproved third-party scripts, font preloading/subsetting, deferred analytics, and image dimensions.
- Add custom `404`, content error, and form error surfaces that guide owners to `/free-guide` and `/book`.
- Ensure forms use server-side validation and do not expose secrets. Keep env variables documented and separated by environment.
- Add no-waterfall data loading for any future dynamic dashboards/calculators.

**Expected impact**
- High. Faster crawling, better engagement, fewer technical SEO regressions, and stronger lead conversion.

**Effort**
- Medium. Metadata/schema and tests are straightforward; full CWV budget enforcement takes more iteration.

**SEO impact**
- Very High. This directly affects crawl quality, rich snippets, ranking signals, and user behavior.

**AI Search impact**
- High. Clean metadata, JSON-LD, canonical text, and fast static pages make AI extraction more reliable.

**Competitive advantage**
- Mineral-rights competitors often have generic WordPress-style pages. MRX can combine static performance, structured data, and compliance-checked explainers at scale.

---

## 3. AI SDK Fundamentals: Models, Prompts, Tool Use, Classification, Extraction, and Generative UI

**What was learned**
- Academy AI SDK material covers model selection, fast vs reasoning models, prompting fundamentals, system prompts, chatbots, text classification, data extraction, structured data extraction, tool use, AI Elements, and invisible AI experiences.
- Core lesson: do not use one model or prompt for everything. Match latency/cost/reasoning to the job and demand structured outputs where downstream systems depend on accuracy.

**Why it matters to MRX**
- MRX can use AI to simplify mineral-rights complexity, but financial/legal-adjacent content requires guardrails and human-review boundaries.
- AI can assist with lead intake, document triage, FAQ personalization, owner-friendly explanations, and internal content QA.

**How MRX should implement it**
- Use AI for **assistive** workflows, not unreviewed valuation promises:
  - Owner intake classifier: county, ownership type, lease/royalty context, urgency, documents available.
  - FAQ answer assistant constrained to MRX-approved markdown and disclaimers.
  - DCF methodology explainer that outputs plain-language summaries plus citations to `/methodology`.
  - Lead quality scoring for internal routing, never displayed as a guaranteed offer.
- Use structured schemas for AI outputs: `topic`, `confidence`, `citations`, `compliance_flags`, `recommended_next_step`, `needs_human_review`.
- Use fast models for classification/summarization; reasoning models only for complex document interpretation or content QA.
- Build fallback UI: when AI is unavailable or confidence is low, show static approved answers and route to booking.

**Expected impact**
- Medium to High. Better UX and internal efficiency, with controlled risk.

**Effort**
- Medium to High depending on whether MRX adds runtime AI endpoints now or only internal tools first.

**SEO impact**
- Medium. AI can accelerate content production and QA, but public SEO value depends on approved static output.

**AI Search impact**
- High. Structured answers and citations make MRX content easier to package for answer engines.

**Competitive advantage**
- MRX can provide a guided, transparent educational experience while competitors rely on opaque lead forms or broad claims.

---

## 4. Creating an AI Summary App with Next.js: Gateway, Structured Output, Caching, Streaming, Observability

**What was learned**
- Lessons cover AI Gateway setup, prompt engineering, first AI summaries, structured output, streaming summaries, smart caching, observability/monitoring, fallback chains, error states, and type-safe data layers.
- The `when-ai-goes-wrong` material emphasizes try/catch fallbacks, AI Gateway fallback chains, cost/usage visibility, and graceful UI degradation.

**Why it matters to MRX**
- Mineral owners need understandable summaries of complex information: leases, royalty statements, DCF assumptions, market context, and sales process tradeoffs.
- MRX also needs predictable AI costs and auditability.

**How MRX should implement it**
- Build an internal or owner-facing summary pipeline:
  - Input: approved content, owner-submitted notes, public county context, optional documents.
  - Output: structured summary, questions to ask, documents needed, and citation links.
  - Cache: static/county-level summaries cached long-term; owner-specific summaries short-lived/private.
  - Stream: use streaming only for interactive experiences; keep static pages pre-rendered.
  - Observe: log model, tokens, latency, confidence, fallback used, and compliance flags.
- Add AI Gateway or equivalent model gateway before production AI use.
- Create hard fallback components for all AI sections: static FAQ excerpt, methodology excerpt, and booking CTA.

**Expected impact**
- High for lead qualification and trust; moderate for public SEO unless summaries become approved pages.

**Effort**
- High for production owner-facing AI; Medium for internal summarization.

**SEO impact**
- Medium. The best SEO use is turning reviewed AI-assisted drafts into static canonical pages.

**AI Search impact**
- High. Structured summaries with citations align with answer-engine extraction.

**Competitive advantage**
- MRX can explain valuation logic transparently at scale, while keeping human underwriter review central.

---

## 5. Workflow Foundations and Durable Workflows

**What was learned**
- Workflow lessons teach durable multi-step processes: wrap work in a workflow, wait/sleep between steps, handle flaky external services, wait for callbacks/hooks, observe every step, classify final vs retryable failures, and deploy workflows.
- Related Svelte lessons reinforce durable tasks, multi-step workflows, fallbacks/tracking, and structured workflow error handling.

**Why it matters to MRX**
- Lead handling is naturally workflow-based: free guide request, booking, CRM handoff, email follow-up, document request, underwriter review, reminder, and status update.
- Missing one step can cost a high-value lead.

**How MRX should implement it**
- Model MRX lead flows as explicit workflows:
  - `/free-guide` submission -> validate -> CRM create/update -> send guide -> tag persona/topic -> schedule nurture.
  - `/book` submission -> validate -> CRM -> calendar confirmation -> internal Slack/email alert -> follow-up reminders.
  - Document intake -> virus/type check -> OCR/extraction -> human review queue -> summary -> response.
- Add idempotency keys for form submissions.
- Add workflow status logs visible to admins.
- Define retry policy for CRM/email failures and final-failure alerting.
- Keep owner-facing pages static; run workflows through serverless/background infrastructure.

**Expected impact**
- High. Better lead reliability, faster follow-up, and fewer silent failures.

**Effort**
- Medium to High depending on CRM/email integration maturity.

**SEO impact**
- Low direct, High indirect through conversion rate and operational reliability.

**AI Search impact**
- Low to Medium direct, but enables AI-assisted intake and follow-up safely.

**Competitive advantage**
- Many niche acquisition sites lose leads through brittle forms. Durable workflows make MRX operationally sharper.

---

## 6. Vercel Sandbox and Sandboxed AI Reviews

**What was learned**
- Vercel Sandbox course themes include cloning repos, validating GitHub URLs before spending money, wrapping lifecycle, reading files, running tests inside a sandbox, parsing failures, package-manager variants, merging AI/test findings, snapshots for speed, predictable exit codes, resilient error handling, benchmarking, and formatted reports.

**Why it matters to MRX**
- MRX has compliance checks and tests. A sandboxed review pipeline can prevent bad content, broken schema, failed forms, or disallowed claims from reaching production.
- AI code/content review is useful only if grounded in real test output.

**How MRX should implement it**
- Build a `repo-review` or CI job that runs on PRs:
  - `pnpm install --frozen-lockfile`
  - `pnpm check-compliance`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - Playwright smoke tests for `/`, `/faq`, `/methodology`, `/free-guide`, `/book`, `/llms.txt`.
- Produce a structured report: failures, impacted routes, SEO/schema changes, compliance changes, recommended fix.
- Use snapshots/caching to speed repeated checks.
- If Vercel deployment previews are added, attach the review report to each preview.

**Expected impact**
- High for release quality and compliance confidence.

**Effort**
- Medium.

**SEO impact**
- High. Prevents accidental noindex/canonical/schema/content regressions.

**AI Search impact**
- High. Ensures AI-facing text exports stay current and compliant.

**Competitive advantage**
- MRX can ship more content faster without sacrificing regulated-claim discipline.

---

## 7. Build Your Own AI Coding Agent Harness

**What was learned**
- Key concepts: clear tool descriptions, shell execution safety, approval gates, verification gates, project context, state machines, local/cloud implementation, explorer/executor subagents, delegation, task/todo tools, pruning old results, snapshot/restore, dynamic prompt construction, lifecycle hooks, and extension points.

**Why it matters to MRX**
- MRX's growth plan likely requires many landing pages, county guides, FAQs, structured data updates, and compliance reviews. Agentic automation can accelerate this, but only with strict gates.

**How MRX should implement it**
- Create internal agent workflows for:
  - New county page generation from approved templates and sources.
  - JSON-LD and metadata validation.
  - Broken-link and stale-content detection.
  - Competitor SERP analysis drafts.
  - Compliance pre-review before human signoff.
- Use explicit approval gates before writing public claims or publishing pages.
- Require verification gates: build, tests, schema validation, rendered-page inspection, and disclaimer presence.
- Maintain a `project-context.md` for agents describing MRX's claims boundaries, §4 disallowed phrases, audience, buyer disclosure, and canonical CTAs.

**Expected impact**
- Medium to High. Speeds content/engineering while reducing inconsistent implementation.

**Effort**
- Medium.

**SEO impact**
- High if used to scale compliant long-tail content.

**AI Search impact**
- High if agents maintain machine-readable exports and structured answer maps.

**Competitive advantage**
- Agent-assisted content operations with compliance gates can out-produce manual competitors safely.

---

## 8. Production Monorepos with Turborepo

**What was learned**
- Course areas include monorepos vs polyrepos, Turborepo basics, shared UI packages, shared configs, Vitest, test caching, remote caching, Git-based filtering, generators, Changesets versioning, GitHub Actions, code governance, and multi-app deployment.

**Why it matters to MRX**
- MRX may evolve from one Astro site into multiple apps: public site, internal admin, AI tools, valuation API, content docs, component registry, and workflow services.

**How MRX should implement it**
- Stay simple now, but design repo boundaries for future packages:
  - `apps/web` public Astro/Next site.
  - `apps/admin` internal review/admin interface.
  - `packages/ui` MRX design system.
  - `packages/content` content schemas and generators.
  - `packages/seo` metadata/JSON-LD factories.
  - `packages/compliance` phrase checks and signoff schemas.
  - `packages/ai` prompts, schemas, evals.
- Add task caching for build/test/compliance checks.
- Use generators for new pages/components to ensure schema, disclaimer, and SEO defaults.

**Expected impact**
- Medium now, High as platform complexity grows.

**Effort**
- Medium to High if migrating structure; Low if only adding conventions and generators.

**SEO impact**
- Medium. Shared factories prevent metadata/schema drift.

**AI Search impact**
- Medium to High. Shared content and AI packages keep llms exports synchronized.

**Competitive advantage**
- Faster multi-surface delivery: public SEO, admin review, AI tools, and docs without duplicated logic.

---

## 9. Microfrontends on Vercel

**What was learned**
- Microfrontend lessons cover when MFEs make sense, architecture patterns, monorepo setup, path routing, remote components, shared packages, deployment workflows, feature-flag routing, incremental migration, security/firewalls, local development, navigation performance, observability, and testing.

**Why it matters to MRX**
- MRX probably does not need microfrontends immediately. The useful pattern is **incremental migration and isolation**: add new Next/Vercel apps or tools without rewriting the Astro site.

**How MRX should implement it**
- Use path-based app boundaries only when justified:
  - `/` public static Astro marketing site.
  - `/tools/*` interactive calculators or document upload app.
  - `/admin/*` internal authenticated app.
  - `/api/*` workflow/AI services.
- Feature-flag experimental pages or tools before full rollout.
- Keep shared packages for UI, compliance, analytics, and content.
- Use speculation/prefetch strategies only where they improve navigation without hurting CWV.

**Expected impact**
- Medium if MRX adds tools/admin apps; low if it remains a static site.

**Effort**
- High for true MFEs; Medium for path-based app composition.

**SEO impact**
- Medium. Helps preserve stable public URLs during migrations.

**AI Search impact**
- Medium. Lets MRX add machine-readable services without destabilizing static pages.

**Competitive advantage**
- Incremental architecture lets MRX move faster than sites trapped in one CMS/app stack.

---

## 10. shadcn/ui, Radix, Tailwind, and Component Registries

**What was learned**
- Course lessons emphasize primitives, variants, compound components, controllable state, Tailwind override hierarchy, component registries, publishing components, maintaining/updating components, and custom components.
- The key design philosophy is source-owned UI components rather than opaque dependencies.

**Why it matters to MRX**
- Trust and clarity are critical in mineral-rights marketing. MRX needs consistent forms, cards, FAQ accordions, calculators, comparison tables, disclaimers, alerts, and CTA components.

**How MRX should implement it**
- Build/source-own an MRX component library even in Astro:
  - `ValuationFactorCard`
  - `CountyGuideCard`
  - `MethodologyStep`
  - `ComplianceDisclaimer`
  - `LeadCaptureForm`
  - `FAQAccordion`
  - `DocumentChecklist`
  - `OfferComparisonTable` with compliant language.
- Add registry-style docs/examples for components so agents and developers can reuse them correctly.
- Keep accessibility from Radix patterns for interactive components.
- Use variant utilities for CTA hierarchy and compliance alerts.

**Expected impact**
- Medium. Higher consistency and faster landing-page production.

**Effort**
- Medium.

**SEO impact**
- Medium. Better content modules and accessible FAQ components improve crawlable UX.

**AI Search impact**
- Medium. Consistent semantic components make structured extraction easier.

**Competitive advantage**
- MRX can present complex valuation concepts with repeatable, polished, trustworthy UI modules.

---

## 11. v0 Foundations

**What was learned**
- v0 lessons focus on prompt specificity, iterating with screenshots/versions, GitHub integration, Supabase, Resend, publishing/custom domains, and rapid UI generation.
- The vibecoding guide emphasizes being specific, showing examples/screenshots, and iterating deliberately.

**Why it matters to MRX**
- v0 is useful for quickly prototyping landing pages, calculators, comparison tables, lead forms, and admin screens, but outputs must be refactored into MRX's component/compliance system.

**How MRX should implement it**
- Use v0 for prototypes only:
  - County guide layouts.
  - Mineral valuation factor visualizations.
  - Free guide landing-page variants.
  - Booking funnel variants.
  - Internal lead review dashboard.
- Feed v0 specific prompts with MRX design tokens, compliance restrictions, CTA rules, and content examples.
- Never publish v0-generated claims without compliance review.
- Convert accepted prototypes into source-owned Astro/React components with tests.

**Expected impact**
- Medium. Faster ideation and visual exploration.

**Effort**
- Low to Medium.

**SEO impact**
- Medium if prototypes become tested landing pages.

**AI Search impact**
- Low direct, Medium indirect through better content presentation.

**Competitive advantage**
- Faster experimentation without waiting for full design cycles.

---

## 12. Subscription Store: Auth, Stripe, Supabase, Access Control

**What was learned**
- Course themes include Supabase client utilities, sign-up/sign-in, Stripe SDK setup, checkout flow, pricing pages, subscription actions, protected routes/APIs, server/client subscription checks, management pages, loading/error states, and production deployment.

**Why it matters to MRX**
- MRX's current public offer is free review/guide, not subscriptions. However, the patterns are relevant for gated owner portals, premium reports, partner access, broker dashboards, or document-review workflows.

**How MRX should implement it**
- Do not add monetized subscriptions unless product strategy requires it.
- Reuse access-control patterns for:
  - Private document upload/status portal.
  - Internal underwriter dashboard.
  - Partner/referral portal.
  - Download-gated lead magnets if needed.
- Keep protected APIs server-validated; never rely on client-only checks.
- Use clear loading/error states for trust-critical workflows.

**Expected impact**
- Medium if MRX adds portals; Low for current static site.

**Effort**
- Medium to High.

**SEO impact**
- Low direct. Gated pages are not SEO pages.

**AI Search impact**
- Low direct, except structured public descriptions of gated workflows.

**Competitive advantage**
- A secure owner portal could differentiate MRX as more transparent and process-driven.

---

## 13. Python on Vercel and FastAPI

**What was learned**
- Python course material covers Next.js and FastAPI starters, Vercel CLI/dev, wiring Next.js to FastAPI, and deploying to production.

**Why it matters to MRX**
- Mineral valuation, document parsing, OCR, geospatial/county data, decline curves, and DCF calculations may fit Python better than TypeScript.

**How MRX should implement it**
- Keep public content static, but isolate computational services:
  - `/api/valuation/explain` for internal DCF assumption explanation.
  - `/api/documents/extract` for owner-uploaded royalty statements/leases.
  - `/api/county-data/refresh` for content enrichment jobs.
- Use FastAPI for Python-heavy logic and call it from Next/Astro server endpoints or workflows.
- Add strict privacy, retention, and human-review controls before processing sensitive owner documents.

**Expected impact**
- Medium to High for product capabilities.

**Effort**
- High if document/valuation services are productionized.

**SEO impact**
- Medium indirect: Python-generated data can power county pages and calculators.

**AI Search impact**
- Medium to High if outputs feed structured public explainers.

**Competitive advantage**
- Data-backed DCF and county intelligence are harder to copy than generic mineral-rights blog posts.

---

## 14. Nuxt and Svelte on Vercel: Cross-Framework Deployment, ISR, Runtime Selection, Observability

**What was learned**
- Nuxt lessons cover pages/routing, data fetching, dynamic routes, search/filtering, auth, route protection, server routes, rendering modes, optimization, debugging, and deployment.
- Svelte lessons cover environment variables, preview deployments, runtime selection, streaming chat, tools/agents, structured output, durable tasks, ISR, performance, and observability.
- The cross-framework lesson is that Vercel patterns are framework-agnostic: choose rendering mode intentionally, configure envs, observe runtime behavior, and optimize route by route.

**Why it matters to MRX**
- MRX can stay Astro but adopt the same discipline: static where possible, serverless only where necessary, edge/runtime chosen based on data sensitivity and latency, and observability everywhere.

**How MRX should implement it**
- Map each route to a rendering/data policy:
  - Static: homepage, FAQ, methodology, sell pages, blog, county pages.
  - Serverless/workflow: forms, CRM callbacks, AI summaries, document upload.
  - Edge only if needed: lightweight geo/personalization or redirects.
- Use preview deployments/environments for every branch.
- Add structured logs for forms and APIs: request ID, route, validation result, downstream status, latency.
- Use ISR-like regeneration concepts for county/topic pages if data changes periodically; in Astro, implement scheduled rebuilds or content refresh jobs.

**Expected impact**
- Medium to High.

**Effort**
- Medium.

**SEO impact**
- High for static route discipline and freshness.

**AI Search impact**
- High when static and markdown exports stay regenerated with content updates.

**Competitive advantage**
- MRX can combine static trust pages with dynamic tools without slowing or destabilizing SEO pages.

---

## 15. Slack Agents and Operational AI Assistants

**What was learned**
- Slack Agents lessons include app manifests/scopes, slash commands, shortcuts/modals, app home, assistant thread context, AI Gateway token budgeting, system prompts, tools/functions, status communication, error handling/resilience, structured logs, boot checks/health, deploy to Vercel, and operations runbooks.

**Why it matters to MRX**
- Internal speed matters: lead alerts, content review, compliance review, broken-form alerts, AI summary review, and underwriter handoff can happen in Slack or similar operations channels.

**How MRX should implement it**
- Add internal assistant commands:
  - `/mrx-lead <id>`: summarize lead and next action.
  - `/mrx-page-audit <url>`: run SEO/compliance/schema check.
  - `/mrx-county-brief <county>`: retrieve approved content and data gaps.
  - `/mrx-ai-costs`: report AI usage/cost anomalies.
- Enforce least-privilege scopes and structured logs.
- Use boot checks for missing env vars/secrets.
- Show continuous status updates for long-running reviews.

**Expected impact**
- Medium. Improves operations and response speed.

**Effort**
- Medium.

**SEO impact**
- Medium indirect through faster audits and fixes.

**AI Search impact**
- Medium indirect through content QA and export monitoring.

**Competitive advantage**
- Faster response to high-value owner inquiries and faster correction of SEO/content issues.

---

## 16. Visual Workflow Builder on Vercel

**What was learned**
- Course areas include hello workflow, first plugin, Resend plugin, webhook workflow, plugin building, and error handling.
- The pattern is composable, observable workflow steps with plugins for external services.

**Why it matters to MRX**
- MRX has repeatable operational flows involving forms, email, CRM, calendar, document requests, and human review.

**How MRX should implement it**
- Define workflow plugins for:
  - CRM create/update.
  - Resend/email send.
  - Calendar booking check.
  - Slack/internal alert.
  - Compliance review queue.
  - Document extraction job.
- Use webhooks for CRM/calendar callbacks.
- Surface workflow errors to admins with retry options.

**Expected impact**
- Medium to High for operational reliability.

**Effort**
- Medium.

**SEO impact**
- Low direct.

**AI Search impact**
- Low direct.

**Competitive advantage**
- More reliable lead nurture and transparent owner communication.

---

## 17. Filesystem Agents

**What was learned**
- Filesystem Agents lessons highlight why file systems work well for agents, project setup, files/instructions, bash tools, sandbox wiring, agent skeletons, tests, and extension.

**Why it matters to MRX**
- MRX's canonical knowledge is file-based: MDX pages, structured data factories, compliance files, tests, and generated docs. Agents can operate safely if instructions and file boundaries are explicit.

**How MRX should implement it**
- Add agent-readable repo instructions:
  - `AGENTS.md` or `knowledge/agent-instructions.md` describing content rules, compliance constraints, testing commands, and safe edit zones.
  - Content templates for blog posts, county pages, FAQs, and methodology updates.
  - Machine-readable compliance lexicon and signoff requirements.
- Give agents file-scoped tasks and require build/test verification.
- Generate llms exports from filesystem content.

**Expected impact**
- Medium.

**Effort**
- Low to Medium.

**SEO impact**
- High if used to scale long-tail content safely.

**AI Search impact**
- High if agents maintain structured AI-facing files.

**Competitive advantage**
- MRX can turn its repo into an operational knowledge engine, not just a website.

---

## 18. Open Graph Image/API Patterns

**What was learned**
- The archive includes an API/OG item. Combined with Next/Vercel dynamic metadata lessons, this points to generated social cards and consistent preview metadata.

**Why it matters to MRX**
- Mineral-rights content often circulates through email, social, private messages, and AI summaries. Professional OG cards increase credibility and click-through.

**How MRX should implement it**
- Generate OG images for:
  - Core pages.
  - Blog posts.
  - County guides.
  - Methodology explainers.
  - Free guide landing page.
- Include county/topic/title, MRX logo, concise value proposition, and compliance-safe wording.
- Validate OG/Twitter metadata in CI.

**Expected impact**
- Medium.

**Effort**
- Low to Medium.

**SEO impact**
- Low direct, Medium indirect through CTR and sharing.

**AI Search impact**
- Low direct.

**Competitive advantage**
- Better perceived authority and shareability in a niche where many competitors look generic.

---

## MRX implementation blueprint

### A. AI-search surface map

| URL | Format | Purpose | Source of truth |
|---|---|---|---|
| `/llms.txt` | `text/plain` markdown index | AI discovery menu | Generated from site config/content collections |
| `/llms-full.txt` | `text/plain` full markdown | One-request AI context | Generated from approved pages/FAQ/methodology |
| `/faq.md` | `text/markdown` | Extractable FAQ | FAQ MDX collection |
| `/methodology.md` | `text/markdown` | DCF methodology citation source | Methodology page MDX |
| `/sell-mineral-rights.md` | `text/markdown` | High-intent topic answer | Sell page MDX |
| `/api/answers/summary.json` | JSON | Short structured MRX topic map | Content index generator |
| `/api/answers/chunks.json` | JSON/NDJSON | Semantic retrieval chunks | Content chunker |
| `/sitemap.xml` + `/sitemap.md` | XML/markdown | Search + agent navigation | Route manifest |

### B. Suggested `llms.txt` sections

```text
# Mineral Rights Xchange

> Transparent mineral-rights underwriter review for Texas mineral owners.

MRX helps mineral owners understand the selling process, DCF methodology, valuation factors, and next steps. Content is educational and includes compliance disclaimers and MRX buyer disclosure.

## Start Here
- [How It Works](/how-it-works): Step-by-step MRX review process
- [FAQ](/faq): Answers to common mineral-rights questions
- [Methodology](/methodology): Published DCF methodology and assumptions
- [Book a Review](/book): Schedule a review
- [Free Guide](/free-guide): Download the educational guide

## Machine-Readable Resources
- [Full AI Context](/llms-full.txt): Complete approved MRX knowledge pack
- [FAQ Markdown](/faq.md): FAQ in markdown
- [Methodology Markdown](/methodology.md): DCF methodology in markdown
- [Answer Summary JSON](/api/answers/summary.json): Structured topic and CTA map

## Compliance Notes
- [Privacy Policy](/privacy-policy): Data and privacy terms
- [Disclaimers](/methodology#disclaimer): Educational-use and buyer-disclosure notes
```

### C. CI gates MRX should add or maintain

- `pnpm check-compliance` before build.
- Verify all public pages have canonical metadata and OG data.
- Validate JSON-LD syntax and expected schema types.
- Check `/llms.txt`, `/llms-full.txt`, markdown mirrors, sitemap, and RSS if present.
- Run Playwright smoke tests for core pages and forms.
- Run link checker for internal links.
- Fail PRs when AI-facing exports omit disclaimer/buyer-disclosure references.

### D. Content strategy unlocked by Academy patterns

1. **County intelligence pages:** static county guides with valuation factors, common questions, and booking CTA.
2. **Question-answer clusters:** concise answers designed for snippets and AI responses, each with FAQ schema and markdown export.
3. **Methodology explainer series:** DCF terms explained in plain English with diagrams/cards.
4. **Owner journey flows:** sell vs hold educational sequences, document checklist, and review process timeline.
5. **Compliance-safe comparison content:** explain tradeoffs without prohibited guarantees or pressure.

## Major risks and mitigations

| Risk | Mitigation |
|---|---|
| AI generates non-compliant claims | Use retrieval-constrained prompts, structured outputs, compliance flagging, human review, and fallback static answers. |
| Machine-readable exports drift from pages | Generate exports from same content collections and test in CI. |
| Added runtime AI slows public pages | Keep SEO pages static; use AI in serverless/workflows or internal tooling. |
| Tooling complexity outpaces site needs | Prioritize P0 static exports and metadata before monorepo/microfrontend work. |
| Sensitive owner data exposure | Separate public/static content from private workflows; enforce auth, retention, and logging policies. |

## Recommended next implementation sequence

1. **Ship AEO basics:** `/llms.txt`, `/llms-full.txt`, `/faq.md`, `/methodology.md`, `/api/answers/summary.json`.
2. **Add tests:** content-type, status, links, compliance references, JSON validity.
3. **Audit metadata/schema:** ensure every core page has canonical, OG, JSON-LD, and FAQ/article schema where appropriate.
4. **Create content chunker:** generate answer chunks for AI search and future on-site semantic search.
5. **Add workflow reliability:** idempotent form handling, CRM/email retry logs, admin alerts.
6. **Pilot AI internally:** lead summaries and content QA with structured outputs and human approval.
7. **Scale content:** county/topic pages generated from approved templates with compliance gates.

## Bottom line

Vercel Academy's most valuable MRX lesson is not simply "deploy to Vercel." It is to build a website as a **typed, observable, machine-readable, AI-ready knowledge and workflow system**. For MRX, the fastest competitive edge is to expose authoritative mineral-rights education in formats that humans, search crawlers, and AI agents can all consume; then protect that system with compliance gates, tests, observability, and durable lead workflows.
