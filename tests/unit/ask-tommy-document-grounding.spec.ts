import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildDocumentReadSummary,
  documentMemoryForPrompt,
  inferDocumentType,
} from '../../src/lib/platform/documents';
import {
  documentLocationCardFromInterest,
  parseUSLocationInput,
  shouldShowKnownLocationCard,
} from '../../src/lib/platform/geography';
import { fallbackConversationAnswer } from '../../src/lib/platform/conversation';

const repoFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Ask Tommy document grounding', () => {
  it('builds a redacted structured document-read summary for a royalty statement', () => {
    const summary = buildDocumentReadSummary({
      originalName: 'Revenue Statement_LAGUNA RESOURCES_1174_2026-06.pdf',
      documentType: 'royalty_statement',
      pageCount: 3,
      piiCategories: ['bank_account'],
      redactedText: [
        'LAGUNA RESOURCES LLC',
        'Revenue Statement',
        'Owner Number: 1174',
        'Statement Date: 06/30/2026',
        'Lease: MARTIN 12-1H',
        'County: Martin County, Texas',
        'Well: MARTIN UNIT 12-1H',
        'Owner decimal 0.01234567',
        'Net Revenue $1,234.56',
        'Account number: [REDACTED BANK ACCOUNT]',
      ].join('\n'),
    });

    expect(summary.content).toContain(
      'I finished reading Revenue Statement_LAGUNA RESOURCES_1174_2026-06.pdf',
    );
    expect(summary.content).toContain('Document type: royalty statement');
    expect(summary.content).toContain('Parties/payor mentioned: LAGUNA RESOURCES LLC');
    expect(summary.content).toContain('Location mentioned: Martin County, Texas');
    expect(summary.content).toContain('Revenue/income figures found: $1,234.56');
    expect(summary.content).toContain(
      'What this does not establish: a certified appraisal, market value, title opinion, or individualized legal or tax guidance.',
    );
    expect(summary.content).not.toContain('REDACTED BANK ACCOUNT');
    expect(summary.memory).toContain('Document-read summary');
    expect(summary.metadata.confidence).toBe('candidate_owner_verification_needed');
  });

  it('reads digital-statement layouts where amounts precede labels and property rows carry geography', () => {
    const summary = buildDocumentReadSummary({
      originalName: 'sample-revenue-statement.pdf',
      documentType: 'royalty_statement',
      pageCount: 2,
      redactedText: [
        'AURORA RESOURCES LLC',
        '873.21Check Amount',
        'Property: TX9988001 MOCKINGBIRD UNIT 1H, State: TX, County: DAWSON  Operator API# - 4211500001',
      ].join('\n'),
    });

    expect(summary.content).toContain('Dawson County, TX');
    expect(summary.content).toContain('TX9988001 MOCKINGBIRD UNIT 1H');
    expect(summary.content).toContain('4211500001');
    expect(summary.content).toContain('Check Amount: $873.21');
    expect(inferDocumentType('EnergyLink Revenue Statement', 'other')).toBe('royalty_statement');
  });

  it('keeps recent document summaries and document chunks available for follow-up prompts', () => {
    const memory = documentMemoryForPrompt(
      [
        { source_type: 'conversation', content: 'hello there' },
        {
          source_type: 'summary',
          content: 'Document-read summary: Martin County, Texas lease MARTIN 12-1H',
        },
        {
          source_type: 'document',
          content: 'Laguna Resources royalty statement Martin County Texas net revenue',
        },
      ],
      'where are my rights located?',
    );

    expect(memory.map((item) => item.source_type)).toEqual(['summary', 'document']);
    expect(memory.map((item) => item.content).join('\n')).toContain('Martin County');
  });

  it('creates a map link only from known precise coordinates, not an invented street address', () => {
    expect(shouldShowKnownLocationCard('where are my rights located?')).toBe(true);
    const card = documentLocationCardFromInterest({
      county: 'Martin',
      state: 'Texas',
      state_code: 'TX',
      latitude: 32.305,
      longitude: -101.951,
      location_precision: 'coordinates',
      geography_confidence: 0.97,
      basin_name: 'Permian Basin',
      basin_status: 'resolved',
      basin_source: 'U.S. Energy Information Administration',
    });

    expect(card).toMatchObject({
      label: 'Martin County, Texas',
      precision: 'coordinates',
      source: 'Known mineral-interest geography',
    });
    expect(card?.url).toContain('q=32.305%2C-101.951');
    expect(card?.label).not.toMatch(/\d+\s+\w+\s+(st|street|ave|road|rd)/i);
  });

  it('offers an explicitly approximate county map when that is all the document establishes', () => {
    const card = documentLocationCardFromInterest({
      county: 'Dawson County',
      state: 'Texas',
      state_code: 'TX',
      latitude: 32.742,
      longitude: -101.947,
      location_precision: 'county',
      geography_confidence: 0.94,
    });

    expect(card).toMatchObject({
      label: 'Dawson County, Texas',
      precision: 'county',
    });
    expect(card?.note).toMatch(/centers on the county.*not the mineral tract/i);
    expect(card?.note).toMatch(/No street address/i);
  });

  it('parses labeled state and county fields from a revenue-statement property row', () => {
    const location = parseUSLocationInput(
      'Property: TX9988001 MOCKINGBIRD UNIT 1H, State: TX, County: DAWSON  Operator API# - 4211500001',
    );

    expect(location.state).toMatchObject({ name: 'Texas', code: 'TX' });
    expect(location.county).toBe('Dawson');
    expect(location.city).toBeUndefined();
  });

  it('keeps document-based value answers educational and non-appraisal', () => {
    const answer = fallbackConversationAnswer(
      'what are these rights worth based on the revenue statement?',
    );
    expect(answer).toMatch(/depends on exact location/i);
    expect(answer).not.toMatch(/certified appraisal|guarantee|offer/i);
  });

  it('wires worker completion into an in-chat read summary and refreshed chat context', () => {
    const callback = repoFile('src/pages/api/chat/attachments/worker-callback.ts');
    const messageApi = repoFile('src/pages/api/chat/message.ts');
    const askTommy = repoFile('src/components/react/AskTommy.tsx');

    expect(callback).toContain('buildDocumentReadSummary');
    expect(callback).toContain("eventType: 'notice'");
    expect(callback).toContain("source_type: 'summary'");
    expect(messageApi).toContain('documentMemoryForPrompt');
    expect(messageApi).toContain('location.card');
    expect(askTommy).toContain('pollDocumentRead');
    expect(askTommy).toContain('tommy-location-card');
  });
});
