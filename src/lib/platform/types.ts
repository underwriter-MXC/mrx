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
  };
  disclosureVersion: string;
  sourceUrl: string;
}

export interface AppointmentOption {
  id: string;
  start: string;
  end: string;
  label: string;
  timezone: string;
}

export type StreamEvent =
  | { type: 'message.delta'; delta: string; persona: PersonaSlug }
  | { type: 'citation'; citation: KnowledgeCitation }
  | { type: 'persona.handoff'; from: PersonaSlug; to: PersonaSlug; reason: string }
  | { type: 'profile.request'; fields: string[]; reason: string }
  | { type: 'availability.options'; options: AppointmentOption[] }
  | { type: 'appointment.confirmed'; appointmentId: string; start: string; timezone: string }
  | { type: 'done'; responseId?: string }
  | { type: 'error'; code: string; message: string };
