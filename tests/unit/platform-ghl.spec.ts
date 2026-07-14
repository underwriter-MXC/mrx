import { describe, expect, it } from 'vitest';
import { extractAvailabilitySlots, formatAvailabilitySlots } from '../../src/lib/platform/ghl';

describe('conversational appointment availability', () => {
  const now = new Date('2026-07-13T16:00:00.000Z');
  const slots = [
    '2026-07-14T15:00:00.000Z', // 10:00 AM Central
    '2026-07-14T20:00:00.000Z', // 3:00 PM Central
    '2026-07-14T22:00:00.000Z', // 5:00 PM Central
    '2026-07-14T23:00:00.000Z', // 6:00 PM Central
    '2026-07-15T22:00:00.000Z', // next day, excluded from tomorrow
  ];

  it('offers only tomorrow afternoon slots for an afternoon request', () => {
    const result = formatAvailabilitySlots(slots, 'America/Chicago', 'afternoon', 'tomorrow', now);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe('2026-07-14T20:00:00.000Z');
    expect(result[0].label).toMatch(/Tuesday, Jul 14.*3:00 PM/);
  });

  it('offers at most three tomorrow evening choices and excludes other dates', () => {
    const result = formatAvailabilitySlots(slots, 'America/Chicago', 'evening', 'tomorrow', now);
    expect(result.map((slot) => slot.start)).toEqual([
      '2026-07-14T22:00:00.000Z',
      '2026-07-14T23:00:00.000Z',
    ]);
  });

  it('ignores malformed slot data', () => {
    expect(
      formatAvailabilitySlots(
        [null, {}, 'not-a-date'],
        'America/New_York',
        'any',
        'next_available',
        now,
      ),
    ).toEqual([]);
  });

  it('extracts slots from the date-keyed HighLevel v3 availability response', () => {
    expect(
      extractAvailabilitySlots({
        '2026-07-14': { slots: ['2026-07-14T20:00:00.000Z'] },
        '2026-07-15': { slots: ['2026-07-15T20:00:00.000Z'] },
      }),
    ).toEqual(['2026-07-14T20:00:00.000Z', '2026-07-15T20:00:00.000Z']);
  });

  it('uses a 30-minute end time when HighLevel omits one and removes duplicate starts', () => {
    const result = formatAvailabilitySlots(
      [{ startTime: '2026-07-14T20:00:00.000Z' }, { startTime: '2026-07-14T20:00:00.000Z' }],
      'America/Chicago',
      'afternoon',
      'tomorrow',
      now,
    );
    expect(result).toHaveLength(1);
    expect(result[0].end).toBe('2026-07-14T20:30:00.000Z');
  });
});
