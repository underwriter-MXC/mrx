import { describe, it, expect } from 'vitest';
import {
  FreeGuideLeadFormSchema,
  GUIDE_DELIVERY_CONSENT_VERSION,
  GUIDE_SLUG,
  GUIDE_TITLE,
  LeadFormBaseSchema,
  LeadFormSchema,
} from '../../src/lib/form';

const VALID = {
  firstName: 'Carolyn',
  lastName: 'Hill',
  email: 'carolyn@example.com',
  phone: '+1 555 555 5555',
  notes: 'I have an offer in hand from a buyer who wants to close in 30 days.',
  consent: 'on' as const,
};

const VALID_FREE_GUIDE = {
  ...VALID,
  requested_guide: GUIDE_SLUG,
  guide_title: GUIDE_TITLE,
  consent_version: GUIDE_DELIVERY_CONSENT_VERSION,
  guide_email_consent_text: 'Send me the requested guide by email.',
};

describe('LeadFormSchema (zod)', () => {
  it('accepts a complete valid form', () => {
    const r = LeadFormSchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it('requires guide email delivery consent (no consent => fail)', () => {
    const { consent, ...without } = VALID_FREE_GUIDE;
    void consent;
    const r = FreeGuideLeadFormSchema.safeParse(without);
    expect(r.success).toBe(false);
  });

  it('keeps optional marketing, SMS, and call consents non-required', () => {
    const r = FreeGuideLeadFormSchema.safeParse({
      ...VALID_FREE_GUIDE,
      firstName: '',
      lastName: '',
      phone: '',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.marketing_email_consent).toBeUndefined();
      expect(r.data.sms_consent).toBeUndefined();
      expect(r.data.call_consent).toBeUndefined();
    }
  });

  it('requires phone only when optional SMS or call consent is checked', () => {
    expect(
      FreeGuideLeadFormSchema.safeParse({ ...VALID_FREE_GUIDE, phone: '', sms_consent: 'on' })
        .success,
    ).toBe(false);
    expect(
      FreeGuideLeadFormSchema.safeParse({ ...VALID_FREE_GUIDE, phone: '', call_consent: 'on' })
        .success,
    ).toBe(false);
    expect(
      FreeGuideLeadFormSchema.safeParse({
        ...VALID_FREE_GUIDE,
        phone: '+1 555 555 5555',
        sms_consent: 'on',
      }).success,
    ).toBe(true);
  });

  it('keeps first and last name required for booking submissions', () => {
    expect(LeadFormSchema.safeParse({ ...VALID, firstName: '' }).success).toBe(false);
    expect(LeadFormSchema.safeParse({ ...VALID, lastName: '' }).success).toBe(false);
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
    const serialized = JSON.stringify(LeadFormBaseSchema.shape);
    expect(serialized).not.toMatch(/ssn|social_security|date_of_birth|dob|routing|bank_account/i);
  });
});
