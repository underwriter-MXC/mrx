/**
 * Astro content collection schemas.
 *
 * Public-content collections:
 *   - pages:    9 MDX marketing/legal pages with the §9 sign-off rubric
 *   - posts:    MDX blog posts migrated from WordPress
 *   - categories: typed TS array (not MDX)
 *   - testimonials: JSON; empty [] until W-1 is resolved
 *   - authors:  MRX team guide author identities plus the publishing organization
 *   - team:     legacy staff records retained separately from fictional AI guides
 *
 * The `pages` and `posts` schemas carry the `compliance_signoff` block
 * (or its post-equivalent fields) so the build's sign-off frontmatter
 * is enforced by zod before any prose is rendered. The Vitest unit
 * test re-verifies on every CI run.
 */
import { defineCollection, reference, z } from 'astro:content';

const reviewId = z
  .string()
  .regex(/^mrx_compliance-/, 'reviewed_by must start with mrx_compliance-');

const SignoffRubric = z.object({
  no_disallowed_phrases: z.literal(true),
  no_named_competitor: z.literal(true),
  no_superlative_about_mrx: z.literal(true),
  no_advice_verb: z.literal(true),
  no_appraisal_term: z.literal(true),
  no_named_underwriter: z.literal(true),
  has_footer_disclaimer: z.literal(true),
  money_figure_sourced: z.boolean(),
  reviewed_by: reviewId,
  reviewed_at: z.string().min(10),
});

const PagesCategory = z.enum([
  'homepage',
  'methodology',
  'process',
  'about',
  'faq',
  'free-guide',
  'book',
  'legal',
  'seller-intent',
]);

const pages = defineCollection({
  type: 'content',
  schema: z
    .object({
      // Canonical SEO budget (per SEO plan §1): 30-60 title, 130-160 description.
      title: z.string().min(30).max(60),
      description: z.string().min(130).max(160),
      // NOTE: `slug` is auto-derived from the file name in Astro 5
      // content collections; no need to declare it in the schema.
      draft: z.boolean().optional().default(false),
      category: PagesCategory,
      primary_cta: z.object({ label: z.string(), href: z.string() }),
      secondary_cta: z.object({ label: z.string(), href: z.string() }).optional(),
      hero_kicker: z.string().optional(),
      h1: z.string().min(10).max(120),
      faq: z
        .array(z.object({ question: z.string().min(5), answer: z.string().min(20) }))
        .optional(),
      disclaimer_top: z.boolean(),
      compliance_signoff: SignoffRubric,
      aeo_cited_answer: z.boolean().optional().default(false),
      aeo_cited_answer_text: z.string().optional(),
      aeo_cited_answer_sources: z
        .array(z.object({ label: z.string(), href: z.string() }))
        .optional(),
    })
    .refine(
      (data) => {
        // methodology and legal must have disclaimer_top: true (per §9)
        if (data.category === 'methodology' || data.category === 'legal') {
          return data.disclaimer_top === true;
        }
        return true;
      },
      {
        message: 'disclaimer_top must be true for methodology and legal pages',
        path: ['disclaimer_top'],
      },
    ),
});

const PostsCategory = z.enum([
  'mineral-rights',
  'valuation',
  'tax-legal',
  'selling-process',
  'texas-oil-gas',
  'competing-offers',
  'understanding-mineral-rights',
]);

const PublicationStatus = z.enum([
  'draft',
  'searchatlas_review',
  'editorial_review',
  'compliance_review',
  'approved',
  'published',
  'retired',
]);

const ArticlePillar = z.enum([
  'sell-mineral-rights',
  'mineral-rights-value',
  'offer-review',
  'inherited-mineral-rights',
  'oil-and-gas-royalties',
  'mineral-rights-taxes',
  'texas-mineral-rights',
  'title-lease-ownership',
  'mrx-methodology',
]);

const SearchIntent = z.enum([
  'informational',
  'commercial-investigation',
  'transactional',
  'navigational',
  'local',
]);

const ContentProgram = z.literal('mrx1000');

const ContentCluster = z.enum([
  'sell-mineral-rights-decision-process',
  'valuation-methodology-drivers',
  'offer-review-buyer-comparison-safety',
  'inherited-estate-probate',
  'royalties-owner-operations',
  'tax-1031-legal-education',
  'texas-county-basin-local-intent',
  'title-lease-ownership-documents',
  'mrx-methodology-transparency-underwriter-process',
]);

const ContentGuide = z.enum(['tommy', 'cooper', 'charlie', 'dale', 'rebecca', 'angela']);

const InternalLinkTriangle = z.object({
  hub: z.string().regex(/^\/.+\/$/, 'internal_links.hub must be a trailing-slash path'),
  sibling: z.string().regex(/^\/.+\/$/, 'internal_links.sibling must be a trailing-slash path'),
  conversion: z.literal('/book/'),
});

const posts = defineCollection({
  type: 'content',
  schema: z
    .object({
      // Canonical SEO budget (per SEO plan §1): 30-60 title, 130-160 description.
      title: z.string().min(20).max(120),
      // Optional search-result title. The visible article H1 continues to use
      // `title`; 54 characters leaves room for the canonical ` · MRX` suffix.
      seo_title: z.string().min(20).max(54).optional(),
      description: z.string().min(130).max(160),
      // NOTE: `slug` is auto-derived from the file name in Astro 5
      // content collections; no need to declare it in the schema.
      published_at: z.string().min(10),
      updated_at: z.string().optional(),
      draft: z.boolean().optional().default(false),
      // Fail closed: imported or generated posts are drafts until an explicit
      // release decision marks them published.
      publication_status: PublicationStatus.optional().default('draft'),
      author: reference('authors'),
      category: PostsCategory,
      tags: z.array(z.string()).optional().default([]),
      noindex: z.boolean().optional().default(false),
      content_program: ContentProgram.optional(),
      content_cluster: ContentCluster.optional(),
      content_intent: SearchIntent.optional(),
      content_guide: ContentGuide.optional(),
      content_batch: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      internal_links: InternalLinkTriangle.optional(),
      hero_image: z.object({
        src: z.string(),
        alt: z.string().min(3).max(125),
        width: z.number().int().positive().optional().default(1600),
        height: z.number().int().positive().optional().default(900),
        mime_type: z.enum(['image/avif', 'image/webp', 'image/jpeg', 'image/png']).optional(),
        social_src: z.string().optional(),
        social_alt: z.string().min(3).max(125).optional(),
        social_width: z.number().int().positive().optional(),
        social_height: z.number().int().positive().optional(),
        social_mime_type: z
          .enum(['image/avif', 'image/webp', 'image/jpeg', 'image/png'])
          .optional(),
        prompt: z.string().optional(),
        source: z.string().optional(),
        license: z.string().optional(),
        perceptual_hash: z.string().optional(),
      }),
      excerpt: z.string().min(40).max(220),
      featured: z.boolean().optional().default(false),
      disclaimer_top: z.boolean(),
      has_footer_disclaimer: z.boolean().optional().default(true),
      money_figure_sourced: z.boolean(),
      reviewed_at: z.string().min(10).optional(),
      reviewed_by: reviewId,
      reviewers: z.array(z.string()).optional().default([]),
      states: z.array(z.string()).optional().default([]),
      sources: z
        .array(z.object({ label: z.string(), href: z.string().url() }))
        .optional()
        .default([]),
      persona_topics: z.array(z.string()).optional().default([]),
      searchatlas_record_id: z.string().optional(),
      searchatlas_score: z.number().min(0).max(100).optional(),
      searchatlas_reviewed_at: z.string().min(10).optional(),
      primary_keyword: z.string().min(2).optional(),
      secondary_keywords: z.array(z.string()).optional().default([]),
      search_intent: SearchIntent.optional(),
      keyword_cluster: z.string().min(2).optional(),
      pillar: ArticlePillar.optional(),
      cluster: z.string().min(2).optional(),
      parent_page: z.string().regex(/^\//).optional(),
      related_articles: z
        .array(z.string().regex(/^[a-z0-9-]+$/))
        .optional()
        .default([]),
      answer_summary: z.string().min(40).max(500).optional(),
      key_takeaways: z.array(z.string().min(10)).max(8).optional().default([]),
      questions_answered: z.array(z.string().min(5)).optional().default([]),
      faq: z
        .array(z.object({ question: z.string().min(5), answer: z.string().min(20) }))
        .optional()
        .default([]),
      county: z.string().optional(),
      basin: z.string().optional(),
      operators: z.array(z.string()).optional().default([]),
      legal_tax_sensitive: z.boolean().optional().default(false),
      conversion_cta: z
        .object({
          label: z.string().min(3),
          href: z.string().regex(/^\//),
          prompt: z.string().min(10).optional(),
        })
        .optional(),
      featured_guide: z
        .enum(['tommy', 'cooper', 'charlie', 'dale', 'rebecca', 'angela'])
        .optional()
        .default('tommy'),
    })
    .superRefine((data, ctx) => {
      // Every tax-legal post must have disclaimer_top: true (per L-2..L-9).
      if (data.category === 'tax-legal' && data.disclaimer_top !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'disclaimer_top must be true for every tax-legal post',
          path: ['disclaimer_top'],
        });
      }

      if (data.content_program !== 'mrx1000') return;

      if (data.publication_status === 'approved' || data.publication_status === 'published') {
        if (!data.reviewed_at) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'reviewed_at is required after an mrx1000 post is approved',
            path: ['reviewed_at'],
          });
        }
        if (data.reviewed_by.includes('pending')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'reviewed_by cannot remain pending after an mrx1000 post is approved',
            path: ['reviewed_by'],
          });
        }
        if (data.faq.length !== 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must include exactly five reviewed FAQs',
            path: ['faq'],
          });
        }
        if (data.sources.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must include at least two authoritative sources',
            path: ['sources'],
          });
        }
        if (!data.answer_summary) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must include an answer-first summary',
            path: ['answer_summary'],
          });
        }
        if (data.key_takeaways.length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must include at least three key takeaways',
            path: ['key_takeaways'],
          });
        }
        if (data.questions_answered.length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must declare at least three questions answered',
            path: ['questions_answered'],
          });
        }
        if (!data.conversion_cta) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'approved mrx1000 posts must include a reviewed conversion path',
            path: ['conversion_cta'],
          });
        }
      }

      const required = [
        ['content_cluster', data.content_cluster],
        ['content_intent', data.content_intent],
        ['content_guide', data.content_guide],
        ['content_batch', data.content_batch],
        ['internal_links', data.internal_links],
        ['hero_image.social_src', data.hero_image.social_src],
        ['hero_image.social_alt', data.hero_image.social_alt],
      ] as const;
      for (const [field, value] of required) {
        if (value === undefined || value === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field} is required for mrx1000 posts`,
            path: field.split('.'),
          });
        }
      }

      if (data.title.length < 30 || data.title.length > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'mrx1000 title must be 30-60 characters',
          path: ['title'],
        });
      }
      if (data.has_footer_disclaimer !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'mrx1000 posts must retain the footer disclaimer',
          path: ['has_footer_disclaimer'],
        });
      }
      if (data.content_batch === 'pilot-001') {
        if (data.draft !== true || data.noindex !== true || data.publication_status !== 'draft') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'MRX1000-PILOT-001 must remain draft, publication_status=draft, and noindex during staged QA',
            path: ['publication_status'],
          });
        }
      }
    }),
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    label: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.union([
    z.null(),
    z.array(
      z.object({
        id: z.string(),
        body: z.string().min(20),
        first_name: z.string(),
        last_initial: z.string().max(2),
        state: z.string().max(4),
        date: z.string(),
        source: z.enum(['email', 'ghl-conversation', 'in-person']),
        consent_recorded_at: z.string(),
        used_on: z.array(z.string()),
      }),
    ),
  ]),
});

const team = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    // NOTE: `slug` is auto-derived from the file name in Astro 5.
    kind: z.enum(['organization', 'underwriter']),
    title: z.string().optional(),
    bio: z.string().optional(),
    description: z.string().optional(),
    // Reserved for the /about/team page (NOT in MVP per Architecture §11).
    featured: z.boolean().optional().default(false),
  }),
});

const authors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    kind: z.enum(['organization', 'person', 'ai-guide']),
    title: z.string(),
    description: z.string(),
    credentials: z.array(z.string()).optional().default([]),
    review_scope: z.array(z.string()).optional().default([]),
  }),
});

export const collections = {
  pages,
  posts,
  categories,
  testimonials,
  authors,
  team,
};
