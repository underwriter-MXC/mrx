/**
 * JSON-LD composition helpers. Per-page Seo.astro composes the page's
 * graph by importing factories from `src/structured-data/` and calling
 * `jsonLdStringify` to safely serialize the result.
 *
 * Per `SEO AEO Sitemap Schema Plan.md` §2.6 (schema build-time lint).
 */
import type { Graph } from 'schema-dts';

export function jsonLdStringify(payload: Graph | object): string {
  return JSON.stringify(payload, null, 0);
}

/**
 * Build the @graph array for a single page, preserving @context.
 * Used by Seo.astro.
 */
export function buildPageGraph(nodes: object[]): Graph {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes as Graph['@graph'],
  };
}
