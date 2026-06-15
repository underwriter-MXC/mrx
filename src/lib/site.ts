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
  tagline: 'Transparent Texas mineral rights underwriter reviews',
  description:
    'A free, no-pressure underwriter review for Texas mineral rights owners. Transparent DCF methodology, no clawback clauses, no teaser numbers. Get the facts before you sign.',
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
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Methodology', href: '/methodology' },
    { label: 'Sell Mineral Rights', href: '/sell-mineral-rights' },
    { label: 'About', href: '/about' },
    { label: 'FAQ', href: '/faq' },
  ],
  footer: {
    company: [
      { label: 'About', href: '/about' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'How It Works', href: '/how-it-works' },
    ],
    resources: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Free Guide', href: '/free-guide' },
      { label: 'Blog', href: '/blog' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
    cta: [
      { label: 'Book Free Review', href: '/book', variant: 'primary' as const },
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
