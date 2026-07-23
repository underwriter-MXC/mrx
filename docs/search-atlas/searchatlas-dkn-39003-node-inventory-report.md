# Search Atlas DKN 39003 full pending node inventory

Generated: 2026-07-20T12:47:55.054Z

Mode: read-only MCP extraction. No article generation, status update, keyword management, publishing, document export, or other mutation tools were called.

Project/DKN: 39003

Domain: mineralrightsxchange.com

## Observed counts

- DKN nodes, all/fetch_all: 191
- DKN pending nodes: 191
- DKN generated nodes: 0
- DKN progress nodes: 0
- DKN failed nodes: 0
- Content Genius project article_count field: 0
- Content Genius articles list total_count: 299
- CMS published publication records: 260
- CMS scheduled publication records: 0

## Acceptance check

- Expected 191 pending nodes: VERIFIED
- Expected zero generated articles/nodes: VERIFIED for DKN generated-node filter
- Expected zero generated/project articles: VERIFIED by cg_fetch_project_details article_count=0

## Tool/output limitations

- DKN node rows returned these raw fields: article_status, category, has_article, node_id, page_title, page_type, slug, target_keywords, url. No map_id/topical_map_id field was returned, so normalized map_id is null for all rows.
- DKN node rows returned target_keywords as a keyword list, not a singular target_keyword; the CSV/JSON preserve the list under keywords.
- Content Genius article listing separately reports historical/editorial article records (299) and CMS publication records (260); those are not DKN generated-node counts.

## Artifacts

- Raw MCP responses: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/search-atlas/searchatlas-dkn-39003-node-inventory-raw.json
- Normalized JSON: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/search-atlas/searchatlas-dkn-39003-node-inventory-normalized.json
- Normalized CSV: /Users/darylhill/Documents/MineralRightsXchange.com/mrx/docs/search-atlas/searchatlas-dkn-39003-node-inventory-normalized.csv
