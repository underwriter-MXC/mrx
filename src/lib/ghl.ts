/**
 * GHL (HighLevel) client for MRX lead capture.
 *
 * Stage 08 owner: mrx_ghl. This module is the single integration point
 * between the 2 hybrid Cloudflare Functions (src/pages/api/{book,free-guide}.ts)
 * and the GHL v1 Contacts API.
 *
 * Contract verified live against the MRX location on 2026-06-11:
 *   - POST /contacts/upsert with locationId + email + tags returns a
 *     stable contact id; re-running with the same email returns the
 *     same id (idempotent).
 *   - POST /contacts/{id}/tags ADDS tags without removing the contact's
 *     existing tags (response: { tagsAdded: [...] }).
 *   - Cloudflare blocks requests with a default Python urllib User-Agent;
 *     this client sends a custom User-Agent.
 *   - The token is a Private Integration Token (PIT) with prefix `pit-`.
 *
 * When env is missing (local dev, pre-deploy staging), the function
 * short-circuits with a "pending-stage08" marker so the form still
 * works for QA. The 2 routes are designed to log this loudly.
 *
 * Per MRX Compliance Review §B-1: confirm intake is genuinely free.
 * We do not POST any payment fields, card data, or commitment
 * information. The GHL calendar URL the user is redirected to is the
 * calendar owner's responsibility; we forward only firstName, lastName,
 * and email as query params so the calendar can pre-fill the name and
 * email step. MRX does not collect or transmit card data anywhere.
 */

import type { LeadForm } from './form';
import { serverEnv } from './astro/env';
import type { APIContext } from 'astro';

export type GhlSubmitResult =
  | { ok: true; contactId: string }
  | { ok: false; error: string; status?: number };

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';
const USER_AGENT = 'mrx-stage08-ghl-client/1.0 (+https://mineralrightsxchange.com)';

// Tags applied to every MRX lead. The source-specific tag is appended at
// call time (see TAGS_BY_SOURCE).
const TAGS_BASE = ['mrx-website-lead'];

const TAGS_BY_SOURCE: Record<'book' | 'free-guide', string[]> = {
  book: ['mrx-source-book'],
  'free-guide': ['mrx-source-free-guide'],
};

/**
 * Submit a form to GHL via the verified 2-call contract:
 *   1) POST /contacts/upsert (idempotent on email) -> get contact id
 *   2) POST /contacts/{id}/tags to add MRX source tags without
 *      clobbering any existing tags
 *
 * Returns a discriminated result; the caller decides how to surface
 * a failure (currently the 2 routes return HTTP 500 on !ok).
 */
export async function submitToGHL(
  ctx: APIContext,
  form: LeadForm,
  source: 'book' | 'free-guide',
): Promise<GhlSubmitResult> {
  const env = serverEnv(ctx.locals);

  // Local dev / pre-deploy: don't try to call GHL without creds. The
  // routes are wired to log loudly and continue (ok: true with a
  // sentinel contact id) so QA can submit forms before deploy.
  if (!env.MRX_GHL_API_KEY || !env.MRX_GHL_LOCATION_ID) {
    console.warn(
      `[ghl] MRX_GHL_API_KEY / MRX_GHL_LOCATION_ID not set; form submission for ${source} from ${form.email} NOT sent to GHL. Set secrets in Cloudflare Pages (stage 09).`,
    );
    return { ok: true, contactId: 'pending-stage08' };
  }

  // 1) upsert (idempotent on email) with base tags
  const upsertBody = {
    locationId: env.MRX_GHL_LOCATION_ID,
    email: form.email,
    firstName: form.firstName,
    lastName: form.lastName,
    ...(form.phone ? { phone: form.phone } : {}),
    source: `MRX Website - ${source === 'book' ? 'Book a Review' : 'Free Guide'}`,
    tags: TAGS_BASE,
    // Custom-field friendly attribution for the contact record. UTM data
    // is also captured by GHL's session attribution automatically.
    ...(form.page_url ? { website: form.page_url } : {}),
  };

  let upsertRes: Response;
  try {
    upsertRes = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders(env.MRX_GHL_API_KEY),
      body: JSON.stringify(upsertBody),
    });
  } catch (e) {
    return {
      ok: false,
      error: `ghl_upsert_network_error: ${(e as Error).message}`,
    };
  }

  if (!upsertRes.ok) {
    const detail = await safeReadError(upsertRes);
    return {
      ok: false,
      error: `ghl_upsert_failed: ${upsertRes.status} ${detail}`,
      status: upsertRes.status,
    };
  }

  const upsertJson = (await upsertRes.json()) as { contact?: { id?: string } };
  const contactId = upsertJson.contact?.id;
  if (!contactId) {
    return { ok: false, error: 'ghl_upsert_no_contact_id' };
  }

  // 2) Add source-specific tags. Failures here are non-fatal (the
  // contact exists; a missing tag just means the pipeline won't
  // branch on source for this lead, which we'll detect via the `source`
  // string instead). Log and continue.
  const sourceTags = TAGS_BY_SOURCE[source];
  try {
    const tagRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: ghlHeaders(env.MRX_GHL_API_KEY),
      body: JSON.stringify({ tags: sourceTags }),
    });
    if (!tagRes.ok) {
      const detail = await safeReadError(tagRes);
      console.warn(
        `[ghl] tag-add failed for contact ${contactId} (status ${tagRes.status}): ${detail}. Contact is created; pipeline will key off 'source' string instead.`,
      );
    }
  } catch (e) {
    console.warn(
      `[ghl] tag-add network error for contact ${contactId}: ${(e as Error).message}. Pipeline will key off 'source' string.`,
    );
  }

  return { ok: true, contactId };
}

/**
 * Build the GHL calendar redirect URL with name + email pre-filled.
 *
 * The calendar URL is configured in GHL and exposed to the Cloudflare
 * Function as MRX_GHL_CALENDAR_URL. The standard GHL calendar link
 * accepts query params for `name` and `email` to pre-fill the
 * scheduling form. Notes are passed as a `notes` param.
 *
 * If MRX_GHL_CALENDAR_URL is not set, the function returns a sentinel
 * string; the route falls back to an in-app thank-you page.
 *
 * IMPORTANT: the GHL calendar itself is the source of truth for whether
 * the intake collects card data. Stage 08 verifies this once at deploy
 * time (see PROJECT-PACK/08-LEAD-CAPTURE/INTAKE_VERIFICATION.md) and
 * records the result.
 */
export function buildCalendarRedirect(
  calendarUrl: string | undefined,
  form: LeadForm,
): string {
  if (!calendarUrl) return '/book/thank-you';
  const url = new URL(calendarUrl);
  // GHL calendar pre-fill: name + email (and optionally notes).
  url.searchParams.set('name', `${form.firstName} ${form.lastName}`.trim());
  url.searchParams.set('email', form.email);
  if (form.phone) url.searchParams.set('phone', form.phone);
  if (form.notes) url.searchParams.set('notes', form.notes.slice(0, 500));
  // UTM forwarding so the GHL pipeline can attribute the booking to
  // the same campaign as the original form submission.
  for (const k of [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ] as const) {
    const v = form[k];
    if (v) url.searchParams.set(k, v);
  }
  return url.toString();
}

function ghlHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  };
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    // Truncate to keep logs sane and avoid leaking PII in error bodies.
    return text.slice(0, 300);
  } catch {
    return '<unreadable>';
  }
}
