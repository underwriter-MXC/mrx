export type GuideStatus = 'active' | 'directory';

export interface Guide {
  slug: string;
  name: string;
  role: string;
  shortRole: string;
  chatRole: string;
  status: GuideStatus;
  image: string;
  summary: string;
  helpsWith: string[];
  limits: string;
  greeting: string;
  accent: string;
}

export const guides: Guide[] = [
  {
    slug: 'tommy',
    name: 'Tommy',
    role: 'MRX Underwriter AI Guide',
    shortRole: 'Offer and value guide',
    chatRole: 'MRX Offer and Value Guide',
    status: 'active',
    image: '/assets/team/tommy-256.webp',
    summary:
      'A plainspoken first stop for understanding an offer, a mineral interest, or the questions worth asking next.',
    helpsWith: [
      'Offer questions',
      'Value factors',
      'Sell-or-hold context',
      'Finding the right specialist',
    ],
    limits:
      'Tommy provides general educational information and does not provide a certified appraisal or individualized professional advice.',
    greeting:
      'Tell me what happened. I’ll help separate what is known, what is missing, and what to look at next.',
    accent: '#d79a2b',
  },
  {
    slug: 'cooper',
    name: 'Cooper',
    role: 'MRX Research AI Guide',
    shortRole: 'Ownership and records guide',
    chatRole: 'MRX Ownership and Records Guide',
    status: 'active',
    image: '/assets/team/cooper-256.webp',
    summary:
      'Helps owners organize deeds, leases, division orders, county references, and inherited-interest questions.',
    helpsWith: [
      'Ownership records',
      'County research',
      'Document checklists',
      'Inherited interests',
    ],
    limits:
      'Cooper can organize research steps but cannot determine title or replace a qualified land or title professional.',
    greeting:
      'Let’s figure out what you have, what the records may show, and which document would answer the next question.',
    accent: '#a56b35',
  },
  {
    slug: 'charlie',
    name: 'Charlie',
    role: 'MRX Geology AI Guide',
    shortRole: 'Geology and basin guide',
    chatRole: 'MRX Geology and Basin Guide',
    status: 'active',
    image: '/assets/team/charlie-256.webp',
    summary:
      'Explains formations, basin context, well spacing, nearby activity, and the limits of geological information.',
    helpsWith: ['Basin context', 'Formations', 'Nearby development', 'Geological uncertainty'],
    limits:
      'Charlie provides educational geological context, not a site-specific reserve report or engineering certification.',
    greeting:
      'Share the state, county, operator, formation, or well information you know, and we’ll build the geological context.',
    accent: '#315f70',
  },
  {
    slug: 'dale',
    name: 'Dale',
    role: 'MRX Engineering AI Guide',
    shortRole: 'Production and royalty guide',
    chatRole: 'MRX Production and Royalty Guide',
    status: 'active',
    image: '/assets/team/dale-256.webp',
    summary:
      'Explains production history, royalty statements, decline curves, well timing, and the assumptions behind forecasts.',
    helpsWith: [
      'Production history',
      'Decline curves',
      'Royalty statements',
      'Forecast assumptions',
    ],
    limits:
      'Dale explains engineering concepts but does not issue a reserve certification or promise future production.',
    greeting:
      'If you have a royalty statement, well name, or production history, we can start with what the numbers actually show.',
    accent: '#52636d',
  },
  {
    slug: 'rebecca',
    name: 'Rebecca',
    role: 'MRX Legal Information AI Guide',
    shortRole: 'Terms and professional-routing guide',
    chatRole: 'MRX Terms and Professional-Routing Guide',
    status: 'active',
    image: '/assets/team/rebecca-256.webp',
    summary:
      'Explains common agreement terms and helps owners identify questions for an attorney or tax professional.',
    helpsWith: [
      'Offer terms',
      'Closing documents',
      'Professional question lists',
      'Escalation signals',
    ],
    limits:
      'Rebecca is not a lawyer and does not provide legal advice, tax advice, or a title opinion.',
    greeting:
      'I can explain common terms in plain language and help you prepare focused questions for the right professional.',
    accent: '#8c5e56',
  },
  {
    slug: 'angela',
    name: 'Angela',
    role: 'MRX Relationship AI Guide',
    shortRole: 'Scheduling and next-steps guide',
    chatRole: 'MRX Scheduling and Next-Steps Guide',
    status: 'active',
    image: '/assets/team/angela-256.webp',
    summary:
      'Collects the practical details, checks availability, and books phone appointments without making owners hunt through a calendar.',
    helpsWith: ['Phone appointments', 'Contact preferences', 'Reminders', 'Next steps'],
    limits:
      'Angela schedules and organizes follow-up; she does not evaluate the merits of a transaction.',
    greeting:
      'Tell me your timezone and what part of the day usually works. I’ll bring back three phone-call options.',
    accent: '#4e6f63',
  },
  {
    slug: 'walt',
    name: 'Walt',
    role: 'MRX Risk AI Guide',
    shortRole: 'Risk guide',
    chatRole: 'MRX Risk Guide',
    status: 'directory',
    image: '/assets/team/walt-256.webp',
    summary:
      'A directory guide focused on verification, warning signs, and transaction-risk questions.',
    helpsWith: ['Verification', 'Warning signs', 'Process risks'],
    limits: 'Directory profile only at launch.',
    greeting: 'Trust, but verify.',
    accent: '#665c52',
  },
  {
    slug: 'monty',
    name: 'Monty',
    role: 'MRX Strategy AI Guide',
    shortRole: 'Decision-context guide',
    chatRole: 'MRX Decision-Context Guide',
    status: 'directory',
    image: '/assets/team/monty-256.webp',
    summary:
      'A directory guide for understanding tradeoffs and looking at a decision in a broader context.',
    helpsWith: ['Decision tradeoffs', 'Scenario framing', 'Longer-term context'],
    limits: 'Directory profile only at launch.',
    greeting: 'Let’s look at the bigger picture.',
    accent: '#263b4f',
  },
  {
    slug: 'cami',
    name: 'Cami',
    role: 'MRX Governance AI Guide',
    shortRole: 'Decision-process guide',
    chatRole: 'MRX Decision-Process Guide',
    status: 'directory',
    image: '/assets/team/cami-256.webp',
    summary: 'A directory guide for organizing family, estate, and decision-process questions.',
    helpsWith: ['Decision roles', 'Family coordination', 'Process organization'],
    limits: 'Directory profile only at launch.',
    greeting: 'Good decisions start with good information.',
    accent: '#7e6957',
  },
  {
    slug: 'ariana',
    name: 'Ariana',
    role: 'MRX Owner Advocate AI Guide',
    shortRole: 'Owner-options guide',
    chatRole: 'MRX Owner-Options Guide',
    status: 'directory',
    image: '/assets/team/ariana-256.webp',
    summary:
      'A directory guide for keeping owner priorities and available options visible throughout the process.',
    helpsWith: ['Owner priorities', 'Option summaries', 'Question preparation'],
    limits: 'Directory profile only at launch.',
    greeting: 'Let’s make sure every available option is understandable.',
    accent: '#8a5c47',
  },
  {
    slug: 'ainsley',
    name: 'Ainsley',
    role: 'MRX Experience AI Guide',
    shortRole: 'Process-experience guide',
    chatRole: 'MRX Process-Experience Guide',
    status: 'directory',
    image: '/assets/team/ainsley-256.webp',
    summary:
      'A directory guide focused on making the owner experience clear, organized, and easier to navigate.',
    helpsWith: ['Process overview', 'Checklists', 'Experience questions'],
    limits: 'Directory profile only at launch.',
    greeting: 'Let’s make this easier.',
    accent: '#9b7451',
  },
];

export const activeGuides = guides.filter((guide) => guide.status === 'active');

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}

export function getGuideChatLabel(slug: string) {
  const guide = getGuide(slug) ?? guides[0];
  return `${guide.name} ${guide.chatRole}`;
}

export function routeGuide(question: string): Guide {
  const normalized = question.toLowerCase();
  const routes: Array<[string[], string]> = [
    [['book', 'appointment', 'call me', 'schedule', 'talk to someone'], 'angela'],
    [['deed', 'probate', 'inherited', 'county record', 'division order', 'ownership'], 'cooper'],
    [['formation', 'basin', 'geology', 'seismic', 'acre spacing', 'nearby well'], 'charlie'],
    [['production', 'decline', 'royalty check', 'barrel', 'mcf', 'engineering'], 'dale'],
    [['contract', 'clause', 'legal', 'tax', 'attorney', 'closing document'], 'rebecca'],
  ];
  const match = routes.find(([terms]) => terms.some((term) => normalized.includes(term)));
  return getGuide(match?.[1] ?? 'tommy') ?? guides[0];
}
