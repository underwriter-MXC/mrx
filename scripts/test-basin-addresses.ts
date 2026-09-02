import { resolveUSGeography } from '../src/lib/platform/geography';

type StateConfig = {
  code: string;
  name: string;
  bbox: [south: number, west: number, north: number, east: number];
};

type AddressCandidate = {
  address: string;
  facility: string;
  amenity: string | null;
  latitude: number;
  longitude: number;
};

const advertisedStates: StateConfig[] = [
  { code: 'TX', name: 'Texas', bbox: [30.0, -103.05, 33.5, -100.0] },
  { code: 'NM', name: 'New Mexico', bbox: [32.2, -104.6, 33.0, -103.0] },
  { code: 'OK', name: 'Oklahoma', bbox: [34.5, -100.0, 37.0, -97.0] },
  { code: 'ND', name: 'North Dakota', bbox: [47.8, -103.9, 48.5, -101.0] },
  { code: 'CO', name: 'Colorado', bbox: [39.4, -105.1, 40.5, -104.0] },
  { code: 'WY', name: 'Wyoming', bbox: [42.6, -106.7, 44.5, -105.0] },
  { code: 'PA', name: 'Pennsylvania', bbox: [39.72, -80.5, 42.2, -76.0] },
  { code: 'WV', name: 'West Virginia', bbox: [39.3, -80.9, 40.2, -79.5] },
  { code: 'OH', name: 'Ohio', bbox: [40.0, -81.7, 41.3, -80.5] },
  { code: 'LA', name: 'Louisiana', bbox: [31.8, -94.0, 32.8, -92.8] },
];

const seededCandidates: Record<string, AddressCandidate[]> = {
  OH: [
    ['Brilliant Post Office', '801 3rd Street, Brilliant, OH 43913', 40.2647175, -80.6289038],
    ['Neffs Post Office', '54061 Pike Street, Neffs, OH 43940', 40.0272946, -80.8167538],
    ['Bethesda Post Office', '111 South Main Street, Bethesda, OH 43719', 40.0153928, -81.0723292],
    ['Belmont Post Office', '128 West Main Street, Belmont, OH 43718', 40.0288959, -81.0418736],
    [
      'Morristown Post Office',
      '126 East Main Street, Morristown, OH 43759',
      40.0634891,
      -81.0721953,
    ],
    ['Homeworth Post Office', '4434 Middle Street, Homeworth, OH 44634', 40.8366611, -81.0667324],
    ['Deersville NPU', '205 West Main Street, Deersville, OH 44693', 40.3079504, -81.18891],
    ['Piedmont Post Office', '33031 West Main Street, Piedmont, OH 43983', 40.1888573, -81.2066726],
    [
      'Beach City Post Office',
      '130 East Main Street, Beach City, OH 44608',
      40.6542662,
      -81.5776707,
    ],
    [
      'Bath Post Office',
      '1970 North Cleveland Massillon Road, Bath, OH 44333',
      41.1891596,
      -81.6367056,
    ],
    [
      'Clinton Post Office',
      '2773 West Comet Road, Clinton, OH 44216-9998',
      40.9276286,
      -81.6263021,
    ],
    ['Dundee Post Office', '6759 State Route 93, Dundee, OH 44624', 40.5861527, -81.6090242],
    [
      'Bloomingowen Post Office',
      '111 High Street, Bloomingowen, OH 43910',
      40.3420319,
      -80.8165726,
    ],
    [
      'Wintersville Post Office',
      '210 Luray Drive, Wintersville, OH 43953',
      40.3804268,
      -80.7045532,
    ],
    [
      'Boardman Police Department',
      '8299 Market Street, Boardman, OH 44512',
      40.997642,
      -80.6612422,
    ],
  ].map(([facility, address, latitude, longitude]) => ({
    facility,
    address,
    latitude,
    longitude,
    amenity: 'public facility',
  })) as AddressCandidate[],
  LA: [
    ['Minden Public Library', '521 East & West Street, Minden, LA 71055', 32.6215274, -93.2811158],
    [
      'Shreveport Industrial Post Office',
      '1446 Hawn Avenue, Shreveport, LA 71107',
      32.5381942,
      -93.7652263,
    ],
    [
      'Barksowen Air Force Base Post Office',
      '450 Curtiss Road, Barksowen Air Force Base, LA 71110',
      32.4933344,
      -93.675281,
    ],
    [
      'Shreveport Huntington Post Office',
      '6719 Pines Road, Shreveport, LA 71129',
      32.4482598,
      -93.8623974,
    ],
    [
      'Bossier City Fire Station 8',
      '5255 Swan Lake Road, Bossier City, LA 71111',
      32.6151084,
      -93.711146,
    ],
    [
      'Bossier Parish Sheriff Substation',
      '2510 Viking Drive, Bossier City, LA 71111',
      32.5545575,
      -93.7190985,
    ],
    [
      'Shreveport Central Fire Station',
      '263 North Common Street, Shreveport, LA 71101',
      32.5204136,
      -93.7607574,
    ],
    ['Minden Post Office', '111 South Monroe Street, Minden, LA 71055', 32.6163558, -93.2885392],
    ['Caddo Parish Court House', '501 Texas Street, Shreveport, LA 71101', 32.5120698, -93.7497245],
    [
      'Shreveport Downtown Post Office',
      '333 Milam Street, Shreveport, LA 71101',
      32.5126455,
      -93.7475564,
    ],
    ['Central Art Station', '801 Crockett Street, Shreveport, LA 71101', 32.5087872, -93.7509094],
    [
      'Bossier City Fire Station 6',
      '420 Riverside Drive, Bossier City, LA 71111',
      32.5120506,
      -93.7307822,
    ],
    [
      'Bossier Parish Central Library',
      '2206 Beckett Street, Bossier City, LA 71111',
      32.5257074,
      -93.7161374,
    ],
    [
      'Bossier City Fire Station 1',
      '620 Benton Road, Bossier City, LA 71111',
      32.5259379,
      -93.7126598,
    ],
    [
      'Shreveport Fire Station 6',
      '2027 David Raines Road, Shreveport, LA 71107',
      32.5443568,
      -93.8284791,
    ],
  ].map(([facility, address, latitude, longitude]) => ({
    facility,
    address,
    latitude,
    longitude,
    amenity: 'public facility',
  })) as AddressCandidate[],
};

const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function haversineKm(first: [number, number], second: [number, number]) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = radians(second[0] - first[0]);
  const deltaLon = radians(second[1] - first[1]);
  const lat1 = radians(first[0]);
  const lat2 = radians(second[0]);
  const value =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function candidateAddress(tags: Record<string, string>, state: StateConfig) {
  const number = tags['addr:housenumber']?.trim();
  const street = tags['addr:street']?.trim();
  const city = (tags['addr:city'] || tags['addr:place'])?.trim();
  const postcode = tags['addr:postcode']?.trim();
  if (tags['addr:state'] && tags['addr:state'].toUpperCase() !== state.code) return null;
  if (!number || !street || (!city && !postcode)) return null;
  return [`${number} ${street}`, city, [state.code, postcode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

async function overpassCandidates(state: StateConfig) {
  const bbox = state.bbox.join(',');
  const query = `[out:json][timeout:90];nwr["amenity"~"^(townhall|library|fire_station|police|courthouse|post_office|community_centre)$"]["addr:housenumber"]["addr:street"](${bbox});out center tags 400;`;
  let lastError: unknown;
  for (const endpoint of overpassEndpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 100_000);
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MRX-Geography-Validation/1.0 contact@mineralrightsxchange.com',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!response.ok) throw new Error(`overpass_${response.status}`);
      const data = (await response.json()) as {
        elements?: Array<Record<string, any>>;
        remark?: string;
      };
      if (data.remark && !data.elements?.length) throw new Error(data.remark);
      const seen = new Set<string>();
      return (data.elements ?? []).flatMap((element) => {
        const tags = (element.tags ?? {}) as Record<string, string>;
        const address = candidateAddress(tags, state);
        const latitude = Number(element.lat ?? element.center?.lat);
        const longitude = Number(element.lon ?? element.center?.lon);
        if (!address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        const key = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'] || tags['addr:place'] || '',
        ]
          .join('|')
          .toLowerCase()
          .replace(/[^a-z0-9|]/g, '');
        if (seen.has(key)) return [];
        seen.add(key);
        return [
          {
            address,
            facility: tags.name || tags.amenity || 'Public facility',
            amenity: tags.amenity || null,
            latitude,
            longitude,
          },
        ];
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('overpass_unavailable');
}

function failureReason(result: Awaited<ReturnType<typeof resolveUSGeography>>, state: StateConfig) {
  if (!result) return 'resolver_unavailable';
  if (result.status !== 'resolved') return `geography_${result.status}`;
  if (result.stateCode !== state.code) return 'wrong_state';
  if (!result.county) return 'county_missing';
  if (!result.basin || result.basinStatus !== 'resolved') return `basin_${result.basinStatus}`;
  return null;
}

async function testState(state: StateConfig, target: number) {
  const candidates = seededCandidates[state.code] ?? (await overpassCandidates(state));
  const passed: Array<Record<string, unknown>> = [];
  const failures = new Map<string, number>();
  let attempted = 0;

  for (const candidate of candidates) {
    if (passed.length >= target || attempted >= 120) break;
    attempted += 1;
    const result = await resolveUSGeography(
      `My mineral property is located at ${candidate.address}`,
      { scope: 'mineral_interest' },
    );
    let reason = failureReason(result, state);
    const distanceKm =
      result?.latitude != null && result.longitude != null
        ? haversineKm(
            [candidate.latitude, candidate.longitude],
            [result.latitude, result.longitude],
          )
        : null;
    if (!reason && (distanceKm == null || distanceKm > 3)) reason = 'address_mismatch';
    if (reason) {
      failures.set(reason, (failures.get(reason) ?? 0) + 1);
      continue;
    }
    passed.push({
      number: passed.length + 1,
      state: state.code,
      facility: candidate.facility,
      address: candidate.address,
      county: result!.county,
      basin: result!.basin,
      oilGasProvince: result!.oilGasProvince,
      basinSource: result!.basinSource,
      distanceKm: Number(distanceKm!.toFixed(2)),
    });
  }

  return {
    state: state.code,
    stateName: state.name,
    target,
    passed: passed.length,
    attempted,
    availableCandidates: candidates.length,
    failures: Object.fromEntries([...failures.entries()].sort((a, b) => b[1] - a[1])),
    results: passed,
  };
}

const requestedState = argument('state')?.toUpperCase();
const target = Math.max(1, Math.min(25, Number(argument('count') || 10)));
const state = advertisedStates.find((item) => item.code === requestedState);
if (!state) {
  console.error(`Use --state with one of: ${advertisedStates.map((item) => item.code).join(', ')}`);
  process.exit(2);
}

const report = await testState(state, target);
console.log(JSON.stringify(report));
if (report.passed !== target) process.exitCode = 1;
