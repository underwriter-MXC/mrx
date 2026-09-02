/**
 * MRX1000-038 focused tests for the local GA4 article taxonomy wiring.
 *
 * These tests verify the read-only wiring changes for
 * `reports/mrx1000-005-ga4-taxonomy.json` (taxonomy version
 * `mrx1000-ga4-v1.1.0`):
 *
 * 1. The shared resolver returns the seven low-cardinality taxonomy
 *    fields plus the `taxonomy_version` pin, never emits PII/document/user
 *    values, and collapses unknown values to `null`.
 * 2. `BaseLayout.astro` preserves the GT-WFMD2MXW loader, the gtag init,
 *    the legacy `mrx_page_view` / `book_cta_click` / `cta_click` events,
 *    and the dataLayer init — and additionally emits the canonical
 *    `article_cta_click` and `article_scroll` events only when the
 *    `measurement` prop is passed.
 * 3. `ArticleLayout.astro` forwards the `measurement` prop and exposes
 *    `data-article-section` on each CTA-bearing section so the inline
 *    script can derive `cta_location`.
 * 4. The staged pilot page route wires a `content_group=staged` context,
 *    while the public `/blog/[...slug]` route wires
 *    `content_group=learning_center`.
 *
 * No GA4/GTM mutation, no publish, no deploy. Verification is local.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MRX_GA4_TAXONOMY_VERSION,
  buildArticleCtaClickPayload,
  buildArticleScrollPayload,
  buildMeasurementPayload,
  classifyCtaAction,
  classifyCtaLocation,
  resolveArticleMeasurementContext,
  sanitizeLinkUrl,
} from '../../src/lib/ga4-measurement';
import type { ArticleMeasurementContext } from '../../src/lib/ga4-measurement';

const baseLayout = readFileSync(
  new URL('../../src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
);
const articleLayout = readFileSync(
  new URL('../../src/layouts/ArticleLayout.astro', import.meta.url),
  'utf8',
);
const postLayout = readFileSync(
  new URL('../../src/layouts/PostLayout.astro', import.meta.url),
  'utf8',
);
const blogRoute = readFileSync(
  new URL('../../src/pages/blog/[...slug].astro', import.meta.url),
  'utf8',
);
const stagedRoute = readFileSync(
  new URL('../../src/pages/staged/mrx1000/pilot-001/[slug].astro', import.meta.url),
  'utf8',
);

describe('MRX1000-038 — ga4-measurement resolver', () => {
  it('pins the canonical taxonomy version mrx1000-ga4-v1.1.0', () => {
    expect(MRX_GA4_TAXONOMY_VERSION).toBe('mrx1000-ga4-v1.1.0');
  });

  it('maps an mrx1000 pilot post to the seven registered taxonomy fields', () => {
    const context = resolveArticleMeasurementContext({
      noindex: true,
      contentProgram: 'mrx1000',
      contentCluster: 'inherited-estate-probate',
      contentIntent: 'informational',
      contentAuthor: 'marisol',
      contentGuide: 'travis',
      contentBatch: 'pilot-001',
    });
    expect(context).toEqual({
      taxonomy_version: 'mrx1000-ga4-v1.1.0',
      content_group: 'staged',
      content_program: 'mrx1000',
      content_cluster: 'inherited-estate-probate',
      content_intent: 'informational',
      content_author: 'marisol',
      content_guide: 'travis',
      content_batch: 'pilot-001',
    });
  });

  it('maps a published (indexable) Learning Center article to content_group=learning_center', () => {
    const context = resolveArticleMeasurementContext({
      noindex: false,
      contentProgram: 'mrx1000',
      contentCluster: 'valuation-methodology-drivers',
      contentIntent: 'commercial-investigation',
      contentAuthor: 'graham',
      contentGuide: 'connor',
      contentBatch: 'pilot-001',
    });
    expect(context.content_group).toBe('learning_center');
  });

  it('collapses unknown content_intent to null instead of emitting a sixth enum value', () => {
    const context = resolveArticleMeasurementContext({
      contentIntent: 'purchase-stage',
    });
    expect(context.content_intent).toBeNull();
  });

  it('normalizes the legacy local-informational alias to the registered local value', () => {
    const context = resolveArticleMeasurementContext({
      contentIntent: 'local-informational',
    });
    expect(context.content_intent).toBe('local');
  });

  it('collapses unknown content_cluster and content_guide to null', () => {
    const context = resolveArticleMeasurementContext({
      contentCluster: 'mystery-cluster',
      contentGuide: 'phantom-guide',
    });
    expect(context.content_cluster).toBeNull();
    expect(context.content_guide).toBeNull();
  });

  it('rejects off-format batch slugs to keep content_batch low-cardinality', () => {
    const context = resolveArticleMeasurementContext({
      contentBatch: 'Pilot 001 / wave 2',
    });
    expect(context.content_batch).toBeNull();
  });

  it('never echoes unknown content_program values through to the dataLayer', () => {
    const context = resolveArticleMeasurementContext({
      contentProgram: 'mrx-1001-future',
    });
    expect(context.content_program).toBeNull();
  });

  it('buildMeasurementPayload omits null fields so the dataLayer stays compact', () => {
    const context = resolveArticleMeasurementContext({
      noindex: false,
      contentProgram: 'mrx1000',
      contentCluster: 'sell-mineral-rights-decision-process',
    });
    const payload = buildMeasurementPayload(context);
    expect(payload.taxonomy_version).toBe('mrx1000-ga4-v1.1.0');
    expect(payload.content_group).toBe('learning_center');
    expect(payload.content_program).toBe('mrx1000');
    expect(payload.content_cluster).toBe('sell-mineral-rights-decision-process');
    expect(payload).not.toHaveProperty('content_intent');
    expect(payload).not.toHaveProperty('content_author');
    expect(payload).not.toHaveProperty('content_guide');
    expect(payload).not.toHaveProperty('content_batch');
  });

  it('classifies CTA actions into the registered enum and falls back to other', () => {
    expect(classifyCtaAction('/book/', 'pilot-foo-cta-book')).toBe('book_review');
    expect(classifyCtaAction('/free-guide/', 'fg-cta')).toBe('free_guide');
    expect(classifyCtaAction('tel:+15551234567', 'phone-cta')).toBe('phone');
    expect(classifyCtaAction('mailto:foo@bar.com', 'mail-cta')).toBe('email');
    expect(classifyCtaAction('/blog/other/', 'related-article-card')).toBe('related_article');
    expect(classifyCtaAction('/something/', 'misc')).toBe('other');
  });

  it('classifies CTA locations into the registered enum', () => {
    expect(classifyCtaLocation('header')).toBe('header');
    expect(classifyCtaLocation('sidebar')).toBe('sidebar');
    expect(classifyCtaLocation('related')).toBe('related');
    expect(classifyCtaLocation('inline')).toBe('inline');
    expect(classifyCtaLocation('closing')).toBe('closing');
    expect(classifyCtaLocation('footer')).toBe('footer');
    expect(classifyCtaLocation('totally-unknown')).toBe('other');
    expect(classifyCtaLocation(undefined)).toBe('other');
  });

  it('sanitizes link_url by stripping query strings, fragments, and PII-bearing schemes', () => {
    // Same-site / https: path survives with query and fragment stripped.
    expect(sanitizeLinkUrl('/book/?email=foo@bar.com')).toBe('/book/');
    expect(sanitizeLinkUrl('https://example.com/page#section')).toBe('https://example.com/page');
    expect(sanitizeLinkUrl('https://example.com/page?utm_source=x&name=jane')).toBe(
      'https://example.com/page',
    );
    // mailto: and tel: are collapsed to '' because the URL body itself is
    // PII. The categorical `cta_action` already carries the click intent.
    expect(sanitizeLinkUrl('mailto:foo@bar.com')).toBe('');
    expect(sanitizeLinkUrl('mailto:foo@bar.com?subject=hi')).toBe('');
    expect(sanitizeLinkUrl('tel:+155****4567')).toBe('');
    expect(sanitizeLinkUrl('tel:+155****4567?foo=bar')).toBe('');
    // javascript: must never reach GA4.
    expect(sanitizeLinkUrl('javascript:alert(1)')).toBe('');
    // Fragment-only anchors collapse to empty string.
    expect(sanitizeLinkUrl('#section')).toBe('');
    // Empty / whitespace / null inputs are safe no-ops.
    expect(sanitizeLinkUrl('')).toBe('');
    expect(sanitizeLinkUrl('   ')).toBe('');
    expect(sanitizeLinkUrl(null)).toBe('');
    expect(sanitizeLinkUrl(undefined)).toBe('');
  });

  it('buildArticleCtaClickPayload carries the seven taxonomy fields plus cta_* and link_url', () => {
    const context = resolveArticleMeasurementContext({
      noindex: false,
      contentProgram: 'mrx1000',
      contentCluster: 'inherited-estate-probate',
      contentIntent: 'informational',
      contentAuthor: 'marisol',
      contentGuide: 'travis',
      contentBatch: 'pilot-001',
    });
    const payload = buildArticleCtaClickPayload(context, {
      cta_name: 'pilot-foo-cta-book',
      cta_action: 'book_review',
      cta_location: 'closing',
      link_url: '/book/?ref=leak',
    });
    expect(payload.event).toBe('article_cta_click');
    expect(payload.taxonomy_version).toBe('mrx1000-ga4-v1.1.0');
    expect(payload.content_group).toBe('learning_center');
    expect(payload.content_program).toBe('mrx1000');
    expect(payload.content_cluster).toBe('inherited-estate-probate');
    expect(payload.content_intent).toBe('informational');
    expect(payload.content_author).toBe('marisol');
    expect(payload.content_guide).toBe('travis');
    expect(payload.content_batch).toBe('pilot-001');
    expect(payload.cta_name).toBe('pilot-foo-cta-book');
    expect(payload.cta_action).toBe('book_review');
    expect(payload.cta_location).toBe('closing');
    // Query strings stripped — privacy-safe.
    expect(payload.link_url).toBe('/book/');
  });

  it('buildArticleScrollPayload carries the seven taxonomy fields plus scroll_depth', () => {
    const context: ArticleMeasurementContext = {
      taxonomy_version: 'mrx1000-ga4-v1.1.0',
      content_group: 'staged',
      content_program: 'mrx1000',
      content_cluster: 'tax-1031-legal-education',
      content_intent: 'local',
      content_author: 'laurel',
      content_guide: 'laurel',
      content_batch: 'pilot-001',
    };
    const payload = buildArticleScrollPayload(context, 'p50');
    expect(payload.event).toBe('article_scroll');
    expect(payload.scroll_depth).toBe('p50');
    expect(payload.content_group).toBe('staged');
    expect(payload.content_cluster).toBe('tax-1031-legal-education');
  });
});

describe('MRX1000-038 — BaseLayout preserves the existing GA4 surface', () => {
  it('still pins the verified Google Tag ID and supports PUBLIC_GOOGLE_TAG_ID / PUBLIC_GTM_ID overrides', () => {
    expect(baseLayout).toContain("'GT-WFMD2MXW'");
    expect(baseLayout).toContain('import.meta.env.PUBLIC_GOOGLE_TAG_ID');
    expect(baseLayout).toContain('import.meta.env.PUBLIC_GTM_ID');
  });

  it('still loads gtag.js and initializes the configured tag', () => {
    expect(baseLayout).toContain('https://www.googletagmanager.com/gtag/js?id=${googleTagId}');
    expect(baseLayout).toContain("window.gtag('js', new Date())");
    expect(baseLayout).toContain("window.gtag('config', googleTagId)");
  });

  it('still emits the recommended mrx_page_view event', () => {
    expect(baseLayout).toContain("event: 'mrx_page_view'");
  });

  it('still emits the legacy book_cta_click and cta_click aliases for backward compatibility', () => {
    expect(baseLayout).toContain("event: 'book_cta_click'");
    expect(baseLayout).toContain("event: 'cta_click'");
  });

  it('still emits phone_click and mailto_click for backward compatibility', () => {
    expect(baseLayout).toContain("event: 'phone_click'");
    expect(baseLayout).toContain("event: 'mailto_click'");
  });

  it('never pushes raw referrer, document, user values, or PII into the dataLayer', () => {
    // The script must never read document.referrer directly into a custom
    // dimension; GTM/GA4 already captures referrer via built-in fields.
    expect(baseLayout).not.toMatch(/document\.referrer\s*[:,]/);
    // No raw prompt / question text forwarding.
    expect(baseLayout).not.toMatch(/mrx_ai_prompt/);
  });

  it('drops mailto:, tel:, and javascript: schemes from the inline __mrxSanitizeLinkUrl helper', () => {
    // The inline JS sanitizer must match the TS contract: drop the
    // PII-bearing schemes outright. Look at the helper's literal source so
    // a future contributor can't accidentally regress the regex or the
    // `return ''` branch.
    const inlineHelperMatch = baseLayout.match(/function __mrxSanitizeLinkUrl[\s\S]*?\n\s{6}\}/);
    expect(inlineHelperMatch, 'inline __mrxSanitizeLinkUrl helper must exist').not.toBeNull();
    const helper = inlineHelperMatch?.[0] ?? '';
    expect(helper).toContain('(mailto|tel|javascript):');
    expect(helper).toMatch(/return\s+''/);
    // No stray `return trimmed` inside the inline helper that would
    // re-introduce the PII leak the resolver closed.
    expect(helper).not.toMatch(/return\s+trimmed/);
  });

  it('strips query and fragment from page_location on article-context events', () => {
    // __mrxSafePageLocation must return origin + pathname only. Search/hash
    // are dropped so PII-bearing parameters (?email=, utm_term with PII)
    // cannot leak through the article events.
    expect(baseLayout).toContain('function __mrxSafePageLocation()');
    expect(baseLayout).toContain('url.origin + url.pathname');
    // __mrxParams must use the privacy-safe origin+pathname for every
    // event. Legacy marketing events keep UTM/click-id traffic-source
    // fields below, but never raw query/hash-bearing page_location.
    expect(baseLayout).toContain('pageLocation = __mrxSafePageLocation()');
    // Raw UTM values and click IDs must be gated behind `!articleCtx`.
    expect(baseLayout).toMatch(/if\s*\(\s*!articleCtx\s*\)/);
    expect(baseLayout).toContain("url.searchParams.get('utm_source') || undefined");
  });

  it('sanitizes legacy book_cta_click / cta_click hrefs when article context exists', () => {
    // The legacy CTA events must funnel their href through the inline
    // sanitizer when an article measurement context is present, so a
    // `mailto:foo@bar.com` article CTA never lands in the dataLayer.
    expect(baseLayout).toMatch(
      /legacyHref\s*=\s*__mrxHasArticleContext\(\)\s*\?\s*__mrxSanitizeLinkUrl\(href\)\s*:\s*href/,
    );
  });

  it('suppresses phone and email PII in legacy click events on article pages', () => {
    expect(baseLayout).toMatch(
      /event:\s*'phone_click'[\s\S]*?link_text:\s*articleCtx\s*\?\s*'phone'[\s\S]*?link_url:\s*articleCtx\s*\?\s*__mrxSanitizeLinkUrl\(href\)\s*:\s*href/,
    );
    expect(baseLayout).toMatch(
      /event:\s*'mailto_click'[\s\S]*?link_text:\s*articleCtx\s*\?\s*'email'[\s\S]*?link_url:\s*articleCtx\s*\?\s*__mrxSanitizeLinkUrl\(href\)\s*:\s*href/,
    );
  });

  it('accepts the measurement prop and exposes its values on the body for DOM verification', () => {
    // The TS prop declaration pins the type and the optional/null default.
    expect(baseLayout).toMatch(/measurement\?:\s*ArticleMeasurementContext\s*\|\s*null/);
    expect(baseLayout).toContain('data-content-group');
    expect(baseLayout).toContain('data-content-program');
    expect(baseLayout).toContain('data-content-cluster');
    expect(baseLayout).toContain('data-content-intent');
    expect(baseLayout).toContain('data-content-author');
    expect(baseLayout).toContain('data-content-guide');
    expect(baseLayout).toContain('data-content-batch');
    expect(baseLayout).toContain('data-taxonomy-version');
  });

  it('merges the measurement payload into mrx_page_view', () => {
    // The DOMContentLoaded handler must consult __mrxMeasurement and merge
    // the seven taxonomy fields onto mrx_page_view when present.
    expect(baseLayout).toMatch(/__mrxMeasurementPayload\(\{\s*event:\s*'mrx_page_view'\s*\}\)/);
  });

  it('emits the canonical article_cta_click only when measurement is provided', () => {
    expect(baseLayout).toContain("event: 'article_cta_click'");
    expect(baseLayout).toMatch(/if\s*\(\s*__mrxMeasurement\s*\)/);
  });

  it('installs an article_scroll tracker keyed on the data-article-layout element', () => {
    expect(baseLayout).toContain("event: 'article_scroll'");
    expect(baseLayout).toContain('[data-article-layout]');
    // The four low-cardinality scroll depths are hard-coded.
    expect(baseLayout).toContain("'p25'");
    expect(baseLayout).toContain("'p50'");
    expect(baseLayout).toContain("'p75'");
    expect(baseLayout).toContain("'p90'");
  });
});

describe('MRX1000-038 — ArticleLayout forwards measurement and exposes cta_location', () => {
  it('forwards the measurement prop to BaseLayout', () => {
    expect(articleLayout).toMatch(/measurement=\{\s*measurement\s*\}/);
  });

  it('exposes data-article-section on each CTA-bearing section so the inline classifier can derive cta_location', () => {
    expect(articleLayout).toContain('data-article-section="content"');
    expect(articleLayout).toContain('data-article-section="header"');
    expect(articleLayout).toContain('data-article-section="inline"');
    expect(articleLayout).toContain('data-article-section="sidebar"');
    expect(articleLayout).toContain('data-article-section="related"');
  });
});

describe('MRX1000-038 — PostLayout forwards measurement for staged pilot routes', () => {
  it('forwards the measurement prop to BaseLayout', () => {
    expect(postLayout).toMatch(/measurement=\{\s*measurement\s*\}/);
  });
});

describe('MRX1000-038 — article routes wire the measurement context', () => {
  it('public /blog/[...slug] resolves measurement with noindex=false', () => {
    expect(blogRoute).toContain('resolveArticleMeasurementContext');
    expect(blogRoute).toMatch(/noindex:\s*post\.data\.noindex\s*===\s*true/);
    expect(blogRoute).toContain('measurement={measurement}');
  });

  it('staged /staged/mrx1000/pilot-001/[slug] resolves measurement with noindex=true and content_batch=pilot-001', () => {
    expect(stagedRoute).toContain('resolveArticleMeasurementContext');
    expect(stagedRoute).toMatch(/noindex:\s*true/);
    expect(stagedRoute).toContain("contentBatch: post.data.content_batch ?? 'pilot-001'");
    expect(stagedRoute).toContain('measurement={measurement}');
    // The route also sets the SEO noindex path on the layout.
    expect(stagedRoute).toContain('noindex={true}');
    expect(stagedRoute).toContain('robots="noindex, follow"');
  });
});
