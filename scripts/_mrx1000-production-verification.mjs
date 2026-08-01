export function parseCsvEnv(env, name, fallback = '') {
  return String(env?.[name] ?? fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveDeployment(env = process.env) {
  return {
    provider: env.MRX_DEPLOY_PROVIDER ?? 'unknown',
    project: env.MRX_DEPLOY_PROJECT ?? null,
    deployment_id: env.MRX_DEPLOYMENT_ID ?? null,
    deployment_url: env.MRX_DEPLOYMENT_URL ?? null,
    inspect_url: env.MRX_DEPLOYMENT_INSPECT_URL ?? null,
    promoted_alias: env.MRX_DEPLOYED_ALIAS ?? null,
  };
}

export function resolveDeploymentExpectations(env = process.env) {
  return {
    provider: env.MRX_EXPECTED_DEPLOY_PROVIDER ?? 'vercel',
    project: env.MRX_EXPECTED_DEPLOY_PROJECT ?? 'team-mrx/mrx-web',
  };
}

export function isHttpsUrl(value) {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * @param {unknown} value
 * @param {string | URL | undefined} base
 */
export function normalizeHttpUrl(value, base = undefined) {
  if (!value) return null;
  try {
    return new URL(String(value), base).toString();
  } catch {
    return null;
  }
}

export function validateDeploymentMetadata(
  deployment,
  canonicalOrigin,
  expectations = resolveDeploymentExpectations(),
) {
  const canonical = normalizeHttpUrl(canonicalOrigin);
  const promotedAlias = normalizeHttpUrl(deployment.promoted_alias);
  const deploymentUrl = normalizeHttpUrl(deployment.deployment_url);
  const inspectUrl = normalizeHttpUrl(deployment.inspect_url);
  const deploymentHostname = deploymentUrl ? new URL(deploymentUrl).hostname.toLowerCase() : null;
  const inspectHostname = inspectUrl ? new URL(inspectUrl).hostname.toLowerCase() : null;
  const expectedProvider = String(expectations?.provider ?? 'vercel').trim().toLowerCase();
  const expectedProject =
    typeof expectations?.project === 'string' && expectations.project.trim().length > 0
      ? expectations.project.trim()
      : null;
  const provider = String(deployment.provider ?? '').trim().toLowerCase();
  const inspectPath = inspectUrl ? new URL(inspectUrl).pathname.toLowerCase() : '';
  const inspectProjectSlug = expectedProject
    ? expectedProject
        .split('/')
        .map((segment) => segment.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const inspectContainsProject =
    inspectProjectSlug.length === 0 ||
    inspectProjectSlug.every((segment) => inspectPath.includes(`/${segment}`) || inspectPath.includes(segment));
  const inspectContainsDeploymentId =
    !deployment.deployment_id || !inspectUrl || inspectUrl.toLowerCase().includes(deployment.deployment_id.toLowerCase());

  return {
    provider_present: Boolean(provider && provider !== 'unknown'),
    provider_exact: provider === expectedProvider,
    project_present: Boolean(deployment.project),
    project_exact: expectedProject != null && deployment.project === expectedProject,
    deployment_id_present: Boolean(deployment.deployment_id),
    deployment_id_format:
      typeof deployment.deployment_id === 'string' && /^dpl_[A-Za-z0-9]+$/.test(deployment.deployment_id),
    deployment_url_https: isHttpsUrl(deploymentUrl),
    deployment_url_vercel_hostname:
      deploymentHostname != null &&
      (deploymentHostname === 'vercel.app' || deploymentHostname.endsWith('.vercel.app')),
    inspect_url_https_or_absent:
      deployment.inspect_url == null || deployment.inspect_url === '' || isHttpsUrl(inspectUrl),
    inspect_url_vercel_or_absent:
      inspectUrl == null || inspectHostname === 'vercel.com' || inspectHostname?.endsWith('.vercel.com'),
    inspect_url_contains_expected_project_or_absent: inspectUrl == null || inspectContainsProject,
    inspect_url_contains_deployment_id_or_absent: inspectUrl == null || inspectContainsDeploymentId,
    promoted_alias_https: isHttpsUrl(deployment.promoted_alias),
    promoted_alias_matches_canonical_origin:
      promotedAlias != null && canonical != null && promotedAlias === canonical,
  };
}
