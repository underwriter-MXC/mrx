/**
 * Per-page FAQPage factory. Per SEO plan §2.3. The /faq page uses
 * this with the 7 required Q&A pairs from compliance Q-3; any post
 * with a <FaqBlock> uses this scoped to that block.
 */
import type { FAQPage, Question } from 'schema-dts';
import type { FaqPair } from '../lib/astro/content';

export function faqPage(pairs: FaqPair[]): FAQPage {
  const mainEntity: Question[] = pairs.map((p) => ({
    '@type': 'Question',
    name: p.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: p.answer,
    },
  }));
  return {
    '@type': 'FAQPage',
    mainEntity,
  };
}
