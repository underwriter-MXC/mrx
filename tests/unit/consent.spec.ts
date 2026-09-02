import { describe, expect, it } from 'vitest';
import {
  CONSENT_VERSION,
  consentRows,
  HUMAN_CALL_DISCLOSURE_VERSION,
  isHumanCallChannelEnabled,
  safeConsentSourceUrl,
} from '../../src/lib/platform/consent';

describe('versioned communication receipts', () => {
  it('gates the human-call channel behind a published disclosure version', () => {
    // Per CEO P3 the human-call channel must be disabled until compliance signs
    // off on the disclosure text. The default is `pending` so the channel is
    // closed and Ask Travis must short-circuit without writing any receipt.
    expect(HUMAN_CALL_DISCLOSURE_VERSION).toBe('pending');
    expect(isHumanCallChannelEnabled()).toBe(false);
  });

  it('records every channel separately with exact text and UTM context', () => {
    const rows = consentRows('profile-1', {
      firstName: 'Owner',
      email: 'owner@example.com',
      phone: '+15555550123',
      permissions: { email: true, sms: false, marketingSms: false, call: true, aiVoice: false },
      disclosureVersion: 'untrusted-client-version',
      sourceUrl: 'https://mineralrightsxchange.com/book/?utm_source=search&utm_campaign=offers',
    });
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.disclosure_version === CONSENT_VERSION)).toBe(true);
    expect(rows.every((row) => row.disclosure_text.length > 20)).toBe(true);
    expect(rows.find((row) => row.channel === 'sms')?.submitted_value).toBe('false');
    expect(rows.every((row) => row.source_url === 'https://mineralrightsxchange.com/book/')).toBe(
      true,
    );
    expect(rows[0].utm).toEqual({ utm_source: 'search', utm_campaign: 'offers' });
  });

  it('strips query strings and fragments from consent source URLs', () => {
    expect(
      safeConsentSourceUrl(
        'https://mineralrightsxchange.com/account/?email=owner@example.com#private-docs',
      ),
    ).toBe('https://mineralrightsxchange.com/account/');
    expect(safeConsentSourceUrl('not-a-url')).toBe('');
  });

  it('records account signup update permissions as separate optional channel receipts', () => {
    const rows = consentRows(
      'profile-1',
      {
        firstName: 'Owner',
        lastName: 'Example',
        email: 'owner@example.com',
        phone: '+155****0123',
        permissions: { email: true, sms: true, marketingSms: false, call: true, aiVoice: true },
        disclosureVersion: 'untrusted-client-version',
        sourceUrl: 'https://mineralrightsxchange.com/account/?utm_medium=direct',
      },
      { purpose: 'requested_updates', channels: ['email', 'sms', 'call', 'aiVoice'] },
    );

    expect(rows.map((row) => row.channel)).toEqual(['email', 'sms', 'call', 'aiVoice']);
    expect(rows.every((row) => row.purpose === 'requested_updates')).toBe(true);
    expect(rows.find((row) => row.channel === 'email')?.destination).toBe('owner@example.com');
    expect(rows.find((row) => row.channel === 'call')?.destination).toBe('+155****0123');
    expect(rows.find((row) => row.channel === 'aiVoice')?.disclosure_text).toContain(
      'automated or AI-generated voice technology',
    );
  });

  it('human-call disclosure names MRX, the calling phone, and revocation rights', () => {
    const callDisclosure = consentRows(
      'profile-1',
      {
        firstName: 'Owner',
        email: 'owner@example.com',
        phone: '+155****0123',
        permissions: { email: false, sms: false, marketingSms: false, call: true, aiVoice: false },
        disclosureVersion: 'untrusted-client-version',
        sourceUrl: 'https://mineralrightsxchange.com/account/',
      },
      { purpose: 'requested_updates', channels: ['call'] },
    )[0];

    expect(callDisclosure.channel).toBe('call');
    expect(callDisclosure.granted).toBe(true);
    expect(callDisclosure.disclosure_text).toContain('human representative');
    expect(callDisclosure.disclosure_text).toContain('Mineral Rights Xchange');
    expect(callDisclosure.disclosure_text).toContain('designated contact number');
    expect(callDisclosure.disclosure_text).toContain('revoke');
    expect(callDisclosure.disclosure_text).toContain('optional');
  });
});
