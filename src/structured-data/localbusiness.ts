/**
 * LocalBusiness JSON-LD. NOT currently emitted by siteGraph() - GBP/local
 * citation eligibility for Mineral Rights Xchange depends on Daryl / mrx_ceo
 * confirming a real-world operating footprint (physical office vs
 * service-area business), a single canonical phone, and a service-area
 * definition. Until those facts are confirmed, this file is dormant: the
 * ProfessionalService node in site.ts already carries the published
 * nationwide scope and the canonical region/country, which is what
 * search engines see today.
 *
 * When GBP activation is approved:
 *   1. Confirm a single canonical phone (see SITE.phone in src/lib/site.ts).
 *   2. Confirm service-area mode (states MRX actively serves).
 *   3. Decide whether to publish a street address or remain service-area only.
 *   4. Wire `localBusiness` into siteGraph() and run `pnpm run lint`,
 *      `pnpm run typecheck`, and `pnpm run build` to verify the graph still
 *      validates and does not invent facts.
 *
 * areaServed mirrors the published scope in src/content/pages/about.mdx:
 *   "MRX provides nationwide educational guidance, with deeper initial
 *    content for Texas, New Mexico, Oklahoma, North Dakota, Colorado,
 *    Wyoming, Pennsylvania, West Virginia, Ohio, and Louisiana."
 *
 * Per the MRX compliance rules (compliance/five-hard-rules.json and
 * compliance/disallowed.json), this node must never include:
 *   - any promised payout, guaranteed price, or single-figure valuation;
 *   - any reference to a regulated valuation product (the disallowed
 *     lexicon lists terms for that family of claims);
 *   - any "best / only / most trustworthy" superlative about MRX;
 *   - a named underwriter (compliance rule 4);
 *   - a phone number that has not been confirmed by Daryl and placed
 *     into SITE.phone / PUBLIC_MRX_PHONE_TEL.
 */
import type { LocalBusiness } from 'schema-dts';
import { SITE } from '../lib/site';

export const localBusiness: LocalBusiness = {
  '@type': 'LocalBusiness',
  '@id': `${SITE.url}/#local`,
  name: SITE.name,
  url: SITE.url,
  image: `${SITE.url}/assets/brand/mrx-logo-color.png`,
  description: SITE.description,
  // Match the published scope in about.mdx. GBP sees "Country: US" until
  // Daryl confirms a tighter service-area definition; this stays in sync
  // with the ProfessionalService node in site.ts.
  areaServed: { '@type': 'Country', name: 'United States' },
  // Only emit the canonical phone once SITE.phone is populated. Same gate
  // already used by ProfessionalService and by AiFirstHome.astro.
  telephone: SITE.phone || undefined,
  // No street address is published today. Address carries region/country
  // only, never a fabricated street/city/postal code.
  address: {
    '@type': 'PostalAddress',
    addressRegion: SITE.addressRegion,
    addressCountry: SITE.addressCountry,
  },
  parentOrganization: { '@id': `${SITE.url}/#org` },
};
