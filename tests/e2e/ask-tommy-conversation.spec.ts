import { test, expect } from '@playwright/test';

async function reply(page: any, value: string) {
  const input = page.getByTestId('tommy-composer-input');
  await input.fill(value);
  await input.press('Enter');
}

test.describe('Ask Tommy conversational experience', () => {
  test('meets the owner, learns the mineral location, answers, and sends with permission', async ({
    page,
  }) => {
    await page.route('**/api/chat/delivery', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.channels).toEqual(['email']);
      expect(payload.profile.permissions.email).toBe(true);
      expect(payload.profile.permissions.sms).toBe(false);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, sent: ['email'], failures: [] }),
      });
    });

    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    await expect(page.getByTestId('ask-tommy-dialog')).toBeVisible();
    await expect(page.getByText('what should I call you?')).toBeVisible();

    await reply(page, 'My name is Daryl');
    await expect(page.getByText('Nice to meet you, Daryl.')).toBeVisible();
    await reply(page, 'Reeves County, Texas');
    await expect(page.getByText('What can I help you understand today?')).toBeVisible();

    await page.locator('[data-reply="I received an offer"]').click();
    await expect(
      page.getByText('Before you sign anything, I can help you slow it down'),
    ).toBeVisible();
    await page.locator('[data-reply="send"]').click();
    await expect(
      page.getByText('I can email it, text a link to your phone, or do both.'),
    ).toBeVisible();
    await page.locator('[data-reply="email"]').click();
    await expect(page.getByText('What email address should I use?')).toBeVisible();
    await reply(page, 'daryl@example.com');
    await expect(page.getByText('Is it okay for MRX to email this answer')).toBeVisible();
    await page.locator('[data-reply="yes"]').click();
    await expect(page.getByText('Done—MRX sent it by email.')).toBeVisible();
  });

  test('books a requested time conversationally and honors separate confirmation choices', async ({
    page,
  }) => {
    await page.route('**/api/appointments/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          options: [
            {
              id: '2026-07-14T21:00:00.000Z',
              start: '2026-07-14T21:00:00.000Z',
              end: '2026-07-14T21:30:00.000Z',
              label: 'Tuesday, Jul 14 at 5:00 PM',
              timezone: 'America/New_York',
            },
            {
              id: '2026-07-14T22:00:00.000Z',
              start: '2026-07-14T22:00:00.000Z',
              end: '2026-07-14T22:30:00.000Z',
              label: 'Tuesday, Jul 14 at 6:00 PM',
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
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          appointmentId: 'appt-1',
          notifications: ['email', 'sms'],
          notificationFailures: [],
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
    await page.locator('[data-reply="2026-07-14T22:00:00.000Z"]').click();

    await expect(page.getByText('What first name should I put on the appointment?')).toBeVisible();
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'name',
      'mrx-chat-booking-name',
    );
    await reply(page, 'Daryl');
    await expect(page.getByText('What email should I use for appointment details?')).toBeVisible();
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'name',
      'mrx-chat-booking-email',
    );
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('autocomplete', 'off');
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute('inputmode', 'email');
    await reply(page, 'daryl@example.com');
    await expect(
      page.getByText('What phone number should the live MRX underwriter call?'),
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

    await expect(page.getByText('You’re booked for Tuesday, Jul 14 at 6:00 PM.')).toBeVisible();
    await expect(page.getByText('sent the confirmation by email and text')).toBeVisible();
    await expect(page.getByText('What specifically can we help you with?')).toBeVisible();
    await expect(page.getByText('Review an offer or understand what affects value')).toBeVisible();
    await expect(
      page.getByText('Sort out inherited mineral rights or royalty questions'),
    ).toBeVisible();
    await expect(
      page.getByText('Talk through whether selling now or waiting fits your goals'),
    ).toBeVisible();
    await expect(page.getByTestId('tommy-composer-input')).toHaveAttribute(
      'placeholder',
      'Tell Angela what you need help with…',
    );
    await expect(page.locator('[data-reply="I received an offer"]')).toHaveCount(0);
  });
});

test.describe('Ask Tommy mobile conversation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('uses the full mobile viewport without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-home-chat]').first().click();
    const dialog = page.getByTestId('ask-tommy-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('what should I call you?')).toBeVisible();
    const dimensions = await dialog.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      viewport: document.documentElement.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  });
});
