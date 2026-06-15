/**
 * Typed re-exports of the 5 content collections. Layouts and components
 * import from here so the schema names are pinned to one place.
 *
 * Per `Astro Architecture Plan.md` §4.
 */
export type ComplianceSignoff = {
  no_disallowed_phrases: true;
  no_named_competitor: true;
  no_superlative_about_mrx: true;
  no_advice_verb: true;
  no_appraisal_term: true;
  no_named_underwriter: true;
  has_footer_disclaimer: true;
  money_figure_sourced: boolean;
  reviewed_by: string;
  reviewed_at: string;
};

export type PagesCategory =
  | 'homepage'
  | 'methodology'
  | 'process'
  | 'about'
  | 'faq'
  | 'free-guide'
  | 'book'
  | 'legal'
  | 'seller-intent';

export type PostsCategory =
  | 'mineral-rights'
  | 'valuation'
  | 'tax-legal'
  | 'selling-process'
  | 'texas-oil-gas'
  | 'competing-offers'
  | 'understanding-mineral-rights';

export type FaqPair = { question: string; answer: string };

export type PagesFrontmatter = {
  title: string;
  description: string;
  slug: string;
  draft?: boolean;
  category: PagesCategory;
  primary_cta: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
  hero_kicker?: string;
  h1: string;
  faq?: FaqPair[];
  disclaimer_top: boolean;
  compliance_signoff: ComplianceSignoff;
  aeo_cited_answer?: boolean;
  aeo_cited_answer_text?: string;
  aeo_cited_answer_sources?: { label: string; href: string }[];
};

export type PostsFrontmatter = {
  title: string;
  description: string;
  slug: string;
  published_at: string;
  updated_at?: string;
  draft?: boolean;
  author: unknown;
  category: PostsCategory;
  tags?: string[];
  hero_image: { src: string; alt: string };
  excerpt: string;
  featured?: boolean;
  disclaimer_top: boolean;
  money_figure_sourced: boolean;
  reviewed_at: string;
  reviewed_by: string;
};

export type Testimonial = {
  id: string;
  body: string;
  first_name: string;
  last_initial: string;
  state: string;
  date: string;
  source: 'email' | 'ghl-conversation' | 'in-person';
  consent_recorded_at: string;
  used_on: string[];
};
