/**
 * Astro content collection schemas.
 *
 * Public-content collections:
 *   - pages:    9 MDX marketing/legal pages with the §9 sign-off rubric
 *   - posts:    MDX blog posts migrated from WordPress
 *   - categories: typed TS array (not MDX)
 *   - testimonials: JSON; empty [] until W-1 is resolved
 *   - authors:  verified people or the real MRX editorial organization
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

const posts = defineCollection({
  type: 'content',
  schema: z
    .object({
      // Canonical SEO budget (per SEO plan §1): 30-60 title, 130-160 description.
      title: z.string().min(30).max(60),
      description: z.string().min(130).max(160),
      // NOTE: `slug` is auto-derived from the file name in Astro 5
      // content collections; no need to declare it in the schema.
      published_at: z.string().min(10),
      updated_at: z.string().optional(),
      draft: z.boolean().optional().default(false),
      author: reference('authors'),
      category: PostsCategory,
      tags: z.array(z.string()).optional().default([]),
      hero_image: z.object({ src: z.string(), alt: z.string().min(3) }),
      excerpt: z.string().min(40).max(220),
      featured: z.boolean().optional().default(false),
      disclaimer_top: z.boolean(),
      money_figure_sourced: z.boolean(),
      reviewed_at: z.string().min(10),
      reviewed_by: reviewId,
      reviewers: z.array(z.string()).optional().default([]),
      states: z.array(z.string()).optional().default([]),
      sources: z.array(z.object({ label: z.string(), href: z.string().url() })).optional().default([]),
      persona_topics: z.array(z.string()).optional().default([]),
    })
    .refine(
      (data) => {
        // Every tax-legal post must have disclaimer_top: true (per L-2..L-9)
        if (data.category === 'tax-legal') {
          return data.disclaimer_top === true;
        }
        return true;
      },
      {
        message: 'disclaimer_top must be true for every tax-legal post',
        path: ['disclaimer_top'],
      },
    ),
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
    kind: z.enum(['organization', 'person']),
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
