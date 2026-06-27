/**
 * Site-level JSON-LD: Organization, ProfessionalService, WebSite.
 * Per `SEO AEO Sitemap Schema Plan.md` §2.1. Rendered on every page in
 * the same JSON-LD block via Seo.astro.
 */
import type { Organization, ProfessionalService, WebPage, WebSite } from 'schema-dts';
import { SITE } from '../lib/site';
import { speakable } from './article';

export const organization: Organization = {
  '@type': 'Organization',
  '@id': `${SITE.url}/#org`,
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  logo: `${SITE.url}/assets/brand/mrx-logo-color.png`,
  description: SITE.description,
  foundingDate: String(SITE.foundedYear),
  // sameAs populated in stage 11 if Daryl wants socials.
  sameAs: [],
};

export const professionalService: ProfessionalService = {
  '@type': 'ProfessionalService',
  '@id': `${SITE.url}/#service`,
  name: SITE.name,
  image: `${SITE.url}/assets/brand/mrx-logo-color.png`,
  url: SITE.url,
  telephone: SITE.phone || undefined,
  priceRange: '$$',
  areaServed: [
    { '@type': 'State', name: 'Texas' },
  ],
  address: {
    '@type': 'PostalAddress',
    addressRegion: SITE.addressRegion,
    addressCountry: SITE.addressCountry,
  },
  parentOrganization: { '@id': `${SITE.url}/#org` },
};

export const webSite: WebSite = {
  '@type': 'WebSite',
  '@id': `${SITE.url}/#site`,
  url: SITE.url,
  name: SITE.name,
  publisher: { '@id': `${SITE.url}/#org` },
  inLanguage: SITE.locale,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/blog/?q={search_term_string}`,
    },
    // schema-dts SearchActionLeaf does not declare `query-input`; per
    // schema.org/SearchAction it is required, so cast to any.
    ...({ 'query-input': 'required name=search_term_string' } as Record<string, string>),
  },
} as WebSite;

/**
 * Generic WebPage node carrying the site-wide SpeakableSpecification.
 * Per SEO plan §2.5 + §5.3: tell answer engines which blocks on a
 * page are safe to cite (the disclaimer + the cited-answer). Applied
 * to every page via the site graph, not just articles.
 */
export const webPage: WebPage = {
  '@type': 'WebPage',
  '@id': `${SITE.url}/#page`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: SITE.locale,
  isPartOf: { '@id': `${SITE.url}/#site` },
  about: { '@id': `${SITE.url}/#org` },
  speakable: speakable(),
};

export const siteGraph = [organization, professionalService, webSite, webPage];
