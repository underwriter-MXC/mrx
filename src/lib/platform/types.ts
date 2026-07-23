export type PersonaSlug = 'tommy' | 'cooper' | 'charlie' | 'dale' | 'rebecca' | 'angela';

export interface KnowledgeCitation {
  id: string;
  title: string;
  url: string;
  excerpt: string;
}

export interface ChatRequest {
  message: string;
  path?: string;
  conversationId?: string;
  context?: {
    firstName?: string;
    location?: string;
    currentPersona?: PersonaSlug;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ContactProfile {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  location?: string;
  permissions: {
    email: boolean;
    sms: boolean;
    marketingSms: boolean;
    call: boolean;
    aiVoice: boolean;
  };
  disclosureVersion: string;
  sourceUrl: string;
  ownerMetadata?: {
    state?: string;
    county?: string;
    city?: string;
    stateCode?: string;
    countyFips?: string;
    geographyStatus?: string;
    locationPrecision?: string;
    legalDescription?: string;
    plssId?: string;
    residenceCity?: string;
    residenceState?: string;
    residenceCounty?: string;
    operator?: string;
    situation?: string;
    offerStatus?: string;
    documentStatus?: string;
    documentsNeeded?: string;
    underwritingReadiness?: string;
    appointment?: string;
    sanitizedSummary?: string;
    ownershipType?: string;
    netMineralAcres?: string;
    royaltyDecimal?: string;
    leaseName?: string;
    wellNames?: string;
    offerAmount?: string;
    royaltyAmount?: string;
    royaltyFrequency?: string;
    numberOfInterests?: string;
    primaryOperator?: string;
    interestType?: string;
    operatorTier?: string;
    developmentStatus?: string;
    basinRegion?: string;
    rrcLeaseNumber?: string;
    competingOfferReceived?: string;
    competingOfferAmount?: string;
    appointmentStatus?: string;
    bookedBy?: string;
    consentVersion?: string;
    phoneVerified?: string;
    is1031Interest?: string;
    fullConversationSynced?: string;
    isTest?: boolean;
    testRunId?: string;
    sourceUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    leadSourceTag?: string;
  };
}

export interface AppointmentOption {
  id: string;
  start: string;
  end: string;
  label: string;
  timezone: string;
}

export interface ResolvedGeographyEvent {
  status: 'resolved' | 'ambiguous' | 'needs_detail' | 'not_found';
  scope: 'residence' | 'mineral_interest';
  queryType: 'address' | 'coordinates' | 'plss' | 'city_state' | 'county_state';
  city: string | null;
  state: string | null;
  stateCode: string | null;
  county: string | null;
  counties: Array<{ name: string; fips: string }>;
  latitude: number | null;
  longitude: number | null;
  precision: 'address' | 'coordinates' | 'section' | 'city' | 'county';
  confidence: number;
  needsConfirmation: boolean;
  basin: string | null;
  basinCode: string | null;
  basins: Array<{
    name: string;
    code: string | null;
    source: 'U.S. Energy Information Administration' | 'U.S. Geological Survey';
    basinType: string | null;
  }>;
  oilGasProvince: string | null;
  oilGasProvinceCode: string | null;
  basinStatus: 'resolved' | 'needs_detail' | 'not_found' | 'unavailable';
  basinConfidence: number | null;
  basinNeedsConfirmation: boolean;
  basinSource: string | null;
  basinSourceVintage: string | null;
  basinNote: string | null;
  note?: string | null;
}

export type StreamEvent =
  | { type: 'message.delta'; delta: string; persona: PersonaSlug }
  | { type: 'message.replace'; content: string; persona: PersonaSlug }
  | { type: 'citation'; citation: KnowledgeCitation }
  | { type: 'persona.handoff'; from: PersonaSlug; to: PersonaSlug; reason: string; message: string }
  | { type: 'profile.request'; fields: string[]; reason: string }
  | { type: 'geography.resolved'; geography: ResolvedGeographyEvent }
  | {
      type: 'location.card';
      card: {
        label: string;
        url: string;
        latitude: number;
        longitude: number;
        precision: string;
        confidence: number | null;
        source: string;
        basin?: string | null;
        note?: string | null;
      };
    }
  | { type: 'availability.options'; options: AppointmentOption[] }
  | { type: 'appointment.confirmed'; appointmentId: string; start: string; timezone: string }
  | { type: 'done'; responseId?: string }
  | { type: 'error'; code: string; message: string };
