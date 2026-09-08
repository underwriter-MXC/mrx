import { runtimeEnv } from './runtime-env';
import { privacySafeAnalyticsParams, privacySafeProfileIdentifier } from './attribution-outcomes';

export type Ga4ServerEvent =
  | 'appointment_held'
  | 'case_ready'
  | 'relevant_case_completed'
  | 'case_human_review_completed'
  | 'case_agreed_next_step';

/**
 * Send privacy-safe server lifecycle events that cannot be emitted reliably
 * from a browser (for example, a held appointment or finalized case).
 * Configuration is optional so local/test requests never reach GA4.
 */
export async function sendGa4ServerEvent(args: {
  event: Ga4ServerEvent;
  profileId: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  analyticsConsent?: 'granted' | 'withdrawn' | 'unavailable';
}) {
  const measurementId = runtimeEnv('GA4_MEASUREMENT_ID');
  const apiSecret = runtimeEnv('GA4_API_SECRET');
  if (args.analyticsConsent !== 'granted')
    return { sent: false, reason: 'consent_not_granted' as const };
  if (!measurementId || !apiSecret) return { sent: false, reason: 'not_configured' as const };

  const privacySafeProfileId = await privacySafeProfileIdentifier(args.profileId);
  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: privacySafeProfileId,
        user_id: privacySafeProfileId,
        events: [
          {
            name: args.event,
            params: {
              engagement_time_msec: 1,
              ...privacySafeAnalyticsParams(args.params ?? {}),
            },
          },
        ],
      }),
    },
  );
  if (!response.ok) throw new Error(`ga4_measurement_protocol_failed_${response.status}`);
  return { sent: true as const };
}
