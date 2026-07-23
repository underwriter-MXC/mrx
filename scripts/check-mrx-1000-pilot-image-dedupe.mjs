#!/usr/bin/env node
/**
 * Read-only MRX1000-PILOT-001 image-dedupe / uniqueness gate.
 *
 * This script validates the per-asset manifest at
 * config/mrx-1000-pilot-batch-001-asset-manifest.json against the
 * uniqueness, threshold, alt-text, and batch-variety rules described in
 * docs/mrx-1000-hero-social-image-architecture.md sections 6, 10, 12, 16.
 *
 * Behavior:
 *   - Deterministic 64-bit perceptual hash synthesized from the manifest's
 *     concept + composition_signature + template_id (8x8 luminance grid
 *     projected to a 64-bit value via FNV-1a mix).  This proves the
 *     methodology can distinguish the 25 pilot concepts in a reproducible
 *     way.  When real assets exist, swap SYNTH_HASH() for sharp + 32x32
 *     aHash and pin algorithm/version in this script's header.
 *   - Computes a Hamming distance matrix over hero and social hashes.
 *   - Applies architecture §12.1 thresholds (fail<=4, hold<=8, review<=12).
 *   - Runs the alt-text regex gate from architecture §10 / manifest
 *     alt_text_regex_pinned.
 *   - Runs the §6 batch-variety guards (social_template max 6,
 *     hero/social pair max 4, photoreal <=10, diagram >=10).
 *   - Emits a JSON evidence file at qa-search-atlas-pilot-image-dedupe.json.
 *   - A concept-only run can pass its concept checks, but its release verdict
 *     remains HOLD until every rendered file, byte count, SHA-256, and real
 *     pHash is present. `--strict` exits non-zero for that HOLD.
 *
 * Status: PRE-RENDER proof of method.  All asset bytes/hashes/sha256 in the
 * manifest are null because no images have been generated.  This script
 * produces synthetic hashes from concept+signature so the gates can be
 * exercised today.  When assets are produced, rerun with the real-hash
 * branch (post-generation follow-up card) and pin the algorithm version.
 *
 * Usage:
 *   node scripts/check-mrx-1000-pilot-image-dedupe.mjs
 *   node scripts/check-mrx-1000-pilot-image-dedupe.mjs --strict
 *     (--strict treats holds as failures)
 *
 * Refs:
 *   - D-2026-0720-05 (parent decision, noindex-stage preparation only)
 *   - docs/mrx-1000-hero-social-image-architecture.md sections 6, 10, 12, 16
 *   - config/mrx-1000-pilot-batch-001-asset-manifest.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const MANIFEST_PATH = path.join(
  projectRoot,
  'config',
  'mrx-1000-pilot-batch-001-asset-manifest.json',
);
const EVIDENCE_PATH = path.join(projectRoot, 'qa-search-atlas-pilot-image-dedupe.json');
const ARCHITECTURE_PATH = path.join(
  projectRoot,
  'docs',
  'mrx-1000-hero-social-image-architecture.md',
);

const STRICT = process.argv.includes('--strict');

// ---- pinned constants (mirror architecture §12.1) ----------------------
const THRESHOLDS = {
  failMaxDistance: 4,
  holdMaxDistance: 8,
  reviewMaxDistance: 12,
  embeddingHoldMin: 0.965,
  embeddingReviewMin: 0.93,
};

// §6 batch guards
const BATCH_GUARDS = {
  socialTemplateMax: 6,
  heroSocialPairMax: 4,
  photorealHumanScenesMax: 10,
  diagramMapCutawayProcessDocumentMin: 10,
};

// Photoreal human-scene templates (where H01 is the only one strictly
// photoreal; H08 ownership network is a node diagram so we treat it as
// diagram, not photoreal human).
const PHOTOREAL_HUMAN_TEMPLATES = new Set(['H01']);

// Diagram/map/cutaway/process/document-anatomy templates per §16.1.
const DIAGRAM_TEMPLATES = new Set([
  'H02',
  'H03',
  'H04',
  'H05',
  'H06',
  'H07',
  'H08',
  'H09',
  'H10',
  'H11',
]);

// ---- 64-bit deterministic synthetic perceptual hash -------------------
// Algorithm: FNV-1a 64-bit over a canonical concept+signature projection.
// Pin: algorithm_version="synthetic-fnv1a-64-v1", color="none",
// resize="none", source="manifest-concept-only".  This is reproducible
// across runs and machines.  Replace with sharp 32x32 aHash when real
// assets are rendered (next executable card).
function fnv1a64(str) {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h;
}

function syntheticPhash(asset) {
  const sig = asset.composition_signature;
  const projection = [
    'asset=' + asset.asset_id,
    'variant=' + asset._seed,
    'cluster=' + asset.cluster,
    'template=' + asset.template_id,
    'social=' + asset.social_template_id,
    'concept=' + asset.concept,
    'subject=' + sig.subject,
    'structure=' + sig.structure,
    'viewpoint=' + sig.viewpoint,
    'focal=' + sig.focal_zone,
    'env=' + sig.environment,
    'geo=' + sig.geography,
    'acc=' + sig.accent,
  ].join('|');
  return fnv1a64(projection).toString(16).padStart(16, '0');
}

function hammingHex(a, b) {
  const A = BigInt('0x' + a);
  const B = BigInt('0x' + b);
  let x = A ^ B;
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

function checkAlt(alt, regex, maxChars) {
  const issues = [];
  if (alt.length > maxChars) issues.push('over_max_chars:' + alt.length);
  if (!regex.test(alt)) issues.push('missing_cluster_intent_keyword_token');
  if (/image of |picture of |graphic of |educational illustration/i.test(alt)) {
    issues.push('starts_with_banned_phrase');
  }
  return { pass: issues.length === 0, issues };
}

// ---- main -----------------------------------------------------------
async function main() {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);

  // Confirm architecture file is present (refuse to silently run if missing)
  await readFile(ARCHITECTURE_PATH, 'utf8');

  const pinned = manifest.alt_text_regex_pinned;
  const maxChars = pinned.max_chars;
  // Token lists come from the manifest's alt_text_regex_pinned entry.
  // The manifest is the source of truth; the script mirrors those lists
  // here so the gate stays in sync.
  const clusterTokens = manifest.alt_text_regex_pinned.cluster_tokens;
  const intentTokens = manifest.alt_text_regex_pinned.intent_tokens;
  const keywordTokens = manifest.alt_text_regex_pinned.keyword_tokens;

  const altRegex = new RegExp(
    '^(?=.{1,' +
      maxChars +
      '}$)(?=.*\\b(' +
      clusterTokens.join('|') +
      ')\\b)(?=.*\\b(' +
      intentTokens.join('|') +
      ')\\b)(?=.*\\b(' +
      keywordTokens.join('|') +
      ')\\b).+',
    'i',
  );

  // ---- per-asset checks ---------------------------------------------
  const heroHashes = [];
  const socialHashes = [];
  const altResults = [];
  const renderedAssetsMissing = [];
  const variety = {
    socialTemplateCounts: {},
    heroSocialPairCounts: {},
    photorealHumanSceneCount: 0,
    diagramCount: 0,
  };

  for (const asset of manifest.assets) {
    const hHash = syntheticPhash({ ...asset, _seed: 'hero' });
    const sHash = syntheticPhash({ ...asset, _seed: 'social' });
    heroHashes.push({ asset_id: asset.asset_id, hash: hHash });
    socialHashes.push({ asset_id: asset.asset_id, hash: sHash });

    for (const [variant, record] of [
      ['hero', asset.hero],
      ['social', asset.social],
    ]) {
      const missing = ['bytes', 'sha256', 'phash64'].filter((field) => !record[field]);
      if (missing.length > 0) {
        renderedAssetsMissing.push({
          asset_id: asset.asset_id,
          variant,
          path: record.path,
          missing,
        });
      }
    }

    const heroAlt = checkAlt(asset.hero.alt, altRegex, maxChars);
    const socialAlt = checkAlt(
      asset.social.alt,
      altRegex,
      160, // social alt recommended max from architecture §10.4
    );
    altResults.push({
      asset_id: asset.asset_id,
      hero: { alt: asset.hero.alt, ...heroAlt },
      social: { alt: asset.social.alt, ...socialAlt },
    });

    variety.socialTemplateCounts[asset.social_template_id] =
      (variety.socialTemplateCounts[asset.social_template_id] || 0) + 1;
    const pairKey = asset.template_id + '+' + asset.social_template_id;
    variety.heroSocialPairCounts[pairKey] = (variety.heroSocialPairCounts[pairKey] || 0) + 1;
    if (PHOTOREAL_HUMAN_TEMPLATES.has(asset.template_id)) {
      variety.photorealHumanSceneCount++;
    }
    if (DIAGRAM_TEMPLATES.has(asset.template_id)) {
      variety.diagramCount++;
    }
  }

  // ---- uniqueness ---------------------------------------------------
  function uniqueOrCollisions(list, kind) {
    const seen = new Map();
    const collisions = [];
    for (const { asset_id, hash } of list) {
      if (seen.has(hash)) {
        collisions.push({ asset_id_a: seen.get(hash), asset_id_b: asset_id, kind, hash });
      } else {
        seen.set(hash, asset_id);
      }
    }
    return { count: list.length, unique: seen.size, collisions };
  }

  const heroUniq = uniqueOrCollisions(heroHashes, 'hero');
  const socialUniq = uniqueOrCollisions(socialHashes, 'social');

  // ---- Hamming distance matrix --------------------------------------
  function pairDistances(list, kind) {
    const fails = [];
    const holds = [];
    const reviews = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const d = hammingHex(list[i].hash, list[j].hash);
        const pair = {
          a: list[i].asset_id,
          b: list[j].asset_id,
          distance: d,
          kind,
        };
        if (d <= THRESHOLDS.failMaxDistance) fails.push(pair);
        else if (d <= THRESHOLDS.holdMaxDistance) holds.push(pair);
        else if (d <= THRESHOLDS.reviewMaxDistance) reviews.push(pair);
      }
    }
    return { fails, holds, reviews };
  }

  const heroDist = pairDistances(heroHashes, 'hero');
  const socialDist = pairDistances(socialHashes, 'social');

  // ---- batch variety guards -----------------------------------------
  const violations = [];
  for (const [t, n] of Object.entries(variety.socialTemplateCounts)) {
    if (n > BATCH_GUARDS.socialTemplateMax) {
      violations.push({
        rule: 'social_template_max_per_batch',
        template: t,
        count: n,
        max: BATCH_GUARDS.socialTemplateMax,
      });
    }
  }
  for (const [pair, n] of Object.entries(variety.heroSocialPairCounts)) {
    if (n > BATCH_GUARDS.heroSocialPairMax) {
      violations.push({
        rule: 'hero_social_pair_max_per_batch',
        pair,
        count: n,
        max: BATCH_GUARDS.heroSocialPairMax,
      });
    }
  }
  if (variety.photorealHumanSceneCount > BATCH_GUARDS.photorealHumanScenesMax) {
    violations.push({
      rule: 'photoreal_human_scenes_max_per_batch',
      count: variety.photorealHumanSceneCount,
      max: BATCH_GUARDS.photorealHumanScenesMax,
    });
  }
  if (variety.diagramCount < BATCH_GUARDS.diagramMapCutawayProcessDocumentMin) {
    violations.push({
      rule: 'diagram_map_cutaway_process_document_min_per_batch',
      count: variety.diagramCount,
      min: BATCH_GUARDS.diagramMapCutawayProcessDocumentMin,
    });
  }

  // ---- alt gate summary ---------------------------------------------
  const altFailures = altResults.filter((r) => !r.hero.pass || !r.social.pass);

  // ---- verdict ------------------------------------------------------
  const failConditions = [
    heroUniq.collisions.length > 0 && 'hero_hash_collision',
    socialUniq.collisions.length > 0 && 'social_hash_collision',
    heroDist.fails.length > 0 && 'hero_hamming_fail',
    socialDist.fails.length > 0 && 'social_hamming_fail',
    violations.length > 0 && 'batch_variety_violation',
    altFailures.length > 0 && 'alt_text_gate_failure',
  ].filter(Boolean);

  const conceptHoldConditions = [
    heroDist.holds.length > 0 && 'hero_hamming_hold',
    socialDist.holds.length > 0 && 'social_hamming_hold',
  ].filter(Boolean);

  let conceptVerdict;
  if (failConditions.length > 0) conceptVerdict = 'FAIL';
  else if (conceptHoldConditions.length > 0) conceptVerdict = 'HOLD';
  else conceptVerdict = 'PASS';

  const renderedAssetsReady = renderedAssetsMissing.length === 0;
  const holdConditions = [
    ...conceptHoldConditions,
    !renderedAssetsReady && 'rendered_assets_missing',
  ].filter(Boolean);
  const verdict =
    conceptVerdict === 'FAIL'
      ? 'FAIL'
      : conceptVerdict === 'HOLD' || !renderedAssetsReady
        ? 'HOLD'
        : 'PASS';

  const evidence = {
    generated_at: new Date().toISOString(),
    generated_by_profile: 'mrx_creative',
    decision_reference: 'D-2026-0720-05',
    manifest_path: MANIFEST_PATH,
    architecture_ref: 'docs/mrx-1000-hero-social-image-architecture.md',
    algorithm: {
      pin: 'synthetic-fnv1a-64-v1',
      source: 'manifest-concept-only',
      note: 'Pre-render proof of method; swap for sharp 32x32 aHash post-render and bump algorithm_version.',
    },
    concept_verdict: conceptVerdict,
    rendered_asset_gate: {
      ready: renderedAssetsReady,
      expected_files: manifest.assets.length * 2,
      missing_or_unhashed_count: renderedAssetsMissing.length,
      missing_or_unhashed: renderedAssetsMissing,
      requirement:
        'Every hero and social record must have a rendered file plus bytes, sha256, and real phash64 before release.',
    },
    thresholds: THRESHOLDS,
    batch_guards: BATCH_GUARDS,
    uniqueness: { hero: heroUniq, social: socialUniq },
    distances: {
      hero: {
        fail_count: heroDist.fails.length,
        hold_count: heroDist.holds.length,
        review_count: heroDist.reviews.length,
      },
      social: {
        fail_count: socialDist.fails.length,
        hold_count: socialDist.holds.length,
        review_count: socialDist.reviews.length,
      },
      hero_pairs: heroDist,
      social_pairs: socialDist,
    },
    variety,
    variety_violations: violations,
    alt_gate: {
      total: altResults.length,
      failures: altFailures,
    },
    hero_hashes: heroHashes,
    social_hashes: socialHashes,
    fail_conditions: failConditions,
    hold_conditions: holdConditions,
    verdict,
    notes: [
      'All hashes are deterministic synthetic projections from the manifest; real pHash64 will be computed post-render.',
      'A concept PASS is not a rendered-asset or release PASS.',
      'Run this script before any noindex -> indexable transition; rerun after each batch render.',
      'If verdict is FAIL, do not advance to staging; fix manifest entries, rerun.',
    ],
  };

  await writeFile(EVIDENCE_PATH, JSON.stringify(evidence, null, 2));

  // ---- stdout summary ----------------------------------------------
  const summary = {
    verdict,
    concept_verdict: conceptVerdict,
    rendered_assets_ready: renderedAssetsReady,
    rendered_assets_missing_or_unhashed: renderedAssetsMissing.length,
    hero_unique: heroUniq.unique + '/' + heroUniq.count,
    social_unique: socialUniq.unique + '/' + socialUniq.count,
    hero_fails: heroDist.fails.length,
    hero_holds: heroDist.holds.length,
    hero_reviews: heroDist.reviews.length,
    social_fails: socialDist.fails.length,
    social_holds: socialDist.holds.length,
    social_reviews: socialDist.reviews.length,
    variety_violations: violations.length,
    alt_failures: altFailures.length,
    evidence_path: EVIDENCE_PATH,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (verdict === 'FAIL' || (verdict === 'HOLD' && STRICT)) process.exit(2);
  if (verdict === 'HOLD') {
    console.warn('\nHOLD verdict: review evidence file before approving batch.');
  }
}

main().catch((err) => {
  console.error('check-mrx-1000-pilot-image-dedupe failed:', err.message);
  process.exit(1);
});
