import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getGuide, getGuideChatLabel } from '../../data/guides';
import './AskTommy.css';

type Persona = 'tommy' | 'cooper' | 'charlie' | 'dale' | 'rebecca' | 'angela';
type Citation = { id: string; title: string; url: string; excerpt: string };
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  persona?: Persona;
  citations?: Citation[];
};
type AppointmentOption = {
  id: string;
  start: string;
  end: string;
  label: string;
  timezone: string;
};
type BookedAppointment = AppointmentOption & {
  appointmentId: string;
  savedAt: string;
};
type DeliveryChannel = 'email' | 'sms';
type ConversationStep =
  | 'loading'
  | 'intro-name'
  | 'intro-location'
  | 'open'
  | 'delivery-channel'
  | 'delivery-email'
  | 'delivery-phone'
  | 'delivery-consent'
  | 'booking-timezone'
  | 'booking-window'
  | 'booking-slots'
  | 'booking-name'
  | 'booking-email'
  | 'booking-phone'
  | 'booking-call-consent'
  | 'booking-email-consent'
  | 'booking-sms-consent'
  | 'booking-help';

type ProfileDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  permissions: { email: boolean; sms: boolean; marketingSms: boolean; call: boolean };
};

interface Props {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  hideLauncher?: boolean;
}

const personaLabels: Record<Persona, string> = {
  tommy: 'Tommy',
  cooper: 'Cooper',
  charlie: 'Charlie',
  dale: 'Dale',
  rebecca: 'Rebecca',
  angela: 'Angela',
};

const personaRole = (persona: Persona) => getGuide(persona)?.chatRole ?? 'MRX Guide';

const tommyAvatar = '/assets/mrx-homepage-v4/avatars/tommy-hermes-128.webp';
const bookedAppointmentStorageKey = 'mrx_upcoming_appointment';
const personaAvatar = (persona: Persona = 'tommy') =>
  persona === 'tommy' ? tommyAvatar : `/assets/team/${persona}-128.webp`;

const starters = [
  [
    'I received an offer',
    'I received an offer for my mineral rights. What should I check before I respond?',
  ],
  ['What affects value?', 'What factors may affect what my mineral rights are worth?'],
  ['I inherited minerals', 'I inherited mineral rights and do not know what to do first.'],
  [
    'Should I sell or wait?',
    'I receive royalties. How can I think through selling now versus waiting?',
  ],
];

const initialProfile = (): ProfileDraft => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
  permissions: { email: false, sms: false, marketingSms: false, call: false },
});

const bookingTimezones = [
  { label: 'Eastern', value: 'America/New_York' },
  { label: 'Central', value: 'America/Chicago' },
  { label: 'Mountain', value: 'America/Denver' },
  { label: 'Pacific', value: 'America/Los_Angeles' },
];

function timezoneLabel(timezone: string) {
  const known = [
    ...bookingTimezones,
    { label: 'Arizona', value: 'America/Phoenix' },
    { label: 'Alaska', value: 'America/Anchorage' },
    { label: 'Hawaii', value: 'Pacific/Honolulu' },
  ].find((item) => item.value === timezone);
  return known ? `${known.label} Time` : timezone.replaceAll('_', ' ');
}

function timezoneFromText(value: string) {
  const lower = value.trim().toLowerCase();
  const aliases: Array<[RegExp, string]> = [
    [/\b(eastern|east|est|edt)\b/, 'America/New_York'],
    [/\b(central|cst|cdt)\b/, 'America/Chicago'],
    [/\b(mountain|mst|mdt)\b/, 'America/Denver'],
    [/\b(arizona)\b/, 'America/Phoenix'],
    [/\b(pacific|west|pst|pdt)\b/, 'America/Los_Angeles'],
    [/\b(alaska|akst|akdt)\b/, 'America/Anchorage'],
    [/\b(hawaii|hst)\b/, 'Pacific/Honolulu'],
  ];
  const match = aliases.find(([pattern]) => pattern.test(lower));
  if (match) return match[1];
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return null;
  }
}

function track(event: string, detail: Record<string, unknown> = {}) {
  const push = (window as any).__mrxPush;
  if (typeof push === 'function') push({ event, ...detail });
}

function isSkip(value: string) {
  return /^(skip|pass|not now|rather not|i'?m not sure|don'?t know|no email)$/i.test(value.trim());
}

function isYes(value: string) {
  return /^(yes|y|okay|ok|sure|please do|that'?s fine|send it)$/i.test(value.trim());
}

function firstNameFrom(value: string) {
  const cleaned = value
    .trim()
    .replace(/^(hi,?\s*)/i, '')
    .replace(/^(my name is|i am|i'm|it is|it'?s|call me)\s+/i, '')
    .replace(/[^a-zA-ZÀ-ÿ' -]/g, '')
    .trim();
  const first = cleaned.split(/\s+/)[0] || '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
}

function absoluteLink(citation: Citation | undefined) {
  return citation
    ? new URL(citation.url, window.location.origin).toString()
    : new URL('/learning-center/', window.location.origin).toString();
}

function restoreBookedAppointment(): BookedAppointment | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(bookedAppointmentStorageKey);
    if (!stored) return null;
    const appointment = JSON.parse(stored) as Partial<BookedAppointment>;
    const expiry = Date.parse(appointment.end || appointment.start || '');
    if (
      !appointment.appointmentId ||
      !appointment.id ||
      !appointment.start ||
      !appointment.end ||
      !appointment.label ||
      !appointment.timezone ||
      !appointment.savedAt ||
      !Number.isFinite(expiry) ||
      expiry <= Date.now()
    ) {
      window.localStorage.removeItem(bookedAppointmentStorageKey);
      return null;
    }
    return appointment as BookedAppointment;
  } catch {
    window.localStorage.removeItem(bookedAppointmentStorageKey);
    return null;
  }
}

class ChatErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Ask Tommy interface]', error.message, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <button className="tommy-fab" type="button" onClick={() => window.location.reload()}>
          <img src={tommyAvatar} alt="" />
          <span>
            <strong>Ask Tommy</strong>
            <small>Refresh to reconnect</small>
          </span>
        </button>
      );
    return this.props.children;
  }
}

function AskTommyApp({ supabaseUrl, supabaseAnonKey, hideLauncher = false }: Props) {
  const [open, setOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ConversationStep>('loading');
  const [profile, setProfile] = useState<ProfileDraft>(initialProfile);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingPersona, setTypingPersona] = useState<Persona | null>(null);
  const [notice, setNotice] = useState('');
  const [activePersona, setActivePersona] = useState<Persona>('tommy');
  const [lastAnswer, setLastAnswer] = useState<Message | null>(null);
  const [deliveryAnswer, setDeliveryAnswer] = useState<Message | null>(null);
  const [deliveryRequested, setDeliveryRequested] = useState<DeliveryChannel[]>([]);
  const [deliveryGranted, setDeliveryGranted] = useState<DeliveryChannel[]>([]);
  const [deliveryConsentIndex, setDeliveryConsentIndex] = useState(0);
  const [options, setOptions] = useState<AppointmentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<AppointmentOption | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<BookedAppointment | null>(null);
  const [booking, setBooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [bookingRequested, setBookingRequested] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const introStarted = useRef(false);
  const supabase = useMemo<SupabaseClient | null>(
    () => (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null),
    [supabaseUrl, supabaseAnonKey],
  );

  function addUserMessage(content: string) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content }]);
  }

  async function guideSay(content: string, persona: Persona = activePersona, delay = 460) {
    setTypingPersona(persona);
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'assistant', content, persona },
    ]);
    setTypingPersona(null);
  }

  async function saveIntroFact(fact: { firstName?: string; location?: string }) {
    try {
      await fetch('/api/chat/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fact),
      });
    } catch {
      // The live conversation remains useful when persistence is unavailable.
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const restoredAppointment = restoreBookedAppointment();
        if (!cancelled && restoredAppointment) setBookedAppointment(restoredAppointment);
        await fetch('/api/chat/session', { method: 'POST' });
        const response = await fetch('/api/chat/session');
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const restored: Message[] = Array.isArray(data.messages)
          ? data.messages.map((message: any) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              persona: message.persona,
              citations: message.citations,
            }))
          : [];
        setMessages(restored);
        const restoredAnswer = [...restored]
          .reverse()
          .find((message) => message.role === 'assistant' && message.content);
        if (restoredAnswer) setLastAnswer(restoredAnswer);
        setProfile((current) => ({
          ...current,
          firstName: data.profile?.first_name || current.firstName,
          lastName: data.profile?.last_name || current.lastName,
          email: data.profile?.email || current.email,
          phone: data.profile?.phone || current.phone,
          timezone: data.profile?.timezone || current.timezone,
          location:
            typeof data.ownerFacts?.location === 'string'
              ? data.ownerFacts.location
              : current.location,
        }));
        if (restored.length) {
          introStarted.current = true;
          setStep('open');
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string; booking?: boolean }>).detail;
      setOpen(true);
      if (detail?.prompt) setPendingPrompt(detail.prompt);
      if (detail?.booking) setBookingRequested(true);
      track('ask_tommy_open', { source: detail?.prompt ? 'prefilled_prompt' : 'site_cta' });
    };
    window.addEventListener('mrx:open-chat', listener);
    const params = new URLSearchParams(window.location.search);
    if (params.get('ask') === '1') setOpen(true);
    if (params.get('book') === '1') {
      setOpen(true);
      setBookingRequested(true);
    }
    return () => {
      cancelled = true;
      window.removeEventListener('mrx:open-chat', listener);
    };
  }, []);

  useEffect(() => {
    if (
      !open ||
      !sessionReady ||
      messages.length ||
      introStarted.current ||
      pendingPrompt ||
      bookingRequested
    )
      return;
    introStarted.current = true;
    setStep('intro-name');
    void guideSay(
      'Hi, I’m Tommy. I’m here to help you make sense of your mineral rights without another sales pitch. Before we get into it, what should I call you?',
      'tommy',
      520,
    );
  }, [open, sessionReady, messages.length, pendingPrompt, bookingRequested]);

  useEffect(() => {
    if (!open || !sessionReady || !pendingPrompt) return;
    const prompt = pendingPrompt;
    setPendingPrompt('');
    introStarted.current = true;
    setStep('open');
    void sendMessage(prompt);
  }, [open, sessionReady, pendingPrompt]);

  useEffect(() => {
    if (!open || !sessionReady || !bookingRequested) return;
    setBookingRequested(false);
    introStarted.current = true;
    void beginBooking();
  }, [open, sessionReady, bookingRequested]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, step]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, notice, typingPersona, options]);

  async function sendMessage(forced?: string) {
    const text = (forced ?? input).trim();
    if (!text || sending) return;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setInput('');
    setSending(true);
    setNotice('');
    addUserMessage(text);
    track('chat_question', {
      question_length: text.length,
      has_owner_location: Boolean(profile.location),
    });
    const assistantId = crypto.randomUUID();
    let currentPersona: Persona = 'tommy';
    let responseText = '';
    const citations: Citation[] = [];
    setMessages((current) => [
      ...current,
      { id: assistantId, role: 'assistant', content: '', persona: currentPersona, citations },
    ]);
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          path: location.pathname,
          context: {
            firstName: profile.firstName || undefined,
            location: profile.location || undefined,
          },
          history,
        }),
      });
      if (!response.ok || !response.body) throw new Error('connection');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const frames = pending.split('\n\n');
        pending = frames.pop() ?? '';
        for (const frame of frames) {
          const raw = frame
            .split('\n')
            .find((line) => line.startsWith('data: '))
            ?.slice(6);
          if (!raw) continue;
          const event = JSON.parse(raw);
          if (event.type === 'message.delta') {
            currentPersona = event.persona;
            responseText += event.delta;
          } else if (event.type === 'citation') {
            citations.push(event.citation);
          } else if (event.type === 'persona.handoff') {
            currentPersona = event.to;
            setActivePersona(event.to);
            track('specialist_handoff', { from: event.from, to: event.to });
          } else if (event.type === 'error') {
            setNotice(event.message);
          }
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: responseText,
                    persona: currentPersona,
                    citations: [...citations],
                  }
                : message,
            ),
          );
        }
      }
      const answer = {
        id: assistantId,
        role: 'assistant' as const,
        content: responseText,
        persona: currentPersona,
        citations: [...citations],
      };
      setLastAnswer(answer);
      setStep('open');
      if (citations.length) track('cited_answer_view', { citation_count: citations.length });
    } catch {
      const content =
        'I could not reach the answer service just now. Please try again, or I can help you request a phone conversation.';
      setMessages((current) =>
        current.map((message) => (message.id === assistantId ? { ...message, content } : message)),
      );
      setLastAnswer({ id: assistantId, role: 'assistant', content, persona: currentPersona });
      setStep('open');
    } finally {
      setSending(false);
    }
  }

  async function beginDelivery() {
    if (!lastAnswer?.content) {
      await guideSay(
        'Ask me your mineral-rights question first. Once I answer, I can send the related information to your email or phone—with your permission.',
        'tommy',
      );
      return;
    }
    setDeliveryAnswer(lastAnswer);
    setStep('delivery-channel');
    await guideSay(
      'Would you like me to send this information so you can pull it up later? I can email it, text a link to your phone, or do both.',
      'tommy',
    );
  }

  async function prepareDelivery(channels: DeliveryChannel[]) {
    setDeliveryRequested(channels);
    setDeliveryGranted([]);
    setDeliveryConsentIndex(0);
    if (channels.includes('email') && !profile.email) {
      setStep('delivery-email');
      await guideSay(
        'What email address should I use? I’ll ask permission before anything is sent.',
        'tommy',
      );
      return;
    }
    if (channels.includes('sms') && !profile.phone) {
      setStep('delivery-phone');
      await guideSay(
        'What mobile number should I use? I’ll ask permission before I text the link.',
        'tommy',
      );
      return;
    }
    await promptDeliveryConsent(channels, 0);
  }

  async function promptDeliveryConsent(
    channels: DeliveryChannel[],
    index: number,
    draft: ProfileDraft = profile,
  ) {
    const channel = channels[index];
    setDeliveryConsentIndex(index);
    setStep('delivery-consent');
    if (channel === 'email')
      await guideSay(
        `Is it okay for MRX to email this answer and related link to ${draft.email}?`,
        'tommy',
      );
    else
      await guideSay(
        `Is it okay for MRX to text the related link to ${draft.phone}? Message and data rates may apply; you can reply STOP to opt out or HELP for help.`,
        'tommy',
      );
  }

  async function finishDelivery(granted: DeliveryChannel[]) {
    if (!granted.length || !deliveryAnswer) {
      setStep('open');
      await guideSay(
        'No problem. I won’t send anything. The information will stay here in this conversation.',
        'tommy',
      );
      return;
    }
    const nextPermissions = {
      ...profile.permissions,
      email: granted.includes('email'),
      sms: granted.includes('sms'),
    };
    const nextProfile = { ...profile, permissions: nextPermissions };
    setProfile(nextProfile);
    setTypingPersona('tommy');
    try {
      const response = await fetch('/api/chat/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            ...nextProfile,
            firstName: nextProfile.firstName || 'Owner',
            disclosureVersion: '2026-07-13-draft',
            sourceUrl: location.href,
          },
          channels: granted,
          answer: deliveryAnswer.content,
          link: absoluteLink(deliveryAnswer.citations?.[0]),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.sent?.length) throw new Error(result.error || 'delivery_failed');
      const sentLabels = result.sent.map((channel: DeliveryChannel) =>
        channel === 'email' ? 'email' : 'text message',
      );
      setStep('open');
      setTypingPersona(null);
      await guideSay(
        `Done—MRX sent it by ${sentLabels.join(' and ')}. You can keep asking questions here anytime.`,
        'tommy',
        260,
      );
      result.sent.forEach((channel: DeliveryChannel) =>
        track('communication_permission', { channel, granted: true, purpose: 'answer_delivery' }),
      );
    } catch {
      setTypingPersona(null);
      setStep('open');
      await guideSay(
        'I saved your choices, but the MRX delivery connection is not ready yet. Nothing was sent. The answer is still available here.',
        'tommy',
        260,
      );
    }
  }

  async function beginBooking() {
    setActivePersona('angela');
    setOptions([]);
    setSelectedOption(null);
    if (bookedAppointment) {
      setStep('booking-help');
      await guideSay(
        `You already have a phone appointment booked for ${bookedAppointment.label}. I won’t book another one. What specifically would you like the MRX team to be ready to help with?`,
        'angela',
        260,
      );
      return;
    }
    setStep('booking-timezone');
    await guideSay(
      `Hi${profile.firstName ? `, ${profile.firstName}` : ''}—I’m Angela, the MRX scheduling guide. I’m here to help set up a phone conversation with the MRX team about your mineral rights. I’ll check the live MRX calendar and offer a few real openings. I have your time zone as ${timezoneLabel(profile.timezone)}. Is that right?`,
      'angela',
      420,
    );
  }

  async function askBookingWindow(timezone: string) {
    setStep('booking-window');
    await guideSay(
      `Perfect—I’ll show every appointment in ${timezoneLabel(timezone)}. What works better for you: tomorrow afternoon, tomorrow evening, or the next available time?`,
      'angela',
      260,
    );
  }

  async function requestAvailability(
    preference: 'afternoon' | 'evening' | 'any',
    day: 'tomorrow' | 'next_available',
  ) {
    const wording =
      day === 'tomorrow' ? `Tomorrow ${preference}` : 'Show me the next available times';
    addUserMessage(wording);
    setStep('booking-slots');
    setTypingPersona('angela');
    setNotice('Angela is checking the MRX calendar…');
    try {
      const response = await fetch(
        `/api/appointments/availability?timezone=${encodeURIComponent(profile.timezone)}&preference=${encodeURIComponent(preference)}&day=${day}`,
      );
      const result = await response.json();
      setNotice('');
      setTypingPersona(null);
      if (!response.ok || !result.options?.length) {
        setStep('booking-window');
        const calendarMessage =
          result.error === 'booking_not_configured'
            ? 'I’m sorry—I can’t reach MRX’s live appointment calendar right now, so I won’t make up a time. You can try again in a moment or keep talking with Tommy. No appointment has been created.'
            : !response.ok
              ? 'I’m having trouble reaching the MRX calendar right now, so I didn’t create an appointment. Would you like to try the next available times again?'
              : `I don’t see a ${preference === 'any' ? 'matching' : preference} opening ${day === 'tomorrow' ? 'tomorrow' : 'in the current window'}. Would you like me to check another part of the day or show the next available times?`;
        await guideSay(calendarMessage, 'angela', 260);
        return;
      }
      setOptions(result.options);
      await guideSay(
        `I found ${result.options.length === 1 ? 'this opening' : 'these openings'}. Which one works best?`,
        'angela',
        260,
      );
      track('availability_offered', {
        option_count: result.options.length,
        timezone: profile.timezone,
        preference,
        day,
      });
    } catch {
      setNotice('');
      setTypingPersona(null);
      setStep('booking-window');
      await guideSay(
        'I couldn’t reach the MRX calendar just now, so I didn’t create an appointment. You can try the next available times again or keep talking with Tommy.',
        'angela',
        260,
      );
    }
  }

  async function selectAppointment(option: AppointmentOption) {
    addUserMessage(option.label);
    setSelectedOption(option);
    setOptions([]);
    if (!profile.firstName) {
      setStep('booking-name');
      await guideSay(
        `Great, I’ll hold ${option.label} while we finish. What first name should I put on the appointment?`,
        'angela',
      );
    } else {
      setStep('booking-email');
      await guideSay(
        `Great, ${profile.firstName}. I’ll hold ${option.label} while we finish. What email should I use for appointment details? You can say “skip” if you prefer phone only.`,
        'angela',
      );
    }
  }

  async function askBookingEmail() {
    setStep('booking-email');
    await guideSay(
      'What email should I use for appointment details? You can say “skip” if you prefer phone only.',
      'angela',
    );
  }

  async function askBookingPhone() {
    setStep('booking-phone');
    await guideSay('What phone number should the live MRX underwriter call?', 'angela');
  }

  async function confirmAppointment(nextProfile: ProfileDraft) {
    if (!selectedOption) return;
    setBooking(true);
    setTypingPersona('angela');
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            ...nextProfile,
            disclosureVersion: '2026-07-13-draft',
            sourceUrl: location.href,
          },
          option: selectedOption,
          notes: profile.location
            ? `Owner says the mineral interest is in ${profile.location}.`
            : '',
        }),
      });
      const result = await response.json();
      setTypingPersona(null);
      if (!response.ok) throw new Error(result.error || 'booking_failed');
      const confirmations = result.notifications?.length
        ? ` I also sent the confirmation by ${result.notifications.map((channel: DeliveryChannel) => (channel === 'email' ? 'email' : 'text')).join(' and ')} as requested.`
        : ' Your confirmation is here on screen.';
      const confirmedAppointment: BookedAppointment = {
        ...selectedOption,
        appointmentId: result.appointmentId,
        savedAt: new Date().toISOString(),
      };
      setBookedAppointment(confirmedAppointment);
      window.localStorage.setItem(
        bookedAppointmentStorageKey,
        JSON.stringify(confirmedAppointment),
      );
      setStep('booking-help');
      await guideSay(
        `You’re booked for ${selectedOption.label}.${confirmations} We’ll call ${nextProfile.phone}.`,
        'angela',
        260,
      );
      await guideSay(
        'What specifically can we help you with?\n\n• Review an offer or understand what affects value\n• Sort out inherited mineral rights or royalty questions\n• Talk through whether selling now or waiting fits your goals\n\nTell me in your own words.',
        'angela',
        220,
      );
      track('appointment_booked', {
        timezone: selectedOption.timezone,
        email_permission: nextProfile.permissions.email,
        sms_permission: nextProfile.permissions.sms,
      });
      setSelectedOption(null);
    } catch {
      setTypingPersona(null);
      setStep('open');
      await guideSay(
        'I couldn’t confirm that time, so no appointment was created. We can try the calendar again when you’re ready.',
        'angela',
        260,
      );
    } finally {
      setBooking(false);
    }
  }

  async function handleQuickReply(value: string, label?: string) {
    if (typingPersona || sending || booking) return;
    if (step === 'intro-name' && value === 'skip') {
      addUserMessage('I’d rather skip that for now.');
      setStep('intro-location');
      await guideSay(
        'That’s completely fine. What state and county are the mineral rights in? If you’re not sure yet, just say so.',
        'tommy',
      );
      return;
    }
    if (step === 'intro-location' && value === 'unknown') {
      addUserMessage('I’m not sure yet.');
      setStep('open');
      await guideSay(
        'No problem—we can figure that out later. What brought you here today?',
        'tommy',
      );
      return;
    }
    if (step === 'open') {
      if (value === 'send') return beginDelivery();
      if (value === 'book') return beginBooking();
      const starter = starters.find(([starterLabel]) => starterLabel === label);
      if (starter) return sendMessage(starter[1]);
      return;
    }
    if (step === 'delivery-channel') {
      addUserMessage(label || value);
      if (value === 'cancel') {
        setStep('open');
        await guideSay('No problem. I won’t send anything.', 'tommy');
        return;
      }
      return prepareDelivery(value === 'both' ? ['email', 'sms'] : [value as DeliveryChannel]);
    }
    if (step === 'delivery-consent') {
      const currentChannel = deliveryRequested[deliveryConsentIndex];
      const allowed = value === 'yes';
      addUserMessage(
        allowed
          ? `Yes, ${currentChannel === 'email' ? 'email it' : 'text it'}.`
          : `No, don’t ${currentChannel === 'email' ? 'email' : 'text'} it.`,
      );
      track('communication_permission', {
        channel: currentChannel,
        granted: allowed,
        purpose: 'answer_delivery',
      });
      const nextGranted = allowed ? [...deliveryGranted, currentChannel] : deliveryGranted;
      setDeliveryGranted(nextGranted);
      const nextIndex = deliveryConsentIndex + 1;
      if (nextIndex < deliveryRequested.length)
        return promptDeliveryConsent(deliveryRequested, nextIndex);
      return finishDelivery(nextGranted);
    }
    if (step === 'booking-timezone') {
      const timezone = value === 'timezone-confirm' ? profile.timezone : value;
      addUserMessage(
        value === 'timezone-confirm'
          ? `Yes, ${timezoneLabel(timezone)} is right.`
          : timezoneLabel(timezone),
      );
      setProfile((current) => ({ ...current, timezone }));
      return askBookingWindow(timezone);
    }
    if (step === 'booking-window') {
      if (value === 'tomorrow-afternoon') return requestAvailability('afternoon', 'tomorrow');
      if (value === 'tomorrow-evening') return requestAvailability('evening', 'tomorrow');
      return requestAvailability('any', 'next_available');
    }
    if (step === 'booking-slots') {
      const option = options.find((item) => item.id === value);
      if (option) return selectAppointment(option);
      return;
    }
    if (step === 'booking-call-consent') {
      addUserMessage(
        value === 'yes' ? 'Yes, MRX may call me for this appointment.' : 'No, do not call me.',
      );
      track('communication_permission', {
        channel: 'call',
        granted: value === 'yes',
        purpose: 'requested_appointment',
      });
      if (value !== 'yes') {
        setStep('open');
        await guideSay(
          'Understood. I can’t book a phone appointment without permission to make the requested call, so nothing was booked. We can keep chatting here.',
          'angela',
        );
        return;
      }
      const next = { ...profile, permissions: { ...profile.permissions, call: true } };
      setProfile(next);
      if (next.email) {
        setStep('booking-email-consent');
        await guideSay(`May MRX email the appointment confirmation to ${next.email}?`, 'angela');
      } else {
        setStep('booking-sms-consent');
        await guideSay(
          `May MRX text the appointment confirmation to ${next.phone}? Message and data rates may apply; reply STOP to opt out or HELP for help.`,
          'angela',
        );
      }
      return;
    }
    if (step === 'booking-email-consent') {
      const allowed = value === 'yes';
      addUserMessage(allowed ? 'Yes, email the appointment details.' : 'No email, please.');
      track('communication_permission', {
        channel: 'email',
        granted: allowed,
        purpose: 'appointment_confirmation',
      });
      const next = { ...profile, permissions: { ...profile.permissions, email: allowed } };
      setProfile(next);
      setStep('booking-sms-consent');
      await guideSay(
        `May MRX also text the appointment confirmation to ${next.phone}? Message and data rates may apply; reply STOP to opt out or HELP for help.`,
        'angela',
      );
      return;
    }
    if (step === 'booking-sms-consent') {
      const allowed = value === 'yes';
      addUserMessage(allowed ? 'Yes, text the appointment details.' : 'No text message, please.');
      track('communication_permission', {
        channel: 'sms',
        granted: allowed,
        purpose: 'appointment_confirmation',
      });
      const next = {
        ...profile,
        permissions: { ...profile.permissions, sms: allowed, marketingSms: false },
      };
      setProfile(next);
      return confirmAppointment(next);
    }
  }

  async function handleComposer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || typingPersona || sending || booking) return;
    setInput('');
    if (step === 'intro-name') {
      if (isSkip(text)) return handleQuickReply('skip');
      const firstName = firstNameFrom(text);
      if (!firstName) {
        await guideSay('I didn’t catch the name. What should I call you?', 'tommy', 260);
        return;
      }
      addUserMessage(text);
      const next = { ...profile, firstName };
      setProfile(next);
      void saveIntroFact({ firstName });
      setStep('intro-location');
      await guideSay(
        `Nice to meet you, ${firstName}. Where are you joining me from—and what state and county are the mineral rights in? It’s okay if those are different places.`,
        'tommy',
      );
      return;
    }
    if (step === 'intro-location') {
      if (isSkip(text)) return handleQuickReply('unknown');
      addUserMessage(text);
      setProfile((current) => ({ ...current, location: text }));
      void saveIntroFact({ location: text });
      setStep('open');
      await guideSay(
        `Thanks${profile.firstName ? `, ${profile.firstName}` : ''}. What can I help you understand today?`,
        'tommy',
      );
      return;
    }
    if (step === 'delivery-channel') {
      const lower = text.toLowerCase();
      if (lower.includes('both')) return handleQuickReply('both', 'Email and text');
      if (lower.includes('email')) return handleQuickReply('email', 'Email it');
      if (lower.includes('text') || lower.includes('sms') || lower.includes('phone'))
        return handleQuickReply('sms', 'Text it');
      if (isSkip(text)) return handleQuickReply('cancel', 'Never mind');
      await guideSay('Choose email, text message, both, or say “never mind.”', 'tommy', 260);
      return;
    }
    if (step === 'delivery-email') {
      if (!/^\S+@\S+\.\S+$/.test(text)) {
        await guideSay(
          'That email address doesn’t look complete. Please check it and try again.',
          'tommy',
          260,
        );
        return;
      }
      addUserMessage(text);
      const next = { ...profile, email: text };
      setProfile(next);
      if (deliveryRequested.includes('sms') && !next.phone) {
        setStep('delivery-phone');
        await guideSay(
          'And what mobile number should I use for the text? I’ll ask permission before sending it.',
          'tommy',
        );
      } else await promptDeliveryConsent(deliveryRequested, 0, next);
      return;
    }
    if (step === 'delivery-phone') {
      if (text.replace(/\D/g, '').length < 7) {
        await guideSay(
          'That phone number looks incomplete. Please include the area code.',
          'tommy',
          260,
        );
        return;
      }
      addUserMessage(text);
      const next = { ...profile, phone: text };
      setProfile(next);
      await promptDeliveryConsent(deliveryRequested, 0, next);
      return;
    }
    if (
      step === 'delivery-consent' ||
      step === 'booking-call-consent' ||
      step === 'booking-email-consent' ||
      step === 'booking-sms-consent'
    ) {
      return handleQuickReply(isYes(text) ? 'yes' : 'no');
    }
    if (step === 'booking-timezone') {
      if (isYes(text)) return handleQuickReply('timezone-confirm');
      const timezone = timezoneFromText(text);
      if (!timezone) {
        await guideSay(
          'I want to make sure I show the right times. You can say Eastern, Central, Mountain, Pacific, Alaska, Hawaii, or Arizona.',
          'angela',
          260,
        );
        return;
      }
      addUserMessage(text);
      setProfile((current) => ({ ...current, timezone }));
      return askBookingWindow(timezone);
    }
    if (step === 'booking-window') {
      const lower = text.toLowerCase();
      if (lower.includes('afternoon')) return handleQuickReply('tomorrow-afternoon');
      if (lower.includes('evening')) return handleQuickReply('tomorrow-evening');
      return handleQuickReply('next-available');
    }
    if (step === 'booking-slots') {
      const matched = options.find(
        (option) =>
          option.label.toLowerCase().includes(text.toLowerCase()) ||
          option.label.match(/\b\d{1,2}:?\d{0,2}\s*[ap]m\b/i)?.[0]?.toLowerCase() ===
            text.toLowerCase(),
      );
      if (matched) return selectAppointment(matched);
      await guideSay('Choose one of the available times shown below.', 'angela', 260);
      return;
    }
    if (step === 'booking-name') {
      const firstName = firstNameFrom(text);
      if (!firstName) {
        await guideSay('What first name should I place on the appointment?', 'angela', 260);
        return;
      }
      addUserMessage(text);
      setProfile((current) => ({ ...current, firstName }));
      void saveIntroFact({ firstName });
      await askBookingEmail();
      return;
    }
    if (step === 'booking-email') {
      if (isSkip(text)) {
        addUserMessage('Skip email—I prefer phone only.');
        setProfile((current) => ({ ...current, email: '' }));
        await askBookingPhone();
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(text)) {
        await guideSay(
          'That email address doesn’t look complete. Try again, or say “skip.”',
          'angela',
          260,
        );
        return;
      }
      addUserMessage(text);
      setProfile((current) => ({ ...current, email: text }));
      await askBookingPhone();
      return;
    }
    if (step === 'booking-phone') {
      if (text.replace(/\D/g, '').length < 7) {
        await guideSay(
          'That phone number looks incomplete. Please include the area code.',
          'angela',
          260,
        );
        return;
      }
      addUserMessage(text);
      const next = { ...profile, phone: text };
      setProfile(next);
      setStep('booking-call-consent');
      await guideSay(`May MRX call ${text} for this specific appointment?`, 'angela');
      return;
    }
    if (step === 'booking-help') {
      setStep('open');
      await sendMessage(text);
      return;
    }
    await sendMessage(text);
  }

  async function uploadFile(file?: File) {
    if (!file || !supabase)
      return setNotice('Sign in to your MRX account before uploading a private document.');
    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    )
      return setNotice('Use a PDF, JPEG, or PNG up to 15 MB.');
    setUploading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setUploading(false);
      return setNotice('Sign in to your MRX account before uploading a private document.');
    }
    try {
      const signedResponse = await fetch('/api/chat/attachments/sign', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signed.error);
      const upload = await supabase.storage
        .from('owner-documents')
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (upload.error) throw upload.error;
      const complete = await fetch('/api/chat/attachments/complete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentId: signed.attachmentId }),
      });
      const result = await complete.json();
      setNotice(
        result.status === 'ready'
          ? `${file.name} is securely attached.`
          : `${file.name} was received and is awaiting its security scan.`,
      );
      track('file_uploaded', {
        mime_type: file.type,
        size_bytes: file.size,
        status: result.status,
      });
    } catch {
      setNotice('That document could not be uploaded. Nothing was shared with MRX.');
    } finally {
      setUploading(false);
    }
  }

  const quickReplies = useMemo(() => {
    if (typingPersona || sending || booking)
      return [] as Array<{ label: string; value: string; kind?: string }>;
    if (step === 'intro-name') return [{ label: 'Skip for now', value: 'skip' }];
    if (step === 'intro-location') return [{ label: 'I’m not sure yet', value: 'unknown' }];
    if (step === 'open')
      return lastAnswer
        ? [
            { label: 'Send me this answer', value: 'send', kind: 'primary' },
            ...(bookedAppointment ? [] : [{ label: 'Talk to a live underwriter', value: 'book' }]),
          ]
        : starters.map(([label]) => ({ label, value: label }));
    if (step === 'delivery-channel')
      return [
        { label: 'Email it', value: 'email' },
        { label: 'Text it', value: 'sms' },
        { label: 'Email and text', value: 'both', kind: 'primary' },
        { label: 'Never mind', value: 'cancel' },
      ];
    if (
      step === 'delivery-consent' ||
      step === 'booking-call-consent' ||
      step === 'booking-email-consent' ||
      step === 'booking-sms-consent'
    )
      return [
        { label: 'Yes', value: 'yes', kind: 'primary' },
        { label: 'No', value: 'no' },
      ];
    if (step === 'booking-timezone')
      return [
        {
          label: `Yes—${timezoneLabel(profile.timezone)}`,
          value: 'timezone-confirm',
          kind: 'primary',
        },
        ...bookingTimezones,
      ];
    if (step === 'booking-window')
      return [
        { label: 'Tomorrow afternoon', value: 'tomorrow-afternoon', kind: 'primary' },
        { label: 'Tomorrow evening', value: 'tomorrow-evening' },
        { label: 'Next available', value: 'next-available' },
      ];
    if (step === 'booking-slots')
      return options.map((option) => ({ label: option.label, value: option.id, kind: 'primary' }));
    return [];
  }, [
    step,
    typingPersona,
    sending,
    booking,
    bookedAppointment,
    lastAnswer,
    options,
    profile.timezone,
  ]);

  const placeholder: Record<ConversationStep, string> = {
    loading: 'Connecting…',
    'intro-name': 'Type your first name…',
    'intro-location': 'State and county…',
    open: 'Ask Tommy anything about your minerals…',
    'delivery-channel': 'Email, text, or both…',
    'delivery-email': 'Your email address…',
    'delivery-phone': 'Your mobile number…',
    'delivery-consent': 'Yes or no…',
    'booking-timezone': 'Your time zone…',
    'booking-window': 'Afternoon or evening…',
    'booking-slots': 'Choose a time…',
    'booking-name': 'Your first name…',
    'booking-email': 'Email or “skip”…',
    'booking-phone': 'Phone number with area code…',
    'booking-call-consent': 'Yes or no…',
    'booking-email-consent': 'Yes or no…',
    'booking-sms-consent': 'Yes or no…',
    'booking-help': 'Tell Angela what you need help with…',
  };
  const composerInputId = `tommy-question-${step}`;
  const isEmailStep = step === 'delivery-email' || step === 'booking-email';
  const isPhoneStep = step === 'delivery-phone' || step === 'booking-phone';
  const isNameStep = step === 'intro-name' || step === 'booking-name';

  return (
    <>
      {!hideLauncher && (
        <button
          className="tommy-fab"
          data-testid="ask-tommy-open"
          data-chat-ready={sessionReady ? 'true' : 'false'}
          type="button"
          onClick={() => {
            setOpen(true);
            track('ask_tommy_open', { source: 'floating_button' });
          }}
          aria-label="Ask Tommy for mineral-rights help"
        >
          <span className="tommy-avatar">
            <img src={tommyAvatar} alt="" />
            <i aria-hidden="true" />
          </span>
          <span>
            <strong>Ask Tommy</strong>
            <small>Straight answers, 24/7</small>
          </span>
        </button>
      )}
      {open && (
        <div
          className="tommy-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section
            className="tommy-panel"
            data-testid="ask-tommy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tommy-title"
          >
            <header className="tommy-panel__head">
              <span className="tommy-avatar">
                <img src={personaAvatar(activePersona)} alt="" />
                <i aria-hidden="true" />
              </span>
              <div>
                <strong id="tommy-title">Talking with {personaLabels[activePersona]}</strong>
                <span>{personaRole(activePersona)} · Here now</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close Ask Tommy">
                ×
              </button>
            </header>
            <div className="tommy-panel__disclosure">
              Educational information, not a certified appraisal or individualized professional
              advice.
            </div>
            <div className="tommy-messages" aria-live="polite">
              {messages.map((message) =>
                message.role === 'assistant' ? (
                  <div className="tommy-message-row" key={message.id}>
                    <img src={personaAvatar(message.persona || 'tommy')} alt="" />
                    <article className="tommy-message tommy-message--assistant">
                      <small>{getGuideChatLabel(message.persona || 'tommy')}</small>
                      <p>
                        {message.content || (sending ? 'Thinking through what you shared…' : '')}
                      </p>
                      {!!message.citations?.length && (
                        <details className="tommy-citations">
                          <summary>Source used</summary>
                          <a href={message.citations[0].url} target="_blank" rel="noreferrer">
                            {message.citations[0].title}
                          </a>
                        </details>
                      )}
                    </article>
                  </div>
                ) : (
                  <article key={message.id} className="tommy-message tommy-message--user">
                    <p>{message.content}</p>
                  </article>
                ),
              )}
              {typingPersona && (
                <div
                  className="tommy-message-row tommy-message-row--typing"
                  aria-label={`${personaLabels[typingPersona]} is typing`}
                >
                  <img src={`/assets/team/${typingPersona}-128.webp`} alt="" />
                  <div className="tommy-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              {!!quickReplies.length && (
                <div className="tommy-quick-replies" aria-label="Suggested replies">
                  {step === 'open' && lastAnswer && (
                    <p>
                      {bookedAppointment
                        ? 'Want me to send this answer? Your phone conversation is already booked.'
                        : 'Want me to send this answer, or help you set up a phone conversation?'}
                    </p>
                  )}
                  {quickReplies.map((reply) => (
                    <button
                      className={reply.kind === 'primary' ? 'is-primary' : ''}
                      data-reply={reply.value}
                      type="button"
                      key={`${step}-${reply.value}`}
                      onClick={() => handleQuickReply(reply.value, reply.label)}
                    >
                      {reply.label}
                      <span>→</span>
                    </button>
                  ))}
                </div>
              )}
              {notice && <p className="tommy-notice">{notice}</p>}
              <div ref={endRef} />
            </div>
            <footer className="tommy-composer">
              <form onSubmit={handleComposer} autoComplete="off">
                <label className="visually-hidden" htmlFor={composerInputId}>
                  Reply to {personaLabels[activePersona]}
                </label>
                <input
                  key={composerInputId}
                  id={composerInputId}
                  name={`mrx-chat-${step}`}
                  data-testid="tommy-composer-input"
                  ref={inputRef}
                  type="text"
                  inputMode={isEmailStep ? 'email' : isPhoneStep ? 'tel' : 'text'}
                  autoComplete="off"
                  aria-autocomplete="none"
                  autoCapitalize={
                    isNameStep ? 'words' : isEmailStep || isPhoneStep ? 'none' : 'sentences'
                  }
                  autoCorrect={isEmailStep || isPhoneStep ? 'off' : 'on'}
                  spellCheck={!isEmailStep && !isPhoneStep}
                  enterKeyHint="send"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={placeholder[step]}
                  maxLength={4000}
                  disabled={step === 'loading'}
                />
                <button
                  type="submit"
                  disabled={Boolean(typingPersona) || sending || booking || !input.trim()}
                  aria-label="Send reply"
                >
                  ↑
                </button>
              </form>
              <div>
                <label className="tommy-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => uploadFile(event.target.files?.[0])}
                    disabled={uploading}
                  />
                  {uploading ? 'Uploading…' : 'Attach a document'}
                </label>
                {bookedAppointment ? (
                  <span
                    className="tommy-appointment-status"
                    data-testid="tommy-appointment-status"
                    title={bookedAppointment.label}
                  >
                    ✓ Call booked
                  </span>
                ) : (
                  <button type="button" onClick={beginBooking}>
                    Talk to a live underwriter
                  </button>
                )}
              </div>
              <p>
                Tommy remembers this conversation on this device. Contact details are only used with
                the permissions you choose.
              </p>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

export default function AskTommy(props: Props) {
  return (
    <ChatErrorBoundary>
      <AskTommyApp {...props} />
    </ChatErrorBoundary>
  );
}
