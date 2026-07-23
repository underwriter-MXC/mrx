import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'config', 'mrx-1000-pilot-batch-001.json');
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { batch_id: null, target_count: 0, articles: [] };

function frontmatterFor(slug: string): string {
  const path = join(root, 'src', 'content', 'posts', `${slug}.mdx`);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function scalar(frontmatter: string, key: string): string {
  const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return raw.replace(/^['"]|['"]$/g, '');
}

function nestedScalar(frontmatter: string, parent: string, key: string): string {
  const block =
    frontmatter.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*\\n?)*)`, 'm'))?.[1] ?? '';
  const raw = block.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return raw.replace(/^['"]|['"]$/g, '');
}

function publicAssetExists(path: string): boolean {
  return path.startsWith('/') && existsSync(join(root, 'public', path.slice(1)));
}

describe('MRX1000-PILOT-001 noindex-stage contract', () => {
  it('pins the authorized 25-article pilot manifest', () => {
    expect(manifest.batch_id).toBe('MRX1000-PILOT-001');
    expect(manifest.target_count).toBe(25);
    expect(manifest.articles).toHaveLength(25);
    expect(new Set(manifest.articles.map((article: { slug: string }) => article.slug)).size).toBe(
      25,
    );
  });

  it('requires explicit pilot taxonomy and compliance fields in every article frontmatter', () => {
    for (const article of manifest.articles) {
      const frontmatter = frontmatterFor(article.slug);
      expect(frontmatter, article.slug).not.toBe('');
      expect(scalar(frontmatter, 'content_program'), article.slug).toBe('mrx1000');
      expect(scalar(frontmatter, 'content_cluster'), article.slug).toBe(article.cluster_id);
      expect(scalar(frontmatter, 'content_intent'), article.slug).not.toBe('');
      expect(scalar(frontmatter, 'content_guide'), article.slug).not.toBe('');
      expect(scalar(frontmatter, 'content_batch'), article.slug).toBe('pilot-001');
      expect(scalar(frontmatter, 'noindex'), article.slug).toBe('true');
      expect(scalar(frontmatter, 'draft'), article.slug).toBe('true');
      expect(scalar(frontmatter, 'publication_status'), article.slug).toBe('draft');
      expect(scalar(frontmatter, 'has_footer_disclaimer'), article.slug).toBe('true');
      expect(scalar(frontmatter, 'disclaimer_top'), article.slug).not.toBe('');
      expect(scalar(frontmatter, 'money_figure_sourced'), article.slug).not.toBe('');
      expect(scalar(frontmatter, 'reviewed_by'), article.slug).not.toBe('');
      expect(scalar(frontmatter, 'reviewed_at'), article.slug).not.toBe('');
    }
  });

  it('keeps every pilot SEO title and description inside the Gate C budgets', () => {
    for (const article of manifest.articles) {
      const frontmatter = frontmatterFor(article.slug);
      expect(scalar(frontmatter, 'title').length, article.slug).toBeGreaterThanOrEqual(30);
      expect(scalar(frontmatter, 'title').length, article.slug).toBeLessThanOrEqual(60);
      expect(scalar(frontmatter, 'description').length, article.slug).toBeGreaterThanOrEqual(130);
      expect(scalar(frontmatter, 'description').length, article.slug).toBeLessThanOrEqual(160);
    }
  });

  it('resolves hero and social metadata locally for every pilot article', () => {
    for (const article of manifest.articles) {
      const frontmatter = frontmatterFor(article.slug);
      const hero = nestedScalar(frontmatter, 'hero_image', 'src');
      const social = nestedScalar(frontmatter, 'hero_image', 'social_src');
      expect(
        nestedScalar(frontmatter, 'hero_image', 'alt').length,
        article.slug,
      ).toBeGreaterThanOrEqual(3);
      expect(
        nestedScalar(frontmatter, 'hero_image', 'social_alt').length,
        article.slug,
      ).toBeGreaterThanOrEqual(3);
      expect(publicAssetExists(hero), `${article.slug}: ${hero}`).toBe(true);
      expect(publicAssetExists(social), `${article.slug}: ${social}`).toBe(true);
    }
  });

  it('enforces the hub, sibling, conversion triangle with the /book/ CTA', () => {
    for (const article of manifest.articles) {
      const frontmatter = frontmatterFor(article.slug);
      const hub = nestedScalar(frontmatter, 'internal_links', 'hub');
      const sibling = nestedScalar(frontmatter, 'internal_links', 'sibling');
      const conversion = nestedScalar(frontmatter, 'internal_links', 'conversion');
      expect(hub, article.slug).toMatch(/^\/.+\/$/);
      expect(sibling, article.slug).toMatch(/^\/.+\/$/);
      expect(sibling, article.slug).not.toBe(hub);
      expect(conversion, article.slug).toBe('/book/');
    }
  });

  it('has a gated staged route, explicit noindex,follow, and separate staged sitemap implementation', () => {
    const route = join(root, 'src', 'pages', 'staged', 'mrx1000', 'pilot-001', '[slug].astro');
    const sitemap = join(root, 'scripts', 'postbuild-sitemap.mjs');
    const stagedVerification = join(root, 'scripts', 'verify-mrx1000-pilot-stage.mjs');
    const astroConfig = join(root, 'astro.config.mjs');
    expect(existsSync(route)).toBe(true);
    expect(existsSync(sitemap)).toBe(true);
    expect(existsSync(stagedVerification)).toBe(true);
    expect(existsSync(astroConfig)).toBe(true);
    expect(existsSync(route) ? readFileSync(route, 'utf8') : '').toContain('noindex={true}');
    expect(existsSync(route) ? readFileSync(route, 'utf8') : '').toContain(
      'robots="noindex, follow"',
    );
    expect(existsSync(route) ? readFileSync(route, 'utf8') : '').toContain('appendBrand={false}');
    const seoSource = readFileSync(join(root, 'src', 'components', 'seo', 'Seo.astro'), 'utf8');
    expect(seoSource).toContain("noindex ? 'noindex, nofollow'");
    expect(seoSource).toContain('appendBrand');
    expect(readFileSync(sitemap, 'utf8')).toContain('sitemap-staged.xml');
    expect(readFileSync(astroConfig, 'utf8')).toContain("pathname.startsWith('/staged/')");
  });

  it('keeps protected worktree audit artifacts outside global Prettier writes', () => {
    const prettierIgnore = readFileSync(join(root, '.prettierignore'), 'utf8');
    expect(prettierIgnore).toMatch(/^\.worktrees\/$/m);
  });

  it('verifies all rendered pilot pages and sitemap isolation after a build', async () => {
    const verifier = join(root, 'scripts', 'verify-mrx1000-pilot-stage.mjs');
    const buildPresent = [
      join(root, 'dist', 'client', 'sitemap-staged.xml'),
      join(root, 'dist', 'sitemap-staged.xml'),
    ].some(existsSync);
    const { status, stdout, stderr } = buildPresent
      ? await import('node:child_process').then(({ spawnSync }) =>
          spawnSync(process.execPath, [verifier], { cwd: root, encoding: 'utf8' }),
        )
      : { status: 0, stdout: '', stderr: '' };
    expect(status, `${stdout}\n${stderr}`).toBe(0);
    if (buildPresent) {
      const report = JSON.parse(
        readFileSync(join(root, 'reports', 'mrx1000-pilot-001', 'verification.json'), 'utf8'),
      );
      expect(report.verified_count).toBe(25);
      expect(report.all_passed).toBe(true);
      expect(report.sitemap_submitted_to_gsc).toBe(false);
      expect(
        report.results.every((row: { checks: Record<string, boolean> }) =>
          Object.values(row.checks).every(Boolean),
        ),
      ).toBe(true);
    }
  });
});
