import type { GeographyResolution } from './geography';
import { normalizeMrxText } from './style';

export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

const retryRequest =
  /^(?:(?:please\s+)?(?:answer|respond to)\s+(?:my|the)\s+(?:question|original question)|you (?:did not|didn'?t|haven'?t) answer(?: my question)?|that (?:did not|didn'?t) answer(?: my question)?|try again|what did i ask)\??[.!]?$/i;

export function isAnswerRetry(message: string) {
  return retryRequest.test(message.trim());
}

export function questionForAnswer(message: string, history: ConversationTurn[] = []) {
  const current = message.trim();
  if (!isAnswerRetry(current)) return current;
  return (
    [...history]
      .reverse()
      .find((turn) => turn.role === 'user' && !isAnswerRetry(turn.content) && turn.content.trim())
      ?.content.trim() ?? current
  );
}

function regionalBasinAnswer(question: string) {
  const normalized = question.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ');
  if (/\bodessa\b/.test(normalized) && /\b(?:tx|texas)\b/.test(normalized)) {
    return 'Odessa is in the broader Permian Basin region. A city location is not precise enough to place a mineral tract within a Permian sub-basin or platform, so I would need the property address, coordinates, or legal description to narrow it down. What exact property location do you have?';
  }
  if (/\bmidland\b/.test(normalized) && /\b(?:tx|texas)\b/.test(normalized)) {
    return 'Midland is in the broader Permian Basin region and is commonly associated with the Midland Basin. The exact mineral tract still needs to be mapped before assigning a sub-basin. What property address, coordinates, or legal description do you have?';
  }
  if (/\bcarlsbad\b/.test(normalized) && /\b(?:nm|new mexico)\b/.test(normalized)) {
    return 'Carlsbad is in the Permian Basin region, commonly associated with the Delaware Basin area. The exact mineral tract still needs to be mapped before assigning a sub-basin. What property address, coordinates, or legal description do you have?';
  }
  if (/\bwilliston\b/.test(normalized) && /\b(?:nd|north dakota)\b/.test(normalized)) {
    return 'Williston is in the Williston Basin region. A city location is still too broad to map a particular mineral tract or formation. What property address, coordinates, or legal description do you have?';
  }
  return null;
}

export function fallbackConversationAnswer(
  message: string,
  geography?: GeographyResolution | null,
  history: ConversationTurn[] = [],
) {
  const question = questionForAnswer(message, history);
  const lower = question.toLowerCase();
  const asksAboutBasin = /\b(?:basin|geolog(?:y|ic)|formation|shale play)\b/i.test(question);

  if (asksAboutBasin) {
    const regionalAnswer = regionalBasinAnswer(question);
    if (regionalAnswer) return normalizeMrxText(regionalAnswer);
    if (geography?.basin) {
      const place = [
        geography.city,
        geography.county ? `${geography.county} County` : null,
        geography.state,
      ]
        .filter(Boolean)
        .join(', ');
      return normalizeMrxText(
        `${place || 'That property point'} maps to the ${geography.basin}. The basin supplies geologic context, while the county and state remain the legal recording jurisdiction. Does that match the property location you meant?`,
      );
    }
    if (geography?.city || geography?.county || geography?.state) {
      const place = [
        geography.city,
        geography.county ? `${geography.county} County` : null,
        geography.state,
      ]
        .filter(Boolean)
        .join(', ');
      return normalizeMrxText(
        `${place || 'That location'} is not precise enough to assign a basin to a mineral tract reliably. A property address, coordinate, or mapped legal description will let me answer without guessing. What exact property location do you have?`,
      );
    }
    return normalizeMrxText(
      'I can identify the basin once I can place the mineral tract, but a broad city or county can cross geologic boundaries. What property address, coordinates, or legal description do you have?',
    );
  }

  if (geography?.basin) {
    const place = [
      geography.city,
      geography.county ? `${geography.county} County` : null,
      geography.state,
    ]
      .filter(Boolean)
      .join(', ');
    return normalizeMrxText(
      `${place || 'That property point'} maps to the ${geography.basin}. The basin supplies geologic context, while the county and state remain the legal recording jurisdiction. Does that match the property location you meant?`,
    );
  }

  if (geography?.status === 'ambiguous' && geography.counties.length > 1) {
    const countyNames = geography.counties.map((county) => `${county.name} County`).join(', ');
    return normalizeMrxText(
      `${geography.city || 'That place'} crosses ${countyNames}, so city and state alone cannot identify the exact county. Pinning down the address, ZIP code, parcel reference, or coordinates keeps the right records with your profile. What more exact location do you have?`,
    );
  }
  if (geography?.status === 'resolved' && geography.county && geography.state) {
    const place = geography.city ? `${geography.city}, ${geography.state}` : geography.state;
    return normalizeMrxText(
      `I located that in ${geography.county} County, ${place}. Saving this geography with the ${geography.scope === 'residence' ? 'profile' : 'mineral interest'} keeps future documents and questions tied to the right property. Does that match what you expected?`,
    );
  }
  if (geography?.status === 'needs_detail' && geography.note) {
    return normalizeMrxText(
      `${geography.note} One more location detail now will keep MRX from attaching the wrong county to your records. What county, principal meridian, parcel reference, address, or coordinates are shown?`,
    );
  }
  if (/\bdivision order\b/i.test(question)) {
    return normalizeMrxText(
      'A division order tells the operator or payor how your decimal share of production revenue should be paid. It is not a new mineral lease, but the ownership and decimal shown should be checked before you sign. What decimal interest does yours list?',
    );
  }
  if (/\bnet mineral acres?\b|\bnma\b/i.test(question)) {
    return normalizeMrxText(
      'Net mineral acres are the gross tract acres multiplied by the fraction of minerals you own. For example, owning one quarter of the minerals under 40 acres equals 10 net mineral acres. What tract size and ownership fraction are shown in your records?',
    );
  }
  if (/\broyalty decimal\b|\bdecimal interest\b/i.test(question)) {
    return normalizeMrxText(
      'A royalty decimal is the share of a well’s revenue credited to you before any allowed adjustments. It usually reflects your acreage, ownership fraction, lease royalty, and the spacing unit. What decimal appears on the statement or division order?',
    );
  }
  if (/\binherit/i.test(lower)) {
    return normalizeMrxText(
      'Start by confirming what the estate or deed conveyed and where the interest is recorded, because inherited ownership can pass in fractions. What state and county are the mineral rights in?',
    );
  }
  if (/\boffer|buyer|bid\b/i.test(lower)) {
    return normalizeMrxText(
      'Compare the complete offer, not only the headline price, because the exact rights conveyed and the obligations that survive closing can materially change the deal. What state and county are the mineral rights in?',
    );
  }
  if (/\broyalt|declin|production|check\b/i.test(lower)) {
    return normalizeMrxText(
      'A smaller royalty check can come from lower production, lower commodity prices, downtime, a changed decimal, or new deductions, so the statement details matter. What changed between the last two statements?',
    );
  }
  if (/\bworth|value|valuation\b/i.test(lower)) {
    return normalizeMrxText(
      'Mineral value usually depends on exact location, net ownership, lease terms, current production, nearby development, and the specific rights described in the documents. What state and county are the mineral rights in?',
    );
  }
  if (/\bsell|selling|hold\b/i.test(lower)) {
    return normalizeMrxText(
      'Whether selling makes sense depends on your goals, the complete offer terms, current income, taxes, and the development you would give up, so there is no one right answer for every owner. What state and county are the mineral rights in?',
    );
  }
  if (/\btax|capital gains|1031\b/i.test(lower)) {
    return normalizeMrxText(
      'Mineral transactions can create federal and state tax consequences, and the result depends on how you acquired the interest and how the deal is structured. A qualified tax professional should apply the rules to your facts. Are you asking about a sale, lease bonus, or royalty income?',
    );
  }
  if (/\bcontract|clause|agreement|warranty|clawback\b/i.test(lower)) {
    return normalizeMrxText(
      'The exact wording matters because a short clause can change what is conveyed, when payment is due, or what you promise after closing. I can explain the general language, but a state-qualified attorney should advise you on signing it. What exact clause are you looking at?',
    );
  }
  return normalizeMrxText(
    'I want to answer the mineral-rights question directly, but I need one concrete detail to avoid guessing. What state and county is the interest in, or what exact document language are you looking at?',
  );
}
