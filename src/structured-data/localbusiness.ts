/**
 * LocalBusiness JSON-LD. areaServed: Texas. Per SEO plan §2.1 the MVP
 * keeps this Texas-only; New Mexico / Oklahoma are part of the SEO
 * backlog but not in MVP.
 */
import type { LocalBusiness } from 'schema-dts';
import { SITE } from '../lib/site';

export const localBusiness: LocalBusiness = {
  '@type': 'LocalBusiness',
  '@id': `${SITE.url}/#local`,
  name: SITE.name,
  url: SITE.url,
  image: `${SITE.url}/assets/brand/mrx-logo-color.png`,
  areaServed: [
    { '@type': 'State', name: 'Texas' },
    { '@type': 'AdministrativeArea', name: 'Texas' },
  ],
  address: {
    '@type': 'PostalAddress',
    addressRegion: SITE.addressRegion,
    addressCountry: SITE.addressCountry,
  },
  parentOrganization: { '@id': `${SITE.url}/#org` },
};
