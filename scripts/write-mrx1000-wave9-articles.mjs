#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const updatedAt = '2026-08-06T12:30:00Z';

const q = (value) => JSON.stringify(value);

const articles = [
  {
    slug: 'unlocking-value-a-comprehensive-guide-to-assessing-your-mineral-rights-worth',
    title: 'Unlocking Value: A Comprehensive Guide to Assessing Your Mineral Rights Worth',
    seoTitle: 'A Practical Guide to Assessing Mineral Rights Worth',
    description: 'Build a defensible mineral-rights assessment from ownership, lease, production, market, and scenario evidence without relying on a universal price formula.',
    category: 'mineral-rights',
    tags: ['mineral rights value', 'valuation evidence', 'owner records', 'offer review'],
    primaryKeyword: 'assessing mineral rights worth',
    pillar: 'mineral-rights-value',
    cluster: 'valuation-methodology-drivers',
    intent: 'informational',
    hub: '/mineral-rights-value/',
    sibling: '/blog/what-determines-the-value-of-your-mineral-rights/',
    related: ['what-determines-the-value-of-your-mineral-rights', 'understanding-the-key-factors-influencing-your-mineral-rights-offer-range'],
    hero: '/assets/articles/mineral-worth-assessment-workbook-wave9.webp',
    excerpt: 'A useful mineral-rights assessment is an evidence file with explicit assumptions, not a single online estimate or universal royalty multiple.',
    answerSummary: 'Assess mineral-rights worth by first proving the interest owned, then separating producing and undeveloped components, reconciling lease and production records, documenting market assumptions, and comparing multiple scenarios. The result should be a range with traceable inputs and unresolved questions rather than a guaranteed price.',
    takeaways: [
      'Ownership quantity and interest type must be established before applying valuation assumptions.',
      'Producing and undeveloped interests require different evidence and should not be blended into one shortcut.',
      'Railroad Commission production records are useful, but payor statements, lease terms, and title records answer different questions.',
      'A defensible assessment shows assumptions, sensitivities, exclusions, and unresolved title or data gaps.',
    ],
    questions: ['Which records establish the interest being assessed?', 'How should producing and undeveloped value be separated?', 'What makes an assessment range defensible?'],
    sources: [
      ['Railroad Commission of Texas online research queries (accessed 2026-08-06)', 'https://www.rrc.texas.gov/resource-center/research/research-queries/'],
      ['Railroad Commission of Texas Production Data Query FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/'],
      ['Texas Comptroller, Valuing Property (accessed 2026-08-06)', 'https://comptroller.texas.gov/taxes/property-tax/valuing-property.php'],
      ['Railroad Commission of Texas royalties FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/'],
    ],
    faqs: [
      ['Can one royalty check determine what mineral rights are worth?', 'No. A check is one period of net payment. It does not by itself prove the ownership fraction, remaining reserves, future development, lease burdens, title condition, or the market terms a buyer would accept.'],
      ['Should producing and nonproducing acreage be assessed together?', 'They can appear in one review, but their evidence and risk should be separated. Producing value begins with attributable cash flow and decline assumptions; undeveloped value depends more heavily on location, rights, lease position, nearby activity, and timing uncertainty.'],
      ['Is an appraisal-district value the same as a sale value?', 'Not necessarily. A tax appraisal serves a property-tax function and may use assumptions, dates, and methods different from a current negotiated transaction. Treat it as one record to reconcile, not an automatic offer benchmark.'],
      ['Does a high nearby well result prove the same value for my tract?', 'No. Nearby activity may be relevant context, but geology, lateral location, spacing, operator plans, lease terms, ownership, burdens, and development timing can differ.'],
      ['What should I bring to a mineral-rights review?', 'Bring deeds or probate records, lease and amendments, division orders, recent statements, tax records, any offers, and the operator, lease, well, county, and owner identifiers you have.'],
    ],
    legalTaxSensitive: false,
    ctaLabel: 'Organize a Value Review',
    ctaPrompt: 'Bring the ownership, lease, production, payment, tax, and offer records so each assumption can be tied to evidence.',
    body: `> This article provides general education and a record-organizing framework. It is not a title opinion, reserve report, credentialed appraisal, engineering conclusion, owner-specific legal guidance, owner-specific tax guidance, or promise of a sale price.

## Answer first

**The most useful way to assess mineral-rights worth is to build an evidence file, divide the interest into producing and undeveloped components, and show how each assumption changes the result.** A defensible assessment is not a universal price per acre or royalty-check multiple. It is a range supported by the actual ownership, lease, production, location, market, and timing evidence available for the specific interest.

Start with five folders: ownership, lease, production, payments, and market context. Mark every missing item. A range built on incomplete records can still be useful if its limitations are explicit.

## Define exactly what is being assessed

Write an interest statement before doing any math:

- county, survey, abstract, section, block, tract, and legal description;
- mineral, royalty, overriding royalty, or other interest type;
- gross acreage and claimed net mineral or royalty acres;
- ownership decimal shown on division orders or statements;
- depths, formations, reservations, and exceptions;
- leased or unleased status and lease royalty; and
- producing wells, units, allocation wells, or pooled acreage associated with the interest.

A deed may reserve only part of the minerals. A probate distribution may divide the interest among heirs. A division-order decimal may be limited to one well or unit. Resolve those scopes before treating any number as the complete asset.

## Separate producing cash flow from undeveloped potential

For producing interests, reconcile at least twelve months of statements when available. Track gross volumes, sales price, ownership decimal, taxes, deductions, prior-period adjustments, and net payment by well or lease. Do not project the largest check indefinitely. Production changes over time, and statements can include timing adjustments.

The [Railroad Commission's production-data guidance](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) explains that Texas oil production is reported by lease and gas production by well, with reporting lag and later revisions possible. That makes RRC data valuable, but it may not map one-to-one to a royalty statement.

For undeveloped or additional-development potential, document nearby permits and wells, operator position, lease term, pooling authority, depth rights, spacing, access, and credible development evidence. Do not count a permit, offset well, or operator presentation as a guaranteed future well.

## Use three assessment views

Build three views rather than one opaque number:

1. **Income view:** project attributable cash flow using documented production, price, burden, decline, expense, and discount assumptions.
2. **Market view:** compare relevant transactions or offers only after adjusting for location, production, interest type, lease terms, title condition, and timing.
3. **Scenario view:** show a conservative case, a documented base case, and an upside case that is clearly conditional on additional development.

The Texas Comptroller's [market-value overview](https://comptroller.texas.gov/taxes/property-tax/valuing-property.php) describes market value in an open-market setting with informed parties. It does not provide a mineral-sale formula, but it illustrates why a forced timeline, incomplete information, or unmatched comparables can distort a conclusion.

## Reconcile sources instead of choosing one favorite number

Use each record for the question it can answer:

- county records: conveyances, reservations, probate filings, and recorded lease instruments;
- operator and payor records: owner numbers, division orders, statements, suspense, and payment history;
- [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/): wells, permits, operators, production, and regulatory records;
- appraisal-district records: taxable-interest and historical appraisal context; and
- written offers: counterparty assumptions, property description, price, deductions, conditions, and deed terms.

The RRC notes in its [royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) that it does not decide lease or royalty-payment disputes and directs owners to county and production records for different parts of the inquiry. No single source replaces the others.

## Make uncertainty visible

List the variables that materially move the range: ownership decimal, net acres, lease royalty, current production, price deck, decline, future-well probability, development timing, title curative cost, closing conditions, and retained interests. Show a sensitivity when a variable is uncertain instead of hiding the uncertainty inside one precise figure.

Also label what the assessment does not establish. A directional review does not determine legal title, certify reserves, audit a payor, or guarantee that a buyer will accept the range.

## Compare an offer on both economics and deed scope

Normalize each written offer to the same property and closing assumptions. Confirm whether the price covers all depths, all tracts, a fraction of the interest, future royalties, existing receivables, or only identified wells. Read the proposed deed and exhibits; a headline price is not comparable when the property conveyed differs.

MRX can organize records and explain a directional assessment. MRX may also have an acquisition interest, so owners should evaluate that potential conflict and use independent legal, tax, engineering, appraisal, or brokerage help when appropriate.

## Source notes

- [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) support the bounded description of public well, permit, operator, and production resources.
- [RRC production-data FAQ](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) supports the reporting-level, lag, and revision cautions.
- [Texas Comptroller valuation guidance](https://comptroller.texas.gov/taxes/property-tax/valuing-property.php) supports only the general market-value context.
- [RRC royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) supports the limits of RRC authority and the separation of county, lease, and production records.

Continue with [the main drivers of mineral-rights value](/blog/what-determines-the-value-of-your-mineral-rights/) or [organize a directional review](/book/).`,
  },
  {
    slug: 'how-to-identify-predatory-mineral-buyers',
    title: 'How to Identify Predatory Mineral Buyers',
    seoTitle: 'How to Evaluate High-Pressure Mineral Buyers',
    description: 'Use a documented counterparty, offer, deed, and closing review to identify pressure tactics and transaction risks without making unsupported accusations.',
    category: 'competing-offers',
    tags: ['mineral buyer due diligence', 'mineral offer safety', 'Texas mineral sale', 'deed review'],
    primaryKeyword: 'identify predatory mineral buyers',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    intent: 'commercial-investigation',
    hub: '/offer-review/',
    sibling: '/blog/identifying-red-flags-in-mineral-rights-transactions/',
    related: ['identifying-red-flags-in-mineral-rights-transactions', 'how-to-identify-lowball-mineral-rights-offers'],
    hero: '/assets/articles/verify-mineral-buyer-wave9.webp',
    excerpt: 'Evaluate mineral buyers by verifying identity, authority, written terms, deed scope, closing controls, and pressure tactics rather than relying on a label.',
    answerSummary: 'Do not decide that a mineral buyer is predatory from price alone. Verify the legal entity and signer, compare the mailed offer with the deed and closing instructions, identify pressure or secrecy tactics, protect personal information, and have qualified counsel review the conveyance before signing.',
    takeaways: [
      'Verify the entity and contact through records and channels you locate independently.',
      'Compare the property description and consideration in the offer, deed, exhibits, and closing documents.',
      'Urgency, secrecy, blank documents, unexplained changes, and unsafe payment requests are material warning signs.',
      'A legitimate company record does not prove that a specific offer is fair or that the contact is authorized.',
    ],
    questions: ['How can an owner verify a mineral buyer?', 'Which offer and deed terms deserve scrutiny?', 'What should an owner do when pressure tactics appear?'],
    sources: [
      ['Texas Attorney General, Common Scams (accessed 2026-08-06)', 'https://www.texasattorneygeneral.gov/consumer-protection/common-scams'],
      ['Texas Secretary of State, business filings and searches (accessed 2026-08-06)', 'https://www.sos.state.tx.us/corp/do-business.shtml'],
      ['Texas Property Code Chapter 5, including Section 5.151 (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf'],
      ['Railroad Commission of Texas online research queries (accessed 2026-08-06)', 'https://www.rrc.texas.gov/resource-center/research/research-queries/'],
    ],
    faqs: [
      ['Is every unsolicited mineral offer predatory?', 'No. Unsolicited contact is a reason to verify identity and terms, not proof of misconduct. Evaluate the counterparty, property description, price, conditions, deed, and closing process.'],
      ['Does a Texas entity filing prove the buyer is trustworthy?', 'No. It can help confirm that an entity exists and identify public filing information, but it does not prove the caller is authorized, the offer is fair, or the transaction is safe.'],
      ['Should I sign a deed that arrives with a draft or check?', 'Do not sign merely because payment paperwork is enclosed. Compare the deed with the offer, confirm the interest conveyed, understand when payment becomes final, and obtain qualified legal review.'],
      ['What information should I avoid sending early?', 'Avoid sending Social Security numbers, banking credentials, passwords, or unredacted identity documents until the recipient and secure closing need are verified.'],
      ['Where can I report suspected fraud in Texas?', 'Preserve the documents and communications, contact your financial institution if money or credentials are at risk, and consider reporting through the Texas Attorney General or appropriate law-enforcement channel.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Review an Offer Packet',
    ctaPrompt: 'Bring the letter, deed, exhibits, entity name, signer information, communications, and closing instructions for a document-organizing review.',
    body: `> This article provides general education. It does not label any person or company predatory, determine fraud, provide owner-specific legal guidance, approve a buyer, or decide whether a price is fair. A Texas attorney should review the actual conveyance and facts.

## Answer first

**Identify transaction risk through evidence: verify who is contacting you, compare every written term, inspect the deed scope, and slow down when pressure or secrecy replaces documentation.** Price alone does not prove that a buyer is predatory. A high offer can carry unfavorable deed language, and a lower offer can reflect a different interest or closing condition.

Use a four-part review: counterparty, property, economics, and closing controls.

## Verify the counterparty independently

Record the legal entity name, assumed name, physical address, website, domain, phone number, signer, title, and any related closing company. Then verify through channels you locate yourself, not only links or numbers in the solicitation.

The Texas Secretary of State directs users to [SOSDirect for business filings and searches](https://www.sos.state.tx.us/corp/do-business.shtml). A filing search can help compare entity names and public filing information. It cannot establish the contacting person's connection to that entity or whether the offer is sound.

If the contact claims to be an operator, use the [RRC Organization P-5 and other research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) for the regulatory identity represented. A mineral acquisition company may not be an operator, so absence from a P-5 search is not automatically suspicious.

## Compare the offer with the conveyance

Create a side-by-side table for:

- buyer legal name and assignee rights;
- county, tract, legal description, and covered depths;
- mineral, royalty, overriding royalty, executive, or other rights conveyed;
- fraction or percentage of the interest;
- producing wells, units, leases, and future development covered;
- purchase price, deposit, adjustments, and payment timing;
- title-defect, acreage-adjustment, termination, and extension rights; and
- representations, warranties, indemnities, confidentiality, and dispute terms.

Do not assume the cover letter controls if the deed conveys more. Do not sign an incomplete exhibit or rely on a verbal promise that contradicts the documents.

Texas Property Code [Section 5.151 within Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) requires specified conspicuous disclosure in a particular mailed mineral-or-royalty purchase-offer scenario involving an enclosed conveyance and payment instrument. That statute is not a universal approval test. Counsel should determine whether it applies and what remedies or other law may be relevant.

## Watch for process warning signs

Pause when a counterparty:

- creates a same-day deadline without a documented reason;
- discourages attorney, family, tax, or title review;
- asks for a blank signature page or later-completed exhibit;
- changes the property or price after signature without a clear amendment;
- refuses to identify the purchasing entity or closing agent;
- asks for bank credentials, gift cards, cryptocurrency, or an upfront fee through an unsafe channel;
- insists that a check is final before funds clear; or
- asks you to keep the transaction secret from co-owners or advisors.

The [Texas Attorney General's scam guidance](https://www.texasattorneygeneral.gov/consumer-protection/common-scams) warns that unsolicited contact, requests for personal information, upfront payment, and hard-to-reverse payment methods are common scam indicators. Apply those general safeguards without assuming that every unusual mineral transaction is criminal.

## Verify the property before sharing sensitive records

Ask the buyer to identify the county records, lease, well, unit, or ownership information behind the offer. Compare that description with deeds, probate records, division orders, and statements. Redact Social Security numbers, banking details, and unrelated account information from early-stage documents.

A buyer who found an owner through public records may still have incomplete acreage or title assumptions. An offer based on gross acres can change after title review. Require written explanation of material changes.

## Use controlled closing steps

Confirm who holds signed documents, when they may be recorded, what makes payment final, and how unresolved title items are handled. Verify wire instructions through a known phone number. Do not email banking information in response to an unexpected message. Keep the final executed deed, settlement statement, payment evidence, tax form, and recorded instrument.

If identity theft, forged documents, or diverted funds are suspected, stop communication, preserve originals and metadata, contact the financial institution, and use appropriate reporting channels. Do not attempt to confront or entrap a suspected scammer.

## Distinguish aggressive negotiation from unsupported conduct

A short deadline, broad deed, low price, or one-sided term can be commercially unfavorable without proving illegality. Describe the observed fact: “the deed includes all depths,” “the offer expires Friday,” or “the price changed after title review.” Let qualified counsel assess legal consequences.

MRX can organize an offer for directional review and may itself have an acquisition interest. That potential conflict should be considered alongside independent legal, tax, appraisal, engineering, or brokerage advice where appropriate.

## Source notes

- [Texas Attorney General scam guidance](https://www.texasattorneygeneral.gov/consumer-protection/common-scams) supports the general identity, personal-information, payment, and pressure cautions.
- [Texas Secretary of State business resources](https://www.sos.state.tx.us/corp/do-business.shtml) support the entity-search step, not a trustworthiness conclusion.
- [Texas Property Code Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supports only the bounded statutory disclosure discussion.
- [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) support verification of operator and regulatory records when relevant.

Next, review [transaction red flags](/blog/identifying-red-flags-in-mineral-rights-transactions/) or [organize the offer packet](/book/).`,
  },
  {
    slug: 'navigating-competing-offers-what-to-do-before-your-mineral-rights-assessment-call',
    title: 'Navigating Competing Offers: What to Do Before Your Mineral Rights Assessment Call',
    seoTitle: 'Prepare Competing Mineral Offers for a Review Call',
    description: 'Normalize competing mineral-rights offers before a review call so price, property scope, contingencies, and deed terms can be compared clearly.',
    category: 'competing-offers',
    tags: ['competing mineral offers', 'offer comparison', 'assessment call', 'mineral deed terms'],
    primaryKeyword: 'competing mineral rights offers assessment call',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    intent: 'commercial-investigation',
    hub: '/offer-review/',
    sibling: '/blog/how-to-get-multiple-offers-for-your-texas-mineral-rights/',
    related: ['how-to-get-multiple-offers-for-your-texas-mineral-rights', 'can-i-still-get-a-valid-underwriter-review-if-i-have-competing-mineral-rights-offers'],
    hero: '/assets/articles/competing-offer-call-prep-wave9.webp',
    excerpt: 'A useful assessment call begins with complete offer documents, a normalized comparison table, and a short list of unresolved title, price, and closing questions.',
    answerSummary: 'Before an assessment call, collect complete written offers and proposed deeds, identify whether they cover the same property, normalize price and adjustments, list deadlines and contingencies, protect sensitive data, and write the questions the documents do not answer. The call should clarify differences rather than select a buyer for the owner.',
    takeaways: [
      'Two headline prices are not comparable until the conveyed property and closing conditions match.',
      'Include deeds, exhibits, amendments, and communications, not only offer letters.',
      'Normalize net proceeds, retained interests, title adjustments, timing, and termination rights.',
      'Use the call to surface assumptions and next questions; preserve owner decision authority.',
    ],
    questions: ['Which competing-offer documents belong in the packet?', 'How should offers be normalized?', 'What should the owner ask during the call?'],
    sources: [
      ['Texas Property Code Chapter 5, conveyances and mineral-offer disclosure (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf'],
      ['Texas Secretary of State business filings and searches (accessed 2026-08-06)', 'https://www.sos.state.tx.us/corp/do-business.shtml'],
      ['Texas Attorney General, Consumer Rights (accessed 2026-08-06)', 'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-rights'],
      ['Railroad Commission of Texas royalties FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/'],
    ],
    faqs: [
      ['Can I have an assessment call while offers are pending?', 'Yes. Provide the deadlines and complete documents so the discussion can distinguish time-sensitive facts from pressure. The owner remains responsible for extension requests and decisions.'],
      ['Should I redact the offers?', 'Redact Social Security numbers, bank information, passwords, and unrelated account data. Keep the buyer name, property description, price, conditions, dates, and deed language visible if those items are being compared.'],
      ['Is the highest price always the best offer?', 'No. Compare the property conveyed, net adjustments, retained rights, payment certainty, diligence period, title standards, deed terms, and closing risk alongside price.'],
      ['What if the offers cover different fractions or depths?', 'Normalize them only after identifying the different scope. Do not convert to a per-acre or percentage comparison unless the ownership and property assumptions are documented.'],
      ['Will an assessment call tell me which buyer to choose?', 'A directional review can organize facts and questions, but it does not replace the owner’s legal, tax, financial, or counterparty decision.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Prepare a Competing-Offer Review',
    ctaPrompt: 'Bring every offer, deed, exhibit, deadline, title adjustment, and closing instruction so the differences can be organized.',
    body: `> This article provides general education. It does not recommend a buyer, determine title, interpret a deed for a specific owner, provide owner-specific legal or tax guidance, or guarantee that an offer will close.

## Answer first

**Before a mineral-rights assessment call, turn competing offers into one controlled comparison packet.** Include every offer letter, deed, exhibit, amendment, deadline, and material communication. Then identify whether the proposals actually cover the same property and calculate comparable net terms.

The goal is not to crown a winner before the call. It is to make differences visible and give the owner a precise question list.

## Build one packet per offer

For each counterparty, gather:

- the complete offer and all pages of the proposed conveyance;
- legal-description, well, unit, county, depth, and lease exhibits;
- price, deposit, payment method, and adjustment language;
- acceptance, diligence, extension, and closing dates;
- title-defect, curative, termination, and acreage provisions;
- representations, warranties, indemnities, confidentiality, and dispute clauses;
- assignment or affiliate provisions;
- closing-agent and wire instructions; and
- emails or messages that change or explain a written term.

Do not substitute a summary spreadsheet for the source documents. The spreadsheet is an index; the signed instrument controls rights and obligations subject to applicable law.

## Confirm the offers describe the same property

Compare county, tract, legal description, gross acres, claimed net acres, interest type, depths, formations, wells, units, leases, and fractional interest. Note whether existing royalties, suspense funds, receivables, executive rights, lease benefits, or future development are included.

An offer for half of an interest is not directly comparable to an offer for all of it. An offer tied to named wells may differ from a conveyance of all minerals in the tract. Ask counsel to resolve ambiguous or conflicting property language.

Texas Property Code [Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supplies general conveyance rules and a specific mailed-offer disclosure requirement in Section 5.151. It does not make a shortened owner checklist a substitute for document review.

## Normalize the economics

Create columns for:

1. stated purchase price;
2. interest and acreage assumed;
3. price reductions or increases after title review;
4. fees, taxes, reimbursements, or withheld amounts;
5. treatment of suspense and unpaid royalties;
6. retained fraction, depth, or royalty;
7. deposit and when it becomes nonrefundable;
8. expected payment event; and
9. tax or closing records promised.

Do not invent a price-per-acre comparison when net acreage is unresolved. If one buyer assumes more acres, show both the stated price and the conditional normalized result.

## Map timing and control

Write the actual dates on a single calendar. Separate offer expiration from diligence, closing, and recording. Identify who can extend each date, who can terminate, and whether the buyer can hold a signed deed before paying.

If more time is needed, ask the counterparty in writing. A refusal does not prove misconduct, but it is a factor the owner can weigh. Keep version numbers and do not sign multiple inconsistent copies.

## Verify the counterparty and communication channel

Use the Texas Secretary of State's [business filing and search resources](https://www.sos.state.tx.us/corp/do-business.shtml) to compare entity names where applicable. Verify the sender and closing party through a phone number or website located independently. A filing proves neither authority nor fairness.

The Texas Attorney General's [consumer-rights overview](https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-rights) recommends preserving records and trying to resolve complaints with a business before using complaint processes when appropriate. Keep the solicitation, envelope, call notes, and complete document history.

## Bring the underlying ownership and payment records

An offer comparison is stronger when the reviewer can see the deed or probate chain, lease, amendments, division orders, recent royalty statements, tax records, and existing title-curative requests. The RRC's [royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) explains that county records and RRC production records address different pieces of an ownership or payment inquiry.

Redact bank information, taxpayer identifiers, passwords, and unrelated account data. Do not alter the substantive property or offer text.

## Write questions before the call

Prioritize questions such as:

- Which tract, depths, and fraction does each proposal convey?
- What title assumption explains the price difference?
- Can the buyer reduce price or terminate after receiving a signed deed?
- What happens to unpaid or suspended royalties?
- Who controls the closing and recording sequence?
- Which provisions survive closing?
- Does the owner need a tax basis allocation or professional appraisal for another purpose?

Record unanswered questions and the person responsible for resolving each one.

## Preserve decision independence

MRX can organize competing offers and explain a directional review. MRX may also have an acquisition interest; that potential conflict must be considered. An owner may need independent counsel, a tax professional, engineer, appraiser, broker, or other advisor depending on the decision.

## Source notes

- [Texas Property Code Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supports general conveyance and bounded mailed-offer disclosure context.
- [Texas Secretary of State business resources](https://www.sos.state.tx.us/corp/do-business.shtml) support the entity-record lookup step only.
- [Texas Attorney General consumer rights](https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-rights) supports documentation and complaint-process context.
- [RRC royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) supports the distinction among county, production, lease, and royalty-payment records.

See how to [seek multiple offers](/blog/how-to-get-multiple-offers-for-your-texas-mineral-rights/) or [prepare the packet for review](/book/).`,
  },
  {
    slug: 'understanding-mineral-rights-offer-scams-what-you-need-to-know',
    title: 'Understanding Mineral Rights Offer Scams: What You Need to Know',
    seoTitle: 'Mineral Rights Offer Scams: Verification and Response',
    description: 'Recognize impersonation, document, payment, and identity-theft warning signs in mineral-rights offers and respond without making unsupported fraud claims.',
    category: 'competing-offers',
    tags: ['mineral rights scams', 'offer verification', 'identity theft', 'mineral sale safety'],
    primaryKeyword: 'mineral rights offer scams',
    pillar: 'offer-review',
    cluster: 'offer-review-buyer-comparison-safety',
    intent: 'informational',
    hub: '/offer-review/',
    sibling: '/blog/identifying-red-flags-in-mineral-rights-transactions/',
    related: ['identifying-red-flags-in-mineral-rights-transactions', 'how-to-identify-predatory-mineral-buyers'],
    hero: '/assets/articles/mineral-offer-scam-defense-wave9.webp',
    excerpt: 'Treat suspected mineral-offer fraud as an evidence and containment problem: stop, verify independently, protect accounts, preserve records, and report through the proper channel.',
    answerSummary: 'Mineral-offer scams may involve impersonated companies, spoofed communications, altered deeds, fake checks, diverted wires, identity theft, or upfront-fee demands. Stop the transaction, verify through independent channels, protect sensitive accounts, preserve original evidence, and report suspected fraud rather than confronting the sender.',
    takeaways: [
      'Unexpected contact is a verification trigger, not automatic proof of fraud.',
      'Never rely only on caller ID, reply-to email, or a link supplied in the solicitation.',
      'Do not send upfront fees, gift cards, cryptocurrency, or banking credentials to receive mineral-sale proceeds.',
      'Preserve originals and act quickly when a signature, identity record, account, or wire may be compromised.',
    ],
    questions: ['Which mineral-offer scam patterns should owners recognize?', 'How should identity and payment instructions be verified?', 'What is the safest response to suspected fraud?'],
    sources: [
      ['Texas Attorney General, Common Scams (accessed 2026-08-06)', 'https://www.texasattorneygeneral.gov/consumer-protection/common-scams'],
      ['Texas Attorney General, Bank and Check Scams (accessed 2026-08-06)', 'https://www.texasattorneygeneral.gov/consumer-protection/financial-and-insurance-scams/bank-and-check-scams'],
      ['Texas Secretary of State, Business Identity Theft (accessed 2026-08-06)', 'https://www.sos.state.tx.us/corp/businessidentitytheft.shtml'],
      ['Texas Property Code Chapter 5 (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf'],
    ],
    faqs: [
      ['Is a large unsolicited mineral offer necessarily a scam?', 'No. The amount alone proves nothing. Verify the entity, sender, property, deed, payment method, and closing controls before deciding how to respond.'],
      ['Can caller ID or an email logo be trusted?', 'No. Caller ID, sender names, and logos can be spoofed or copied. Use a phone number or website you find independently and confirm the individual’s authority.'],
      ['What should I do with a suspicious check?', 'Do not spend or return funds based on the check. Contact your bank through a known channel, preserve the check and envelope, and follow the bank’s fraud guidance.'],
      ['What if I already sent identity or bank information?', 'Contact the affected financial institution promptly, change compromised credentials, monitor accounts and credit as appropriate, preserve communications, and use official identity-theft or law-enforcement reporting resources.'],
      ['Should I accuse the sender publicly?', 'Preserve facts and report through appropriate channels. Public accusations without verified evidence can create additional risk and may interfere with a professional investigation.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Organize a Suspicious Offer',
    ctaPrompt: 'Bring the solicitation, envelope, deed, check, emails, phone numbers, domain, and timeline without sharing passwords or full banking credentials.',
    body: `> This article provides general fraud-prevention education. It does not determine that a communication is fraudulent, provide owner-specific legal guidance, investigate a crime, recover funds, or approve a counterparty.

## Answer first

**When a mineral-rights offer appears suspicious, stop the transaction and verify every identity, document, and payment channel independently.** Do not deposit and return part of a questionable check, pay a fee to receive proceeds, send credentials through an unexpected link, or record a deed before the closing sequence is understood.

Treat the event as two problems: contain possible harm and preserve evidence.

## Recognize common attack paths

A suspected mineral-offer scam may involve:

- a real company name used by an unauthorized person;
- a look-alike domain or changed reply-to address;
- caller-ID spoofing;
- a forged owner signature, notary block, deed, or assignment;
- a fake or altered check followed by a demand to return money;
- changed wire instructions near closing;
- a request for an upfront tax, processing, appraisal, or release fee;
- collection of Social Security, banking, or identity documents without a verified need; or
- a document that conveys more property than the solicitation describes.

Unusual wording, urgency, or poor formatting can justify caution, but those clues alone do not prove fraud.

## Verify outside the message

Do not click the supplied link first. Locate the company's official website, public filing information, and known phone number independently. Ask for the full legal entity, signer, title, office address, closing agent, and written explanation of how the property was identified.

The Texas Secretary of State describes how [SOSDirect can be used to review entity and filing information](https://www.sos.state.tx.us/corp/businessidentitytheft.shtml). That helps compare the claimed company with public records; it does not authenticate a particular email or employee.

Call the known company number and ask to be transferred. Confirm any last-minute wire change with both the closing party and the owner-side contact through separate known channels.

## Protect identity and account information

Early in a review, redact taxpayer identifiers, bank numbers, passwords, and unrelated identity records. A legitimate closing may eventually require tax and payment information, but the need, recipient, transmission method, and timing should be verified.

The Texas Attorney General's [common-scams guidance](https://www.texasattorneygeneral.gov/consumer-protection/common-scams) identifies unsolicited contact, requests for personal information, upfront payment, and hard-to-reverse transfers as recurring warning signs. No mineral purchaser needs gift cards or a password to pay sale proceeds.

## Treat checks and wires as separate risks

A bank's temporary availability of deposited funds does not necessarily mean a check is final. The Texas Attorney General's [bank and check scam guidance](https://www.texasattorneygeneral.gov/consumer-protection/financial-and-insurance-scams/bank-and-check-scams) warns against sharing banking information and against schemes that use apparently valuable checks or messages to obtain funds or credentials.

Do not send back an “overpayment.” Do not pay a fee from a check to unlock the remaining proceeds. If a check or wire is questionable, contact the financial institution at its published number and follow its fraud process.

## Compare the deed with the offer

Read the grantee name, consideration, property description, fraction, depths, wells, units, leases, reservations, warranty language, assignment rights, and notary block. Confirm that blank spaces and exhibits are complete.

Texas Property Code [Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) contains conveyance rules and a disclosure requirement for a defined mailed mineral-or-royalty offer scenario. A disclosure or notarization does not independently prove the transaction is authentic or fair.

## Preserve evidence without altering it

Keep:

- the envelope and all pages received;
- original email files or headers when available;
- text messages, voicemail, phone numbers, and dates;
- the complete check, deed, exhibits, and notary information;
- screenshots that show the URL and time;
- bank notices and transaction identifiers; and
- a written timeline of what was sent, signed, deposited, or recorded.

Work from copies and preserve originals. Do not edit files or retaliate against the sender.

## Respond according to the risk

If no sensitive information or money has moved, stop and verify before continuing. If credentials were shared, change them through known systems and contact the affected institution. If funds moved, contact the bank immediately; speed may matter. If a deed may have been forged or recorded, contact qualified Texas counsel and the relevant county office promptly.

Suspected consumer fraud can be reported to the Texas Attorney General through its official channels. Identity theft, mail, wire, tax, or recorded-document issues may also implicate other agencies. Counsel or law enforcement can help identify the appropriate route.

## Keep legitimate diligence separate from scam claims

Title requests, tax forms, identity checks, and closing instructions can be legitimate. The test is whether the recipient, purpose, scope, security, and timing are verified. State the facts you observed instead of declaring fraud without evidence.

MRX can organize a suspicious offer for discussion but does not investigate crimes or authenticate documents. MRX may also have an acquisition interest, which owners should consider.

## Source notes

- [Texas Attorney General common-scams guidance](https://www.texasattorneygeneral.gov/consumer-protection/common-scams) supports the general verification and payment warnings.
- [Texas Attorney General bank-and-check guidance](https://www.texasattorneygeneral.gov/consumer-protection/financial-and-insurance-scams/bank-and-check-scams) supports the account and questionable-check safeguards.
- [Texas Secretary of State business-identity guidance](https://www.sos.state.tx.us/corp/businessidentitytheft.shtml) supports the public-record verification step.
- [Texas Property Code Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supports only the bounded conveyance and mailed-offer disclosure context.

Continue with [transaction red flags](/blog/identifying-red-flags-in-mineral-rights-transactions/) or [organize the documents](/book/).`,
  },
  {
    slug: 'managing-mineral-interests-in-estate-planning-explained',
    title: 'Managing Mineral Interests in Estate Planning Explained',
    seoTitle: 'Managing Mineral Interests in a Texas Estate Plan',
    description: 'Create an estate-plan operating file for Texas mineral interests covering ownership, authority, records, income, successor instructions, and review events.',
    category: 'tax-legal',
    tags: ['mineral estate planning', 'Texas mineral interests', 'successor records', 'royalty administration'],
    primaryKeyword: 'managing mineral interests estate planning',
    pillar: 'inherited-mineral-rights',
    cluster: 'inherited-estate-probate',
    intent: 'informational',
    hub: '/inherited-mineral-rights/',
    sibling: '/blog/can-you-put-mineral-rights-in-a-trust-texas-estate-planning-explained/',
    related: ['can-you-put-mineral-rights-in-a-trust-texas-estate-planning-explained', 'how-selling-mineral-rights-affects-your-estate-plan-in-texas'],
    hero: '/assets/articles/estate-mineral-management-wave9.webp',
    excerpt: 'A mineral estate plan needs an operating file that tells successors what is owned, who may act, where records live, and how income and decisions are administered.',
    answerSummary: 'Manage mineral interests in an estate plan by maintaining a tract-level ownership schedule, coordinating deeds and beneficiary structures with the plan, defining authority for leasing and sales, preserving payment and basis records, and giving successors practical instructions. Review the plan after title, family, lease, production, or transaction changes.',
    takeaways: [
      'A will or trust is not a substitute for a complete tract-level mineral schedule and title records.',
      'The plan should address who may lease, sell, sign division orders, cure title, and receive income.',
      'Successors need access to deeds, probate documents, leases, payor contacts, tax records, and account history.',
      'Material ownership, family, trustee, lease, production, and sale events should trigger review.',
    ],
    questions: ['Which mineral records belong in an estate-plan file?', 'Which powers and successor instructions should be addressed?', 'When should the plan be reviewed?'],
    sources: [
      ['Texas Property Code Chapter 112, trusts (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.112.pdf'],
      ['Texas Property Code Chapter 113, trustee powers and administration (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.113.pdf'],
      ['Texas Estates Code Chapter 358, mineral property in estate administration (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf'],
      ['IRS Publication 551, Basis of Assets (accessed 2026-08-06)', 'https://www.irs.gov/publications/p551'],
    ],
    faqs: [
      ['Should mineral rights be listed separately in an estate plan?', 'Use a tract-level schedule and supporting records even if the plan uses broader property language. The schedule helps counsel and successors identify what exists and whether separate transfer work is needed.'],
      ['Who should be authorized to sign leases and division orders?', 'Authority depends on the ownership structure, trust or power document, probate status, and applicable law. Qualified Texas counsel should draft and confirm the authority.'],
      ['Should royalty income go to a separate account?', 'That is an administration and tax decision. At minimum, preserve statements, deposits, expenses, tax forms, and distributions so a fiduciary or successor can reconcile the activity.'],
      ['Does a beneficiary designation control mineral rights?', 'It depends on the asset, account, entity, deed, trust, and governing documents. Do not assume a beneficiary form for one account transfers county-recorded mineral title.'],
      ['When should a mineral estate plan be updated?', 'Review it after acquiring or selling an interest, a death or divorce, a trustee or beneficiary change, a lease or major development, a title cure, or a material change in income.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Organize an Estate Mineral File',
    ctaPrompt: 'Bring the estate documents, property schedule, deeds, leases, division orders, statements, tax records, and successor contact plan.',
    body: `> This article provides general education. It is not an estate plan, title opinion, trust interpretation, fiduciary instruction, owner-specific legal guidance, owner-specific tax guidance, or credentialed valuation. Qualified Texas counsel and a tax professional should apply current law to the documents.

## Answer first

**Managing mineral interests in an estate plan requires both legal documents and an operating file.** The legal plan identifies who owns, controls, or receives property. The operating file tells a successor which interests exist, where the evidence is kept, who pays income, and which actions may be pending.

Without both, a technically valid plan can still leave heirs searching counties, operators, and old statements after a death or incapacity.

## Build a tract-level mineral schedule

List each interest separately:

- county, survey, abstract, section, block, tract, and legal description;
- mineral, royalty, overriding royalty, leasehold, or other interest type;
- gross acreage and claimed net ownership;
- deed, reservation, assignment, probate, or trust source;
- lease, unit, well, field, operator, payor, and owner number;
- producing, nonproducing, leased, or unleased status;
- depth or formation limitations; and
- co-owners, beneficiaries, entities, or fiduciaries involved.

Attach the supporting record or a reliable location reference. Mark unresolved discrepancies rather than converting an estimate into a fact.

## Coordinate the schedule with the legal structure

Ask counsel whether each interest is individually owned, community or separate property, held by an entity, funded to a trust, subject to a life estate or remainder, or expected to pass through probate.

[Texas Property Code Chapter 112](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.112.pdf) addresses creation and validity of trusts, including the need for trust property. That supports a practical distinction: signing a trust and transferring a particular mineral interest are related but not identical steps.

Review recorded instruments after a plan change. A schedule is an administration aid; it does not convey title.

## Define practical authority

The plan and related documents should address who may:

- sign leases, ratifications, pooling agreements, amendments, and division orders;
- negotiate or sell all or part of an interest;
- accept title-curative requests and record instruments;
- receive bonuses, royalties, delay rentals, and sale proceeds;
- pay taxes, professional fees, and property expenses;
- retain reserves and distribute income;
- access digital accounts and statements; and
- manage conflicts among income and remainder beneficiaries.

[Texas Property Code Chapter 113](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.113.pdf) provides general trust-administration and trustee-power context. The actual trust can add limits or standards, and another structure may have different rules.

## Prepare for incapacity and post-death administration

Give the authorized person a current contact sheet for operators, payors, land departments, attorneys, accountants, and record custodians. Explain where originals, passwords, tax forms, and payment histories are stored. Use a secure method for credentials rather than placing passwords in a public or broadly distributed document.

Texas Estates Code [Chapter 358](https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf) specifically addresses mineral property in estate administration, including defined court-authorized activities in applicable proceedings. Its existence is a reminder that leasing or managing estate minerals may require procedure and authority beyond locating a will.

## Preserve income and basis evidence

Keep annual and monthly statements, division orders, lease bonuses, depletion schedules, property-tax records, acquisition documents, inheritance or gift records, appraisals, partial-sale allocations, and settlement statements.

[IRS Publication 551](https://www.irs.gov/publications/p551) supplies general basis and recordkeeping principles. The correct basis and reporting depend on how and when an interest was acquired, later adjustments, and the owner or entity involved. Do not guess at basis when the estate plan can preserve the source records now.

## Address co-ownership and communication

Identify who receives notices, who may negotiate, whether all owners must sign, and how expenses or professional advice are funded. A successor should know whether one tract is shared among many heirs and whether payors use separate owner numbers.

Do not promise that a trust, entity, or co-ownership agreement eliminates probate, conflict, tax, or title work. Have counsel explain what the chosen structure actually changes.

## Create review triggers

Review the mineral schedule and plan after:

- acquisition, gift, inheritance, or sale;
- marriage, divorce, death, incapacity, or beneficiary change;
- trustee, executor, agent, or entity-manager change;
- new lease, amendment, unit, or division order;
- first production, new development, suspense, or title dispute;
- a major change in income or value; and
- a change in residence, governing documents, or tax planning.

Record the review date and what changed. Do not overwrite historical ownership or basis evidence.

MRX can organize mineral records for a directional review. It does not draft an estate plan, determine title, act as fiduciary, or provide owner-specific legal or tax conclusions.

## Source notes

- [Texas Property Code Chapter 112](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.112.pdf) supports the bounded trust-creation and trust-property discussion.
- [Texas Property Code Chapter 113](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.113.pdf) supports general trustee-administration context only.
- [Texas Estates Code Chapter 358](https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf) supports the mineral-property estate-administration context.
- [IRS Publication 551](https://www.irs.gov/publications/p551) supports general basis and recordkeeping principles.

Next, learn about [trust-held minerals](/blog/can-you-put-mineral-rights-in-a-trust-texas-estate-planning-explained/) or [organize the estate mineral file](/book/).`,
  },
  {
    slug: 'understanding-inherited-mineral-rights-in-texas',
    title: 'Understanding Inherited Mineral Rights in Texas',
    seoTitle: 'Inherited Texas Mineral Rights: Records and Next Steps',
    description: 'Trace inherited Texas mineral rights to current heirs, update county and payor records, preserve basis evidence, and separate title from valuation.',
    category: 'tax-legal',
    tags: ['inherited mineral rights Texas', 'probate minerals', 'royalty ownership', 'heir records'],
    primaryKeyword: 'inherited mineral rights in Texas',
    pillar: 'inherited-mineral-rights',
    cluster: 'inherited-estate-probate',
    intent: 'informational',
    hub: '/inherited-mineral-rights/',
    sibling: '/blog/mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling/',
    related: ['mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling', 'understanding-the-probate-process-for-mineral-interests'],
    hero: '/assets/articles/inherited-texas-minerals-wave9.webp',
    excerpt: 'Inherited Texas minerals should be treated as a chain-of-title and administration project before heirs rely on a check, tax record, or purchase offer.',
    answerSummary: 'An heir should identify the decedent’s specific mineral interests, determine the applicable probate or non-probate transfer path, preserve the recorded ownership chain, update operators and payors, reconcile income and suspense, and preserve date-of-death and basis records. Ownership, payment, and value are separate questions.',
    takeaways: [
      'A royalty statement or tax record may identify an account without proving the complete inherited title.',
      'The transfer path depends on deeds, wills, probate orders, trusts, entities, survivorship arrangements, and family facts.',
      'Operators and payors may require recorded instruments, probate records, tax forms, and division-order updates.',
      'Preserve date-of-death, basis, income, expense, and partial-disposition records before selling or dividing the asset.',
    ],
    questions: ['How do heirs identify inherited Texas mineral interests?', 'Which records connect the decedent to the heirs?', 'What should be updated before a sale or division?'],
    sources: [
      ['Texas Estates Code Chapter 358, mineral property in estate administration (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf'],
      ['Texas Property Code Chapter 5, conveyances and recording context (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf'],
      ['Railroad Commission of Texas royalties FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/'],
      ['IRS Publication 551, Basis of Assets (accessed 2026-08-06)', 'https://www.irs.gov/publications/p551'],
    ],
    faqs: [
      ['Do mineral rights automatically transfer when someone dies?', 'The beneficial result and required steps depend on the title, will, probate proceeding, trust, entity, survivorship arrangement, and Texas law. An heir should not assume a payor record completes the legal transfer.'],
      ['Can heirs sell before the operator changes its records?', 'Possibly, but the seller must have authority and deliver the title required by the transaction. Unresolved probate, co-owner, or payor records can delay or change closing. Qualified counsel should review the facts.'],
      ['Why might royalty payments go into suspense?', 'Payors may suspend funds while ownership, documentation, address, tax, or division-order issues are resolved. The specific reason should be obtained from the payor and compared with the underlying records.'],
      ['What is the tax basis of inherited mineral rights?', 'Basis often depends on federal tax rules, date-of-death value, estate facts, later adjustments, and any partial sales or depletion. Preserve the evidence and obtain owner-specific tax guidance.'],
      ['Should co-heirs divide or hold the minerals together?', 'That is a legal, tax, administration, and family decision. Compare authority, expenses, income distribution, voting, sale rights, recordkeeping, and succession before choosing a structure.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Organize Inherited Mineral Records',
    ctaPrompt: 'Bring the decedent’s deeds, will or trust, probate records, death certificate, leases, statements, tax records, and heir information.',
    body: `> This article provides general education. It does not determine heirs, title, probate requirements, ownership fractions, tax basis, legal rights, or market value. Qualified Texas counsel and a tax professional should apply current law to the documents.

## Answer first

**Understanding inherited mineral rights in Texas begins with the ownership chain, not the latest royalty check or purchase offer.** Identify what the decedent owned, determine how that interest passed, record or preserve the required transfer evidence, and then update operators, payors, tax records, and co-owner administration.

Treat ownership, payment, and value as separate workstreams. Progress in one does not prove the others.

## Inventory every possible interest

Search the decedent's files for deeds, reservations, assignments, leases, division orders, check stubs, tax forms, appraisal notices, probate records, trust schedules, entity records, and buyer letters. Build a row for each county and tract with:

- legal description and record reference;
- interest type and claimed fraction;
- gross and net acres if documented;
- depths or formations included;
- lease, operator, payor, unit, well, and owner numbers;
- current production or suspense status; and
- the source that connects the decedent to the interest.

Do not merge tracts because they share an operator. Do not infer that surface ownership included all minerals.

## Determine the transfer path

The record path may involve a probated will, intestacy, a small-estate or other affidavit, trust ownership, entity succession, survivorship rights, a prior recorded deed, or proceedings in more than one state or county. The correct route depends on the documents and facts.

Texas Estates Code [Chapter 358](https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf) defines mineral property broadly for estate-administration purposes and addresses certain court-authorized mineral activities. It does not decide which shortcut or filing applies to a particular family.

Have counsel identify who has authority to sign while an estate is open, whether ancillary proceedings are needed, and what must be recorded where the property is located.

## Preserve the county record chain

For each interest, connect the decedent's acquisition record to the instrument or order supporting the current ownership. Texas Property Code [Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) provides general conveyance and recording context, but a county index search or deed form is not a substitute for a title opinion.

Use exact legal descriptions and capacities. Keep file-stamped or certified copies when available. If heirs later divide or sell interests, preserve the pre-division and post-division chain.

## Update operators and payors deliberately

Ask each operator or payor for its deceased-owner or transfer packet and written list of required items. The request may include death, probate, trust, recorded-instrument, tax, address, and division-order records. Requirements vary by title and payor.

The RRC's [royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) explains that the Commission does not decide lease and royalty-payment matters, while county and RRC records can provide different supporting information. A payor's acceptance updates its payment system; it does not independently establish marketable title for every purpose.

Track the date, recipient, items sent, response, new owner number, and any suspense or curative issue. Compare the first new statement with the decedent's last statement.

## Reconcile income, expenses, and suspense

Create an estate-to-heir cash ledger showing production month, payment month, gross revenue, taxes, deductions, adjustments, net payment, suspense released, and distribution. Separate income earned before death, received after death, and attributable to later periods for professional review.

Do not distribute questionable funds solely because a check arrived. The personal representative, trustee, entity manager, or heirs may have different duties depending on the structure.

## Preserve basis and value evidence

Keep the death certificate, estate inventory, appraisal, reserve or engineering work if any, comparable data, statements near the date of death, production history, lease terms, and tax filings. [IRS Publication 551](https://www.irs.gov/publications/p551) gives general basis rules and recordkeeping context, but the correct inherited basis and later adjustments require fact-specific tax analysis.

A later buyer's offer is not automatically the date-of-death value. A property-tax appraisal may use another date and purpose. Document the method and assumptions used for any required valuation.

## Establish co-heir governance

If several heirs share interests, write down who receives notices, maintains records, contacts payors, approves professional work, and distributes information. Clarify whether each owner acts separately or whether a trust, entity, agent, or agreement supplies authority.

Discuss how the group handles lease proposals, sales, title expenses, tax reporting, suspended funds, and unequal information. Do not assume one heir can bind the others.

## Prepare before considering a sale

Before comparing offers, confirm the seller and interest, obtain complete written terms, preserve basis records, and ask counsel about the deed. A buyer's title process may identify discrepancies, but it is performed for the transaction and does not replace owner-side advice.

MRX can organize inherited-mineral records for a directional review. MRX does not determine heirs or title, administer an estate, or provide legal, tax, or certified-valuation conclusions. MRX may also have an acquisition interest.

## Source notes

- [Texas Estates Code Chapter 358](https://statutes.capitol.texas.gov/Docs/ES/pdf/ES.358.pdf) supports the bounded estate-mineral administration discussion.
- [Texas Property Code Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supports general conveyance and recording context only.
- [RRC royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) supports the limits of RRC authority and the distinction among county, production, lease, and payment records.
- [IRS Publication 551](https://www.irs.gov/publications/p551) supports general basis and recordkeeping principles.

Continue with [Texas mineral inheritance before a sale](/blog/mineral-rights-inheritance-in-texas-what-heirs-need-to-know-before-selling/) or [organize the inherited records](/book/).`,
  },
  {
    slug: 'understanding-1031-tax-implications-for-mineral-rights-owners',
    title: 'Understanding 1031 Tax Implications for Mineral Rights Owners',
    seoTitle: '1031 Tax Implications for Mineral Rights Owners',
    description: 'Review the federal tax issues in a mineral-rights Section 1031 exchange, including gain, basis, boot, reporting, deadlines, and related-party rules.',
    category: 'tax-legal',
    tags: ['1031 exchange mineral rights', 'like-kind exchange tax', 'Form 8824', 'mineral sale tax'],
    primaryKeyword: '1031 tax implications mineral rights',
    pillar: 'mineral-rights-taxes',
    cluster: 'tax-1031-legal-education',
    intent: 'informational',
    hub: '/mineral-rights-taxes/',
    sibling: '/blog/1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work/',
    related: ['1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work', '1031-exchange-vs-traditional-sales-for-mineral-rights'],
    hero: '/assets/articles/mineral-1031-tax-implications-wave9.webp',
    excerpt: 'A Section 1031 exchange can defer qualifying gain, but cash, debt, basis carryover, related parties, filing deadlines, and later disposition still matter.',
    answerSummary: 'A qualifying Section 1031 exchange generally defers rather than erases gain. Owners must confirm the relinquished and replacement assets qualify as real property held for investment or business use, avoid control of proceeds in a deferred exchange, identify and receive replacement property on time, account for cash or non-like-kind property, calculate carryover basis, and report the exchange on Form 8824.',
    takeaways: [
      'Section 1031 applies to qualifying exchanges of real property held for investment or productive business use, not every mineral-related asset or sale.',
      'Cash or other non-like-kind property can cause current gain recognition even when part of the transaction qualifies.',
      'Deferred gain is generally reflected in the replacement property basis and may matter on a later disposition.',
      'Related-party, entity, multi-asset, installment, and state-tax facts require transaction-specific professional review.',
    ],
    questions: ['Which tax consequences can remain after a 1031 exchange?', 'How do cash and basis affect the result?', 'Which reporting and related-party issues should owners flag?'],
    sources: [
      ['IRS Instructions for Form 8824 (2025, accessed 2026-08-06)', 'https://www.irs.gov/instructions/i8824'],
      ['IRS Publication 544, Sales and Other Dispositions of Assets (2025, accessed 2026-08-06)', 'https://www.irs.gov/publications/p544'],
      ['IRS, Like-Kind Exchanges: Real Estate Tax Tips (accessed 2026-08-06)', 'https://www.irs.gov/businesses/small-businesses-self-employed/like-kind-exchanges-real-estate-tax-tips'],
      ['IRS Publication 551, Basis of Assets (accessed 2026-08-06)', 'https://www.irs.gov/publications/p551'],
    ],
    faqs: [
      ['Does a 1031 exchange permanently eliminate tax?', 'Generally, it defers qualifying gain. Carryover basis and later transactions can affect when gain is recognized. Owner-specific exclusions, recapture, estate, and later-disposition rules require professional analysis.'],
      ['What happens if I receive some cash?', 'Cash or other non-like-kind property can trigger current gain recognition up to applicable limits. The full calculation depends on realized gain, liabilities, exchange expenses, and property received.'],
      ['Can royalty income be included in the exchange proceeds?', 'Operating income, accrued payments, receivables, and transferred real-property consideration may receive different treatment. A tax professional and qualified intermediary should separate the components before closing.'],
      ['Which form reports the exchange?', 'Form 8824 is generally used to report each like-kind exchange, with other forms potentially required for recognized gain, installment treatment, or business-property items.'],
      ['Can I complete the exchange after taking the sale proceeds?', 'Direct or constructive receipt can defeat intended deferred-exchange treatment. The exchange must be structured before the relinquished-property closing with qualified professional guidance.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Organize Exchange Records',
    ctaPrompt: 'Bring the ownership and basis records, proposed sale terms, qualified-intermediary documents, replacement-property schedule, and tax questions.',
    body: `> This article provides general federal tax education. It does not determine Section 1031 eligibility, real-property classification, basis, recognized gain, recapture, state tax, reporting, or transaction structure. Engage a qualified tax professional, attorney, and qualified intermediary before closing.

## Answer first

**A Section 1031 exchange can defer qualifying gain, but it generally does not make the tax disappear.** Cash or other non-like-kind property can create current gain, the replacement property's basis can carry deferred gain forward, related-party rules can change the result, and Form 8824 reporting remains required.

For mineral-rights owners, the first tax question is not the deadline. It is whether the specific relinquished and replacement interests qualify as real property held for investment or productive use in a trade or business.

## Confirm the asset and holding purpose

The IRS states in [Publication 544](https://www.irs.gov/publications/p544) that Section 1031 nonrecognition applies only to qualifying real property held for investment or productive business use and not property held primarily for sale. Mineral transactions can include different assets: minerals in place, royalty interests, overriding royalties, leasehold rights, receivables, equipment, or contractual rights. Classification must be determined for each component.

The [Form 8824 instructions](https://www.irs.gov/instructions/i8824) explain the federal definition of real property and note that state or local classification can be one route into that definition, subject to the regulations. Do not assume that every interest called “mineral” receives the same treatment.

## Understand deferral versus exclusion

In a fully qualifying exchange of real property for like-kind real property, gain may not be recognized currently. That is deferral. The deferred economic gain is generally reflected through the basis calculation for the replacement property.

[IRS Publication 551](https://www.irs.gov/publications/p551) provides general basis principles. A simplified explanation is that the replacement basis is not automatically its full purchase price when gain is deferred. Actual calculations can include adjusted basis, recognized gain, money paid or received, liabilities, and exchange expenses.

Preserve the original acquisition records, depletion or other adjustments, partial-sale allocations, exchange closing statements, intermediary records, and replacement-property records.

## Identify cash and non-like-kind property

The [Form 8824 instructions](https://www.irs.gov/instructions/i8824) explain that receiving money or property that is not like kind can cause gain to be recognized even when the rest of the exchange qualifies. Transaction participants often call this “boot,” but the return calculation must follow the form and applicable rules.

Separate sale proceeds for the real-property interest, accrued or unpaid royalties, prorations, cash retained outside the exchange, debt or liability changes, personal-property items, and exchange expenses. Do not let a settlement statement collapse all amounts into one line if the tax treatment may differ.

## Protect the deferred-exchange structure

The IRS [real-estate tax tips](https://www.irs.gov/businesses/small-businesses-self-employed/like-kind-exchanges-real-estate-tax-tips) describe the general like-kind exchange concept. In a deferred exchange, a qualified intermediary is commonly used so the taxpayer does not receive or control proceeds in a way that defeats the intended treatment.

The structure must be in place before the relinquished-property closing. Identification generally must be written and timely, and replacement property must be received within the applicable deadline. The Form 8824 instructions describe the 45-day identification and 180-day receipt framework, including the tax-return due-date limitation.

## Review related-party and entity issues

Special rules apply to related-party exchanges and later dispositions. The Form 8824 instructions identify related parties broadly and require additional reporting in specified years. Indirect structures designed to avoid those rules can fail.

Also confirm that the same taxpayer or properly structured taxpayer owns the relinquished and replacement property. Trusts, estates, partnerships, disregarded entities, co-owners, and post-death administration can complicate that analysis.

## Plan the reporting before closing

Form 8824 is generally filed for the year of the exchange. The form calculates realized gain, current recognized gain, deferred gain, and replacement basis. Depending on the facts, Schedule D, Form 4797, Form 6252, or other filings may also apply.

Do not wait until return preparation to discover that the property description, dates, basis, cash components, or related parties were not documented. Give the tax professional draft closing statements and intermediary documents before signing.

## Model the later disposition

Compare at least three scenarios: a taxable sale now, a fully qualifying exchange, and an exchange with cash or other non-like-kind property. Show current tax, replacement basis, liquidity, transaction costs, investment concentration, and the possible tax effect of a later sale.

Tax deferral can be valuable, but a poor replacement investment or rushed deadline can outweigh it. Section 1031 should be one input in the decision, not the only objective.

MRX can organize mineral and transaction records for a directional review. It does not act as a qualified intermediary or provide tax, legal, accounting, title, or exchange-eligibility conclusions.

## Source notes

- [Form 8824 instructions](https://www.irs.gov/instructions/i8824) support the bounded real-property, deadline, money-or-other-property, related-party, basis, and reporting discussion.
- [IRS Publication 544](https://www.irs.gov/publications/p544) supports general like-kind exchange and disposition context.
- [IRS like-kind exchange tax tips](https://www.irs.gov/businesses/small-businesses-self-employed/like-kind-exchanges-real-estate-tax-tips) support the high-level federal framework only.
- [IRS Publication 551](https://www.irs.gov/publications/p551) supports general basis and recordkeeping principles.

Review [whether a mineral interest may qualify](/blog/1031-exchange-for-mineral-rights-does-it-qualify-and-how-does-it-work/) or [organize the transaction records](/book/).`,
  },
  {
    slug: 'how-to-accurately-assess-your-texas-mineral-rights-value',
    title: 'How to Accurately Assess Your Texas Mineral Rights Value',
    seoTitle: 'Assess Texas Mineral Rights Value With Verifiable Data',
    description: 'Reconcile Texas county, Railroad Commission, operator, payor, lease, appraisal, and offer records to build a transparent mineral-rights value range.',
    category: 'mineral-rights',
    tags: ['Texas mineral rights value', 'RRC production data', 'county mineral records', 'valuation range'],
    primaryKeyword: 'assess Texas mineral rights value',
    pillar: 'texas-mineral-rights',
    cluster: 'texas-county-basin-local-intent',
    intent: 'commercial-investigation',
    hub: '/mineral-rights/texas/',
    sibling: '/blog/top-texas-counties-for-mineral-rights-value-permian-eagle-ford-and-haynesville/',
    related: ['top-texas-counties-for-mineral-rights-value-permian-eagle-ford-and-haynesville', 'what-determines-the-value-of-your-mineral-rights'],
    hero: '/assets/articles/texas-mineral-value-evidence-wave9.webp',
    excerpt: 'A Texas mineral assessment becomes more accurate when evidence supports the ownership, lease, production, and offer assumptions used.',
    answerSummary: 'Assess Texas mineral-rights value by proving the tract and ownership, mapping the interest to leases and RRC identifiers, reconciling reported production with payor statements, documenting nearby activity without treating it as guaranteed development, and showing separate producing, undeveloped, and title-risk scenarios.',
    takeaways: [
      'County records, RRC records, payor statements, and appraisal records answer different questions and must be reconciled.',
      'Texas oil production may be reported at the lease level, so a statement-to-well comparison requires care.',
      'Nearby permits and wells provide context but do not prove timing, geology, or value for the owner’s tract.',
      'Accuracy means transparent inputs and uncertainty, not false precision.',
    ],
    questions: ['Which Texas records support a mineral-value review?', 'How should RRC production be reconciled with royalty statements?', 'How should county and basin context be used without overclaiming?'],
    sources: [
      ['Railroad Commission of Texas online research queries (accessed 2026-08-06)', 'https://www.rrc.texas.gov/resource-center/research/research-queries/'],
      ['Railroad Commission of Texas Production Data Query FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/'],
      ['Railroad Commission of Texas oil and gas well records (accessed 2026-08-06)', 'https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/'],
      ['Texas Comptroller, Valuing Property (accessed 2026-08-06)', 'https://comptroller.texas.gov/taxes/property-tax/valuing-property.php'],
    ],
    faqs: [
      ['Can I assess value from the county name alone?', 'No. County and basin context are broad filters. The tract, formation, ownership, lease, wells, production, operator position, and development evidence can vary materially within one county.'],
      ['Why does RRC production differ from my royalty statement?', 'RRC and payor records may use different reporting levels, periods, product treatment, revisions, and identifiers. Texas oil can be reported by lease, while a statement may allocate revenue by well or property.'],
      ['Does a drilling permit add value?', 'A permit can be relevant development evidence, but it does not guarantee that a well will be drilled, completed, productive, or attributable to the owner’s interest.'],
      ['Is the appraisal-district value a current sale value?', 'Not automatically. It serves a property-tax purpose and may use a different date, information set, and method. Reconcile it with current ownership, production, and market evidence.'],
      ['How often should a Texas mineral assessment be updated?', 'Update when ownership, lease terms, production, commodity assumptions, operator plans, nearby activity, title condition, or written market evidence changes materially.'],
    ],
    legalTaxSensitive: false,
    ctaLabel: 'Organize a Texas Value Review',
    ctaPrompt: 'Bring the county and legal description, deeds, lease, division orders, statements, RRC identifiers, appraisal records, and written offers.',
    body: `> This article provides general education and a data-reconciliation framework. It is not a title opinion, reserve report, engineering study, credentialed appraisal, tax conclusion, owner-specific legal guidance, or guarantee of value or development.

## Answer first

**Accurately assessing Texas mineral-rights value means tracing each material assumption to a record and showing where the record is incomplete.** County documents establish parts of the ownership chain. Railroad Commission records describe regulatory and reported production activity. Leases and division orders affect payment rights. Payor statements show actual accounting. Offers show current counterparty terms.

No one source answers the entire value question.

## Establish the tract and interest first

Record the county, survey, abstract, section, block, tract, legal description, gross acreage, claimed net acreage, interest type, depth limitations, and source deed or probate record. Identify whether the interest is producing, leased but nonproducing, or unleased.

Then list the lease, unit, well, field, operator, payor, RRC district, API number, oil lease number or gas well ID, and owner number where available. Keep the source beside each identifier because similar lease and well names can cause mismatches.

## Use Texas public data for the question it answers

The [RRC online research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) provide access to wellbore, permit, proration, operator, production, and other regulatory data. The [well-records overview](https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/) describes access to imaged records, well logs, and production records.

Use those sources to verify regulatory identifiers, reported activity, operator records, completion documents, and production context. Do not treat an RRC record as proof of the owner's title, lease interpretation, payment decimal, or future drilling plan.

## Reconcile production carefully

Build a monthly table with RRC reported production, statement volumes, prices, ownership decimal, taxes, deductions, adjustments, and net payment. Match by product and production month rather than check date alone.

The [RRC Production Data Query FAQ](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) explains that Texas oil production is reported by lease and gas production by well, that online information has reporting lag, and that reported data may later be revised. A single oil lease may contain multiple wells. Those facts can explain differences without proving that a statement is correct.

When records do not reconcile, document the gap and ask the payor for its property, well, unit, and adjustment mapping.

## Separate the value components

For producing interests, model attributable cash flow using explicit price, volume, decline, ownership, burden, expense, and discount assumptions. Use several scenarios rather than extending a recent check indefinitely.

For undeveloped potential, document lease status, depth rights, nearby wells and permits, operator acreage, spacing, unit or allocation context, access, and credible development information. Assign uncertainty to timing and probability. A permit or offset well does not guarantee a well on the tract.

For title or curative risk, list missing instruments, conflicting acreage, unreleased interests, probate gaps, suspense, and co-owner issues. Do not silently deduct an arbitrary amount; show the unresolved item and who can investigate it.

## Use county and basin labels as context, not price tags

Texas counties can span different formations, development stages, operators, and infrastructure. Basin labels are also broad. Compare transactions or offers only when the interest type, production, lease terms, tract position, title condition, and timing are reasonably aligned.

A generalized county price per acre can be a screening input, not a conclusion. Write down the date and source of every comparable and explain each adjustment.

## Reconcile appraisal records with market work

The Texas Comptroller's [valuation guidance](https://comptroller.texas.gov/taxes/property-tax/valuing-property.php) describes market value for property-tax administration and general appraisal methods. An appraisal-district value may be useful historical evidence, but it can differ from a current transaction because of date, data, statutory purpose, and assumptions.

Check whether the appraisal record covers the same interest, owner, county account, wells, and tax year. Keep notices, protests, and supporting schedules.

## Compare offers on a common scope

Normalize written offers only after matching the property conveyed. Compare price, retained interest, depths, wells, future development, title adjustments, diligence period, payment event, deed language, and closing risk. A larger headline number may cover more property.

Show a clear range with the supporting records, sensitivities, and exclusions. False precision is not accuracy.

MRX can organize Texas mineral records for a directional review and may have an acquisition interest. Owners should consider that potential conflict and obtain independent legal, tax, engineering, appraisal, or brokerage advice where appropriate.

## Source notes

- [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) support the bounded public-data inventory.
- [RRC Production Data Query FAQ](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) supports the lease-versus-well, lag, and revision cautions.
- [RRC well-records overview](https://www.rrc.texas.gov/oil-and-gas/research-and-statistics/obtaining-commission-records/oil-and-gas-well-records/) supports the available well and production record context.
- [Texas Comptroller valuation guidance](https://comptroller.texas.gov/taxes/property-tax/valuing-property.php) supports only the property-tax and general market-value context.

Explore [Texas county and basin context](/blog/top-texas-counties-for-mineral-rights-value-permian-eagle-ford-and-haynesville/) or [organize a Texas value review](/book/).`,
  },
  {
    slug: 'understanding-your-mineral-royalty-checks-breakdown',
    title: 'Understanding Your Mineral Royalty Checks Breakdown',
    seoTitle: 'Mineral Royalty Check Breakdown: Gross to Net',
    description: 'Reconcile a Texas mineral royalty check from product volume and price through ownership decimal, taxes, deductions, adjustments, suspense, and net payment.',
    category: 'understanding-mineral-rights',
    tags: ['royalty check breakdown', 'ownership decimal', 'royalty deductions', 'Texas production records'],
    primaryKeyword: 'mineral royalty checks breakdown',
    pillar: 'title-lease-ownership',
    cluster: 'title-lease-ownership-documents',
    intent: 'informational',
    hub: '/learning-center/title-lease-ownership/',
    sibling: '/blog/how-to-decode-your-royalty-check-statement/',
    related: ['how-to-decode-your-royalty-check-statement', 'how-to-interpret-your-mineral-rights-royalty-checks'],
    hero: '/assets/articles/royalty-check-breakdown-wave9.webp',
    excerpt: 'A royalty check can be reconciled from gross product revenue to net payment when the statement’s property, volume, price, decimal, taxes, deductions, and adjustments are mapped consistently.',
    answerSummary: 'Break down a mineral royalty check by matching the payor property and production month, calculating gross product revenue, applying the statement ownership decimal, tracing taxes and deductions, separating prior-period adjustments and suspense, and reconciling the result to net payment. Differences should become written questions, not assumptions about title or underpayment.',
    takeaways: [
      'Check date and production month are different; use the production period shown on the statement.',
      'The ownership decimal should be traced to the lease, unit or well allocation, and division-order record.',
      'Taxes, deductions, price adjustments, prior-period entries, and suspense releases should be separated.',
      'RRC production is a useful comparison but may use a different reporting level and can be revised.',
    ],
    questions: ['How does a royalty statement move from gross revenue to net payment?', 'Which records support the ownership decimal?', 'How should a statement be compared with RRC production?'],
    sources: [
      ['Railroad Commission of Texas royalties FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/royalties-faq/'],
      ['Railroad Commission of Texas Production Data Query FAQ (accessed 2026-08-06)', 'https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/'],
      ['Railroad Commission of Texas online research queries (accessed 2026-08-06)', 'https://www.rrc.texas.gov/resource-center/research/research-queries/'],
      ['Texas Comptroller, Crude Oil and Natural Gas Production Taxes (accessed 2026-08-06)', 'https://comptroller.texas.gov/taxes/natural-gas/'],
    ],
    faqs: [
      ['Why is the check date later than the production month?', 'Operators and payors report, sell, account for, and remit production on a cycle. The statement should identify the production period; later adjustments can appear on another check.'],
      ['How can I verify the ownership decimal?', 'Trace it to the lease royalty, net ownership, unit or well allocation, division order, and any burdens or transfers. A statement decimal is evidence of the payor’s calculation, not a title opinion.'],
      ['Are all deductions improper?', 'No. Treatment depends on the lease, product, charge, law, and facts. Identify each code and amount, obtain the payor definition, and ask qualified counsel about disputed lease treatment.'],
      ['Why does RRC production not equal statement volume?', 'RRC oil and gas reporting levels, revisions, timing, products, and property identifiers may differ from the payor statement. Reconcile the mapping before drawing a conclusion.'],
      ['What should I do if the math does not reconcile?', 'Preserve the statement, calculate the exact variance, ask the payor for code definitions and property mapping, and escalate title, lease, accounting, or legal questions to the appropriate professional.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Organize a Royalty Reconciliation',
    ctaPrompt: 'Bring twelve months of statements, the lease, division orders, owner and property numbers, tax forms, and any payor explanations.',
    body: `> This article provides general education and a reconciliation framework. It is not a payor audit, title opinion, lease interpretation, accounting service, owner-specific legal guidance, owner-specific tax guidance, or determination that a payment is correct or incorrect.

## Answer first

**Break down a mineral royalty check from gross product revenue to net payment, one property and production month at a time.** Identify the product volume and price, calculate or locate gross revenue, apply the ownership decimal, separate taxes and deductions, account for adjustments or suspense, and reconcile the result to the amount paid.

When the numbers do not match, preserve the variance as a question. Do not immediately assume the statement is wrong or that the decimal proves title.

## Identify the statement grain

Start with the payor, owner number, property or lease number, well or unit name, county, product, production month, and check date. One check can combine several properties and months. Split each line into a worksheet before totaling.

Keep the statement code legend. If none is provided, request definitions for product, tax, deduction, adjustment, and suspense codes.

## Reconstruct gross product revenue

A simplified line begins with statement volume multiplied by the reported sales price, subject to the payor's measurement, product, and adjustment conventions. Confirm the units: barrels, thousand cubic feet, gallons, or another basis. Natural-gas liquids and residue gas may appear separately.

Compare the line's gross value with the statement total. Differences may reflect allocation, quality, transportation, prior-period pricing, or another product line. Ask for the payor's calculation rather than inventing a plug number.

## Trace the ownership decimal

The statement decimal may reflect the owner's net interest, lease royalty, unit participation, well allocation, and other burdens. Reconstruct it only from supported inputs. Compare with the signed division order and note whether that document applies to the same well, unit, or property.

A decimal change can follow a transfer, title cure, unit revision, new well, allocation change, or payor correction. Ask for the effective date and basis. Do not treat payor acceptance as a complete title determination.

The RRC's [royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) explains that the Commission does not have authority over many lease and royalty-payment disputes and directs owners to county and production records for different information.

## Separate taxes from deductions

Create distinct columns for production or severance taxes, marketing, gathering, transportation, compression, processing, treatment, and other charges. The Texas Comptroller's [natural-gas tax page](https://comptroller.texas.gov/taxes/natural-gas/) supplies official state production-tax context; it does not explain every statement entry or decide who bears a charge under a lease.

Obtain the payor's code definition and the lease language before concluding that a deduction is allowed. Different products, leases, amendments, and sales arrangements can produce different treatment.

## Isolate adjustments and suspense

Prior-period entries can reverse and repost volume, price, decimal, tax, or deduction amounts. Suspense releases can combine many production months. Place each adjustment beside the original month when possible.

Track the original line amount, adjustment code, revised volume or price, suspense withheld or released, effective date, and resulting net change. Do not annualize a check that contains a large catch-up payment.

## Compare with RRC data carefully

Use the [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) to locate wells, leases, operators, and reported production. The [Production Data Query FAQ](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) explains that Texas oil production is reported by lease and gas production by well, online data has lag, and later revisions occur.

That means an oil-lease total may include multiple wells while the royalty statement separates them. Product categories and production months may also differ. First prove the property mapping, then explain the variance.

## Reconcile to the payment

For each line, show gross owner revenue, less taxes, less deductions, plus or minus adjustments, plus suspense released, and the net line amount. Sum all lines and compare with the check or deposit.

If the difference remains, check for minimum-pay thresholds, recoupment, stale-date replacement, returned mail, withholding, or another property on the remittance. Request a written explanation using the payor's property and owner numbers.

## Build a twelve-month control sheet

Track production volume, price, decimal, gross revenue, taxes, deductions, adjustments, and net payment by month. Flag abrupt changes and annotate known events such as a new well, ownership transfer, division-order update, shut-in period, or price correction.

This control sheet helps distinguish a recurring calculation question from a one-time timing event. It does not prove reserves or future income.

MRX can organize statements for a directional review. It does not audit the payor, interpret the lease for an owner, determine title, or provide legal, tax, or accounting conclusions.

## Source notes

- [RRC royalties FAQ](https://www.rrc.texas.gov/about-us/faqs/royalties-faq/) supports the limits of Commission authority and the distinction among lease, county, and production records.
- [RRC Production Data Query FAQ](https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-data-query-system-faqs/) supports the reporting-level, lag, and revision cautions.
- [RRC research queries](https://www.rrc.texas.gov/resource-center/research/research-queries/) support the public well, lease, operator, and production lookup steps.
- [Texas Comptroller natural-gas tax page](https://comptroller.texas.gov/taxes/natural-gas/) supports only official state production-tax context.

Learn to [decode a royalty statement](/blog/how-to-decode-your-royalty-check-statement/) or [organize a twelve-month reconciliation](/book/).`,
  },
  {
    slug: 'understanding-the-key-differences-our-underwriter-review-vs-traditional-mineral-rights-brokers',
    title: 'Understanding the Key Differences: Our Underwriter Review vs. Traditional Mineral Rights Brokers',
    seoTitle: 'Underwriter Review vs. Mineral Rights Broker',
    description: 'Compare an MRX directional underwriter review with a traditional brokerage by role, market exposure, compensation, deliverables, and conflicts.',
    category: 'selling-process',
    tags: ['mineral underwriter review', 'mineral rights broker', 'offer review process', 'mineral sale options'],
    primaryKeyword: 'underwriter review vs mineral rights broker',
    pillar: 'mrx-methodology',
    cluster: 'mrx-methodology-transparency-underwriter-process',
    intent: 'commercial-investigation',
    hub: '/methodology/',
    sibling: '/blog/what-to-expect-during-the-underwriter-review-process-for-your-mineral-rights/',
    related: ['what-to-expect-during-the-underwriter-review-process-for-your-mineral-rights', 'can-i-still-get-a-valid-underwriter-review-if-i-have-competing-mineral-rights-offers'],
    hero: '/assets/articles/underwriter-review-vs-broker-wave9.webp',
    excerpt: 'An MRX directional underwriter review and a broker engagement can serve different jobs; compare scope, market outreach, compensation, deliverables, and conflicts in writing.',
    answerSummary: 'An MRX directional underwriter review organizes the owner’s property, production, payment, and offer evidence and may lead to an MRX acquisition discussion. A broker engagement may involve marketing the interest, soliciting buyers, managing a process, and compensation under a separate agreement. Owners should verify the actual scope, credentials, fees, conflicts, deliverables, and decision rights for any provider.',
    takeaways: [
      'Compare the written engagement and deliverables, not the provider label alone.',
      'A directional underwriter review is not a credentialed appraisal, title opinion, reserve report, legal opinion, or brokerage auction.',
      'Market outreach, buyer solicitation, confidentiality, compensation, and closing support vary by broker and agreement.',
      'MRX may have an acquisition interest, so owners should consider that potential conflict and seek independent advice when appropriate.',
    ],
    questions: ['What does an MRX underwriter review do?', 'How may a broker engagement differ?', 'Which fees, conflicts, and deliverables should owners compare?'],
    sources: [
      ['MineralRightsXchange methodology page (accessed 2026-08-06)', 'https://mineralrightsxchange.com/methodology/'],
      ['MineralRightsXchange underwriter review intake (accessed 2026-08-06)', 'https://mineralrightsxchange.com/book/'],
      ['Texas Secretary of State business filings and searches (accessed 2026-08-06)', 'https://www.sos.state.tx.us/corp/do-business.shtml'],
      ['Texas Property Code Chapter 5, conveyances and mineral-offer disclosure (accessed 2026-08-06)', 'https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf'],
    ],
    faqs: [
      ['Is an MRX underwriter review an appraisal?', 'No. It is a directional review of available mineral and transaction information. It is not a credentialed appraisal, reserve report, engineering study, title opinion, or legal or tax conclusion.'],
      ['Does an underwriter review market my minerals to multiple buyers?', 'Not by itself. A broker or another marketing engagement may include buyer outreach under its agreement. Confirm the actual MRX and provider scope in writing.'],
      ['Do all mineral brokers provide the same service?', 'No. Services, credentials, compensation, exclusivity, marketing methods, confidentiality, buyer access, and closing support vary. Review the specific agreement and provider.'],
      ['Can MRX be interested in acquiring the minerals it reviews?', 'Yes, MRX may have an acquisition interest. Owners should consider that potential conflict and obtain independent advice or market evidence when appropriate.'],
      ['Can I use both a review and a broker?', 'Potentially. Check confidentiality, exclusivity, fee, non-circumvention, and communication terms before combining services, and make sure each provider knows the permitted role.'],
    ],
    legalTaxSensitive: true,
    ctaLabel: 'Prepare for an Underwriter Review',
    ctaPrompt: 'Bring the ownership, lease, production, statement, tax, and offer records, along with any brokerage or marketing agreement already in place.',
    body: `> This article describes general process differences and current MRX first-party representations. It does not provide brokerage, legal, tax, title, engineering, appraisal, or investment advice; verify every provider’s actual agreement, credentials, fees, and conflicts.

## Answer first

**An MRX directional underwriter review and a traditional mineral-rights broker engagement can perform different jobs.** The review organizes property, production, payment, and offer information and explains a directional range and open questions. A broker may market an interest, contact buyers, manage bids, and support a transaction under a separate engagement.

Neither label guarantees quality, price, independence, market coverage, or closing. Compare the written scope.

## Start with the owner’s objective

Write the decision the owner is trying to make: understand records, evaluate an unsolicited offer, estimate a directional range, expose an interest to potential buyers, negotiate terms, obtain a credentialed appraisal, or prepare title and closing documents.

One provider may handle only part of the objective. Do not assume an underwriter, broker, buyer, appraiser, engineer, attorney, or landman is interchangeable.

## What the MRX review is designed to do

The MRX [methodology page](https://mineralrightsxchange.com/methodology/) describes a record-based process using property, production, ownership, and market inputs. The [booking page](https://mineralrightsxchange.com/book/) provides the current intake path.

A directional review can organize deeds, leases, division orders, statements, RRC identifiers, and offers; surface missing inputs; separate producing and undeveloped considerations; explain assumptions behind a directional range; compare written offers on a common scope; and identify questions for the appropriate professional.

It does not determine legal title, certify reserves or value, audit a payor, market the asset to an open buyer set, or give owner-specific legal or tax guidance.

## How a broker engagement may differ

A broker may, depending on the provider and agreement, prepare marketing materials, contact potential buyers, manage confidentiality, solicit indications or bids, coordinate a data room, help compare offers, and support diligence and closing communication.

Services vary. Some providers may act in other capacities or use different compensation models. Ask for the exact legal entity and verify public filing information through the Texas Secretary of State's [business resources](https://www.sos.state.tx.us/corp/do-business.shtml) where applicable. Entity registration does not establish competence or authorize a particular activity.

## Compare compensation and incentives

Request a written explanation of upfront, hourly, success, percentage, referral, or other fees; minimum fees and expenses; exclusivity; engagement term; tail or non-circumvention clauses; affiliate acquisition rights; buyer-side payments; and who receives transaction funds.

MRX states that its directional review is free, but MRX may have an acquisition interest. That potential conflict must be evaluated. “Free” does not mean conflict-free or independent.

## Compare market exposure

Ask whether a process includes no outreach, selected counterparties, a private bid process, broad outreach, or a public listing. Document how buyers are selected, how long the process runs, whether bids are binding, and what information is disclosed.

A broker process may increase exposure but also add time, fees, confidentiality concerns, or execution conditions. A direct review may be faster but is not evidence that the interest reached the broader market.

## Compare deliverables

For an underwriter review, ask whether the owner receives a document list, assumptions, directional range, comparison table, open questions, or acquisition proposal. For a broker, ask about pricing analysis, marketing package, buyer list, bid log, recommendation, negotiation record, and closing support.

Confirm who owns the work product and whether the owner can share it with counsel, heirs, tax professionals, or another provider.

## Protect owner control and data

Clarify who may contact operators, payors, co-owners, buyers, or advisors. Define confidentiality, data security, publicity, assignment, and termination. Do not share passwords or unnecessary taxpayer and bank information.

Before any sale, review the deed and property description. Texas Property Code [Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supplies general conveyance context and a disclosure rule for one defined mailed mineral-offer scenario. Neither a review nor a broker process replaces owner-side legal analysis.

## Use a written comparison checklist

Score each provider on objective fit, scope, people and credentials, data sources, market reach, compensation, conflicts, confidentiality, deliverables, timing, termination, owner control, and post-selection closing support. Record unknowns and require written clarification.

The right choice may be a review, broker, credentialed appraiser, engineer, attorney, tax professional, direct buyer process, or combination. Confirm engagement conflicts before combining roles.

## Source notes

- [MRX methodology](https://mineralrightsxchange.com/methodology/) and [MRX booking](https://mineralrightsxchange.com/book/) support only the current first-party description of the directional-review process and intake.
- [Texas Secretary of State business resources](https://www.sos.state.tx.us/corp/do-business.shtml) support the entity-record verification step, not provider approval.
- [Texas Property Code Chapter 5](https://statutes.capitol.texas.gov/Docs/PR/pdf/PR.5.pdf) supports general conveyance and bounded mailed-offer disclosure context.

Review [what to expect in an underwriter review](/blog/what-to-expect-during-the-underwriter-review-process-for-your-mineral-rights/) or [prepare the record packet](/book/).`,
  },
];

function renderFrontmatter(article, publishedAt) {
  const lines = [
    '---',
    `title: ${q(article.title)}`,
    `seo_title: ${q(article.seoTitle)}`,
    `description: ${q(article.description)}`,
    `published_at: ${q(publishedAt)}`,
    `updated_at: ${q(updatedAt)}`,
    'draft: false',
    'publication_status: draft',
    'noindex: true',
    `author: ${q('marisol')}`,
    `category: ${q(article.category)}`,
    'tags:',
    ...article.tags.map((tag) => `  - ${q(tag)}`),
    `primary_keyword: ${q(article.primaryKeyword)}`,
    `content_program: ${q('mrx1000')}`,
    `content_cluster: ${q(article.cluster)}`,
    `content_intent: ${q(article.intent)}`,
    `content_guide: ${q('connor')}`,
    `content_batch: ${q('wave9')}`,
    'internal_links:',
    `  hub: ${q(article.hub)}`,
    `  sibling: ${q(article.sibling)}`,
    `  conversion: ${q('/book/')}`,
    'hero_image:',
    `  src: ${q(article.hero)}`,
    `  alt: ${q(article.title)}`,
    '  width: 1200',
    '  height: 630',
    `  mime_type: ${q('image/webp')}`,
    `  social_src: ${q(article.hero)}`,
    `  social_alt: ${q(article.title)}`,
    '  social_width: 1200',
    '  social_height: 630',
    `  social_mime_type: ${q('image/webp')}`,
    `  source: ${q('MRX-owned')}`,
    `  license: ${q('MRX-owned')}`,
    `excerpt: ${q(article.excerpt)}`,
    'featured: false',
    'disclaimer_top: true',
    'has_footer_disclaimer: true',
    'money_figure_sourced: false',
    `reviewed_at: ${q(updatedAt)}`,
    `reviewed_by: ${q('mrx_compliance-continuous-wave9')}`,
    'reviewers:',
    `  - ${q('mrx_research')}`,
    `  - ${q('mrx_compliance')}`,
    `  - ${q('mrx_copy')}`,
    'states:',
    `  - ${q('TX')}`,
    'sources:',
    ...article.sources.flatMap(([label, href]) => [
      `  - label: ${q(label)}`,
      `    href: ${q(href)}`,
    ]),
    'persona_topics:',
    `  - ${q('Texas mineral rights owner')}`,
    `  - ${q(article.primaryKeyword)}`,
    `search_intent: ${q(article.intent)}`,
    `pillar: ${q(article.pillar)}`,
    `cluster: ${q(article.cluster)}`,
    `parent_page: ${q(article.hub)}`,
    'related_articles:',
    ...article.related.map((slug) => `  - ${q(slug)}`),
    `answer_summary: ${q(article.answerSummary)}`,
    'key_takeaways:',
    ...article.takeaways.map((item) => `  - ${q(item)}`),
    'questions_answered:',
    ...article.questions.map((item) => `  - ${q(item)}`),
    'faq:',
    ...article.faqs.flatMap(([question, answer]) => [
      `  - question: ${q(question)}`,
      `    answer: ${q(answer)}`,
    ]),
    `legal_tax_sensitive: ${article.legalTaxSensitive}`,
    'conversion_cta:',
    `  label: ${q(article.ctaLabel)}`,
    `  href: ${q('/book/')}`,
    `  prompt: ${q(article.ctaPrompt)}`,
    `featured_guide: ${q('connor')}`,
    '---',
  ];
  return `${lines.join('\n')}\n`;
}

if (articles.length !== 10) {
  throw new Error(`Expected ten Wave 9 articles; configured ${articles.length}`);
}

for (const article of articles) {
  const path = join(root, 'src/content/posts', `${article.slug}.mdx`);
  const existing = await readFile(path, 'utf8');
  const publishedAt = existing.match(/^published_at:\s*['"]([^'"]+)['"]$/m)?.[1];
  if (!publishedAt) throw new Error(`${article.slug}: existing published_at missing`);
  const output = `${renderFrontmatter(article, publishedAt)}\n${article.body.trim()}\n`;
  const faqCount = (output.match(/^  - question:/gm) ?? []).length;
  const sourceCount = (output.match(/^  - label:/gm) ?? []).length;
  const bodyWordCount = article.body.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu)?.length ?? 0;
  if (faqCount !== 5 || sourceCount < 3 || bodyWordCount < 800) {
    throw new Error(`${article.slug}: faq=${faqCount}, sources=${sourceCount}, body_words=${bodyWordCount}`);
  }
  if (!output.includes(`title: ${q(article.title)}`) ||
      !output.includes(`  alt: ${q(article.title)}`) ||
      !output.includes(`  social_alt: ${q(article.title)}`)) {
    throw new Error(`${article.slug}: exact title identity mismatch`);
  }
  await writeFile(path, output, 'utf8');
  console.log(`${article.slug}: ${bodyWordCount} body words`);
}
