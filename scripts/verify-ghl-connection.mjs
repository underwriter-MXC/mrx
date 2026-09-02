#!/usr/bin/env node

/**
 * Read-only GoHighLevel connection check for the Ask Travis booking flow.
 * It validates the configured calendar and fetches availability without
 * creating contacts, messages, or appointments.
 */

const token =
  process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.MRX_GHL_API_KEY || process.env.GHL_API_TOKEN;
const locationId = process.env.GHL_LOCATION_ID || process.env.MRX_GHL_LOCATION_ID;
const calendarId =
  process.env.GHL_CALENDAR_ID || process.env.MRX_GHL_CALENDAR_ID || 'mEqrbWIelaS7o5TMsqUX';
const assignedUserId = process.env.GHL_ASSIGNED_USER_ID;
const emailFrom = (
  process.env.GHL_EMAIL_FROM || 'underwriter@mineralrightsxchange.com'
).toLowerCase();
const missing = [
  !token && 'GHL_PRIVATE_INTEGRATION_TOKEN or MRX_GHL_API_KEY or GHL_API_TOKEN',
  !assignedUserId && 'GHL_ASSIGNED_USER_ID',
].filter(Boolean);

if (missing.length) {
  console.error(`Ask Travis live booking is not configured. Missing: ${missing.join(', ')}`);
  process.exit(2);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Version: 'v3',
  Accept: 'application/json',
};
const base = 'https://services.leadconnectorhq.com';

async function checkedJson(url, label) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`${label} failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}

try {
  const calendar = await checkedJson(
    `${base}/calendars/${encodeURIComponent(calendarId)}`,
    'Calendar lookup',
  );
  const assignedUser = await checkedJson(
    `${base}/users/${encodeURIComponent(assignedUserId)}`,
    'Assigned underwriter lookup',
  );
  const start = Date.now();
  const end = start + 7 * 24 * 60 * 60 * 1_000;
  const availabilityUrl = new URL(`${base}/calendars/${encodeURIComponent(calendarId)}/free-slots`);
  availabilityUrl.searchParams.set('startDate', String(start));
  availabilityUrl.searchParams.set('endDate', String(end));
  availabilityUrl.searchParams.set('timezone', process.env.MRX_TEST_TIMEZONE || 'America/Chicago');
  const availability = await checkedJson(availabilityUrl, 'Availability lookup');
  const slotCount = Object.values(availability).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length;
    if (value && typeof value === 'object') {
      const slots = value.slots || value.freeSlots;
      return total + (Array.isArray(slots) ? slots.length : 0);
    }
    return total;
  }, 0);
  const resolvedCalendar = calendar.calendar || calendar;
  const resolvedLocationId = locationId || resolvedCalendar.locationId;
  if (!resolvedLocationId) {
    throw new Error('The MRX calendar did not return a HighLevel location ID.');
  }
  if (locationId && resolvedCalendar.locationId && resolvedCalendar.locationId !== locationId) {
    throw new Error('The configured calendar belongs to a different HighLevel location.');
  }
  if (String(assignedUser.email || '').toLowerCase() !== emailFrom) {
    throw new Error('The configured HighLevel appointment owner does not match GHL_EMAIL_FROM.');
  }
  console.log(
    `HighLevel connection verified: ${resolvedCalendar.name || 'MRX calendar'}; appointment owner ${emailFrom}; ${slotCount} slots found in the next 7 days.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'HighLevel connection check failed.');
  process.exit(1);
}
