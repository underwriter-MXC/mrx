import { describe, expect, it } from 'vitest';
import {
  hasDeviceOwnerProfile,
  normalizeEmail,
  normalizePhone,
  ownerAccountRedirectTo,
  sha256,
} from '../../src/lib/platform/identity';

describe('owner identity normalization', () => {
  it('normalizes email without using it as proof of identity', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });

  it('normalizes valid US phone numbers to E.164', () => {
    expect(normalizePhone('(410) 212-5608')).toBe('+14102125608');
    expect(normalizePhone('123')).toBeNull();
  });

  it('hashes device identifiers before database storage', async () => {
    const digest = await sha256('private-device-token');
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain('private-device-token');
  });

  it('requires the complete signup identity before granting same-device profile access', () => {
    expect(
      hasDeviceOwnerProfile({
        first_name: 'Riley',
        last_name: 'Owner',
        normalized_email: 'riley@example.com',
        normalized_phone: '+14325550101',
      }),
    ).toBe(true);
    expect(
      hasDeviceOwnerProfile({
        first_name: 'Riley',
        last_name: 'Owner',
        normalized_email: 'riley@example.com',
        normalized_phone: null,
      }),
    ).toBe(false);
  });

  it('pins owner magic-link redirects to account URLs on MRX origins', () => {
    const source = 'https://mineralrightsxchange.com/account/?welcome=conversation';

    expect(ownerAccountRedirectTo(source, 'https://evil.example/account/')).toBe(
      'https://mineralrightsxchange.com/account/',
    );
    expect(
      ownerAccountRedirectTo(source, 'https://mineralrightsxchange.com/account/?upload=1'),
    ).toBe('https://mineralrightsxchange.com/account/?upload=1');
    expect(
      ownerAccountRedirectTo('http://localhost:4321/account/', '/account/?welcome=conversation'),
    ).toBe('http://localhost:4321/account/?welcome=conversation');
  });
});
