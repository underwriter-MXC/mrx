# Sprint 0 Search Atlas / GSC / OTTO Read-Only Alignment Audit

Generated: 2026-07-20T01:22:44

Scope: read-only SearchAtlas, GSC, OTTO, Content Genius, DKN, Brand Vault, KRT, Site Explorer, and LLM Visibility checks. No publish/deploy/spend/recrawl/OAuth/article-generation actions were executed.

## Source handles

- policy_memo: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md
- backlog_expected: /Users/darylhill/.hermes/kanban/boards/mrx-growth/workspaces/t_b7c4f65b/mrx-30-day-sprint-backlog.json
- raw_discovery: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/searchatlas-sprint0-discovery-raw.json
- raw_alignment: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/searchatlas-sprint0-alignment-raw.json
- raw_retry: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/searchatlas-sprint0-alignment-retry-raw.json
- site_explorer_id: 702293
- site_explorer_dashboard_url: https://dashboard.searchatlas.com/site-explorer/detail/702293?domain=mineralrightsxchange.com&country_code=us
- otto_project_uuid: e4bab8bb-717e-480c-8dea-1de1b8596eb7
- otto_site_audit_id: 138239
- brand_vault_uuid: cc79230e-b938-496e-bef1-1f23a0e7e1ce
- content_genius_project_id: 39003
- krt_project_id: 79292
- llm_visibility_project_id: b03cfba8-e79b-475b-a4a3-280cceb970ed

## Executive findings

- [blocked] Backlog baseline: Expected 30-day sprint backlog file is not present at the artifact path named by the parent card. Next: Restore or rehydrate the backlog artifact from Kanban run 55 before treating this as a strict item-by-item diff. Owner: mrx_coo / ai_agile_scrum_mrx.
- [high] Search Atlas Site Explorer: SearchAtlas sees only 11 organic keywords, zero monthly traffic, Domain Power 1, 25 backlinks, and 11 referring domains. Next: Prioritize rankable BOFU/MOFU clusters already in topical maps and KRT; build content/internal-link plan before any publish gate. Owner: mrx_searchatlas_keyword.
- [high] KRT: KRT project tracks 133 keywords; first 50 sampled show 7 ranked and 43 unranked keywords, with most Texas county BOFU terms not ranking. Next: Split tracked keywords into Texas county BOFU, valuation/offer BOFU, inherited/tax MOFU, and educational TOFU packages; route content gaps to Content pod. Owner: mrx_searchatlas_keyword.
- [medium] OTTO: OTTO is engaged, pixel is installed via Cloudflare Worker, SEO score is 93, and deployment preview shows zero pending deployable fixes, but project only reports 1 total page and content/authority/UX pillar scores remain critical. Next: Do not deploy/reprocess; audit why OTTO project scope is only one page and draft crawl/pixel/GSC alignment plan for human approval if settings need mutation. Owner: mrx_searchatlas_otto. Human gate: OTTO crawl settings/recrawl/autofix require Daryl approval
- [medium] OTTO site audit: Existing audit status/postprocessing is failed while still returning 8 issues including blocking_llm_crawlers, CSP missing, JS >300KB, image issues, and not_enough_internal_links. Next: Hand audit findings to crawl coverage/live verification lane; public verification should confirm whether robots/LLM crawler blocking is still live before any code changes. Owner: mrx_seo_audit. Human gate: Recrawl or settings mutation require Daryl approval
- [high] Content Genius / topical maps: 11 topical maps exist across valuation, offer review, Texas counties, title/lease/ownership, taxes/1031, inherited rights, and sell-mineral-rights themes; article inventory shows 297 Content Genius articles but project details report article_count 0 and DKN metrics null. Next: Reconcile Content Genius article inventory against DKN/topical maps and repo/live sitemap before generating any new article; prioritize NEEDS_REVIEW articles matching BOFU pages. Owner: mrx_searchatlas_content. Human gate: Article generation/regeneration/publishing require Daryl approval
- [high] DKN: DKN overview and node list return no DKN network/nodes for mineralrightsxchange.com despite Content Genius/topical maps/articles existing. Next: Create a draft DKN reconciliation plan only; do not create DKN or generate phase 2/articles without explicit approval. Owner: mrx_searchatlas_content. Human gate: DKN create/generate/article actions require Daryl approval
- [medium] Brand/entity inventory: Brand Vault is active/indexed with 297 articles, 2 sources, Professional & Credible voice, Midland TX business info, four social profiles, and 17 top pages; OTTO KG progress is only ~29.67 and OTTO KG has incomplete contact/address fields. Next: Use Brand Vault as authoritative entity source; draft KG normalization delta for OTTO/Brand Vault parity, no live edits. Owner: mrx_searchatlas_cx. Human gate: Brand Vault/KG edits require Daryl approval
- [medium] LLM Visibility: LLM Visibility project is user-tracked with 18 topics and 49 queries; current period overall visibility is 4.706, down 3.94 from prior, with 44 mentions and Google AI Mode strongest at 17 visibility score. Next: Feed low-visibility prompt/topic gaps into AEO answer-page backlog; avoid ad-hoc prompt submissions without approval. Owner: mrx_searchatlas_cx. Human gate: Submitting new LLM prompts/queries is a write action and needs approval
- [blocked] GSC via SearchAtlas: SearchAtlas GSC tools cannot read the connected property: sc-domain errors because country is not active; URL-prefix errors because connected Google account lacks GSC access. Next: Human must fix SearchAtlas-connected Google account/property access and/or country activation; agents must not mutate GSC settings. Owner: mrx_coo / Daryl. Human gate: GSC account/property/country settings are G-03/G-01 human-only

## SearchAtlas / keyword / rank state

- Site Explorer: domain_power=1, keywords_count=11, monthly_traffic=0, backlinks=25, referring_domains=11, last_updated=2026-05-08.
- KRT: project_id=79292, tracked_keywords=133, first_page_sample=50, ranked_in_sample=7, unranked_in_sample=43.
- Organic keyword sample:
  - what are oil royalties | pos 38 | vol 50 | url https://mineralrightsxchange.com/blog/oil-and-gas-royalties-what-owners-need-to-know/
  - capital gains tax on mineral rights sale | pos 41 | vol 70 | url https://mineralrightsxchange.com/blog/tax-on-sale-of-inherited-mineral-rights/
  - capital gains tax on mineral rights sale | pos 69 | vol 70 | url https://mineralrightsxchange.com/blog/tax-on-sale-of-inherited-mineral-rights/
  - capital gains tax on mineral rights sale | pos 75 | vol 70 | url https://mineralrightsxchange.com/blog/tax-on-sale-of-inherited-mineral-rights/
  - oil and gas royalty payments | pos 50 | vol 140 | url https://mineralrightsxchange.com/blog/oil-and-gas-royalties-what-owners-need-to-know/
  - oil gas royalty | pos 86 | vol 30 | url https://mineralrightsxchange.com/blog/oil-and-gas-royalties-what-owners-need-to-know/
  - tax rate on selling mineral rights | pos 93 | vol 50 | url https://mineralrightsxchange.com/blog/tax-on-sale-of-inherited-mineral-rights/
  - sell my oil and gas rights | pos 28 | vol 70 | url https://mineralrightsxchange.com/blog/selling-oil-and-gas-rights-step-by-step-guide/
  - how do oil and gas royalties work | pos 36 | vol 40 | url https://mineralrightsxchange.com/blog/oil-and-gas-royalties-what-owners-need-to-know/
  - american oil and gas royalty checks | pos 53 | vol 40 | url https://mineralrightsxchange.com/blog/oil-and-gas-royalties-what-owners-need-to-know/

## OTTO state

- OTTO UUID: e4bab8bb-717e-480c-8dea-1de1b8596eb7; status=engaged; pixel=Cloudflare Worker; pixel_installed=True; gsc_connected=True; total_pages=1; seo_score=93.0; found_issues=8; deployed_fixes=8; crawl_in_progress=True.
- Pillar scores: [{'pillar': 'Technical', 'score': 93.0, 'label': 'Good'}, {'pillar': 'Content', 'score': 13.0, 'label': 'Critical'}, {'pillar': 'Authority', 'score': 4.0, 'label': 'Critical'}, {'pillar': 'UX Signals', 'score': 0.0, 'label': 'Critical'}]
- Deployment preview: pending=0, prerequisites_met=True, rows=[{'issue_type': 'page_title', 'display_name': 'Page Title', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'meta_description', 'display_name': 'Meta Description', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'canonical_link', 'display_name': 'Canonical Link', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'h2_under_20_over_70', 'display_name': 'H2 Length', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'missing_headings', 'display_name': 'Heading Optimizations', 'total': 1, 'with_recommendation': 0, 'deployed': 0, 'pending': 0}, {'issue_type': 'images', 'display_name': 'Image Alt Texts', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'twitter_description', 'display_name': 'Twitter Description', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'twitter_site_property', 'display_name': 'Twitter Site', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}, {'issue_type': 'domain_level_schema', 'display_name': 'Domain-Level Schema', 'total': 1, 'with_recommendation': 1, 'deployed': 1, 'pending': 0}]
- Existing site audit: audit_id=138239, status=failed, postprocessing=failed, issues={'images_missing_alt': 1, 'image_more_than_100_kb': 1, 'image_not_in_modern_format': 1, 'js_more_than_300_kb': 1, 'element_has_style_attribute': 1, 'meta_keywords': 1, 'not_enough_internal_links': 1, 'content_security_policy_missing': 1, 'blocking_llm_crawlers': 1}

## Content Genius / DKN / topical maps

- Content Genius project: id=39003, domain=mineralrightsxchange.com, article_count_field=0, DKN metrics=None
- Article inventory: total_count=297; first-page status counts={'COMPLETED': 52, 'NEEDS_REVIEW': 48}
- DKN overview: {'hostname': '', 'project_uuid': '', 'dkn_id': None, 'total_nodes': 0, 'generated_count': 0, 'pending_count': 0, 'failed_count': 0, 'completion_pct': 0.0, 'domain_content_score': None, 'items': [], 'found': False}
- Topical maps:
  - 261165 | mineral rights valuation | clusters=11 | domain=https://mineralrightsxchange.com/mineral-rights-value/
  - 261164 | mineral rights offer review | clusters=0 | domain=https://mineralrightsxchange.com/offer-review/
  - 261163 | Texas mineral rights counties | clusters=0 | domain=https://mineralrightsxchange.com/mineral-rights/texas/
  - 261162 | mineral rights title lease ownership | clusters=11 | domain=https://mineralrightsxchange.com/learning-center/title-lease-ownership/
  - 261161 | mineral rights taxes and 1031 exchanges | clusters=0 | domain=https://mineralrightsxchange.com/learning-center/mineral-rights-taxes/
  - 261159 | inherited mineral rights | clusters=0 | domain=https://mineralrightsxchange.com/inherited-mineral-rights/
  - 256286 | how to sell my mineral rights | clusters=2 | domain=mineralrightsxchange.com
  - 255581 | mineral rights | clusters=7 | domain=https://mineralrightsxchange.com/
  - 254654 | sell mineral rights in texas | clusters=11 | domain=mineralrightsxchange.com
  - 254639 | Sell My Mineral Rights | clusters=6 | domain=www.mineralrightsxchange.com
  - 252927 | sell Texas mineral rights | clusters=6 | domain=https://mineralrightsxchange.com

## Entity / Brand Vault / LLM visibility

- Brand Vault: uuid=cc79230e-b938-496e-bef1-1f23a0e7e1ce, indexed=True, articles=297, sources=2, voice=Professional & Credible, top_pages=17.
- OTTO KG: id=651830, business=Mineral Rights Xchange, phone_present=False, email_present=False, address={'street': '', 'city': '', 'state': '', 'postal_code': '79701', 'country': '', 'lat': None, 'lng': None}.
- LLM Visibility: project=b03cfba8-e79b-475b-a4a3-280cceb970ed, topics=18, queries=49, visibility=4.706, visibility_change=-3.9400000000000004, mentions=44, sentiment=59.4.

## GSC status

- SearchAtlas GSC reads are blocked by SearchAtlas-connected Google account/property permissions and country activation. This is a human-only GSC/OAuth/settings gate; no GSC mutation was attempted.
- sc-domain attempt: {'success': False, 'tool_name': 'gsc_get_pages', 'error_type': 'client', 'error_code': None, 'status_code': 403, 'service_name': 'GSC', 'message': 'GSC client error: Google Search Console is not enabled for the selected country in this project (sc-domain:mineralrightsxchange.com). To view data on the homepage, this country must be active in your GSC settings.', 'is_transient': False, 'quota_name': None, 'details': {'detail': 'Google Search Console is not enabled for the selected country in this project (sc-domain:mineralrightsxchange.com). To view data on the homepage, this country must be active in your GSC settings.'}}
- URL-prefix attempt: {'success': False, 'tool_name': 'gsc_get_pages', 'error_type': 'client', 'error_code': None, 'status_code': 403, 'service_name': 'GSC', 'message': 'GSC client error: The Google account connected to this project does not have access to the selected Google Search Console property (https://mineralrightsxchange.com/). To view data on the homepage, you need permission to this property in Google Search Console.', 'is_transient': False, 'quota_name': None, 'details': {'detail': 'The Google account connected to this project does not have access to the selected Google Search Console property (https://mineralrightsxchange.com/). To view data on the homepage, you need permission to this property in Google Search Console.'}}

## Human-only gates surfaced

- GSC sitemap submit/remove, property/country settings, OAuth/account access changes
- OTTO auto-fix deployment, all-fixes deployment, schema deployment, recrawl/reprocess, crawl settings changes, instant indexing activation
- SearchAtlas OAuth scope changes, paid tier enablement, credit spending, quota-consuming AI generation
- Content Genius article generation/regeneration or DKN create/generate/article actions
- Brand Vault / OTTO Knowledge Graph edits
- Live production publish/merge/deploy, GBP/social/outreach sends, backlink buys/placements

## Next pod tasking

- mrx_searchatlas_keyword: Package KRT 133 tracked keywords and Site Explorer 11 current organic keywords into cluster priority JSON for Content pod.
- mrx_searchatlas_content: Reconcile 11 topical maps + 297 CG articles + no DKN nodes into draft Content Genius/DKN work queue; no generation.
- mrx_searchatlas_otto: Draft OTTO one-page scope / failed audit / zero-pending-fixes QA plan and identify exact approval needed for any recrawl/settings change.
- mrx_searchatlas_cx: Draft Brand Vault vs OTTO KG parity table and AEO/LLM visibility topic-gap handoff.
- mrx_coo / ai_agile_scrum_mrx: Restore missing mrx-30-day-sprint-backlog.json artifact or bless this report as fallback diff baseline.

## Verification

- SearchAtlas MCP health check passed: 506 tools available; credential source was env-backed token.
- Read-only MCP raw outputs saved under docs/searchatlas-sprint0-\*-raw.json.
- JSON diff artifact validated with python3 -m json.tool.
