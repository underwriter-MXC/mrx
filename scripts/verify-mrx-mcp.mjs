import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['--env-file-if-exists=.env', '--env-file-if-exists=.env.local', 'mcp/stdio.mjs'],
  cwd: process.cwd(),
  stderr: 'pipe',
});
const client = new Client({ name: 'mrx-mcp-verifier', version: '0.1.0' });

try {
  await client.connect(transport);
  const [tools, resources, status] = await Promise.all([
    client.listTools(),
    client.listResources(),
    client.callTool({ name: 'mrx_system_status', arguments: {} }),
  ]);
  const content = status.content?.[0];
  const statusPayload = content?.type === 'text' ? JSON.parse(content.text) : null;
  if (status.isError || statusPayload?.database !== 'connected') {
    throw new Error('MRX MCP status tool did not confirm the database connection.');
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        accessMode: statusPayload.accessMode,
        database: statusPayload.database,
        toolCount: tools.tools.length,
        resourceCount: resources.resources.length,
        tools: tools.tools.map((tool) => tool.name),
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
