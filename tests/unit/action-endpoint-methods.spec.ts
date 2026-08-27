import { describe, expect, it } from 'vitest';
import { GET as getBook } from '../../src/pages/api/book';
import { GET as getFreeGuide } from '../../src/pages/api/free-guide';

describe('POST-only public action endpoints', () => {
  for (const [route, handler] of [
    ['/api/book', getBook],
    ['/api/free-guide', getFreeGuide],
  ] as const) {
    it(`${route} rejects unsupported GET requests without a 5xx`, async () => {
      const response = await handler({} as never);
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: 'method_not_allowed',
      });
    });
  }
});
