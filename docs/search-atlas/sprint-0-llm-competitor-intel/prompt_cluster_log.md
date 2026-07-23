# MRX Sprint 0 LLM Prompt Cluster Log

Observed: 2026-07-20T05:06:36Z

## Public LLM/answer-engine access attempts

- Perplexity: `best place to sell mineral rights` — blocked. Evidence: Cloudflare security verification / bot protection; no public answer accessible without human challenge. URL: https://www.perplexity.ai/search?q=best%20place%20to%20sell%20mineral%20rights
- ChatGPT public web: `best place to sell mineral rights` — blocked. Evidence: Cloudflare security challenge before any response; no logged-in or private retrieval attempted. URL: https://chatgpt.com/?q=best%20place%20to%20sell%20mineral%20rights
- Google AI Overview: `best place to sell mineral rights` — blocked. Evidence: Google sorry/challenge page; no SERP/AI Overview returned to browser session. URL: https://www.google.com/search?q=best+place+to+sell+mineral+rights
- Bing / Copilot-adjacent search: `best place to sell mineral rights` — blocked. Evidence: Bing presented Cloudflare/human verification challenge before results. URL: https://www.bing.com/search?q=best+place+to+sell+mineral+rights
- Duck.ai public chat fallback: `best place to sell mineral rights` — blocked. Evidence: Duck.ai loaded, then required image CAPTCHA (“select all squares containing a duck”) before response generation. URL: https://duck.ai/?q=best%20place%20to%20sell%20mineral%20rights

## Prompt clusters to track

### BOFU seller/buyer selection

Prompts:

- best place to sell mineral rights
- best company to sell mineral rights to
- who buys mineral rights directly
- mineral rights buyer comparison 2026
  Risk: Buckhead has a direct 2026 buyer-comparison page with Article + FAQPage schema; US Mineral Exchange owns marketplace wording.
  MRX action: Create/strengthen MRX direct-underwriter vs marketplace vs broker comparison answer page with FAQ/schema and llms-full excerpts.

### Offer review / fairness

Prompts:

- is my mineral rights offer fair
- should I accept a mineral rights offer letter
- mineral rights offer review
- how to compare mineral rights offers
  Risk: MRX has an offer-review URL locally, but live public fetch returned Vercel Security Checkpoint in this environment, reducing crawler citation readiness.
  MRX action: Ensure /offer-review/ is publicly crawlable and contains concise cited-answer blocks, valuation-factor schema, and no individualized guarantee language.

### Valuation / methodology

Prompts:

- how are mineral rights valued
- mineral rights valuation Texas
- what affects mineral rights value
- DCF mineral rights valuation explained
  Risk: Enverus owns data-authority language; USME and Buckhead have seller education.
  MRX action: Promote MRX methodology as owner-readable valuation framework; cite public regulators/data sources and include answer blocks.

### Inherited rights / documents

Prompts:

- inherited mineral rights what to do
- documents needed to sell mineral rights
- how to find inherited mineral rights
- probate mineral rights Texas
  Risk: US Mineral Exchange has a required-documents article with Article/WebPage/Breadcrumb/Organization schema; TexasFile owns records lookup utility.
  MRX action: Build MRX document checklist hub connecting deeds, probate, division orders, check stubs, county clerk/RRC records, and review booking CTA.

### Texas/county/operator long-tail

Prompts:

- Reeves County Texas mineral rights
- sell Permian Basin mineral rights
- EOG Resources mineral rights owner
- Texas county mineral ownership data
  Risk: Buckhead has Reeves County page with Organization, FAQPage, Dataset, BreadcrumbList schema and llms links; TexasFile owns records/data pages.
  MRX action: Ship Texas-first county/operator vertical slices with real public-source links and Dataset/FAQ/Breadcrumb schema.

### Auction vs direct buyer vs marketplace

Prompts:

- auction vs sell mineral rights direct
- EnergyNet alternative mineral rights
- mineral rights broker vs buyer
- marketplace vs direct mineral rights buyer
  Risk: EnergyNet/USME marketplace positioning and Buckhead comparison content can absorb comparison-intent prompts.
  MRX action: Draft neutral comparison pages; avoid naming prohibited competitors in customer-facing copy unless compliance approves.

### Manage vs sell / portfolio software

Prompts:

- manage or sell mineral rights
- mineral management software vs selling
- mineral tracker alternative
- family office mineral rights management
  Risk: MineralTracker and MineralWare own management SaaS terminology.
  MRX action: Create “manage, hold, lease, or sell” decision-tree content and route management-intent visitors to educational review.

## Human-only gates

- CAPTCHA/security challenges for Perplexity, ChatGPT public web, Google Search/AI Overview, Bing, Brave, DuckDuckGo/Duck.ai: do not solve; G-05 human-only proof-of-presence gate.
- Logged-in ChatGPT/Perplexity/Copilot/Gemini research: not attempted; G-05/G-03 human-only gate.
- Paid competitor-intel subscriptions/SearchAtlas paid actions: not used; human-only gate per lane policy.
- Production changes to MRX Vercel/security/robots/llms exposure: not performed; G-01/G-03 gate for web/dev owner approval.
