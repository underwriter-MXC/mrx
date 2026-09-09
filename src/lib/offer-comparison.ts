export type InterestType = '' | 'mineral' | 'royalty' | 'unknown';
export interface OfferInput {
  interestType: InterestType;
  total: string;
  acres: string;
  property: string;
  adjustments: string;
  diligence: string;
  closing: string;
  effective: string;
  notes: string;
}

function positiveNumber(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function known(value: string): boolean {
  return (
    Boolean(value.trim()) &&
    !/^(unknown|unclear|not sure|i don't know|i don’t know|\?)$/i.test(value.trim())
  );
}

export function compareOffer(input: OfferInput) {
  const total = positiveNumber(input.total);
  const acres = positiveNumber(input.acres);
  const questions: string[] = [];
  if (!input.interestType || input.interestType === 'unknown') {
    questions.push('Which kind of interest does this offer describe?');
  }
  if (total === null) questions.push('What is the positive headline total in the written offer?');
  if (input.interestType === 'mineral' && acres === null) {
    questions.push('How many net mineral acres does the written offer assume?');
  }
  if (input.interestType === 'royalty') {
    questions.push('Which royalty interest, decimal or acreage convention does the offer use?');
  }
  if (input.property.trim().toLowerCase() !== 'yes')
    questions.push('Which property, depths and retained rights are included?');
  if (!known(input.adjustments))
    questions.push('Who may adjust the price, and under which written conditions?');
  if (!known(input.diligence))
    questions.push('What diligence period and extension terms are stated?');
  if (!known(input.closing)) questions.push('What must happen before payment is final?');
  if (!known(input.effective))
    questions.push('What effective date applies, and who receives intervening payments?');
  if (!known(input.notes))
    questions.push('Are any other obligations stated? Record “none stated” only after checking.');
  const calculated =
    input.interestType === 'mineral' && total !== null && acres !== null ? total / acres : null;
  return {
    perAcre: calculated !== null && Number.isFinite(calculated) ? calculated : null,
    questions,
    calculationNote:
      calculated !== null && Number.isFinite(calculated)
        ? 'Stated offer total divided by stated net mineral acres.'
        : input.interestType === 'royalty'
          ? 'Per-net-mineral-acre calculation does not apply to this royalty selection.'
          : 'Select mineral interest and enter a positive total and stated net mineral acres.',
  };
}

export type ComparisonAction =
  | 'started'
  | 'questions_viewed'
  | 'print_requested'
  | 'review_selected';
export function comparisonEvent(action: ComparisonAction) {
  return {
    event: 'offer_comparison_' + action,
    tool_version: '2026-09-09',
    page_path: '/mineral-rights-offer-comparison/',
  };
}
