import { describe, expect, it } from 'vitest';
// The validation population is intentionally plain ESM so the same source powers the staging runner.
import {
  buildAskTommyScenarios,
  summarizeAskTommyScenarios,
} from '../../scripts/lib/ask-tommy-scenarios.mjs';

describe('Ask Tommy 100-owner validation population', () => {
  const scenarios = buildAskTommyScenarios();
  const summary = summarizeAskTommyScenarios(scenarios);

  it('creates 100 unique, reserved fictitious identities', () => {
    expect(scenarios).toHaveLength(100);
    expect(new Set(scenarios.map((scenario: any) => scenario.email)).size).toBe(100);
    expect(new Set(scenarios.map((scenario: any) => scenario.phone)).size).toBe(100);
    expect(scenarios[0].email).toBe('mrx-test-001@example.com');
    expect(scenarios[99].email).toBe('mrx-test-100@example.com');
    expect(scenarios[0].phone).toBe('+1-202-555-0100');
    expect(scenarios[99].phone).toBe('+1-202-555-0199');
  });

  it('matches the required geographic and scenario coverage', () => {
    expect(summary.states.Texas).toBe(40);
    expect(
      Object.values(summary.states).reduce((total: number, count: any) => total + count, 0),
    ).toBe(100);
    expect(summary.categories).toEqual({
      offer_review: 20,
      inheritance_estate: 20,
      royalty_decline: 15,
      ownership_records: 15,
      geology: 10,
      legal_tax_routing: 10,
      scheduling_follow_up: 10,
    });
    expect(Object.values(summary.profiles).sort()).toEqual([12, 12, 12, 12, 13, 13, 13, 13]);
    expect(summary.multipleProperties).toBe(15);
    expect(summary.corrections).toBe(10);
    expect(summary.sameDeviceReturns).toBe(10);
    expect(summary.crossDeviceReturns).toBe(10);
    expect(summary.documents).toBe(10);
    expect(summary.revocations).toBe(10);
  });

  it('contains explicit choices for every requested-update channel', () => {
    for (const scenario of scenarios) {
      expect(typeof scenario.permissions.email).toBe('boolean');
      expect(typeof scenario.permissions.sms).toBe('boolean');
      expect(typeof scenario.permissions.aiVoice).toBe('boolean');
    }
    expect(
      scenarios.some((scenario: any) => Object.values(scenario.permissions).every(Boolean)),
    ).toBe(true);
    expect(
      scenarios.some((scenario: any) =>
        Object.values(scenario.permissions).every((value) => !value),
      ),
    ).toBe(true);
  });
});
