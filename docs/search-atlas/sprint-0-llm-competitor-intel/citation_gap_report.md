# MRX Citation Gap Report — Sprint 0 LLM Tracking + Competitor Intelligence

Observed: 2026-07-20T05:06:36Z
Policy source: docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md section 3.5.

## Executive finding

Public LLM/answer-engine sampling was constrained by CAPTCHA/security challenges across Perplexity, ChatGPT public web, Google, Bing, Brave, and Duck.ai. I did not solve any challenge or log into any platform. The usable public evidence came from direct competitor/MRX web fetches and local MRX AEO files. That evidence shows a critical MRX citation-readiness issue: `https://mineralrightsxchange.com/`, `/llms.txt`, and `/llms-full.txt` returned Vercel Security Checkpoint (403) to this run, while Buckhead Energy served a public `llms.md` and schema-rich county/comparison pages with 200 responses.

## Citation gaps by priority

1. Critical — MRX public crawler access: MRX homepage and LLM files returned 403 Vercel Security Checkpoint. If this affects AI/search crawlers, MRX cannot reliably be cited even though local `public/llms.txt` exists.
2. High — Buckhead AEO surface: Buckhead has `llms.md` and programmatic pages with FAQPage/Dataset/Article/Breadcrumb schema. MRX needs equal or better llms + markdown + schema coverage.
3. High — BOFU buyer-comparison prompts: Buckhead targets “best company to sell mineral rights” with a 2026 comparison article. MRX should ship a compliant, neutral direct-underwriter comparison page.
4. High — documents/inherited prompt cluster: US Mineral Exchange has a deep required-documents article with rich schema. MRX should build a document checklist hub and connect it to inherited-rights/offer-review CTAs.
5. Medium — data authority: Enverus and TexasFile are strong citation candidates for data/records prompts. MRX should cite public regulators and explain how public data informs owner decisions.
6. Medium — management-intent: MineralTracker/MineralWare cover manage/monitor/estate language. MRX can intercept with manage-vs-sell decision trees.

## Recommended next owner handoffs

- mrx_webdev: investigate/remediate Vercel Security Checkpoint behavior for MRX public pages and LLM files; verify public `curl` and browser access for `/`, `/llms.txt`, `/llms-full.txt`, sitemap, and representative article pages.
- mrx_seo_content: draft BOFU comparison, document checklist, inherited-rights, and Texas county/operator vertical-slice content from the prompt cluster log.
- mrx_seo_audit: validate schema parity targets (FAQPage, Dataset, BreadcrumbList, Article, Organization) and crawler accessibility after webdev fix.
- mrx_searchatlas_seo: connect these prompt clusters to SearchAtlas/KRT keyword and not-ranking evidence once available.

## Human-only gates surfaced

- CAPTCHA/security challenges for Perplexity, ChatGPT public web, Google Search/AI Overview, Bing, Brave, DuckDuckGo/Duck.ai: do not solve; G-05 human-only proof-of-presence gate.
- Logged-in ChatGPT/Perplexity/Copilot/Gemini research: not attempted; G-05/G-03 human-only gate.
- Paid competitor-intel subscriptions/SearchAtlas paid actions: not used; human-only gate per lane policy.
- Production changes to MRX Vercel/security/robots/llms exposure: not performed; G-01/G-03 gate for web/dev owner approval.

## Verification evidence

- Read policy memo: `/Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md`.
- Read existing local AEO files: `public/llms.txt`; found local MRX citation guidance.
- Read existing competitor analysis: `knowledge/competitive-analysis/mrx-competitor-gap-analysis.md`.
- Fetched public competitor/MRX URLs with low-volume browser/curl-style checks; no login, CAPTCHA solve, paid subscription, or platform mutation performed.
- Browser attempts recorded for Perplexity, ChatGPT public web, Google, Bing, Brave Search, and Duck.ai; all were blocked by security/CAPTCHA before answer content could be captured.
