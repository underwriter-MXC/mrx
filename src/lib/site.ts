/**
 * Site-level configuration. The single source of truth for brand name,
 * base URL, primary navigation, contact details, and the canonical
 * resource paths.
 *
 * Per Architecture Plan §1 and §9.
 */
export const SITE = {
  name: 'Mineral Rights Xchange',
  shortName: 'MRX',
  tagline: 'Straight answers for mineral owners nationwide',
  description:
    'Free, no-pressure mineral-rights education for owners comparing offers, inherited interests, royalties, and sell-or-hold decisions across the United States.',
  url: 'https://mineralrightsxchange.com',
  locale: 'en-US',
  email: 'review@mineralrightsxchange.com',
  phone: '', // Reserved; populated when MRX has a published business phone.
  addressRegion: 'TX',
  addressCountry: 'US',
  foundedYear: 2026,
} as const;

export const NAV = {
  primary: [
    { label: 'Value My Minerals', href: '/mineral-rights-value/' },
    { label: 'Review My Offer', href: '/offer-review/' },
    { label: 'Inherited Rights', href: '/inherited-mineral-rights/' },
    { label: 'Learning Center', href: '/learning-center/' },
    { label: 'About MRX', href: '/about' },
  ],
  footer: {
    company: [
      { label: 'About', href: '/about' },
      { label: 'Meet the AI Guides', href: '/team/' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'How It Works', href: '/how-it-works' },
    ],
    resources: [
      { label: 'Value My Minerals', href: '/mineral-rights-value/' },
      { label: 'Review My Offer', href: '/offer-review/' },
      { label: 'Inherited Rights', href: '/inherited-mineral-rights/' },
      { label: 'Learning Center', href: '/learning-center/' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & AI Disclosure', href: '/terms/' },
      { label: 'Communication Preferences', href: '/communication-preferences/' },
    ],
    cta: [
      { label: 'Ask Tommy', href: '#ask-tommy', variant: 'primary' as const },
    ],
  },
  cta: {
    book: { label: 'Book My Free Review', href: '/book' },
    guide: { label: 'Get the Free Guide', href: '/free-guide' },
  },
} as const;

export const CATEGORIES = {
  homepage: 'homepage',
  methodology: 'methodology',
  process: 'process',
  about: 'about',
  faq: 'faq',
  'free-guide': 'free-guide',
  book: 'book',
  legal: 'legal',
  'seller-intent': 'seller-intent',
} as const;

export const POST_CATEGORIES = {
  'mineral-rights': 'mineral-rights',
  valuation: 'valuation',
  'tax-legal': 'tax-legal',
  'selling-process': 'selling-process',
  'texas-oil-gas': 'texas-oil-gas',
  'competing-offers': 'competing-offers',
  'understanding-mineral-rights': 'understanding-mineral-rights',
} as const;

export type PageCategory = (typeof CATEGORIES)[keyof typeof CATEGORIES];
export type PostCategory = (typeof POST_CATEGORIES)[keyof typeof POST_CATEGORIES];

export type PageType = 'home' | 'marketing' | 'blog' | 'post' | 'utility';
