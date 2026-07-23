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

export type PublicationStatus =
  | 'draft'
  | 'searchatlas_review'
  | 'editorial_review'
  | 'compliance_review'
  | 'approved'
  | 'published'
  | 'retired';

export type ArticlePillar =
  | 'sell-mineral-rights'
  | 'mineral-rights-value'
  | 'offer-review'
  | 'inherited-mineral-rights'
  | 'oil-and-gas-royalties'
  | 'mineral-rights-taxes'
  | 'texas-mineral-rights'
  | 'title-lease-ownership'
  | 'mrx-methodology';

export type PagesFrontmatter = {
  title: string;
  seo_title?: string;
  description: string;
  slug: string;
  draft?: boolean;
  publication_status?: PublicationStatus;
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
  seo_title?: string;
  description: string;
  slug: string;
  published_at: string;
  updated_at?: string;
  draft?: boolean;
  publication_status?: PublicationStatus;
  author: unknown;
  category: PostsCategory;
  tags?: string[];
  noindex?: boolean;
  content_program?: 'mrx1000';
  content_cluster?:
    | 'sell-mineral-rights-decision-process'
    | 'valuation-methodology-drivers'
    | 'offer-review-buyer-comparison-safety'
    | 'inherited-estate-probate'
    | 'royalties-owner-operations'
    | 'tax-1031-legal-education'
    | 'texas-county-basin-local-intent'
    | 'title-lease-ownership-documents'
    | 'mrx-methodology-transparency-underwriter-process';
  content_intent?:
    | 'informational'
    | 'commercial-investigation'
    | 'transactional'
    | 'navigational'
    | 'local';
  content_guide?: 'tommy' | 'cooper' | 'charlie' | 'dale' | 'rebecca' | 'angela';
  content_batch?: string;
  internal_links?: { hub: string; sibling: string; conversion: '/book/' };
  hero_image: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    mime_type?: 'image/avif' | 'image/webp' | 'image/jpeg' | 'image/png';
    social_src?: string;
    social_alt?: string;
    social_width?: number;
    social_height?: number;
    social_mime_type?: 'image/avif' | 'image/webp' | 'image/jpeg' | 'image/png';
    prompt?: string;
    source?: string;
    license?: string;
    perceptual_hash?: string;
  };
  excerpt: string;
  featured?: boolean;
  disclaimer_top: boolean;
  has_footer_disclaimer?: boolean;
  money_figure_sourced: boolean;
  reviewed_at?: string;
  reviewed_by: string;
  reviewers?: string[];
  states?: string[];
  sources?: { label: string; href: string }[];
  persona_topics?: string[];
  searchatlas_record_id?: string;
  searchatlas_score?: number;
  searchatlas_reviewed_at?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  search_intent?:
    | 'informational'
    | 'commercial-investigation'
    | 'transactional'
    | 'navigational'
    | 'local';
  keyword_cluster?: string;
  pillar?: ArticlePillar;
  cluster?: string;
  parent_page?: string;
  related_articles?: string[];
  answer_summary?: string;
  key_takeaways?: string[];
  questions_answered?: string[];
  faq?: FaqPair[];
  county?: string;
  basin?: string;
  operators?: string[];
  legal_tax_sensitive?: boolean;
  conversion_cta?: { label: string; href: string; prompt?: string };
  featured_guide?: 'tommy' | 'cooper' | 'charlie' | 'dale' | 'rebecca' | 'angela';
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
