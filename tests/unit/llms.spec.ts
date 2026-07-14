import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LLM discovery files', () => {
  const publicDir = join(process.cwd(), 'public');

  it('publishes llms.txt with canonical MRX pages and compliance caveats', () => {
    const text = readFileSync(join(publicDir, 'llms.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/');
    expect(text).toContain('https://mineralrightsxchange.com/offer-review/');
    expect(text).toContain('https://mineralrightsxchange.com/inherited-mineral-rights/');
    expect(text).toContain('https://mineralrightsxchange.com/methodology/');
    expect(text).toContain('fictional AI interfaces');
    expect(text).toContain('not a certified appraisal');
  });

  it('publishes a public-content-only full index and retires the obsolete singular file', () => {
    const text = readFileSync(join(publicDir, 'llms-full.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/learning-center/');
    expect(text).toContain('https://mineralrightsxchange.com/team/');
    expect(text).not.toMatch(/internal strategy|competitor research|raw knowledge index/i);
    expect(existsSync(join(publicDir, 'llm.txt'))).toBe(false);
  });
});
