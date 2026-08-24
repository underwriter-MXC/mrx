import { describe, expect, it } from 'vitest';

import { assertExecutiveSelectionDecision } from '../../scripts/lib/mrx-executive-selection-decision.mjs';

describe('MRX executive selection admission gate', () => {
  it('accepts an mrx_ceo redefinition verdict for Wave 93 and later', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: '93',
        decisionSource:
          'MRX_CEO_DECISION: APPROVE_REDEFINED — MRX1000-0169 | Exact title | exact-slug | exact keyword',
      }),
    ).not.toThrow();
  });

  it('accepts an mrx_ceo select-one verdict for future waves', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: 94,
        decisionSource: 'MRX_CEO_DECISION: SELECT_ONE — MRX1000-0170 | Exact title',
      }),
    ).not.toThrow();
  });

  it('rejects a Codex-only selection even when an executive marker is also present', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: 94,
        decisionSource:
          'CODEX_SELECTION: APPROVE_REDEFINED\nMRX_CEO_DECISION: APPROVE_REDEFINED — MRX1000-0170',
      }),
    ).toThrow(/cannot be admitted from a CODEX_SELECTION decision/);
  });

  it('rejects a post-Wave-92 selection that lacks an executive verdict', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: 93,
        decisionSource: 'Disposition: `APPROVED_FOR_CONTINUOUS_QUALITY_GATED_PUBLICATION`',
      }),
    ).toThrow(/lacks an admissible MRX_CEO_DECISION verdict/);
  });

  it('rejects an advisory-unavailable marker as a substitute for mrx_ceo', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: 94,
        decisionSource:
          'MRX_EXECUTIVE_ADVISORY_UNAVAILABLE: no callable Hermes, Chesty, or `mrx_ceo` tool is configured in this task.\nCODEX_SELECTION: APPROVE_REDEFINED',
      }),
    ).toThrow(/cannot be admitted from a CODEX_SELECTION decision/);
  });

  it('does not retroactively invalidate historical waves', () => {
    expect(() =>
      assertExecutiveSelectionDecision({
        waveNumber: 92,
        decisionSource: 'CODEX_SELECTION: HISTORICAL_RECORD',
      }),
    ).not.toThrow();
  });
});
