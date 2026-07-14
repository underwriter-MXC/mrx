import type { Organization, ProfessionalService, WebPage, WebSite } from 'schema-dts';
import { SITE } from '../lib/site';
import { buildCanonical } from '../lib/seo';
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
  sameAs: [],
};

export const professionalService: ProfessionalService = {
  '@type': 'ProfessionalService',
  '@id': `${SITE.url}/#service`,
  name: SITE.name,
  image: `${SITE.url}/assets/brand/mrx-underwriter-review-og.png`,
  url: SITE.url,
  telephone: SITE.phone || undefined,
  priceRange: 'Free educational review; transaction terms vary',
  areaServed: { '@type': 'Country', name: 'United States' },
  address: { '@type': 'PostalAddress', addressRegion: SITE.addressRegion, addressCountry: SITE.addressCountry },
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
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/learning-center/?q={search_term_string}` },
    ...({ 'query-input': 'required name=search_term_string' } as Record<string, string>),
  },
} as WebSite;

export function pageNode(path: string, name: string): WebPage {
  const canonical = buildCanonical(path, SITE.url);
  return {
    '@type': 'WebPage',
    '@id': `${canonical}#page`,
    url: canonical,
    name,
    inLanguage: SITE.locale,
    isPartOf: { '@id': `${SITE.url}/#site` },
    about: { '@id': `${SITE.url}/#org` },
    speakable: speakable(),
  };
}

export function siteGraph(path: string, name: string): object[] {
  return [organization, professionalService, webSite, pageNode(path, name)] as object[];
}
