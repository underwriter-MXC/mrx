import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BATCH_PATH = 'config/mrx1000-release-10-batch.json';
const OUTPUT_PATH =
  process.env.MRX_BROWSER_OUTPUT_PATH ??
  'artifacts/mrx1000-release-10/release/browser-verification.json';
const SCREENSHOT_DIR =
  process.env.MRX_BROWSER_SCREENSHOT_DIR ??
  'artifacts/mrx1000-release-10/release/browser-screenshots';
const CANONICAL_ORIGIN = process.env.MRX_CANONICAL_ORIGIN ?? 'https://mineralrightsxchange.com';
const VISUAL_INSPECTION_COMPLETE = process.env.MRX_VISUAL_INSPECTION_COMPLETE === '1';

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));

const invariant = (condition, message) => {
  if (!condition) throw new Error(message);
};

const batch = await readJson(BATCH_PATH);
const articles = batch.articles.slice(-10);
invariant(articles.length === 10, `Expected 10 release-window articles, found ${articles.length}`);

const browser = await chromium.launch({ headless: true });
const contexts = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
];
const results = [];

try {
  await mkdir(path.join(ROOT, SCREENSHOT_DIR), { recursive: true });

  for (const profile of contexts) {
    const context = await browser.newContext({ viewport: profile.viewport });
    const page = await context.newPage();

    for (const article of articles) {
      const evidence = await readJson(article.evidence_packet_path);
      const hero = evidence.asset_manifest.assets.find((asset) => asset.kind === 'hero');
      const inline = evidence.asset_manifest.assets.find((asset) => asset.kind === 'inline');
      invariant(hero, `${article.slug}: missing hero evidence`);
      invariant(inline, `${article.slug}: missing inline evidence`);

      const response = await page.goto(article.canonical_url, {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      invariant(response?.status() === 200, `${article.slug}: HTTP ${response?.status()}`);

      const heroImage = page.locator('.article-hero-image img').first();
      const inlineImage = page.locator('[data-article-inline-image] img').first();
      await heroImage.waitFor({ state: 'visible', timeout: 30_000 });
      await inlineImage.waitFor({ state: 'visible', timeout: 30_000 });
      await page.waitForFunction(
        () =>
          [
            ...document.querySelectorAll(
              '.article-hero-image img, [data-article-inline-image] img',
            ),
          ].every((image) => image.complete && image.naturalWidth > 0),
        null,
        { timeout: 30_000 },
      );

      const observed = await page.evaluate(() => {
        const heroElement = document.querySelector('.article-hero-image img');
        const inlineElement = document.querySelector('[data-article-inline-image] img');
        const h1 = document.querySelector('h1');
        const footerDisclosures = document.querySelectorAll('.mrx-disclaimer-footer');
        const heroRect = heroElement?.getBoundingClientRect();
        const inlineRect = inlineElement?.getBoundingClientRect();
        return {
          h1: h1?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          hero: heroElement
            ? {
                src: heroElement.getAttribute('src'),
                alt: heroElement.getAttribute('alt'),
                naturalWidth: heroElement.naturalWidth,
                naturalHeight: heroElement.naturalHeight,
                visible: Boolean(heroRect && heroRect.width > 0 && heroRect.height > 0),
                renderedWidth: heroRect?.width ?? 0,
                renderedHeight: heroRect?.height ?? 0,
              }
            : null,
          inline: inlineElement
            ? {
                src: inlineElement.getAttribute('src'),
                alt: inlineElement.getAttribute('alt'),
                naturalWidth: inlineElement.naturalWidth,
                naturalHeight: inlineElement.naturalHeight,
                visible: Boolean(inlineRect && inlineRect.width > 0 && inlineRect.height > 0),
                renderedWidth: inlineRect?.width ?? 0,
                renderedHeight: inlineRect?.height ?? 0,
              }
            : null,
          footerDisclosureCount: footerDisclosures.length,
          documentScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        };
      });

      const assertions = {
        exact_title_visible: observed.h1 === article.title,
        hero_visible: observed.hero?.visible === true,
        hero_natural_1200x630:
          observed.hero?.naturalWidth === 1200 && observed.hero?.naturalHeight === 630,
        hero_src_exact: observed.hero?.src === hero.public_path,
        hero_alt_exact: observed.hero?.alt === hero.alt_text,
        hero_rendered_ratio_exact:
          Math.abs(observed.hero.renderedWidth / observed.hero.renderedHeight - 1200 / 630) < 0.02,
        inline_visible: observed.inline?.visible === true,
        inline_natural_1200x675:
          observed.inline?.naturalWidth === 1200 && observed.inline?.naturalHeight === 675,
        inline_src_exact: observed.inline?.src === inline.public_path,
        inline_alt_exact: observed.inline?.alt === inline.alt_text,
        inline_rendered_ratio_exact:
          Math.abs(observed.inline.renderedWidth / observed.inline.renderedHeight - 1200 / 675) <
          0.02,
        inline_exact_text_evidence:
          inline.rendered_text === article.inline_rendered_text && inline.ocr?.pass === true,
        one_footer_disclosure: observed.footerDisclosureCount === 1,
        no_horizontal_overflow: observed.documentScrollWidth <= observed.viewportWidth + 1,
      };
      const disposition = Object.values(assertions).every(Boolean) ? 'PASS' : 'FAIL';
      results.push({
        profile: profile.name,
        slug: article.slug,
        url: page.url(),
        observed,
        assertions,
        disposition,
      });

      if (article === articles.at(-1)) {
        await page.screenshot({
          path: path.join(ROOT, SCREENSHOT_DIR, `${article.slug}-${profile.name}.png`),
          fullPage: true,
        });
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

const homepageContext = await chromium.launch({ headless: true });
let homepage;
try {
  const page = await homepageContext.newPage({ viewport: { width: 1440, height: 1000 } });
  const response = await page.goto(`${CANONICAL_ORIGIN}/`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  invariant(response?.status() === 200, `Homepage HTTP ${response?.status()}`);
  homepage = await page.evaluate(() => ({
    top_disclosure_count: document.querySelectorAll('.mrx-disclaimer-top').length,
    footer_disclosure_count: document.querySelectorAll('.mrx-disclaimer-footer').length,
  }));
} finally {
  await homepageContext.close();
}

const passed = results.every((result) => result.disposition === 'PASS');
const unclippedLayouts = results.every(
  (row) => row.assertions.hero_rendered_ratio_exact && row.assertions.inline_rendered_ratio_exact,
);
const report = {
  generated_at_utc: new Date().toISOString(),
  canonical_origin: CANONICAL_ORIGIN,
  homepage,
  wave10: {
    article_count: articles.length,
    slugs: articles.map((article) => article.slug),
    exact_titles_visible: results.every((row) => row.assertions.exact_title_visible),
    hero_images_visible: results.every((row) => row.assertions.hero_visible),
    hero_images_natural_1200x630: results.every((row) => row.assertions.hero_natural_1200x630),
    inline_images_visible: results.every((row) => row.assertions.inline_visible),
    inline_images_natural_1200x675: results.every((row) => row.assertions.inline_natural_1200x675),
    inline_exact_text_visible: results.every((row) => row.assertions.inline_exact_text_evidence),
    exact_alt_text: results.every(
      (row) => row.assertions.hero_alt_exact && row.assertions.inline_alt_exact,
    ),
    one_footer_disclosure_each: results.every((row) => row.assertions.one_footer_disclosure),
    no_clipping_overlap_or_garbling: passed && unclippedLayouts && VISUAL_INSPECTION_COMPLETE,
    no_horizontal_overflow: results.every((row) => row.assertions.no_horizontal_overflow),
  },
  results,
  visual_inspection_completed: VISUAL_INSPECTION_COMPLETE,
  disposition: passed && VISUAL_INSPECTION_COMPLETE ? 'PASS' : 'FAIL',
};

await mkdir(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
await writeFile(path.join(ROOT, OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed || !VISUAL_INSPECTION_COMPLETE) process.exitCode = 1;
