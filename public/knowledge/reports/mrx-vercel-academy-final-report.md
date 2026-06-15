# MRX Vercel Academy Intelligence Extraction — Final Project Report

**Project:** MRX Vercel Academy Intelligence Extraction & Implementation Project  
**Prepared for:** MineralRightsXchange (MRX)  
**Primary goal:** increase MRX visibility, authority, discoverability, citation frequency, and ranking in Google Search and AI-generated answers.  
**Status:** knowledge extracted and implementation reports created locally inside the MRX Astro/Vercel project. Vercel/GitHub upload is blocked by missing/invalid auth; see “Deployment/upload status.”

## 1. Executive summary

Vercel Academy’s most important lesson for MRX is that modern discoverability is no longer just HTML SEO. The winning platform must publish for **human visitors, search crawlers, and AI agents** at the same time.

The strongest MRX opportunities are:

1. **Agent-readable authority surfaces** — `/llms.txt`, `/llms-full.txt`, per-page Markdown, JSON answer indexes, source/citation blocks, schema, and content registries.
2. **Programmatic SEO with real data depth** — county, operator, basin, formation, well, permit, production, ownership, and valuation pages backed by structured entities and public sources.
3. **Mineral Rights Knowledge Graph** — a relationship map across owners, counties, parcels, operators, wells, leases, permits, production, acreage, basins, formations, valuations, and transactions.
4. **AI-assisted owner intake and content QA** — use AI SDK-style structured outputs, streaming UX, tools, and RAG, but only behind compliance, source, and human-review gates.
5. **Workflow-backed lead/document operations** — durable lead follow-up, royalty-statement/document intake, GHL handoff, review reminders, and conversion tracking.
6. **Competitive AEO leapfrog** — competitors have SEO assets, but most are not fully optimized for LLM citation. Buckhead Energy appears to be the most AEO-aware programmatic threat and should be treated as the benchmark to beat.

## 2. What was extracted from Vercel Academy

Downloaded/extracted into the MRX project:

- Archive path: `knowledge/vercel-academy/raw/`
- Manifest: `knowledge/vercel-academy/manifest.json`
- Detected raw files: **1,166**
- Detected canonical lessons: **299**
- Detected course overview pages: **18**
- Major detected courses:
  - Launch a Subscription Store with Vercel and Stripe
  - Workflow Foundations
  - Creating an AI Summary App with Next.js
  - Python on Vercel
  - Builders Guide to the AI SDK
  - Build Visual Workflow Plugins on Vercel
  - Vercel Sandbox
  - Agent-Friendly APIs
  - Svelte on Vercel
  - Nuxt on Vercel
  - Production Monorepos with Turborepo
  - Microfrontends on Vercel
  - Next.js Foundations
  - Build Your Own AI Coding Agent Harness
  - Slack Agents on Vercel with the AI SDK
  - Building Filesystem Agents
  - v0 Foundations
  - React UI with shadcn/ui + Radix + Tailwind

Important caveat: the Academy exposes excellent Markdown/LLM exports. The local crawler also captured HTML-derived duplicates and malformed duplicate filenames. The canonical manifest still confirms 299 lesson pages and 18 course pages. I did not find stable direct downloadable video files in the extracted Markdown; transcript/video signals were mostly references inside lesson text and filesystem-agent transcript examples. The practical knowledge is captured through the Academy text/Markdown exports.

## 3. Created MRX knowledge repository deliverables

Files created:

1. `knowledge/vercel-academy/manifest.json`  
   Retrieval manifest and coverage counts.

2. `knowledge/vercel-academy/mrx-vercel-academy-implementation-intelligence.md`  
   Complete MRX-specific Vercel Academy synthesis. Covers what was learned, why it matters, how MRX should implement it, expected impact, effort, SEO impact, AI-search impact, and competitive advantage by major Academy area.

3. `knowledge/competitive-analysis/mrx-competitor-gap-analysis.md`  
   Competitor SEO/AEO battlecards and gap analysis for EnergyNet, US Mineral Exchange, Enverus, TexasFile, MineralWare/MineralTracker, Buckhead Energy, and related discovered competitors.

4. `knowledge/technical-architecture/mrx-seo-aeo-architecture-plan.md`  
   Technical execution architecture with knowledge repository design, Mermaid diagrams, database/entity requirements, programmatic SEO page types, AI search strategy, Vercel/Next.js/AI SDK/RAG/vector recommendations, risks, and roadmap.

## 4. Complete knowledge report — what MRX should take from Vercel Academy

### Agent-Friendly APIs

**What to do:** publish MRX content in agent-friendly formats: `/llms.txt`, `/llms-full.txt`, page-level `.md`, JSON answer indexes, source lists, and HATEOAS-style links between related entities.

**Why:** AI engines need concise, structured, stable content to cite. HTML pages alone are harder to parse and less citation-ready.

**Expected outcome:** MRX becomes easier for ChatGPT, Claude, Gemini, Perplexity, Grok, and AI Overviews to quote as a source.

**SEO impact:** stronger crawl clarity, better internal linking, cleaner entity definitions.

**AI Search impact:** high. This directly improves machine readability and citation probability.

**Competitive advantage:** most mineral-rights competitors are still conventional web pages; MRX can become the agent-readable source of truth.

### Next.js Foundations / rendering / caching / metadata

**What to do:** adopt route-level rendering rules, canonical metadata factories, dynamic OpenGraph images, JSON-LD templates, sitemap segmentation, cache tags, and performance budgets.

**Why:** county/operator/programmatic pages must be fast, crawlable, canonical, and schema-valid at scale.

**Expected outcome:** better indexation, lower regression risk, stronger Core Web Vitals, cleaner rich-result eligibility.

**SEO impact:** high.

**AI Search impact:** medium-high; AI crawlers also benefit from fast, simple, structured pages.

**Competitive advantage:** pages can scale without becoming thin, slow, or inconsistent.

### AI SDK / AI Summary App / structured output

**What to do:** build MRX AI features with structured outputs for owner intake, royalty-statement summaries, document checklists, content extraction, FAQ generation, and compliance QA.

**Why:** mineral owners need complex valuation concepts translated into clear language, but hallucinated legal/tax/valuation claims would be dangerous.

**Expected outcome:** helpful owner-facing AI, better lead qualification, safer content operations.

**SEO impact:** medium; AI can accelerate content and enrich answer blocks.

**AI Search impact:** high when AI outputs are converted into reviewed, source-cited pages.

**Competitive advantage:** MRX can turn website interactions into an underwriter-style educational experience, not just forms.

### Workflow Foundations

**What to do:** implement durable workflows for lead intake, document review, SearchAtlas content generation, schema checks, GHL handoff, review reminders, and AEO monitoring.

**Why:** SEO/AEO dominance requires repeated operations, not one-off pages.

**Expected outcome:** fewer dropped leads, cleaner follow-up, more reliable content QA.

**SEO impact:** medium.

**AI Search impact:** medium-high through consistent content refresh and monitoring.

**Competitive advantage:** operational reliability becomes a ranking and conversion advantage.

### Vercel Sandbox / AI Agent Harness / filesystem agents

**What to do:** use sandboxed agents to review code, content, schema, links, disclaimers, and page quality before deploy.

**Why:** scaled content and AI-generated code can introduce broken forms, bad schema, unsubstantiated claims, or compliance risk.

**Expected outcome:** safer publishing and faster iteration.

**SEO impact:** high by preventing bad pages from shipping.

**AI Search impact:** high by enforcing citation/source/review structure.

**Competitive advantage:** MRX can scale faster without the quality collapse common in programmatic SEO.

### Production monorepos / microfrontends / UI systems

**What to do:** modularize templates, schema, content models, AI widget, lead forms, and entity page components.

**Why:** MRX will need many page types and experiments; reusable components prevent drift.

**Expected outcome:** faster page production, consistent branding, easier testing.

**SEO impact:** medium-high.

**AI Search impact:** medium.

**Competitive advantage:** faster rollout of county/operator/basin pages and conversion flows.

## 5. SEO report — traditional search recommendations

### Immediate SEO actions

1. Build and publish `/llms.txt`, `/llms-full.txt`, Markdown exports, and content registry JSON.
2. Publish/upgrade core BOFU pages:
   - Sell mineral rights
   - Mineral rights valuation Texas
   - Documents needed to sell mineral rights
   - Inherited mineral rights
   - Royalty check valuation
   - Offer-in-hand comparison
3. Build one complete county page and one complete operator page as the template standard.
4. Add robust JSON-LD:
   - Organization
   - ProfessionalService
   - Service
   - Article
   - FAQPage
   - BreadcrumbList
   - Dataset where appropriate
5. Add schema/content CI checks before deploy.
6. Add internal linking rules from every long-tail page to parent hubs and `/book/`.
7. Verify sitemap, robots, canonical URLs, metadata, and index/noindex policy.

### Why this matters

Traditional search still rewards fast, useful, authoritative, well-linked pages. The MRX advantage is to create content competitors cannot easily match: local data + transparent DCF methodology + owner-friendly explanations + AI-readable structure.

## 6. AEO/GEO report — AI search recommendations

### AI answer engine strategy

1. **Answer first.** Every page should open with a concise, directly quotable answer.
2. **Show sources.** Every data claim should cite public sources or MRX methodology.
3. **Structure consistently.** Use TL;DR, definitions, step-by-step guidance, FAQ, source list, reviewed date, author/reviewer.
4. **Expose machine formats.** Markdown and JSON should mirror canonical HTML content.
5. **Build entity relationships.** Link counties, operators, wells, formations, basins, valuations, and documents.
6. **Monitor citations.** Run recurring prompts in ChatGPT, Claude, Gemini, Perplexity, Grok, and Google AI Overviews for target questions and record whether MRX is cited.

### Why this increases MRX citations

LLMs cite sources that are clear, authoritative, stable, and easy to parse. If MRX publishes “answer-ready” content while competitors publish conventional marketing pages, MRX becomes the easier source for AI systems to retrieve and quote.

## 7. Competitive analysis summary

### Strongest competitor patterns

- **US Mineral Exchange:** seller education, marketplace positioning, reviews, free guide, founder authority.
- **Enverus:** data authority, marketplace trust, EnergyLink-backed scale, enterprise credibility.
- **TexasFile:** Texas records/data utility, county clerk/mineral ownership coverage, glossary/FAQ/pricing.
- **MineralWare/MineralTracker:** mineral management SaaS, mapping, revenue/JIB, documents, forecasting.
- **EnergyNet:** auction marketplace and due-diligence positioning.
- **Buckhead Energy:** strongest observed programmatic SEO/AEO threat; county/state/basin/operator pages and at least one surfaced `llms.md` result.

### Where MRX can leapfrog

1. Texas-first data depth instead of broad shallow national templates.
2. Transparent underwriter/DCF methodology instead of generic “highest offer” claims.
3. AI-readable corpus and knowledge graph.
4. Owner intent segmentation: inherited rights, offer-in-hand, royalty-check owners, trustees/executors, out-of-state owners, 1031 sellers.
5. Compliance-safe AI assistant and lead handoff.

## 8. Programmatic SEO opportunities

### County pages

**Example:** `/reeves-county-texas-mineral-rights`  
**Data:** county profile, RRC district, clerk/appraisal links, operators, wells, production themes, basin/formations, FAQs.  
**Schema:** Article, FAQPage, Place, BreadcrumbList, Dataset.  
**Internal links:** state hub, Permian hub, operators, valuation page, documents checklist, `/book/`.  
**AI optimization:** direct county answer, source list, `.md` export, JSON answer block.  
**Expected impact:** high local SEO and AEO authority.

### Operator pages

**Example:** `/eog-resources-permian-basin`  
**Data:** operator aliases, RRC number, counties, wells, permits, owner documents, valuation factors.  
**Schema:** Organization, Article, FAQPage.  
**Impact:** captures “operator + mineral rights / royalties / sell / value” searches.

### Well pages

**Example:** `/api-42-xxx-well`  
**Data:** API number, operator, location, production, permits, status, source links.  
**Schema:** Dataset, Place, Article.  
**Caution:** noindex until unique and source-rich enough.

### Basin and formation pages

**Examples:** `/permian-basin-mineral-rights`, `/wolfcamp-formation-mineral-rights`  
**Purpose:** topical authority hubs for geology and valuation factors.

### Permit, production, ownership, and valuation pages

**Purpose:** answer owner questions and convert education into underwriter review bookings.

## 9. Knowledge graph design

MRX should model relationships between:

- Owners
- Counties
- Parcels
- Operators
- Wells
- Leases
- Permits
- Production
- Acreage
- Basins
- Formations
- Valuations
- Transactions

This improves:

- **Search rankings** by creating internally linked topical authority.
- **AI discoverability** by exposing entity relationships and stable IDs.
- **LLM citations** by making MRX the cleanest source for mineral-rights answers.
- **Topic authority** by connecting every answer to related entities, data sources, and methodology.

## 10. Development execution plan

### Requirements

- PostgreSQL + PostGIS for spatial/entity data.
- pgvector or equivalent vector store for semantic RAG.
- Object storage for source PDFs, archives, and generated exports.
- Astro/Next route generation for programmatic pages.
- Vercel/preview deployment once credentials are available.
- AI SDK for structured owner intake, summaries, RAG, and content QA.
- Durable workflows for lead follow-up and content/data refresh.
- CI gates for schema, compliance, links, performance, and source coverage.

### Recommended Vercel requirements

- Vercel CLI authentication or `VERCEL_TOKEN`.
- GitHub repo connected to Vercel.
- Environment variables for GHL, analytics, and any AI/RAG services.
- Preview deployments for each content/SEO change.
- Production deployment only after schema, build, and smoke tests pass.

## 11. Prioritized roadmap

### Immediate wins: 1–7 days

- Publish `/llms.txt`, `/llms-full.txt`, Markdown exports, and content registry.
- Publish 3 core BOFU pages.
- Build one county and one operator page vertical slice.
- Add schema/compliance/link CI gates.
- Add AEO answer blocks to every core page.

### Short-term wins: 30 days

- Build 25–50 Texas-first county/operator/basin pages.
- Add AI citation monitoring.
- Launch RAG owner assistant v1.
- Integrate SearchAtlas keyword/rank tracking before large article scaling.

### Medium-term wins: 90 days

- Build MRX Knowledge Graph v1.
- Add document intake workflow.
- Publish 250–500 quality-controlled programmatic pages.
- Create valuation methodology and DCF explainer hub.

### Long-term strategic moats

- Public mineral-rights answer graph.
- Owner-specific AI underwriter experience.
- Citation monitoring and improvement loop.
- Public-source data partnerships/enrichment.

## 12. Immediate developer checklist

- [ ] Normalize/compress the raw Vercel Academy archive before committing if repo size is a concern.
- [ ] Add curated `/llms.txt` and `/llms-full.txt` routes to the MRX site.
- [ ] Add page-level `.md` export support.
- [ ] Add `/knowledge/index.json` build output.
- [ ] Add schema registry and JSON-LD tests.
- [ ] Add county/operator/basin/valuation page templates.
- [ ] Add source/citation/reviewed-date fields to content frontmatter.
- [ ] Build Reeves County and EOG Resources vertical slices.
- [ ] Add AEO monitoring prompts and result log.
- [ ] Verify Vercel/GitHub auth, then upload/deploy.

## 13. Deployment/upload status

The knowledge repository has been created inside the MRX Vercel-ready website project:

```text
/Users/darylhill/.hermes/kanban/boards/mrx-live-astro-website/workspaces/t_723fa824/mrx-web/knowledge
```

Original upload blocker, now resolved by saving valid tokens:

- `GITHUB_TOKEN` previously returned `401 Bad credentials`; replacement token now authenticates.
- `VERCEL_TOKEN` was previously missing; replacement token now authenticates with Vercel CLI.

Credential variables used for deployment are stored in `/Users/darylhill/.hermes/.env`:

```bash
GITHUB_TOKEN=***
VERCEL_TOKEN=***
```

Deployment execution steps:

1. Normalize or package the raw archive to avoid a large Git commit.
2. Commit the knowledge repository.
3. Push to the MRX GitHub repo.
4. Import/deploy in Vercel.
5. Verify preview URL, knowledge paths, `/llms.txt`, schema, sitemap, and `/book/` conversion path.

## 14. Final recommendation

MRX should not compete only by publishing more “sell mineral rights” blog posts. The winning move is to become the **structured, cited, AI-readable mineral-rights authority**:

- Teach better than US Mineral Exchange.
- Localize and structure deeper than Buckhead.
- Explain owner data more clearly than Enverus/TexasFile.
- Convert more safely than generic buyer sites.
- Make every answer easy for both Google and LLMs to retrieve, trust, quote, and connect to an MRX underwriter review.
