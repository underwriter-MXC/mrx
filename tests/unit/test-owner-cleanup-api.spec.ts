import { afterEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  getSupabaseServer: vi.fn(),
}));

vi.mock('../../src/lib/platform/supabase', () => ({
  getSupabaseServer: mockState.getSupabaseServer,
}));

vi.mock('../../src/lib/platform/test-access', () => ({
  stagingTestAccessAllowed: vi.fn(() => true),
}));

function context(runId: string) {
  const url = 'https://mrx-preview.vercel.app/api/test/cleanup-run';
  return {
    request: new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ runId }),
    }),
    url: new URL(url),
  } as any;
}

function supabaseMock() {
  const profileIds = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
  ];
  const conversationIds = [
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
  ];
  const events: string[] = [];
  const remove = vi.fn(async (paths: string[]) => {
    events.push(`storage:${paths.join(',')}`);
    return { error: null };
  });

  const api = {
    from: vi.fn((table: string) => {
      let deleting = false;
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        delete: vi.fn(() => {
          deleting = true;
          events.push(`delete:${table}`);
          return builder;
        }),
        then: (resolve: (value: unknown) => unknown) => {
          let result: { data: unknown; error: null } = { data: [], error: null };
          if (table === 'profiles') {
            result = { data: profileIds.map((id) => ({ id })), error: null };
          } else if (table === 'attachments') {
            result = {
              data: [
                { storage_path: 'quarantine/test/one.pdf' },
                { storage_path: 'quarantine/test/two.pdf' },
              ],
              error: null,
            };
          } else if (table === 'conversations' && !deleting) {
            result = { data: conversationIds.map((id) => ({ id })), error: null };
          }
          return Promise.resolve(result).then(resolve);
        },
      };
      return builder;
    }),
    storage: {
      from: vi.fn(() => ({ remove })),
    },
  } as any;
  return { api, events, remove };
}

describe('exact TEST-run cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('removes private storage objects before deleting run database records', async () => {
    const { api, events, remove } = supabaseMock();
    mockState.getSupabaseServer.mockReturnValue(api);
    const { POST } = await import('../../src/pages/api/test/cleanup-run');

    const response = await POST(context('00000000-0000-4000-8000-000000000001'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      runId: '00000000-0000-4000-8000-000000000001',
      removedStorageObjects: 2,
      deletedConversations: 2,
      deletedProfiles: 2,
    });
    expect(remove).toHaveBeenCalledWith(['quarantine/test/one.pdf', 'quarantine/test/two.pdf']);
    expect(events.indexOf('storage:quarantine/test/one.pdf,quarantine/test/two.pdf')).toBeLessThan(
      events.indexOf('delete:conversations'),
    );
  });
});
