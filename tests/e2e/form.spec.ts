import { test, expect } from '@playwright/test';

test.describe('form posts', () => {
  test('POST /api/book with valid form data stays inside the E2E GHL write kill switch', async ({
    request,
  }) => {
    const formData = new URLSearchParams();
    formData.append('firstName', 'Test');
    formData.append('lastName', 'Owner');
    formData.append('email', 'test@example.com');
    formData.append('consent', 'on');
    const r = await request.post('/api/book', {
      data: formData.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(303);
    expect(r.headers()['location']).toMatch(/^\/book\/thank-you\/?$/);
  });

  test('POST /api/book without consent returns 400', async ({ request }) => {
    const formData = new URLSearchParams();
    formData.append('firstName', 'Test');
    formData.append('lastName', 'Owner');
    formData.append('email', 'test@example.com');
    // No consent.
    const r = await request.post('/api/book', {
      data: formData.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    expect(r.status()).toBe(400);
  });
});
