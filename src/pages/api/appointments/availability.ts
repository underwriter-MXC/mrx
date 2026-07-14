import type { APIRoute } from 'astro';
import { getAvailability, ghlConfigured } from '../../../lib/platform/ghl';
import { assertRateLimit, clientKey, json, safeError } from '../../../lib/platform/security';

export const GET: APIRoute = async (context) => {
  try {
    assertRateLimit(`availability:${clientKey(context)}`, 12);
    if (!ghlConfigured()) return json({ ok: false, error: 'booking_not_configured', options: [] }, { status: 503 });
    const timezone = context.url.searchParams.get('timezone') || 'America/Chicago';
    const preference = context.url.searchParams.get('preference') || undefined;
    const requestedDay = context.url.searchParams.get('day') === 'tomorrow' ? 'tomorrow' : 'next_available';
    const options = await getAvailability(timezone, preference, requestedDay);
    return json({ ok: true, options });
  } catch (error) {
    return safeError(error);
  }
};
