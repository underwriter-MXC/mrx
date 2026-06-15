// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const SITE = 'https://mineralrightsxchange.com';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET ?? 'cloudflare';
const isHetzner = DEPLOY_TARGET === 'hetzner';
const isVercel = DEPLOY_TARGET === 'vercel';

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
  output: 'server',
  // Public lead-capture POST routes are intentionally form-postable behind the
  // production reverse proxy. Same-origin checks are enforced by the proxy
  // host/canonical domain rather than Astro's adapter-level development guard,
  // which rejects localhost/Hetzner proxy submissions before route validation.
  security: { checkOrigin: false },
  adapter: isHetzner
    ? node({ mode: 'standalone' })
    : isVercel
      ? vercel()
      : cloudflare({ platformProxy: { enabled: true } }),
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/blog/drafts/') && !page.includes('/api/'),
    }),
    sitemapPriorityIntegration,
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    ssr: { external: ['@astrojs/cloudflare'] },
  },
});
