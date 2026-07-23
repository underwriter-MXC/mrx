import { test, expect } from '@playwright/test';
import { stubAnonymousSession } from './helpers/stub-session';

async function reply(page: any, value: string) {
  const input = page.getByTestId('tommy-composer-input');
  await input.fill(value);
  await input.press('Enter');
}

test.describe('Ask Tommy conversational experience', () => {
  test('labels the header account control as Log In', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('link', { name: 'Log In', exact: true })).toBeVisible();
    await expect(banner.getByText(/Owner sign in/i)).toHaveCount(0);
  });

  test('opens the on-screen help window from the top Ask Tommy control', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/');

    await page
      .getByRole('banner')
      .getByRole('button', { name: 'Ask Tommy for mineral-rights help', exact: true })
      .click();

    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
  });

  test('opens homepage intent navigation in the assistant and routes inherited-rights help to Cooper', async ({
    page,
  }) => {
    await stubAnonymousSession(page);
    await page.route('**/api/chat/message', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.message).toContain('inherited mineral rights');
      const body = [
        'event: persona.handoff',
        `data: ${JSON.stringify({
          type: 'persona.handoff',
          from: 'tommy',
          to: 'cooper',
          reason: 'ownership and county records',
          message:
            'Cooper is the right MRX guide for ownership and county records. I am bringing Cooper into the conversation.',
        })}`,
        '',
        'event: message.delta',
        `data: ${JSON.stringify({
          type: 'message.delta',
          delta:
            'I can help you organize the inherited-interest records and the next document to find.',
          persona: 'cooper',
        })}`,
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/');
    const primaryNav = page.getByRole('navigation', { name: 'Primary' });
    await primaryNav.getByRole('link', { name: 'Inherited Rights', exact: true }).click();

    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(page.getByText('Talking with Cooper', { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        'I can help you organize the inherited-interest records and the next document to find.',
      ),
    ).toBeVisible();
  });

  test('answers one question at a time and keeps the composer conversational', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.route('**/api/chat/message', async (route) => {
      const payload = route.request().postDataJSON();
      const answer = payload.message.includes('Reeves County')
        ? 'Reeves County gives us a useful starting point. Do you have the written offer amount?'
        : 'Before you sign anything, I can help you slow it down and compare the complete offer.';
      const body = [
        'event: message.delta',
        `data: ${JSON.stringify({ type: 'message.delta', delta: answer, persona: 'tommy' })}`,
        '',
        // A stale server may still send this event during a rolling deploy. The
        // client must ignore it instead of interrupting the mineral conversation.
        'event: profile.request',
        'data: {"type":"profile.request","fields":["firstName","lastName","email","phone"],"reason":"Remember this conversation securely."}',
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(page.getByText('How may I help you?', { exact: true })).toBeVisible();
    await expect(page.getByText('Skip for now', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Document uploads unavailable' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Talk to a live underwriter' })).toBeVisible();
    await reply(page, 'I received an offer for my mineral rights.');
    await expect(
      page.getByText(
        'Before you sign anything, I can help you slow it down and compare the complete offer.',
      ),
    ).toBeVisible();
    await expect(page.getByText('What first name should I use?')).toHaveCount(0);
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'placeholder',
      'Ask Tommy anything about your minerals…',
    );
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('name', 'mrx-chat-open');

    await expect(page.getByTestId('tommy-account-prompt')).toBeVisible();
    await expect(
      page.getByText('Keep this conversation and any mineral-rights documents together'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in or create an account' })).toHaveAttribute(
      'href',
      '/account/?welcome=conversation',
    );

    await reply(page, 'The property is in Reeves County, Texas.');
    await expect(
      page.getByText(
        'Reeves County gives us a useful starting point. Do you have the written offer amount?',
      ),
    ).toBeVisible();
    await expect(page.getByText('What first name should I use?')).toHaveCount(0);
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('name', 'mrx-chat-open');
    await page.getByRole('button', { name: 'Keep chatting for now' }).click();
    await expect(page.getByTestId('tommy-account-prompt')).toHaveCount(0);
  });

  test('collects the basic owner profile before document upload', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/account/?welcome=1');

    await expect(
      page.getByRole('heading', { level: 2, name: 'Sign in to upload your document' }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Full name', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Phone', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account and continue' })).toBeVisible();
    await expect(page.getByText(/continue on this device right away/i)).toBeVisible();
    await expect(
      page.getByText(/does not give MRX permission to send updates or place calls/i),
    ).toBeVisible();
  });

  test('renders an Ask Tommy map card from a grounded location event', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.route('**/api/chat/message', async (route) => {
      const body = [
        'event: location.card',
        `data: ${JSON.stringify({
          type: 'location.card',
          card: {
            label: 'Martin County, Texas',
            url: 'https://www.google.com/maps/search/?api=1&q=32.305%2C-101.951',
            latitude: 32.305,
            longitude: -101.951,
            precision: 'coordinates',
            confidence: 0.97,
            source: 'Known mineral-interest geography',
            basin: 'Permian Basin',
            note: 'Map pin is from stored mineral-interest geography. It is not a street address unless the owner supplied one.',
          },
        })}`,
        '',
        'event: message.delta',
        `data: ${JSON.stringify({
          type: 'message.delta',
          delta:
            'The document-supported location I have is Martin County, Texas. I am showing a map pin from the stored coordinates, not inventing a street address.',
          persona: 'tommy',
        })}`,
        '',
        'event: done',
        'data: {"type":"done"}',
        '',
        '',
      ].join('\n');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await reply(page, 'where are my rights located?');

    const card = page.getByRole('link', { name: /Open map for Martin County, Texas/i });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', /q=32\.305%2C-101\.951/);
    await expect(page.getByText(/not inventing a street address/i)).toBeVisible();
  });

  test('books a requested time conversationally and honors separate confirmation choices', async ({
    page,
  }) => {
    test.setTimeout(75_000);
    await stubAnonymousSession(page);
    await page.route('**/api/appointments/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          options: [
            {
              id: '2030-07-16T21:00:00.000Z',
              start: '2030-07-16T21:00:00.000Z',
              end: '2030-07-16T21:30:00.000Z',
              label: 'Tuesday, Jul 16 at 5:00 PM',
              timezone: 'America/New_York',
            },
            {
              id: '2030-07-16T22:00:00.000Z',
              start: '2030-07-16T22:00:00.000Z',
              end: '2030-07-16T22:30:00.000Z',
              label: 'Tuesday, Jul 16 at 6:00 PM',
              timezone: 'America/New_York',
            },
          ],
        }),
      });
    });
    await page.route('**/api/appointments', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.option.label).toContain('6:00 PM');
      expect(payload.profile.permissions).toEqual({
        email: true,
        sms: true,
        marketingSms: false,
        call: true,
        aiVoice: true,
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          appointmentId: 'appt-1',
          notifications: ['email', 'sms'],
          notificationFailures: [],
          memberAccess: {
            status: 'link_sent',
            linkSent: true,
            redirectTo: 'http://127.0.0.1:4321/account/?welcome=appointment',
          },
        }),
      });
    });

    await page.goto('/?book=1');
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(page.getByText('I’m Angela, the MRX scheduling guide.')).toBeVisible();
    await expect(
      page.getByText('I’ll check the live MRX calendar and offer a few real openings.'),
    ).toBeVisible();
    await page.locator('[data-reply="timezone-confirm"]').click();
    await expect(
      page.getByText(
        'What works better for you: tomorrow afternoon, tomorrow evening, or the next available time?',
      ),
    ).toBeVisible();
    await page.locator('[data-reply="tomorrow-evening"]').click();
    await expect(page.getByText('I found these openings.')).toBeVisible();
    await page.locator('[data-reply="2030-07-16T22:00:00.000Z"]').click();

    await expect(page.getByText('What first name should I put on the appointment?')).toBeVisible();
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'name',
      'mrx-chat-booking-name',
    );
    await reply(page, 'Daryl');
    await expect(
      page.getByText(
        'What email should I use for your appointment details and secure MRX member access?',
      ),
    ).toBeVisible();
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'name',
      'mrx-chat-booking-email',
    );
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('autocomplete', 'off');
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('inputmode', 'email');
    await reply(page, 'daryl@example.com');
    await expect(
      page.getByText('What phone number should a senior MRX underwriter team member call?'),
    ).toBeVisible();
    await reply(page, '212-555-0199');
    await expect(
      page.getByText('May MRX call 212-555-0199 for this specific appointment?'),
    ).toBeVisible();
    await page.locator('[data-reply="yes"]').click();
    await expect(page.getByText('May MRX email the appointment confirmation')).toBeVisible();
    await page.locator('[data-reply="yes"]').click();
    await expect(page.getByText('May MRX also text the appointment confirmation')).toBeVisible();
    await page.locator('[data-reply="yes"]').click();
    await expect(
      page.getByText('May Angela, MRX’s AI scheduling guide, use GoHighLevel Voice AI'),
    ).toBeVisible();
    await expect(page.getByText('This AI-voice permission is optional')).toBeVisible();
    await page.locator('[data-reply="yes"]').click();

    await expect(page).toHaveURL(/\/account\/\?welcome=appointment$/);

    await page.goto('/');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('mrx:open-chat', { detail: { booking: true } })),
    );
    await expect(page.getByTestId('tommy-appointment-status')).toHaveText('✓ Call booked');
    await expect(page.getByText('I won’t book another one.').last()).toBeVisible();
    await expect(page.getByText('already have a phone appointment booked')).toBeVisible();

    await page.reload();
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('mrx:open-chat', { detail: { booking: true } })),
    );
    await expect(page.getByTestId('tommy-appointment-status')).toHaveText('✓ Call booked');
    await expect(page.getByText('I won’t book another one.').last()).toBeVisible();
  });
});

test.describe('Ask Tommy mobile conversation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows the Ask Tommy panel before the hero copy and keeps its main input above the fold', async ({
    page,
  }) => {
    await page.goto('/');
    const preview = page.locator('.mrx-chat-preview');
    const askInput = page.locator('.mrx-chat-preview__input');
    await expect(preview).toBeVisible();
    await expect(askInput).toBeVisible();
    const layout = await page.evaluate(() => {
      const bounds = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().toJSON() as DOMRect;
      return {
        preview: bounds('.mrx-chat-preview'),
        copy: bounds('.mrx-home-hero__copy'),
        askInput: bounds('.mrx-chat-preview__input'),
        viewportHeight: window.innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(layout.preview.top).toBeLessThan(layout.copy.top);
    expect(layout.preview.top).toBeLessThan(layout.viewportHeight / 2);
    expect(layout.askInput.bottom).toBeLessThan(layout.viewportHeight);
    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth);
  });

  test('uses the full mobile viewport without horizontal overflow', async ({ page }) => {
    await stubAnonymousSession(page);
    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    const dialog = page.getByTestId('ask-tommy-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('How may I help you?', { exact: true })).toBeVisible();
    await page.waitForTimeout(350);
    const dimensions = await dialog.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      viewport: document.documentElement.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  });
});
