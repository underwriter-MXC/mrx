/**
 * MRX GA4 article-measurement context resolver.
 *
 * Implements the local wiring side of the `mrx1000-ga4-v1.1.0` taxonomy
 * defined in `reports/mrx1000-005-ga4-taxonomy.json`. This module is
 * read-only against the live GA4/GTM property: it computes low-cardinality
 * values to push into the existing `window.dataLayer` so a credential-free
 * browser test can compare manifest → DOM → dataLayer.
 *
 * Hard rules (do not relax):
 *
 * - Never emit PII, document/user values, raw referrer, or query strings.
 *   This module only ever maps to the canonical low-cardinality enums in
 *   `MRX_GA4_TAXONOMY_VERSION`. Unknown values collapse to `null` so the
 *   GTM/GA4 layer can distinguish "absent" from "invalid".
 * - `content_group` is the built-in GA4 Content group. Two values are
 *   permitted: `learning_center` for indexable Learning Center articles
 *   and `staged` for `noindex-stage` QA. Promotion requires an authorized
 *   release gate; the helper picks the value from `noindex`, not from
 *   heuristics on the URL or surrounding DOM.
 * - `content_intent` is normalized to the registered five-value enum. A
 *   legacy `local-informational` value (used in the canonical ledger for
 *   three local pilot rows) is normalized to `local` per the F6 plan.
 * - This module does not register GA4 custom definitions, mark events as
 *   key events, or push to GTM/GA4. That is owned by `mrx_ga4` +
 *   `mrx_google` per the taxonomy's required_owners map and is explicitly
 *   out of scope for this card.
 */

export const MRX_GA4_TAXONOMY_VERSION = 'mrx1000-ga4-v1.1.0' as const;

export type ContentGroup = 'learning_center' | 'staged';

export type ContentIntent =
  | 'informational'
  | 'commercial-investigation'
  | 'transactional'
  | 'navigational'
  | 'local';

export type ContentCluster =
  | 'sell-mineral-rights-decision-process'
  | 'valuation-methodology-drivers'
  | 'offer-review-buyer-comparison-safety'
  | 'inherited-estate-probate'
  | 'royalties-owner-operations'
  | 'tax-1031-legal-education'
  | 'texas-county-basin-local-intent'
  | 'title-lease-ownership-documents'
  | 'mrx-methodology-transparency-underwriter-process';

export type ContentGuide = 'travis' | 'connor' | 'clay' | 'owen' | 'laurel' | 'elena';

export type ContentProgram = 'mrx1000' | 'legacy_learning_center';

const CONTENT_INTENT_VALUES: readonly ContentIntent[] = [
  'informational',
  'commercial-investigation',
  'transactional',
  'navigational',
  'local',
];

const CONTENT_CLUSTER_VALUES: readonly ContentCluster[] = [
  'sell-mineral-rights-decision-process',
  'valuation-methodology-drivers',
  'offer-review-buyer-comparison-safety',
  'inherited-estate-probate',
  'royalties-owner-operations',
  'tax-1031-legal-education',
  'texas-county-basin-local-intent',
  'title-lease-ownership-documents',
  'mrx-methodology-transparency-underwriter-process',
];

const CONTENT_GUIDE_VALUES: readonly ContentGuide[] = [
  'travis',
  'connor',
  'clay',
  'owen',
  'laurel',
  'elena',
];

/**
 * Inputs a route or layout already has resolved. Only low-cardinality
 * fields land here; never raw user text, document names, or page state.
 */
export interface ArticleMeasurementInput {
  /** True when the page is currently noindex-stage QA. */
  noindex?: boolean;
  /** Explicit frontmatter/manifest field. */
  contentProgram?: string | null;
  /** Explicit frontmatter/manifest field. */
  contentCluster?: string | null;
  /** Explicit frontmatter/manifest field (or legacy alias). */
  contentIntent?: string | null;
  /** Resolved author-reference slug. */
  contentAuthor?: string | null;
  /** Actual rendered article guide slug. */
  contentGuide?: string | null;
  /** Explicit release-batch field. */
  contentBatch?: string | null;
}

export interface ArticleMeasurementContext {
  taxonomy_version: typeof MRX_GA4_TAXONOMY_VERSION;
  content_group: ContentGroup;
  content_program: ContentProgram | null;
  content_cluster: ContentCluster | null;
  content_intent: ContentIntent | null;
  content_author: string | null;
  content_guide: ContentGuide | null;
  content_batch: string | null;
}

function normalizeIntent(value: string | null | undefined): ContentIntent | null {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  // Legacy alias from the canonical ledger: normalize to the registered
  // 'local' value so GA4 receives one of the five allowed enums.
  if (lowered === 'local-informational') return 'local';
  if ((CONTENT_INTENT_VALUES as readonly string[]).includes(lowered)) {
    return lowered as ContentIntent;
  }
  return null;
}

function normalizeCluster(value: string | null | undefined): ContentCluster | null {
  if (!value) return null;
  const trimmed = value.trim();
  if ((CONTENT_CLUSTER_VALUES as readonly string[]).includes(trimmed)) {
    return trimmed as ContentCluster;
  }
  return null;
}

function normalizeGuide(value: string | null | undefined): ContentGuide | null {
  if (!value) return null;
  const trimmed = value.trim();
  if ((CONTENT_GUIDE_VALUES as readonly string[]).includes(trimmed)) {
    return trimmed as ContentGuide;
  }
  return null;
}

function normalizeProgram(value: string | null | undefined): ContentProgram | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === 'mrx1000') return 'mrx1000';
  if (trimmed === 'legacy_learning_center') return 'legacy_learning_center';
  return null;
}

function normalizeBatch(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Enforce the same slug constraint used in src/content/config.ts so the
  // value is safe to surface as a custom dimension.
  if (/^[a-z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}

function normalizeAuthor(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Resolve to a stable slug, never a display name. Cap length so a
  // misconfigured display name cannot inflate cardinality.
  if (!trimmed) return null;
  if (trimmed.length > 64) return null;
  return trimmed;
}

/**
 * Resolve the article measurement context. This is the single source of
 * truth for taxonomy values that BaseLayout pushes into the dataLayer.
 *
 * - `content_group` is release-state aware: noindex pages map to `staged`
 *   and indexable Learning Center pages map to `learning_center`. The
 *   caller is the only place that knows whether a page is currently
 *   public/indexable; this helper does not infer from the URL.
 * - Unrecognized values become `null` rather than passthroughs so GTM/GA4
 *   never receives a sixth content_intent, tenth content_cluster, or
 *   off-format batch slug.
 */
export function resolveArticleMeasurementContext(
  input: ArticleMeasurementInput,
): ArticleMeasurementContext {
  return {
    taxonomy_version: MRX_GA4_TAXONOMY_VERSION,
    content_group: input.noindex ? 'staged' : 'learning_center',
    content_program: normalizeProgram(input.contentProgram),
    content_cluster: normalizeCluster(input.contentCluster),
    content_intent: normalizeIntent(input.contentIntent),
    content_author: normalizeAuthor(input.contentAuthor),
    content_guide: normalizeGuide(input.contentGuide),
    content_batch: normalizeBatch(input.contentBatch),
  };
}

/**
 * Build the payload fragment BaseLayout merges into `mrx_page_view` and
 * downstream article-origin events. Returns only the fields that resolved
 * to a non-null value so the dataLayer never carries stale nulls.
 *
 * `taxonomy_version` is always present so the launch dashboard filter can
 * audit which build produced a given event.
 */
export function buildMeasurementPayload(
  context: ArticleMeasurementContext,
): Record<string, string> {
  const payload: Record<string, string> = {
    taxonomy_version: context.taxonomy_version,
    content_group: context.content_group,
  };
  if (context.content_program !== null) payload.content_program = context.content_program;
  if (context.content_cluster !== null) payload.content_cluster = context.content_cluster;
  if (context.content_intent !== null) payload.content_intent = context.content_intent;
  if (context.content_author !== null) payload.content_author = context.content_author;
  if (context.content_guide !== null) payload.content_guide = context.content_guide;
  if (context.content_batch !== null) payload.content_batch = context.content_batch;
  return payload;
}

export const MRX_GA4_TAXONOMY = {
  version: MRX_GA4_TAXONOMY_VERSION,
  contentGroup: { learning_center: 'learning_center', staged: 'staged' } as const,
  contentIntentValues: CONTENT_INTENT_VALUES,
  contentClusterValues: CONTENT_CLUSTER_VALUES,
  contentGuideValues: CONTENT_GUIDE_VALUES,
} as const;

/**
 * Map a relative or anchored href to a controlled `cta_action` enum.
 * Falls back to `other` so GA4 receives a known cardinality.
 */
export type CtaAction =
  | 'book_review'
  | 'free_guide'
  | 'ask_travis'
  | 'related_article'
  | 'phone'
  | 'email'
  | 'other';

const CTA_ACTION_HINTS: ReadonlyArray<[RegExp, CtaAction]> = [
  [/\/book(\/|$|\?)/, 'book_review'],
  [/\/free-guide(\/|$|\?)/, 'free_guide'],
  [/^#?ask-travis$/, 'ask_travis'],
  [/^tel:/, 'phone'],
  [/^mailto:/, 'email'],
];

/**
 * Best-effort `cta_action` classification from the raw href/CTA name.
 * Never throws; falls back to `other` so the event always carries a
 * valid enum value.
 */
export function classifyCtaAction(
  href: string | null | undefined,
  name: string | null | undefined,
): CtaAction {
  const haystack = `${href ?? ''} ${name ?? ''}`.toLowerCase();
  if (!haystack.trim()) return 'other';
  for (const [pattern, action] of CTA_ACTION_HINTS) {
    if (pattern.test(haystack)) return action;
  }
  if (name && /related-article/.test(name)) return 'related_article';
  return 'other';
}

/**
 * Map a CTA's DOM position to a controlled `cta_location` enum. Callers
 * pass the closest article section role. Falls back to `other`.
 */
export type CtaLocation =
  | 'header'
  | 'inline'
  | 'sidebar'
  | 'closing'
  | 'related'
  | 'footer'
  | 'other';

export function classifyCtaLocation(role: string | null | undefined): CtaLocation {
  if (!role) return 'other';
  const lowered = role.trim().toLowerCase();
  const allowed: readonly CtaLocation[] = [
    'header',
    'inline',
    'sidebar',
    'closing',
    'related',
    'footer',
    'other',
  ];
  if (allowed.includes(lowered as CtaLocation)) return lowered as CtaLocation;
  return 'other';
}

/**
 * Strip a query string and fragment before pushing `link_url` into a
 * payload. The taxonomy contract explicitly forbids raw URL query strings
 * because they may carry PII from form submissions or referrals.
 *
 * Hard privacy rules (do not relax):
 *
 * - `mailto:` URLs always contain an email address (PII). They collapse to
 *   an empty string regardless of any subsequent query/fragment.
 * - `tel:` URLs always contain a phone number (PII). They collapse to an
 *   empty string.
 * - `javascript:` URLs are an unsafe scheme and must never reach GA4.
 * - Pure fragment-only anchors (`#...`) are intentionally stripped to an
 *   empty string so the dataLayer never carries empty-payload noise.
 * - Same-site and `https:` paths retain path only; query and fragment are
 *   stripped so PII-bearing parameters (e.g. `?email=…`, `?name=…`) cannot
 *   leak.
 */
export function sanitizeLinkUrl(href: string | null | undefined): string {
  if (!href) return '';
  const trimmed = String(href).trim();
  if (!trimmed) return '';
  // Drop the unsafe / PII-bearing schemes outright. The categorical
  // `cta_action` (phone/email) already carries the click intent, so the
  // GA4 dataLayer does not need the raw target.
  if (/^(mailto|tel|javascript):/i.test(trimmed)) return '';
  // Pure fragment-only anchors carry no path payload; collapse them.
  if (trimmed.startsWith('#')) return '';
  // Strip query string and fragment on allowed same-site / https URLs.
  const noQuery = trimmed.split('?')[0] ?? '';
  return noQuery.split('#')[0] ?? '';
}

/**
 * Build the canonical `article_cta_click` payload per taxonomy §4.3.
 * `cta_name` is collected but not registered initially (per the
 * taxonomy's `do_not_register_initially` list); the rest map to
 * registered event-scoped custom dimensions.
 */
export function buildArticleCtaClickPayload(
  context: ArticleMeasurementContext,
  cta: {
    cta_name: string;
    cta_action: CtaAction;
    cta_location: CtaLocation;
    link_url: string;
  },
): Record<string, string> {
  return {
    event: 'article_cta_click',
    ...buildMeasurementPayload(context),
    cta_name: cta.cta_name,
    cta_action: cta.cta_action,
    cta_location: cta.cta_location,
    link_url: sanitizeLinkUrl(cta.link_url),
  };
}

/**
 * Build the canonical `article_scroll` payload per taxonomy §4.2.
 * `scroll_depth` is a low-cardinality enum of `p25|p50|p75|p90`.
 */
export type ScrollDepth = 'p25' | 'p50' | 'p75' | 'p90';

export const SCROLL_DEPTH_VALUES: readonly ScrollDepth[] = ['p25', 'p50', 'p75', 'p90'];

export function isScrollDepth(value: string | null | undefined): value is ScrollDepth {
  return !!value && (SCROLL_DEPTH_VALUES as readonly string[]).includes(value);
}

export function buildArticleScrollPayload(
  context: ArticleMeasurementContext,
  scroll_depth: ScrollDepth,
): Record<string, string> {
  return {
    event: 'article_scroll',
    ...buildMeasurementPayload(context),
    scroll_depth,
  };
}
