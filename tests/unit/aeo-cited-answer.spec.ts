import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Verify every page that opts into the AEO "Cited answer" block
 * has a substantive, extractable answer and at least 2 sources.
 * Per SEO plan §5.3, the cited answer is the single best LLM-
 * citable block on the page; thin blocks defeat the point.
 */
const PAGES_DIR = join(process.cwd(), 'src/content/pages');

const PAGES_WITH_CITED_ANSWER = [
  { file: 'index.mdx', minWords: 150, maxWords: 250 },
  { file: 'sell-mineral-rights.mdx', minWords: 50, maxWords: 100 },
];

describe('AEO cited-answer shape (per SEO plan §5.3)', () => {
  for (const { file, minWords, maxWords } of PAGES_WITH_CITED_ANSWER) {
    it(`${file} sets aeo_cited_answer: true`, () => {
      const text = readFileSync(join(PAGES_DIR, file), 'utf-8');
      expect(text).toMatch(/^aeo_cited_answer:\s*true\s*$/m);
    });

    it(`${file} aeo_cited_answer_text is substantive and extractable`, () => {
      const text = readFileSync(join(PAGES_DIR, file), 'utf-8');
      const m = text.match(/^aeo_cited_answer_text:\s*'(.*)'$/m);
      expect(m, `aeo_cited_answer_text not found in ${file}`).toBeTruthy();
      const body = m![1];
      const wordCount = body.split(/\s+/).filter(Boolean).length;
      expect(wordCount, `${file} cited answer is only ${wordCount} words`).toBeGreaterThanOrEqual(
        minWords,
      );
      expect(wordCount, `${file} cited answer is ${wordCount} words`).toBeLessThanOrEqual(maxWords);
    });

    it(`${file} has at least 2 aeo_cited_answer_sources`, () => {
      const text = readFileSync(join(PAGES_DIR, file), 'utf-8');
      // Crude count: every source starts with "  - label:".
      const sourceCount =
        (text.match(/^aeo_cited_answer_sources:/m)
          ? text.split('aeo_cited_answer_sources:')[1]
          : ''
        ).match(/^\s*-\s+label:/gm)?.length ?? 0;
      expect(sourceCount, `${file} has ${sourceCount} sources`).toBeGreaterThanOrEqual(2);
    });
  }
});
