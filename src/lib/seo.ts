/**
 * SEO metadata helpers. Title and description builders with length
 * validation. The §10 snippet test (Playwright) verifies the visible
 * body of every page; this module guards the frontmatter shape.
 *
 * Per `SEO AEO Sitemap Schema Plan.md` §1.
 */

// Canonical SEO budget (per `SEO AEO Sitemap Schema Plan.md` §1):
//   - Title 30-60 chars  (Google truncates at ~60 in SERPs)
//   - Description 130-160 chars (Google truncates at ~160)
// The page frontmatter zod schema mirrors these bounds. The
// Seo.astro validateTitle/validateDescription functions emit warnings
// for over-budget but never block the build, so pages in flight
// can still ship; however, the seo-frontmatter unit test enforces
// the canonical budget on the source constants.
export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const EXACT_CANONICAL_ARTICLE_TITLE_MAX = 70;
export const BRANDED_EXACT_CANONICAL_ARTICLE_TITLE_MAX =
  EXACT_CANONICAL_ARTICLE_TITLE_MAX + ' · MRX'.length;
export const DESC_MIN = 130;
export const DESC_MAX = 160;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = 'image/png';

export function buildTitle(parts: string[], brand = 'Mineral Rights Xchange'): string {
  // Pattern: "[Value Prop] · [Brand]" (per SEO plan §1.1)
  const full = parts.filter(Boolean).join(' · ');
  return full.includes(brand) ? full : `${full} · ${brand}`;
}

/**
 * Build the final article <title> without changing the visible article H1.
 * Article titles use the compact short brand so a focused SEO title can keep
 * the complete result inside the 60-character search-result budget.
 */
export function buildArticleTitle(visibleTitle: string, seoTitle?: string): string {
  const base = (seoTitle || visibleTitle).trim();
  return /\bMRX\b|Mineral Rights Xchange/i.test(base) ? base : `${base} · MRX`;
}

export function validateTitle(title: string): { ok: boolean; reason?: string } {
  if (title.length < TITLE_MIN) {
    return { ok: false, reason: `Title too short (${title.length} < ${TITLE_MIN})` };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, reason: `Title too long (${title.length} > ${TITLE_MAX})` };
  }
  return { ok: true };
}

/**
 * Article metadata normally follows the 60-character search-result budget.
 * The owner exact-title social-preview/distribution policy permits a bounded
 * exception only when `seo_title` exactly matches the finalized visible title.
 */
export function validateArticleTitle(
  visibleTitle: string,
  seoTitle?: string,
): { ok: boolean; reason?: string } {
  const finalTitle = buildArticleTitle(visibleTitle, seoTitle);
  const ordinaryValidation = validateTitle(finalTitle);
  if (ordinaryValidation.ok) return ordinaryValidation;

  const normalizedVisibleTitle = visibleTitle.trim();
  const normalizedSeoTitle = seoTitle?.trim();
  const exactCanonicalException =
    normalizedSeoTitle === normalizedVisibleTitle &&
    normalizedVisibleTitle.length <= EXACT_CANONICAL_ARTICLE_TITLE_MAX &&
    finalTitle.length <= BRANDED_EXACT_CANONICAL_ARTICLE_TITLE_MAX;

  if (exactCanonicalException) return { ok: true };
  return ordinaryValidation;
}

export function validateDescription(description: string): { ok: boolean; reason?: string } {
  if (description.length < DESC_MIN) {
    return { ok: false, reason: `Description too short (${description.length} < ${DESC_MIN})` };
  }
  if (description.length > DESC_MAX) {
    return { ok: false, reason: `Description too long (${description.length} > ${DESC_MAX})` };
  }
  return { ok: true };
}

export function buildCanonical(path: string, baseUrl: string): string {
  // Normalize trailing slash: with-slash is canonical for our routes.
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean === '/') return `${baseUrl}/`;
  return `${baseUrl}${clean.replace(/\/$/, '')}/`;
}

export function buildOgImage(
  _path: string,
  baseUrl: string,
  defaultOg = '/assets/brand/mrx-underwriter-review-og.png',
): string {
  return `${baseUrl}${defaultOg}`;
}
