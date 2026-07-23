#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const registryPath = join(root, 'config', 'mrx-sell-search-leadership.json');
const ledgerPath = join(root, 'config', 'mrx-1000-canonical-content-ledger.json');
const postsDir = join(root, 'src', 'content', 'posts');
const sellPagePath = join(root, 'src', 'content', 'pages', 'sell-mineral-rights.mdx');
const texasRoutePath = join(root, 'src', 'pages', 'sell-mineral-rights', 'texas.astro');
const outputDir = join(root, 'reports', 'mrx-sell-search-leadership');
const outputJson = join(outputDir, 'dashboard.json');
const outputMarkdown = join(outputDir, 'dashboard.md');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const scalar = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!scalar) continue;
    let value = scalar[2].trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    values[scalar[1]] = value;
  }
  return values;
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function groupCounts(values) {
  const counts = new Map();
  for (const value of values) {
    const key = normalize(value);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function publicPostInventory() {
  const rows = [];
  for (const file of readdirSync(postsDir).filter((entry) => entry.endsWith('.mdx'))) {
    const path = join(postsDir, file);
    const data = parseFrontmatter(readFileSync(path, 'utf8'));
    if (
      data.publication_status !== 'published' ||
      data.draft === 'true' ||
      data.noindex === 'true'
    ) {
      continue;
    }
    rows.push({
      slug: file.replace(/\.mdx$/, ''),
      title: data.title ?? file,
      pillar: data.pillar ?? null,
      content_cluster: data.content_cluster ?? null,
    });
  }
  return rows;
}

function buildDashboard() {
  const blocking = [];
  const warnings = [];
  const registry = readJson(registryPath);
  const ledger = readJson(ledgerPath);
  const ledgerRows = ledger.articles ?? [];
  const ledgerById = new Map(ledgerRows.map((row) => [row.program_row_id, row]));
  const queries = registry.tracked_queries ?? [];
  const next25 = registry.next_25 ?? [];
  const publicPosts = publicPostInventory();
  const sellPosts = publicPosts.filter((row) => row.pillar === 'sell-mineral-rights');

  if (queries.length !== 50)
    blocking.push(`Tracked query portfolio must contain 50 rows; found ${queries.length}.`);
  if (next25.length !== 25)
    blocking.push(`Next release portfolio must contain 25 rows; found ${next25.length}.`);

  const duplicateQueryKeys = groupCounts(
    queries.map((row) => `${row.market}\u0000${row.query}`),
  ).filter((row) => row.count > 1);
  if (duplicateQueryKeys.length) {
    blocking.push(
      `Duplicate query+market keys: ${duplicateQueryKeys.map((row) => row.value).join(', ')}`,
    );
  }

  const duplicateQueryIds = groupCounts(queries.map((row) => row.id)).filter(
    (row) => row.count > 1,
  );
  if (duplicateQueryIds.length) {
    blocking.push(`Duplicate query IDs: ${duplicateQueryIds.map((row) => row.value).join(', ')}`);
  }

  const duplicateNextSlugs = groupCounts(next25.map((row) => row.slug)).filter(
    (row) => row.count > 1,
  );
  if (duplicateNextSlugs.length) {
    blocking.push(
      `Duplicate next-25 slugs: ${duplicateNextSlugs.map((row) => row.value).join(', ')}`,
    );
  }

  const invalidReleaseStates = next25.filter(
    (row) => !['held', 'planning'].includes(row.release_status),
  );
  if (invalidReleaseStates.length) {
    blocking.push(
      `Next-25 rows may only be held or planning: ${invalidReleaseStates.map((row) => row.slug).join(', ')}`,
    );
  }

  const missingSourceIds = [
    ...new Set(next25.flatMap((row) => row.source_program_row_ids ?? [])),
  ].filter((id) => !ledgerById.has(id));
  if (missingSourceIds.length)
    blocking.push(`Next-25 source IDs missing from ledger: ${missingSourceIds.join(', ')}`);

  const consolidationSourceIds = (registry.consolidations ?? []).flatMap(
    (row) => row.source_program_row_ids ?? [],
  );
  const missingConsolidationIds = consolidationSourceIds.filter((id) => !ledgerById.has(id));
  if (missingConsolidationIds.length) {
    blocking.push(
      `Consolidation source IDs missing from ledger: ${missingConsolidationIds.join(', ')}`,
    );
  }

  const publishedConsolidationSources = consolidationSourceIds
    .map((id) => ledgerById.get(id))
    .filter((row) => row?.publication_status === 'published');
  if (publishedConsolidationSources.length) {
    blocking.push(
      `Competing consolidation sources are public: ${publishedConsolidationSources.map((row) => row.canonical_slug).join(', ')}`,
    );
  }

  const releaseGates = registry.release_gates ?? {};
  if (releaseGates.current_index_status !== 'verified_threshold_met') {
    const escapedRows = next25.filter((row) => row.release_status === 'published');
    if (escapedRows.length) {
      blocking.push(
        `Index gate is not verified but next-25 rows are published: ${escapedRows.map((row) => row.slug).join(', ')}`,
      );
    }
    if (existsSync(texasRoutePath)) {
      blocking.push(
        'The held /sell-mineral-rights/texas/ route exists before the GSC index gate is verified.',
      );
    }
  }

  const sellPage = readFileSync(sellPagePath, 'utf8');
  const sellFrontmatter = parseFrontmatter(sellPage);
  if (!normalize(sellFrontmatter.title).startsWith('sell mineral rights')) {
    blocking.push('The sell pillar title does not own the “sell mineral rights” head term.');
  }
  if (!normalize(sellFrontmatter.h1).includes('sell mineral rights')) {
    blocking.push('The sell pillar H1 does not include “sell mineral rights”.');
  }
  if (sellFrontmatter.disclaimer_top !== 'false') {
    blocking.push('The removed top disclosure must remain disabled on the sell pillar.');
  }
  if (sellPosts.length < 2) {
    blocking.push(
      `The live sell pillar must contain at least two explicitly assigned guides; found ${sellPosts.length}.`,
    );
  }

  const sellLedgerRows = ledgerRows.filter((row) => row.pillar === 'sell-mineral-rights');
  const primaryKeywordGroups = groupCounts(sellLedgerRows.map((row) => row.primary_keyword));
  const repeatedPrimaryKeywords = primaryKeywordGroups.filter((row) => row.count > 1);
  if (repeatedPrimaryKeywords.length) {
    warnings.push(
      `${repeatedPrimaryKeywords.reduce((sum, row) => sum + row.count, 0)} sell-pillar ledger rows currently share a repeated primary keyword and remain frozen pending re-keywording.`,
    );
  }

  const dashboard = {
    artifact_type: 'mrx_sell_search_leadership_dashboard',
    generated_at_utc: new Date().toISOString(),
    status: blocking.length ? 'blocked' : 'pass_with_release_hold',
    inputs: {
      registry: { path: 'config/mrx-sell-search-leadership.json', sha256: sha256(registryPath) },
      canonical_ledger: {
        path: 'config/mrx-1000-canonical-content-ledger.json',
        sha256: sha256(ledgerPath),
        rows: ledgerRows.length,
      },
    },
    strategy: registry.north_star,
    release_gate: releaseGates,
    portfolio: {
      tracked_queries: queries.length,
      p0_queries: queries.filter((row) => row.priority === 'P0').length,
      next_release_rows: next25.length,
      next_release_published_rows: next25.filter((row) => row.release_status === 'published')
        .length,
      live_public_posts: publicPosts.length,
      live_sell_pillar_posts: sellPosts,
      sell_ledger_rows: sellLedgerRows.length,
      repeated_primary_keywords: repeatedPrimaryKeywords.slice(0, 25),
    },
    route_ownership: registry.public_route_ownership,
    authority_assets: registry.authority_assets,
    blocking_findings: blocking,
    warnings,
  };

  return dashboard;
}

function renderMarkdown(dashboard) {
  const lines = [
    '# MRX sell-search leadership dashboard',
    '',
    `- Generated: ${dashboard.generated_at_utc}`,
    `- Status: **${dashboard.status}**`,
    `- Tracked queries: ${dashboard.portfolio.tracked_queries}`,
    `- Next release rows: ${dashboard.portfolio.next_release_rows}`,
    `- Live sell-pillar guides: ${dashboard.portfolio.live_sell_pillar_posts.length}`,
    `- GSC index gate: ${dashboard.release_gate.current_index_status}`,
    `- Next-25 publication state: ${dashboard.release_gate.next_25_publication_status}`,
    '',
    '## Live sell-pillar guides',
    '',
    ...dashboard.portfolio.live_sell_pillar_posts.map(
      (row) => `- \`/blog/${row.slug}/\` — ${row.title}`,
    ),
    '',
    '## Blocking findings',
    '',
    ...(dashboard.blocking_findings.length
      ? dashboard.blocking_findings.map((finding) => `- ${finding}`)
      : ['- None. The future release remains deliberately held by policy.']),
    '',
    '## Warnings',
    '',
    ...(dashboard.warnings.length
      ? dashboard.warnings.map((warning) => `- ${warning}`)
      : ['- None.']),
    '',
    '## Earned release gate',
    '',
    `The next 25 articles and \`/sell-mineral-rights/texas/\` remain nonpublic until GSC verifies at least ${Math.round(
      dashboard.release_gate.minimum_index_coverage * 100,
    )}% index coverage for the July 22 release by ${dashboard.release_gate.index_coverage_deadline}.`,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(outputDir, { recursive: true });
const dashboard = buildDashboard();
writeFileSync(outputJson, `${JSON.stringify(dashboard, null, 2)}\n`);
writeFileSync(outputMarkdown, renderMarkdown(dashboard));

if (dashboard.blocking_findings.length) {
  console.error(
    `MRX sell-search dashboard blocked with ${dashboard.blocking_findings.length} finding(s).`,
  );
  for (const finding of dashboard.blocking_findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(
    `MRX sell-search dashboard passed: ${dashboard.portfolio.tracked_queries} queries, ${dashboard.portfolio.next_release_rows} held release rows, ${dashboard.portfolio.live_sell_pillar_posts.length} live sell-pillar guides.`,
  );
}
