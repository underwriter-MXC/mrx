export type OwnerSituation = {
  slug: string;
  seoTitle: string;
  eyebrow: string;
  title: string;
  description: string;
  answerTitle: string;
  answerPoints: string[];
  prompt: string;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
};

export const ownerSituations: OwnerSituation[] = [
  {
    slug: 'estate-heir',
    seoTitle: 'Inherited Mineral Rights Through an Estate | MRX',
    eyebrow: 'Inherited mineral rights',
    title: 'Inherited mineral rights? Start by separating the estate from the asset.',
    description:
      'Organize probate records, ownership documents, counties, operators, and royalty statements before deciding what to do with inherited mineral rights.',
    answerTitle: 'Start with these facts',
    answerPoints: [
      'Who owned the interest and how the estate was handled',
      'Every state and county where an interest may exist',
      'Deeds, probate orders, division orders, and royalty statements',
      'Whether operators have transferred the owner record',
    ],
    prompt: 'I inherited mineral rights through an estate. Help me organize the first steps.',
    sections: [
      {
        title: 'Build a simple property list',
        paragraphs: [
          'One estate can include several unrelated mineral interests. List each county, operator, well, lease, payment, and document separately so one property does not get confused with another.',
        ],
      },
      {
        title: 'Confirm the ownership path',
        paragraphs: [
          'A will, probate order, deed, trust, or intestacy rule may affect the ownership path. MRX can help organize records and questions, but a licensed attorney should answer individualized probate or title questions.',
        ],
      },
    ],
  },
  {
    slug: 'confused-inheritor',
    seoTitle: 'Not Sure What Mineral Rights You Inherited? | MRX',
    eyebrow: 'A practical first step',
    title: 'Not sure what you inherited? You do not need every answer before you start.',
    description:
      'Use the names, places, checks, letters, and documents you already have to begin identifying inherited mineral rights and the next records to verify.',
    answerTitle: 'Useful clues include',
    answerPoints: [
      'The former owner’s full name and mailing addresses',
      'County names on letters, deeds, or tax records',
      'Operator names and well names from check details',
      'Any buyer offer or request for a signature',
    ],
    prompt:
      'I may have inherited mineral rights, but I do not know what I own. Help me sort out the clues.',
    sections: [
      {
        title: 'Begin with the records in front of you',
        paragraphs: [
          'A royalty statement, old deed, probate file, tax notice, or buyer letter can point to a county and operator. Keep the original document private and make a list of the facts it contains.',
        ],
      },
      {
        title: 'Do not assume the buyer’s description is complete',
        paragraphs: [
          'An offer can be a clue, but it is not proof of the full ownership. Compare it with public records and operator records before relying on it.',
        ],
      },
    ],
  },
  {
    slug: 'suspicious-seller',
    seoTitle: 'Check a Mineral Rights Offer for Hidden Changes | MRX',
    eyebrow: 'Review before responding',
    title: 'Concerned an offer may change later? Check the adjustment language first.',
    description:
      'Review what a mineral-rights buyer can change after title review, how the price may be adjusted, and what happens if the headline number is reduced.',
    answerTitle: 'Look closely at',
    answerPoints: [
      'Net-acre and ownership assumptions',
      'Price-adjustment and title-defect provisions',
      'Option, exclusivity, and termination rights',
      'What must be returned if the deal changes',
    ],
    prompt: 'I am suspicious of a mineral-rights offer. Help me identify bait-and-switch risks.',
    sections: [
      {
        title: 'Compare the process, not only the number',
        paragraphs: [
          'Ask when the price becomes binding, what information can change it, who controls the calculation, and whether you can walk away if the terms change.',
        ],
      },
      {
        title: 'Keep a written record',
        paragraphs: [
          'Save every version of the offer and every written explanation. A qualified attorney should review contract terms and advise you about your rights.',
        ],
      },
    ],
  },
  {
    slug: 'cash-strapped-owner',
    seoTitle: 'Selling Mineral Rights When Timing Matters | MRX',
    eyebrow: 'A time-sensitive decision',
    title: 'Need cash from mineral rights? Compare speed, certainty, and what you give up.',
    description:
      'Organize current royalties, urgent timing, offer terms, taxes, and alternatives before making a mineral-rights sale under pressure.',
    answerTitle: 'Compare these tradeoffs',
    answerPoints: [
      'Net proceeds and realistic closing timing',
      'Current royalties and possible future production',
      'Title issues that could delay or reduce payment',
      'Tax and estate questions for licensed advisers',
    ],
    prompt: 'I may need to sell mineral rights quickly. Help me compare the practical tradeoffs.',
    sections: [
      {
        title: 'State the deadline clearly',
        paragraphs: [
          'A buyer’s fastest promised closing may not be the most certain. Ask what records are still required, whether title review is complete, and what conditions remain.',
        ],
      },
      {
        title: 'Separate information from pressure',
        paragraphs: [
          'MRX can help organize facts and questions. It does not provide certified appraisals, tax advice, or legal advice.',
        ],
      },
    ],
  },
  {
    slug: 'suspense-funds',
    seoTitle: 'Mineral Royalty Funds in Suspense | MRX',
    eyebrow: 'Unpaid or suspended royalties',
    title: 'Royalty funds in suspense? Find the stated reason before assuming the fix.',
    description:
      'Use operator notices, pay statements, owner numbers, and title records to understand why mineral royalty funds may be held in suspense.',
    answerTitle: 'Gather these items',
    answerPoints: [
      'Operator and owner number',
      'Well, lease, and county information',
      'The operator’s stated suspense reason',
      'Probate, deed, tax, or identity documents requested',
    ],
    prompt: 'My royalty funds may be in suspense. Help me understand what to ask the operator.',
    sections: [
      {
        title: 'Ask the operator for the exact code or reason',
        paragraphs: [
          'Suspense can involve title, probate, address, tax, banking, ownership, or other issues. The operator’s written explanation is the best starting point.',
        ],
      },
      {
        title: 'Protect sensitive records',
        paragraphs: [
          'Verify the operator’s contact details independently before sending identity, tax, or banking documents. MRX does not need banking credentials to help organize the issue.',
        ],
      },
    ],
  },
  {
    slug: '1031-exchange',
    seoTitle: '1031 Exchange and Mineral Rights Questions | MRX',
    eyebrow: 'Tax questions need licensed advice',
    title:
      'Considering a 1031 exchange involving mineral rights? Confirm eligibility before acting.',
    description:
      'A neutral checklist for mineral owners preparing to ask qualified tax and legal advisers about eligibility, timing, and a possible Section 1031 exchange.',
    answerTitle: 'Confirm with licensed advisers',
    answerPoints: [
      'Whether the property and transaction may qualify',
      'Identification and closing deadlines',
      'Qualified intermediary requirements',
      'Ownership, entity, debt, and related-party issues',
    ],
    prompt:
      'I am considering a 1031 exchange involving mineral rights. Help me prepare questions for my tax and legal advisers.',
    sections: [
      {
        title: 'Do not rely on a buyer’s tax promise',
        paragraphs: [
          'Eligibility depends on the facts, current law, and transaction structure. MRX can help prepare a question list, but only licensed tax and legal advisers should guide the transaction.',
        ],
      },
      {
        title: 'Timing can matter',
        paragraphs: [
          'Discuss the possible exchange before signing or closing. Ask qualified advisers about current deadlines and documentation rather than relying on website summaries.',
        ],
      },
    ],
  },
  {
    slug: 'reluctant-environmentalist',
    seoTitle: 'Environmental Questions About Mineral Rights | MRX',
    eyebrow: 'Understand the decision',
    title: 'Concerned about environmental impact? Separate ownership, leasing, and operations.',
    description:
      'Understand what a mineral interest, lease, royalty, and surface right may control before making a values-based mineral-rights decision.',
    answerTitle: 'Questions to organize',
    answerPoints: [
      'Whether you own minerals, surface, or both',
      'Existing leases and operator rights',
      'Current wells, permits, and development status',
      'Which decisions are still within your control',
    ],
    prompt:
      'I have environmental concerns about my mineral rights. Help me understand what decisions I can actually make.',
    sections: [
      {
        title: 'Start with the existing rights',
        paragraphs: [
          'Selling, keeping, or leasing a mineral interest does not automatically determine every future operating decision. Existing leases and separate surface ownership can change what is within an owner’s control.',
        ],
      },
      {
        title: 'Use the right specialist',
        paragraphs: [
          'Public permit records, lease documents, and site-specific legal advice may all be needed. Charlie can explain geological context, while Rebecca can help route legal questions to a licensed professional.',
        ],
      },
    ],
  },
  {
    slug: 'multi-state-inheritor',
    seoTitle: 'Inherited Mineral Rights in Multiple States | MRX',
    eyebrow: 'More than one state or county',
    title: 'Inherited minerals in several places? Treat each interest as its own file.',
    description:
      'Organize multi-state inherited mineral rights without mixing counties, operators, probate requirements, title questions, documents, or purchase offers.',
    answerTitle: 'Track each interest separately',
    answerPoints: [
      'State, county, legal description, and former owner',
      'Operator, lease, wells, and royalty payments',
      'Probate or transfer status in that jurisdiction',
      'Offers and documents tied to only that interest',
    ],
    prompt:
      'I inherited mineral rights in more than one state. Help me organize the properties separately.',
    sections: [
      {
        title: 'One owner can have several different cases',
        paragraphs: [
          'Each county and state can involve different records, operators, title issues, and deadlines. Keep a separate property record while linking everything to the same verified owner account.',
        ],
      },
      {
        title: 'Do not apply one offer to every property',
        paragraphs: [
          'Development, production, lease terms, ownership, and market activity can vary widely. Compare each property using its own facts.',
        ],
      },
    ],
  },
];
