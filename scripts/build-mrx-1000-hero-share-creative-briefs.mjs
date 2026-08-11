#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format as formatWithPrettier } from 'prettier';
import sharp from 'sharp';
import { projectLedgerArticlesForRuntime } from './_mrx1000-runtime-publication-projection.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MRX_ROOT = path.resolve(SCRIPT_DIR, '..');
const WORKSPACE_ROOT = path.resolve(MRX_ROOT, '..');

const INPUTS = {
  ledger: process.env.MRX1000_HERO_SHARE_LEDGER_PATH
    ? path.resolve(process.env.MRX1000_HERO_SHARE_LEDGER_PATH)
    : path.join(MRX_ROOT, 'config/mrx-1000-canonical-content-ledger.json'),
  ownerDecision: path.join(
    MRX_ROOT,
    'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
  ),
  twoImageRetrofit: path.join(MRX_ROOT, 'config/mrx-article-two-image-retrofit.json'),
  twoImageDecision: path.join(
    MRX_ROOT,
    'artifacts/mrx1000-release-10/decisions/mrx-owner-two-image-retrofit-authorization-20260811.md',
  ),
};

const ISOLATED_OUTPUT_DIR = process.env.MRX1000_HERO_SHARE_OUTPUT_DIR
  ? path.resolve(process.env.MRX1000_HERO_SHARE_OUTPUT_DIR)
  : null;
const OUTPUTS = ISOLATED_OUTPUT_DIR
  ? {
      json: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-hero-share-creative-briefs.json'),
      csv: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-hero-share-creative-briefs.csv'),
      report: path.join(ISOLATED_OUTPUT_DIR, 'mrx-1000-hero-share-creative-briefs.md'),
    }
  : {
      json: path.join(MRX_ROOT, 'config/mrx-1000-hero-share-creative-briefs.json'),
      csv: path.join(MRX_ROOT, 'config/mrx-1000-hero-share-creative-briefs.csv'),
      report: path.join(MRX_ROOT, 'reports/mrx-1000-hero-share-creative-briefs.md'),
    };

const OWNER_DECISION_SHA256 = 'edc1d4602149558ff6d2b960416839b8caf97593f5fd8fe6ea91b56617d1425f';
const PUBLIC_CLASS = 'live_public_published_route';
const HELD_CLASS = 'incumbent_draft_nonpublic_held';
const PILOT_CLASS = 'pilot_draft_noindex_stage';
const REUSE_RULE =
  'canonical_exact_title_hero_reused_identically_for_visible_hero_open_graph_twitter_and_featured_share_surfaces';

const GLOBAL_PROHIBITIONS = [
  'no readable words other than the one exact required title or keyword phrase; no logos, watermarks, UI screenshots, signatures, or fake document text',
  'no cash piles, floating dollar signs, handshakes, gold bars, gavels, or stock-photo celebration poses',
  'no guaranteed value, guaranteed closing, guaranteed savings, guaranteed production, or investment-return claims',
  'no invented prices, production figures, legal conclusions, tax outcomes, ownership facts, or regulatory seals',
  'no unsafe active oilfield access, environmental damage spectacle, distressed-owner imagery, or manipulative urgency',
];

const CLUSTER_CREATIVE = {
  'sell-mineral-rights-decision-process': {
    scene:
      'a Texas mineral owner and an independent underwriter arranging a property map, transaction checklist, deed, and timeline on a calm office table',
    altLead: 'A Texas mineral owner reviewing a property map, deed, and transaction checklist',
    focal: 'the owner, the property map, and the checklist',
    palette: 'warm sandstone, deep navy, restrained copper, and natural daylight',
  },
  'valuation-methodology-drivers': {
    scene:
      'an underwriter comparing production curves, royalty statements, county records, and a mapped mineral tract without displaying legible figures',
    altLead:
      'An underwriter comparing production charts, royalty records, and a mapped mineral tract',
    focal: 'the production chart, royalty record, and mapped tract',
    palette: 'slate blue, cream, muted teal, and controlled amber accents',
  },
  'offer-review-buyer-comparison-safety': {
    scene:
      'two neutral offer folders beside a term-comparison worksheet, calculator, magnifier, and property map, with no buyer branding or legible contract language',
    altLead: 'Two mineral-rights offer folders beside a comparison worksheet and property map',
    focal: 'the two offer folders and the comparison worksheet',
    palette: 'charcoal, ivory, navy, and a restrained safety-orange accent',
  },
  'inherited-estate-probate': {
    scene:
      'a family representative organizing a mineral deed, probate folder, family ownership diagram, and county map in a respectful private setting',
    altLead:
      'A family representative organizing a mineral deed, probate records, and an ownership map',
    focal: 'the deed, probate folder, and ownership map',
    palette: 'soft walnut, parchment, deep green, and gentle window light',
  },
  'royalties-owner-operations': {
    scene:
      'a royalty owner reviewing a payment statement, production history, well diagram, lease map, and calculator with figures intentionally unreadable',
    altLead: 'A royalty owner reviewing a payment statement, production history, and lease map',
    focal: 'the payment statement, production history, and lease map',
    palette: 'deep blue, steel gray, warm cream, and subtle petroleum-green accents',
  },
  'tax-1031-legal-education': {
    scene:
      'a mineral owner and licensed-professional stand-ins reviewing a tax worksheet, royalty statement, deed, and calendar without legible amounts or advisory claims',
    altLead: 'A mineral owner reviewing a tax worksheet, royalty statement, deed, and calendar',
    focal: 'the worksheet, deed, and calendar',
    palette: 'forest green, navy, cream, and restrained burgundy accents',
    additionalProhibitions: [
      'no attorney-client or CPA-client relationship implication',
      'no specific tax rate, deadline, exemption, deduction, exchange eligibility, or legal-result claim',
    ],
  },
  'texas-county-basin-local-intent': {
    scene:
      'a topographic Texas county and basin map beside well records, a mineral deed, and understated field context, without marking an invented parcel',
    altLead: 'A Texas county and basin map beside well records and a mineral deed',
    focal: 'the county or basin map, well record, and deed',
    palette: 'Texas limestone, sage, rust, and deep blue under clear natural light',
  },
  'title-lease-ownership-documents': {
    scene:
      'a land professional tracing a chain of mineral deeds, lease pages, division orders, and ownership layers across a county map with all text illegible',
    altLead:
      'A land professional tracing mineral deeds, lease records, and ownership layers on a county map',
    focal: 'the deed chain, lease records, and ownership layers',
    palette: 'parchment, graphite, navy, and muted surveyor-orange accents',
  },
  'mrx-methodology-transparency-underwriter-process': {
    scene:
      'an MRX underwriter presenting transparent assumptions through production data, ownership records, a methodology checklist, and a mapped mineral tract',
    altLead:
      'An MRX underwriter reviewing production data, ownership records, and a methodology checklist',
    focal: 'the underwriter, methodology checklist, and supporting records',
    palette: 'MRX navy, clean white, mineral blue, and restrained copper accents',
  },
};

const CAMERA_VARIANTS = [
  'eye-level documentary framing',
  'slightly elevated editorial tabletop framing',
  'three-quarter environmental portrait framing',
  'close editorial still-life framing with human context at the edge',
];

const COMPOSITION_VARIANTS = [
  'focal group centered with balanced negative space on both sides',
  'focal group in the left-center with quiet space to the right',
  'focal group in the right-center with quiet space to the left',
  'focal group on the lower central third with a calm uncluttered background',
];

const LIGHTING_VARIANTS = [
  'soft north-window daylight with controlled contrast',
  'clean late-morning daylight with natural paper texture',
  'restrained studio daylight with realistic practical shadows',
  'warm indirect daylight with neutral color rendering',
];

/**
 * Topic rules are intentionally independent of the nine broad clusters. A row
 * must receive concrete object/action/risk/decision semantics from its title
 * and primary keyword before its brief can be marked ready.
 */
const TOPIC_RULES = [
  {
    id: 'privacy-confidentiality',
    match: /\b(privacy|confidential|personal information|data security)\b/i,
    objects: 'sealed owner records, a closed document folder, and a privacy-control checklist',
    action: 'separating personal identifiers from property evidence before sharing records',
    risk: 'unnecessary disclosure of private owner information',
    decision: 'which records are safe and necessary to share',
    altScene: 'A mineral owner reviews sealed records and privacy safeguards',
    metadataFocus: 'privacy safeguards and document controls',
  },
  {
    id: 'tax-1031-exchange',
    match: /\b(1031|like-kind|exchange propert|qualified intermediary)\b/i,
    objects:
      'two property folders, an exchange timeline, a calendar, and an adviser-question sheet',
    action: 'mapping sale and replacement-property steps without showing tax advice or deadlines',
    risk: 'missing documentation or timing questions that require qualified advice',
    decision: 'which exchange questions to take to a qualified tax adviser',
    altScene: 'A mineral owner maps a 1031 exchange timeline with two property folders',
    metadataFocus: 'exchange records, timing questions, and adviser checkpoints',
  },
  {
    id: 'tax-reporting-planning',
    match: /\b(tax|taxes|tax return|capital gain|severance|depletion|irs|deduction)\b/i,
    objects:
      'a tax organizer, royalty statement, deed, calculator, and calendar with no legible figures',
    action: 'sorting transaction and royalty records into questions for a qualified adviser',
    risk: 'confusing educational context with a personal tax conclusion',
    decision: 'which records and questions require professional tax review',
    altScene: 'A mineral owner organizes tax records, a deed, and a royalty statement',
    metadataFocus: 'tax records, assumptions, and adviser questions',
  },
  {
    id: 'probate-estate-inheritance',
    match:
      /\b(probate|estate|inherit|heir|executor|beneficiar|affidavit of heirship|trustee|put .* trust)\b/i,
    objects: 'a probate folder, mineral deed, family ownership diagram, and county-record index',
    action: 'tracing an inherited interest from estate records to the present owner',
    risk: 'an unresolved ownership link or missing estate document',
    decision: 'which ownership record must be located or reviewed next',
    altScene: 'A family representative traces a mineral deed through probate records',
    metadataFocus: 'estate records, ownership links, and next-document questions',
  },
  {
    id: 'title-lease-ownership',
    match:
      /\b(title|deed|lease|division order|ownership|conveyance|reservation|surface rights|working interest|overriding)\b/i,
    objects: 'a deed chain, lease pages, division order, ownership layers, and a county map',
    action: 'tracing the document that controls each ownership or lease question',
    risk: 'relying on an incomplete chain of title or misunderstood document term',
    decision: 'which title, lease, or ownership document needs verification',
    altScene: 'A land professional traces deeds, lease records, and ownership layers',
    metadataFocus: 'title documents, lease terms, and ownership evidence',
  },
  {
    id: 'royalty-payments-operations',
    match:
      /\b(royalt|payment statement|royalty check|check stub|deduction|decimal interest|suspense|operator)\b/i,
    objects:
      'a royalty statement, production history, decimal-interest worksheet, well diagram, and lease map',
    action: 'reconciling a payment line with production and ownership records',
    risk: 'overlooking a deduction, decimal-interest, suspense, or operator-record mismatch',
    decision: 'which payment or operator question should be verified first',
    altScene: 'A royalty owner compares a payment statement with production records',
    metadataFocus: 'royalty statements, production records, and payment questions',
  },
  {
    id: 'county-basin-local',
    match: /\b(county|basin|permian|eagle ford|delaware|midland|local|nearby|location|map)\b/i,
    objects:
      'a labeled-but-illegible county and basin map, well records, a deed, and field-context photographs',
    action: 'connecting the stated county or basin to public well and ownership records',
    risk: 'implying an invented parcel, well result, or location-specific value',
    decision: 'which county, basin, and public-record facts need confirmation',
    altScene: 'A mineral owner compares a county map with well and deed records',
    metadataFocus: 'county, basin, well, and ownership records',
  },
  {
    id: 'offer-comparison-safety',
    match:
      /\b(offer|buyer|lowball|predator|scam|red flag|bid|negotia|compare|comparison|fair deal|hidden fee|clawback)\b/i,
    objects:
      'two neutral offer folders, a term-comparison worksheet, calculator, magnifier, and property map',
    action: 'comparing price assumptions, terms, contingencies, and buyer questions side by side',
    risk: 'letting a headline amount hide a contingency, fee, or unfavorable term',
    decision: 'which offer term or buyer claim needs independent review',
    altScene: 'A mineral owner compares two offer folders and their terms',
    metadataFocus: 'offer terms, contingencies, and buyer questions',
  },
  {
    id: 'valuation-dcf-drivers',
    match:
      /\b(value|valued|valuing|valuation|worth|appraisal|assessment|dcf|discount rate|decline curve|pricing|market value|future production)\b/i,
    objects:
      'production curves, royalty statements, county records, a mapped tract, and an assumption worksheet',
    action:
      'reconciling production, ownership, timing, and uncertainty inputs without showing a promised value',
    risk: 'treating one estimate or production assumption as a guaranteed result',
    decision: 'which valuation input or assumption needs stronger evidence',
    altScene: 'An underwriter compares production, ownership, and valuation inputs',
    metadataFocus: 'valuation inputs, assumptions, and uncertainty',
  },
  {
    id: 'well-production-operations',
    match: /\b(well|drill|production|operator|permit|pooling|spacing|shut-in|unit|completion)\b/i,
    objects: 'a well diagram, production history, operator record, tract map, and permit index',
    action:
      'connecting operating records to the mineral owner question without forecasting a result',
    risk: 'mistaking past activity or a permit for guaranteed future production',
    decision: 'which well, operator, or production record should be checked next',
    altScene: 'A mineral owner reviews well, operator, and production records',
    metadataFocus: 'well records, production history, and operator questions',
  },
  {
    id: 'sale-process-closing',
    match:
      /\b(sell|sale|closing|close|timeline|process|after you sell|before you sell|cash for mineral)\b/i,
    objects:
      'a transaction timeline, mineral deed, due-diligence checklist, property map, and closing folder',
    action: 'sequencing preparation, review, diligence, and closing checkpoints',
    risk: 'skipping a document, assumption, or contingency before signing',
    decision: 'which sale-process checkpoint the owner should prepare for next',
    altScene: 'A mineral owner reviews a deed, sale timeline, and closing checklist',
    metadataFocus: 'sale records, timeline checkpoints, and decision questions',
  },
  {
    id: 'document-preparation',
    match: /\b(document|record|paperwork|checklist|bring|prepare|information required)\b/i,
    objects:
      'an organized deed, lease, division order, royalty statement, checklist, and county map',
    action: 'sorting available records from missing or unverified documents',
    risk: 'assuming a missing or stale document is complete evidence',
    decision: 'which document should be gathered or verified next',
    altScene: 'A mineral owner organizes deeds, statements, and review documents',
    metadataFocus: 'documents, missing records, and preparation steps',
  },
  {
    id: 'methodology-transparency-ai',
    match:
      /\b(methodology|transparent|transparency|underwriter review|artificial intelligence|ai-powered|platform|how we|mrx|mineralrightsxchange)\b/i,
    objects:
      'a methodology checklist, source records, an assumptions panel, production data, and a mapped tract',
    action: 'showing how each conclusion traces back to a source and stated assumption',
    risk: 'presenting automation or a process claim as certainty or independent proof',
    decision: 'which source, assumption, or human-review step supports the answer',
    altScene: 'An MRX underwriter traces assumptions to source records',
    metadataFocus: 'source records, assumptions, and review steps',
  },
];

const INTENT_SEMANTICS = {
  informational: 'make the evidence understandable before suggesting an action',
  education: 'teach the record-to-question relationship without directing an outcome',
  'commercial-investigation': 'support comparison and due diligence without endorsing a provider',
  transactional: 'show the decision checkpoint without urgency or a promised result',
  'compare-offers': 'make terms and assumptions visibly comparable',
  'risk-check': 'surface verification gaps without fear-based imagery',
  valuation: 'separate documented inputs from uncertain assumptions',
  'tax-planning': 'organize adviser questions without giving tax advice',
  'royalty-income': 'connect a payment question to records and production context',
  'inherited-rights': 'clarify the ownership-document path respectfully',
  'local-buyer': 'ground the comparison in local records without endorsing a buyer',
  'local-informational': 'ground the explanation in the stated location and public records',
  'basin-market': 'show basin context without predicting activity or value',
  'sell-now': 'show a calm decision sequence without urgency',
};

const SUBJECT_STOP_WORDS = new Set(
  'a an and are as at be before by can do does for from how in into is it of on or our that the their these this through to vs what when where which who why will with your you'.split(
    ' ',
  ),
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function unquoteYaml(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const body = trimmed.slice(1, -1);
    return trimmed.startsWith("'") ? body.replaceAll("''", "'") : body.replaceAll('\\"', '"');
  }
  return trimmed;
}

function frontmatterScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? unquoteYaml(match[1]) : null;
}

function frontmatterNestedScalar(frontmatter, parent, key) {
  const block = frontmatter.match(new RegExp(`^${parent}:\\s*\\n((?:[ \\t]+.*(?:\\n|$))*)`, 'm'));
  if (!block) return null;
  const match = block[1].match(new RegExp(`^\\s{2}${key}:\\s*(.+)$`, 'm'));
  return match ? unquoteYaml(match[1]) : null;
}

function parseFrontmatter(source, sourcePath) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) throw new Error(`Missing YAML frontmatter in ${sourcePath}`);
  return match[1];
}

function resolveRepoPath(repoPath) {
  if (!repoPath) return null;
  return repoPath.startsWith('mrx/')
    ? path.join(MRX_ROOT, repoPath.slice('mrx/'.length))
    : path.join(WORKSPACE_ROOT, repoPath);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function publicPathOnDisk(assetPath) {
  if (!assetPath?.startsWith('/')) return null;
  return path.join(MRX_ROOT, 'public', assetPath.slice(1));
}

function shortenAtWord(value, maxLength) {
  const cleaned = value.trim().replace(/[.!?]+$/u, '');
  if (cleaned.length <= maxLength) return cleaned;
  const candidate = cleaned.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(' ');
  const shortened = (
    lastSpace >= Math.floor(maxLength * 0.65) ? candidate.slice(0, lastSpace) : candidate
  )
    .trim()
    .replace(/[,:;.!?\-–—]+$/u, '');
  return shortened;
}

function normalizeSubject(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function meaningfulTokens(value) {
  return normalizeSubject(value)
    .split(' ')
    .filter((token) => token.length > 1 && !SUBJECT_STOP_WORDS.has(token));
}

function subjectKey(row) {
  return normalizeSubject(row.canonical_title);
}

function locationCue(row) {
  const text = `${row.canonical_title} ${row.primary_keyword}`;
  const rules = [
    [/\bpermian\b/i, 'a restrained Permian Basin map context'],
    [/\beagle ford\b/i, 'a restrained Eagle Ford map context'],
    [/\bdelaware basin\b/i, 'a restrained Delaware Basin map context'],
    [/\bmidland basin\b/i, 'a restrained Midland Basin map context'],
    [/\bcounty\b/i, 'the stated Texas county-record context without inventing a parcel'],
    [/\btexas\b/i, 'an understated Texas owner context'],
    [/\bfederal\b/i, 'a neutral records workspace appropriate to a federal reporting question'],
  ];
  return (
    rules.find(([pattern]) => pattern.test(text))?.[1] ?? 'a calm private mineral-owner workspace'
  );
}

function deriveTopicSemantics(row) {
  const sourceText = `${row.canonical_title} ${row.primary_keyword}`;
  const rule = TOPIC_RULES.find((candidate) => candidate.match.test(sourceText));
  const cluster = CLUSTER_CREATIVE[row.cluster];
  if (!cluster) throw new Error(`No cluster creative direction for ${row.program_row_id}`);
  const tokens = [...new Set(meaningfulTokens(sourceText))];
  if (tokens.length < 3)
    throw new Error(`${row.program_row_id}: insufficient topic-specific terms`);

  const fallback = {
    id: `subject-derived-${row.cluster}`,
    objects: `${cluster.focal} plus a distinct evidence card for ${tokens.slice(0, 5).join(', ')}`,
    action: `connecting the physical evidence to the specific question about ${tokens.slice(0, 6).join(' ')}`,
    risk: 'substituting a generic illustration for the article-specific evidence question',
    decision: 'which documented fact should anchor the reader’s next question',
    altScene: cluster.altLead,
    metadataFocus: `${tokens.slice(0, 3).join(', ')} evidence and next-step questions`,
  };
  const selected = rule ?? fallback;
  const semantics = {
    rule_id: selected.id,
    rule_source: rule ? 'explicit_topic_rule' : 'subject_terms_with_cluster_support',
    subject_key: subjectKey(row),
    subject_terms: tokens.slice(0, 12),
    object_cue: selected.objects,
    action_cue: selected.action,
    location_cue: locationCue(row),
    risk_cue: selected.risk,
    decision_cue: selected.decision,
    intent_cue:
      INTENT_SEMANTICS[row.search_intent] ??
      `answer the ${row.search_intent} question through documented evidence`,
    alt_scene: selected.altScene,
    metadata_focus: selected.metadataFocus,
  };
  const semanticSignature = sha256(JSON.stringify(semantics));
  return { ...semantics, semantic_signature_sha256: semanticSignature };
}

function lastMeaningfulWords(value, count = 2) {
  return meaningfulTokens(value)
    .slice(-count)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function distinctiveTitleWords(value) {
  const colonTail = value.includes(':') ? value.split(':').slice(1).join(':') : '';
  const words = meaningfulTokens(colonTail || value);
  const selected = colonTail
    ? [...new Set([...words.slice(0, 2), ...words.slice(-2)])]
    : words.slice(-3);
  return selected.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}

const TRAILING_SHARE_TITLE_WORDS = new Set([
  'a',
  'about',
  'an',
  'and',
  'during',
  'for',
  'from',
  'how',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'when',
  'with',
  'your',
]);

const TRAILING_INCOMPLETE_TITLE_WORDS = new Set([
  'competing',
  'current',
  'different',
  'effective',
  'independent',
  'mineral',
  'mineral-rights',
  'multiple',
  'personal',
  'traditional',
  'working',
  'written',
]);

function removeWeakTitleEnding(value) {
  const words = value.trim().split(/\s+/);
  while (words.length > 3 && TRAILING_SHARE_TITLE_WORDS.has(words.at(-1).toLowerCase())) {
    words.pop();
  }
  return words.join(' ').replace(/[,:;.!?\-–—]+$/u, '');
}

function condenseShareTitle(value) {
  let title = value
    .replace(/[.!?]+$/u, '')
    .replace(/\bMineralRightsXchange\b/g, 'MRX')
    .replace(/^Understanding\s+/i, '')
    .replace(/^Discover(?:ing)?\s+/i, '')
    .replace(/^The Essential\s+/i, '')
    .replace(/^Essential\s+/i, '')
    .replace(/^A Comprehensive Guide to\s+/i, '')
    .replace(/\bWhat You Need to Know About\s+/gi, '')
    .replace(/\bPrivacy and Confidentiality\b/gi, 'Privacy')
    .replace(/\bPersonal Information\b/gi, 'Personal Info')
    .replace(/\bYour Personal Info\b/gi, 'Personal Info')
    .replace(/\bConfidential in Mineral Rights Transactions\b/gi, 'Private in Rights Deals')
    .replace(/\bMineral Rights Review Process\b/gi, 'Mineral-Rights Review')
    .replace(/\bMineral Rights Assessment Process\b/gi, 'Mineral-Rights Assessment')
    .replace(/\bValuation Methodology\b/gi, 'Valuation Method')
    .replace(/\bStep-by-Step Process of\b/gi, 'Steps for')
    .replace(/\bEffective Strategies\b/gi, 'Ways')
    .replace(/\s+/g, ' ')
    .trim();
  title = removeWeakTitleEnding(shortenAtWord(title, 60));
  return title;
}

function buildUniqueShareTitles(articles) {
  const titles = new Map(
    articles.map((row) => {
      let title = condenseShareTitle(row.canonical_title);
      if (TRAILING_INCOMPLETE_TITLE_WORDS.has(title.split(/\s+/).at(-1).toLowerCase())) {
        const suffix = lastMeaningfulWords(row.canonical_title);
        const stem = removeWeakTitleEnding(shortenAtWord(title, 60 - suffix.length - 3));
        title = `${stem} · ${suffix}`;
      }
      return [row.program_row_id, title];
    }),
  );
  const groups = new Map();
  for (const [rowId, title] of titles) {
    groups.set(title, [...(groups.get(title) ?? []), rowId]);
  }
  for (const [title, rowIds] of groups) {
    if (rowIds.length === 1) continue;
    for (const rowId of rowIds) {
      const row = articles.find((article) => article.program_row_id === rowId);
      const suffix = distinctiveTitleWords(row.canonical_title);
      const stem = removeWeakTitleEnding(shortenAtWord(title, 60 - suffix.length - 3));
      titles.set(rowId, `${stem} · ${suffix}`);
    }
  }
  const values = [...titles.values()];
  const invalid = values.filter((title) => {
    const ending = title.trim().split(/\s+/).at(-1).toLowerCase();
    return (
      title.length > 60 ||
      TRAILING_SHARE_TITLE_WORDS.has(ending) ||
      TRAILING_INCOMPLETE_TITLE_WORDS.has(ending)
    );
  });
  const duplicates = duplicateValues(values).map((duplicate) => ({
    ...duplicate,
    row_ids: [...titles.entries()]
      .filter(([, title]) => title === duplicate.value)
      .map(([rowId]) => rowId),
  }));
  if (invalid.length > 0 || duplicates.length > 0) {
    throw new Error(
      `Unable to produce valid unique share SEO titles: ${JSON.stringify({ invalid, duplicates })}`,
    );
  }
  return titles;
}

function generatedShareDescription(shareTitle, semantics) {
  const lead = `${shareTitle} explained for mineral owners.`;
  const candidates = [
    `${lead} Review ${semantics.metadata_focus}, key risks, and practical next steps with MRX.`,
    `${lead} Review relevant records, key risks, and practical next steps with MRX.`,
    `${lead} Review source records, risks, and next steps with MRX.`,
  ];
  let description = candidates.find((candidate) => candidate.length <= 160) ?? candidates.at(-1);
  if (description.length < 130) {
    description = `${description} Begin with documented facts.`;
  }
  if (
    description.length < 130 ||
    description.length > 160 ||
    description.includes('…') ||
    !/[.!?]$/u.test(description)
  ) {
    throw new Error(`Invalid generated share description (${description.length}): ${description}`);
  }
  return description;
}

function generatedAltText(shareTitle, semantics) {
  const suffix = ` for ${shareTitle}.`;
  const maxLead = 125 - suffix.length;
  const lead = shortenAtWord(semantics.alt_scene, maxLead);
  const alt = `${lead}${suffix}`;
  if (alt.length > 125 || alt.includes('…')) {
    throw new Error(`Invalid generated alt text (${alt.length}): ${alt}`);
  }
  return alt;
}

function plannedAssetPath(row) {
  return `/assets/articles/hero/${renderedImageTextSlug(row.canonical_title)}.webp`;
}

function renderedImageTextSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function plannedInlineAssetPath(row) {
  return `/assets/articles/inline/${row.canonical_slug}/${renderedImageTextSlug(row.primary_keyword)}.webp`;
}

function filenameMatchesRenderedText(assetPath, renderedText) {
  if (!assetPath || !renderedText) return false;
  return path.basename(assetPath, path.extname(assetPath)) === renderedImageTextSlug(renderedText);
}

function articleMatchEvidence(row, currentAssetPath, currentAltText) {
  const assetBasename = path.basename(currentAssetPath ?? '', path.extname(currentAssetPath ?? ''));
  const articleTokens = new Set(
    meaningfulTokens(`${row.canonical_title} ${row.primary_keyword}`).filter(
      (token) => !['mineral', 'minerals', 'rights', 'texas'].includes(token),
    ),
  );
  const assetTokens = new Set(meaningfulTokens(`${assetBasename} ${currentAltText ?? ''}`));
  const matched = [...articleTokens].filter((token) => assetTokens.has(token));
  const canonicalSlugMatch = assetBasename === row.canonical_slug;
  const altTitleMatch = normalizeSubject(currentAltText ?? '').includes(
    normalizeSubject(row.canonical_title),
  );
  return {
    pass: canonicalSlugMatch || altTitleMatch || matched.length >= 2,
    canonical_slug_match: canonicalSlugMatch,
    alt_title_match: altTitleMatch,
    matched_tokens: matched.sort().slice(0, 12),
  };
}

async function loadCurrentAssetEvidence(row, inputParts) {
  const repoFile = resolveRepoPath(row.repo_path);
  if (!repoFile) return null;
  if (!(await exists(repoFile))) {
    throw new Error(`Required source MDX is missing for ${row.program_row_id}: ${row.repo_path}`);
  }
  const source = await readFile(repoFile, 'utf8');
  inputParts.push(`${row.program_row_id}\n${source}`);
  const frontmatter = parseFrontmatter(source, repoFile);
  const assetPath = frontmatterNestedScalar(frontmatter, 'hero_image', 'src');
  const socialAssetPath =
    frontmatterNestedScalar(frontmatter, 'hero_image', 'social_src') ?? assetPath;
  const altText = frontmatterNestedScalar(frontmatter, 'hero_image', 'alt');
  const socialAltText = frontmatterNestedScalar(frontmatter, 'hero_image', 'social_alt') ?? altText;
  const inlineAssetPath = frontmatterNestedScalar(frontmatter, 'inline_image', 'src');
  const inlineAltText = frontmatterNestedScalar(frontmatter, 'inline_image', 'alt');
  const inlineRenderedText = frontmatterNestedScalar(frontmatter, 'inline_image', 'rendered_text');
  const description = frontmatterScalar(frontmatter, 'description');
  const seoTitle = frontmatterScalar(frontmatter, 'seo_title');
  const onDiskPath = publicPathOnDisk(assetPath);
  const onDisk = onDiskPath ? await exists(onDiskPath) : false;
  let assetSha256 = null;
  let format = null;
  let width = null;
  let height = null;
  const socialOnDiskPath = publicPathOnDisk(socialAssetPath);
  const socialOnDisk = socialOnDiskPath ? await exists(socialOnDiskPath) : false;
  let socialAssetSha256 = null;
  let socialFormat = null;
  let socialWidth = null;
  let socialHeight = null;
  const inlineOnDiskPath = publicPathOnDisk(inlineAssetPath);
  const inlineOnDisk = inlineOnDiskPath ? await exists(inlineOnDiskPath) : false;
  let inlineAssetSha256 = null;
  let inlineFormat = null;
  let inlineWidth = null;
  let inlineHeight = null;
  if (onDisk && onDiskPath) {
    const assetBytes = await readFile(onDiskPath);
    assetSha256 = sha256(assetBytes);
    const metadata = await sharp(assetBytes).metadata();
    format = metadata.format ?? null;
    width = metadata.width ?? null;
    height = metadata.height ?? null;
    inputParts.push(`${row.program_row_id}:current-asset-sha256:${assetSha256}`);
  }
  if (socialOnDisk && socialOnDiskPath) {
    const socialAssetBytes = await readFile(socialOnDiskPath);
    socialAssetSha256 = sha256(socialAssetBytes);
    const socialMetadata = await sharp(socialAssetBytes).metadata();
    socialFormat = socialMetadata.format ?? null;
    socialWidth = socialMetadata.width ?? null;
    socialHeight = socialMetadata.height ?? null;
    inputParts.push(`${row.program_row_id}:current-social-asset-sha256:${socialAssetSha256}`);
  }
  if (inlineOnDisk && inlineOnDiskPath) {
    const inlineAssetBytes = await readFile(inlineOnDiskPath);
    inlineAssetSha256 = sha256(inlineAssetBytes);
    const inlineMetadata = await sharp(inlineAssetBytes).metadata();
    inlineFormat = inlineMetadata.format ?? null;
    inlineWidth = inlineMetadata.width ?? null;
    inlineHeight = inlineMetadata.height ?? null;
    inputParts.push(`${row.program_row_id}:current-inline-asset-sha256:${inlineAssetSha256}`);
  }
  return {
    repo_file: repoFile,
    asset_path: assetPath,
    social_asset_path: socialAssetPath,
    social_alt_text: socialAltText,
    alt_text: altText,
    description,
    seo_title: seoTitle,
    on_disk: onDisk,
    sha256: assetSha256,
    format,
    width,
    height,
    social_on_disk: socialOnDisk,
    social_sha256: socialAssetSha256,
    social_format: socialFormat,
    social_width: socialWidth,
    social_height: socialHeight,
    inline_asset_path: inlineAssetPath,
    inline_alt_text: inlineAltText,
    inline_rendered_text: inlineRenderedText,
    inline_on_disk: inlineOnDisk,
    inline_sha256: inlineAssetSha256,
    inline_format: inlineFormat,
    inline_width: inlineWidth,
    inline_height: inlineHeight,
    article_match: articleMatchEvidence(row, assetPath, altText),
  };
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(rows) {
  const columns = [
    'program_row_id',
    'canonical_title',
    'canonical_slug',
    'cluster',
    'preservation_classification',
    'final_hero_asset_path',
    'final_social_asset_path',
    'final_inline_asset_path',
    'social_asset_reuse_rule',
    'hero_rendered_text',
    'inline_rendered_text',
    'hero_filename_text_identity',
    'inline_filename_text_identity',
    'alt_text',
    'social_alt_text',
    'inline_alt_text',
    'visible_canonical_title',
    'share_seo_title',
    'topic_rule_id',
    'topic_rule_source',
    'semantic_signature_sha256',
    'semantic_subject_terms',
    'object_cue',
    'action_cue',
    'location_cue',
    'risk_cue',
    'decision_cue',
    'intent_cue',
    'visual_concept',
    'generation_prompt',
    'inline_visual_concept',
    'inline_generation_prompt',
    'focal_point',
    'crop_guidance',
    'share_title',
    'share_description',
    'prohibited_motifs_and_claims',
    'brief_status',
    'brief_ready',
    'asset_generated',
    'on_disk',
    'published',
    'release_blocked',
    'release_status',
    'planned_replacement_required',
    'current_asset_path',
    'current_social_asset_path',
    'current_social_asset_on_disk',
    'current_social_asset_format',
    'current_social_asset_width',
    'current_social_asset_height',
    'current_social_asset_path_unique',
    'current_social_asset_content_unique',
    'current_social_asset_sha256',
    'current_inline_asset_path',
    'current_inline_asset_on_disk',
    'current_inline_asset_format',
    'current_inline_asset_width',
    'current_inline_asset_height',
    'current_inline_asset_sha256',
    'current_asset_on_disk',
    'current_asset_format',
    'current_asset_width',
    'current_asset_height',
    'current_asset_path_unique',
    'current_asset_content_unique',
    'current_asset_article_match',
    'current_asset_match_tokens',
    'current_asset_usable',
    'current_asset_preserved',
    'current_asset_is_shared_pilot_placeholder',
    'current_asset_sha256',
    'visual_seed_sha256',
  ];
  return `${columns.map(csvCell).join(',')}\n${rows
    .map((row) =>
      columns
        .map((column) =>
          csvCell(Array.isArray(row[column]) ? row[column].join(' | ') : row[column]),
        )
        .join(','),
    )
    .join('\n')}\n`;
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function markdownTable(headers, rows, rightAlignedColumns = []) {
  const rightAligned = new Set(rightAlignedColumns);
  const widths = headers.map((header, column) =>
    Math.max(3, header.length, ...rows.map((row) => String(row[column]).length)),
  );
  const renderRow = (row) =>
    `| ${row
      .map((cell, column) =>
        rightAligned.has(column)
          ? String(cell).padStart(widths[column])
          : String(cell).padEnd(widths[column]),
      )
      .join(' | ')} |`;
  const separator = widths.map((width, column) =>
    rightAligned.has(column) ? `${'-'.repeat(Math.max(2, width - 1))}:` : '-'.repeat(width),
  );
  return [renderRow(headers), renderRow(separator), ...rows.map(renderRow)].join('\n');
}

async function buildRow(
  row,
  currentEvidence,
  twoImageEvidence,
  currentPathCounts,
  currentHashCounts,
  currentSocialPathCounts,
  currentSocialHashCounts,
  shareSeoTitle,
) {
  const creative = CLUSTER_CREATIVE[row.cluster];
  if (!creative) throw new Error(`No creative direction for cluster ${row.cluster}`);

  const publicRow = row.preservation_classification === PUBLIC_CLASS;
  const heldRow = row.preservation_classification === HELD_CLASS;
  const pilotRow = row.preservation_classification === PILOT_CLASS;
  const currentAssetPath = currentEvidence?.asset_path ?? null;
  const currentSocialAssetPath = currentEvidence?.social_asset_path ?? null;
  const currentAltText = currentEvidence?.alt_text ?? null;
  const currentSocialAltText = currentEvidence?.social_alt_text ?? currentAltText;
  const currentInlineAssetPath = currentEvidence?.inline_asset_path ?? null;
  const currentInlineAltText = currentEvidence?.inline_alt_text ?? null;
  const currentInlineRenderedText = currentEvidence?.inline_rendered_text ?? null;
  const currentDescription = currentEvidence?.description ?? null;

  if (
    publicRow &&
    (!currentAssetPath ||
      !currentAltText ||
      !currentDescription ||
      !currentInlineAssetPath ||
      !currentInlineAltText ||
      !currentInlineRenderedText ||
      !currentEvidence ||
      !twoImageEvidence)
  ) {
    throw new Error(`Published source lacks verified two-image metadata: ${row.program_row_id}`);
  }

  const currentPathUnique = currentAssetPath
    ? currentPathCounts.get(currentAssetPath) === 1
    : false;
  const currentContentUnique = currentEvidence?.sha256
    ? currentHashCounts.get(currentEvidence.sha256) === 1
    : false;
  const currentSocialPathUnique = currentSocialAssetPath
    ? currentSocialPathCounts.get(currentSocialAssetPath) === 1
    : false;
  const currentSocialContentUnique = currentEvidence?.social_sha256
    ? currentSocialHashCounts.get(currentEvidence.social_sha256) === 1
    : false;
  const twoImageEvidenceUsable = Boolean(
    twoImageEvidence &&
    twoImageEvidence.slug === row.canonical_slug &&
    twoImageEvidence.title === row.canonical_title &&
    [row.primary_keyword, row.canonical_title].includes(twoImageEvidence.keyword) &&
    twoImageEvidence.hero?.public_path === currentAssetPath &&
    twoImageEvidence.hero?.sha256 === currentEvidence?.sha256 &&
    twoImageEvidence.hero?.ocr?.pass === true &&
    filenameMatchesRenderedText(currentAssetPath, row.canonical_title) &&
    twoImageEvidence.inline?.public_path === currentInlineAssetPath &&
    twoImageEvidence.inline?.sha256 === currentEvidence?.inline_sha256 &&
    twoImageEvidence.inline?.rendered_text === currentInlineRenderedText &&
    twoImageEvidence.inline?.ocr?.pass === true &&
    currentEvidence?.inline_on_disk === true &&
    currentEvidence?.inline_format === 'webp' &&
    currentEvidence?.inline_width === 1200 &&
    currentEvidence?.inline_height === 675 &&
    twoImageEvidence.keyword === currentInlineRenderedText &&
    filenameMatchesRenderedText(currentInlineAssetPath, currentInlineRenderedText) &&
    currentAssetPath !== currentInlineAssetPath &&
    currentEvidence?.sha256 !== currentEvidence?.inline_sha256,
  );
  const socialReusesHero = currentAssetPath === currentSocialAssetPath;
  const dedicatedSocialAssetUsable = Boolean(
    !socialReusesHero &&
    currentEvidence?.social_on_disk &&
    currentEvidence.social_format === 'jpeg' &&
    currentEvidence.social_width === 1200 &&
    currentEvidence.social_height === 630 &&
    currentSocialPathUnique &&
    currentSocialContentUnique &&
    currentSocialAltText &&
    currentSocialAltText.length <= 125 &&
    currentSocialAltText.length >= 30,
  );
  const legacyHeroUsable = Boolean(
    currentEvidence?.on_disk &&
    currentEvidence.format === 'webp' &&
    currentEvidence.width === 1600 &&
    currentEvidence.height === 900 &&
    (socialReusesHero || dedicatedSocialAssetUsable),
  );
  const ownerPolicyHeroUsable = Boolean(
    currentEvidence?.on_disk &&
    currentEvidence.format === 'webp' &&
    currentEvidence.width === 1200 &&
    currentEvidence.height === 630 &&
    socialReusesHero &&
    currentEvidence.social_on_disk &&
    currentEvidence.social_format === 'webp' &&
    currentEvidence.social_width === 1200 &&
    currentEvidence.social_height === 630 &&
    currentEvidence.social_sha256 === currentEvidence.sha256,
  );
  const currentAssetUsable = Boolean(
    (legacyHeroUsable || ownerPolicyHeroUsable) &&
    currentPathUnique &&
    currentContentUnique &&
    currentEvidence.article_match.pass &&
    currentAltText &&
    currentAltText.length <= 125 &&
    currentAltText.length >= 30 &&
    !currentAssetPath.includes('/brand/mrx-underwriter-review-og') &&
    twoImageEvidenceUsable,
  );
  if (publicRow && !currentAssetUsable) {
    throw new Error(`Published hero failed current-asset usability checks: ${row.program_row_id}`);
  }

  const preserveCurrentAsset = publicRow && currentAssetUsable;
  const finalHeroAssetPath = preserveCurrentAsset ? currentAssetPath : plannedAssetPath(row);
  const finalSocialAssetPath = finalHeroAssetPath;
  const finalInlineAssetPath = preserveCurrentAsset
    ? currentInlineAssetPath
    : plannedInlineAssetPath(row);
  const inlineRenderedText = preserveCurrentAsset ? currentInlineRenderedText : row.primary_keyword;
  const inlineAltText = preserveCurrentAsset
    ? currentInlineAltText
    : `Mineral-rights illustration highlighting “${row.primary_keyword}”.`;
  const finalOnDiskPath = publicPathOnDisk(finalHeroAssetPath);
  const onDisk = finalOnDiskPath ? await exists(finalOnDiskPath) : false;
  if (preserveCurrentAsset && !onDisk) {
    throw new Error(`Published hero is not on disk: ${row.program_row_id} ${finalHeroAssetPath}`);
  }

  const semantics = deriveTopicSemantics(row);
  const visualSeed = sha256(
    `mrx1000-hero-v2|${semantics.semantic_signature_sha256}|${row.canonical_slug}`,
  );
  const camera =
    CAMERA_VARIANTS[Number.parseInt(visualSeed.slice(0, 2), 16) % CAMERA_VARIANTS.length];
  const composition =
    COMPOSITION_VARIANTS[Number.parseInt(visualSeed.slice(2, 4), 16) % COMPOSITION_VARIANTS.length];
  const lighting =
    LIGHTING_VARIANTS[Number.parseInt(visualSeed.slice(4, 6), 16) % LIGHTING_VARIANTS.length];
  const altText = preserveCurrentAsset
    ? currentAltText
    : generatedAltText(shareSeoTitle, semantics);
  const shareTitle = publicRow ? currentEvidence?.seo_title || row.canonical_title : shareSeoTitle;
  const shareDescription = publicRow
    ? currentDescription
    : generatedShareDescription(shareTitle, semantics);
  const prohibitions = [...GLOBAL_PROHIBITIONS, ...(creative.additionalProhibitions ?? [])];
  const releaseBlocked = !publicRow;
  const semanticAppropriatenessChecks = {
    has_subject_specific_terms: semantics.subject_terms.length >= 3,
    has_topic_object_cue: semantics.object_cue.length >= 30,
    has_topic_action_cue: semantics.action_cue.length >= 30,
    has_location_cue: semantics.location_cue.length >= 20,
    has_risk_cue: semantics.risk_cue.length >= 30,
    has_decision_cue: semantics.decision_cue.length >= 30,
    explicit_or_subject_derived_rule: [
      'explicit_topic_rule',
      'subject_terms_with_cluster_support',
    ].includes(semantics.rule_source),
  };
  const briefReady = Object.values(semanticAppropriatenessChecks).every(Boolean);

  return {
    program_row_id: row.program_row_id,
    canonical_title: row.canonical_title,
    canonical_slug: row.canonical_slug,
    canonical_url: row.canonical_url,
    primary_keyword: row.primary_keyword,
    cluster: row.cluster,
    pillar: row.pillar,
    pillar_url: row.pillar_url,
    preservation_classification: row.preservation_classification,
    source_system: row.source_system,
    repo_path: row.repo_path,
    is_pilot_001: row.is_pilot_001,
    pilot_article_id: row.pilot_article_id,
    final_hero_asset_path: finalHeroAssetPath,
    final_social_asset_path: finalSocialAssetPath,
    final_inline_asset_path: finalInlineAssetPath,
    social_asset_reuse_rule: REUSE_RULE,
    hero_rendered_text: row.canonical_title,
    inline_rendered_text: inlineRenderedText,
    hero_filename_text_identity: filenameMatchesRenderedText(
      finalHeroAssetPath,
      row.canonical_title,
    ),
    inline_filename_text_identity: filenameMatchesRenderedText(
      finalInlineAssetPath,
      inlineRenderedText,
    ),
    target_format: 'webp',
    target_width: 1200,
    target_height: 630,
    target_aspect_ratio: '1.91:1',
    inline_target_format: 'webp',
    inline_target_width: 1200,
    inline_target_height: 675,
    inline_target_aspect_ratio: '16:9',
    social_crop_safe_ratio: '1.91:1 centered safe crop',
    alt_text: altText,
    social_alt_text: altText,
    inline_alt_text: inlineAltText,
    visible_canonical_title: row.canonical_title,
    share_seo_title: shareTitle,
    topic_rule_id: semantics.rule_id,
    topic_rule_source: semantics.rule_source,
    semantic_signature_sha256: semantics.semantic_signature_sha256,
    semantic_subject_terms: semantics.subject_terms,
    object_cue: semantics.object_cue,
    action_cue: semantics.action_cue,
    location_cue: semantics.location_cue,
    risk_cue: semantics.risk_cue,
    decision_cue: semantics.decision_cue,
    intent_cue: semantics.intent_cue,
    topic_semantics: semantics,
    semantic_appropriateness_checks: semanticAppropriatenessChecks,
    visual_concept:
      `Article-specific evidence scene for “${row.canonical_title}”. ` +
      `Show ${semantics.object_cue}; ${semantics.action_cue}. ` +
      `Ground the scene in ${semantics.location_cue}. Signal ${semantics.risk_cue}, then make visible ${semantics.decision_cue}. ` +
      `Use the cluster context only as support: ${creative.scene}.`,
    generation_prompt:
      `Create a premium, photorealistic editorial documentary image for the MineralRightsXchange article titled “${row.canonical_title}”: ` +
      `the topic is “${semantics.subject_key}” and the primary question is “${row.primary_keyword}.” ` +
      `Depict ${semantics.object_cue}; ${semantics.action_cue}. Place it in ${semantics.location_cue}. ` +
      `Visually distinguish the risk—${semantics.risk_cue}—from the decision—${semantics.decision_cue}. ` +
      `For this ${row.search_intent} intent, ${semantics.intent_cue}. Use the broader cluster scene only as background support: ${creative.scene}. ` +
      `Use ${camera}; ${composition}; ${lighting}; ${creative.palette}. ` +
      `Preserve realistic hands, paper, maps, equipment, and scale. Keep the frame credible, calm, educational, and human. ` +
      `Render exactly “${row.canonical_title}” as clear, high-contrast title text in the image pixels; render no other readable words, letters, or numbers. ` +
      `Output 1200×630 WebP for identical use as the visible hero, CMS featured/share image, og:image, twitter:image, and Article schema image. Visual seed: ${visualSeed.slice(0, 16)}.`,
    inline_visual_concept: `A composition distinct from the hero for “${inlineRenderedText}”. Show ${semantics.object_cue}; ${semantics.action_cue}.`,
    inline_generation_prompt:
      `Create a distinct 1200×675 WebP in-body editorial image for the finalized title or keyword phrase “${inlineRenderedText}”. ` +
      `Use a different composition from the hero while preserving the article-specific evidence scene: ${semantics.object_cue}; ${semantics.action_cue}. ` +
      `Render exactly “${inlineRenderedText}” as clear, high-contrast text in the image pixels; render no other readable words, letters, or numbers. ` +
      `The output filename must be ${path.basename(finalInlineAssetPath)}.`,
    focal_point: semantics.object_cue,
    crop_guidance:
      `Keep the topic-specific evidence group (${semantics.object_cue}) inside the central 72% width and 70% height. ` +
      'Allow both a 16:9 hero presentation and a centered 1.91:1 social crop without cutting hands, faces, maps, deeds, or the key evidence object. Avoid critical detail within the outer 10% on every edge.',
    palette_guidance: creative.palette,
    share_title: shareTitle,
    share_title_plan:
      'Use share_seo_title (60 characters maximum) for og:title and twitter:title. Keep visible_canonical_title unchanged for the article H1.',
    share_description: shareDescription,
    share_description_plan:
      'Use this article-specific plain-language description for og:description and twitter:description; keep it factual, non-advisory, 130–160 characters, and complete without ellipsis.',
    share_image_plan:
      'Use final_hero_asset_path unchanged for the visible hero, CMS featured/share image, og:image, twitter:image, and Article schema image; final_social_asset_path must be identical.',
    prohibited_motifs_and_claims: prohibitions,
    brief_status: briefReady ? 'brief_ready' : 'brief_blocked_semantic_evidence_incomplete',
    brief_ready: briefReady,
    asset_generated: preserveCurrentAsset,
    inline_asset_generated: preserveCurrentAsset,
    asset_generation_status: publicRow
      ? 'preexisting_verified_public_asset'
      : heldRow && preserveCurrentAsset
        ? 'preexisting_verified_held_asset'
        : 'not_generated_local_plan_only',
    on_disk: onDisk,
    inline_on_disk: preserveCurrentAsset ? currentEvidence?.inline_on_disk === true : false,
    on_disk_status: onDisk ? 'final_asset_verified_on_disk' : 'final_asset_not_on_disk',
    published: publicRow,
    published_status: publicRow ? 'existing_public_route_unchanged' : 'not_published',
    release_blocked: releaseBlocked,
    release_status: publicRow
      ? 'released_under_d16_continuous_quality_gate'
      : pilotRow
        ? 'quality_blocked_unique_placeholder_replacement_required'
        : heldRow && preserveCurrentAsset
          ? 'eligible_for_continuous_quality_review_existing_asset_preserved'
          : 'quality_blocked_asset_generation_or_replacement_required',
    planned_replacement_required: !preserveCurrentAsset,
    current_asset_path: currentAssetPath,
    current_social_asset_path: currentSocialAssetPath,
    current_social_asset_on_disk: currentEvidence?.social_on_disk ?? false,
    current_social_asset_format: currentEvidence?.social_format ?? null,
    current_social_asset_width: currentEvidence?.social_width ?? null,
    current_social_asset_height: currentEvidence?.social_height ?? null,
    current_social_asset_path_unique: currentSocialPathUnique,
    current_social_asset_content_unique: currentSocialContentUnique,
    current_social_asset_sha256: currentEvidence?.social_sha256 ?? null,
    current_asset_on_disk: currentEvidence?.on_disk ?? false,
    current_asset_format: currentEvidence?.format ?? null,
    current_asset_width: currentEvidence?.width ?? null,
    current_asset_height: currentEvidence?.height ?? null,
    current_asset_path_unique: currentPathUnique,
    current_asset_content_unique: currentContentUnique,
    current_asset_article_match: currentEvidence?.article_match.pass ?? false,
    current_asset_match_tokens: currentEvidence?.article_match.matched_tokens ?? [],
    current_asset_usable: currentAssetUsable,
    current_asset_preserved: preserveCurrentAsset,
    current_inline_asset_path: currentInlineAssetPath,
    current_inline_asset_on_disk: currentEvidence?.inline_on_disk ?? false,
    current_inline_asset_format: currentEvidence?.inline_format ?? null,
    current_inline_asset_width: currentEvidence?.inline_width ?? null,
    current_inline_asset_height: currentEvidence?.inline_height ?? null,
    current_inline_asset_sha256: currentEvidence?.inline_sha256 ?? null,
    two_image_policy_evidence_verified: twoImageEvidenceUsable,
    current_asset_is_shared_pilot_placeholder:
      pilotRow && currentAssetPath === '/assets/brand/mrx-underwriter-review-og.png',
    current_asset_sha256: currentEvidence?.sha256 ?? null,
    visual_seed_sha256: visualSeed,
  };
}

function buildReport(plan) {
  const v = plan.verification;
  const publicRows = plan.rows.filter((row) => row.published);
  const coverageTable = markdownTable(
    ['Check', 'Result'],
    [
      ['Canonical ledger rows', v.row_count],
      ['Brief-ready rows', v.brief_ready_count],
      ['Unique final hero paths', v.unique_final_hero_asset_path_count],
      ['Final hero path collisions', v.final_hero_asset_path_collision_count],
      ['Unique final social paths', v.unique_final_social_asset_path_count],
      ['Final social path collisions', v.final_social_asset_path_collision_count],
      ['Unique final in-body paths', v.unique_final_inline_asset_path_count],
      ['Final in-body path collisions', v.final_inline_asset_path_collision_count],
      ['Expected same-row hero/social reuses', v.same_row_hero_social_reuse_count],
      ['Cross-row hero/social collisions', v.cross_row_hero_social_collision_count],
      ['Hero exact-title filename identities', v.hero_filename_text_identity_count],
      ['In-body exact-keyword filename identities', v.inline_filename_text_identity_count],
      ['Hero exact-title prompt requirements', v.hero_exact_title_prompt_count],
      ['In-body exact-keyword prompt requirements', v.inline_exact_keyword_prompt_count],
      ['Unique alt text values', v.unique_alt_text_count],
      ['Unique visual concepts', v.unique_visual_concept_count],
      ['Unique generation prompts', v.unique_generation_prompt_count],
      ['Unique semantic signatures', v.unique_semantic_signature_count],
      ['Semantic appropriateness failures', v.semantic_appropriateness_failure_count],
      ['Alt text values over 125 characters', v.alt_text_over_125_count],
      ['Share titles over 60 characters', v.share_title_over_60_count],
      ['Share descriptions outside 130–160', v.share_description_outside_130_160_count],
      ['Share descriptions with ellipsis', v.share_description_ellipsis_count],
      ['Existing public assets verified on disk', v.existing_public_asset_verified_count],
      [
        'Existing public in-body assets verified on disk',
        v.existing_public_inline_asset_verified_count,
      ],
      ['Held current assets observed', v.held_current_asset_observed_count],
      ['Held current assets preserved', v.held_current_asset_preserved_count],
      ['Held assets still requiring replacement', v.held_replacement_required_count],
      ['Final assets marked generated', v.asset_generated_count],
      ['Final assets verified on disk', v.on_disk_count],
      ['Existing public routes represented', v.published_count],
      ['Pilot shared placeholders observed', v.pilot_shared_placeholder_current_count],
      ['Pilot unique replacement paths assigned', v.pilot_unique_replacement_path_count],
      ['Pilot rows still quality-blocked', v.pilot_release_blocked_count],
    ],
    [1],
  );
  const publicAssetTable = markdownTable(
    ['Row', 'Article', 'Verified hero/share asset', 'Verified in-body asset'],
    publicRows.map((row) => [
      row.program_row_id,
      row.canonical_title.replaceAll('|', '\\|'),
      `\`${row.final_hero_asset_path}\``,
      `\`${row.final_inline_asset_path}\``,
    ]),
  );
  return `# MRX 1,000-row two-image creative-brief plan

Generated deterministically from the canonical 1,000-row ledger. This is a local-only creative plan. It generated no images, changed no article frontmatter, made no external call, and performed no publication, indexing, deployment, or spend action.

## Controlling release policy

- Signed decision: \`${plan.controlling_decision.decision_id}\`
- Two-image decision: \`${plan.two_image_policy.decision_id}\`
- Two-image decision SHA-256: \`${plan.two_image_policy.decision_sha256}\`
- Verified decision SHA-256: \`${plan.controlling_decision.sha256}\`
- Numerical release cap applies: **${plan.controlling_decision.numerical_release_cap_applies}**
- Elapsed-time release gate applies: **${plan.controlling_decision.elapsed_time_gate_applies}**
- Disposition: \`${plan.controlling_decision.disposition}\`
- Result: article count and elapsed time do not block release. The ${v.release_blocked_count} nonpublic rows still require their own substantive quality evidence; a ready creative brief alone does not clear those gates.

## Coverage and collision results

${coverageTable}

## Two-image asset and share architecture

Every article owns one 1200×630 WebP hero with the exact canonical article title rendered in its pixels and one distinct 1200×675 WebP in-body image with the exact primary keyword rendered in its pixels. The hero is reused byte-for-byte for the visible hero, CMS featured/share image, Open Graph, Twitter/X, and Article schema surfaces. Each filename stem is the deterministic slug of the exact rendered text. The per-row rule is \`${plan.asset_architecture.social_asset_reuse_rule}\`. Reuse across different articles is prohibited and currently has zero collisions.

Each row includes title/keyword/intent-derived object, action, location, risk, and decision cues. A semantic signature is computed from those cues; the generator fails unless all 1,000 signatures are unique and every appropriateness check passes. Each row also includes concise alt text, a distinct share SEO title of 60 characters or fewer, a complete 130–160-character share description, 16:9 and 1.91:1 crop guidance, prohibited motifs/claims, and four independent state dimensions: \`brief_ready\`, \`asset_generated\`, \`on_disk\`, and \`published\`.

## ${v.published_count} verified public two-image sets preserved

${publicAssetTable}

These verified hero/share and in-body assets passed current frontmatter, binary, OCR, exact rendered-text/filename identity, dimensions, MIME, alt, and distinctness checks. Their current paths, titles, keywords, and descriptions are preserved as the final plan values.

## Held incumbent assets audited and preserved

All ${v.held_count} held incumbent MDX rows were read and checked against the two-image policy. ${v.held_current_asset_preserved_count} already prove a complete exact-title hero/share plus exact-keyword in-body pair. The remaining ${v.held_replacement_required_count} require policy-compliant two-image generation before publication. They remain nonpublic until their article-specific quality gates pass; no numerical cap or waiting period applies.

## Pilot placeholder replacement boundary

All 25 pilot rows still point at the shared staging placeholder \`/assets/brand/mrx-underwriter-review-og.png\` in their untouched source frontmatter. This plan assigns each pilot unique hero/share and in-body replacement paths under \`/assets/articles/hero/\` and \`/assets/articles/inline/\`, but every pilot remains \`asset_generated=false\`, \`on_disk=false\`, \`published=false\`, and \`release_blocked=true\` until its creative and article-specific quality gates pass. No later numerical cap-lift decision is required.

## Determinism

- Canonical ledger SHA-256: \`${plan.source_ledger.sha256}\`
- Input fingerprint SHA-256: \`${plan.source_input_fingerprint_sha256}\`
- Row-plan fingerprint SHA-256: \`${plan.row_plan_fingerprint_sha256}\`
- Generated-at source: canonical ledger \`generated_at\` (no wall-clock timestamp)
`;
}

async function main() {
  const [ledgerBytes, ownerDecisionBytes, twoImageRetrofitBytes, twoImageDecisionBytes] =
    await Promise.all([
      readFile(INPUTS.ledger),
      readFile(INPUTS.ownerDecision),
      readFile(INPUTS.twoImageRetrofit),
      readFile(INPUTS.twoImageDecision),
    ]);
  const ownerDecisionSha = sha256(ownerDecisionBytes);
  if (ownerDecisionSha !== OWNER_DECISION_SHA256) {
    throw new Error(
      `Owner decision checksum changed: expected ${OWNER_DECISION_SHA256}, received ${ownerDecisionSha}`,
    );
  }
  const ownerDecisionText = ownerDecisionBytes.toString('utf8');
  if (
    !ownerDecisionText.includes('Decision ID: D-2026-0804-16') ||
    !ownerDecisionText.includes('release_authorized: true') ||
    !ownerDecisionText.includes('Article count and elapsed time do not.')
  ) {
    throw new Error('Owner decision no longer proves continuous quality-gated publication');
  }

  const ledger = JSON.parse(ledgerBytes.toString('utf8'));
  const twoImageRetrofit = JSON.parse(twoImageRetrofitBytes.toString('utf8'));
  const twoImageDecisionText = twoImageDecisionBytes.toString('utf8');
  if (ledger.verification?.row_count !== 1000 || ledger.articles?.length !== 1000) {
    throw new Error('Canonical ledger must contain exactly 1,000 verified rows');
  }
  if (
    twoImageRetrofit.summary?.article_count !== 99 ||
    twoImageRetrofit.summary?.hero_ocr_pass_count !== 99 ||
    twoImageRetrofit.summary?.inline_ocr_pass_count !== 99
  ) {
    throw new Error('Two-image retrofit manifest must prove 99 public OCR-verified article rows');
  }
  if (
    !twoImageDecisionText.includes('Decision ID: D-2026-0811-17') ||
    !twoImageDecisionText.includes('Every MRX article must use a unique canonical hero/share image')
  ) {
    throw new Error('Owner two-image decision no longer proves the 1,000-row image policy');
  }
  const twoImageEvidenceBySlug = new Map(twoImageRetrofit.rows.map((row) => [row.slug, row]));

  const runtime = projectLedgerArticlesForRuntime(ledger.articles, MRX_ROOT);
  const runtimeArticles = runtime.articles;
  const inputParts = [
    ledgerBytes.toString('utf8'),
    ownerDecisionBytes.toString('utf8'),
    twoImageRetrofitBytes.toString('utf8'),
    twoImageDecisionText,
  ];
  const currentEvidenceByRow = new Map();
  for (const row of runtimeArticles) {
    const evidence = await loadCurrentAssetEvidence(row, inputParts);
    if (evidence) currentEvidenceByRow.set(row.program_row_id, evidence);
  }
  const currentPathCounts = new Map();
  const currentHashCounts = new Map();
  const currentSocialPathCounts = new Map();
  const currentSocialHashCounts = new Map();
  for (const evidence of currentEvidenceByRow.values()) {
    if (evidence.asset_path) {
      currentPathCounts.set(
        evidence.asset_path,
        (currentPathCounts.get(evidence.asset_path) ?? 0) + 1,
      );
    }
    if (evidence.sha256) {
      currentHashCounts.set(evidence.sha256, (currentHashCounts.get(evidence.sha256) ?? 0) + 1);
    }
    if (evidence.social_asset_path) {
      currentSocialPathCounts.set(
        evidence.social_asset_path,
        (currentSocialPathCounts.get(evidence.social_asset_path) ?? 0) + 1,
      );
    }
    if (evidence.social_sha256) {
      currentSocialHashCounts.set(
        evidence.social_sha256,
        (currentSocialHashCounts.get(evidence.social_sha256) ?? 0) + 1,
      );
    }
  }
  const shareTitles = buildUniqueShareTitles(runtimeArticles);
  const rows = [];
  for (const row of runtimeArticles) {
    rows.push(
      await buildRow(
        row,
        currentEvidenceByRow.get(row.program_row_id) ?? null,
        twoImageEvidenceBySlug.get(row.canonical_slug) ?? null,
        currentPathCounts,
        currentHashCounts,
        currentSocialPathCounts,
        currentSocialHashCounts,
        shareTitles.get(row.program_row_id),
      ),
    );
  }

  const heroDuplicates = duplicateValues(rows.map((row) => row.final_hero_asset_path));
  const socialDuplicates = duplicateValues(rows.map((row) => row.final_social_asset_path));
  const inlineDuplicates = duplicateValues(rows.map((row) => row.final_inline_asset_path));
  const crossRowHeroSocialCollisions = rows.filter((row, rowIndex) =>
    rows.some(
      (other, otherIndex) =>
        rowIndex !== otherIndex && row.final_hero_asset_path === other.final_social_asset_path,
    ),
  );
  const publicRows = rows.filter((row) => row.published);
  const heldRows = rows.filter((row) => row.preservation_classification === HELD_CLASS);
  const pilotRows = rows.filter((row) => row.is_pilot_001);
  const verification = {
    row_count: rows.length,
    brief_ready_count: rows.filter((row) => row.brief_ready).length,
    unique_final_hero_asset_path_count: new Set(rows.map((row) => row.final_hero_asset_path)).size,
    final_hero_asset_path_collision_count: heroDuplicates.length,
    unique_final_social_asset_path_count: new Set(rows.map((row) => row.final_social_asset_path))
      .size,
    final_social_asset_path_collision_count: socialDuplicates.length,
    unique_final_inline_asset_path_count: new Set(rows.map((row) => row.final_inline_asset_path))
      .size,
    final_inline_asset_path_collision_count: inlineDuplicates.length,
    same_row_hero_social_reuse_count: rows.filter(
      (row) => row.final_hero_asset_path === row.final_social_asset_path,
    ).length,
    cross_row_hero_social_collision_count: crossRowHeroSocialCollisions.length,
    hero_filename_text_identity_count: rows.filter((row) => row.hero_filename_text_identity).length,
    inline_filename_text_identity_count: rows.filter((row) => row.inline_filename_text_identity)
      .length,
    hero_exact_title_prompt_count: rows.filter((row) =>
      row.generation_prompt.includes(`Render exactly “${row.canonical_title}”`),
    ).length,
    inline_exact_keyword_prompt_count: rows.filter((row) =>
      row.inline_generation_prompt.includes(`Render exactly “${row.inline_rendered_text}”`),
    ).length,
    unique_alt_text_count: new Set(rows.map((row) => row.alt_text)).size,
    unique_visual_concept_count: new Set(rows.map((row) => row.visual_concept)).size,
    unique_generation_prompt_count: new Set(rows.map((row) => row.generation_prompt)).size,
    unique_semantic_signature_count: new Set(
      rows.map((row) => row.topic_semantics.semantic_signature_sha256),
    ).size,
    semantic_appropriateness_failure_count: rows.filter(
      (row) => !Object.values(row.semantic_appropriateness_checks).every(Boolean),
    ).length,
    explicit_topic_rule_count: rows.filter(
      (row) => row.topic_semantics.rule_source === 'explicit_topic_rule',
    ).length,
    subject_derived_fallback_count: rows.filter(
      (row) => row.topic_semantics.rule_source === 'subject_terms_with_cluster_support',
    ).length,
    unique_share_title_count: new Set(rows.map((row) => row.share_title)).size,
    unique_share_description_count: new Set(rows.map((row) => row.share_description)).size,
    alt_text_over_125_count: rows.filter((row) => row.alt_text.length > 125).length,
    share_title_over_60_count: rows.filter((row) => row.share_title.length > 60).length,
    share_description_outside_130_160_count: rows.filter(
      (row) => row.share_description.length < 130 || row.share_description.length > 160,
    ).length,
    share_description_ellipsis_count: rows.filter((row) => row.share_description.includes('…'))
      .length,
    share_description_incomplete_sentence_count: rows.filter(
      (row) => !/[.!?]$/u.test(row.share_description),
    ).length,
    existing_public_asset_verified_count: publicRows.filter(
      (row) => row.asset_generated && row.on_disk && row.current_asset_sha256,
    ).length,
    existing_public_inline_asset_verified_count: publicRows.filter(
      (row) =>
        row.inline_asset_generated &&
        row.inline_on_disk &&
        row.current_inline_asset_sha256 &&
        row.two_image_policy_evidence_verified,
    ).length,
    asset_generated_count: rows.filter((row) => row.asset_generated).length,
    on_disk_count: rows.filter((row) => row.on_disk).length,
    published_count: publicRows.length,
    release_blocked_count: rows.filter((row) => row.release_blocked).length,
    held_count: heldRows.length,
    held_current_asset_observed_count: heldRows.filter((row) => row.current_asset_path).length,
    held_current_asset_usable_count: heldRows.filter((row) => row.current_asset_usable).length,
    held_current_asset_preserved_count: heldRows.filter((row) => row.current_asset_preserved)
      .length,
    held_replacement_required_count: heldRows.filter((row) => row.planned_replacement_required)
      .length,
    pilot_count: pilotRows.length,
    pilot_shared_placeholder_current_count: pilotRows.filter(
      (row) => row.current_asset_is_shared_pilot_placeholder,
    ).length,
    pilot_unique_replacement_path_count: new Set(pilotRows.map((row) => row.final_hero_asset_path))
      .size,
    pilot_asset_generated_count: pilotRows.filter((row) => row.asset_generated).length,
    pilot_on_disk_count: pilotRows.filter((row) => row.on_disk).length,
    pilot_published_count: pilotRows.filter((row) => row.published).length,
    pilot_release_blocked_count: pilotRows.filter((row) => row.release_blocked).length,
  };

  const requiredTruths = [
    verification.row_count === 1000,
    verification.brief_ready_count === 1000,
    verification.unique_final_hero_asset_path_count === 1000,
    verification.final_hero_asset_path_collision_count === 0,
    verification.unique_final_social_asset_path_count === 1000,
    verification.final_social_asset_path_collision_count === 0,
    verification.unique_final_inline_asset_path_count === 1000,
    verification.final_inline_asset_path_collision_count === 0,
    verification.same_row_hero_social_reuse_count === 1000,
    verification.cross_row_hero_social_collision_count === 0,
    verification.hero_filename_text_identity_count === 1000,
    verification.inline_filename_text_identity_count === 1000,
    verification.hero_exact_title_prompt_count === 1000,
    verification.inline_exact_keyword_prompt_count === 1000,
    verification.unique_alt_text_count === 1000,
    verification.unique_visual_concept_count === 1000,
    verification.unique_generation_prompt_count === 1000,
    verification.unique_semantic_signature_count === 1000,
    verification.semantic_appropriateness_failure_count === 0,
    verification.unique_share_title_count === 1000,
    verification.unique_share_description_count === 1000,
    verification.alt_text_over_125_count === 0,
    verification.share_title_over_60_count === 0,
    verification.share_description_outside_130_160_count === 0,
    verification.share_description_ellipsis_count === 0,
    verification.share_description_incomplete_sentence_count === 0,
    verification.existing_public_asset_verified_count === 99,
    verification.existing_public_inline_asset_verified_count === 99,
    verification.asset_generated_count === 99 + verification.held_current_asset_preserved_count,
    verification.on_disk_count === 99 + verification.held_current_asset_preserved_count,
    verification.published_count === 99,
    verification.release_blocked_count === 901,
    verification.held_count === 29,
    verification.held_current_asset_observed_count === 29,
    verification.held_current_asset_preserved_count ===
      verification.held_current_asset_usable_count,
    verification.held_current_asset_preserved_count +
      verification.held_replacement_required_count ===
      29,
    verification.pilot_count === 25,
    verification.pilot_shared_placeholder_current_count === 25,
    verification.pilot_unique_replacement_path_count === 25,
    verification.pilot_asset_generated_count === 0,
    verification.pilot_on_disk_count === 0,
    verification.pilot_published_count === 0,
    verification.pilot_release_blocked_count === 25,
  ];
  if (!requiredTruths.every(Boolean)) {
    throw new Error(`Creative-plan invariants failed:\n${JSON.stringify(verification, null, 2)}`);
  }

  const rowPlanFingerprint = sha256(`${JSON.stringify(rows)}\n`);
  const plan = {
    schema_version: 'mrx1000-two-image-creative-brief-v2.0.0',
    generated_at: ledger.generated_at,
    source_ledger: {
      path: 'mrx/config/mrx-1000-canonical-content-ledger.json',
      sha256: sha256(ledgerBytes),
      row_count: 1000,
    },
    controlling_decision: {
      decision_id: 'D-2026-0804-16',
      path: 'docs/governance/mrx1000-owner-continuous-publication-directive-2026-08-04.md',
      sha256: ownerDecisionSha,
      signed: true,
      disposition: 'APPROVED_CONTINUOUS_QUALITY_GATED_ARTICLE_PUBLICATION',
      numerical_release_cap_applies: false,
      elapsed_time_gate_applies: false,
      generation_authorized: true,
      publication_authorized: true,
      indexing_authorized: true,
      deployment_authorized: true,
      spend_authorized: false,
    },
    two_image_policy: {
      decision_id: 'D-2026-0811-17',
      decision_path:
        'artifacts/mrx1000-release-10/decisions/mrx-owner-two-image-retrofit-authorization-20260811.md',
      decision_sha256: sha256(twoImageDecisionBytes),
      current_public_manifest_path: 'config/mrx-article-two-image-retrofit.json',
      current_public_manifest_sha256: sha256(twoImageRetrofitBytes),
      exact_title_in_hero_pixels_required: true,
      hero_share_binary_identity_required: true,
      exact_keyword_in_inline_pixels_required: true,
      distinct_inline_image_required: true,
      filename_rendered_text_identity_required: true,
      ocr_verification_required: true,
      applies_to_all_program_rows: true,
    },
    asset_architecture: {
      one_unique_hero_per_article: true,
      one_distinct_inline_image_per_article: true,
      final_distinct_asset_path_count: 2000,
      hero_target_format: 'webp',
      hero_target_dimensions: '1200x630',
      inline_target_format: 'webp',
      inline_target_dimensions: '1200x675',
      rendered_text_filename_identity_required: true,
      social_asset_reuse_rule: REUSE_RULE,
      hero_and_social_same_path_within_row_count: 1000,
      dedicated_social_asset_row_count: 0,
      hero_or_social_path_reuse_across_rows_allowed: false,
      open_graph_contract: {
        title: 'share_seo_title -> og:title; visible_canonical_title remains the H1',
        description: 'share_description -> og:description',
        image: 'final_social_asset_path -> og:image',
        image_alt: 'social_alt_text -> og:image:alt when supported',
      },
      twitter_contract: {
        title: 'share_seo_title -> twitter:title; visible_canonical_title remains the H1',
        description: 'share_description -> twitter:description',
        image: 'final_social_asset_path -> twitter:image',
        image_alt: 'social_alt_text -> twitter:image:alt when supported',
      },
    },
    scope_attestation: {
      local_only: true,
      images_generated_or_edited: false,
      article_frontmatter_edited: false,
      source_articles_edited: false,
      external_calls_made: false,
      publication_or_indexing_performed: false,
      deployment_performed: false,
      spend_performed: false,
    },
    source_input_fingerprint_sha256: sha256(inputParts.join('\n--INPUT--\n')),
    row_plan_fingerprint_sha256: rowPlanFingerprint,
    verification,
    rows,
  };

  const json = await formatWithPrettier(JSON.stringify(plan), {
    parser: 'json',
    printWidth: 100,
  });
  const csv = buildCsv(rows);
  const report = buildReport(plan);
  await Promise.all([
    writeFile(OUTPUTS.json, json),
    writeFile(OUTPUTS.csv, csv),
    writeFile(OUTPUTS.report, report),
  ]);

  console.log(
    JSON.stringify(
      {
        outputs: OUTPUTS,
        verification,
        row_plan_fingerprint_sha256: rowPlanFingerprint,
      },
      null,
      2,
    ),
  );
}

await main();
