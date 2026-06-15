import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitToGHL, buildCalendarRedirect } from '../../src/lib/ghl';
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

function makeCtx(env: Record<string, string> = {}) {
  return {
    locals: {
      runtime: { env },
    },
  } as unknown as Parameters<typeof submitToGHL>[0];
}

describe('submitToGHL', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    // Clear the real env so the serverEnv() fallback to process.env does
    // not leak the test runner's secrets into the short-circuit test.
    for (const k of [
      'MRX_GHL_API_KEY',
      'MRX_GHL_LOCATION_ID',
      'MRX_GHL_CALENDAR_URL',
      'MRX_PDF_URL',
      'MRX_CONTACT_NOTIFY_EMAIL',
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

  it('POSTs /contacts/upsert with locationId, email, and base tags when env is set', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            new: true,
            contact: { id: 'C-123', tags: ['mrx-website-lead'] },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ tags: ['mrx-website-lead', 'mrx-source-book'], tagsAdded: ['mrx-source-book'] }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const result = await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      VALID_FORM,
      'book',
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contactId).toBe('C-123');

    // First call: upsert
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [upsertUrl, upsertInit] = fetchSpy.mock.calls[0];
    expect(upsertUrl).toBe('https://services.leadconnectorhq.com/contacts/upsert');
    const headers = (upsertInit as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer k');
    expect(headers['Version']).toBe('2021-07-28');
    expect(headers['User-Agent']).toMatch(/mrx-stage08-ghl-client/);
    const body = JSON.parse((upsertInit as RequestInit).body as string);
    expect(body.locationId).toBe('loc-1');
    expect(body.email).toBe('carolyn@example.com');
    expect(body.firstName).toBe('Carolyn');
    expect(body.tags).toEqual(['mrx-website-lead']);
    expect(body.source).toBe('MRX Website - Book a Review');
    expect(body.phone).toBe('+1 555 555 5555');
    expect(body.website).toBeUndefined(); // no page_url on form
  });

  it('appends source-specific tag (mrx-source-free-guide) for /free-guide submissions', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ new: false, contact: { id: 'C-456' } }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ tagsAdded: ['mrx-source-free-guide'] }), { status: 201 }));

    await submitToGHL(
      makeCtx({ MRX_GHL_API_KEY: 'k', MRX_GHL_LOCATION_ID: 'loc-1' }),
      { ...VALID_FORM, page_url: '' },
      'free-guide',
    );

    const [, tagInit] = fetchSpy.mock.calls[1];
    const tagBody = JSON.parse((tagInit as RequestInit).body as string);
    expect(tagBody.tags).toEqual(['mrx-source-free-guide']);
  });

  it('continues with contactId even when tag-add fails (non-fatal)', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ new: true, contact: { id: 'C-789' } }), { status: 201 }),
      )
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
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ new: true }), { status: 201 }),
    );
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
    const sparse: LeadForm = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.co',
      consent: 'on',
    };
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
