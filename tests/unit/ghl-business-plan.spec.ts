import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import definition from '../../config/ghl-business-plan.json';

const ghlSource = readFileSync(new URL('../../src/lib/platform/ghl.ts', import.meta.url), 'utf8');

describe('MRX GHL business-plan configuration', () => {
  it('defines the three required pipelines and every business-plan stage', () => {
    expect(definition.pipelines.map((pipeline) => pipeline.name)).toEqual([
      'Prospects',
      'Appointments',
      'Sellers',
    ]);
    expect(
      definition.pipelines.find((pipeline) => pipeline.name === 'Prospects')?.stages,
    ).toContain('Contacted');
    expect(
      definition.pipelines.find((pipeline) => pipeline.name === 'Appointments')?.stages,
    ).toContain('Appointment Booked');
    expect(definition.pipelines.find((pipeline) => pipeline.name === 'Sellers')?.stages).toContain(
      'Closed - PLATFORM',
    );
  });

  it('creates DCF placeholders without writing manufactured values from the website', () => {
    const dcfFields = definition.customFields.filter((field) => field.dcf);
    expect(dcfFields).toHaveLength(10);
    for (const field of dcfFields) {
      const generatedKey = field.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      expect(ghlSource).not.toContain(`contact.${generatedKey}`);
    }
  });

  it('defines GHL conversation fields for redacted document summaries, channel history, and free-guide consent receipts', () => {
    const names = definition.customFields.map((field) => field.name);
    expect(names).toContain('MRX Latest Document Summary');
    expect(names).not.toContain('MRX Latest Document OCR');
    expect(names).toContain('MRX Full Conversation Synced');
    expect(names).toContain('MRX AI Voice Update Text');
    expect(names).toContain('MRX Requested Guide');
    expect(names).toContain('MRX Requested Guide URL');
    expect(names).toContain('MRX Free Guide Marketing Email Consent');
    expect(names).toContain('MRX Free Guide SMS Consent');
    expect(names).toContain('MRX Free Guide Call Consent');
    expect(names).toContain('MRX Guide Email Consent Text');
    expect(names).toContain('MRX SMS Consent Text');
    expect(names).toContain('MRX Call Consent Text');
    expect(names).toContain('MRX Consent Server Timestamp');
    expect(names).toContain('MRX Consent User Agent');
  });
});
