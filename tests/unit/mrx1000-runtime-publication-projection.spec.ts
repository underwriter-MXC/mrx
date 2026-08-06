import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadRuntimePublicationProjection } from '../../scripts/_mrx1000-runtime-publication-projection.mjs';

const temporaryTrees: string[] = [];

afterEach(() => {
  for (const tree of temporaryTrees.splice(0)) rmSync(tree, { recursive: true, force: true });
});

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

describe('runtime MRX1000 publication projection', () => {
  it('includes historical exact and continuous quality-gated admissions', () => {
    const tree = mkdtempSync(join(tmpdir(), 'mrx-runtime-projection-'));
    temporaryTrees.push(tree);
    mkdirSync(join(tree, 'config'), { recursive: true });
    mkdirSync(join(tree, 'src/content/posts'), { recursive: true });

    const source = `---
draft: false
publication_status: draft
noindex: true
---

Reviewed article.
`;
    const articles = [
      {
        slug: 'historical-exact',
        repo_path: 'src/content/posts/historical-exact.mdx',
        article_sha256: sha256(source),
        admission_status: 'admitted_exact',
        finalization_state: 'draft_noindex_admitted',
      },
      {
        slug: 'continuous-quality-gated',
        repo_path: 'src/content/posts/continuous-quality-gated.mdx',
        article_sha256: sha256(source),
        admission_status: 'admitted_quality_gated',
        finalization_state: 'draft_noindex_admitted',
      },
    ];
    for (const article of articles) {
      writeFileSync(join(tree, article.repo_path), source);
    }
    writeFileSync(
      join(tree, 'config/mrx1000-release-10-batch.json'),
      `${JSON.stringify({ articles }, null, 2)}\n`,
    );

    const projection = loadRuntimePublicationProjection(tree);

    expect(projection.exact_admission_count).toBe(2);
    expect([...projection.bySlug.keys()]).toEqual(['historical-exact', 'continuous-quality-gated']);
  });
});
