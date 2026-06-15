import { describe, it, expect } from 'vitest';
import { DISCLAIMER_TEXT } from '../../compliance/disclaimer';
import { DISCLAIMER_TEXT as ReExported, DISCLAIMER_SHORT } from '../../src/lib/disclaimer';

describe('§7 disclaimer', () => {
  it('is non-empty and at least 200 chars', () => {
    expect(DISCLAIMER_TEXT.length).toBeGreaterThan(200);
  });

  it('contains the "not certified appraisals" language', () => {
    expect(DISCLAIMER_TEXT).toMatch(/not certified appraisals/i);
  });

  it('contains the MRX-as-buyer disclosure (compliance review §7 last sentence)', () => {
    expect(DISCLAIMER_TEXT).toMatch(/MRX may be a buyer/i);
  });

  it('re-exports the same text through src/lib/disclaimer.ts', () => {
    expect(ReExported).toBe(DISCLAIMER_TEXT);
  });

  it('provides a short form', () => {
    expect(DISCLAIMER_SHORT.length).toBeGreaterThan(50);
    expect(DISCLAIMER_SHORT).toMatch(/not certified appraisals/i);
  });
});
