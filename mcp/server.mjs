import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { agentSpecs, readAgentSpec } from './specs.mjs';

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const stateCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());
const uuidSchema = z.uuid();
const resultLimitSchema = z.number().int().min(1).max(25).default(10);

function toolResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function toolError(error) {
  const message = error instanceof Error ? error.message : 'Unknown MRX MCP error';
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ error: message }, null, 2) }],
  };
}

async function audited(repository, context, operation) {
  const startedAt = Date.now();
  let success = false;
  try {
    const value = await operation();
    success = true;
    return toolResult(value);
  } catch (error) {
    return toolError(error);
  } finally {
    await repository.auditToolRead({
      ...context,
      success,
      durationMs: Date.now() - startedAt,
    });
  }
}

export function createMrxMcpServer({ repository, transport = 'unknown' }) {
  if (!repository) throw new Error('An MRX repository is required.');
  const server = new McpServer({ name: 'mrx-read-only', version: '0.1.0' });

  server.registerTool(
    'mrx_system_status',
    {
      title: 'MRX system status',
      description:
        'Verify the read-only MRX data connection and report which sensitive fields are intentionally excluded.',
      annotations: readOnlyAnnotations,
    },
    async () =>
      audited(repository, { tool: 'mrx_system_status', transport }, () =>
        repository.getSystemStatus(),
      ),
  );

  for (const spec of agentSpecs) {
    const uri = `mrx://agent-spec/${spec.id}`;
    server.registerResource(
      `mrx-agent-spec-${spec.id}`,
      uri,
      {
        title: spec.title,
        description: `Imported Claude specification. Review status: ${spec.status}.`,
        mimeType: spec.file.endsWith('.txt') ? 'text/plain' : 'text/markdown',
      },
      async () => {
        const document = await readAgentSpec(spec.id);
        return {
          contents: [
            {
              uri,
              mimeType: spec.file.endsWith('.txt') ? 'text/plain' : 'text/markdown',
              text: document.text,
              _meta: { status: spec.status, sourceFile: spec.file },
            },
          ],
        };
      },
    );
  }

  server.registerTool(
    'mrx_pipeline_summary',
    {
      title: 'MRX pipeline summary',
      description:
        'Return aggregate mineral-interest counts. This tool never returns seller contact details or valuation amounts.',
      inputSchema: {
        stateCode: stateCodeSchema.optional(),
        county: z.string().trim().min(2).max(120).optional(),
      },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      audited(repository, { tool: 'mrx_pipeline_summary', transport }, () =>
        repository.getPipelineSummary(input),
      ),
  );

  server.registerTool(
    'mrx_search_mineral_interests',
    {
      title: 'Search MRX mineral interests',
      description:
        'Search mineral interests by an explicit profile, state, county, or operator filter. Contact details, conversations, and document text are excluded.',
      inputSchema: z
        .object({
          profileId: uuidSchema.optional(),
          stateCode: stateCodeSchema.optional(),
          county: z.string().trim().min(2).max(120).optional(),
          operator: z.string().trim().min(2).max(160).optional(),
          limit: resultLimitSchema,
        })
        .refine(
          (input) => Boolean(input.profileId || input.stateCode || input.county || input.operator),
          'At least one search filter is required.',
        ),
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      audited(
        repository,
        { tool: 'mrx_search_mineral_interests', transport, profileId: input.profileId },
        () => repository.searchMineralInterests(input),
      ),
  );

  server.registerTool(
    'mrx_get_case_snapshot',
    {
      title: 'Get MRX case snapshot',
      description:
        'Return a privacy-reduced underwriting snapshot for one profile. Email, phone, message content, raw OCR, and storage paths are always excluded.',
      inputSchema: {
        profileId: uuidSchema,
        includeCandidates: z.boolean().default(false),
      },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      audited(
        repository,
        {
          tool: 'mrx_get_case_snapshot',
          transport,
          profileId: input.profileId,
          targetId: input.profileId,
        },
        async () => {
          const snapshot = await repository.getCaseSnapshot(input);
          if (!snapshot) throw new Error('MRX case not found.');
          return snapshot;
        },
      ),
  );

  server.registerTool(
    'mrx_search_knowledge',
    {
      title: 'Search approved MRX knowledge',
      description:
        'Search titles of published, reviewed MRX knowledge documents. Draft and private documents are excluded.',
      inputSchema: {
        query: z.string().trim().min(2).max(120),
        stateCode: stateCodeSchema.optional(),
        limit: resultLimitSchema,
      },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      audited(repository, { tool: 'mrx_search_knowledge', transport }, () =>
        repository.searchKnowledge(input),
      ),
  );

  server.registerTool(
    'mrx_get_knowledge_document',
    {
      title: 'Read approved MRX knowledge',
      description:
        'Read one published MRX knowledge document by UUID, including its source metadata.',
      inputSchema: { documentId: uuidSchema },
      annotations: readOnlyAnnotations,
    },
    async (input) =>
      audited(
        repository,
        { tool: 'mrx_get_knowledge_document', transport, targetId: input.documentId },
        async () => {
          const document = await repository.getKnowledgeDocument(input);
          if (!document) throw new Error('Published MRX knowledge document not found.');
          return document;
        },
      ),
  );

  return server;
}
