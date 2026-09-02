import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitToGHL, buildCalendarRedirect, resolveGuideUrl } from '../../src/lib/ghl';
import { GUIDE_DELIVERY_CONSENT_VERSION, GUIDE_SLUG, GUIDE_TITLE } from '../../src/lib/form';
import type { LeadForm } from '../../src/lib/form';

const VALID_FORM: LeadForm = {
  firstName: 'Carolyn',
  lastName: 'Hill',
  email: 'carolyn@example.com',
  phone: '+1 555 555 5555',
  notes: 'I have an offer in hand.',
  consent: 'on',
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'sell-mineral-rights-texas',
};

const FREE_GUIDE_FORM: LeadForm = {
  ...VALID_FORM,
  requested_guide: GUIDE_SLUG,
  guide_title: GUIDE_TITLE,
  consent_version: GUIDE_DELIVERY_CONSENT_VERSION,
  guide_email_consent_text: 'Send the requested guide by email.',
  marketing_email_consent_text: 'Optional marketing email disclosure.',
  sms_consent_text: 'Optional recurring automated SMS disclosure. Reply STOP or HELP.',
  call_consent_text: 'Optional AI-generated or prerecorded call disclosure.',
  consent_client_timestamp: '2026-07-20T00:00:00.000Z',
  consent_timezone_offset: '300',
  page_url: 'https://mineralrightsxchange.com/free-guide?utm_source=google',
};

function makeCtx(env: Record<string, string> = {}) {
  return {
    locals: { runtime: { env } },
    request: new Request('https://mineralrightsxchange.com/free-guide', {
      headers: { 'user-agent': 'vitest-agent', 'x-forwarded-for': '203.0.113.10' },
    }),
  } as unknown as Parameters<typeof submitToGHL>[0];
}

function okJson(body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('submitToGHL', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    for (const k of [
      'MRX_GHL_API_KEY',
      'MRX_GHL_LOCATION_ID',
      'MRX_GHL_CALENDAR_URL',
      'MRX_PDF_URL',
      'MRX_CONTACT_NOTIFY_EMAIL',
      'GHL_FREE_GUIDE_WORKFLOW_ID',
      'MRX_DISABLE_GHL_PROVIDER_WRITES',
    ]) {
      delete process.env[k];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('short-circuits with pending-stage08 when env is missing', async () => {
    const result = await submitToGHL(makeCtx({}), VALID_FORM, 'book');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contactId).toBe('pending-stage08');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('honors the default E2E provider-write kill switch even when GHL credentials exist', async () => {
    const result = await submitToGHL(
      makeCtx({
        MRX_DISABLE_GHL_PROVIDER_WRITES: '1',
        MRX_GHL_API_KEY: 'would-write-if-unguarded',
        MRX_GHL_LOCATION_ID: 'loc-1',
      }),
      VALID_FORM,
      'book',
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contactId).toBe('pending-e2e-provider-disabled');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs /contacts/upsert with locationId, email, and base tags when env is set', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        okJson({ new: true, contact: { id: 'C-123', tags: ['mrx-website-lead'] } }),
      )
      .mockResolvedValueOnce(
        okJson({ tags: ['mrx-website-lead', 'mrx-source-book'], tagsAdded: ['mrx-source-book'] }),
      );

    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      VALID_FORM,
      'book',
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contactId).toBe('C-123');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [upsertUrl, upsertInit] = fetchSpy.mock.calls[0];
    expect(upsertUrl).toBe('https://services.leadconnectorhq.com/contacts/upsert');
    const headers = (upsertInit as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer k');
    expect(headers.Version).toBe('2021-07-28');
    expect(headers['User-Agent']).toMatch(/mrx-stage08-ghl-client/);
    const body = JSON.parse((upsertInit as RequestInit).body as string);
    expect(body.locationId).toBe('loc-1');
    expect(body.email).toBe('carolyn@example.com');
    expect(body.firstName).toBe('Carolyn');
    expect(body.tags).toEqual(['mrx-website-lead']);
    expect(body.source).toBe('MRX Website - Book a Review');
    expect(body.phone).toBe('+1 555 555 5555');
    expect(body.website).toBeUndefined();
  });

  it('records free-guide consent fields and sends email without SMS when SMS consent is false', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ new: false, contact: { id: 'C-456' } }))
      .mockResolvedValueOnce(
        okJson({ tagsAdded: ['mrx-source-free-guide', 'mrx-guide-requested'] }),
      )
      .mockResolvedValueOnce(okJson({ messageId: 'email-1' }));

    await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...FREE_GUIDE_FORM, sms_consent: undefined },
      'free-guide',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const upsertBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(upsertBody.customFields).toEqual(
      expect.arrayContaining([
        { key: 'contact.mrx_requested_guide_title', fieldValue: GUIDE_TITLE },
        { key: 'contact.mrx_guide_email_permission', fieldValue: 'true' },
        { key: 'contact.mrx_free_guide_sms_consent', fieldValue: 'false' },
        { key: 'contact.mrx_free_guide_call_consent', fieldValue: 'false' },
        { key: 'contact.mrx_consent_user_agent', fieldValue: 'vitest-agent' },
        { key: 'contact.mrx_consent_request_ip_present', fieldValue: 'true' },
      ]),
    );
    expect(upsertBody.dndSettings).toBeUndefined();
    expect(upsertBody.customFields).not.toEqual(
      expect.arrayContaining([
        { key: 'contact.mrx_sms_permission', fieldValue: 'false' },
        { key: 'contact.mrx_call_permission', fieldValue: 'false' },
      ]),
    );
    const tagBody = JSON.parse((fetchSpy.mock.calls[1][1] as RequestInit).body as string);
    expect(tagBody.tags).toEqual(['mrx-source-free-guide', 'mrx-guide-requested']);
    const emailBody = JSON.parse((fetchSpy.mock.calls[2][1] as RequestInit).body as string);
    expect(emailBody.type).toBe('Email');
    expect(emailBody.message).toContain('/guides/how-to-find-out-what-your-mineral-rights-are.pdf');
    expect(
      ((fetchSpy.mock.calls[2][1] as RequestInit).headers as Record<string, string>).Version,
    ).toBe('2021-04-15');
  });

  it('sends Elena SMS only when SMS consent is explicitly checked', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ contact: { id: 'C-789' } }))
      .mockResolvedValueOnce(okJson({ tagsAdded: ['mrx-source-free-guide'] }))
      .mockResolvedValueOnce(okJson({ messageId: 'email-1' }))
      .mockResolvedValueOnce(okJson({ messageId: 'sms-1' }));

    await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...FREE_GUIDE_FORM, sms_consent: 'on' },
      'free-guide',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(4);
    const tagBody = JSON.parse((fetchSpy.mock.calls[1][1] as RequestInit).body as string);
    expect(tagBody.tags).toContain('mrx-free-guide-sms-consent');
    const smsBody = JSON.parse((fetchSpy.mock.calls[3][1] as RequestInit).body as string);
    expect(smsBody.type).toBe('SMS');
    expect(smsBody.message).toContain('this is Elena with Mineral Rights Xchange');
    expect(smsBody.message).toContain('Reply STOP to opt out or HELP for help');
  });

  it('enrolls a configured workflow without also sending duplicate direct messages', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ contact: { id: 'C-workflow' } }))
      .mockResolvedValueOnce(okJson({ tagsAdded: ['mrx-source-free-guide'] }))
      .mockResolvedValueOnce(okJson({ enrolled: true }));

    const result = await submitToGHL(
      makeCtx({
        MRX_GHL_API_KEY: 'k',
        MRX_GHL_LOCATION_ID: 'loc-1',
        GHL_FREE_GUIDE_WORKFLOW_ID: 'workflow-1',
      }),
      { ...FREE_GUIDE_FORM, sms_consent: 'on' },
      'free-guide',
    );

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(String(fetchSpy.mock.calls[2][0])).toContain('/contacts/C-workflow/workflow/workflow-1');
    expect((fetchSpy.mock.calls[2][1] as RequestInit).body).toBeUndefined();
    expect(
      fetchSpy.mock.calls.some(([url]) => String(url).includes('/conversations/messages')),
    ).toBe(false);
  });

  it('accepts existing business-plan GHL env aliases for lead capture', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ new: true, contact: { id: 'C-alias' } }))
      .mockResolvedValueOnce(okJson({ tagsAdded: ['mrx-source-book'] }));

    const result = await submitToGHL(
      makeCtx({ GHL_PRIVATE_INTEGRATION_TOKEN: 'alias-token', GHL_LOCATION_ID: 'alias-loc' }),
      VALID_FORM,
      'book',
    );

    expect(result.ok).toBe(true);
    const upsertBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(upsertBody.locationId).toBe('alias-loc');
  });

  it('returns ok:false if required free-guide email delivery fails', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ contact: { id: 'C-email-fail' } }))
      .mockResolvedValueOnce(okJson({ tagsAdded: ['mrx-source-free-guide'] }))
      .mockResolvedValueOnce(new Response('email failed', { status: 500 }));

    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      FREE_GUIDE_FORM,
      'free-guide',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ghl_free_guide_delivery_failed/);
  });

  it('continues with contactId even when tag-add fails (non-fatal)', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson({ new: true, contact: { id: 'C-789' } }))
      .mockResolvedValueOnce(new Response('boom', { status: 500 }));
    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...VALID_FORM, page_url: '' },
      'book',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contactId).toBe('C-789');
  });

  it('returns ok:false when upsert returns non-2xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('bad', { status: 401 }));
    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...VALID_FORM, page_url: '' },
      'book',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/ghl_upsert_failed/);
      expect(result.status).toBe(401);
    }
  });

  it('returns ok:false when upsert body has no contact.id', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ new: true }));
    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...VALID_FORM, page_url: '' },
      'book',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ghl_upsert_no_contact_id');
  });

  it('returns ok:false with ghl_upsert_network_error when fetch throws', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...VALID_FORM, page_url: '' },
      'book',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ghl_upsert_network_error/);
  });
});

describe('resolveGuideUrl', () => {
  it('uses configured MRX_PDF_URL when present', () => {
    expect(resolveGuideUrl(FREE_GUIDE_FORM, 'https://cdn.example.com/guide.pdf')).toBe(
      'https://cdn.example.com/guide.pdf',
    );
  });

  it('falls back to durable public guide asset on the current site origin', () => {
    expect(resolveGuideUrl(FREE_GUIDE_FORM)).toBe(
      'https://mineralrightsxchange.com/guides/how-to-find-out-what-your-mineral-rights-are.pdf',
    );
  });

  it('does not trust a client-supplied page origin for delivery links', () => {
    expect(resolveGuideUrl({ page_url: 'https://attacker.example/free-guide' })).toBe(
      'https://mineralrightsxchange.com/guides/how-to-find-out-what-your-mineral-rights-are.pdf',
    );
  });
});

describe('buildCalendarRedirect', () => {
  it('returns in-app thank-you path when calendarUrl is undefined', () => {
    expect(buildCalendarRedirect(undefined, VALID_FORM)).toBe('/book/thank-you');
    expect(buildCalendarRedirect('', VALID_FORM)).toBe('/book/thank-you');
  });

  it('pre-fills name, email, phone, notes, and UTM params on the calendar URL', () => {
    const url = buildCalendarRedirect(
      'https://api.leadconnectorhq.com/widget/booking/MRX-INT',
      VALID_FORM,
    );
    const u = new URL(url);
    expect(u.searchParams.get('name')).toBe('Carolyn Hill');
    expect(u.searchParams.get('email')).toBe('carolyn@example.com');
    expect(u.searchParams.get('phone')).toBe('+1 555 555 5555');
    expect(u.searchParams.get('notes')).toBe('I have an offer in hand.');
    expect(u.searchParams.get('utm_source')).toBe('google');
    expect(u.searchParams.get('utm_medium')).toBe('cpc');
    expect(u.searchParams.get('utm_campaign')).toBe('sell-mineral-rights-texas');
    expect(u.hostname).toBe('api.leadconnectorhq.com');
  });

  it('omits phone, notes, and missing UTM params when form does not include them', () => {
    const sparse: LeadForm = { firstName: 'A', lastName: 'B', email: 'a@b.co', consent: 'on' };
    const url = buildCalendarRedirect('https://example.com/cal', sparse);
    const u = new URL(url);
    expect(u.searchParams.get('phone')).toBeNull();
    expect(u.searchParams.get('notes')).toBeNull();
    expect(u.searchParams.get('utm_source')).toBeNull();
  });

  it('truncates notes to 500 chars in the redirect', () => {
    const longNotes = 'x'.repeat(2000);
    const url = buildCalendarRedirect('https://example.com/cal', {
      ...VALID_FORM,
      notes: longNotes,
    });
    const u = new URL(url);
    expect(u.searchParams.get('notes')?.length).toBe(500);
  });
});
