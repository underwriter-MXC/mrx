type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * Read server configuration at request time on Vercel, with an Astro/Vite
 * fallback for local development and non-Node adapters.
 *
 * Vercel Sensitive variables are intentionally unavailable during the build,
 * so server integrations must not rely on build-time-only import.meta.env
 * replacement for credentials.
 */
export function runtimeEnv(name: string): string | undefined {
  const nodeValue =
    typeof process !== 'undefined'
      ? (process.env as RuntimeEnvironment | undefined)?.[name]
      : undefined;
  if (nodeValue !== undefined && nodeValue !== '') return nodeValue;

  const viteValue = (import.meta.env as RuntimeEnvironment)[name];
  return viteValue !== undefined && viteValue !== '' ? String(viteValue) : undefined;
}

export function runtimeFlag(name: string) {
  return runtimeEnv(name) === 'true';
}

export function runtimeIsProduction() {
  return runtimeEnv('VERCEL_ENV') === 'production' || import.meta.env.PROD;
}
