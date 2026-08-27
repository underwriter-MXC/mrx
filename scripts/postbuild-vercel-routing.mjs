#!/usr/bin/env node
/**
 * Preserve the high-level redirects, headers, and cron configuration from
 * vercel.json when deploying a locally built Build Output API artifact with
 * `vercel deploy --prebuilt`.
 *
 * Astro emits `.vercel/output/config.json`, and a prebuilt deployment consumes
 * that file directly. Vercel's documented routing utility compiles the
 * high-level vercel.json syntax into the low-level routes accepted there.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTransformedRoutes } from '@vercel/routing-utils';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function compileDeploymentRoutes(vercelConfig) {
  const { routes } = getTransformedRoutes({
    redirects: vercelConfig.redirects ?? [],
    headers: vercelConfig.headers ?? [],
  });
  return routes;
}

export function mergeDeploymentRouting(buildOutputConfig, deploymentRoutes, crons = []) {
  if (buildOutputConfig.version !== 3 || !Array.isArray(buildOutputConfig.routes)) {
    throw new Error('Expected a Build Output API v3 config with a routes array');
  }

  const deploymentRouteKeys = new Set(deploymentRoutes.map((route) => JSON.stringify(route)));
  const adapterRoutes = buildOutputConfig.routes.filter(
    (route) => !deploymentRouteKeys.has(JSON.stringify(route)),
  );
  const filesystemIndex = adapterRoutes.findIndex((route) => route.handle === 'filesystem');
  if (filesystemIndex < 0) {
    throw new Error('Build Output config is missing the filesystem routing phase');
  }

  return {
    ...buildOutputConfig,
    routes: [
      ...adapterRoutes.slice(0, filesystemIndex),
      ...deploymentRoutes,
      ...adapterRoutes.slice(filesystemIndex),
    ],
    crons,
  };
}

export async function writeVercelBuildOutputRouting(root = ROOT) {
  const vercelPath = join(root, 'vercel.json');
  const outputPath = join(root, '.vercel', 'output', 'config.json');
  const vercelConfig = JSON.parse(await readFile(vercelPath, 'utf8'));
  const buildOutputConfig = JSON.parse(await readFile(outputPath, 'utf8'));
  const deploymentRoutes = compileDeploymentRoutes(vercelConfig);
  const merged = mergeDeploymentRouting(
    buildOutputConfig,
    deploymentRoutes,
    vercelConfig.crons ?? [],
  );
  await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(
    `[postbuild-vercel-routing] Added ${deploymentRoutes.length} redirect/header route(s) and ${merged.crons.length} cron(s) to ${outputPath}`,
  );
  return { outputPath, routeCount: deploymentRoutes.length, cronCount: merged.crons.length };
}

const isDirectExecution =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isDirectExecution) await writeVercelBuildOutputRouting();
