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
export const DESC_MIN = 130;
export const DESC_MAX = 160;

export function buildTitle(parts: string[], brand = 'Mineral Rights Xchange'): string {
  // Pattern: "[Value Prop] · [Brand]" (per SEO plan §1.1)
  const full = parts.filter(Boolean).join(' · ');
  return full.includes(brand) ? full : `${full} · ${brand}`;
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

export function buildOgImage(_path: string, baseUrl: string, defaultOg = '/assets/brand/mrx-underwriter-review-og.png'): string {
  return `${baseUrl}${defaultOg}`;
}
