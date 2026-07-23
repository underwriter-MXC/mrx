import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decryptDocumentText,
  documentWorkerAvailable,
  encryptDocumentText,
  hmacSha256,
} from '../../src/lib/platform/documents';

describe('document worker callbacks', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses deterministic SHA-256 HMAC signatures', async () => {
    expect(await hmacSha256('secret', '1700000000.nonce.payload')).toBe(
      '632f17672971218b1e8222964ddad72310f98f90d630c2ec9a741ef0fdf14fb2',
    );
  });

  it('encrypts raw OCR at rest and restores it only with the document key', async () => {
    vi.stubEnv('DOCUMENT_ENCRYPTION_KEY', 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=');
    const raw = 'Owner document OCR with a complete royalty statement.';
    const encrypted = await encryptDocumentText(raw);
    expect(encrypted).toMatch(/^v1:/);
    expect(encrypted).not.toContain(raw);
    await expect(decryptDocumentText(encrypted)).resolves.toBe(raw);
  });

  it('fails closed when the configured worker health check is offline', async () => {
    vi.stubEnv('DOCUMENT_UPLOADS_ENABLED', 'true');
    vi.stubEnv('DOCUMENT_WORKER_URL', 'https://documents.internal.example/jobs');
    vi.stubEnv('DOCUMENT_WORKER_TOKEN', 'test-worker-token');
    vi.stubEnv('DOCUMENT_WORKER_CALLBACK_SECRET', 'test-callback-secret');
    vi.stubEnv('DOCUMENT_ENCRYPTION_KEY', 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(documentWorkerAvailable({ force: true })).resolves.toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://documents.internal.example/health',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-worker-token' },
      }),
    );
  });
});
