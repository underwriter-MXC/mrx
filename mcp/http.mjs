#!/usr/bin/env node
import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createSupabaseClientFromEnv, createSupabaseRepository } from './repository.mjs';
import { createMrxMcpServer } from './server.mjs';
import {
  bearerToken,
  createRateLimiter,
  readJsonBody,
  requestHostAllowed,
  requestOriginAllowed,
  splitCsv,
  tokensMatch,
} from './security.mjs';

const host = process.env.MRX_MCP_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.MRX_MCP_PORT || '8788', 10);
const expectedToken = process.env.MRX_MCP_BEARER_TOKEN;
const allowedHosts = splitCsv(
  process.env.MRX_MCP_ALLOWED_HOSTS || `localhost:${port},127.0.0.1:${port}`,
);
const allowedOrigins = splitCsv(process.env.MRX_MCP_ALLOWED_ORIGINS);
const maxBodyBytes = Number.parseInt(process.env.MRX_MCP_MAX_BODY_BYTES || '1048576', 10);
const requestsPerMinute = Number.parseInt(process.env.MRX_MCP_RATE_LIMIT_PER_MINUTE || '60', 10);

if (!expectedToken || expectedToken.length < 32) {
  throw new Error('MRX_MCP_BEARER_TOKEN must contain at least 32 characters.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('MRX_MCP_PORT is invalid.');
if (!allowedHosts.length) throw new Error('MRX_MCP_ALLOWED_HOSTS must not be empty.');

const client = createSupabaseClientFromEnv();
const repository = createSupabaseRepository({
  client,
  auditEnabled: process.env.MRX_MCP_AUDIT_ENABLED !== 'false',
});
const rateLimit = createRateLimiter({ limit: requestsPerMinute });

function json(response, status, value, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(JSON.stringify(value));
}

function remoteAddress(request) {
  return request.socket.remoteAddress || 'unknown';
}

const httpServer = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/health' && request.method === 'GET') {
    return json(response, 200, { ok: true, service: 'mrx-mcp', accessMode: 'read-only' });
  }
  if (url.pathname !== '/mcp') return json(response, 404, { error: 'not_found' });
  if (!requestHostAllowed(request, allowedHosts))
    return json(response, 421, { error: 'host_not_allowed' });
  if (!requestOriginAllowed(request, allowedOrigins))
    return json(response, 403, { error: 'origin_not_allowed' });
  if (request.method === 'OPTIONS') {
    const origin = request.headers.origin;
    const corsHeaders =
      origin && allowedOrigins.includes(origin)
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers':
              'authorization,content-type,mcp-protocol-version,mcp-session-id',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
          }
        : {};
    response.writeHead(204, corsHeaders);
    return response.end();
  }
  if (request.method !== 'POST') {
    return json(response, 405, { error: 'method_not_allowed' }, { Allow: 'POST, OPTIONS' });
  }

  const contentLength = Number.parseInt(request.headers['content-length'] || '0', 10);
  if (contentLength > maxBodyBytes) return json(response, 413, { error: 'request_too_large' });
  if (!tokensMatch(bearerToken(request), expectedToken)) {
    return json(response, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
  }

  const rate = rateLimit(remoteAddress(request));
  response.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  if (!rate.allowed) {
    response.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
    );
    return json(response, 429, { error: 'rate_limited' });
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const mcpServer = createMrxMcpServer({ repository, transport: 'streamable-http' });
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    await transport.close();
    await mcpServer.close();
  };
  response.once('close', cleanup);
  try {
    const body = await readJsonBody(request, maxBodyBytes);
    await mcpServer.connect(transport);
    await transport.handleRequest(request, response, body);
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const publicError =
      statusCode === 413 ? 'request_too_large' : statusCode === 400 ? 'invalid_json' : null;
    console.error('[MRX MCP] request failed');
    if (!response.headersSent) {
      if (publicError) json(response, statusCode, { error: publicError });
      else {
        json(response, 500, {
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  } finally {
    if (response.writableEnded) await cleanup();
  }
});

httpServer.listen(port, host, () => {
  console.error(`[MRX MCP] read-only HTTP server listening on http://${host}:${port}/mcp`);
});

async function shutdown() {
  httpServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
