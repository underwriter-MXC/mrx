import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { legacyLiveRowsFromLedger } from './_release-lifecycle-embedded.mjs';
import {
  countElementsWithClass,
  parseCsvEnv,
  readTagAttribute,
  resolveDeployment,
  resolveDeploymentExpectations,
  validateDeploymentMetadata,
} from './_mrx1000-production-verification.mjs';

const ROOT = process.cwd();
const BATCH_PATH = 'config/mrx1000-release-10-batch.json';
const LEDGER_PATH = 'config/mrx-1000-canonical-content-ledger.json';
const PUBLICATION_MANIFEST_PATH =
  'artifacts/mrx1000-release-10/release/publication-manifest.json';
const RETAINED_PRODUCTION_BASELINE_PATH =
  'artifacts/mrx1000-release-10/release/retained-production-baseline.json';
const OUTPUT_PATH =
  'artifacts/mrx1000-release-10/release/post-publication-verification.json';
const CANONICAL_ORIGIN = process.env.MRX_CANONICAL_ORIGIN ?? 'https://mineralrightsxchange.com';
const REDIRECT_ALIASES = parseCsvEnv(
  process.env,
  'MRX_REDIRECT_ALIASES',
  'https://www.mineralrightsxchange.com',
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

const extractMetaContent = (html, attribute, value) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (readTagAttribute(tag, attribute).toLowerCase() === value.toLowerCase()) {
      return readTagAttribute(tag, 'content') || null;
    }
  }
  return null;
};

const absoluteUrl = (value) => {
  try {
    return new URL(value, `${CANONICAL_ORIGIN}/`).toString();
  } catch {
    return null;
  }
};

const countMatches = (value, expression) => [...value.matchAll(expression)].length;

const extractCanonical = (html) => {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!readTagAttribute(tag, 'rel').split(/\s+/).includes('canonical')) continue;
    const href = readTagAttribute(tag, 'href');
    if (href) return href;
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

const fetchBytes = async (url) => {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'cache-control': 'no-cache',
      'user-agent': 'MRX-Codex-Production-Verifier/1.0',
    },
  });
  return { response, bytes: Buffer.from(await response.arrayBuffer()) };
};

const webpDimensions = (bytes) => {
  if (
    bytes.length < 30 ||
    bytes.toString('ascii', 0, 4) !== 'RIFF' ||
    bytes.toString('ascii', 8, 12) !== 'WEBP'
  ) return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunk = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (chunk === 'VP8X' && data + 10 <= bytes.length) {
      return {
        width: 1 + bytes.readUIntLE(data + 4, 3),
        height: 1 + bytes.readUIntLE(data + 7, 3),
      };
    }
    if (chunk === 'VP8L' && data + 5 <= bytes.length && bytes[data] === 0x2f) {
      const b1 = bytes[data + 1];
      const b2 = bytes[data + 2];
      const b3 = bytes[data + 3];
      const b4 = bytes[data + 4];
      return {
        width: 1 + (b1 | ((b2 & 0x3f) << 8)),
        height: 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10)),
      };
    }
    if (
      chunk === 'VP8 ' &&
      data + 10 <= bytes.length &&
      bytes[data + 3] === 0x9d &&
      bytes[data + 4] === 0x01 &&
      bytes[data + 5] === 0x2a
    ) {
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    offset = data + size + (size % 2);
  }
  return null;
};

const batch = await readJson(BATCH_PATH);
const ledger = await readJson(LEDGER_PATH);
const publicationManifest = await readJson(PUBLICATION_MANIFEST_PATH);
const retainedProductionBaselineManifest = await readJson(RETAINED_PRODUCTION_BASELINE_PATH);
const deployment = resolveDeployment();
const deploymentExpectations = resolveDeploymentExpectations();
const verifiedAt = new Date().toISOString();
const canonicalArticleUrls = new Set(batch.articles.map((article) => article.canonical_url));
const legacyLiveUrls = legacyLiveRowsFromLedger(ledger.articles ?? [])
  .map((row) => row.canonical_url)
  .filter((url) => url && !canonicalArticleUrls.has(url));
const expectedPublicArticleUrls = [...new Set([...batch.articles.map((article) => article.canonical_url), ...legacyLiveUrls])];
const expectedLiveBlogCount = Number.parseInt(
  process.env.MRX_EXPECTED_LIVE_BLOG_COUNT ?? `${expectedPublicArticleUrls.length}`,
  10,
);
const expectedBlogLocPattern = new RegExp(
  `<loc>${escapeRegExp(`${CANONICAL_ORIGIN}/blog/`)}`,
  'g',
);
const activeTargetsAtRelease = parseCsvEnv(
  process.env,
  'MRX_ACTIVE_PRODUCTION_TARGETS',
  'vercel-origin-via-cloudflare-apex',
);
const configuredButInactiveOrigins = parseCsvEnv(
  process.env,
  'MRX_CONFIGURED_BUT_NOT_ACTIVE_ORIGINS',
  'Cloudflare Pages deployment configuration',
);

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
  const articleNode = schemas.find((node) => {
    const type = node?.['@type'];
    return type === 'Article' || type === 'BlogPosting' ||
      (Array.isArray(type) && (type.includes('Article') || type.includes('BlogPosting')));
  });
  const h1 = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const sourceUrls = evidence.claim_to_source.map((row) => row.source_url);
  const assetPaths = evidence.asset_manifest.assets.map((asset) => asset.public_path);
  const robotsMeta = [...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*>/gi)]
    .map((match) => match[0])
    .join(' ');
  const heroFigure = html.match(
    /<figure\b[^>]*class=["'][^"']*article-hero-image[^"']*["'][^>]*>[\s\S]*?<\/figure>/i,
  )?.[0] ?? '';
  const heroTag = heroFigure.match(/<img\b[^>]*>/i)?.[0] ?? null;
  const expectedHeroUrl = new URL(article.hero_path, `${CANONICAL_ORIGIN}/`).toString();
  const expectedHeroAsset = evidence.asset_manifest.assets.find((asset) => asset.kind === 'hero');
  const expectedSocialAsset = evidence.asset_manifest.assets.find((asset) => asset.kind === 'social');
  const exactWave2OwnerPolicy = article.admission_status === 'admitted_exact';
  const expectedShareAsset = exactWave2OwnerPolicy ? expectedHeroAsset : expectedSocialAsset;
  const expectedShareUrl = expectedShareAsset?.public_path
    ? new URL(expectedShareAsset.public_path, `${CANONICAL_ORIGIN}/`).toString()
    : null;
  const expectedHeroWidth = expectedHeroAsset?.observed_width ?? expectedHeroAsset?.declared_width;
  const expectedHeroHeight = expectedHeroAsset?.observed_height ?? expectedHeroAsset?.declared_height;
  const expectedShareWidth = expectedShareAsset?.observed_width ?? expectedShareAsset?.declared_width;
  const expectedShareHeight = expectedShareAsset?.observed_height ?? expectedShareAsset?.declared_height;
  const expectedShareMime = expectedShareAsset?.observed_mime_type ?? expectedShareAsset?.declared_mime_type;
  const schemaImageValue = Array.isArray(articleNode?.image)
    ? articleNode.image[0]
    : articleNode?.image;
  const schemaImageUrl = typeof schemaImageValue === 'string'
    ? schemaImageValue
    : schemaImageValue?.url ?? schemaImageValue?.contentUrl ?? null;
  const imageResponse = await fetchBytes(expectedHeroUrl);
  const imageDimensions = webpDimensions(imageResponse.bytes);
  const observedImageSha256 = sha256(imageResponse.bytes);
  const observedHero = {
    visible_src: readTagAttribute(heroTag, 'src') || null,
    visible_alt: readTagAttribute(heroTag, 'alt') || null,
    visible_width: Number.parseInt(readTagAttribute(heroTag, 'width'), 10) || null,
    visible_height: Number.parseInt(readTagAttribute(heroTag, 'height'), 10) || null,
    og_image: extractMetaContent(html, 'property', 'og:image'),
    og_image_alt: extractMetaContent(html, 'property', 'og:image:alt'),
    og_image_width:
      Number.parseInt(extractMetaContent(html, 'property', 'og:image:width') ?? '', 10) || null,
    og_image_height:
      Number.parseInt(extractMetaContent(html, 'property', 'og:image:height') ?? '', 10) || null,
    og_image_type: extractMetaContent(html, 'property', 'og:image:type'),
    twitter_image: extractMetaContent(html, 'name', 'twitter:image'),
    twitter_image_alt: extractMetaContent(html, 'name', 'twitter:image:alt'),
    schema_image: schemaImageUrl,
    fetched_url: imageResponse.response.url,
    fetched_status: imageResponse.response.status,
    fetched_content_type: imageResponse.response.headers.get('content-type'),
    fetched_sha256: observedImageSha256,
    fetched_dimensions: imageDimensions,
  };

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
    visible_hero_exact:
      absoluteUrl(observedHero.visible_src) === expectedHeroUrl &&
      observedHero.visible_alt === expectedHeroAsset?.alt_text &&
      observedHero.visible_width === expectedHeroWidth &&
      observedHero.visible_height === expectedHeroHeight,
    og_image_exact:
      observedHero.og_image === expectedShareUrl &&
      observedHero.og_image_alt === expectedShareAsset?.alt_text &&
      observedHero.og_image_width === expectedShareWidth &&
      observedHero.og_image_height === expectedShareHeight &&
      observedHero.og_image_type === expectedShareMime,
    twitter_image_exact:
      observedHero.twitter_image === expectedShareUrl &&
      observedHero.twitter_image_alt === expectedShareAsset?.alt_text,
    wave2_same_canonical_hero_share_asset:
      !exactWave2OwnerPolicy ||
      (expectedShareUrl === expectedHeroUrl &&
        expectedShareAsset?.sha256 === expectedHeroAsset?.sha256 &&
        expectedHeroWidth === 1200 &&
        expectedHeroHeight === 630 &&
        expectedShareMime === 'image/webp'),
    article_schema_image_exact: absoluteUrl(observedHero.schema_image) === expectedHeroUrl,
    canonical_image_binary_exact:
      imageResponse.response.status === 200 &&
      /^image\/webp(?:;|$)/i.test(observedHero.fetched_content_type ?? '') &&
      imageDimensions?.width === expectedHeroWidth &&
      imageDimensions?.height === expectedHeroHeight &&
      observedImageSha256 === (article.hero_asset_sha256 ?? article.hero_sha256),
    footer_disclosure_once: countElementsWithClass(html, 'mrx-disclaimer-footer') === 1,
    top_disclosure_absent: countElementsWithClass(html, 'mrx-disclaimer-top') === 0,
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
    expected_canonical_hero_url: expectedHeroUrl,
    expected_canonical_hero_sha256: article.hero_asset_sha256,
    expected_canonical_hero_alt: expectedHeroAsset?.alt_text ?? null,
    expected_share_url: expectedShareUrl,
    expected_share_sha256: expectedShareAsset?.sha256 ?? null,
    exact_wave2_owner_policy: exactWave2OwnerPolicy,
    observed_canonical_hero: observedHero,
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

const retainedProductionBaselineResults = [];
for (const route of retainedProductionBaselineManifest.retained_routes ?? []) {
  const { response, text: html } = await fetchText(route.page_url);
  const schemas = extractSchemaNodes(html);
  const articleNode = schemas.find((node) => {
    const type = node?.['@type'];
    return type === 'Article' || type === 'BlogPosting' ||
      (Array.isArray(type) && (type.includes('Article') || type.includes('BlogPosting')));
  });
  const h1 = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const robotsMeta = [...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*>/gi)]
    .map((match) => match[0])
    .join(' ');
  const heroFigure = html.match(
    /<figure\b[^>]*class=["'][^"']*article-hero-image[^"']*["'][^>]*>[\s\S]*?<\/figure>/i,
  )?.[0] ?? '';
  const heroTag = heroFigure.match(/<img\b[^>]*>/i)?.[0] ?? null;
  const expectedHeroUrl = new URL(route.hero_path, `${CANONICAL_ORIGIN}/`).toString();
  const schemaImageValue = Array.isArray(articleNode?.image) ? articleNode.image[0] : articleNode?.image;
  const schemaImageUrl = typeof schemaImageValue === 'string'
    ? schemaImageValue
    : schemaImageValue?.url ?? schemaImageValue?.contentUrl ?? null;
  const imageResponse = await fetchBytes(expectedHeroUrl);
  const imageDimensions = webpDimensions(imageResponse.bytes);
  const observedImageSha256 = sha256(imageResponse.bytes);
  const observedHero = {
    visible_src: readTagAttribute(heroTag, 'src') || null,
    visible_alt: readTagAttribute(heroTag, 'alt') || null,
    og_image: extractMetaContent(html, 'property', 'og:image'),
    twitter_image: extractMetaContent(html, 'name', 'twitter:image'),
    schema_image: schemaImageUrl,
    fetched_status: imageResponse.response.status,
    fetched_content_type: imageResponse.response.headers.get('content-type'),
    fetched_sha256: observedImageSha256,
    fetched_dimensions: imageDimensions,
  };
  const assertions = {
    http_200: response.status === 200,
    final_url_exact: response.url === route.page_url,
    canonical_exact: extractCanonical(html) === route.page_url,
    x_robots_indexable: !/noindex/i.test(response.headers.get('x-robots-tag') ?? ''),
    meta_robots_indexable: !/noindex/i.test(robotsMeta),
    h1_exact: h1 === route.expected_h1,
    visible_hero_exact: absoluteUrl(observedHero.visible_src) === expectedHeroUrl,
    og_image_exact: observedHero.og_image === expectedHeroUrl,
    twitter_image_exact: observedHero.twitter_image === expectedHeroUrl,
    article_schema_image_exact: absoluteUrl(observedHero.schema_image) === expectedHeroUrl,
    canonical_image_binary_exact:
      imageResponse.response.status === 200 &&
      /^image\/webp(?:;|$)/i.test(observedHero.fetched_content_type ?? '') &&
      imageDimensions?.width === 1200 &&
      imageDimensions?.height === 630 &&
      observedImageSha256 === route.hero_sha256,
  };
  retainedProductionBaselineResults.push({
    slug: route.slug,
    url: route.page_url,
    expected_h1: route.expected_h1,
    expected_hero_url: expectedHeroUrl,
    expected_hero_sha256: route.hero_sha256,
    observed_h1: h1,
    observed_hero: observedHero,
    assertions,
    disposition: Object.values(assertions).every(Boolean) ? 'PASS' : 'FAIL',
  });
}

const articleUrls = batch.articles.map((article) => article.canonical_url);
const [home, sitemap, llms, llmsFull, robots] = await Promise.all([
  fetchText(`${CANONICAL_ORIGIN}/`),
  fetchText(`${CANONICAL_ORIGIN}/sitemap-articles.xml`),
  fetchText(`${CANONICAL_ORIGIN}/llms.txt`),
  fetchText(`${CANONICAL_ORIGIN}/llms-full.txt`),
  fetchText(`${CANONICAL_ORIGIN}/robots.txt`),
]);
const primaryRedirectAlias = REDIRECT_ALIASES[0] ?? null;
const wwwResponse = primaryRedirectAlias ? await fetch(`${primaryRedirectAlias}/`, {
  redirect: 'manual',
  headers: { 'cache-control': 'no-cache', 'user-agent': 'MRX-Codex-Production-Verifier/1.0' },
}) : { status: null, headers: new Headers() };

let browserVerification = null;
if (process.env.MRX_BROWSER_VERIFICATION_JSON) {
  browserVerification = JSON.parse(process.env.MRX_BROWSER_VERIFICATION_JSON);
}

const interfaceAssertions = {
  homepage_http_200: home.response.status === 200,
  homepage_top_disclosure_absent:
    countElementsWithClass(home.text, 'mrx-disclaimer-top') === 0,
  homepage_footer_disclosure_once:
    countElementsWithClass(home.text, 'mrx-disclaimer-footer') === 1,
  www_redirects_to_apex:
    !primaryRedirectAlias ||
    ([301, 302, 307, 308].includes(wwwResponse.status) &&
      wwwResponse.headers.get('location') === `${CANONICAL_ORIGIN}/`),
  sitemap_http_200: sitemap.response.status === 200,
  sitemap_contains_all_batch_urls: articleUrls.every((url) => sitemap.text.includes(url)),
  sitemap_has_expected_public_article_urls:
    countMatches(sitemap.text, expectedBlogLocPattern) === expectedLiveBlogCount,
  expected_live_count_is_explicit_and_complete:
    Boolean(process.env.MRX_EXPECTED_LIVE_BLOG_COUNT) &&
    Number.isInteger(expectedLiveBlogCount) &&
    expectedLiveBlogCount === expectedPublicArticleUrls.length,
  llms_http_200: llms.response.status === 200,
  llms_points_to_full_public_index:
    llms.text.includes(`${CANONICAL_ORIGIN}/llms-full.txt`),
  llms_full_http_200: llmsFull.response.status === 200,
  llms_full_contains_all_batch_urls: articleUrls.every((url) => llmsFull.text.includes(url)),
  robots_http_200: robots.response.status === 200,
  robots_mentions_oai_searchbot: /User-agent:\s*OAI-SearchBot/i.test(robots.text),
  browser_home_top_disclosure_absent:
    browserVerification?.homepage?.top_disclosure_count === 0,
  browser_home_footer_disclosure_once:
    browserVerification?.homepage?.footer_disclosure_count === 1,
  browser_wave2_visual_verification_complete:
    browserVerification?.wave2?.article_count === 15 &&
    browserVerification?.wave2?.exact_titles_visible === true &&
    browserVerification?.wave2?.hero_images_visible === true &&
    browserVerification?.wave2?.no_clipping_overlap_or_garbling === true,
};

const deploymentAssertions = {
  ...validateDeploymentMetadata(deployment, CANONICAL_ORIGIN, deploymentExpectations),
  active_targets_present: activeTargetsAtRelease.length > 0,
};

const report = {
  artifact_type: 'mrx1000_release_10_post_publication_verification',
  schema_version: 1,
  generated_at_utc: verifiedAt,
  verifier: 'Codex independent production verification',
  deployment,
  deployment_expectations: deploymentExpectations,
  deployment_assertions: {
    assertions: deploymentAssertions,
    disposition: Object.values(deploymentAssertions).every(Boolean) ? 'PASS' : 'FAIL',
  },
  production_registry: {
    confirmed_active_targets_at_release: activeTargetsAtRelease,
    canonical_origin: CANONICAL_ORIGIN,
    redirect_aliases: REDIRECT_ALIASES,
    configured_but_not_active_origins: configuredButInactiveOrigins,
  },
  browser_verification: browserVerification,
  article_results: articleResults,
  retained_production_baseline: {
    manifest_path: RETAINED_PRODUCTION_BASELINE_PATH,
    route_count: retainedProductionBaselineResults.length,
    routes: retainedProductionBaselineResults,
    disposition: retainedProductionBaselineResults.every((row) => row.disposition === 'PASS')
      ? 'PASS'
      : 'FAIL',
  },
  interface_results: {
    homepage_status: home.response.status,
    sitemap_article_url_count: countMatches(sitemap.text, expectedBlogLocPattern),
    expected_public_article_url_count: expectedLiveBlogCount,
    batch_article_url_count: articleUrls.length,
    www_status: wwwResponse.status,
    www_location: wwwResponse.headers.get('location'),
    assertions: interfaceAssertions,
    disposition: Object.values(interfaceAssertions).every(Boolean) ? 'PASS' : 'FAIL',
  },
  rollback: {
    prior_verified_production_deployment:
      deployment.deployment_id
        ? `Use deployment history immediately before ${deployment.deployment_id}.`
        : 'Use the deployment history immediately before the currently promoted production target.',
    per_article: publicationManifest.rows.map((row) => ({
      program_row_id: row.program_row_id,
      slug: row.slug,
      rollback_reference: row.rollback_reference,
      procedure: row.rollback.procedure,
    })),
  },
  summary: {
    expected_articles: batch.articles.length,
    expected_live_blog_count: expectedLiveBlogCount,
    passing_articles: articleResults.filter((row) => row.disposition === 'PASS').length,
    failing_articles: articleResults.filter((row) => row.disposition === 'FAIL').length,
    retained_production_baseline_disposition: retainedProductionBaselineResults.every(
      (row) => row.disposition === 'PASS',
    )
      ? 'PASS'
      : 'FAIL',
    deployment_disposition: Object.values(deploymentAssertions).every(Boolean) ? 'PASS' : 'FAIL',
    interface_disposition: Object.values(interfaceAssertions).every(Boolean) ? 'PASS' : 'FAIL',
  },
};
report.summary.overall_disposition =
  report.summary.passing_articles === report.summary.expected_articles &&
  report.summary.failing_articles === 0 &&
  report.summary.retained_production_baseline_disposition === 'PASS' &&
  report.summary.deployment_disposition === 'PASS' &&
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
