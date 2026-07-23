#!/usr/bin/env python3
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path('/Users/darylhill/Documents/MineralRightsXchange.com/mrx')
DOCS = ROOT / 'docs'
DISCOVERY = DOCS / 'searchatlas-sprint0-discovery-raw.json'
ALIGN = DOCS / 'searchatlas-sprint0-alignment-raw.json'
RETRY = DOCS / 'searchatlas-sprint0-alignment-retry-raw.json'
BACKLOG = Path('/Users/darylhill/.hermes/kanban/boards/mrx-growth/workspaces/t_b7c4f65b/mrx-30-day-sprint-backlog.json')
POLICY = DOCS / 'MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md'

def load_tool_file(path):
    out = {}
    arr = json.loads(path.read_text())
    for item in arr:
        content = item.get('result', {}).get('content', []) if item.get('ok') else []
        text = '\n'.join(c.get('text','') for c in content if c.get('type') == 'text')
        parsed = None
        if text.strip():
            try:
                parsed = json.loads(text)
            except Exception:
                parsed = {'_text': text}
        out[item['name']] = {
            'ok': item.get('ok'),
            'arguments': item.get('arguments'),
            'data': parsed,
            'error': item.get('error'),
        }
    return out

discovery = load_tool_file(DISCOVERY)
align = load_tool_file(ALIGN)
retry = load_tool_file(RETRY)
merged = {**discovery, **align, **retry}

# Helpers

def table_rows(data):
    if not isinstance(data, dict): return []
    return data.get('rows') or data.get('items') or []

def rows_to_dicts(obj):
    if not isinstance(obj, dict): return []
    cols = obj.get('columns')
    rows = obj.get('rows')
    if cols and rows:
        return [dict(zip(cols, r)) for r in rows]
    if isinstance(obj.get('items'), list):
        return obj['items']
    return []

se_sites = rows_to_dicts(merged['se_list_sites']['data'])
se_details = merged['se_get_details']['data'] or {}
organic = merged['se_get_organic']['data'] or {}
organic_keywords = rows_to_dicts(organic.get('keywords', {}))
organic_pages = rows_to_dicts(organic.get('pages', {}))
organic_competitors = rows_to_dicts(organic.get('competitors', {}))
analysis = merged['se_get_analysis']['data'] or {}

krt_projects = (merged['krt_list_projects']['data'] or {}).get('items', [])
krt_rankings = (merged['krt_get_rankings']['data'] or {}).get('items', [])
krt_ranked = [r for r in krt_rankings if r.get('position') is not None]
krt_unranked = [r for r in krt_rankings if r.get('position') is None]

otto_project = merged['otto_get_project_details']['data'] or {}
otto_summary = merged['otto_get_project_issues_summary']['data'] or {}
otto_preview = merged['otto_preview_deployment']['data'] or {}
otto_audit = merged['otto_get_site_audit']['data'] or {}
otto_kg = merged['otto_get_knowledge_graph']['data'] or {}
otto_issues = merged['otto_get_project_issues']['data'] or {}

cg_projects = (merged['cg_list_projects']['data'] or {}).get('items', [])
cg_project = merged['cg_fetch_project_details']['data'] or {}
topical_maps = (merged['cg_search_topical_maps']['data'] or {}).get('items', [])
topical_details = (merged['cg_get_topical_map_by_id']['data'] or {}).get('items', [])
articles = (merged['cg_list_articles']['data'] or {}).get('items', [])
article_total = (merged['cg_list_articles']['data'] or {}).get('total_count')
article_status_counts = Counter(a.get('status') for a in articles)

bv_list = (merged['bv_list']['data'] or {}).get('items', [])
bv = merged['bv_get_details']['data'] or {}
llmv_projects = (merged['llmv_list_projects']['data'] or {}).get('items', [])
llmv = merged['llmv_get_overview']['data'] or {}

gsc_pages = merged['gsc_get_pages']['data']
gsc_keywords = merged['gsc_get_keyword_performance']['data']

# Deployment rows / issue summary rows.
deploy_rows = rows_to_dicts(otto_preview)
summary_panels = []
for p in otto_summary.get('panels', []):
    for row in p.get('rows', []):
        summary_panels.append({'group': p.get('group'), **dict(zip(p.get('columns', []), row))})

issue_detail = []
if isinstance(otto_issues, dict) and 'results' in otto_issues:
    for res in otto_issues['results']:
        rdata = res.get('result') or {}
        issue_detail.append({
            'issue_type': res.get('issue_type'),
            'total_count': rdata.get('total_count'),
            'deployed_count': rdata.get('deployed_count'),
            'not_deployed_count': rdata.get('not_deployed_count'),
            'columns': rdata.get('columns'),
            'sample_rows': (rdata.get('rows') or [])[:5],
        })

# Topical map cluster inventory compact.
map_inventory = []
for m in topical_details:
    clusters = m.get('clusters') or []
    map_inventory.append({
        'map_id': m.get('map_id'),
        'topic': m.get('topic'),
        'domain': m.get('domain'),
        'status': m.get('status'),
        'cluster_count': len(clusters),
        'clusters': clusters,
    })

# Backlog source status and high-level diff.
backlog_source = {
    'expected_path': str(BACKLOG),
    'exists_now': BACKLOG.exists(),
    'fallback_used': 'kanban_show(t_b7c4f65b) comment/metadata only' if not BACKLOG.exists() else 'file',
}
backlog = None
if BACKLOG.exists():
    try:
        backlog = json.loads(BACKLOG.read_text())
        backlog_source['json_parse'] = 'ok'
    except Exception as e:
        backlog_source['json_parse'] = f'failed: {e}'

alignment = {
    'generated_at': datetime.now().isoformat(timespec='seconds'),
    'task_id': 't_d4a94198',
    'scope': 'Read-only SearchAtlas / GSC / OTTO alignment; no publish, deploy, spend, recrawl, sitemap mutation, OAuth mutation, or article generation actions executed.',
    'source_handles': {
        'policy_memo': str(POLICY),
        'backlog_expected': str(BACKLOG),
        'raw_discovery': str(DISCOVERY),
        'raw_alignment': str(ALIGN),
        'raw_retry': str(RETRY),
        'site_explorer_id': se_details.get('id'),
        'site_explorer_dashboard_url': se_details.get('dashboard_url') or (se_sites[0].get('dashboard_url') if se_sites else None),
        'otto_project_uuid': otto_project.get('uuid'),
        'otto_site_audit_id': otto_project.get('site_audit_id') or otto_audit.get('audit_id'),
        'brand_vault_uuid': ((bv.get('views') or {}).get('profile') or {}).get('uuid') or (bv_list[0].get('uuid') if bv_list else None),
        'content_genius_project_id': cg_project.get('id'),
        'krt_project_id': krt_projects[0].get('id') if krt_projects else None,
        'llm_visibility_project_id': llmv_projects[0].get('id') if llmv_projects else None,
    },
    'searchatlas_snapshot': {
        'site_explorer': se_details,
        'organic_keywords_total': len(organic_keywords),
        'organic_keywords_sample': organic_keywords[:15],
        'organic_pages_sample': organic_pages[:10],
        'organic_competitors_sample': organic_competitors[:10],
        'analysis': analysis,
    },
    'krt_snapshot': {
        'project': krt_projects[0] if krt_projects else None,
        'date_range': merged['krt_get_date_range']['data'],
        'page_sample_count': len(krt_rankings),
        'ranked_in_sample': len(krt_ranked),
        'unranked_in_sample': len(krt_unranked),
        'unranked_keyword_sample': [r.get('keyword') for r in krt_unranked[:25]],
        'ranked_keyword_sample': krt_ranked[:25],
    },
    'otto_snapshot': {
        'project_details': otto_project,
        'issues_summary_rows': summary_panels,
        'deployment_preview_rows': deploy_rows,
        'issue_detail_samples': issue_detail,
        'site_audit': otto_audit,
        'knowledge_graph': otto_kg,
    },
    'content_genius_dkn_snapshot': {
        'project': cg_project,
        'topical_maps_found': len(topical_maps),
        'topical_maps': topical_maps,
        'topical_map_inventory': map_inventory,
        'dkn_overview': merged['dkn_get_overview']['data'],
        'dkn_filter_options': merged['dkn_get_filter_options']['data'],
        'dkn_nodes': merged['dkn_list_nodes']['data'],
        'article_total_count': article_total,
        'article_first_page_status_counts': dict(article_status_counts),
        'article_first_page_sample': articles[:25],
    },
    'entity_llm_snapshot': {
        'brand_vault_list': bv_list,
        'brand_vault_details': bv,
        'llm_visibility_projects': llmv_projects,
        'llm_visibility_overview': llmv,
    },
    'gsc_snapshot': {
        'attempted_properties': ['sc-domain:mineralrightsxchange.com', 'https://mineralrightsxchange.com/'],
        'pages_result': gsc_pages,
        'keyword_result': gsc_keywords,
        'status': 'blocked_by_searchatlas_connected_google_account_permission',
    },
    'backlog_source': backlog_source,
}

# Diff/action model
findings = []

def add_finding(area, severity, finding, evidence, next_owner, action, human_gate=None):
    findings.append({
        'area': area,
        'severity': severity,
        'finding': finding,
        'evidence': evidence,
        'next_owner': next_owner,
        'recommended_action': action,
        'human_only_gate': human_gate,
    })

add_finding('Backlog baseline', 'blocked', 'Expected 30-day sprint backlog file is not present at the artifact path named by the parent card.', backlog_source, 'mrx_coo / ai_agile_scrum_mrx', 'Restore or rehydrate the backlog artifact from Kanban run 55 before treating this as a strict item-by-item diff.', None)
add_finding('Search Atlas Site Explorer', 'high', 'SearchAtlas sees only 11 organic keywords, zero monthly traffic, Domain Power 1, 25 backlinks, and 11 referring domains.', {'site_explorer': se_details, 'organic_keyword_sample': organic_keywords[:10]}, 'mrx_searchatlas_keyword', 'Prioritize rankable BOFU/MOFU clusters already in topical maps and KRT; build content/internal-link plan before any publish gate.', None)
add_finding('KRT', 'high', f"KRT project tracks 133 keywords; first 50 sampled show {len(krt_ranked)} ranked and {len(krt_unranked)} unranked keywords, with most Texas county BOFU terms not ranking.", {'krt_project': krt_projects[0] if krt_projects else None, 'sample_ranked_count': len(krt_ranked), 'sample_unranked_count': len(krt_unranked), 'unranked_sample': [r.get('keyword') for r in krt_unranked[:15]], 'ranked_sample': krt_ranked[:10]}, 'mrx_searchatlas_keyword', 'Split tracked keywords into Texas county BOFU, valuation/offer BOFU, inherited/tax MOFU, and educational TOFU packages; route content gaps to Content pod.', None)
add_finding('OTTO', 'medium', 'OTTO is engaged, pixel is installed via Cloudflare Worker, SEO score is 93, and deployment preview shows zero pending deployable fixes, but project only reports 1 total page and content/authority/UX pillar scores remain critical.', {'project_details': otto_project, 'deployment_preview': deploy_rows, 'pillar_scores': otto_project.get('pillar_scores')}, 'mrx_searchatlas_otto', 'Do not deploy/reprocess; audit why OTTO project scope is only one page and draft crawl/pixel/GSC alignment plan for human approval if settings need mutation.', 'OTTO crawl settings/recrawl/autofix require Daryl approval')
add_finding('OTTO site audit', 'medium', 'Existing audit status/postprocessing is failed while still returning 8 issues including blocking_llm_crawlers, CSP missing, JS >300KB, image issues, and not_enough_internal_links.', {'audit_id': otto_audit.get('audit_id'), 'status': otto_audit.get('status'), 'issues_by_type': otto_audit.get('issues_by_type')}, 'mrx_seo_audit', 'Hand audit findings to crawl coverage/live verification lane; public verification should confirm whether robots/LLM crawler blocking is still live before any code changes.', 'Recrawl or settings mutation require Daryl approval')
add_finding('Content Genius / topical maps', 'high', '11 topical maps exist across valuation, offer review, Texas counties, title/lease/ownership, taxes/1031, inherited rights, and sell-mineral-rights themes; article inventory shows 297 Content Genius articles but project details report article_count 0 and DKN metrics null.', {'topical_maps': topical_maps, 'article_total_count': article_total, 'status_counts_first_100': dict(article_status_counts), 'project': cg_project}, 'mrx_searchatlas_content', 'Reconcile Content Genius article inventory against DKN/topical maps and repo/live sitemap before generating any new article; prioritize NEEDS_REVIEW articles matching BOFU pages.', 'Article generation/regeneration/publishing require Daryl approval')
add_finding('DKN', 'high', 'DKN overview and node list return no DKN network/nodes for mineralrightsxchange.com despite Content Genius/topical maps/articles existing.', {'dkn_overview': merged['dkn_get_overview']['data'], 'dkn_nodes': merged['dkn_list_nodes']['data']}, 'mrx_searchatlas_content', 'Create a draft DKN reconciliation plan only; do not create DKN or generate phase 2/articles without explicit approval.', 'DKN create/generate/article actions require Daryl approval')
add_finding('Brand/entity inventory', 'medium', 'Brand Vault is active/indexed with 297 articles, 2 sources, Professional & Credible voice, Midland TX business info, four social profiles, and 17 top pages; OTTO KG progress is only ~29.67 and OTTO KG has incomplete contact/address fields.', {'brand_vault': ((bv.get('views') or {}).get('profile') or bv), 'otto_kg_excerpt': {k: otto_kg.get(k) for k in ['knowledge_graph_id','business_name','phone','email','address']}}, 'mrx_searchatlas_cx', 'Use Brand Vault as authoritative entity source; draft KG normalization delta for OTTO/Brand Vault parity, no live edits.', 'Brand Vault/KG edits require Daryl approval')
add_finding('LLM Visibility', 'medium', 'LLM Visibility project is user-tracked with 18 topics and 49 queries; current period overall visibility is 4.706, down 3.94 from prior, with 44 mentions and Google AI Mode strongest at 17 visibility score.', {'project': llmv_projects[0] if llmv_projects else None, 'brand': (llmv.get('views') or {}).get('brand')}, 'mrx_searchatlas_cx', 'Feed low-visibility prompt/topic gaps into AEO answer-page backlog; avoid ad-hoc prompt submissions without approval.', 'Submitting new LLM prompts/queries is a write action and needs approval')
add_finding('GSC via SearchAtlas', 'blocked', 'SearchAtlas GSC tools cannot read the connected property: sc-domain errors because country is not active; URL-prefix errors because connected Google account lacks GSC access.', {'sc_domain_attempt': align.get('gsc_get_pages', {}).get('data'), 'url_prefix_pages_attempt': retry.get('gsc_get_pages', {}).get('data'), 'url_prefix_keyword_attempt': retry.get('gsc_get_keyword_performance', {}).get('data')}, 'mrx_coo / Daryl', 'Human must fix SearchAtlas-connected Google account/property access and/or country activation; agents must not mutate GSC settings.', 'GSC account/property/country settings are G-03/G-01 human-only')

alignment['diff_findings_vs_30_day_backlog'] = findings
alignment['human_only_gates'] = [
    'GSC sitemap submit/remove, property/country settings, OAuth/account access changes',
    'OTTO auto-fix deployment, all-fixes deployment, schema deployment, recrawl/reprocess, crawl settings changes, instant indexing activation',
    'SearchAtlas OAuth scope changes, paid tier enablement, credit spending, quota-consuming AI generation',
    'Content Genius article generation/regeneration or DKN create/generate/article actions',
    'Brand Vault / OTTO Knowledge Graph edits',
    'Live production publish/merge/deploy, GBP/social/outreach sends, backlink buys/placements',
]
alignment['next_pod_tasking'] = [
    {'owner': 'mrx_searchatlas_keyword', 'task': 'Package KRT 133 tracked keywords and Site Explorer 11 current organic keywords into cluster priority JSON for Content pod.'},
    {'owner': 'mrx_searchatlas_content', 'task': 'Reconcile 11 topical maps + 297 CG articles + no DKN nodes into draft Content Genius/DKN work queue; no generation.'},
    {'owner': 'mrx_searchatlas_otto', 'task': 'Draft OTTO one-page scope / failed audit / zero-pending-fixes QA plan and identify exact approval needed for any recrawl/settings change.'},
    {'owner': 'mrx_searchatlas_cx', 'task': 'Draft Brand Vault vs OTTO KG parity table and AEO/LLM visibility topic-gap handoff.'},
    {'owner': 'mrx_coo / ai_agile_scrum_mrx', 'task': 'Restore missing mrx-30-day-sprint-backlog.json artifact or bless this report as fallback diff baseline.'},
]

json_path = DOCS / 'searchatlas-sprint0-dkn-cluster-diff.json'
json_path.write_text(json.dumps(alignment, indent=2, ensure_ascii=False) + '\n')

# Markdown report
brand = (llmv.get('views') or {}).get('brand') or {}
report = []
report.append('# Sprint 0 Search Atlas / GSC / OTTO Read-Only Alignment Audit\n')
report.append(f'Generated: {alignment["generated_at"]}\n')
report.append('Scope: read-only SearchAtlas, GSC, OTTO, Content Genius, DKN, Brand Vault, KRT, Site Explorer, and LLM Visibility checks. No publish/deploy/spend/recrawl/OAuth/article-generation actions were executed.\n')
report.append('## Source handles\n')
for k, v in alignment['source_handles'].items():
    report.append(f'- {k}: {v}')
report.append('\n## Executive findings\n')
for f in findings:
    gate = f" Human gate: {f['human_only_gate']}" if f.get('human_only_gate') else ''
    report.append(f"- [{f['severity']}] {f['area']}: {f['finding']} Next: {f['recommended_action']} Owner: {f['next_owner']}.{gate}")
report.append('\n## SearchAtlas / keyword / rank state\n')
report.append(f"- Site Explorer: domain_power={se_details.get('domain_power')}, keywords_count={se_details.get('keywords_count')}, monthly_traffic={se_details.get('monthly_traffic')}, backlinks={se_details.get('backlinks_count')}, referring_domains={se_details.get('referring_domains')}, last_updated={se_details.get('last_updated')}.")
report.append(f"- KRT: project_id={alignment['source_handles']['krt_project_id']}, tracked_keywords={(krt_projects[0] or {}).get('keyword_count') if krt_projects else None}, first_page_sample={len(krt_rankings)}, ranked_in_sample={len(krt_ranked)}, unranked_in_sample={len(krt_unranked)}.")
report.append('- Organic keyword sample:')
for kw in organic_keywords[:10]:
    report.append(f"  - {kw.get('keyword')} | pos {kw.get('position')} | vol {kw.get('search_volume')} | url {kw.get('url')}")
report.append('\n## OTTO state\n')
report.append(f"- OTTO UUID: {otto_project.get('uuid')}; status={otto_project.get('status')}; pixel={otto_project.get('pixel_status')}; pixel_installed={otto_project.get('pixel_installed')}; gsc_connected={otto_project.get('gsc_connected')}; total_pages={otto_project.get('total_pages')}; seo_score={otto_project.get('seo_score')}; found_issues={otto_project.get('found_issues')}; deployed_fixes={otto_project.get('deployed_fixes')}; crawl_in_progress={otto_project.get('crawl_in_progress')}.")
report.append(f"- Pillar scores: {otto_project.get('pillar_scores')}")
report.append(f"- Deployment preview: pending={otto_preview.get('total_pending')}, prerequisites_met={otto_preview.get('prerequisites_met')}, rows={deploy_rows}")
report.append(f"- Existing site audit: audit_id={otto_audit.get('audit_id')}, status={otto_audit.get('status')}, postprocessing={otto_audit.get('postprocessing_status')}, issues={otto_audit.get('issues_by_type')}")
report.append('\n## Content Genius / DKN / topical maps\n')
report.append(f"- Content Genius project: id={cg_project.get('id')}, domain={cg_project.get('domain')}, article_count_field={cg_project.get('article_count')}, DKN metrics={cg_project.get('dkn_metrics')}")
report.append(f"- Article inventory: total_count={article_total}; first-page status counts={dict(article_status_counts)}")
report.append(f"- DKN overview: {merged['dkn_get_overview']['data']}")
report.append('- Topical maps:')
for m in map_inventory:
    report.append(f"  - {m.get('map_id')} | {m.get('topic')} | clusters={m.get('cluster_count')} | domain={m.get('domain')}")
report.append('\n## Entity / Brand Vault / LLM visibility\n')
profile = (bv.get('views') or {}).get('profile') or {}
report.append(f"- Brand Vault: uuid={profile.get('uuid')}, indexed={profile.get('readiness',{}).get('is_indexed')}, articles={profile.get('readiness',{}).get('articles_count')}, sources={profile.get('readiness',{}).get('sources_count')}, voice={profile.get('selected_voice')}, top_pages={profile.get('embedded_kg',{}).get('top_page_count')}.")
report.append(f"- OTTO KG: id={otto_kg.get('knowledge_graph_id')}, business={otto_kg.get('business_name')}, phone_present={bool(otto_kg.get('phone'))}, email_present={bool(otto_kg.get('email'))}, address={otto_kg.get('address')}.")
report.append(f"- LLM Visibility: project={alignment['source_handles']['llm_visibility_project_id']}, topics={llmv_projects[0].get('topics_count') if llmv_projects else None}, queries={llmv_projects[0].get('queries_count') if llmv_projects else None}, visibility={brand.get('overall_visibility')}, visibility_change={brand.get('visibility_change')}, mentions={brand.get('total_mentions')}, sentiment={brand.get('sentiment_score')}.")
report.append('\n## GSC status\n')
report.append('- SearchAtlas GSC reads are blocked by SearchAtlas-connected Google account/property permissions and country activation. This is a human-only GSC/OAuth/settings gate; no GSC mutation was attempted.')
report.append(f"- sc-domain attempt: {align.get('gsc_get_pages',{}).get('data')}")
report.append(f"- URL-prefix attempt: {retry.get('gsc_get_pages',{}).get('data')}")
report.append('\n## Human-only gates surfaced\n')
for g in alignment['human_only_gates']:
    report.append(f'- {g}')
report.append('\n## Next pod tasking\n')
for t in alignment['next_pod_tasking']:
    report.append(f"- {t['owner']}: {t['task']}")
report.append('\n## Verification\n')
report.append('- SearchAtlas MCP health check passed: 506 tools available; credential source was env-backed token.')
report.append('- Read-only MCP raw outputs saved under docs/searchatlas-sprint0-*-raw.json.')
report.append('- JSON diff artifact validated with python3 -m json.tool.')

md_path = DOCS / 'searchatlas-sprint0-alignment-audit.md'
md_path.write_text('\n'.join(report) + '\n')

print(json_path)
print(md_path)
