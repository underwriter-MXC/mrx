/**
 * GHL (HighLevel) client for MRX lead capture.
 *
 * Stage 08 owner: mrx_ghl. This module is the single integration point
 * between the 2 hybrid Cloudflare Functions (src/pages/api/{book,free-guide}.ts)
 * and the GHL Contacts API.
 */

import type { LeadForm } from './form';
import {
  CALL_CONSENT_TEXT,
  GUIDE_DELIVERY_CONSENT_VERSION,
  GUIDE_DOWNLOAD_PATH,
  GUIDE_EMAIL_CONSENT_TEXT,
  GUIDE_TITLE,
  MARKETING_EMAIL_CONSENT_TEXT,
  SMS_CONSENT_TEXT,
  normalizeLeadConsent,
} from './form';
import { serverEnv } from './astro/env';
import type { APIContext } from 'astro';

export type GhlSubmitResult =
  | { ok: true; contactId: string }
  | { ok: false; error: string; status?: number };

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';
const GHL_CONVERSATIONS_API_VERSION = '2021-04-15';
const USER_AGENT = 'mrx-stage08-ghl-client/1.1 (+https://mineralrightsxchange.com)';
const FALLBACK_SITE_URL = 'https://mineralrightsxchange.com';

const TAGS_BASE = ['mrx-website-lead'];

const TAGS_BY_SOURCE: Record<'book' | 'free-guide', string[]> = {
  book: ['mrx-source-book'],
  'free-guide': ['mrx-source-free-guide', 'mrx-guide-requested'],
};

const GUIDE_EMAIL_SUBJECT = `Your MRX guide: ${GUIDE_TITLE}`;

export function resolveGuideUrl(_form: Pick<LeadForm, 'page_url'>, configuredUrl?: string) {
  if (configuredUrl) return configuredUrl;
  // Never derive an outbound email/SMS link from the client-supplied page URL;
  // otherwise a forged form POST could turn MRX delivery into a phishing link.
  return new URL(GUIDE_DOWNLOAD_PATH, FALLBACK_SITE_URL).toString();
}

export async function submitToGHL(
  ctx: APIContext,
  form: LeadForm,
  source: 'book' | 'free-guide',
): Promise<GhlSubmitResult> {
  const env = serverEnv(ctx.locals);

  if (env.MRX_DISABLE_GHL_PROVIDER_WRITES === '1') {
    console.warn(
      `[ghl] MRX_DISABLE_GHL_PROVIDER_WRITES=1; form submission for ${source} from ${form.email} NOT sent to GHL.`,
    );
    return { ok: true, contactId: 'pending-e2e-provider-disabled' };
  }

  if (!env.MRX_GHL_API_KEY || !env.MRX_GHL_LOCATION_ID) {
    console.warn(
      `[ghl] MRX_GHL_API_KEY / MRX_GHL_LOCATION_ID not set; form submission for ${source} from ${form.email} NOT sent to GHL. Set secrets in Cloudflare Pages.`,
    );
    return { ok: true, contactId: 'pending-stage08' };
  }

  const upsertBody = buildUpsertBody(
    form,
    source,
    env.MRX_GHL_LOCATION_ID,
    resolveGuideUrl(form, env.MRX_PDF_URL),
    consentAuditMetadata(ctx),
  );

  let upsertRes: Response;
  try {
    upsertRes = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders(env.MRX_GHL_API_KEY),
      body: JSON.stringify(upsertBody),
    });
  } catch (e) {
    return { ok: false, error: `ghl_upsert_network_error: ${(e as Error).message}` };
  }

  if (!upsertRes.ok) {
    const detail = await safeReadError(upsertRes);
    return {
      ok: false,
      error: `ghl_upsert_failed: ${upsertRes.status} ${detail}`,
      status: upsertRes.status,
    };
  }

  const upsertJson = (await upsertRes.json()) as { contact?: { id?: string }; id?: string };
  const contactId = upsertJson.contact?.id || upsertJson.id;
  if (!contactId) return { ok: false, error: 'ghl_upsert_no_contact_id' };

  const sourceTags = [
    ...TAGS_BY_SOURCE[source],
    ...(source === 'free-guide' ? freeGuideConsentTags(form) : []),
  ];
  await addTags(env.MRX_GHL_API_KEY, contactId, sourceTags);

  if (source === 'free-guide') {
    try {
      await runFreeGuideAutomation({
        apiKey: env.MRX_GHL_API_KEY,
        contactId,
        form,
        guideUrl: resolveGuideUrl(form, env.MRX_PDF_URL),
        workflowId: env.GHL_FREE_GUIDE_WORKFLOW_ID,
      });
    } catch (e) {
      return { ok: false, error: `ghl_free_guide_delivery_failed: ${(e as Error).message}` };
    }
  }

  return { ok: true, contactId };
}

function buildUpsertBody(
  form: LeadForm,
  source: 'book' | 'free-guide',
  locationId: string,
  guideUrl: string,
  audit: ConsentAuditMetadata,
) {
  return {
    locationId,
    email: form.email,
    firstName: form.firstName,
    lastName: form.lastName,
    ...(form.phone ? { phone: form.phone } : {}),
    source: `MRX Website - ${source === 'book' ? 'Book a Review' : 'Free Guide'}`,
    tags: TAGS_BASE,
    ...(form.page_url ? { website: form.page_url } : {}),
    ...(source === 'free-guide'
      ? {
          customFields: freeGuideCustomFields(form, guideUrl, audit),
        }
      : {}),
  };
}

type ConsentAuditMetadata = {
  serverTimestamp: string;
  userAgent: string;
  requestIpPresent: string;
};

function consentAuditMetadata(ctx: APIContext): ConsentAuditMetadata {
  return {
    serverTimestamp: new Date().toISOString(),
    userAgent: ctx.request.headers.get('user-agent')?.slice(0, 500) || '',
    requestIpPresent: String(
      Boolean(
        ctx.request.headers.get('cf-connecting-ip') || ctx.request.headers.get('x-forwarded-for'),
      ),
    ),
  };
}

function freeGuideCustomFields(form: LeadForm, guideUrl: string, audit: ConsentAuditMetadata) {
  const consent = normalizeLeadConsent(form);
  const fields = [
    {
      key: 'contact.mrx_requested_guide',
      fieldValue: form.requested_guide || 'how-to-find-out-what-your-mineral-rights-are',
    },
    { key: 'contact.mrx_requested_guide_title', fieldValue: form.guide_title || GUIDE_TITLE },
    { key: 'contact.mrx_requested_guide_url', fieldValue: guideUrl },
    { key: 'contact.mrx_email_permission', fieldValue: String(consent.guideEmail) },
    { key: 'contact.mrx_guide_email_permission', fieldValue: String(consent.guideEmail) },
    {
      key: 'contact.mrx_free_guide_marketing_email_consent',
      fieldValue: String(consent.marketingEmail),
    },
    { key: 'contact.mrx_free_guide_sms_consent', fieldValue: String(consent.sms) },
    { key: 'contact.mrx_free_guide_call_consent', fieldValue: String(consent.call) },
    {
      key: 'contact.mrx_consent_version',
      fieldValue: consent.version || GUIDE_DELIVERY_CONSENT_VERSION,
    },
    { key: 'contact.mrx_guide_email_consent_text', fieldValue: GUIDE_EMAIL_CONSENT_TEXT },
    { key: 'contact.mrx_marketing_email_consent_text', fieldValue: MARKETING_EMAIL_CONSENT_TEXT },
    { key: 'contact.mrx_sms_consent_text', fieldValue: SMS_CONSENT_TEXT },
    { key: 'contact.mrx_call_consent_text', fieldValue: CALL_CONSENT_TEXT },
    {
      key: 'contact.mrx_consent_client_timestamp',
      fieldValue: form.consent_client_timestamp || '',
    },
    { key: 'contact.mrx_consent_server_timestamp', fieldValue: audit.serverTimestamp },
    { key: 'contact.mrx_consent_timezone_offset', fieldValue: form.consent_timezone_offset || '' },
    { key: 'contact.mrx_consent_user_agent', fieldValue: audit.userAgent },
    { key: 'contact.mrx_consent_request_ip_present', fieldValue: audit.requestIpPresent },
    { key: 'contact.mrx_source_url', fieldValue: form.page_url || '' },
    { key: 'contact.mrx_utm_source', fieldValue: form.utm_source || '' },
    { key: 'contact.mrx_utm_medium', fieldValue: form.utm_medium || '' },
    { key: 'contact.mrx_utm_campaign', fieldValue: form.utm_campaign || '' },
    { key: 'contact.mrx_utm_content', fieldValue: form.utm_content || '' },
    { key: 'contact.mrx_utm_term', fieldValue: form.utm_term || '' },
    { key: 'contact.mrx_lead_source_tag', fieldValue: 'FREE_GUIDE' },
  ];

  // An unchecked box is not an affirmative revocation of an older consent
  // recorded for another MRX interaction. Write the source-specific receipt
  // as true/false, but only promote global permissions when this form grants
  // them explicitly. Existing GHL DND state remains authoritative.
  if (consent.marketingEmail) {
    fields.push({ key: 'contact.mrx_marketing_email_permission', fieldValue: 'true' });
  }
  if (consent.sms) {
    fields.push(
      { key: 'contact.mrx_sms_permission', fieldValue: 'true' },
      { key: 'contact.mrx_marketing_sms_permission', fieldValue: 'true' },
    );
  }
  if (consent.call) {
    fields.push(
      { key: 'contact.mrx_call_permission', fieldValue: 'true' },
      { key: 'contact.mrx_ai_voice_permission', fieldValue: 'true' },
    );
  }

  return fields;
}

function freeGuideConsentTags(form: LeadForm) {
  const consent = normalizeLeadConsent(form);
  return [
    ...(consent.marketingEmail ? ['mrx-free-guide-marketing-email-consent'] : []),
    ...(consent.sms ? ['mrx-free-guide-sms-consent'] : []),
    ...(consent.call ? ['mrx-free-guide-call-consent'] : []),
  ];
}

async function addTags(apiKey: string, contactId: string, tags: string[]) {
  try {
    const tagRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: ghlHeaders(apiKey),
      body: JSON.stringify({ tags }),
    });
    if (!tagRes.ok) {
      const detail = await safeReadError(tagRes);
      console.warn(
        `[ghl] tag-add failed for contact ${contactId} (status ${tagRes.status}): ${detail}.`,
      );
    }
  } catch (e) {
    console.warn(`[ghl] tag-add network error for contact ${contactId}: ${(e as Error).message}.`);
  }
}

async function runFreeGuideAutomation(args: {
  apiKey: string;
  contactId: string;
  form: LeadForm;
  guideUrl: string;
  workflowId?: string;
}) {
  // A configured GHL workflow owns delivery and follow-up. Do not also send
  // messages directly or the contact can receive duplicates.
  if (args.workflowId) {
    await enrollWorkflow(args.apiKey, args.contactId, args.workflowId);
    return;
  }

  // Until a workflow ID is configured, preserve reliable guide delivery via
  // the same GHL conversations API. SMS remains strictly consent-gated.
  await sendGuideEmail(args.apiKey, args.contactId, args.form, args.guideUrl);
  const optionalTasks: Array<Promise<unknown>> = [];
  if (args.form.sms_consent === 'on' && args.form.phone) {
    optionalTasks.push(sendGuideSms(args.apiKey, args.contactId, args.form, args.guideUrl));
  }
  const results = await Promise.allSettled(optionalTasks);
  for (const result of results) {
    if (result.status === 'rejected')
      console.warn(`[ghl] optional free-guide automation step failed: ${result.reason}`);
  }
}

async function sendGuideEmail(apiKey: string, contactId: string, form: LeadForm, guideUrl: string) {
  const firstName = form.firstName?.trim() || 'there';
  const message = `Hi ${firstName},\n\nHere is the MRX guide you requested, "${GUIDE_TITLE}": ${guideUrl}\n\nThis guide is general educational information, not legal, tax, or valuation advice.\n\nElena\nMineral Rights Xchange`;
  const html = `<p>Hi ${escapeHtml(firstName)},</p><p>Here is the MRX guide you requested, <strong>${escapeHtml(GUIDE_TITLE)}</strong>:</p><p><a href="${escapeHtml(guideUrl)}">Open the guide</a></p><p>This guide is general educational information, not legal, tax, or valuation advice.</p><p>Elena<br />Mineral Rights Xchange</p>`;
  return sendGhlMessage(apiKey, {
    contactId,
    type: 'Email',
    emailTo: form.email,
    subject: GUIDE_EMAIL_SUBJECT,
    message,
    html,
  });
}

async function sendGuideSms(apiKey: string, contactId: string, form: LeadForm, guideUrl: string) {
  const firstName = form.firstName?.trim() || 'there';
  if (!form.phone) throw new Error('sms_phone_missing');
  return sendGhlMessage(apiKey, {
    contactId,
    type: 'SMS',
    toNumber: form.phone,
    message: `Hi ${firstName}, this is Elena with Mineral Rights Xchange. I just sent your guide, "${GUIDE_TITLE}." Were you able to open it? Here is the link again: ${guideUrl}. Reply STOP to opt out or HELP for help.`,
  });
}

async function enrollWorkflow(apiKey: string, contactId: string, workflowId: string) {
  const response = await fetch(
    `${GHL_API_BASE}/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(workflowId)}`,
    { method: 'POST', headers: ghlHeaders(apiKey) },
  );
  if (!response.ok) throw new Error(`GHL workflow enrollment failed (${response.status})`);
}

async function sendGhlMessage(
  apiKey: string,
  args: {
    contactId: string;
    type: 'Email' | 'SMS';
    message: string;
    subject?: string;
    html?: string;
    emailTo?: string;
    toNumber?: string;
  },
) {
  const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: ghlHeaders(apiKey, GHL_CONVERSATIONS_API_VERSION),
    body: JSON.stringify({ ...args, status: 'pending' }),
  });
  if (!response.ok) throw new Error(`GHL ${args.type.toLowerCase()} failed (${response.status})`);
  return response.json().catch(() => ({}));
}

export function buildCalendarRedirect(calendarUrl: string | undefined, form: LeadForm): string {
  if (!calendarUrl) return '/book/thank-you';
  const url = new URL(calendarUrl);
  const name = `${form.firstName || ''} ${form.lastName || ''}`.trim();
  if (name) url.searchParams.set('name', name);
  url.searchParams.set('email', form.email);
  if (form.phone) url.searchParams.set('phone', form.phone);
  if (form.notes) url.searchParams.set('notes', form.notes.slice(0, 500));
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

function ghlHeaders(apiKey: string, version = GHL_API_VERSION): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Version: version,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ||
      character,
  );
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 300);
  } catch {
    return '<unreadable>';
  }
}
