import { describe, expect, it, vi } from 'vitest';
import {
  parseUSLocationInput,
  resolveUSGeography,
  US_STATES,
} from '../../src/lib/platform/geography';

function response(value: unknown) {
  return Promise.resolve(new Response(JSON.stringify(value), { status: 200 }));
}

describe('MRX U.S. geography resolution', () => {
  it('recognizes every state, DC, and U.S. Census territory code', () => {
    expect(US_STATES).toHaveLength(56);
    expect(new Set(US_STATES.map((state) => state.code)).size).toBe(56);
    expect(US_STATES.find((state) => state.code === 'TX')?.fips).toBe('48');
    expect(US_STATES.find((state) => state.code === 'PR')?.fips).toBe('72');
  });

  it('extracts residence city and state without treating the word in as Indiana', () => {
    const residence = parseUSLocationInput('I live in Austin, Texas.');
    expect(residence.city).toBe('Austin');
    expect(residence.state).toMatchObject({ name: 'Texas', code: 'TX', fips: '48' });
    expect(parseUSLocationInput('Austin TX')).toMatchObject({
      city: 'Austin',
      state: { code: 'TX' },
    });
    expect(parseUSLocationInput('austin tx')).toMatchObject({
      city: 'Austin',
      state: { code: 'TX' },
    });

    const incompleteSurvey = parseUSLocationInput(
      'My minerals are in Section 12, Township 8 North.',
    );
    expect(incompleteSurvey.state).toBeUndefined();
  });

  it('parses a section-township-range legal description for BLM lookup', () => {
    const parsed = parseUSLocationInput('Section 12, Township 8 North, Range 5 West, Wyoming');
    expect(parsed.state?.code).toBe('WY');
    expect(parsed.plss).toEqual({
      section: 12,
      township: 8,
      townshipDirection: 'N',
      range: 5,
      rangeDirection: 'W',
    });
    const texasSurvey = parseUSLocationInput(
      'Block 2, Section 10, T&P RR Co. Survey, Abstract 123, Reeves County, Texas',
    );
    expect(texasSurvey).toMatchObject({ county: 'Reeves', state: { code: 'TX' } });
    expect(texasSurvey.legalDescription).toContain('Abstract 123');
  });

  it('does not guess one county when a Census city crosses county lines', async () => {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() =>
        response({
          features: [
            {
              attributes: {
                GEOID: '4805000',
                BASENAME: 'Austin',
                INTPTLAT: '+30.2986219',
                INTPTLON: '-097.7541339',
              },
              geometry: {
                rings: [
                  [
                    [-98, 30],
                    [-97, 30],
                    [-97, 31],
                    [-98, 30],
                  ],
                ],
              },
            },
          ],
        }),
      )
      .mockImplementationOnce(() => response({ features: [] }))
      .mockImplementationOnce(() =>
        response({
          features: [
            { attributes: { GEOID: '48453', BASENAME: 'Travis' } },
            { attributes: { GEOID: '48209', BASENAME: 'Hays' } },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        response({
          result: {
            geographies: {
              States: [{ GEOID: '48', STATE: '48', STUSAB: 'TX', BASENAME: 'Texas' }],
              Counties: [{ GEOID: '48453', BASENAME: 'Travis' }],
              'Incorporated Places': [{ GEOID: '4805000', BASENAME: 'Austin' }],
            },
          },
        }),
      );

    const result = await resolveUSGeography('I live in Austin, Texas', {
      fetcher: fetcher as typeof fetch,
    });

    expect(result).toMatchObject({
      status: 'ambiguous',
      scope: 'residence',
      city: 'Austin',
      state: 'Texas',
      county: 'Travis',
      needsConfirmation: true,
    });
    expect(result?.counties.map((county) => county.name)).toEqual(['Travis', 'Hays']);
  });

  it('returns exact county geography for a Census-matched address', async () => {
    const fetcher = vi.fn(() =>
      response({
        result: {
          addressMatches: [
            {
              matchedAddress: '111 CONGRESS AVE, AUSTIN, TX, 78701',
              coordinates: { x: -97.74445, y: 30.2635 },
              geographies: {
                States: [{ GEOID: '48', STATE: '48', STUSAB: 'TX', BASENAME: 'Texas' }],
                Counties: [{ GEOID: '48453', BASENAME: 'Travis' }],
                'Incorporated Places': [{ GEOID: '4805000', BASENAME: 'Austin' }],
              },
            },
          ],
        },
      }),
    );
    const result = await resolveUSGeography(
      'My home address is 111 Congress Ave, Austin, TX 78701',
      { fetcher: fetcher as typeof fetch },
    );
    expect(result).toMatchObject({
      status: 'resolved',
      scope: 'residence',
      precision: 'address',
      city: 'Austin',
      county: 'Travis',
      stateCode: 'TX',
      needsConfirmation: false,
    });
  });

  it('maps an exact Midland property point to its official energy basin', async () => {
    const fetcher = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onelineaddress')) {
        return response({
          result: {
            addressMatches: [
              {
                matchedAddress: '100 N LORAINE ST, MIDLAND, TX, 79701',
                coordinates: { x: -102.0779, y: 31.9973 },
                geographies: {
                  States: [{ GEOID: '48', STATE: '48', STUSAB: 'TX', BASENAME: 'Texas' }],
                  Counties: [{ GEOID: '48329', BASENAME: 'Midland' }],
                  'Incorporated Places': [{ GEOID: '4848072', BASENAME: 'Midland' }],
                },
              },
            ],
          },
        });
      }
      if (url.includes('SedimentaryBasins_US_EIA')) {
        return response({ features: [{ attributes: { OBJECTID: 45, Name: 'PERMIAN' } }] });
      }
      if (url.includes('Sedimentary_Basin')) {
        return response({
          features: [
            {
              attributes: {
                name: 'Permian Basin',
                basin_num: 115,
                basintype: 'Sag',
                source: 'USGS national sedimentary basin map',
              },
            },
          ],
        });
      }
      if (url.includes('noga_provinces')) {
        return response({
          features: [
            {
              attributes: {
                provinceco: 5044,
                provincena: 'Permian Basin',
                notes: '1995 National Oil and Gas Assessment Boundary',
              },
            },
          ],
        });
      }
      return response({ features: [] });
    });

    const result = await resolveUSGeography(
      'My mineral property is located at 100 N Loraine St, Midland, TX 79701',
      { fetcher: fetcher as typeof fetch },
    );

    expect(result).toMatchObject({
      scope: 'mineral_interest',
      precision: 'address',
      county: 'Midland',
      stateCode: 'TX',
      basin: 'Permian Basin',
      oilGasProvince: 'Permian Basin',
      basinStatus: 'resolved',
      basinNeedsConfirmation: false,
      basinSource: 'U.S. Energy Information Administration',
      basinSourceVintage: 'June 2024',
    });
    expect(result?.basins).toEqual([
      expect.objectContaining({
        name: 'Permian Basin',
        source: 'U.S. Energy Information Administration',
      }),
    ]);
  });

  it('does not repeat basin after USGS province names that already contain basin wording', async () => {
    for (const provinceName of ['Gulf Coast Basins', 'Williston Basin (Including Bakken)']) {
      const fetcher = vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/coordinates?')) {
          return response({
            result: {
              geographies: {
                States: [{ GEOID: '22', STATE: '22', STUSAB: 'LA', BASENAME: 'Louisiana' }],
                Counties: [{ GEOID: '22017', BASENAME: 'Caddo' }],
              },
            },
          });
        }
        if (url.includes('noga_provinces')) {
          return response({
            features: [{ attributes: { provinceco: 5047, provincena: provinceName } }],
          });
        }
        return response({ features: [] });
      });

      const result = await resolveUSGeography('32.5000, -93.7000', {
        scope: 'mineral_interest',
        fetcher: fetcher as typeof fetch,
      });
      expect(result?.basin).toBe(provinceName);
      expect(result?.oilGasProvince).toBe(provinceName);
    }
  });
});
