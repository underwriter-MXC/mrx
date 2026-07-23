import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMrxMcpServer } from '../../mcp/server.mjs';
import { createRateLimiter, requestHostAllowed, tokensMatch } from '../../mcp/security.mjs';

function fakeRepository() {
  return {
    getSystemStatus: vi.fn(async () => ({ service: 'mrx-mcp', accessMode: 'read-only' })),
    getPipelineSummary: vi.fn(async (filters) => ({ filters, interests: { total: 3 } })),
    searchMineralInterests: vi.fn(async (filters) => ({
      results: [{ id: 'interest-1' }],
      filters,
    })),
    getCaseSnapshot: vi.fn(async ({ profileId }) => ({
      profile: { id: profileId, displayName: 'Mineral owner' },
      excluded: ['email', 'phone', 'message content', 'raw OCR', 'storage paths'],
    })),
    searchKnowledge: vi.fn(async ({ query }) => ({ results: [{ title: query }] })),
    getKnowledgeDocument: vi.fn(async ({ documentId }) => ({
      id: documentId,
      title: 'Approved article',
    })),
    auditToolRead: vi.fn(async () => undefined),
  };
}

describe('MRX read-only MCP server', () => {
  let server: ReturnType<typeof createMrxMcpServer>;
  let client: Client;
  let repository: ReturnType<typeof fakeRepository>;

  beforeEach(async () => {
    repository = fakeRepository();
    server = createMrxMcpServer({ repository, transport: 'test' });
    client = new Client({ name: 'mrx-test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it('advertises only the six reviewed read-only tools', async () => {
    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual([
      'mrx_system_status',
      'mrx_pipeline_summary',
      'mrx_search_mineral_interests',
      'mrx_get_case_snapshot',
      'mrx_search_knowledge',
      'mrx_get_knowledge_document',
    ]);
    expect(result.tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
    expect(result.tools.every((tool) => tool.annotations?.destructiveHint === false)).toBe(true);
  });

  it('publishes the allowlisted Claude imports as versioned MCP resources', async () => {
    const resources = await client.listResources();
    const inventory = resources.resources.find(
      (resource) => resource.uri === 'mrx://agent-spec/inventory',
    );
    expect(inventory?.mimeType).toBe('text/markdown');
    const result = await client.readResource({ uri: 'mrx://agent-spec/inventory' });
    expect(result.contents[0]).toMatchObject({ uri: 'mrx://agent-spec/inventory' });
    expect('text' in result.contents[0] ? result.contents[0].text : '').toContain(
      'Claude Desktop Asset Inventory',
    );
  });

  it('requires an explicit mineral-interest filter and caps result limits', async () => {
    const unfiltered = await client.callTool({
      name: 'mrx_search_mineral_interests',
      arguments: {},
    });
    const excessive = await client.callTool({
      name: 'mrx_search_mineral_interests',
      arguments: { stateCode: 'TX', limit: 26 },
    });
    expect(unfiltered.isError).toBe(true);
    expect(excessive.isError).toBe(true);
    expect(repository.searchMineralInterests).not.toHaveBeenCalled();
  });

  it('returns a privacy-reduced case snapshot and audits the read', async () => {
    const profileId = '11111111-1111-4111-8111-111111111111';
    const result = await client.callTool({
      name: 'mrx_get_case_snapshot',
      arguments: { profileId },
    });
    const content = (result as { content: Array<{ type: string; text?: string }> }).content[0];
    expect(content.type).toBe('text');
    const payload = JSON.parse(content.type === 'text' ? content.text || '{}' : '{}');
    expect(payload.profile.id).toBe(profileId);
    expect(payload.excluded).toContain('raw OCR');
    expect(JSON.stringify(payload)).not.toContain('email@example.com');
    expect(repository.auditToolRead).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: 'mrx_get_case_snapshot',
        transport: 'test',
        profileId,
        success: true,
      }),
    );
  });
});

describe('MRX MCP HTTP security helpers', () => {
  it('compares bearer tokens without accepting prefixes or unequal lengths', () => {
    const token = 'a'.repeat(32);
    expect(tokensMatch(token, token)).toBe(true);
    expect(tokensMatch(`${token}x`, token)).toBe(false);
    expect(tokensMatch(token.slice(0, 31), token)).toBe(false);
    expect(tokensMatch(null, token)).toBe(false);
  });

  it('requires an exact allowlisted host', () => {
    const request = { headers: { host: 'mcp.example.com' } } as never;
    expect(requestHostAllowed(request, ['mcp.example.com'])).toBe(true);
    expect(requestHostAllowed(request, ['example.com'])).toBe(false);
    expect(requestHostAllowed(request, [])).toBe(false);
  });

  it('enforces the configured request window', () => {
    const limit = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limit('client', 0).allowed).toBe(true);
    expect(limit('client', 100).allowed).toBe(true);
    expect(limit('client', 200).allowed).toBe(false);
    expect(limit('client', 1001).allowed).toBe(true);
  });
});
