#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSupabaseClientFromEnv, createSupabaseRepository } from './repository.mjs';
import { createMrxMcpServer } from './server.mjs';

const client = createSupabaseClientFromEnv();
const repository = createSupabaseRepository({
  client,
  auditEnabled: process.env.MRX_MCP_AUDIT_ENABLED !== 'false',
});
const server = createMrxMcpServer({ repository, transport: 'stdio' });
const transport = new StdioServerTransport();

await server.connect(transport);
console.error('[MRX MCP] read-only stdio server connected');

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
