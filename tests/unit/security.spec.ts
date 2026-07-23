import { describe, expect, it } from 'vitest';
import { assertSameOrigin } from '../../src/lib/platform/security';

describe('same-origin protection behind a proxy', () => {
  it('accepts the public Vercel host forwarded to the server function', () => {
    const request = new Request('https://internal-function.vercel.app/api/chat/message', {
      headers: {
        origin: 'https://mrx-preview-team.vercel.app',
        'x-forwarded-host': 'mrx-preview-team.vercel.app',
        'x-forwarded-proto': 'https',
      },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it('rejects a forged origin even when proxy headers are present', () => {
    const request = new Request('https://internal-function.vercel.app/api/chat/message', {
      headers: {
        origin: 'https://attacker.example',
        'x-forwarded-host': 'mrx-preview-team.vercel.app',
        'x-forwarded-proto': 'https',
      },
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });
});
