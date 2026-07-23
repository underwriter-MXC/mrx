const gates = [
  ['MRX_LEGAL_SIGNOFF_1031', '1031 claims'],
  ['MRX_LEGAL_SIGNOFF_AI_VOICE', 'GHL Voice AI consent'],
  ['MRX_LEGAL_SIGNOFF_RECORDING', 'call recording disclosures'],
  ['MRX_LEGAL_SIGNOFF_SELLER_BUYER', 'seller and buyer positioning'],
  ['MRX_EDITORIAL_SIGNOFF_UNDERWRITER_FAIR_VALUE', 'underwriter and fair-value claims'],
];

const enforcementEnabled = process.env.MRX_ENFORCE_LEGAL_SIGNOFFS === 'true';

if (!enforcementEnabled) {
  console.log('Legal release gates are not enforced.');
  process.exit(0);
}

const required = gates;
const format = /^approved:[^:]+:\d{4}-\d{2}-\d{2}$/;
const missing = required.filter(([key]) => !format.test(process.env[key] || ''));

if (missing.length) {
  console.error(
    'Production release blocked. Add counsel or editorial approval receipts in the format approved:reviewer-id:YYYY-MM-DD for:',
  );
  for (const [key, label] of missing) console.error(`- ${label} (${key})`);
  process.exit(1);
}

console.log(`Legal release gates approved: ${required.length}.`);
