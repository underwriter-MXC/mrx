import { runtimeEnv } from './runtime-env';

/**
 * Send privacy-safe server lifecycle events that cannot be emitted reliably
 * from a browser (for example, a held appointment or finalized case).
 * Configuration is optional so local/test requests never reach GA4.
 */
export async function sendGa4ServerEvent(args: {
  event: 'appointment_held' | 'case_ready';
  profileId: string;
  params?: Record<string, string | number | boolean | null | undefined>;
}) {
  const measurementId = runtimeEnv('GA4_MEASUREMENT_ID');
  const apiSecret = runtimeEnv('GA4_API_SECRET');
  if (!measurementId || !apiSecret) return { sent: false, reason: 'not_configured' as const };

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: `mrx.${args.profileId}`,
        user_id: args.profileId,
        events: [
          {
            name: args.event,
            params: {
              engagement_time_msec: 1,
              ...(args.params ?? {}),
            },
          },
        ],
      }),
    },
  );
  if (!response.ok) throw new Error(`ga4_measurement_protocol_failed_${response.status}`);
  return { sent: true as const };
}
