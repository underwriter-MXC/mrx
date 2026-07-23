import { runtimeEnv, runtimeFlag } from './runtime-env';

type EnvReader = Record<string, string | undefined>;

type TestProfileLike = {
  is_test?: boolean | null;
  test_run_id?: string | null;
};

export function productionHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.+$/, '');
  return host === 'mineralrightsxchange.com' || host === 'www.mineralrightsxchange.com';
}

function readEnv(name: string, env?: EnvReader) {
  return env ? env[name] : runtimeEnv(name);
}

function readFlag(name: string, env?: EnvReader) {
  return env ? env[name] === 'true' : runtimeFlag(name);
}

export function runtimeEnvironmentIsProduction(env?: EnvReader) {
  return readEnv('VERCEL_ENV', env) === 'production';
}

export function stagingTestAccessAllowed(request: Request, env?: EnvReader) {
  const secret = readEnv('MRX_STAGING_TEST_SECRET', env);
  const host = new URL(request.url).hostname;
  return Boolean(
    readFlag('MRX_TEST_MODE', env) &&
    !runtimeEnvironmentIsProduction(env) &&
    !productionHost(host) &&
    secret &&
    request.headers.get('x-mrx-test-secret') === secret,
  );
}

export function explicitNonProductionTestGhlSyncAllowed(env?: EnvReader) {
  return Boolean(
    readFlag('MRX_TEST_MODE', env) &&
    readFlag('MRX_TEST_SYNC_GHL', env) &&
    !runtimeEnvironmentIsProduction(env),
  );
}

export function testOutboundSuppressed(profile: TestProfileLike, env?: EnvReader) {
  return Boolean(
    (profile.is_test || profile.test_run_id) && !explicitNonProductionTestGhlSyncAllowed(env),
  );
}
