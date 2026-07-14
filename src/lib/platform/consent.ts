import type { ContactProfile } from './types';

export const CONSENT_VERSION = '2026-07-13-draft';

export const CONSENT_DISCLOSURES: Record<keyof ContactProfile['permissions'], string> = {
  email: 'Email the information or appointment details I specifically requested from MRX.',
  sms: 'Text the links or appointment details I specifically requested from MRX. Message and data rates may apply; reply STOP to opt out or HELP for help.',
  marketingSms: 'Optional: text me educational MRX updates. This is not required to book.',
  call: 'I agree to receive the specific MRX phone call I requested.',
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

export function consentRows(profileId: string, profile: ContactProfile) {
  const utm = utmContext(profile.sourceUrl);
  return Object.entries(profile.permissions).map(([channel, granted]) => ({
    profile_id: profileId,
    channel,
    granted,
    disclosure_version: CONSENT_VERSION,
    disclosure_text: CONSENT_DISCLOSURES[channel as keyof ContactProfile['permissions']],
    submitted_value: String(granted),
    source_url: profile.sourceUrl,
    utm,
  }));
}
