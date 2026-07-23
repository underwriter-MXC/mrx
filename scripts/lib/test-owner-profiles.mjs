export const TEST_OWNER_COUNT = 10;

export const TEST_OWNER_INTERESTS = [
  {
    label: 'Panther B Unit #D 1H',
    propertyReference: 'TX1034001',
    state: 'Texas',
    county: 'Dawson',
    operator: 'Laguna Resources',
    leaseName: 'Panther B Unit #D 1H',
    wellNames: ['Panther B Unit #D 1H'],
    ownershipType: 'royalties_only',
    royaltyDecimal: 0.00105976,
    producingStatus: 'yes',
    productionMonth: '2026-05',
    ownerNetVolume: 7.43,
    ownerGrossValue: 799.87,
    severanceTax: 36.79,
    regulatoryFee: 0.04,
    recentPaymentNet: 763.04,
    unknownFields: ['Net mineral acres owned', 'Gross acres under lease', 'Lease status'],
  },
  {
    label: 'Panther C Unit #D 2H',
    propertyReference: 'TX1035002',
    state: 'Texas',
    county: 'Dawson',
    operator: 'Laguna Resources',
    leaseName: 'Panther C Unit #D 2H',
    wellNames: ['Panther C Unit #D 2H'],
    ownershipType: 'royalties_only',
    royaltyDecimal: 0.00038124,
    producingStatus: 'yes',
    productionMonth: '2026-05',
    ownerNetVolume: 1.17,
    ownerGrossValue: 125.66,
    severanceTax: 5.78,
    regulatoryFee: 0.01,
    recentPaymentNet: 119.87,
    unknownFields: ['Net mineral acres owned', 'Gross acres under lease', 'Lease status'],
  },
  {
    label: 'Panther D Unit #D 3H',
    propertyReference: 'TX1036003',
    state: 'Texas',
    county: 'Dawson',
    operator: 'Laguna Resources',
    leaseName: 'Panther D Unit #D 3H',
    wellNames: ['Panther D Unit #D 3H'],
    ownershipType: 'royalties_only',
    royaltyDecimal: 0.00022329,
    producingStatus: 'yes',
    productionMonth: '2026-05',
    ownerNetVolume: 1.3,
    ownerGrossValue: 139.84,
    severanceTax: 6.43,
    regulatoryFee: 0.01,
    recentPaymentNet: 133.4,
    unknownFields: ['Net mineral acres owned', 'Gross acres under lease', 'Lease status'],
  },
];

export const TEST_STATEMENT_TOTALS = {
  ownerGrossValue: 1065.37,
  deductions: 49.06,
  ownerNetValue: 1016.31,
};

export function buildTestOwnerProfiles() {
  return Array.from({ length: TEST_OWNER_COUNT }, (_, index) => {
    const sequence = String(index + 1).padStart(2, '0');
    return {
      ordinal: index + 1,
      firstName: `Dawson${sequence}`,
      lastName: 'TEST',
      displayName: `Dawson${sequence} TEST`,
      email: `mrx-dawson-${sequence}-test@example.com`,
      phone: `+143255501${String(index + 1).padStart(2, '0')}`,
      fixtureFileName: `dawson${sequence}-mrx-test-data.pdf`,
    };
  });
}

export function assessmentDetails(interest) {
  return [
    'Staging-only TEST case based on approved operator-reported May 2026 facts.',
    `Owner net volume: ${interest.ownerNetVolume.toFixed(2)} BBL.`,
    `Owner gross value: $${interest.ownerGrossValue.toFixed(2)}.`,
    `Severance tax: $${interest.severanceTax.toFixed(2)}.`,
    `Regulatory fee: $${interest.regulatoryFee.toFixed(2)}.`,
    `Net property payment: $${interest.recentPaymentNet.toFixed(2)}.`,
    `Three-interest statement net: $${TEST_STATEMENT_TOTALS.ownerNetValue.toFixed(2)}.`,
  ].join(' ');
}
