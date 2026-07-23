export type ContentGeniusStateBrief = {
  slug: string;
  state: string;
  priority: string;
  regulator: string;
  regulatorUrl: string;
  basins: string[];
  pillar: string;
  metaDescription: string;
  brief: string;
};

export type ContentGeniusClusterBrief = {
  id: string;
  pillar: string;
  intent: 'BOFU' | 'MOFU' | 'TOFU';
  title: string;
  pages: string[];
  answerFirstBlock: string;
};

export const contentGeniusStateBriefs: ContentGeniusStateBrief[] = [
  {
    slug: 'texas',
    state: 'Texas',
    priority: 'P0 Texas-first pillar',
    regulator: 'Railroad Commission of Texas',
    regulatorUrl: 'https://www.rrc.texas.gov/',
    basins: ['Permian Basin', 'Eagle Ford', 'Haynesville', 'Barnett'],
    pillar: 'Texas Mineral Rights Owner Article',
    metaDescription:
      'Texas mineral rights owner guide for offers, royalties, records, inheritance, and sale timing with MRX review steps and public-source checks.',
    brief:
      'Upgrade the existing Texas guide into the canonical pillar. Keep answer-first blocks for selling, value, royalties, probate, surface/mineral split, county records, and offer review. Link every Texas cluster back here and avoid valuation guarantees.',
  },
  {
    slug: 'new-mexico',
    state: 'New Mexico',
    priority: 'P1 state guide',
    regulator: 'New Mexico Oil Conservation Division',
    regulatorUrl: 'https://www.emnrd.nm.gov/ocd/',
    basins: ['Delaware Basin', 'San Juan Basin'],
    pillar: 'New Mexico Mineral Rights Owner Article',
    metaDescription:
      'New Mexico mineral rights guide for Permian and San Juan owners reviewing offers, royalty data, county records, and inherited interests.',
    brief:
      'Create a state-specific owner guide focused on connecting county records, OCD data, operator letters, inherited interests, and cross-border Permian context. Do not imply state-specific legal advice.',
  },
  {
    slug: 'oklahoma',
    state: 'Oklahoma',
    priority: 'P1 state guide',
    regulator: 'Oklahoma Corporation Commission',
    regulatorUrl: 'https://oklahoma.gov/occ.html',
    basins: ['SCOOP', 'STACK', 'Anadarko Basin'],
    pillar: 'Oklahoma Mineral Rights Owner Article',
    metaDescription:
      'Oklahoma mineral rights guide for owners comparing offers, pooling context, operator records, royalty checks, and inherited interests.',
    brief:
      'Frame Oklahoma around pooling orders, changing operators, division orders, royalty history, and county/title documents. Link to general offer-comparison and underwriter-review pages.',
  },
  {
    slug: 'north-dakota',
    state: 'North Dakota',
    priority: 'P1 state guide',
    regulator: 'North Dakota Department of Mineral Resources',
    regulatorUrl: 'https://www.dmr.nd.gov/',
    basins: ['Bakken', 'Three Forks'],
    pillar: 'North Dakota Mineral Rights Owner Article',
    metaDescription:
      'North Dakota mineral rights guide for Bakken owners comparing offers, production history, spacing, royalty statements, and timing.',
    brief:
      'Focus on Bakken/Three Forks production history, spacing, operator activity, royalty statements, and inherited mineral questions. Keep sale/hold language neutral.',
  },
  {
    slug: 'colorado',
    state: 'Colorado',
    priority: 'P2 state guide',
    regulator: 'Colorado Energy and Carbon Management Commission',
    regulatorUrl: 'https://ecmc.state.co.us/',
    basins: ['DJ Basin', 'Piceance Basin'],
    pillar: 'Colorado Mineral Rights Owner Article',
    metaDescription:
      'Colorado mineral rights guide for owners reviewing offers, county records, operator activity, royalty data, and local development context.',
    brief:
      'Address local development rules at a high level, ECMC public records, ownership documents, royalty statements, and operator activity. Avoid legal interpretations.',
  },
  {
    slug: 'wyoming',
    state: 'Wyoming',
    priority: 'P2 state guide',
    regulator: 'Wyoming Oil and Gas Conservation Commission',
    regulatorUrl: 'https://wogcc.wyo.gov/',
    basins: ['Powder River Basin', 'Green River Basin'],
    pillar: 'Wyoming Mineral Rights Owner Article',
    metaDescription:
      'Wyoming mineral rights guide for owners reviewing offers, production context, federal acreage issues, and county ownership records.',
    brief:
      'Cover conventional fields, federal acreage context, WOGCC records, county/title documents, and sale-readiness questions.',
  },
  {
    slug: 'pennsylvania',
    state: 'Pennsylvania',
    priority: 'P2 state guide',
    regulator: 'Pennsylvania Department of Environmental Protection',
    regulatorUrl: 'https://www.pa.gov/agencies/dep.html',
    basins: ['Marcellus Shale', 'Utica Shale'],
    pillar: 'Pennsylvania Mineral Rights Owner Article',
    metaDescription:
      'Pennsylvania mineral rights guide for Marcellus and Utica owners reviewing royalty checks, deductions, leases, and inherited interests.',
    brief:
      'Prioritize royalty-statement deductions, lease history, inherited interests, DEP records, and offer comparison. Keep all tax/legal statements as question prompts.',
  },
  {
    slug: 'west-virginia',
    state: 'West Virginia',
    priority: 'P2 state guide',
    regulator: 'West Virginia Office of Oil and Gas',
    regulatorUrl: 'https://dep.wv.gov/oil-and-gas/',
    basins: ['Marcellus Shale', 'Utica Shale'],
    pillar: 'West Virginia Mineral Rights Owner Article',
    metaDescription:
      'West Virginia mineral rights guide for owners reviewing offers, long title history, production records, royalties, and inherited interests.',
    brief:
      'Center on long title histories, severed interests, county records, operator data, royalty statements, and inherited mineral questions.',
  },
  {
    slug: 'ohio',
    state: 'Ohio',
    priority: 'P2 state guide',
    regulator: 'Ohio Department of Natural Resources',
    regulatorUrl: 'https://ohiodnr.gov/',
    basins: ['Utica Shale', 'Point Pleasant'],
    pillar: 'Ohio Mineral Rights Owner Article',
    metaDescription:
      'Ohio mineral rights guide for Utica owners comparing offers, division orders, lease terms, royalty checks, and public well records.',
    brief:
      'Cover Utica activity, lease/division-order records, ODNR data, inherited ownership, and offer review next steps.',
  },
  {
    slug: 'louisiana',
    state: 'Louisiana',
    priority: 'P2 state guide',
    regulator: 'Louisiana Department of Energy and Natural Resources',
    regulatorUrl: 'https://www.dnr.louisiana.gov/',
    basins: ['Haynesville Shale', 'Austin Chalk'],
    pillar: 'Louisiana Mineral Rights Owner Article',
    metaDescription:
      'Louisiana mineral rights guide for owners comparing offers, parish records, unit data, royalty statements, and production context.',
    brief:
      'Use Louisiana/parish terminology, unit and production context, DNR records, title documents, and royalty-check questions. Avoid Louisiana legal advice.',
  },
];

export const contentGeniusClusterBriefs: ContentGeniusClusterBrief[] = [
  {
    id: 'sell-process',
    pillar: '/sell-mineral-rights/',
    intent: 'BOFU',
    title: 'How to sell mineral rights without pressure',
    pages: [
      '/blog/how-to-sell-mineral-rights-in-texas/',
      '/blog/how-the-step-by-step-process-of-selling-texas-mineral-rights-works/',
      '/blog/how-long-does-it-take-to-sell-mineral-rights-in-texas/',
      '/blog/closing-costs-and-fees-when-selling-mineral-rights-in-texas/',
    ],
    answerFirstBlock:
      'Selling mineral rights starts with organizing ownership, lease, division-order, royalty, and offer documents, then comparing the assumptions behind any written offer before deciding whether to proceed.',
  },
  {
    id: 'value-methodology',
    pillar: '/mineral-rights-value/',
    intent: 'BOFU',
    title: 'Mineral rights value and underwriter methodology',
    pages: [
      '/blog/how-are-mineral-rights-valued/',
      '/blog/how-texas-mineral-rights-are-valued-producing-vs-non-producing-interests/',
      '/blog/how-oil-price-fluctuations-affect-texas-mineral-rights-values/',
      '/methodology/',
    ],
    answerFirstBlock:
      'Mineral rights value is directional until ownership, production history, lease terms, operator context, commodity assumptions, and title questions are reviewed together.',
  },
  {
    id: 'competing-offers',
    pillar: '/offer-review/',
    intent: 'BOFU',
    title: 'Competing offers and buyer comparison',
    pages: [
      '/blog/how-to-compare-mineral-rights-buyers-in-texas/',
      '/blog/what-to-do-when-you-have-competing-offers-on-your-mineral-rights-a-guide/',
      '/blog/signs-of-a-fair-mineral-rights-offer/',
      '/blog/texas-mineral-rights-valuation-vs-predatory-offers-what-to-know/',
    ],
    answerFirstBlock:
      'A mineral-rights offer should be compared by assumptions, deductions, title contingencies, closing timing, buyer disclosures, and written terms rather than the headline number alone.',
  },
  {
    id: 'inheritance-probate',
    pillar: '/inherited-mineral-rights/',
    intent: 'MOFU',
    title: 'Inherited mineral rights and probate questions',
    pages: [
      '/blog/mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling/',
      '/blog/what-happens-to-mineral-rights-in-probate/',
      '/blog/understanding-royalty-checks-after-inheriting-mineral-rights/',
      '/blog/managing-mineral-interests-in-estate-planning-explained/',
    ],
    answerFirstBlock:
      'Inherited mineral rights usually require gathering probate, deed, division-order, lease, and royalty information before an owner can compare options clearly.',
  },
  {
    id: 'tax-1031',
    pillar: '/1031-exchanger/',
    intent: 'MOFU',
    title: '1031 and tax-sensitive sale questions',
    pages: [
      '/blog/1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work/',
      '/blog/1031-exchange-for-mineral-rights-in-texas-explained/',
      '/blog/capital-gains-tax-on-mineral-rights-sales-in-texas-what-sellers-need-to-know/',
      '/blog/how-to-report-a-mineral-rights-sale-on-your-federal-tax-return/',
    ],
    answerFirstBlock:
      'A 1031 exchange or tax-sensitive sale question should be routed to a qualified tax professional; MRX can help organize transaction facts and questions before that conversation.',
  },
  {
    id: 'royalty-production',
    pillar: '/learning-center/',
    intent: 'TOFU',
    title: 'Royalty checks, production data, and public records',
    pages: [
      '/blog/how-to-interpret-your-mineral-rights-royalty-checks/',
      '/blog/how-royalty-payments-work-for-texas-mineral-rights-owners/',
      '/blog/texas-railroad-commission-how-to-use-public-records-to-understand-your-mineral-rights/',
      '/blog/texas-oil-and-gas-production-by-county-what-mineral-rights-owners-should-know/',
    ],
    answerFirstBlock:
      'Royalty checks and public production records help explain current activity, but they do not settle title, lease interpretation, future drilling, or transaction value by themselves.',
  },
];
