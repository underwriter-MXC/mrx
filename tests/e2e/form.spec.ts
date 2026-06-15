import { test, expect } from '@playwright/test';

test.describe('form posts', () => {
  test('POST /api/book with valid form data redirects (303) or returns 200', async ({ request }) => {
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
    expect([200, 303]).toContain(r.status());
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
