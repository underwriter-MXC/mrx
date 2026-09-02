// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const SITE = 'https://mineralrightsxchange.com';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET ?? 'cloudflare';
const isHetzner = DEPLOY_TARGET === 'hetzner';
const isVercel = DEPLOY_TARGET === 'vercel';

// Keep previously published staff links working while the public identities use
// their new MRX names. Astro applies these permanent redirects on every adapter.
const legacyStaffRedirects = {
  '/team/tommy': '/team/travis/',
  '/team/cooper': '/team/connor/',
  '/team/charlie': '/team/clay/',
  '/team/dale': '/team/owen/',
  '/team/rebecca': '/team/laurel/',
  '/team/angela': '/team/elena/',
  '/team/walt': '/team/wade/',
  '/team/monty': '/team/graham/',
  '/team/cami': '/team/cora/',
  '/team/ariana': '/team/marisol/',
  '/team/ainsley': '/team/paige/',
  '/authors/tommy': '/authors/travis/',
  '/authors/dale': '/authors/owen/',
  '/authors/rebecca': '/authors/laurel/',
  '/authors/walt': '/authors/wade/',
  '/authors/monty': '/authors/graham/',
  '/authors/ariana': '/authors/marisol/',
};

const publicStaffNameReplacements = [
  ['Tommy', 'Travis'],
  ['Cooper', 'Connor'],
  ['Charlie', 'Clay'],
  ['Dale', 'Owen'],
  ['Rebecca', 'Laurel'],
  ['Angela', 'Elena'],
  ['Walt', 'Wade'],
  ['Monty', 'Graham'],
  ['Cami', 'Cora'],
  ['Ariana', 'Marisol'],
  ['Ainsley', 'Paige'],
];

/** @param {string} value */
function canonicalizePublicStaffNames(value) {
  return publicStaffNameReplacements.reduce((result, [legacy, current]) => {
    return result
      .replaceAll(legacy, current)
      .replaceAll(legacy.toLowerCase(), current.toLowerCase())
      .replaceAll(legacy.toUpperCase(), current.toUpperCase());
  }, value);
}

function rehypeCanonicalStaffNames() {
  /** @param {any} tree */
  const transformTree = (tree) => {
    /** @param {any} node */
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.value === 'string') node.value = canonicalizePublicStaffNames(node.value);
      if (node.properties && typeof node.properties === 'object') {
        for (const [key, value] of Object.entries(node.properties)) {
          if (typeof value === 'string') node.properties[key] = canonicalizePublicStaffNames(value);
          if (Array.isArray(value)) {
            node.properties[key] = value.map((item) =>
              typeof item === 'string' ? canonicalizePublicStaffNames(item) : item,
            );
          }
        }
      }
      if (Array.isArray(node.attributes)) {
        for (const attribute of node.attributes) {
          if (attribute && typeof attribute.value === 'string') {
            attribute.value = canonicalizePublicStaffNames(attribute.value);
          }
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
  return transformTree;
}

/**
 * Postbuild integration: rewrite per-page priorities in dist/sitemap-0.xml
 * after the sitemap integration has written it. The @astrojs/sitemap
 * integration only supports a flat `priority` number, but SEO best
 * practice (and our internal SEO plan §1.4) wants per-path priorities:
 *
 *   - homepage:                 1.0
 *   - core marketing pages:     0.9
 *   - blog index + posts:       0.8
 *   - blog category:            0.7
 *   - legal:                    0.4
 *   - thank-you / utility:      0.3
 */
const sitemapPriorityIntegration = {
  name: 'mrx-sitemap-priority',
  hooks: {
    'astro:build:done': async () => {
      // Run the postbuild script in-process. We import the file
      // directly via file URL so the script is resolved relative to
      // this config file, not the project root.
      const url = new URL('./scripts/postbuild-sitemap.mjs', import.meta.url);
      await import(url.href);
      const canonicalLinksUrl = new URL('./scripts/postbuild-canonical-links.mjs', import.meta.url);
      const { rewriteRenderedInternalLinks } = await import(canonicalLinksUrl.href);
      await rewriteRenderedInternalLinks();
    },
  },
};

// Astro 5 hybrid model: output: 'server' is the default in Astro 5 when
// the cloudflare adapter is set. Per-page prerender = true is added to
// every marketing page (so the static surface is 100% prerendered HTML)
// while the 2 hybrid API routes ship as Cloudflare Functions. This is
// the canonical "static + 2 server" pattern for Astro 5 on CF Pages.
export default defineConfig({
  site: SITE,
  redirects: legacyStaffRedirects,
  output: 'server',
  build: { inlineStylesheets: 'always' },
  security: { checkOrigin: true },
  adapter: isHetzner
    ? node({ mode: 'standalone' })
    : isVercel
      ? vercel()
      : cloudflare({ platformProxy: { enabled: true } }),
  integrations: [
    mdx({ rehypePlugins: [rehypeCanonicalStaffNames] }),
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return (
          !pathname.includes('/blog/drafts/') &&
          !pathname.includes('/api/') &&
          !pathname.startsWith('/account') &&
          !pathname.startsWith('/communication-preferences') &&
          !pathname.startsWith('/owner-intake') &&
          !pathname.startsWith('/staff') &&
          !pathname.startsWith('/staged/') &&
          !pathname.includes('/thank-you') &&
          pathname !== '/404/' &&
          pathname !== '/500/'
        );
      },
    }),
    sitemapPriorityIntegration,
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    ssr: { external: ['@astrojs/cloudflare'] },
  },
});
