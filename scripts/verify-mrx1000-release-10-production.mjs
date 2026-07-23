import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BATCH_PATH = 'config/mrx1000-release-10-batch.json';
const PUBLICATION_MANIFEST_PATH =
  'artifacts/mrx1000-release-10/release/publication-manifest.json';
const OUTPUT_PATH =
  'artifacts/mrx1000-release-10/release/post-publication-verification.json';
const DEPLOYMENT = {
  provider: 'Vercel',
  project: 'team-mrx/mrx-web',
  deployment_id: 'dpl_7d4H8fRMWhbrAgsqPKfffTX9dsYh',
  deployment_url: 'https://mrx-jbzgio4yx-team-mrx.vercel.app',
  inspect_url: 'https://vercel.com/team-mrx/mrx-web/7d4H8fRMWhbrAgsqPKfffTX9dsYh',
  promoted_alias: 'https://mrx-web.vercel.app',
};

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const decodeHtml = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

const stripTags = (value = '') =>
  decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const countMatches = (value, expression) => [...value.matchAll(expression)].length;

const extractCanonical = (html) => {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["'][^"']*canonical[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href) return decodeHtml(href);
  }
  return null;
};

const extractSchemaNodes = (html) => {
  const nodes = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      const topLevel = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of topLevel) {
        if (Array.isArray(node?.['@graph'])) nodes.push(...node['@graph']);
        else nodes.push(node);
      }
    } catch {
      // The invalid block is reported through the schema assertions below.
    }
  }
  return nodes;
};

const schemaTypes = (nodes) =>
  new Set(
    nodes.flatMap((node) => {
      const type = node?.['@type'];
      return Array.isArray(type) ? type : type ? [type] : [];
    }),
  );

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, {
    redirect: options.redirect ?? 'follow',
    headers: {
      'cache-control': 'no-cache',
      'user-agent': 'MRX-Codex-Production-Verifier/1.0',
    },
  });
  return {
    response,
    text: await response.text(),
  };
};

const batch = await readJson(BATCH_PATH);
const publicationManifest = await readJson(PUBLICATION_MANIFEST_PATH);
const verifiedAt = new Date().toISOString();

const articleResults = [];
for (const article of batch.articles) {
  const evidencePath = article.evidence_packet_path;
  const evidence = await readJson(evidencePath);
  const { response, text: html } = await fetchText(article.canonical_url);
  const schemas = extractSchemaNodes(html);
  const types = schemaTypes(schemas);
  const faqNode = schemas.find((node) => {
    const type = node?.['@type'];
    return type === 'FAQPage' || (Array.isArray(type) && type.includes('FAQPage'));
  });
  const h1 = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const sourceUrls = evidence.claim_to_source.map((row) => row.source_url);
  const assetPaths = evidence.asset_manifest.assets.map((asset) => asset.public_path);
  const robotsMeta = [...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*>/gi)]
    .map((match) => match[0])
    .join(' ');

  const assertions = {
    http_200: response.status === 200,
    final_url_exact: response.url === article.canonical_url,
    canonical_exact: extractCanonical(html) === article.canonical_url,
    x_robots_indexable: !/noindex/i.test(response.headers.get('x-robots-tag') ?? ''),
    meta_robots_indexable: !/noindex/i.test(robotsMeta),
    h1_exact: h1 === article.title,
    meaningful_rendered_content: stripTags(html).length >= 4000,
    article_schema: types.has('Article') || types.has('BlogPosting'),
    faq_schema: types.has('FAQPage'),
    five_faqs: Array.isArray(faqNode?.mainEntity) && faqNode.mainEntity.length === 5,
    breadcrumb_schema: types.has('BreadcrumbList'),
    every_reviewed_source_rendered: sourceUrls.every((url) =>
      decodeHtml(html).includes(url),
    ),
    every_approved_asset_rendered: assetPaths.every((assetPath) => html.includes(assetPath)),
    footer_disclosure_once:
      countMatches(html, /mrx-disclaimer-footer/g) === 1,
    top_disclosure_absent: countMatches(html, /mrx-disclaimer-top/g) === 0,
    analytics_present:
      /googletagmanager\.com\/gtag\/js\?id=(?:G|GT)-/i.test(html) &&
      /gtag\(['"]config['"],\s*(?:googleTagId|['"](?:G|GT)-)/i.test(html),
  };

  articleResults.push({
    program_row_id: article.program_row_id,
    slug: article.slug,
    title: article.title,
    url: article.canonical_url,
    observed_status: response.status,
    observed_final_url: response.url,
    observed_canonical: extractCanonical(html),
    observed_h1: h1,
    observed_schema_types: [...types].sort(),
    observed_faq_count: Array.isArray(faqNode?.mainEntity) ? faqNode.mainEntity.length : 0,
    observed_source_url_count: sourceUrls.filter((url) => decodeHtml(html).includes(url)).length,
    expected_source_url_count: sourceUrls.length,
    observed_asset_count: assetPaths.filter((assetPath) => html.includes(assetPath)).length,
    expected_asset_count: assetPaths.length,
    response_headers: {
      cache_status: response.headers.get('cf-cache-status'),
      last_modified: response.headers.get('last-modified'),
      x_vercel_cache: response.headers.get('x-vercel-cache'),
      x_vercel_id: response.headers.get('x-vercel-id'),
      x_robots_tag: response.headers.get('x-robots-tag'),
    },
    assertions,
    disposition: Object.values(assertions).every(Boolean) ? 'PASS' : 'FAIL',
  });
}

const articleUrls = batch.articles.map((article) => article.canonical_url);
const [home, sitemap, llms, llmsFull, robots] = await Promise.all([
  fetchText('https://mineralrightsxchange.com/'),
  fetchText('https://mineralrightsxchange.com/sitemap-articles.xml'),
  fetchText('https://mineralrightsxchange.com/llms.txt'),
  fetchText('https://mineralrightsxchange.com/llms-full.txt'),
  fetchText('https://mineralrightsxchange.com/robots.txt'),
]);
const wwwResponse = await fetch('https://www.mineralrightsxchange.com/', {
  redirect: 'manual',
  headers: { 'cache-control': 'no-cache', 'user-agent': 'MRX-Codex-Production-Verifier/1.0' },
});

let browserVerification = null;
if (process.env.MRX_BROWSER_VERIFICATION_JSON) {
  browserVerification = JSON.parse(process.env.MRX_BROWSER_VERIFICATION_JSON);
}

const interfaceAssertions = {
  homepage_http_200: home.response.status === 200,
  homepage_top_disclosure_absent: countMatches(home.text, /mrx-disclaimer-top/g) === 0,
  homepage_footer_disclosure_once: countMatches(home.text, /mrx-disclaimer-footer/g) === 1,
  www_redirects_to_apex:
    [301, 302, 307, 308].includes(wwwResponse.status) &&
    wwwResponse.headers.get('location') === 'https://mineralrightsxchange.com/',
  sitemap_http_200: sitemap.response.status === 200,
  sitemap_contains_all_10: articleUrls.every((url) => sitemap.text.includes(url)),
  sitemap_has_19_article_urls:
    countMatches(sitemap.text, /<loc>https:\/\/mineralrightsxchange\.com\/blog\//g) === 19,
  llms_http_200: llms.response.status === 200,
  llms_points_to_full_public_index:
    llms.text.includes('https://mineralrightsxchange.com/llms-full.txt'),
  llms_full_http_200: llmsFull.response.status === 200,
  llms_full_contains_all_10: articleUrls.every((url) => llmsFull.text.includes(url)),
  robots_http_200: robots.response.status === 200,
  robots_mentions_oai_searchbot: /User-agent:\s*OAI-SearchBot/i.test(robots.text),
  browser_home_top_disclosure_absent:
    browserVerification?.homepage?.top_disclosure_count === 0,
  browser_home_footer_disclosure_once:
    browserVerification?.homepage?.footer_disclosure_count === 1,
};

const report = {
  artifact_type: 'mrx1000_release_10_post_publication_verification',
  schema_version: 1,
  generated_at_utc: verifiedAt,
  verifier: 'Codex independent production verification',
  deployment: DEPLOYMENT,
  production_registry: {
    confirmed_active_targets_at_release: ['vercel-origin-via-cloudflare-apex'],
    canonical_origin: 'https://mineralrightsxchange.com',
    redirect_aliases: ['https://www.mineralrightsxchange.com'],
    configured_but_not_active_origins: ['Cloudflare Pages deployment configuration'],
  },
  browser_verification: browserVerification,
  article_results: articleResults,
  interface_results: {
    homepage_status: home.response.status,
    sitemap_article_url_count: countMatches(
      sitemap.text,
      /<loc>https:\/\/mineralrightsxchange\.com\/blog\//g,
    ),
    www_status: wwwResponse.status,
    www_location: wwwResponse.headers.get('location'),
    assertions: interfaceAssertions,
    disposition: Object.values(interfaceAssertions).every(Boolean) ? 'PASS' : 'FAIL',
  },
  rollback: {
    prior_verified_production_deployment:
      'Use Vercel deployment history immediately before dpl_7d4H8fRMWhbrAgsqPKfffTX9dsYh.',
    per_article: publicationManifest.rows.map((row) => ({
      program_row_id: row.program_row_id,
      slug: row.slug,
      rollback_reference: row.rollback_reference,
      procedure: row.rollback.procedure,
    })),
  },
  summary: {
    expected_articles: batch.articles.length,
    passing_articles: articleResults.filter((row) => row.disposition === 'PASS').length,
    failing_articles: articleResults.filter((row) => row.disposition === 'FAIL').length,
    interface_disposition: Object.values(interfaceAssertions).every(Boolean) ? 'PASS' : 'FAIL',
  },
};
report.summary.overall_disposition =
  report.summary.passing_articles === report.summary.expected_articles &&
  report.summary.failing_articles === 0 &&
  report.summary.interface_disposition === 'PASS'
    ? 'PASS'
    : 'FAIL';

const serialized = `${JSON.stringify(report, null, 2)}\n`;
await mkdir(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
await writeFile(path.join(ROOT, OUTPUT_PATH), serialized, 'utf8');
await writeFile(path.join(ROOT, `${OUTPUT_PATH}.sha256`), `${sha256(serialized)}  ${path.basename(OUTPUT_PATH)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      output_path: OUTPUT_PATH,
      sha256: sha256(serialized),
      summary: report.summary,
    },
    null,
    2,
  ),
);

if (report.summary.overall_disposition !== 'PASS') process.exitCode = 1;
