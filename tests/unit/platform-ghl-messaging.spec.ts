import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendGhlConversationText,
  bookAppointment,
  cancelAppointment,
  completeDocumentFollowUp,
  enrollContactInGhlWorkflow,
  extractGhlTranscription,
  mapContactToBusinessPipeline,
  rescheduleAppointment,
  sendGhlIntakeChecklist,
  sendGhlMemberAccessEmail,
  sendRequestedInformation,
  syncGhlOwnerCaseOpportunity,
  updateGhlContactFields,
  upsertContact,
} from '../../src/lib/platform/ghl';
import type { AppointmentOption, ContactProfile } from '../../src/lib/platform/types';

const profile: ContactProfile = {
  firstName: 'Daryl',
  lastName: 'Hill',
  email: 'daryl@example.com',
  phone: '+12125550199',
  timezone: 'America/New_York',
  location: 'Reeves County, Texas',
  permissions: { email: true, sms: true, marketingSms: false, call: true, aiVoice: true },
  disclosureVersion: 'test',
  sourceUrl: 'https://mineralrightsxchange.com/',
};

const option: AppointmentOption = {
  id: '2026-07-14T22:00:00.000Z',
  start: '2026-07-14T22:00:00.000Z',
  end: '2026-07-14T22:30:00.000Z',
  label: 'Tuesday, Jul 14 at 6:00 PM',
  timezone: 'America/New_York',
};

describe('HighLevel conversational delivery contract', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('GHL_PRIVATE_INTEGRATION_TOKEN', 'test-token');
    vi.stubEnv('GHL_LOCATION_ID', 'location-1');
    vi.stubEnv('GHL_CALENDAR_ID', 'calendar-1');
    vi.stubEnv('GHL_ASSIGNED_USER_ID', 'underwriter-user-1');
    vi.stubEnv('GHL_EMAIL_FROM', 'underwriter@mineralrightsxchange.com');
    vi.stubEnv('GHL_APPOINTMENT_WORKFLOW_ID', 'workflow-1');
    fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/contacts/upsert')) {
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      }
      if (url.endsWith('/calendars/events/appointments')) {
        return new Response(JSON.stringify({ event: { id: 'appointment-1' } }), { status: 200 });
      }
      if (url.endsWith('/opportunities/upsert')) {
        return new Response(JSON.stringify({ opportunity: { id: 'opportunity-1' } }), {
          status: 200,
        });
      }
      if (url.endsWith('/conversations/messages')) {
        const body = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ messageId: `message-${body.type}` }), { status: 200 });
      }
      if (url.endsWith('/contacts/contact-1/workflow/workflow-1')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response('unexpected URL', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('extracts complete text from supported GHL call transcription shapes', () => {
    expect(extractGhlTranscription({ transcription: 'Owner and MRX discussed the offer.' })).toBe(
      'Owner and MRX discussed the offer.',
    );
    expect(
      extractGhlTranscription({
        data: { utterances: [{ text: 'Owner: Hello.' }, { text: 'MRX: How can we help?' }] },
      }),
    ).toBe('Owner: Hello.\nMRX: How can we help?');
  });

  it.each(['1', 'true', 'yes', ' TRUE ', ' YeS '])(
    'blocks provider writes when MRX_DISABLE_GHL_PROVIDER_WRITES=%s before any GHL fetch',
    async (flag) => {
      vi.stubEnv('MRX_DISABLE_GHL_PROVIDER_WRITES', flag);
      vi.stubEnv('GHL_PRIVATE_INTEGRATION_TOKEN', 'sentinel-disabled-token');
      vi.stubEnv('GHL_LOCATION_ID', '');
      vi.stubEnv('MRX_GHL_LOCATION_ID', '');
      vi.stubEnv('GHL_CALENDAR_ID', 'sentinel-disabled-calendar');

      await expect(upsertContact(profile)).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(bookAppointment({ profile, option })).rejects.toThrow(
        'ghl_provider_writes_disabled',
      );
      await expect(
        sendGhlMemberAccessEmail({
          contactId: 'contact-1',
          email: 'daryl@example.com',
          firstName: 'Daryl',
          actionLink: 'https://example.supabase.co/auth/v1/verify?token=test',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(completeDocumentFollowUp('contact-1')).rejects.toThrow(
        'ghl_provider_writes_disabled',
      );
      await expect(enrollContactInGhlWorkflow('contact-1', 'workflow-1')).rejects.toThrow(
        'ghl_provider_writes_disabled',
      );
      await expect(
        appendGhlConversationText({
          contactId: 'contact-1',
          source: 'website chat, owner',
          text: 'Owner wrote a note.',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(
        updateGhlContactFields('contact-1', [
          { key: 'contact.mrx_follow_up_status', fieldValue: 'documents_received' },
        ]),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(
        sendRequestedInformation({
          profile,
          channels: ['email', 'sms'],
          answer: 'Requested information.',
          link: 'https://mineralrightsxchange.com/learning-center/',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(
        sendGhlIntakeChecklist({
          profile,
          channels: ['email', 'sms'],
          propertyLabel: 'Reeves County interest',
          missingFields: ['Recent royalty statement'],
          accountLink: 'https://mineralrightsxchange.com/account/',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(rescheduleAppointment('appointment-1', option)).rejects.toThrow(
        'ghl_provider_writes_disabled',
      );
      await expect(cancelAppointment('appointment-1')).rejects.toThrow(
        'ghl_provider_writes_disabled',
      );
      await expect(
        syncGhlOwnerCaseOpportunity({
          contactId: 'contact-1',
          opportunityName: 'Daryl Hill mineral-rights opportunity',
          pipelineName: 'Sellers',
          stageName: 'Offer Sent',
          status: 'open',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');
      await expect(
        mapContactToBusinessPipeline({
          contactId: 'contact-1',
          event: 'appointment.booked',
          name: 'Daryl appointment',
        }),
      ).rejects.toThrow('ghl_provider_writes_disabled');

      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('refreshes an existing contact without moving its pipeline stage', async () => {
    await expect(
      upsertContact(
        {
          ...profile,
          ownerMetadata: {
            city: 'Pecos',
            county: 'Reeves',
            geographyStatus: 'resolved',
            residenceCity: 'Austin',
          },
        },
        { syncOpportunity: false },
      ),
    ).resolves.toBe('contact-1');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body));
    expect(payload.dndSettings).toBeUndefined();
    expect(payload.customFields).toEqual(
      expect.arrayContaining([
        { key: 'contact.mrx_mineral_city', fieldValue: 'Pecos' },
        { key: 'contact.mrx_owner_county', fieldValue: 'Reeves' },
        { key: 'contact.mrx_geography_status', fieldValue: 'resolved' },
        { key: 'contact.mrx_residence_city', fieldValue: 'Austin' },
      ]),
    );
  });

  it('synchronizes a staff owner-case stage and monetary value to a real GHL opportunity', async () => {
    await expect(
      syncGhlOwnerCaseOpportunity({
        contactId: 'contact-1',
        opportunityName: 'Daryl Hill mineral-rights opportunity',
        pipelineId: 'pipeline-real',
        pipelineStageId: 'stage-real',
        pipelineName: 'Sellers',
        stageName: 'Offer Sent',
        monetaryValue: 125000,
        status: 'open',
      }),
    ).resolves.toEqual({
      opportunityId: 'opportunity-1',
      pipelineId: 'pipeline-real',
      pipelineStageId: 'stage-real',
      pipelineName: 'Sellers',
      stageName: 'Offer Sent',
    });

    const opportunityCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/opportunities/upsert'),
    );
    const payload = JSON.parse(String((opportunityCall?.[1] as RequestInit).body));
    expect(payload).toMatchObject({
      locationId: 'location-1',
      contactId: 'contact-1',
      pipelineId: 'pipeline-real',
      pipelineStageId: 'stage-real',
      monetaryValue: 125000,
      status: 'open',
    });
  });

  it('marks every declined contact channel as DND without clearing granted-channel opt-outs', async () => {
    await upsertContact(
      {
        ...profile,
        permissions: {
          ...profile.permissions,
          email: false,
          sms: false,
          call: false,
        },
      },
      { syncOpportunity: false },
    );

    const payload = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body));
    expect(payload.dndSettings).toEqual({
      Email: {
        status: 'active',
        message: 'MRX email permission was declined',
        code: 'MRX_PERMISSION_DECLINED',
      },
      SMS: {
        status: 'active',
        message: 'MRX sms permission was declined',
        code: 'MRX_PERMISSION_DECLINED',
      },
      Call: {
        status: 'active',
        message: 'MRX call permission was declined',
        code: 'MRX_PERMISSION_DECLINED',
      },
    });
  });

  it('keeps owner-requested account access email transactional without granting marketing email permission', async () => {
    await upsertContact(
      {
        ...profile,
        permissions: {
          email: false,
          sms: false,
          marketingSms: false,
          call: false,
          aiVoice: false,
        },
      },
      { syncOpportunity: false, allowTransactionalEmail: true },
    );

    const payload = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body));
    expect(payload.dndSettings).toEqual({
      SMS: {
        status: 'active',
        message: 'MRX sms permission was declined',
        code: 'MRX_PERMISSION_DECLINED',
      },
      Call: {
        status: 'active',
        message: 'MRX call permission was declined',
        code: 'MRX_PERMISSION_DECLINED',
      },
    });
    expect(payload.customFields).toEqual(
      expect.arrayContaining([
        { key: 'contact.mrx_email_permission', fieldValue: 'false' },
        { key: 'contact.mrx_marketing_sms_permission', fieldValue: 'false' },
      ]),
    );
  });

  it('accepts the existing GHL_API_TOKEN secret name for messaging configuration', async () => {
    vi.stubEnv('GHL_PRIVATE_INTEGRATION_TOKEN', '');
    vi.stubEnv('MRX_GHL_API_KEY', '');
    vi.stubEnv('GHL_API_TOKEN', 'legacy-token');

    await expect(
      sendGhlMemberAccessEmail({
        contactId: 'contact-1',
        email: 'daryl@example.com',
        firstName: 'Daryl',
        actionLink: 'https://example.supabase.co/auth/v1/verify?token=test',
      }),
    ).resolves.toBe('message-Email');

    const messageCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/conversations/messages'),
    );
    expect((messageCall?.[1] as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer legacy-token',
    });
  });

  it('sends the full answer by email and a mobile link by SMS only after both permissions are granted', async () => {
    const result = await sendRequestedInformation({
      profile,
      channels: ['email', 'sms'],
      answer: 'Review the acreage — depths --- title-review terms, and adjustment language.',
      link: 'https://mineralrightsxchange.com/offer-review/',
    });

    expect(result).toEqual({ contactId: 'contact-1', sent: ['email', 'sms'], failures: [] });
    const messageCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).endsWith('/conversations/messages'),
    );
    expect(messageCalls).toHaveLength(2);
    const payloads = messageCalls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    const email = payloads.find((payload) => payload.type === 'Email');
    const sms = payloads.find((payload) => payload.type === 'SMS');
    expect(email.emailTo).toBe('daryl@example.com');
    expect(email.emailFrom).toBe('underwriter@mineralrightsxchange.com');
    expect(email.message).toContain('Review the acreage');
    expect(email.message).toContain('/offer-review/');
    expect(email.message).not.toMatch(/[—–]|(^|\s)---(?=\s|$)/m);
    expect(email.html).not.toMatch(/[—–]|(^|\s)---(?=\s|$)/m);
    expect(sms.toNumber).toBe('+12125550199');
    expect(sms.message).toContain('/offer-review/');
    expect(sms.message).toMatch(/STOP.*HELP/);
    expect(sms.message).not.toMatch(/[—–]|(^|\s)---(?=\s|$)/m);
    expect((messageCalls[0][1] as RequestInit).headers).toMatchObject({ Version: 'v3' });
    expect(payloads.every((payload) => payload.status === 'pending')).toBe(true);
  });

  it('sends a one-time owner-account link through the configured MRX email channel', async () => {
    await expect(
      sendGhlMemberAccessEmail({
        contactId: 'contact-1',
        email: 'daryl@example.com',
        firstName: 'Daryl',
        actionLink: 'https://example.supabase.co/auth/v1/verify?token=test',
      }),
    ).resolves.toBe('message-Email');
    const messageCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/conversations/messages'),
    );
    const payload = JSON.parse(String((messageCall?.[1] as RequestInit).body));
    expect((messageCall?.[1] as RequestInit).headers).toMatchObject({ Version: 'v3' });
    expect(payload).toMatchObject({
      type: 'Email',
      emailTo: 'daryl@example.com',
      subject: 'Your secure MRX owner-account sign-in link',
      emailFrom: 'underwriter@mineralrightsxchange.com',
    });
    expect(payload.status).toBe('pending');
    expect(payload.html).toContain('Open my MRX owner account');
    expect(payload.message).toContain('one-time link');
  });

  it('places approved website text in the GHL conversation as ordered internal comments', async () => {
    const text = `Owner wrote — preserve this --- exactly. ${'A'.repeat(12_100)}`;
    const ids = await appendGhlConversationText({
      contactId: 'contact-1',
      source: 'website chat, owner',
      text,
      occurredAt: '2026-07-15T12:00:00.000Z',
      externalId: 'attachment-1',
    });
    expect(ids).toEqual(['message-InternalComment', 'message-InternalComment']);
    const payloads = fetchSpy.mock.calls
      .filter(([url]) => String(url).endsWith('/conversations/messages'))
      .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(payloads).toHaveLength(2);
    expect(payloads.every((payload) => payload.type === 'InternalComment')).toBe(true);
    expect(payloads.every((payload) => payload.status === 'delivered')).toBe(true);
    expect(payloads[0].message).toContain('part 1 of 2');
    expect(payloads[1].message).toContain('part 2 of 2');
    expect(payloads.map((payload) => payload.message.split('\n\n')[1]).join('')).toBe(text);
  });

  it('does not send through a channel whose permission is false', async () => {
    const emailOnly = { ...profile, permissions: { ...profile.permissions, sms: false } };
    const result = await sendRequestedInformation({
      profile: emailOnly,
      channels: ['email', 'sms'],
      answer: 'Requested information.',
      link: 'https://mineralrightsxchange.com/learning-center/',
    });
    expect(result.sent).toEqual(['email']);
    expect(result.failures).toEqual(['sms']);
    const payloads = fetchSpy.mock.calls
      .filter(([url]) => String(url).endsWith('/conversations/messages'))
      .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(payloads.map((payload) => payload.type)).toEqual(['Email']);
  });

  it('books the selected slot with default notifications disabled, then sends only explicit confirmations', async () => {
    const result = await bookAppointment({ profile, option, notes: 'Offer review requested.' });
    expect(result).toEqual({
      id: 'appointment-1',
      contactId: 'contact-1',
      notifications: ['email', 'sms'],
      notificationFailures: [],
      workflowEnrolled: true,
    });

    const contactCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/contacts/upsert'),
    );
    const contactPayload = JSON.parse(String((contactCall?.[1] as RequestInit).body));
    expect(contactPayload.dndSettings).toEqual({
      Email: { status: 'inactive' },
      SMS: { status: 'inactive' },
      Call: { status: 'inactive' },
    });

    const appointmentCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/calendars/events/appointments'),
    );
    expect(appointmentCall).toBeTruthy();
    const appointmentPayload = JSON.parse(String((appointmentCall?.[1] as RequestInit).body));
    expect(appointmentPayload).toMatchObject({
      calendarId: 'calendar-1',
      contactId: 'contact-1',
      startTime: option.start,
      endTime: option.end,
      assignedUserId: 'underwriter-user-1',
      title: 'MRX senior underwriter phone review: Daryl',
      toNotify: false,
    });
    expect((appointmentCall?.[1] as RequestInit).headers).toMatchObject({
      Version: '2021-07-28',
    });

    const workflowCall = fetchSpy.mock.calls.find(([url]) =>
      String(url).endsWith('/contacts/contact-1/workflow/workflow-1'),
    );
    expect(workflowCall).toBeTruthy();
    expect(JSON.parse(String((workflowCall?.[1] as RequestInit).body))).toEqual({
      eventStartTime: option.start,
    });

    const confirmations = fetchSpy.mock.calls
      .filter(([url]) => String(url).endsWith('/conversations/messages'))
      .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(confirmations.map((message) => message.type).sort()).toEqual(['Email', 'SMS']);
    expect(confirmations.every((message) => message.appointmentId === 'appointment-1')).toBe(true);
    expect(confirmations.find((message) => message.type === 'Email')).toMatchObject({
      emailFrom: 'underwriter@mineralrightsxchange.com',
      subject: 'Your MRX senior underwriter appointment is confirmed',
    });
  });

  it('keeps the appointment confirmed when a selected confirmation channel fails', async () => {
    fetchSpy.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/contacts/upsert'))
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      if (url.endsWith('/calendars/events/appointments'))
        return new Response(JSON.stringify({ id: 'appointment-1' }), { status: 200 });
      if (url.endsWith('/conversations/messages')) {
        const body = JSON.parse(String(init?.body));
        return body.type === 'SMS'
          ? new Response('provider unavailable', { status: 503 })
          : new Response(JSON.stringify({ messageId: 'message-email' }), { status: 200 });
      }
      if (url.endsWith('/contacts/contact-1/workflow/workflow-1'))
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      return new Response('unexpected URL', { status: 404 });
    });

    const result = await bookAppointment({ profile, option });
    expect(result.id).toBe('appointment-1');
    expect(result.notifications).toEqual(['email']);
    expect(result.notificationFailures).toEqual(['sms']);
  });

  it.each([
    ['Eastern, email and text', 'America/New_York', true, true],
    ['Eastern, email only', 'America/New_York', true, false],
    ['Eastern, text only', 'America/New_York', false, true],
    ['Eastern, no digital confirmation', 'America/New_York', false, false],
    ['Central', 'America/Chicago', true, true],
    ['Mountain', 'America/Denver', true, true],
    ['Pacific', 'America/Los_Angeles', true, true],
    ['Arizona', 'America/Phoenix', true, true],
    ['Alaska', 'America/Anchorage', true, true],
    ['Hawaii', 'Pacific/Honolulu', true, true],
  ])(
    'routes %s booking through the senior-underwriter calendar and mailbox',
    async (_name, timezone, email, sms) => {
      await bookAppointment({
        profile: {
          ...profile,
          timezone,
          permissions: { ...profile.permissions, email, sms },
        },
        option: { ...option, timezone },
      });

      const appointmentCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).endsWith('/calendars/events/appointments'),
      );
      const appointmentPayload = JSON.parse(String((appointmentCall?.[1] as RequestInit).body));
      expect(appointmentPayload).toMatchObject({
        calendarId: 'calendar-1',
        assignedUserId: 'underwriter-user-1',
        title: 'MRX senior underwriter phone review: Daryl',
      });

      const emailPayloads = fetchSpy.mock.calls
        .filter(([url, init]) => {
          if (!String(url).endsWith('/conversations/messages')) return false;
          return JSON.parse(String((init as RequestInit).body)).type === 'Email';
        })
        .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
      expect(emailPayloads).toHaveLength(email ? 1 : 0);
      expect(
        emailPayloads.every(
          (message) => message.emailFrom === 'underwriter@mineralrightsxchange.com',
        ),
      ).toBe(true);
    },
  );

  it('resolves the HighLevel location from the MRX calendar when no location environment value is set', async () => {
    vi.stubEnv('GHL_LOCATION_ID', '');
    vi.stubEnv('MRX_GHL_LOCATION_ID', '');
    fetchSpy.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/calendars/calendar-1')) {
        return new Response(
          JSON.stringify({ calendar: { id: 'calendar-1', locationId: 'resolved-location' } }),
          { status: 200 },
        );
      }
      if (url.endsWith('/contacts/upsert')) {
        const body = JSON.parse(String(init?.body));
        expect(body.locationId).toBe('resolved-location');
        return new Response(JSON.stringify({ contact: { id: 'contact-1' } }), { status: 200 });
      }
      if (url.endsWith('/calendars/events/appointments')) {
        return new Response(JSON.stringify({ id: 'appointment-1' }), { status: 200 });
      }
      if (url.endsWith('/contacts/contact-1/workflow/workflow-1'))
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      return new Response('unexpected URL', { status: 404 });
    });

    const noConfirmationProfile = {
      ...profile,
      permissions: { ...profile.permissions, email: false, sms: false },
    };
    const result = await bookAppointment({ profile: noConfirmationProfile, option });
    expect(result.id).toBe('appointment-1');
    expect(
      fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/calendars/calendar-1')),
    ).toHaveLength(1);
  });

  it('stops appointment follow-up and marks the contact when secure documents are ready', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await expect(completeDocumentFollowUp('contact-1')).resolves.toEqual([true, true, true]);

    const calls = fetchSpy.mock.calls.map(([url, init]) => ({
      url: String(url),
      method: (init as RequestInit).method,
      body: (init as RequestInit).body ? JSON.parse(String((init as RequestInit).body)) : null,
    }));
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expect.stringContaining('/contacts/contact-1/tags'),
          method: 'POST',
          body: { tags: ['mrx-documents-received'] },
        }),
        expect.objectContaining({
          url: expect.stringContaining('/contacts/contact-1'),
          method: 'PUT',
          body: {
            customFields: [
              { key: 'contact.mrx_follow_up_status', fieldValue: 'documents_received' },
            ],
          },
        }),
        expect.objectContaining({
          url: expect.stringContaining('/contacts/contact-1/workflow/workflow-1'),
          method: 'DELETE',
        }),
      ]),
    );
  });
});
