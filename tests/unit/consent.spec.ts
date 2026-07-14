import { describe, expect, it } from 'vitest';
import { CONSENT_VERSION, consentRows } from '../../src/lib/platform/consent';

describe('versioned communication receipts', () => {
  it('records every channel separately with exact text and UTM context', () => {
    const rows = consentRows('profile-1', {
      firstName: 'Owner',
      email: 'owner@example.com',
      phone: '+15555550123',
      permissions: { email: true, sms: false, marketingSms: false, call: true },
      disclosureVersion: 'untrusted-client-version',
      sourceUrl: 'https://mineralrightsxchange.com/book/?utm_source=search&utm_campaign=offers',
    });
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.disclosure_version === CONSENT_VERSION)).toBe(true);
    expect(rows.every((row) => row.disclosure_text.length > 20)).toBe(true);
    expect(rows.find((row) => row.channel === 'sms')?.submitted_value).toBe('false');
    expect(rows[0].utm).toEqual({ utm_source: 'search', utm_campaign: 'offers' });
  });
});
