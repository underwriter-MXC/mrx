export type OwnerQuestionIntent =
  | 'offer'
  | 'inheritance'
  | 'royalty'
  | 'ownership'
  | 'lease'
  | 'sell_or_hold'
  | 'location'
  | 'value';

export type SuggestionCopyVariant = 'benefit-led' | 'outcome-led';

export type BenefitSuggestion = {
  intent: OwnerQuestionIntent;
  question: string;
  benefit: string;
};

const intentPatterns: Array<[OwnerQuestionIntent, RegExp]> = [
  ['offer', /\b(offer|buyer|bid|purchase agreement|contract|lowball|fair price)\b/i],
  ['inheritance', /\b(inherit|inherited|heir|estate|probate|executor|trust)\b/i],
  ['royalty', /\b(royalty|royalties|check|statement|payment|decimal|deduction)\b/i],
  ['ownership', /\b(own|ownership|title|deed|conveyance|division order|recorded)\b/i],
  ['lease', /\b(lease|leasing|bonus|shut-in|held by production|pooling)\b/i],
  ['sell_or_hold', /\b(sell|selling|hold|keep|partial sale)\b/i],
  ['location', /\b(county|state|where|location|basin|well|production record)\b/i],
];

const suggestions: Record<
  OwnerQuestionIntent,
  { question: string; benefitLed: string; outcomeLed: string }
> = {
  offer: {
    question: 'What should I compare besides the headline offer amount?',
    benefitLed:
      'You’ll get a practical checklist for adjustments, deed scope, timing, costs, and closing terms that can change the real comparison.',
    outcomeLed:
      'Build a side-by-side offer comparison that shows which terms can change your net result before you respond.',
  },
  inheritance: {
    question: 'Which inherited mineral-rights documents should I find first?',
    benefitLed:
      'You’ll leave with a prioritized record list for authority, county title, payor history, and any missing professional questions.',
    outcomeLed:
      'Turn a scattered inheritance file into an ordered checklist an underwriter can review without making you start over.',
  },
  royalty: {
    question: 'What should I compare across my last three royalty statements?',
    benefitLed:
      'You’ll see which production, price, decimal, deduction, and adjustment fields can explain a payment change.',
    outcomeLed:
      'Create a clean royalty trend check that separates a one-time statement change from a pattern worth investigating.',
  },
  ownership: {
    question: 'Which records can help verify what mineral interest I actually own?',
    benefitLed:
      'You’ll get an evidence path from deeds and probate records to leases, division orders, and payor information.',
    outcomeLed:
      'Organize the ownership chain before value or offer questions distract from a possible title gap.',
  },
  lease: {
    question: 'Which lease terms should I identify before comparing my options?',
    benefitLed:
      'You’ll get a focused list of royalty, term, pooling, depth, deduction, and held-by-production provisions to locate.',
    outcomeLed:
      'Create a lease-term snapshot that makes later royalty, ownership, and offer questions easier to compare.',
  },
  sell_or_hold: {
    question: 'How can I compare selling, holding, or selling only part?',
    benefitLed:
      'You’ll get a neutral decision frame for current cash, future uncertainty, retained upside, transaction terms, and owner priorities.',
    outcomeLed:
      'Build a sell-versus-hold record that keeps the decision in your hands and exposes the assumptions behind each path.',
  },
  location: {
    question: 'Which public records should I check for this county and state?',
    benefitLed:
      'You’ll learn where production context comes from, what county records may establish, and which gaps public data cannot resolve.',
    outcomeLed:
      'Create a location-specific research path without treating public well data as proof of title or future value.',
  },
  value: {
    question: 'Which facts have the biggest effect on a directional value range?',
    benefitLed:
      'You’ll get a prioritized list covering ownership, production, lease economics, nearby activity, market assumptions, and uncertainty.',
    outcomeLed:
      'Build a value-driver checklist that shows what is known, what is assumed, and what could materially move the range.',
  },
};

export function classifyOwnerQuestion(question: string): OwnerQuestionIntent {
  return intentPatterns.find(([, pattern]) => pattern.test(question))?.[0] ?? 'value';
}

export function getBenefitSuggestion(
  question: string,
  variant: SuggestionCopyVariant,
): BenefitSuggestion {
  const intent = classifyOwnerQuestion(question);
  const suggestion = suggestions[intent];
  return {
    intent,
    question: suggestion.question,
    benefit: variant === 'benefit-led' ? suggestion.benefitLed : suggestion.outcomeLed,
  };
}

export function normalizeSuggestionCopyVariant(value: string | null): SuggestionCopyVariant | null {
  return value === 'benefit-led' || value === 'outcome-led' ? value : null;
}
