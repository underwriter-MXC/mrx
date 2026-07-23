import { readFile } from 'node:fs/promises';

export const agentSpecs = [
  {
    id: 'inventory',
    file: 'README.md',
    title: 'Claude asset inventory and integration readiness',
    status: 'reviewed-inventory',
  },
  {
    id: 'mineralholders-export-v3',
    file: 'mineral-holders-export-project-instructions.md',
    title: 'MineralHolders Export Agent v3.0',
    status: 'canonical-extraction-spec',
  },
  {
    id: 'mineralholders-reference-v3',
    file: 'MHE-02-mineralholders-reference.md',
    title: 'MineralHolders 42-column reference v3.0',
    status: 'canonical-extraction-spec',
  },
  {
    id: 'excel-wizard-v3-3',
    file: 'excel-wizard-project-instructions.md',
    title: 'Excel Wizard v3.3',
    status: 'canonical-workbook-spec-unvalidated-valuation',
  },
  {
    id: 'excel-wizard-calculations',
    file: 'EW-TF-A-calculations-and-flags.md',
    title: 'Excel Wizard calculations and flags',
    status: 'requires-independent-valuation-validation',
  },
  {
    id: 'excel-wizard-workbook',
    file: 'EW-TF-B-workbook-build-spec.md',
    title: 'Excel Wizard workbook build specification',
    status: 'canonical-workbook-spec',
  },
  {
    id: 'excel-wizard-ingestion',
    file: 'EW-TF-C-mineralholders-ingestion.md',
    title: 'Excel Wizard MineralHolders ingestion',
    status: 'canonical-ingestion-spec',
  },
  {
    id: 'acquisition-agent-v2-2',
    file: 'acquisition-agent-project-instructions.md',
    title: 'Acquisition Agent v2.2',
    status: 'canonical-conversation-spec',
  },
  {
    id: 'acquisition-valuation-flags',
    file: 'AA-TF-A-valuation-and-flags.md',
    title: 'Acquisition valuation and flags',
    status: 'requires-independent-valuation-validation',
  },
  {
    id: 'acquisition-conversation-documents',
    file: 'AA-TF-B-conversation-and-documents.md',
    title: 'Acquisition conversation and document workflow',
    status: 'canonical-conversation-spec',
  },
  {
    id: 'acquisition-data-sources',
    file: 'AA-TF-C-data-sources.md',
    title: 'Acquisition data sources',
    status: 'connector-design-spec',
  },
  {
    id: 'research-agent',
    file: 'AA-TF-D-research-agent.md',
    title: 'Acquisition Research Agent',
    status: 'role-spec-no-live-connectors',
  },
  {
    id: 'data-pipeline-blueprint',
    file: 'LC-Data_Pipeline_Blueprint.txt',
    title: 'Mineral-rights data pipeline blueprint',
    status: 'engineering-blueprint',
  },
  {
    id: 'agent-builder-v2',
    file: 'ai-agent-builder-project-instructions.md',
    title: 'AI Agent Builder v2.0',
    status: 'meta-agent-reference',
  },
];

export async function readAgentSpec(id) {
  const spec = agentSpecs.find((candidate) => candidate.id === id);
  if (!spec) throw new Error('Unknown MRX agent specification.');
  const url = new URL(`../docs/claude-import/${spec.file}`, import.meta.url);
  const text = await readFile(url, 'utf8');
  return { ...spec, text };
}
