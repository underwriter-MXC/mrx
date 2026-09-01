import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  compileDeploymentRoutes,
  DEPLOYMENT_CRONS,
  mergeDeploymentRouting,
} from '../../scripts/postbuild-vercel-routing.mjs';

const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));

interface DeploymentRoute {
  src?: string;
  dest?: string;
  status?: number;
  headers?: Record<string, string>;
  handle?: string;
  continue?: boolean;
}

function matchingRoutes(routes: DeploymentRoute[] | null, path: string) {
  return (routes ?? []).filter((route) => route.src && new RegExp(route.src).test(path));
}

describe('prebuilt Vercel deployment routing', () => {
  it('compiles the global security headers without blocking required first-party services', () => {
    const routes = compileDeploymentRoutes(vercelConfig) as DeploymentRoute[];
    const homeHeaders = matchingRoutes(routes, '/').find(
      (route) => route.headers?.['Content-Security-Policy'],
    )?.headers;

    expect(homeHeaders?.['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(homeHeaders?.['X-Content-Type-Options']).toBe('nosniff');

    const csp = homeHeaders?.['Content-Security-Policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://*.google-analytics.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('wss://*.supabase.co');
  });

  it('compiles every protected route variant into an X-Robots-Tag rule', () => {
    const routes = compileDeploymentRoutes(vercelConfig) as DeploymentRoute[];
    for (const path of [
      '/api',
      '/api/',
      '/api/missing/deep',
      '/account',
      '/account/',
      '/account/private/deep',
      '/owner-intake',
      '/owner-intake/',
      '/owner-intake/private/deep',
      '/knowledge',
      '/knowledge/',
      '/knowledge/private/deep',
      '/blog/drafts',
      '/blog/drafts/',
      '/blog/drafts/example/deep',
      '/staff',
      '/staff/',
      '/staff/private/deep',
      '/book/thank-you',
      '/book/thank-you/',
      '/free-guide/thank-you',
      '/free-guide/thank-you/',
    ]) {
      expect(
        matchingRoutes(routes, path).some(
          (route) => route.headers?.['X-Robots-Tag'] === 'noindex, nofollow',
        ),
        path,
      ).toBe(true);
    }
  });

  it('compiles the approved legacy mapping and leaves held drafts unmapped', () => {
    const routes = compileDeploymentRoutes(vercelConfig) as DeploymentRoute[];
    const approved = matchingRoutes(routes, '/blog/how-mineral-rights-ownership-works/').find(
      (route) => route.status === 308,
    );
    expect(approved?.headers?.Location).toBe(
      '/blog/how-texas-mineral-rights-ownership-works-deeds-conveyances-and-title/',
    );
    expect(
      matchingRoutes(routes, '/blog/how-to-evaluate-mineral-production-in-texas/').some(
        (route) => route.status === 308,
      ),
    ).toBe(false);
  });

  it('merges routes before the filesystem phase and remains idempotent', () => {
    const deploymentRoutes = compileDeploymentRoutes(vercelConfig) as DeploymentRoute[];
    const base = {
      version: 3,
      routes: [
        { src: '^/_astro/(.*)$', headers: { 'cache-control': 'immutable' }, continue: true },
        { handle: 'filesystem' },
        { src: '^/.*$', dest: '/404.html', status: 404 },
      ],
    };
    const first = mergeDeploymentRouting(base, deploymentRoutes, DEPLOYMENT_CRONS) as {
      version: number;
      routes: DeploymentRoute[];
      crons?: unknown[];
    };
    const second = mergeDeploymentRouting(first, deploymentRoutes, DEPLOYMENT_CRONS);
    const filesystemIndex = first.routes.findIndex(
      (route: DeploymentRoute) => route.handle === 'filesystem',
    );
    const redirectIndex = first.routes.findIndex(
      (route: DeploymentRoute) => route.headers?.Location === '/contact/',
    );
    expect(redirectIndex).toBeGreaterThanOrEqual(0);
    expect(redirectIndex).toBeLessThan(filesystemIndex);
    expect(second).toEqual(first);
    expect(vercelConfig.crons).toBeUndefined();
    expect(first.crons).toEqual(DEPLOYMENT_CRONS);
  });
});
