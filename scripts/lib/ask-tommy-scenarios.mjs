const states = [
  ...Array(40).fill(['Texas', 'Reeves']),
  ...Array(8).fill(['New Mexico', 'Lea']),
  ...Array(8).fill(['Oklahoma', 'Kingfisher']),
  ...Array(7).fill(['North Dakota', 'McKenzie']),
  ...Array(7).fill(['Colorado', 'Weld']),
  ...Array(6).fill(['Wyoming', 'Campbell']),
  ...Array(6).fill(['Pennsylvania', 'Washington']),
  ...Array(6).fill(['West Virginia', 'Doddridge']),
  ...Array(6).fill(['Ohio', 'Belmont']),
  ...Array(6).fill(['Louisiana', 'DeSoto']),
];

const profiles = [
  'estate_heir',
  'confused_inheritor',
  'suspicious_seller',
  'cash_strapped_owner',
  'suspense_funds_owner',
  'exchange_1031_owner',
  'reluctant_environmentalist',
  'multi_state_inheritor',
];

const categories = [
  ...Array(20).fill('offer_review'),
  ...Array(20).fill('inheritance_estate'),
  ...Array(15).fill('royalty_decline'),
  ...Array(15).fill('ownership_records'),
  ...Array(10).fill('geology'),
  ...Array(10).fill('legal_tax_routing'),
  ...Array(10).fill('scheduling_follow_up'),
];

const consentPatterns = [
  { email: true, sms: true, aiVoice: true },
  { email: true, sms: false, aiVoice: false },
  { email: false, sms: true, aiVoice: false },
  { email: false, sms: false, aiVoice: true },
  { email: true, sms: false, aiVoice: true },
  { email: false, sms: false, aiVoice: false },
];

const prompts = {
  offer_review: 'I received an offer for my mineral rights. What should I check before I respond?',
  inheritance_estate:
    'I inherited mineral rights and do not know what paperwork or ownership I have. Where should I start?',
  royalty_decline:
    'My royalty checks are getting smaller. How do I tell whether production is declining?',
  ownership_records: 'How can I confirm what mineral rights I actually own in the county records?',
  geology: 'What can the basin and nearby drilling activity tell me about this property?',
  legal_tax_routing: 'Do I need a lawyer or tax professional before I sign a mineral-rights sale?',
  scheduling_follow_up:
    'I want to talk with someone at MRX about my mineral rights and next steps.',
};

export function buildAskTommyScenarios(runId = '00000000-0000-4000-8000-000000000100') {
  return Array.from({ length: 100 }, (_, index) => {
    const ordinal = index + 1;
    const padded = String(ordinal).padStart(3, '0');
    const [state, county] = states[index];
    const category = categories[index];
    return {
      runId,
      ordinal,
      firstName: `Owner${padded}`,
      lastName: `Test${padded}`,
      email: `mrx-test-${padded}@example.com`,
      phone: `+1-202-555-${String(100 + index).padStart(4, '0')}`,
      state,
      county,
      ownerProfile: profiles[index % profiles.length],
      category,
      prompt: prompts[category],
      permissions: consentPatterns[index % consentPatterns.length],
      propertyCount: index < 15 ? 2 : 1,
      correction: index >= 15 && index < 25,
      sameDeviceReturn: index >= 25 && index < 35,
      crossDeviceReturn: index >= 35 && index < 45,
      documentScenario: index >= 45 && index < 55,
      consentRevocation: index >= 55 && index < 65,
      adversarial: index >= 65 && index < 70,
      expectedGuide:
        category === 'inheritance_estate' || category === 'ownership_records'
          ? 'cooper'
          : category === 'geology'
            ? 'charlie'
            : category === 'royalty_decline'
              ? 'dale'
              : category === 'legal_tax_routing'
                ? 'rebecca'
                : category === 'scheduling_follow_up'
                  ? 'angela'
                  : 'tommy',
    };
  });
}

export function summarizeAskTommyScenarios(scenarios) {
  const countBy = (field) =>
    Object.fromEntries(
      [...new Set(scenarios.map((scenario) => scenario[field]))].map((value) => [
        value,
        scenarios.filter((scenario) => scenario[field] === value).length,
      ]),
    );
  return {
    total: scenarios.length,
    states: countBy('state'),
    profiles: countBy('ownerProfile'),
    categories: countBy('category'),
    multipleProperties: scenarios.filter((scenario) => scenario.propertyCount > 1).length,
    corrections: scenarios.filter((scenario) => scenario.correction).length,
    sameDeviceReturns: scenarios.filter((scenario) => scenario.sameDeviceReturn).length,
    crossDeviceReturns: scenarios.filter((scenario) => scenario.crossDeviceReturn).length,
    documents: scenarios.filter((scenario) => scenario.documentScenario).length,
    revocations: scenarios.filter((scenario) => scenario.consentRevocation).length,
    adversarial: scenarios.filter((scenario) => scenario.adversarial).length,
  };
}
