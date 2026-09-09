import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const apiRoot = new URL('../../src/pages/api/', import.meta.url);
const rootPath = apiRoot.pathname;

function mutatingRoutes() {
  return readdirSync(rootPath, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => /export const (POST|PUT|PATCH|DELETE):/.test(readFileSync(file, 'utf8')));
}

describe('mutating API origin coverage', () => {
  it('protects browser routes with same-origin checks and limits exceptions to signed/test routes', () => {
    const exceptions = new Set([
      'chat/attachments/worker-callback.ts',
      'test/cleanup-run.ts',
      'test/run-summary.ts',
      'test/sync-owner.ts',
      'test/verify-owner.ts',
      'webhooks/ghl.ts',
    ]);
    const uncovered = mutatingRoutes()
      .map((file) => ({
        file,
        route: relative(rootPath, file),
        source: readFileSync(file, 'utf8'),
      }))
      .filter(({ route, source }) => !source.includes('assertSameOrigin') && !exceptions.has(route))
      .map(({ route }) => route);

    expect(uncovered).toEqual([]);
    for (const file of mutatingRoutes()) {
      const route = relative(rootPath, file);
      const source = readFileSync(file, 'utf8');
      if (route.startsWith('test/')) expect(source).toContain('stagingTestAccessAllowed');
      if (route === 'webhooks/ghl.ts') expect(source).toContain('verifyGhlSignature');
      if (route === 'chat/attachments/worker-callback.ts')
        expect(source).toContain('verifyWorkerSignature');
    }
  });
});
