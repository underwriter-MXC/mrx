import type { ContactProfile } from './types';

export const CONSENT_VERSION = '2026-07-15-ai-voice-draft';

/**
 * Human-call channel is gated on a published disclosure version. Until the
 * disclosure text receives compliance sign-off the channel is treated as
 * `pending` and the Ask Tommy prompt short-circuits to "I'll come back to
 * that" without writing any consent receipt.
 *
 * Set this constant to a dated, compliance-approved version string (e.g.
 * `'2026-07-21-human-call'`) to enable the channel. Leave it as `'pending'`
 * (the default) to disable.
 */
export const HUMAN_CALL_DISCLOSURE_VERSION: 'pending' | string = 'pending';

export function isHumanCallChannelEnabled(): boolean {
  return HUMAN_CALL_DISCLOSURE_VERSION !== 'pending';
}

export const CONSENT_DISCLOSURES: Record<keyof ContactProfile['permissions'], string> = {
  email:
    'I agree that Mineral Rights Xchange (MRX) may email me owner-account, document, appointment, and mineral-rights case updates I request. Permission is optional and may be revoked at any time.',
  sms: 'I agree that MRX may text me owner-account, document, appointment, and mineral-rights case updates I request. Message frequency varies. Message and data rates may apply; reply STOP to opt out or HELP for help. Permission is optional and may be revoked at any time.',
  marketingSms: 'Optional: text me educational MRX updates. This is not required to book.',
  call: 'I agree that a human representative from Mineral Rights Xchange (MRX) may call me at the phone number I provide about owner-account, document, appointment, and mineral-rights case updates I request. MRX is the calling party, the designated contact number is the one I provided, the call is optional, and I may revoke this permission at any time.',
  aiVoice:
    'I agree that MRX may use automated or AI-generated voice technology, including GoHighLevel Voice AI, to call me at the phone number I provide, identify MRX, and give only owner-account, document, appointment, and mineral-rights case updates I request. Permission is optional, may be revoked at any time, and is not required for website help.',
};

function utmContext(sourceUrl: string) {
  try {
    const params = new URL(sourceUrl).searchParams;
    return Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']
        .map((key) => [key, params.get(key)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
  } catch {
    return {};
  }
}

export function safeConsentSourceUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}

export function consentRows(
  profileId: string,
  profile: ContactProfile,
  options: {
    purpose?: string;
    channels?: Array<keyof ContactProfile['permissions']>;
  } = {},
) {
  const utm = utmContext(profile.sourceUrl);
  const sourceUrl = safeConsentSourceUrl(profile.sourceUrl);
  const channels =
    options.channels ??
    (Object.keys(profile.permissions) as Array<keyof ContactProfile['permissions']>);
  return channels.map((channel) => ({
    profile_id: profileId,
    channel,
    purpose: options.purpose ?? 'communication',
    granted: profile.permissions[channel],
    disclosure_version:
      channel === 'call' && HUMAN_CALL_DISCLOSURE_VERSION !== 'pending'
        ? HUMAN_CALL_DISCLOSURE_VERSION
        : CONSENT_VERSION,
    disclosure_text: CONSENT_DISCLOSURES[channel],
    submitted_value: String(profile.permissions[channel]),
    destination: channel === 'email' ? profile.email || null : profile.phone || null,
    source_url: sourceUrl,
    utm,
  }));
}
