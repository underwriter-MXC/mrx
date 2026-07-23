import disallowed from '../../../compliance/disallowed.json';

const longDash = /\s*[\u2014\u2013]\s*/g;
const visibleSeparator = /(^|\s)---(?=\s|$)/g;

export const SAFE_RUNTIME_COMPLIANCE_TEXT =
  "MRX cannot share a specific value or guarantee here. Reply with what you'd like the underwriter to review.";

const NEGATION_TOKENS = [
  'not ',
  "isn't",
  'isnt',
  'no,',
  'no.',
  'no ',
  'never',
  "aren't",
  'arent',
  'without',
  'rather than',
  'versus the',
  'vs. the',
  'vs the',
  'or a ',
  'or an ',
  'nor a ',
];

const disallowedPhrases = (disallowed as { phrases: string[] }).phrases.map((phrase) =>
  phrase.toLowerCase(),
);

const runtimeRegexes: Array<{ label: string; pattern: RegExp }> = [
  {
    label: 'specific_value_claim',
    pattern: /\b(?:worth|value|valuation|price|offer|cash|pay)\b[^\n.?!]{0,40}\$\d{2,}/gi,
  },
  {
    label: 'specific_value_claim',
    pattern:
      /\$\d{2,}(?:[\d,]*(?:\.\d{2})?)?[^\n.?!]{0,40}\b(?:for your mineral|mineral rights|guaranteed|guarantee|offer)\b/gi,
  },
  { label: 'guaranteed_highest', pattern: /\bguaranteed\s+(?:highest|best|price|offer|value)\b/gi },
  { label: 'best_price', pattern: /\b(?:best|highest)\s+price\b/gi },
  { label: 'urgency', pattern: /\b(?:act\s+now|expires\s+today)\b/gi },
];

function isDenialContext(text: string, matchIndex: number) {
  const windowStart = Math.max(0, matchIndex - 30);
  const window = text.slice(windowStart, matchIndex).toLowerCase();
  return NEGATION_TOKENS.some((token) => window.includes(token));
}

export function normalizeMrxText(value: string) {
  return value
    .replace(longDash, ', ')
    .replace(visibleSeparator, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export function hasProhibitedMrxCopy(value: string) {
  return /[\u2014\u2013]/.test(value) || /(^|\s)---(?=\s|$)/m.test(value);
}

export function runtimeComplianceCheck(value: string) {
  const text = normalizeMrxText(value);
  if (!text) return { flagged: false, safeText: SAFE_RUNTIME_COMPLIANCE_TEXT };
  const lower = text.toLowerCase();

  for (const phrase of disallowedPhrases) {
    let index = lower.indexOf(phrase);
    while (index !== -1) {
      if (!isDenialContext(lower, index)) {
        return {
          flagged: true,
          match: phrase,
          source: 'lexicon',
          safeText: SAFE_RUNTIME_COMPLIANCE_TEXT,
        };
      }
      index = lower.indexOf(phrase, index + phrase.length);
    }
  }

  for (const { label, pattern } of runtimeRegexes) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      if (!isDenialContext(text, match.index)) {
        return {
          flagged: true,
          match: match[0],
          source: label,
          safeText: SAFE_RUNTIME_COMPLIANCE_TEXT,
        };
      }
      match = pattern.exec(text);
    }
  }

  return { flagged: false, safeText: SAFE_RUNTIME_COMPLIANCE_TEXT };
}
