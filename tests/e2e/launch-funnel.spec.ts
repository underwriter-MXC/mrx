import { expect, test, type Page, type Route } from '@playwright/test';

const PROFILE_ID = '00000000-0000-4000-8000-000000000701';
const INTEREST_ID = '00000000-0000-4000-8000-000000000702';
const ATTACHMENT_ID = '00000000-0000-4000-8000-000000000703';
const REQUIREMENT_ID = '00000000-0000-4000-8000-000000000704';
const REQUIREMENT_KEY = `producing:${INTEREST_ID}:royalty-evidence`;

const ownerPermissions = {
  email: false,
  sms: false,
  aiVoice: false,
  marketingSms: false,
  call: true,
};

function ownerSession(booked: boolean) {
  return {
    ok: true,
    conversationId: '00000000-0000-4000-8000-000000000705',
    authenticated: false,
    deviceAccess: booked,
    profile: booked
      ? {
          first_name: 'Riley',
          last_name: 'Owner',
          email: 'riley.owner@example.com',
          phone: '+14325550101',
          timezone: 'America/Chicago',
          primary_mineral_interest_id: null,
        }
      : null,
    messages: [],
    ownerFacts: {},
    facts: [],
    interests: [],
    documents: [],
    appointments: booked
      ? [
          {
            id: '00000000-0000-4000-8000-000000000706',
            starts_at: '2030-07-16T22:00:00.000Z',
            ends_at: '2030-07-16T22:30:00.000Z',
            timezone: 'America/Chicago',
            status: 'confirmed',
          },
        ]
      : [],
    conversations: [],
    permissions: booked
      ? ownerPermissions
      : { email: false, sms: false, aiVoice: false, marketingSms: false, call: false },
    documentUploadsEnabled: booked,
    documentProcessingEnabled: booked,
  };
}

function checklist(processing = false) {
  return {
    ok: true,
    processing: { available: true },
    readinessBlockers: processing
      ? ['Staff verification is still required.']
      : ['Upload required.'],
    checklist: {
      readinessStatus: processing ? 'needs_verification' : 'blocked',
      canFinalize: false,
      summary: { total: 1, required: 1, recommended: 0, complete: 0, blockers: 1 },
      blockers: [{ code: 'required_document_missing', label: 'Royalty evidence required' }],
      items: [
        {
          requirementKey: REQUIREMENT_KEY,
          mineralInterestId: INTEREST_ID,
          label: 'Recent royalty statement or check stub',
          rationale: 'Producing interests need recent payment evidence.',
          requirementLevel: 'required',
          required: true,
          acceptedDocumentTypes: ['royalty_statement', 'royalty_check_stub'],
          effectiveStatus: processing ? 'processing' : 'missing',
          ownerAction: processing ? 'wait' : 'upload',
        },
      ],
    },
  };
}

async function reply(page: Page, value: string) {
  const input = page.getByTestId('travis-composer-input');
  await input.fill(value);
  await input.press('Enter');
}

async function installFunnelRoutes(page: Page) {
  let booked = false;
  let uploaded = false;
  let finalized = false;
  let appointmentPayload: Record<string, any> | null = null;
  let intakePayload: Record<string, any> | null = null;
  let uploadPayload: Record<string, any> | null = null;

  await page.route('**/api/chat/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ownerSession(booked)),
    });
  });
  await page.route('**/api/chat/events', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/api/appointments/availability**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        options: [
          {
            id: '2030-07-16T22:00:00.000Z',
            start: '2030-07-16T22:00:00.000Z',
            end: '2030-07-16T22:30:00.000Z',
            label: 'Tuesday, Jul 16 at 5:00 PM',
            timezone: 'America/Chicago',
          },
        ],
      }),
    });
  });
  await page.route('**/api/appointments', async (route) => {
    appointmentPayload = route.request().postDataJSON();
    booked = true;
    const origin = new URL(route.request().url()).origin;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        appointmentId: 'appointment-acceptance-1',
        notifications: [],
        notificationFailures: [],
        memberAccess: {
          status: 'link_sent',
          linkSent: true,
          redirectTo: `${origin}/account/?welcome=appointment`,
        },
      }),
    });
  });
  await page.route('**/api/account/underwriting-checklist', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(checklist(uploaded)),
    });
  });
  await page.route('**/api/account/mineral-interest', async (route) => {
    intakePayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        interestId: INTEREST_ID,
        label: 'Reeves County producing royalties',
        missingFields: [],
        geography: { county: 'Reeves', state: 'Texas', basin: 'Permian Basin' },
      }),
    });
  });
  await page.route('**/api/chat/attachments/sign', async (route) => {
    uploadPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        attachmentId: ATTACHMENT_ID,
        path: 'quarantine/acceptance/royalty-statement.pdf',
        token: 'signed-upload-token',
        signedUrl: 'https://supabase.test/storage/v1/object/upload/sign/owner-documents/test',
      }),
    });
  });
  await page.route('https://supabase.test/storage/v1/object/upload/sign/**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'quarantine/acceptance/royalty-statement.pdf' }),
    });
  });
  await page.route('**/api/chat/attachments/complete', async (route) => {
    uploaded = true;
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, status: 'queued', jobId: 'document-job-1' }),
    });
  });

  const accessToken = [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({ sub: 'staff-user-1', role: 'authenticated', exp: 4102444800 }),
    ).toString('base64url'),
    'test',
  ].join('.');
  await page.route('https://supabase.test/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 4102444800,
        refresh_token: 'staff-refresh-token',
        user: {
          id: 'staff-user-1',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'underwriter@mineralrightsxchange.com',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          created_at: '2026-07-22T00:00:00.000Z',
        },
      }),
    });
  });

  const workspace = {
    profile_id: PROFILE_ID,
    status: 'underwriting',
    case_rating: 'hot',
    priority: 'high',
    intake_confidence_score: 90,
    verification_confidence: 'high',
    underwriter_brief: 'Owner wants to understand a producing Reeves County royalty interest.',
    data_pull_brief: 'Confirm current operator and recent production.',
    confidence_gaps: '',
    recommended_focus: 'Verify current royalty statement.',
    risk_flags: [],
    canonical_extraction_policy: 'full_county_42_column',
    valuation_status: 'human_review',
    opportunity_value_cents: null,
    opportunity_size_label: null,
    mineral_rights_count: 1,
    last_contact_at: '2026-07-22T14:00:00.000Z',
    ghl_pipeline_status: 'synced',
    updated_at: '2026-07-22T14:00:00.000Z',
  };
  const ownerCase = {
    id: PROFILE_ID,
    first_name: 'Riley',
    last_name: 'Owner',
    email: 'riley.owner@example.com',
    phone: '+14325550101',
    timezone: 'America/Chicago',
    created_at: '2026-07-22T13:00:00.000Z',
    last_seen_at: '2026-07-22T14:00:00.000Z',
    conversations: [],
    mineral_interests: [
      {
        id: INTEREST_ID,
        label: 'Reeves County producing royalties',
        county: 'Reeves',
        state: 'Texas',
        producing_status: 'yes',
        lease_status: 'yes',
        status: 'active',
      },
    ],
    owner_facts: [],
    attachments: [
      {
        id: ATTACHMENT_ID,
        mineral_interest_id: INTEREST_ID,
        original_name: 'royalty-statement.pdf',
        document_type: 'royalty_statement',
        status: 'ready',
      },
    ],
    appointments: [
      {
        id: 'appointment-acceptance-1',
        starts_at: '2030-07-16T22:00:00.000Z',
        ends_at: '2030-07-16T22:30:00.000Z',
        timezone: 'America/Chicago',
        status: 'confirmed',
      },
    ],
    internal_case_notes: [],
    internal_case_files: [],
    internal_case_workspaces: workspace,
    case_assignments: [
      {
        id: 'assignment-1',
        staff_profile_id: 'staff-profile-1',
        assigned_staff: { display_name: 'Senior Underwriter', role: 'underwriter', active: true },
      },
    ],
  };
  const packetResponse = () => ({
    ok: true,
    packet: {
      readinessStatus: 'ready',
      canFinalize: !finalized,
      isFinalized: finalized,
      sourceFingerprint: 'a'.repeat(64),
      counts: { total: 1, required: 1, complete: 1, blockers: 0 },
      blockers: [],
      requirements: [
        {
          requirementKey: REQUIREMENT_KEY,
          mineralInterestId: INTEREST_ID,
          label: 'Recent royalty statement or check stub',
          required: true,
          acceptedDocumentTypes: ['royalty_statement', 'royalty_check_stub'],
          effectiveStatus: 'verified',
          attachmentId: ATTACHMENT_ID,
        },
      ],
    },
    packetRecord: finalized
      ? {
          readiness_version: 'mrx-underwriter-readiness-v1',
          packet_version: 'mrx-underwriting-packet-v1',
          packet_hash: 'b'.repeat(64),
          finalized_at: '2026-07-22T15:00:00.000Z',
        }
      : null,
    requirements: [
      {
        id: REQUIREMENT_ID,
        requirement_key: REQUIREMENT_KEY,
        mineral_interest_id: INTEREST_ID,
        label: 'Recent royalty statement or check stub',
        required: true,
        requirement_level: 'required',
        accepted_document_types: ['royalty_statement', 'royalty_check_stub'],
        status: 'verified',
      },
    ],
    attachments: ownerCase.attachments,
  });

  await page.route('**/api/staff/**', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/staff/dashboard') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          staff: { id: 'staff-profile-1', display_name: 'Senior Underwriter', role: 'underwriter' },
          summary: {
            visibleCases: 1,
            activeCases: 1,
            openValueCents: 0,
            valueAtRiskCents: 0,
            needsAttention: 0,
            readyForReview: finalized ? 1 : 0,
            offersInFlight: 0,
            staleCases: 0,
            neverContacted: 0,
            recentlyContacted: 1,
            unassignedCases: 0,
            ghlSyncFailures: 0,
            closedCases: 0,
            closedValueCents: 0,
          },
          byStatus: [],
          cases: [],
        }),
      });
      return;
    }
    if (url.pathname === '/api/staff/cases') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          cases: [ownerCase],
          page: { total: 1, returned: 1, page: 1, pageSize: 25, totalPages: 1 },
          facets: {
            mineralCounties: ['Reeves'],
            mineralStates: ['Texas'],
            mineralBasins: [],
            operators: [],
          },
        }),
      });
      return;
    }
    if (url.pathname === `/api/staff/cases/${PROFILE_ID}/underwriting-packet`) {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        expect(payload).toMatchObject({ action: 'finalize' });
        finalized = true;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(packetResponse()),
      });
      return;
    }
    if (url.pathname === `/api/staff/cases/${PROFILE_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, case: ownerCase }),
      });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false}' });
  });

  return {
    get appointmentPayload() {
      return appointmentPayload;
    },
    get intakePayload() {
      return intakePayload;
    },
    get uploadPayload() {
      return uploadPayload;
    },
    get finalized() {
      return finalized;
    },
  };
}

async function completeLaunchFunnel(page: Page) {
  test.setTimeout(90_000);
  const captured = await installFunnelRoutes(page);

  await page.goto('/blog/how-are-mineral-rights-valued/');
  const bookingLink = page.locator('main a[href="/book/"]').first();
  await expect(bookingLink).toBeVisible();
  await bookingLink.click();
  await expect(page).toHaveURL(/\/book\/$/);
  await page.waitForFunction(
    () => (window as Window & { __mrxChatReady?: boolean }).__mrxChatReady === true,
  );
  await page.getByRole('button', { name: 'Find three phone times' }).click();
  await expect(page.getByTestId('ask-travis-dialog')).toBeVisible();
  await page.locator('[data-reply="timezone-confirm"]').click();
  await expect(
    page.getByText(
      'What works better for you: tomorrow afternoon, tomorrow evening, or the next available time?',
    ),
  ).toBeVisible();
  await page.locator('[data-reply="tomorrow-evening"]').click();
  await expect(page.getByText(/I found (?:this|these) opening/)).toBeVisible();
  await page.locator('[data-reply="2030-07-16T22:00:00.000Z"]').click();
  await reply(page, 'Riley');
  await reply(page, 'riley.owner@example.com');
  await reply(page, '432-555-0101');
  await expect(
    page.getByText('May MRX call 432-555-0101 for this specific appointment?'),
  ).toBeVisible();
  await page.locator('[data-reply="yes"]').last().click();
  await expect(page.getByText('May MRX email the appointment confirmation')).toBeVisible();
  await page.locator('[data-reply="no"]').last().click();
  await expect(page.getByText('May MRX also text the appointment confirmation')).toBeVisible();
  await page.locator('[data-reply="no"]').last().click();
  await expect(
    page.getByText('May Elena, MRX’s AI scheduling guide, use AI-generated voice technology'),
  ).toBeVisible();
  await page.locator('[data-reply="no"]').last().click();
  await expect(page).toHaveURL(/\/account\/\?welcome=appointment$/);
  expect(captured.appointmentPayload).toMatchObject({
    profile: { permissions: ownerPermissions },
  });

  const intake = page.getByRole('dialog', { name: 'Let’s prepare your underwriter record' });
  await expect(intake).toBeVisible();
  await page.waitForTimeout(1_000);
  await expect(intake).toBeVisible();
  await intake.getByRole('button', { name: 'Start with one property' }).click();
  await expect(intake.getByRole('group', { name: 'Where are these minerals?' })).toBeVisible();
  await intake.getByLabel('Property nickname, optional').fill('Reeves County producing royalties');
  await intake.getByLabel('State').fill('Texas');
  await intake.getByLabel('County or parish').fill('Reeves');
  await intake.getByLabel('Any location or property description').fill('Near Pecos, Texas');
  await intake.getByRole('button', { name: 'Next' }).click();
  await expect(
    intake.getByRole('group', { name: 'Do you have a parcel or legal description?' }),
  ).toBeVisible();
  await intake.getByRole('button', { name: 'Next' }).click();
  await expect(
    intake.getByRole('group', { name: 'What kind of interest do you own?' }),
  ).toBeVisible();
  await intake.getByLabel('Ownership type').selectOption('royalties_only');
  await intake.getByLabel('Net mineral acres owned').fill('12.5');
  await intake.getByRole('button', { name: 'Next' }).click();
  await expect(intake.getByRole('group', { name: 'Is it leased or producing?' })).toBeVisible();
  await intake.getByLabel('Is the property currently leased?').selectOption('yes');
  await intake.getByLabel('Is the property currently producing?').selectOption('yes');
  await intake.getByLabel('Recent royalty-check amount, if producing').fill('$850 June 2030');
  await intake.getByRole('button', { name: 'Next' }).click();
  await expect(
    intake.getByRole('group', { name: 'Anything else the Senior Underwriter should know?' }),
  ).toBeVisible();
  expect(captured.intakePayload).toBeNull();
  await intake
    .getByLabel('Questions, offers, deadlines, or other details')
    .fill('Explain the recent payment and help me prepare questions for the call.');
  expect(captured.intakePayload).toBeNull();
  const saveProperty = page.locator('.elena-intake button[type="submit"]');
  await expect(saveProperty).toHaveText('Save this property');
  await saveProperty.click();
  await expect(page.getByRole('heading', { name: 'Your property is saved' })).toBeVisible();
  expect(captured.intakePayload).toMatchObject({
    county: 'Reeves',
    state: 'Texas',
    producingStatus: 'yes',
    leaseStatus: 'yes',
  });
  await page.getByRole('button', { name: 'Finish' }).click();

  await page.getByRole('button', { name: 'Prepare upload' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.account-upload-button input[type="file"]').setInputFiles({
    name: 'royalty-statement.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nMRX acceptance fixture\n%%EOF'),
  });
  await expect(page.getByText('royalty-statement.pdf was received and queued')).toBeVisible();
  await expect(page.getByText('Received; staff review pending')).toBeVisible();
  expect(captured.uploadPayload).toMatchObject({
    mineralInterestId: INTEREST_ID,
    documentType: 'royalty_statement',
    requirementKey: REQUIREMENT_KEY,
    documentProcessingConsent: true,
  });

  await page.goto('/staff/');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await page.getByLabel('Staff email').first().fill('underwriter@mineralrightsxchange.com');
  await page.getByLabel('Password').fill('acceptance-test-password');
  await page.getByRole('button', { name: 'Sign in to staff portal' }).click();
  await page.getByRole('button', { name: 'Owner cases', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Underwriter packet readiness' })).toBeVisible();
  await expect(page.getByText('1 / 1')).toBeVisible();
  await page.getByRole('button', { name: 'Finalize packet readiness' }).click();
  await expect(
    page.getByText('Packet finalized. Case is ready for Senior Underwriter review.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reopen finalized packet' })).toBeVisible();
  expect(captured.finalized).toBe(true);
}

for (const surface of [
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test(`${surface.name}: organic landing to booking, intake, typed upload, and staff packet`, async ({
    page,
  }) => {
    await page.setViewportSize(surface.viewport);
    await completeLaunchFunnel(page);
  });
}
