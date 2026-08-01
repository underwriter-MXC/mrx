import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { analyzeControlledPublicationTransition } from './_mrx1000-controlled-publication-transition.mjs';

/**
 * Read the signed exact-admission batch and prove which rows currently carry
 * the byte-exact draft/noindex -> published/indexable transition. The signed
 * canonical ledger remains immutable; consumers use this projection only for
 * the current workspace/build publication state.
 */
export function loadRuntimePublicationProjection(repoRoot) {
  const batchPath = path.join(repoRoot, 'config', 'mrx1000-release-10-batch.json');
  if (!existsSync(batchPath)) throw new Error(`Release batch missing: ${batchPath}`);
  const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
  const entries = (batch.articles ?? []).filter(
    (entry) => entry.admission_status === 'admitted_exact',
  );
  const bySlug = new Map();
  for (const entry of entries) {
    const sourcePath = path.join(repoRoot, entry.repo_path);
    if (!existsSync(sourcePath)) {
      throw new Error(`Exact-admission source missing: ${entry.repo_path}`);
    }
    const transition = analyzeControlledPublicationTransition(readFileSync(sourcePath), entry);
    if (!transition.authorized) {
      throw new Error(
        `Exact-admission publication projection failed for ${entry.slug}: ${transition.reason}`,
      );
    }
    bySlug.set(entry.slug, {
      entry,
      transition,
      published: transition.state === 'controlled_publication_transition',
    });
  }
  return { bySlug, exact_admission_count: entries.length };
}

export function projectLedgerArticlesForRuntime(articles, repoRoot) {
  const projection = loadRuntimePublicationProjection(repoRoot);
  const projected = articles.map((article) => {
    const runtime = projection.bySlug.get(article.canonical_slug);
    if (!runtime?.published) return article;
    return {
      ...article,
      publication_status: 'published',
      draft: false,
      frontmatter_noindex: false,
      publication_gate_nonpublic: false,
      noindex_required: false,
      preservation_classification: 'live_public_published_route',
      normalized_status: 'public_route_configured_exact_admission_pending_production_verification',
      publication_state: 'published_workspace_article_pending_production_verification',
      action: 'deploy_exact_admission_and_verify_production',
      action_reason:
        'The signed exact-admission row carries only the byte-proven publication transition; production verification remains a separate release gate.',
      compliance_status: 'exact_admission_reviews_passed_pending_production_verification',
    };
  });
  return { articles: projected, projection };
}
