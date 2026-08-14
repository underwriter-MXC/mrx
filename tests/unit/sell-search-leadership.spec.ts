import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const registryPath = join(repoRoot, 'config', 'mrx-sell-search-leadership.json');
const dashboardPath = join(repoRoot, 'reports', 'mrx-sell-search-leadership', 'dashboard.json');
const sellPagePath = join(repoRoot, 'src', 'content', 'pages', 'sell-mineral-rights.mdx');
const stagedTexasPagePath = join(
  repoRoot,
  'src',
  'content',
  'pages',
  'sell-mineral-rights-texas.mdx',
);
const publicTexasRoutePath = join(repoRoot, 'src', 'pages', 'sell-mineral-rights', 'texas.astro');
const ctaBlockPath = join(repoRoot, 'src', 'components', 'molecules', 'CtaBlock.astro');
const ctaLinkPath = join(repoRoot, 'src', 'components', 'atoms', 'CtaLink.astro');
const heroPath = join(repoRoot, 'src', 'components', 'molecules', 'Hero.astro');
const headerPath = join(repoRoot, 'src', 'components', 'organisms', 'Header.astro');

function frontmatter(source: string): string {
  return source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

describe('sell-mineral-rights search leadership controls', () => {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

  it('fixes one canonical owner for each query in the 50-query portfolio', () => {
    expect(registry.tracked_queries).toHaveLength(50);

    const ids = new Set<string>();
    const queryMarkets = new Set<string>();
    for (const row of registry.tracked_queries) {
      ids.add(row.id);
      queryMarkets.add(`${row.market}\u0000${row.query.toLowerCase()}`);
      expect(row.canonical_owner_url).toMatch(/^\/.+\/$/);
    }

    expect(ids.size).toBe(50);
    expect(queryMarkets.size).toBe(50);
  });

  it('keeps the next 25 unique and nonpublic until the GSC index gate is earned', () => {
    expect(registry.release_gates.gsc_required).toBe(true);
    expect(registry.release_gates.minimum_index_coverage).toBe(0.8);
    expect(registry.release_gates.current_index_status).not.toBe('verified_threshold_met');
    expect(registry.next_25).toHaveLength(25);
    expect(new Set(registry.next_25.map((row: { slug: string }) => row.slug)).size).toBe(25);
    expect(
      registry.next_25.every((row: { release_status: string }) =>
        ['held', 'planning'].includes(row.release_status),
      ),
    ).toBe(true);
  });

  it('makes the national sell pillar own the sell-mineral-rights head term', () => {
    const source = readFileSync(sellPagePath, 'utf8');
    const data = frontmatter(source);

    expect(data).toMatch(/^title:\s*['"]?Sell Mineral Rights\b/im);
    expect(data).toMatch(/^h1:\s*['"]?.*sell mineral rights/im);
    expect(data).toMatch(/^disclaimer_top:\s*false\s*$/m);
    expect(source).toContain('Review My Selling Options');
    expect(source).toContain('Ask Tommy First');
    expect(source).toContain('/blog/how-to-sell-mineral-rights-in-texas/');
    expect(source).toContain('/blog/what-documents-do-you-need-to-sell-mineral-rights-in-texas/');
    expect(source).toContain('/guides/how-to-find-out-what-your-mineral-rights-are.pdf');
    expect(source).toContain("href: '#ask-tommy'");
    expect(source).toContain('openTommy: true');
    expect(source).not.toContain('?ask=1');
    expect(source).toContain('reassurance="No card required. No obligation."');

    const ctaBlock = readFileSync(ctaBlockPath, 'utf8');
    const ctaLink = readFileSync(ctaLinkPath, 'utf8');
    const hero = readFileSync(heroPath, 'utf8');
    const header = readFileSync(headerPath, 'utf8');
    expect(ctaBlock).toContain('openTommy={secondaryCta.openTommy}');
    expect(ctaBlock).toMatch(
      /\.cta-block :global\(\.btn--ghost\)[\s\S]*?color: var\(--color-white\)/,
    );
    expect(ctaLink).toContain('data-open-tommy={openTommy || undefined}');
    expect(hero).toContain('<h2>{cardHeading}</h2>');
    expect(header).toContain('aria-label="Ask Tommy for mineral-rights help"');
    expect(source).not.toMatch(/data-cta-name="smr-[^"]+">\s*\n/);
  });

  it('stages the Texas commercial page without creating a public route', () => {
    const source = readFileSync(stagedTexasPagePath, 'utf8');
    expect(frontmatter(source)).toMatch(/^draft:\s*true\s*$/m);
    expect(source).toContain('Texas Railroad Commission Public Data');
    expect(existsSync(publicTexasRoutePath)).toBe(false);
  });

  it('builds a passing dashboard while preserving the release hold', () => {
    execFileSync(
      process.execPath,
      [join(repoRoot, 'scripts', 'build-mrx-sell-search-dashboard.mjs')],
      {
        cwd: repoRoot,
        stdio: 'pipe',
      },
    );

    const dashboard = JSON.parse(readFileSync(dashboardPath, 'utf8'));
    expect(dashboard.status).toBe('pass_with_release_hold');
    expect(dashboard.blocking_findings).toEqual([]);
    expect(dashboard.portfolio.tracked_queries).toBe(50);
    expect(dashboard.portfolio.next_release_rows).toBe(25);
    expect(dashboard.portfolio.next_release_published_rows).toBe(0);
    expect(dashboard.portfolio.live_sell_pillar_posts).toHaveLength(37);
  });
});
