import { describe, expect, it } from 'vitest';

import {
  countElementsWithClass,
  isHttpsUrl,
  normalizeHttpUrl,
  parseCsvEnv,
  readTagAttribute,
  resolveDeployment,
  resolveDeploymentExpectations,
  validateDeploymentMetadata,
} from '../../scripts/_mrx1000-production-verification.mjs';

describe('mrx1000 production verification helpers', () => {
  it('reads quoted attributes without truncating apostrophes in the value', () => {
    const tag = `<img alt="A Landowner's Guide educational illustration" src='/hero.webp'>`;

    expect(readTagAttribute(tag, 'alt')).toBe(
      "A Landowner's Guide educational illustration",
    );
    expect(readTagAttribute(tag, 'src')).toBe('/hero.webp');
  });

  it('counts disclosure class tokens without counting inline CSS selectors', () => {
    const html = `<style>.mrx-disclaimer-top{display:none}.mrx-disclaimer-footer{color:#fff}</style>
      <footer class="site-footer mrx-disclaimer-footer"></footer>`;

    expect(countElementsWithClass(html, 'mrx-disclaimer-top')).toBe(0);
    expect(countElementsWithClass(html, 'mrx-disclaimer-footer')).toBe(1);
  });

  it('parses CSV environment variables without empty entries', () => {
    expect(
      parseCsvEnv(
        { MRX_ACTIVE_PRODUCTION_TARGETS: 'vercel-origin-via-cloudflare-apex, ,cloudflare-alias' },
        'MRX_ACTIVE_PRODUCTION_TARGETS',
      ),
    ).toEqual(['vercel-origin-via-cloudflare-apex', 'cloudflare-alias']);
  });

  it('resolves deployment metadata from environment-shaped input', () => {
    expect(
      resolveDeployment({
        MRX_DEPLOY_PROVIDER: 'vercel',
        MRX_DEPLOY_PROJECT: 'team-mrx/mrx-web',
        MRX_DEPLOYMENT_ID: 'dpl_123456789',
        MRX_DEPLOYMENT_URL: 'https://mrx-web-git-main.vercel.app',
        MRX_DEPLOYMENT_INSPECT_URL:
          'https://vercel.com/team-mrx/mrx-web/deployments/dpl_123456789',
        MRX_DEPLOYED_ALIAS: 'https://mineralrightsxchange.com',
      }),
    ).toMatchObject({
      provider: 'vercel',
      project: 'team-mrx/mrx-web',
      deployment_id: 'dpl_123456789',
      deployment_url: 'https://mrx-web-git-main.vercel.app',
      promoted_alias: 'https://mineralrightsxchange.com',
    });
  });

  it('resolves explicit deployment expectations from environment-shaped input', () => {
    expect(
      resolveDeploymentExpectations({
        MRX_EXPECTED_DEPLOY_PROVIDER: 'vercel',
        MRX_EXPECTED_DEPLOY_PROJECT: 'team-mrx/mrx-web',
      }),
    ).toEqual({
      provider: 'vercel',
      project: 'team-mrx/mrx-web',
    });
  });

  it('defaults deployment expectations to the Vercel MRX project when env is absent', () => {
    expect(resolveDeploymentExpectations({})).toEqual({
      provider: 'vercel',
      project: 'team-mrx/mrx-web',
    });
  });

  it('fails closed when deployment metadata is missing', () => {
    const assertions = validateDeploymentMetadata(
      resolveDeployment({}),
      'https://mineralrightsxchange.com',
      resolveDeploymentExpectations({
        MRX_EXPECTED_DEPLOY_PROVIDER: 'vercel',
        MRX_EXPECTED_DEPLOY_PROJECT: 'team-mrx/mrx-web',
      }),
    );
    expect(assertions.provider_present).toBe(false);
    expect(assertions.provider_exact).toBe(false);
    expect(assertions.project_present).toBe(false);
    expect(assertions.project_exact).toBe(false);
    expect(assertions.deployment_id_present).toBe(false);
    expect(assertions.deployment_url_https).toBe(false);
    expect(assertions.deployment_url_vercel_hostname).toBe(false);
    expect(assertions.promoted_alias_https).toBe(false);
    expect(assertions.promoted_alias_matches_canonical_origin).toBe(false);
  });

  it('fails closed when deployment metadata is malformed', () => {
    const assertions = validateDeploymentMetadata(
      resolveDeployment({
        MRX_DEPLOY_PROVIDER: 'cloudflare',
        MRX_DEPLOY_PROJECT: 'wrong-team/wrong-project',
        MRX_DEPLOYMENT_ID: 'bad id with spaces',
        MRX_DEPLOYMENT_URL: 'https://not-vercel.example.com',
        MRX_DEPLOYMENT_INSPECT_URL: 'https://example.com/not-vercel',
        MRX_DEPLOYED_ALIAS: 'https://www.mineralrightsxchange.com',
      }),
      'https://mineralrightsxchange.com',
      resolveDeploymentExpectations({
        MRX_EXPECTED_DEPLOY_PROVIDER: 'vercel',
        MRX_EXPECTED_DEPLOY_PROJECT: 'team-mrx/mrx-web',
      }),
    );
    expect(assertions.provider_present).toBe(true);
    expect(assertions.provider_exact).toBe(false);
    expect(assertions.project_present).toBe(true);
    expect(assertions.project_exact).toBe(false);
    expect(assertions.deployment_id_format).toBe(false);
    expect(assertions.deployment_url_https).toBe(true);
    expect(assertions.deployment_url_vercel_hostname).toBe(false);
    expect(assertions.inspect_url_https_or_absent).toBe(true);
    expect(assertions.inspect_url_vercel_or_absent).toBe(false);
    expect(assertions.inspect_url_contains_expected_project_or_absent).toBe(false);
    expect(assertions.promoted_alias_https).toBe(true);
    expect(assertions.promoted_alias_matches_canonical_origin).toBe(false);
  });

  it('accepts exact Vercel deployment metadata when it matches the configured expectation', () => {
    const assertions = validateDeploymentMetadata(
      resolveDeployment({
        MRX_DEPLOY_PROVIDER: 'vercel',
        MRX_DEPLOY_PROJECT: 'team-mrx/mrx-web',
        MRX_DEPLOYMENT_ID: 'dpl_123456789',
        MRX_DEPLOYMENT_URL: 'https://mrx-web-git-main.vercel.app',
        MRX_DEPLOYMENT_INSPECT_URL:
          'https://vercel.com/team-mrx/mrx-web/deployments/dpl_123456789',
        MRX_DEPLOYED_ALIAS: 'https://mineralrightsxchange.com',
      }),
      'https://mineralrightsxchange.com',
      resolveDeploymentExpectations({
        MRX_EXPECTED_DEPLOY_PROVIDER: 'vercel',
        MRX_EXPECTED_DEPLOY_PROJECT: 'team-mrx/mrx-web',
      }),
    );
    expect(Object.values(assertions).every(Boolean)).toBe(true);
  });

  it('accepts the Vercel dashboard inspect path that omits the dpl_ prefix', () => {
    const assertions = validateDeploymentMetadata(
      resolveDeployment({
        MRX_DEPLOY_PROVIDER: 'vercel',
        MRX_DEPLOY_PROJECT: 'team-mrx/mrx-web',
        MRX_DEPLOYMENT_ID: 'dpl_BuhPMTDQ2tgeaiPttciBPhkkx821',
        MRX_DEPLOYMENT_URL: 'https://mrx-146cwpkcw-team-mrx.vercel.app',
        MRX_DEPLOYMENT_INSPECT_URL:
          'https://vercel.com/team-mrx/mrx-web/BuhPMTDQ2tgeaiPttciBPhkkx821',
        MRX_DEPLOYED_ALIAS: 'https://mineralrightsxchange.com',
      }),
      'https://mineralrightsxchange.com',
      resolveDeploymentExpectations({
        MRX_EXPECTED_DEPLOY_PROVIDER: 'vercel',
        MRX_EXPECTED_DEPLOY_PROJECT: 'team-mrx/mrx-web',
      }),
    );
    expect(Object.values(assertions).every(Boolean)).toBe(true);
  });

  it('normalizes and validates https URLs', () => {
    expect(isHttpsUrl('https://mineralrightsxchange.com')).toBe(true);
    expect(isHttpsUrl('http://mineralrightsxchange.com')).toBe(false);
    expect(normalizeHttpUrl('/blog/example/', 'https://mineralrightsxchange.com')).toBe(
      'https://mineralrightsxchange.com/blog/example/',
    );
  });
});
