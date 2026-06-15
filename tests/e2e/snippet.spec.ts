import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Phrase = string;
const DISALLOWED: Phrase[] = JSON.parse(
  readFileSync(join(process.cwd(), 'compliance/disallowed.json'), 'utf-8'),
).phrases;

const PAGES = [
  '/',
  '/how-it-works',
  '/about',
  '/faq',
  '/free-guide',
  '/book',
  '/methodology',
  '/sell-mineral-rights',
  '/privacy-policy',
  '/blog/how-are-mineral-rights-valued/',
  '/blog/what-is-a-clawback-clause-in-a-mineral-rights-sale/',
];

test.describe('§10 first-200-chars snippet test', () => {
  for (const path of PAGES) {
    test(`snippet test: ${path}`, async ({ page }) => {
      await page.goto(path);
      const body = await page.locator('main').first().innerText();
      const first200 = body.slice(0, 200).toLowerCase();
      for (const phrase of DISALLOWED) {
        expect(
          first200.includes(phrase.toLowerCase()),
          `${path}: disallowed phrase "${phrase}" found in first 200 chars`,
        ).toBe(false);
      }
    });
  }
});
