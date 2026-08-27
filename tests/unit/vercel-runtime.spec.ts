import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));
const nvmrcPath = fileURLToPath(new URL('../../.nvmrc', import.meta.url));
const ciWorkflowPath = fileURLToPath(new URL('../../.github/workflows/ci.yml', import.meta.url));
const deployWorkflowPath = fileURLToPath(
  new URL('../../.github/workflows/deploy.yml', import.meta.url),
);

describe('production Node.js runtime', () => {
  it('keeps local, CI, and Vercel runtime declarations on Node 24', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      engines?: { node?: string };
    };

    expect(packageJson.engines?.node).toBe('24.x');
    expect(readFileSync(nvmrcPath, 'utf8').trim()).toBe('24');
    expect(readFileSync(ciWorkflowPath, 'utf8')).toContain("node-version: '24'");
    expect(readFileSync(deployWorkflowPath, 'utf8')).toContain("node-version: '24'");
  });
});
