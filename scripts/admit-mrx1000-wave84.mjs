#!/usr/bin/env node

process.env.MRX_WAVE_NUMBER = '84';
process.env.MRX_ARTICLE_SLUG =
  'refrac-workover-event-claim-register-source-preserving-record-template';
process.env.MRX_ARTICLE_TITLE =
  'Refrac and Workover Event-Claim Register: A Source-Preserving Record Template';
process.env.MRX_PRIMARY_KEYWORD = 'refrac workover event claim register';
process.env.MRX_INLINE_KEYWORD = 'refrac workover event claim register';
process.env.MRX_HERO_FILENAME =
  'refrac-and-workover-event-claim-register-a-source-preserving-record-template';
process.env.MRX_HERO_ALT =
  'A source-separated event-claim register appears beside the exact article title.';
process.env.MRX_INLINE_ALT =
  'A blank overhead event-claim worksheet appears above the exact keyword.';
process.env.MRX_PROGRAM_ROW_ID = 'MRX1000-0269';
process.env.MRX_SELECTION_RANK = '164';
process.env.MRX_DECISION_ID = 'MRX1000-W84-SELECT-2026-08-23';
process.env.MRX_DECISION_PATH =
  'docs/governance/mrx1000-wave84-selection-decision-2026-08-23.md';
process.env.MRX_REVIEWED_BY = 'mrx_compliance-continuous-wave84';
process.env.MRX_PRIOR_TITLE = 'Refracs and Workovers: How Upside Is Treated in Valuation';
process.env.MRX_PRIOR_SLUG = 'refracs-and-workovers-how-upside-is-treated-in-valuation';
process.env.MRX_PRIOR_SOURCE_HANDLE =
  'factory-taxonomy-synthesis:valuation:refracs-workovers-mineral-valuation';
process.env.MRX_SECONDARY_KEYWORDS_JSON = JSON.stringify([
  'refrac workover event claim register',
  'refrac workover records template',
  'oil well event claim source log',
]);
process.env.MRX_NEAREST_SAME_CLUSTER_SLUG =
  'pdp-pud-and-undeveloped-acreage-terminology-register';
process.env.MRX_CANNIBALIZATION_SCORE = '0.07';
process.env.MRX_INLINE_VISUAL_VARIANT =
  'wave84-distinct-generated-overhead-blank-refrac-workover-event-claim-register';
process.env.MRX_ACTION_REASON =
  'The original refrac-and-workover valuation-upside identity was rejected because the live corpus already owns decline-curve discontinuities, DCF evidence treatment, discount-rate assumptions, and valuation-refresh triggers. The approved replacement owns only a specialized source-preserving event-claim register with identifiers, exact source wording, dates, non-causal reported periods, unknowns, and follow-up assignments. It does not confirm or interpret an intervention, infer causation, forecast production, construct or segment a decline curve, estimate reserves or upside, value an interest, analyze an offer, or decide property connection, ownership, title, lease, operations, payment, or entitlement. Release remains controlled by the signed batch, matching evidence, deployment, and live verification.';
process.env.MRX_RISK_REMEDIATION_JSON = JSON.stringify([
  'The original refrac-and-workover valuation identity was rejected because it materially collides with live decline-curve, DCF, valuation-assumption, and asset-decision coverage. The admitted replacement owns only a source-preserving event-claim register.',
  'Current Texas regulator and SEC sources support only record-location, form-identity, filing-identity, and dated reported-period logistics. None proves that an event occurred, establishes a property connection, attributes causation, forecasts production, estimates reserves, or determines value.',
  'Continuous quality-gated admission under D-2026-0804-16, the 2026-08-14 no-approval owner directive, and MRX1000-W84-SELECT-2026-08-23; no numerical cap, elapsed-time gate, or owner publication approval applies.',
  'Publication remains conditional on current editorial, factual-citation, compliance, two-image, metadata, build, rollback, deployment, and live-verification evidence.',
]);

await import('./admit-mrx1000-wave82.mjs');
