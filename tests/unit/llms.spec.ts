import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LLM discovery files', () => {
  const publicDir = join(process.cwd(), 'public');

  it('publishes llms.txt with canonical MRX pages and compliance caveats', () => {
    const text = readFileSync(join(publicDir, 'llms.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/');
    expect(text).toContain('https://mineralrightsxchange.com/sell-mineral-rights/');
    expect(text).toContain('https://mineralrightsxchange.com/methodology/');
    expect(text).toContain('directional estimates');
    expect(text).toContain('should not be described as certified appraisals');
    expect(text).toContain('legal, tax, or title opinions');
  });

  it('publishes llm.txt as a short pointer to llms.txt', () => {
    const text = readFileSync(join(publicDir, 'llm.txt'), 'utf-8');
    expect(text).toContain('https://mineralrightsxchange.com/llms.txt');
    expect(text).toContain('directional underwriter estimates');
    expect(text).toContain('not certified appraisals');
  });
});
