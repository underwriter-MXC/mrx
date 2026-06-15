import { describe, it, expect } from 'vitest';
import { LeadFormSchema } from '../../src/lib/form';

const VALID = {
  firstName: 'Carolyn',
  lastName: 'Hill',
  email: 'carolyn@example.com',
  phone: '+1 555 555 5555',
  notes: 'I have an offer in hand from a buyer who wants to close in 30 days.',
  consent: 'on' as const,
};

describe('LeadFormSchema (zod)', () => {
  it('accepts a complete valid form', () => {
    const r = LeadFormSchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it('requires consent (no consent => fail)', () => {
    const { consent, ...without } = VALID;
    void consent;
    const r = LeadFormSchema.safeParse(without);
    expect(r.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const r = LeadFormSchema.safeParse({ ...VALID, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid phone (letters)', () => {
    const r = LeadFormSchema.safeParse({ ...VALID, phone: 'abc' });
    expect(r.success).toBe(false);
  });

  it('does NOT collect sensitive data fields (no SSN, DOB, bank)', () => {
    const serialized = JSON.stringify(LeadFormSchema.shape);
    expect(serialized).not.toMatch(/ssn|social_security|date_of_birth|dob|routing|bank_account/i);
  });
});
