import { getSupabaseServer } from './supabase';

const CENSUS_GEOCODER = 'https://geocoding.geo.census.gov/geocoder/geographies';
const TIGER_CURRENT =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer';
const BLM_PLSS =
  'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/2/query';
const EIA_SEDIMENTARY_BASINS =
  'https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/SedimentaryBasins_US_EIA/FeatureServer/109/query';
const USGS_SEDIMENTARY_BASINS =
  'https://energy.usgs.gov/arcgis/rest/services/BaseMaps/Sedimentary_Basin/MapServer/0/query';
const USGS_NOGA_PROVINCES =
  'https://energy.usgs.gov/arcgis/rest/services/BaseMaps/noga_provinces/MapServer/0/query';
const CENSUS_BENCHMARK = 'Public_AR_Current';
const CENSUS_VINTAGE = 'Current_Current';
const EIA_BASIN_VINTAGE = 'June 2024';
const USGS_NOGA_VINTAGE = '1995 National Oil and Gas Assessment boundary';

type StateDefinition = { name: string; code: string; fips: string; aliases?: string[] };

export const US_STATES: StateDefinition[] = [
  { name: 'Alabama', code: 'AL', fips: '01' },
  { name: 'Alaska', code: 'AK', fips: '02' },
  { name: 'Arizona', code: 'AZ', fips: '04' },
  { name: 'Arkansas', code: 'AR', fips: '05' },
  { name: 'California', code: 'CA', fips: '06' },
  { name: 'Colorado', code: 'CO', fips: '08' },
  { name: 'Connecticut', code: 'CT', fips: '09' },
  { name: 'Delaware', code: 'DE', fips: '10' },
  {
    name: 'District of Columbia',
    code: 'DC',
    fips: '11',
    aliases: ['Washington DC', 'Washington, DC'],
  },
  { name: 'Florida', code: 'FL', fips: '12' },
  { name: 'Georgia', code: 'GA', fips: '13' },
  { name: 'Hawaii', code: 'HI', fips: '15' },
  { name: 'Idaho', code: 'ID', fips: '16' },
  { name: 'Illinois', code: 'IL', fips: '17' },
  { name: 'Indiana', code: 'IN', fips: '18' },
  { name: 'Iowa', code: 'IA', fips: '19' },
  { name: 'Kansas', code: 'KS', fips: '20' },
  { name: 'Kentucky', code: 'KY', fips: '21' },
  { name: 'Louisiana', code: 'LA', fips: '22' },
  { name: 'Maine', code: 'ME', fips: '23' },
  { name: 'Maryland', code: 'MD', fips: '24' },
  { name: 'Massachusetts', code: 'MA', fips: '25' },
  { name: 'Michigan', code: 'MI', fips: '26' },
  { name: 'Minnesota', code: 'MN', fips: '27' },
  { name: 'Mississippi', code: 'MS', fips: '28' },
  { name: 'Missouri', code: 'MO', fips: '29' },
  { name: 'Montana', code: 'MT', fips: '30' },
  { name: 'Nebraska', code: 'NE', fips: '31' },
  { name: 'Nevada', code: 'NV', fips: '32' },
  { name: 'New Hampshire', code: 'NH', fips: '33' },
  { name: 'New Jersey', code: 'NJ', fips: '34' },
  { name: 'New Mexico', code: 'NM', fips: '35' },
  { name: 'New York', code: 'NY', fips: '36' },
  { name: 'North Carolina', code: 'NC', fips: '37' },
  { name: 'North Dakota', code: 'ND', fips: '38' },
  { name: 'Ohio', code: 'OH', fips: '39' },
  { name: 'Oklahoma', code: 'OK', fips: '40' },
  { name: 'Oregon', code: 'OR', fips: '41' },
  { name: 'Pennsylvania', code: 'PA', fips: '42' },
  { name: 'Rhode Island', code: 'RI', fips: '44' },
  { name: 'South Carolina', code: 'SC', fips: '45' },
  { name: 'South Dakota', code: 'SD', fips: '46' },
  { name: 'Tennessee', code: 'TN', fips: '47' },
  { name: 'Texas', code: 'TX', fips: '48' },
  { name: 'Utah', code: 'UT', fips: '49' },
  { name: 'Vermont', code: 'VT', fips: '50' },
  { name: 'Virginia', code: 'VA', fips: '51' },
  { name: 'Washington', code: 'WA', fips: '53' },
  { name: 'West Virginia', code: 'WV', fips: '54' },
  { name: 'Wisconsin', code: 'WI', fips: '55' },
  { name: 'Wyoming', code: 'WY', fips: '56' },
  { name: 'American Samoa', code: 'AS', fips: '60' },
  { name: 'Guam', code: 'GU', fips: '66' },
  { name: 'Northern Mariana Islands', code: 'MP', fips: '69' },
  { name: 'Puerto Rico', code: 'PR', fips: '72' },
  {
    name: 'U.S. Virgin Islands',
    code: 'VI',
    fips: '78',
    aliases: ['US Virgin Islands', 'Virgin Islands'],
  },
];

const stateLookup = new Map<string, StateDefinition>();
for (const state of US_STATES) {
  for (const value of [state.name, state.code, ...(state.aliases ?? [])]) {
    stateLookup.set(value.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim(), state);
  }
}

export type GeographyScope = 'residence' | 'mineral_interest';
export type GeographyStatus = 'resolved' | 'ambiguous' | 'needs_detail' | 'not_found';
export type GeographyPrecision = 'address' | 'coordinates' | 'section' | 'city' | 'county';
export type BasinStatus = 'resolved' | 'needs_detail' | 'not_found' | 'unavailable';

export type CountyMatch = { name: string; fips: string };
export type BasinMatch = {
  name: string;
  code: string | null;
  source: 'U.S. Energy Information Administration' | 'U.S. Geological Survey';
  basinType: string | null;
};

export type GeographyResolution = {
  status: GeographyStatus;
  scope: GeographyScope;
  queryType: 'address' | 'coordinates' | 'plss' | 'city_state' | 'county_state';
  input: string;
  city: string | null;
  nearestCity: string | null;
  state: string | null;
  stateCode: string | null;
  stateFips: string | null;
  county: string | null;
  countyFips: string | null;
  counties: CountyMatch[];
  placeGeoid: string | null;
  latitude: number | null;
  longitude: number | null;
  precision: GeographyPrecision;
  confidence: number;
  needsConfirmation: boolean;
  provider: 'US Census Bureau' | 'BLM PLSS and US Census Bureau';
  providerVintage: string;
  basin: string | null;
  basinCode: string | null;
  basins: BasinMatch[];
  oilGasProvince: string | null;
  oilGasProvinceCode: string | null;
  basinStatus: BasinStatus;
  basinConfidence: number | null;
  basinNeedsConfirmation: boolean;
  basinSource: string | null;
  basinSourceVintage: string | null;
  basinNote: string | null;
  matchedAddress?: string | null;
  legalDescription?: string | null;
  plssId?: string | null;
  note?: string | null;
};

export type LocationCard = {
  label: string;
  url: string;
  latitude: number;
  longitude: number;
  precision: GeographyPrecision;
  confidence: number | null;
  source: string;
  basin?: string | null;
  note?: string | null;
};

type KnownInterestLocation = {
  city?: string | null;
  county?: string | null;
  state?: string | null;
  state_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_precision?: GeographyPrecision | string | null;
  geography_confidence?: number | null;
  basin_name?: string | null;
  basin_status?: string | null;
  basin_source?: string | null;
};

export function shouldShowKnownLocationCard(question: string) {
  return /\b(where|located|location|map|county|basin|rights|property|minerals?|lease|well)\b/i.test(
    question,
  );
}

export function documentLocationCardFromInterest(
  interest: KnownInterestLocation | null | undefined,
): LocationCard | null {
  if (interest?.latitude == null || interest.longitude == null) return null;
  const precision = interest.location_precision;
  if (!['address', 'coordinates', 'section', 'city', 'county'].includes(String(precision)))
    return null;
  if (['city', 'county'].includes(String(precision)) && (interest.geography_confidence ?? 0) < 0.8)
    return null;
  const county = interest.county?.replace(/\s+County$/i, '');
  const label = [
    interest.city,
    county ? `${county} County` : null,
    interest.state || interest.state_code,
  ]
    .filter(Boolean)
    .join(', ');
  if (!label) return null;
  const latitude = Number(interest.latitude);
  const longitude = Number(interest.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    label,
    latitude,
    longitude,
    precision: precision as GeographyPrecision,
    confidence: interest.geography_confidence ?? null,
    source: 'Known mineral-interest geography',
    basin: interest.basin_status === 'resolved' ? interest.basin_name : null,
    note:
      precision === 'county'
        ? 'This map centers on the county named in the document, not the mineral tract. No street address or tract boundary was inferred.'
        : precision === 'city'
          ? 'This map centers on the city area named in the document, not the mineral tract. A legal description or coordinates are needed for a tract-level map.'
          : precision === 'section'
            ? 'Map pin is based on the survey section center and should be confirmed against the recorded tract boundary.'
            : 'Map pin is from stored mineral-interest geography. It is not a street address unless the owner supplied one.',
    url: `https://www.google.com/maps/search/?api=1&q=${encodeURIComponent(`${latitude},${longitude}`)}`,
  };
}

type ParsedLocation = {
  state?: StateDefinition;
  city?: string;
  county?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  plss?: {
    section: number;
    township: number;
    townshipDirection: 'N' | 'S';
    range: number;
    rangeDirection: 'E' | 'W';
  };
  legalDescription?: string;
};

type ResolveOptions = {
  scope?: GeographyScope;
  priorState?: string | null;
  mode?: 'chat' | 'document' | 'profile';
  fetcher?: typeof fetch;
};

function normalizedState(value?: string | null) {
  if (!value) return undefined;
  return stateLookup.get(value.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim());
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const statePattern = [...stateLookup.keys()]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|');
const stateNamePattern = US_STATES.flatMap((state) => [state.name, ...(state.aliases ?? [])])
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|');

function titleCasePlace(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return (normalized === normalized.toUpperCase() ? normalized.toLowerCase() : normalized).replace(
    /\b([a-z])/gi,
    (letter) => letter.toUpperCase(),
  );
}

function detectScope(text: string, fallback: GeographyScope = 'mineral_interest'): GeographyScope {
  if (/\b(i live|i reside|my home|home address|where i live|i am from|i'm from)\b/i.test(text)) {
    return 'residence';
  }
  if (
    /\b(mineral|royalt|oil|gas|lease|well|deed|survey|section|township|range|abstract|property|acre)\b/i.test(
      text,
    )
  ) {
    return 'mineral_interest';
  }
  return fallback;
}

function inputForScope(text: string, scope: GeographyScope) {
  if (scope !== 'residence') return text;
  const match = text.match(
    /\b(?:i live|i reside|where i live|my home(?: address)?(?: is)?|home address(?: is)?|i'm from|i am from)\s*(?:in|at|is)?\s*(.+?)(?=\s+(?:and|but)\s+(?:my\s+)?(?:minerals?|mineral rights?|royalties|property|acreage)\b|[;\n]|$)/i,
  );
  return match?.[1]?.trim() || text;
}

function findState(text: string, priorState?: string | null) {
  const namedMatches = [...text.matchAll(new RegExp(`\\b(${stateNamePattern})\\b`, 'gi'))];
  const uppercaseCodes = [...text.matchAll(/\b([A-Z]{2})\b/g)]
    .map((match) => normalizedState(match[1]))
    .filter(Boolean);
  const trailingCode = text.match(/,\s*([a-z]{2})\s*(?:\d{5}(?:-\d{4})?)?\s*$/i)?.[1];
  return (
    normalizedState(namedMatches.at(-1)?.[1]) ??
    uppercaseCodes.at(-1) ??
    normalizedState(trailingCode) ??
    normalizedState(priorState)
  );
}

function parseCoordinates(text: string) {
  const pair = text.match(
    /(?:latitude\s*[:=]?\s*)?(-?\d{1,3}\.\d{3,})\s*[,;/ ]+\s*(?:longitude\s*[:=]?\s*)?(-?\d{1,3}\.\d{3,})/i,
  );
  if (!pair) return null;
  const first = Number(pair[1]);
  const second = Number(pair[2]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  const [latitude, longitude] =
    Math.abs(first) <= 90 && Math.abs(second) <= 180
      ? [first, second]
      : Math.abs(second) <= 90 && Math.abs(first) <= 180
        ? [second, first]
        : [NaN, NaN];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function parsePlss(text: string) {
  const section = text.match(/\bsec(?:tion)?\.?\s*(\d{1,2})\b/i);
  const township = text.match(/\b(?:t(?:ownship)?\.?\s*)?(\d{1,3})\s*(north|south|n|s)\b/i);
  const range = text.match(/\b(?:r(?:ange)?\.?\s*)?(\d{1,3})\s*(east|west|e|w)\b/i);
  if (!section || !township || !range) return undefined;
  const sectionNumber = Number(section[1]);
  const townshipNumber = Number(township[1]);
  const rangeNumber = Number(range[1]);
  if (sectionNumber < 1 || sectionNumber > 36 || townshipNumber < 1 || rangeNumber < 1)
    return undefined;
  return {
    section: sectionNumber,
    township: townshipNumber,
    townshipDirection: township[2].toUpperCase().startsWith('N') ? ('N' as const) : ('S' as const),
    range: rangeNumber,
    rangeDirection: range[2].toUpperCase().startsWith('E') ? ('E' as const) : ('W' as const),
  };
}

export function parseUSLocationInput(text: string, priorState?: string | null): ParsedLocation {
  const cleaned = text.trim().slice(0, 20_000);
  const detectedState = findState(cleaned, priorState);
  const coordinates = parseCoordinates(cleaned);
  const plss = parsePlss(cleaned);
  const legalDescription =
    /\b(?:abstract|survey|block|lot|section|township|range|metes?\s+and\s+bounds?|parcel|tract)\b/i.test(
      cleaned,
    )
      ? cleaned.slice(0, 8_000)
      : undefined;
  const countyMatch = cleaned.match(
    new RegExp(
      `(?:^|[,;]|\\b(?:in|within|of|at)\\s+)\\s*([A-Za-z][A-Za-z .'-]{1,80}?)\\s+(?:County|Parish|Borough|Census Area|Municipio),?\\s+(${statePattern})\\b`,
      'i',
    ),
  );
  const labeledCountyMatch = cleaned.match(
    /\bCounty\s*[:#-]?\s*([A-Za-z][A-Za-z .'-]{1,80}?)(?=\s{2,}|\s+(?:Operator|API|Property|Well|Owner)\b|[,;\n]|$)/i,
  );
  const addressMatch = cleaned.match(
    new RegExp(
      `(?:^|\\b(?:at|address is|located at)\\s+)(\\d{1,8}\\s+[^\\n]{2,160}?\\b(${statePattern})\\b(?:\\s+\\d{5}(?:-\\d{4})?)?)`,
      'i',
    ),
  );
  const cityMatch =
    cleaned.match(
      new RegExp(
        `\\b(?:live in|reside in|located in|city of|in|from|near)\\s+([A-Za-z][A-Za-z .'-]{1,80}?),?\\s+(${statePattern})\\b`,
        'i',
      ),
    ) ??
    cleaned.match(
      new RegExp(`^([A-Za-z][A-Za-z .'-]{1,80}?)(?:,\\s*|\\s+)(${statePattern})$`, 'i'),
    );
  const state =
    detectedState ??
    normalizedState(countyMatch?.[2]) ??
    normalizedState(addressMatch?.[2]) ??
    normalizedState(cityMatch?.[2]);
  const county = countyMatch?.[1] ?? labeledCountyMatch?.[1]?.replace(/\s+County$/i, '');

  return {
    state,
    ...(coordinates ?? {}),
    ...(plss ? { plss } : {}),
    ...(legalDescription ? { legalDescription } : {}),
    ...(county ? { county: titleCasePlace(county) } : {}),
    ...(addressMatch ? { address: addressMatch[1].trim() } : {}),
    ...(!county && cityMatch ? { city: titleCasePlace(cityMatch[1]) } : {}),
  };
}

function baseResolution(
  input: string,
  scope: GeographyScope,
  queryType: GeographyResolution['queryType'],
  precision: GeographyPrecision,
): GeographyResolution {
  return {
    status: 'not_found',
    scope,
    queryType,
    input,
    city: null,
    nearestCity: null,
    state: null,
    stateCode: null,
    stateFips: null,
    county: null,
    countyFips: null,
    counties: [],
    placeGeoid: null,
    latitude: null,
    longitude: null,
    precision,
    confidence: 0,
    needsConfirmation: true,
    provider: 'US Census Bureau',
    providerVintage: CENSUS_VINTAGE,
    basin: null,
    basinCode: null,
    basins: [],
    oilGasProvince: null,
    oilGasProvinceCode: null,
    basinStatus: scope === 'mineral_interest' ? 'needs_detail' : 'not_found',
    basinConfidence: null,
    basinNeedsConfirmation: scope === 'mineral_interest',
    basinSource: null,
    basinSourceVintage: null,
    basinNote:
      scope === 'mineral_interest'
        ? 'An exact property address, coordinate, or mapped survey section is needed to identify the geologic basin.'
        : null,
  };
}

async function fetchJson(fetcher: typeof fetch, url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_500);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`geography_provider_${response.status}`);
    return (await response.json()) as any;
  } finally {
    clearTimeout(timeout);
  }
}

function pointQueryUrl(url: string, longitude: number, latitude: number, outFields: string) {
  return `${url}?${new URLSearchParams({
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: 'false',
    f: 'json',
  })}`;
}

function basinName(value: unknown) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  const titled =
    normalized === normalized.toUpperCase() ? titleCasePlace(normalized.toLowerCase()) : normalized;
  return /\bbasins?\b/i.test(titled) ? titled : `${titled} Basin`;
}

function fulfilledFeatures(result: PromiseSettledResult<any>) {
  return result.status === 'fulfilled' && Array.isArray(result.value?.features)
    ? result.value.features
    : [];
}

async function attachEnergyBasin(
  resolution: GeographyResolution,
  fetcher: typeof fetch,
): Promise<GeographyResolution> {
  if (
    resolution.scope !== 'mineral_interest' ||
    resolution.latitude == null ||
    resolution.longitude == null ||
    !['address', 'coordinates', 'section'].includes(resolution.precision)
  ) {
    return resolution;
  }

  const point = [resolution.longitude, resolution.latitude] as const;
  const [eiaResult, usgsBasinResult, usgsProvinceResult] = await Promise.allSettled([
    fetchJson(fetcher, pointQueryUrl(EIA_SEDIMENTARY_BASINS, ...point, 'OBJECTID,Name')),
    fetchJson(
      fetcher,
      pointQueryUrl(USGS_SEDIMENTARY_BASINS, ...point, 'OBJECTID,name,basin_num,basintype,source'),
    ),
    fetchJson(
      fetcher,
      pointQueryUrl(USGS_NOGA_PROVINCES, ...point, 'provinceco,provincena,lastupdate,notes'),
    ),
  ]);
  const providerUnavailable = [eiaResult, usgsBasinResult, usgsProvinceResult].every(
    (result) => result.status === 'rejected',
  );
  const matches = new Map<string, BasinMatch>();

  for (const feature of fulfilledFeatures(eiaResult)) {
    const name = basinName(feature.attributes?.Name);
    if (!name) continue;
    matches.set(name.toLowerCase(), {
      name,
      code: feature.attributes?.OBJECTID == null ? null : String(feature.attributes.OBJECTID),
      source: 'U.S. Energy Information Administration',
      basinType: 'sedimentary basin',
    });
  }
  for (const feature of fulfilledFeatures(usgsBasinResult)) {
    const name = basinName(feature.attributes?.name);
    if (!name || matches.has(name.toLowerCase())) continue;
    matches.set(name.toLowerCase(), {
      name,
      code: feature.attributes?.basin_num == null ? null : String(feature.attributes.basin_num),
      source: 'U.S. Geological Survey',
      basinType: feature.attributes?.basintype ? String(feature.attributes.basintype) : null,
    });
  }

  const basinMatches = [...matches.values()];
  const provinceFeature = fulfilledFeatures(usgsProvinceResult)[0];
  const oilGasProvince = basinName(provinceFeature?.attributes?.provincena);
  const primary =
    basinMatches[0] ??
    (oilGasProvince
      ? {
          name: oilGasProvince,
          code:
            provinceFeature?.attributes?.provinceco == null
              ? null
              : String(provinceFeature.attributes.provinceco),
          source: 'U.S. Geological Survey' as const,
          basinType: 'oil and gas assessment province',
        }
      : null);
  const sourceVintage =
    primary?.source === 'U.S. Energy Information Administration'
      ? EIA_BASIN_VINTAGE
      : primary
        ? USGS_NOGA_VINTAGE
        : null;
  const isSectionCenter = resolution.queryType === 'plss';

  return {
    ...resolution,
    basin: primary?.name ?? null,
    basinCode: primary?.code ?? null,
    basins: basinMatches,
    oilGasProvince,
    oilGasProvinceCode:
      provinceFeature?.attributes?.provinceco == null
        ? null
        : String(provinceFeature.attributes.provinceco),
    basinStatus: primary ? 'resolved' : providerUnavailable ? 'unavailable' : 'not_found',
    basinConfidence: primary ? (isSectionCenter ? 0.88 : 0.97) : null,
    basinNeedsConfirmation: isSectionCenter,
    basinSource: primary?.source ?? null,
    basinSourceVintage: sourceVintage,
    basinNote: primary
      ? isSectionCenter
        ? 'The basin is mapped from the survey section center and should be confirmed against the recorded tract boundary.'
        : 'The basin is geologic map context. The county and state remain the legal recording jurisdiction.'
      : providerUnavailable
        ? 'The energy basin map services were temporarily unavailable. County and state geography was still resolved.'
        : 'No basin polygon in the available national energy layers contained this property point.',
  };
}

function censusParams(extra: Record<string, string>) {
  return new URLSearchParams({
    benchmark: CENSUS_BENCHMARK,
    vintage: CENSUS_VINTAGE,
    layers: '80,82,28,30',
    format: 'json',
    ...extra,
  });
}

function firstGeography(geographies: Record<string, any[]> | undefined, names: string[]) {
  for (const name of names) {
    const value = geographies?.[name]?.[0];
    if (value) return value;
  }
  return undefined;
}

function censusResolution(args: {
  input: string;
  scope: GeographyScope;
  queryType: 'address' | 'coordinates' | 'plss';
  precision: 'address' | 'coordinates' | 'section';
  geographies?: Record<string, any[]>;
  latitude: number;
  longitude: number;
  matchedAddress?: string | null;
  legalDescription?: string | null;
  plssId?: string | null;
}): GeographyResolution {
  const state = firstGeography(args.geographies, ['States']);
  const county = firstGeography(args.geographies, ['Counties']);
  const place = firstGeography(args.geographies, [
    'Incorporated Places',
    'Census Designated Places',
  ]);
  const resolved = Boolean(state && county);
  return {
    ...baseResolution(args.input, args.scope, args.queryType, args.precision),
    status: resolved ? 'resolved' : 'needs_detail',
    city: place?.BASENAME ?? null,
    nearestCity: null,
    state: state?.BASENAME ?? state?.NAME ?? null,
    stateCode: state?.STUSAB ?? null,
    stateFips: state?.STATE ?? state?.GEOID ?? null,
    county:
      county?.BASENAME ??
      county?.NAME?.replace(/\s+(County|Parish|Borough|Municipio)$/i, '') ??
      null,
    countyFips: county?.GEOID ?? null,
    counties: county ? [{ name: county.BASENAME ?? county.NAME, fips: county.GEOID }] : [],
    placeGeoid: place?.GEOID ?? null,
    latitude: args.latitude,
    longitude: args.longitude,
    confidence: resolved
      ? args.queryType === 'address'
        ? 0.98
        : args.queryType === 'plss'
          ? 0.9
          : 0.99
      : 0.55,
    needsConfirmation: args.queryType === 'plss' || !resolved,
    provider: args.queryType === 'plss' ? 'BLM PLSS and US Census Bureau' : 'US Census Bureau',
    matchedAddress: args.matchedAddress ?? null,
    legalDescription: args.legalDescription ?? null,
    plssId: args.plssId ?? null,
    note: place
      ? null
      : 'The point is outside a Census-recognized incorporated or designated place.',
  };
}

async function resolveCoordinates(
  input: string,
  latitude: number,
  longitude: number,
  scope: GeographyScope,
  fetcher: typeof fetch,
  queryType: 'coordinates' | 'plss' = 'coordinates',
  extra: { legalDescription?: string; plssId?: string } = {},
) {
  const params = censusParams({ x: String(longitude), y: String(latitude) });
  const data = await fetchJson(fetcher, `${CENSUS_GEOCODER}/coordinates?${params}`);
  return attachEnergyBasin(
    censusResolution({
      input,
      scope,
      queryType,
      precision: queryType === 'plss' ? 'section' : 'coordinates',
      geographies: data.result?.geographies,
      latitude,
      longitude,
      ...extra,
    }),
    fetcher,
  );
}

async function resolveAddress(
  input: string,
  address: string,
  scope: GeographyScope,
  fetcher: typeof fetch,
) {
  const params = censusParams({ address });
  const data = await fetchJson(fetcher, `${CENSUS_GEOCODER}/onelineaddress?${params}`);
  const matches = data.result?.addressMatches ?? [];
  if (matches.length !== 1) {
    return {
      ...baseResolution(input, scope, 'address', 'address'),
      status: matches.length > 1 ? ('ambiguous' as const) : ('not_found' as const),
      note:
        matches.length > 1
          ? 'More than one Census address matched.'
          : 'The Census address service did not return a match.',
    };
  }
  const match = matches[0];
  return attachEnergyBasin(
    censusResolution({
      input,
      scope,
      queryType: 'address',
      precision: 'address',
      geographies: match.geographies,
      latitude: Number(match.coordinates?.y),
      longitude: Number(match.coordinates?.x),
      matchedAddress: match.matchedAddress,
    }),
    fetcher,
  );
}

function tigerQueryUrl(layer: number, params: Record<string, string>) {
  return `${TIGER_CURRENT}/${layer}/query?${new URLSearchParams({ ...params, f: 'json' })}`;
}

async function resolveCountyState(
  input: string,
  countyName: string,
  state: StateDefinition,
  scope: GeographyScope,
  fetcher: typeof fetch,
) {
  const safeCounty = countyName.replace(/'/g, "''");
  const data = await fetchJson(
    fetcher,
    tigerQueryUrl(82, {
      where: `UPPER(BASENAME)='${safeCounty.toUpperCase()}' AND STATE='${state.fips}'`,
      outFields: 'GEOID,STATE,COUNTY,BASENAME,NAME,INTPTLAT,INTPTLON',
      returnGeometry: 'false',
    }),
  );
  const matches = data.features ?? [];
  if (matches.length !== 1) {
    return {
      ...baseResolution(input, scope, 'county_state', 'county'),
      status: matches.length > 1 ? ('ambiguous' as const) : ('not_found' as const),
      state: state.name,
      stateCode: state.code,
      stateFips: state.fips,
    };
  }
  const county = matches[0].attributes;
  return {
    ...baseResolution(input, scope, 'county_state', 'county'),
    status: 'resolved' as const,
    state: state.name,
    stateCode: state.code,
    stateFips: state.fips,
    county: county.BASENAME,
    countyFips: county.GEOID,
    counties: [{ name: county.BASENAME, fips: county.GEOID }],
    latitude: Number(county.INTPTLAT),
    longitude: Number(county.INTPTLON),
    confidence: 0.98,
    needsConfirmation: false,
  };
}

async function countiesIntersectingGeometry(fetcher: typeof fetch, geometry: unknown) {
  const body = new URLSearchParams({
    where: '1=1',
    geometry: JSON.stringify(geometry),
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'GEOID,STATE,COUNTY,BASENAME,NAME',
    returnGeometry: 'false',
    f: 'json',
  });
  const data = await fetchJson(fetcher, `${TIGER_CURRENT}/82/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return (data.features ?? []).map((feature: any) => ({
    name: feature.attributes.BASENAME as string,
    fips: feature.attributes.GEOID as string,
  })) as CountyMatch[];
}

async function resolveCityState(
  input: string,
  city: string,
  state: StateDefinition,
  scope: GeographyScope,
  fetcher: typeof fetch,
) {
  const safeCity = city.replace(/'/g, "''");
  const query = {
    where: `UPPER(BASENAME)='${safeCity.toUpperCase()}' AND STATE='${state.fips}'`,
    outFields: 'GEOID,STATE,PLACE,BASENAME,NAME,INTPTLAT,INTPTLON',
    returnGeometry: 'true',
    outSR: '4326',
    geometryPrecision: '4',
    maxAllowableOffset: '0.005',
  };
  const [incorporated, designated] = await Promise.all([
    fetchJson(fetcher, tigerQueryUrl(28, query)),
    fetchJson(fetcher, tigerQueryUrl(30, query)),
  ]);
  const matches = [...(incorporated.features ?? []), ...(designated.features ?? [])];
  if (matches.length !== 1) {
    return {
      ...baseResolution(input, scope, 'city_state', 'city'),
      status: matches.length > 1 ? ('ambiguous' as const) : ('not_found' as const),
      city,
      state: state.name,
      stateCode: state.code,
      stateFips: state.fips,
      note:
        matches.length > 1
          ? 'More than one Census place matched this city and state.'
          : 'No incorporated or Census-designated place matched this city and state.',
    };
  }
  const match = matches[0];
  const counties = await countiesIntersectingGeometry(fetcher, match.geometry);
  const latitude = Number(match.attributes.INTPTLAT);
  const longitude = Number(match.attributes.INTPTLON);
  let primaryCounty = counties[0];
  if (counties.length > 1) {
    try {
      const point = await resolveCoordinates(input, latitude, longitude, scope, fetcher);
      primaryCounty = counties.find((county) => county.fips === point.countyFips) ?? primaryCounty;
    } catch {
      // The complete county list is still useful if the interior-point lookup is unavailable.
    }
  }
  return {
    ...baseResolution(input, scope, 'city_state', 'city'),
    status: counties.length > 1 ? ('ambiguous' as const) : ('resolved' as const),
    city: match.attributes.BASENAME,
    state: state.name,
    stateCode: state.code,
    stateFips: state.fips,
    county: primaryCounty?.name ?? null,
    countyFips: primaryCounty?.fips ?? null,
    counties,
    placeGeoid: match.attributes.GEOID,
    latitude,
    longitude,
    confidence: counties.length === 1 ? 0.95 : 0.8,
    needsConfirmation: counties.length !== 1,
    note:
      counties.length > 1
        ? `${match.attributes.BASENAME} crosses ${counties.length} county boundaries; an exact address or coordinate is required to choose one.`
        : null,
  };
}

function geometryCenter(geometry: { rings?: number[][][] }) {
  const points = geometry.rings?.flat() ?? [];
  if (!points.length) return null;
  const longitudes = points.map((point) => point[0]).filter(Number.isFinite);
  const latitudes = points.map((point) => point[1]).filter(Number.isFinite);
  if (!longitudes.length || !latitudes.length) return null;
  return {
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  };
}

async function resolvePlss(
  input: string,
  parsed: ParsedLocation,
  state: StateDefinition,
  scope: GeographyScope,
  fetcher: typeof fetch,
) {
  const plss = parsed.plss!;
  const township = `${String(plss.township).padStart(3, '0')}0${plss.townshipDirection}`;
  const range = `${String(plss.range).padStart(3, '0')}0${plss.rangeDirection}`;
  const where = `FRSTDIVNO='${plss.section}' AND PLSSID LIKE '${state.code}%${township}${range}%'`;
  const params = new URLSearchParams({
    where,
    outFields: 'PLSSID,FRSTDIVID,FRSTDIVNO,FRSTDIVLAB',
    returnGeometry: 'true',
    outSR: '4326',
    geometryPrecision: '6',
    maxAllowableOffset: '0.001',
    f: 'json',
  });
  const data = await fetchJson(fetcher, `${BLM_PLSS}?${params}`);
  const features = data.features ?? [];
  if (features.length !== 1) {
    return {
      ...baseResolution(input, scope, 'plss', 'section'),
      status: features.length > 1 ? ('ambiguous' as const) : ('needs_detail' as const),
      state: state.name,
      stateCode: state.code,
      stateFips: state.fips,
      confidence: features.length > 1 ? 0.6 : 0.35,
      provider: 'BLM PLSS and US Census Bureau' as const,
      legalDescription: parsed.legalDescription ?? input,
      note:
        features.length > 1
          ? 'The section-township-range combination matched more than one principal meridian.'
          : 'BLM did not return a national PLSS section match. A county, principal meridian, recorded address, or parcel reference is needed.',
    };
  }
  const center = geometryCenter(features[0].geometry);
  if (!center) {
    return {
      ...baseResolution(input, scope, 'plss', 'section'),
      status: 'needs_detail' as const,
      state: state.name,
      stateCode: state.code,
      stateFips: state.fips,
      provider: 'BLM PLSS and US Census Bureau' as const,
      legalDescription: parsed.legalDescription ?? input,
      note: 'BLM returned the survey record without usable map geometry.',
    };
  }
  return resolveCoordinates(input, center.latitude, center.longitude, scope, fetcher, 'plss', {
    legalDescription: parsed.legalDescription ?? input,
    plssId: features[0].attributes.PLSSID,
  });
}

export async function resolveUSGeography(text: string, options: ResolveOptions = {}) {
  const input = text.trim().slice(0, 20_000);
  if (!input) return null;
  const fetcher = options.fetcher ?? fetch;
  const scope = options.scope ?? detectScope(input);
  const parsed = parseUSLocationInput(inputForScope(input, scope), options.priorState);
  const hasLocationIntent =
    options.mode === 'profile' ||
    /\b(?:live|reside|located|location|address|county|city|near|property|minerals?|rights?|lease|well|deed|survey|section|township|range|parcel|acres?)\b/i.test(
      input,
    );
  try {
    if (parsed.latitude != null && parsed.longitude != null) {
      return await resolveCoordinates(input, parsed.latitude, parsed.longitude, scope, fetcher);
    }
    if (parsed.plss && parsed.state) {
      const plss = await resolvePlss(input, parsed, parsed.state, scope, fetcher);
      if (plss.status !== 'needs_detail' || !parsed.county) return plss;
    }
    if (parsed.address) return await resolveAddress(input, parsed.address, scope, fetcher);
    if (parsed.county && parsed.state) {
      const county = await resolveCountyState(input, parsed.county, parsed.state, scope, fetcher);
      return parsed.plss
        ? {
            ...county,
            queryType: 'plss' as const,
            precision: 'county' as const,
            legalDescription: parsed.legalDescription ?? input,
            needsConfirmation: true,
            confidence: Math.min(county.confidence, 0.75),
          }
        : { ...county, legalDescription: parsed.legalDescription ?? null };
    }
    if (parsed.city && parsed.state && options.mode !== 'document') {
      return await resolveCityState(input, parsed.city, parsed.state, scope, fetcher);
    }
    if (parsed.plss || (parsed.state && hasLocationIntent)) {
      return {
        ...baseResolution(
          input,
          scope,
          parsed.plss ? 'plss' : 'city_state',
          parsed.plss ? 'section' : 'city',
        ),
        status: 'needs_detail' as const,
        state: parsed.state?.name ?? null,
        stateCode: parsed.state?.code ?? null,
        stateFips: parsed.state?.fips ?? null,
        legalDescription: parsed.legalDescription ?? null,
        provider: parsed.plss
          ? ('BLM PLSS and US Census Bureau' as const)
          : ('US Census Bureau' as const),
        note: parsed.plss
          ? 'The legal description needs a state, county, or principal meridian before MRX can place it reliably.'
          : 'A city, county, street address, ZIP code, or coordinate is needed to identify the county.',
      };
    }
    return null;
  } catch (error) {
    console.error('[US geography resolution]', error instanceof Error ? error.message : 'failed');
    return null;
  }
}

export function publicGeography(resolution: GeographyResolution) {
  return {
    status: resolution.status,
    scope: resolution.scope,
    queryType: resolution.queryType,
    city: resolution.city,
    state: resolution.state,
    stateCode: resolution.stateCode,
    county: resolution.county,
    counties: resolution.counties,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    precision: resolution.precision,
    confidence: resolution.confidence,
    needsConfirmation: resolution.needsConfirmation,
    basin: resolution.basin,
    basinCode: resolution.basinCode,
    basins: resolution.basins,
    oilGasProvince: resolution.oilGasProvince,
    oilGasProvinceCode: resolution.oilGasProvinceCode,
    basinStatus: resolution.basinStatus,
    basinConfidence: resolution.basinConfidence,
    basinNeedsConfirmation: resolution.basinNeedsConfirmation,
    basinSource: resolution.basinSource,
    basinSourceVintage: resolution.basinSourceVintage,
    basinNote: resolution.basinNote,
    note: resolution.note,
  };
}

export async function persistGeographyResolution(args: {
  conversationId: string;
  profileId: string;
  resolution: GeographyResolution;
  sourceMessageId?: string | null;
  sourceAttachmentId?: string | null;
  createNewMineralInterest?: boolean;
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return { persisted: false, interestId: null as string | null };
  const resolution = args.resolution;
  let interestId: string | null = null;

  if (resolution.scope === 'residence') {
    const { error } = await supabase
      .from('profiles')
      .update({
        residence_city: resolution.city,
        residence_state: resolution.state,
        residence_state_code: resolution.stateCode,
        residence_state_fips: resolution.stateFips,
        residence_county: resolution.status === 'resolved' ? resolution.county : null,
        residence_county_fips: resolution.status === 'resolved' ? resolution.countyFips : null,
        residence_place_geoid: resolution.placeGeoid,
        residence_latitude: resolution.latitude,
        residence_longitude: resolution.longitude,
        residence_geography_status: resolution.status,
        residence_geography_updated_at: new Date().toISOString(),
      })
      .eq('id', args.profileId);
    if (error) throw error;
  } else {
    const interestFilters = [
      resolution.countyFips ? `county_fips.eq.${resolution.countyFips}` : '',
      resolution.plssId ? `plss_id.eq.${resolution.plssId}` : '',
      resolution.placeGeoid ? `place_geoid.eq.${resolution.placeGeoid}` : '',
    ].filter(Boolean);
    const existingResult =
      !args.createNewMineralInterest && interestFilters.length
        ? await supabase
            .from('mineral_interests')
            .select('id')
            .eq('profile_id', args.profileId)
            .eq('status', 'active')
            .or(interestFilters.join(','))
            .limit(1)
            .maybeSingle()
        : { data: null };
    const existing = existingResult.data;
    const values = {
      profile_id: args.profileId,
      conversation_id: args.conversationId,
      label:
        [
          resolution.city,
          resolution.status !== 'ambiguous' && resolution.county && `${resolution.county} County`,
          resolution.stateCode,
        ]
          .filter(Boolean)
          .join(', ') || 'Mineral interest',
      city: resolution.city,
      state: resolution.state,
      state_code: resolution.stateCode,
      county: resolution.status === 'ambiguous' ? null : resolution.county,
      county_fips: resolution.status === 'ambiguous' ? null : resolution.countyFips,
      place_geoid: resolution.placeGeoid,
      latitude: resolution.latitude,
      longitude: resolution.longitude,
      legal_description: resolution.legalDescription,
      plss_id: resolution.plssId,
      location_precision: resolution.precision,
      geography_source: resolution.provider,
      geography_status: resolution.status,
      geography_confidence: resolution.confidence,
      geography_resolved_at: new Date().toISOString(),
      basin_name: resolution.basin,
      basin_code: resolution.basinCode,
      basin_matches: resolution.basins,
      oil_gas_province: resolution.oilGasProvince,
      oil_gas_province_code: resolution.oilGasProvinceCode,
      basin_status: resolution.basinStatus,
      basin_confidence: resolution.basinConfidence,
      basin_needs_confirmation: resolution.basinNeedsConfirmation,
      basin_source: resolution.basinSource,
      basin_source_vintage: resolution.basinSourceVintage,
      basin_resolved_at: resolution.basinStatus === 'resolved' ? new Date().toISOString() : null,
    };
    const result = existing
      ? await supabase
          .from('mineral_interests')
          .update(values)
          .eq('id', existing.id)
          .select('id')
          .single()
      : await supabase.from('mineral_interests').insert(values).select('id').single();
    if (result.error) throw result.error;
    interestId = result.data.id as string;
  }

  const { error: logError } = await supabase.from('geography_resolutions').insert({
    profile_id: args.profileId,
    conversation_id: args.conversationId,
    mineral_interest_id: interestId,
    source_message_id: args.sourceMessageId ?? null,
    source_attachment_id: args.sourceAttachmentId ?? null,
    scope: resolution.scope,
    query_type: resolution.queryType,
    input_text: resolution.input.slice(0, 8_000),
    status: resolution.status,
    city: resolution.city,
    state: resolution.state,
    state_code: resolution.stateCode,
    state_fips: resolution.stateFips,
    county: resolution.county,
    county_fips: resolution.countyFips,
    county_candidates: resolution.counties,
    place_geoid: resolution.placeGeoid,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    precision: resolution.precision,
    confidence: resolution.confidence,
    needs_confirmation: resolution.needsConfirmation,
    provider: resolution.provider,
    provider_vintage: resolution.providerVintage,
    basin_name: resolution.basin,
    basin_code: resolution.basinCode,
    basin_matches: resolution.basins,
    oil_gas_province: resolution.oilGasProvince,
    oil_gas_province_code: resolution.oilGasProvinceCode,
    basin_status: resolution.basinStatus,
    basin_confidence: resolution.basinConfidence,
    basin_needs_confirmation: resolution.basinNeedsConfirmation,
    basin_source: resolution.basinSource,
    basin_source_vintage: resolution.basinSourceVintage,
    metadata: {
      matchedAddress: resolution.matchedAddress ?? null,
      plssId: resolution.plssId ?? null,
      note: resolution.note ?? null,
      basinNote: resolution.basinNote ?? null,
    },
  });
  if (logError) throw logError;
  return { persisted: true, interestId };
}
