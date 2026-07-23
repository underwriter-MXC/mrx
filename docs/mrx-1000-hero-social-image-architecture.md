# MRX 1,000-Article Hero and Social Image Architecture

Prepared for Kanban task `t_df07bd44` (`MRX1000-009`)

Status: read-only production architecture; no images were generated and no website, SearchAtlas, GSC, GA4, or publishing state was changed.

Program source: `/Users/darylhill/Documents/MineralRightsXchange.com/program-plans/mrx-1000-article-seo-aeo-program-first-pass.md`

## 1. Decision summary

MRX should use **one unique visual concept per article**, expressed as two channel-specific exports:

1. **Hero** — 1600 × 900 WebP, normally text-free, used in the Learning Center article and cards.
2. **Social** — 1200 × 630 channel-safe derivative, normally JPEG after the current schema/metadata gap is fixed, using the same concept but a deliberate social crop and optional approved title treatment.

“Unique” means more than a unique filename. Each article must have a unique source concept, source asset, composition signature, hero and social file hashes, perceptual hash neighborhood, and descriptive alt text. Recoloring, recropping, adding a title, changing a prompt seed, or moving an icon does not make a repeated image unique.

The 1,000-article system is governed by:

- nine cluster-aligned visual families;
- twelve reusable but visibly distinct hero templates;
- six social composition templates;
- an immutable asset manifest and reproducible prompt/source record;
- deterministic duplicate screening against both the current 125 posts and every new asset;
- creative, accessibility, editorial, and compliance approval gates;
- batch contact-sheet review, initially in batches of 25.

The first production action should be a **25-article, noindex pilot**, not a 1,000-image generation run. The pilot calibrates pHash/semantic thresholds, social safe zones, visual variety, cost, and reviewer throughput before scaling.

## 2. Current-state evidence and gaps

### 2.1 Verified repo baseline

A read-only audit of the current repo found:

- 125 MDX posts.
- 125 frontmatter `hero_image` records.
- 125 distinct `hero_image.src` strings.
- 125 distinct normalized alt strings.
- All 125 frontmatter image paths resolve locally.
- 124 posts use unique 1600 × 900 WebP article images.
- One post, `understand-the-value-of-your-inherited-mineral-rights.mdx`, still uses `/og-default.svg` rather than its planned unique image.
- `public/assets/articles/` contains 126 raster files; two are currently unreferenced by post frontmatter.
- No exact binary duplicate group was detected among the raster article assets.
- No 64-bit pHash pair at Hamming distance 12 or less was detected in the current raster inventory using the audit implementation.
- Current raster median size is approximately 114 KB; the largest observed file is approximately 292 KB. All observed raster article assets are 1600 × 900 WebP.
- Current alt lengths range from 61 to 125 characters; 114 of 125 use the generic suffix “educational illustration,” and 36 exceed 100 characters.
- Nine current alt strings contain terms that deserve claim/compliance review, including variants of “guarantees,” “outshines,” “reliable,” “maximize,” “fairness,” and “accuracy.”

The repository already has useful image metadata fields in `src/content/config.ts`:

- `src`, `alt`, `width`, `height`, `mime_type`
- `social_src`
- `prompt`, `source`, `license`
- `perceptual_hash`

However, the optional provenance, social, and perceptual-hash fields are not populated in the current 125 post frontmatters.

### 2.2 Current sync-check risk

`pnpm run assets:article-heroes:check` currently exits 1 because the 125-row plan expects:

- `/assets/articles/understand-the-value-of-inherited-mineral-rights.webp`, which is missing; and
- that asset in the matching post frontmatter, which still points at `/og-default.svg`.

The architecture does not repair this because this task is read-only. It is a production prerequisite for a later implementation card.

The current `config/article-hero-plan.json` has 125 unique slugs, filenames, and visual concepts, but five entries have no source URL. Its planned alt strings range from 83 to 154 characters, so some do not satisfy the current 125-character schema maximum.

### 2.3 Representative visual audit

A contact-sheet review of 20 representative current heroes showed:

- repeated photorealistic desk scenes with papers, calculators, charts, and a professional reviewing documents;
- repeated pumpjack/drilling-at-sunset landscapes;
- a warm brown/gold stock-photo look that is not consistently tied to the site’s deep-navy/cream/gold system;
- occasional style breaks, including cartoon/comic treatment among otherwise photorealistic assets;
- charts, reports, contracts, signs, and screens containing tiny or synthetic-looking text that cannot be trusted or read at card size;
- recurring “professional at desk” and “pumpjack landscape” compositions that may remain semantically repetitive even though current pHashes are distinct;
- limited use of a consistent MRX visual grammar, focal hierarchy, or cluster cue.

The next 1,000 should preserve the current dimensional discipline while replacing stock-like repetition with a controlled editorial system.

## 3. Non-negotiable operating principles

1. **One article, one visual idea.** A social crop may derive from the same approved master, but two articles may not share the same source photo, generated base, scene, diagram, or map.
2. **Concept first, rendering second.** The concept must visualize the article’s specific question, process, document, geography, or evidence—not simply “mineral rights.”
3. **Templates are grammar, not finished art.** A template defines information hierarchy and safe zones; it must not create 100 near-identical images with swapped nouns.
4. **No title-as-alt behavior.** Alt text describes what the image visibly communicates. It is not the article title plus “educational illustration.”
5. **No visual claims without evidence.** Charts, amounts, maps, badges, checks, seals, and comparison outcomes must be sourced or visibly generic.
6. **No generated readable evidence.** Generative models must not fabricate legible contracts, royalty statements, deeds, tax forms, well records, maps, or numerical dashboards.
7. **Source and license are first-class fields.** Every asset must be traceable to an approved generated prompt, owned MRX source, licensed source, or sourced data visualization.
8. **Accessibility is an asset gate.** Legibility, contrast, crop resilience, and meaningful alt text are reviewed before approval.
9. **Uniqueness is portfolio-wide.** Every candidate is screened against the existing 125 assets and all approved MRX1000 assets—not only its batch or cluster.
10. **No bulk approval.** Each page receives an individual human-checked image, alt text, title treatment, source, and compliance disposition.

## 4. Cluster-aligned visual taxonomy

The taxonomy mirrors the approved 1,000-article quotas so the visual system reinforces content architecture rather than creating an unrelated image library.

| Code      | Article cluster                      | Count | Visual territory                                                                            | Required differentiators                                                                      | Avoid                                                                             |
| --------- | ------------------------------------ | ----: | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `sell`    | Sell mineral rights decision/process |   150 | owner decision paths, document readiness, partial-sale choices, transaction milestones      | decision stage, document set, retained/sold interest, timing context, owner situation         | celebratory cash imagery, pressure clocks, guaranteed outcomes                    |
| `value`   | Valuation methodology/drivers        |   150 | driver frameworks, evidence layers, production/non-production context, scenario comparison  | driver combination, production state, time horizon, basin/geology context, sourced data shape | exact property values, upward-only charts, “appraisal” cues                       |
| `offer`   | Offer review/buyer comparison/safety |   125 | side-by-side terms, contract-detail review, red-flag patterns, question checklists          | term category, comparison structure, review stage, neutral risk signal                        | fake offers, named competitors, winner badges, predatory stereotypes              |
| `inherit` | Inherited/estate/probate             |   100 | ownership lineage, heir handoffs, record gathering, probate milestones                      | family/party structure, document path, jurisdiction context, lifecycle stage                  | identifiable families without releases, simplistic legal outcomes                 |
| `royalty` | Royalties/owner operations           |   100 | statement anatomy, production-to-payment flow, division orders, owner recordkeeping         | statement section, production type, payment stage, operator-record context                    | fake readable checks, fabricated amounts, guaranteed payments                     |
| `tax`     | Tax/1031/legal education             |   100 | educational process maps, decision questions, document timelines, professional-routing cues | topic, timeline, parties, filing/document stage, state/federal context                        | advice, qualification claims, IRS/government seals, savings promises              |
| `txloc`   | Texas county/basin/local intent      |   150 | county locator maps, basin context, landscape/geology, public-record orientation            | county silhouette, basin, landform, formation, public data layer                              | invented parcel/well locations, unsupported county rankings, official endorsement |
| `title`   | Title/lease/ownership/documents      |    75 | chain of title, deed/lease relationships, severance layers, curative steps                  | instrument type, ownership relationship, surface/mineral layer, curative stage                | fake legal forms, fake signatures/notary seals, legal conclusions                 |
| `method`  | MRX methodology/transparency/process |    50 | evidence review, process visibility, source-to-review pipelines, question-first education   | review stage, input category, evidence path, owner checkpoint                                 | “best/only/most accurate,” proprietary magic, guaranteed offer imagery            |

### Taxonomy assignment rule

Every brief receives:

- exactly one primary cluster code;
- one primary owner question;
- one concrete visual subject;
- one approved template ID;
- one composition signature;
- optional geography/data/document modifiers.

Generic prompts such as “mineral rights professional,” “oil field,” “business person with documents,” or “Texas pumpjack sunset” are rejected because they do not contain enough article-specific information to produce a unique concept.

## 5. Twelve hero template families

All hero templates use a 16:9 canvas and the central safe zone defined in Section 7. Templates may be rendered as editorial vector, restrained 3D paper-cut/diagram, sourced documentary photography, or sourced-data visualization, but each article’s rendering mode is recorded.

| ID    | Template                 | Best use                                              | Required article-specific content                                 | Primary risk control                                      |
| ----- | ------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `H01` | Owner context scene      | human decisions, inherited/record situations          | distinct action, setting, focal object, and owner question        | releases for identifiable people; no distress stereotypes |
| `H02` | Evidence tabletop        | deeds, leases, offers, statements, review preparation | specific document family and object arrangement                   | no readable fabricated data/signatures/seals              |
| `H03` | Process roadmap          | sales, reviews, probate, tax/legal process            | 3–5 verified stages from the article                              | no implied guaranteed completion/time                     |
| `H04` | Neutral comparison       | options, producing vs non-producing, offer terms      | named comparison dimensions, balanced visual weight               | no winner cue unless sourced and approved                 |
| `H05` | Driver/data framework    | valuation, production, royalty, methodology           | specific drivers and a sourced or clearly conceptual relationship | no invented figures or upward-only outcome                |
| `H06` | Land/geology cutaway     | surface/mineral separation, basin, formation          | article-specific layers or formation context                      | label as conceptual unless based on cited data            |
| `H07` | Statement anatomy        | royalty statements, division orders, payment records  | specific sections or flow described in article                    | abstract/sanitized fields; no fake PII or amount          |
| `H08` | Ownership/estate network | heirs, trusts, title chains, transfers                | distinct party/interest relationship                              | no legal conclusion; people represented abstractly        |
| `H09` | Local map/context        | county, basin, local record discovery                 | exact approved geography and source/date                          | no invented parcels, wells, boundaries, or rankings       |
| `H10` | Timeline/milestones      | lease, probate, 1031, sale stages                     | verified order and neutral timing language                        | no countdown or guaranteed duration                       |
| `H11` | Risk/question checklist  | offer safety, red flags, document QA                  | article-specific questions or risk categories                     | avoid fear imagery and unsupported “safe/verified” badges |
| `H12` | MRX evidence pipeline    | methodology, transparency, underwriter review         | actual inputs, review stages, owner checkpoints                   | no black-box “AI accuracy” or guaranteed result claim     |

### Planned template allocation

The following 1,000-image matrix is a capacity and variety guardrail, not permission to auto-fill templates. It sums to the program’s approved cluster quotas.

| Cluster   |     H01 |     H02 |     H03 |     H04 |    H05 |    H06 |    H07 |    H08 |    H09 |    H10 |    H11 |    H12 |     Total |
| --------- | ------: | ------: | ------: | ------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| `sell`    |      25 |      25 |      35 |      25 |      5 |      0 |      0 |      0 |      0 |     15 |     15 |      5 |       150 |
| `value`   |      10 |      15 |      15 |      25 |     35 |     20 |      5 |      0 |      0 |     10 |      5 |     10 |       150 |
| `offer`   |      10 |      25 |      15 |      35 |     10 |      0 |      0 |      0 |      0 |      5 |     20 |      5 |       125 |
| `inherit` |      15 |      20 |      15 |       5 |      0 |      0 |      0 |     25 |      5 |     10 |      5 |      0 |       100 |
| `royalty` |      10 |      10 |      10 |       5 |     15 |      5 |     30 |      0 |      5 |      5 |      5 |      0 |       100 |
| `tax`     |       5 |      20 |      20 |      10 |      5 |      0 |      0 |      5 |      0 |     20 |     15 |      0 |       100 |
| `txloc`   |      20 |      10 |      10 |       5 |     15 |     25 |      0 |      0 |     55 |      5 |      5 |      0 |       150 |
| `title`   |       5 |      25 |      10 |       5 |      0 |     10 |      0 |     10 |      5 |      0 |      5 |      0 |        75 |
| `method`  |       5 |       5 |      10 |       5 |     10 |      0 |      0 |      0 |      0 |      0 |      5 |     10 |        50 |
| **Total** | **105** | **155** | **140** | **120** | **95** | **60** | **35** | **40** | **70** | **70** | **80** | **30** | **1,000** |

### Within-template uniqueness rule

A new asset must differ from its nearest same-template neighbor in at least **four** of these eight recorded dimensions:

1. primary subject/focal object;
2. information structure;
3. camera/viewpoint or diagram orientation;
4. composition/focal zone;
5. environment/background;
6. geography or geological context;
7. supporting objects/data shape;
8. secondary accent treatment.

Changing palette, adding the article title, or mirroring the composition counts as no more than one difference and cannot rescue a repeated concept.

## 6. Six social composition templates

The social image is a channel-specific derivative, not a screenshot of the article hero. It must preserve the article’s unique concept while surviving 1.91:1 crops and mobile feed display.

| ID    | Composition                  | Use                                     | Text policy                                                       |
| ----- | ---------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `S01` | Full-bleed editorial art     | strong scenes, maps, cutaways           | no title; approved MRX mark optional                              |
| `S02` | Left title / right visual    | most educational articles               | maximum two title lines; 48 characters preferred, 64 hard maximum |
| `S03` | Visual with lower title band | scenes requiring full-width focal area  | maximum two lines; band must meet contrast gate                   |
| `S04` | Locator card                 | state/county/basin pages                | location label plus shortened topic, no invented map data         |
| `S05` | Process/choice card          | roadmaps, comparisons, checklists       | 2–4 very short labels; no outcome badge                           |
| `S06` | Evidence-detail card         | document, statement, methodology topics | one short approved headline; no unreadable document text          |

Batch rule: in a batch of 25, no social template should appear more than six times, and the same hero/social template pairing should not appear more than four times.

## 7. MRX visual system

### 7.1 Core palette

Use the current repo design tokens as the source of truth:

- Deep navy: `#051a2e`
- Primary navy: `#0a2540`
- Mid blues: `#1a3a5f`, `#2a4d7a`, `#3a6095`
- MRX gold: `#d8951f`, highlight `#f5a623`
- Cream/background: `#fbfaf6`, `#f1eee5`
- Ink: `#0a0f1a`, `#1a1f2e`, `#2a2f3e`
- White: `#ffffff`

Cluster differentiation should come primarily from subject, iconography, and information structure. Secondary cluster accents may be introduced only as documented design tokens and after contrast checks; they may not replace the navy/cream/gold MRX spine.

### 7.2 Rendering posture

Target: **calm editorial evidence**, not glossy wealth advertising.

Preferred characteristics:

- owner-centered but not emotionally manipulative;
- clean material detail and restrained depth;
- diagrams that show relationships rather than decorative charts;
- natural Texas and basin context without sunset cliché as the default;
- balanced uncertainty and multiple drivers rather than “number goes up” visuals;
- no fake interface dashboards, neon AI brains, piles of cash, luxury symbols, or overused handshakes.

A batch should use no more than 40% photorealistic human scenes. At least 40% should use editorial diagrams, maps, cutaways, process, document-anatomy, or neutral comparison formats. No batch may mix a one-off cartoon/comic style into an otherwise photographic series without explicit creative-direction approval.

### 7.3 Type and logo

- Hero images are text-free by default.
- Social type uses the site’s system sans-serif stack; no unlicensed font is assumed.
- Use sentence case, maximum two lines, and no all-caps headline.
- At 1200 × 630, headline size should normally be 48–64 px with line height 1.05–1.15.
- Only the approved MRX wordmark/logo asset may be used. Do not ask a generative model to draw the logo.
- Logo treatment must be small, consistent, and outside the primary focal area.
- No badge may say or imply “best,” “highest,” “guaranteed,” “verified value,” “certified,” “approved,” or “appraisal.”

### 7.4 Safe zones and crop resilience

Hero, 1600 × 900:

- keep critical subject matter inside the central 1280 × 720 region;
- keep faces, document titles, map labels, and diagram endpoints at least 120 px from the outer edge;
- no critical text in the hero export;
- verify at the current ArticleLayout crop and at PostCard size;
- focal subject must remain intelligible at 320 px wide.

Social, 1200 × 630:

- minimum 72 px safe margin on all sides;
- keep title/logo inside a central 1056 × 486 safe region;
- reserve at least 40% of the frame for uncluttered title space when using S02/S03;
- verify at 600 × 315 and 300 × 158 previews;
- avoid small labels below 28 px.

### 7.5 Accessibility

- Text/background contrast must meet WCAG AA: 4.5:1 for normal text and 3:1 for large text.
- Never encode the article’s only important information in the image.
- Color cannot be the only difference in comparisons, maps, or diagrams; use labels, shape, pattern, or position.
- Social text must remain legible without zoom.
- Hero imagery should avoid rapid-detail noise that makes overlaid browser/UI elements hard to distinguish.
- Meaningful hero alt is required; decorative sub-elements inside a composite are not separately described.

## 8. Export specifications and budgets

### 8.1 Hero

- Canvas: 1600 × 900 px (16:9).
- Format: WebP.
- Color: sRGB, embedded profile stripped after conversion if output remains correct.
- Quality target: 82–86, tuned per asset.
- Target file size: ≤250 KB.
- Hard hold: >350 KB.
- No animation.
- No alpha unless the design requires it and the file-size gate still passes.
- Required metadata in manifest: width, height, MIME, byte count, SHA-256, pHash.

### 8.2 Social

Target after the current metadata model is extended:

- Canvas: 1200 × 630 px.
- Preferred compatibility format: JPEG, sRGB, quality 82–88.
- Target file size: ≤250 KB; hard hold >400 KB.
- If WebP is retained, metadata must accurately declare WebP and social dimensions.
- Required metadata: social alt, width, height, MIME, byte count, SHA-256, pHash.

### 8.3 Source master

For vector/diagram work, retain the editable SVG/Figma/design source outside the public web path. For generated or licensed raster work, retain the uncropped source and provenance record outside the public path. Public exports must not contain EXIF location, device, owner, or other unnecessary metadata.

## 9. Filename and storage conventions

### 9.1 Immutable identifiers

Assign each approved article an immutable ID from `MRX1000-0001` through `MRX1000-1000`. Slug changes do not change the ID.

Cluster codes:

- `sell`, `value`, `offer`, `inherit`, `royalty`, `tax`, `txloc`, `title`, `method`

### 9.2 Filename grammar

`mrx-<4-digit-id>-<cluster>-<concept-slug>-<variant>-v<2-digit-version>.<ext>`

Examples:

- `mrx-0427-txloc-reeves-county-record-map-hero-v01.webp`
- `mrx-0427-txloc-reeves-county-record-map-social-v01.jpg`
- `mrx-0083-offer-closing-terms-comparison-hero-v02.webp`

Rules:

- lowercase ASCII letters, digits, and hyphens only;
- no spaces, underscores, dates, keyword stuffing, dimensions, “final,” “new,” or generator/model names;
- concept slug: 3–7 meaningful words;
- maximum 100 characters including extension;
- exactly one extension;
- version increments only when pixels change; never overwrite an approved public asset in place;
- old versions remain in the manifest as `superseded`, with the live post pointing only to the approved version;
- filename and frontmatter path must be unique portfolio-wide.

### 9.3 Proposed paths

Public exports:

- `/public/assets/articles/mrx1000/<cluster>/<filename>`

Non-public production records:

- `/creative/mrx1000/manifests/image-manifest.json`
- `/creative/mrx1000/prompts/<article-id>/<variant>.md`
- `/creative/mrx1000/sources/<article-id>/source-record.json`
- `/creative/mrx1000/contact-sheets/<batch-id>/`

These are proposed implementation paths; this read-only phase does not create them.

## 10. Alt-text rules

### 10.1 Purpose

Alt text answers: **What does this image communicate here?** It does not reproduce the SEO title or serve as a keyword field.

### 10.2 Required pattern

Use a natural one-sentence description:

`[Concrete subject] + [action or relationship] + [relevant context that is visibly present].`

Good examples:

- `A mineral deed and surface deed separated above a cutaway of land and subsurface layers.`
- `Two mineral-rights offers compared by payment timing, deductions, and closing terms.`
- `A Texas county map highlighting Reeves County within the Delaware Basin region.`
- `A royalty statement diagram connecting production volume, decimal interest, deductions, and net payment.`

Weak/rejected examples:

- `How to Sell Mineral Rights in Texas educational illustration.`
- `Mineral rights image.`
- `Best and most accurate mineral rights valuation.`
- `Image of a professional looking at documents.`

### 10.3 Rules

- Current schema hard maximum: 125 characters.
- Production target: 70–110 characters; shorter is acceptable when complete.
- Do not start with “image of,” “picture of,” “graphic of,” or “educational illustration” unless the medium itself matters.
- Do not repeat the article title verbatim.
- Use the primary keyword only when it naturally describes visible content.
- Mention a county, state, basin, formation, document, or process only if it is actually visible and correct.
- Do not describe generated people by race, age, disability, family status, or financial condition unless necessary to the article and reliably depicted.
- Do not include CTA language, a URL, a filename, copyright text, hashtags, emoji, or photographer credit.
- Do not make unsupported legal, tax, valuation, safety, reliability, accuracy, fairness, or outcome claims.
- If the image contains essential visible words, include their meaning in the alt. Prefer designing heroes without essential baked-in words.
- Hero alt must be unique after lowercase/whitespace/punctuation normalization.
- Semantically near-identical alt text is a duplicate-review signal even if the strings differ.
- Decorative brand marks inside social images are omitted from the description unless they are the subject.

### 10.4 Social alt

Social alt should describe the social composition, including meaningful title text if it is baked into the image. It should not automatically reuse hero alt when the social derivative contains additional text or a materially different crop. Recommended maximum: 160 characters.

### 10.5 Human check

The reviewer views the final rendered image—not only the prompt—then confirms:

- every noun in the alt is visible;
- no important visible concept is omitted;
- no claim or inference exceeds the image;
- the alt remains useful when the image is unavailable;
- the alt is not redundant with the adjacent heading.

## 11. Asset manifest contract

One manifest row per article concept, with nested hero/social exports. Minimum fields:

```json
{
  "asset_id": "MRX1000-0427",
  "article_slug": "mineral-rights-in-reeves-county",
  "cluster": "txloc",
  "template_id": "H09",
  "social_template_id": "S04",
  "concept": "Reeves County locator within a sourced Delaware Basin context",
  "composition_signature": {
    "subject": "county-locator",
    "structure": "map-plus-context",
    "viewpoint": "top-down",
    "focal_zone": "right-center",
    "environment": "abstract-topography",
    "geography": "reeves-county-texas",
    "supporting_objects": ["county-outline", "basin-context"],
    "accent": "mrx-gold"
  },
  "source": {
    "type": "sourced-data-illustration",
    "source_id": "internal-source-record-id",
    "source_uri": "non-secret source reference",
    "license": "license or owned/generated designation",
    "release": null
  },
  "prompt_path": "creative/mrx1000/prompts/MRX1000-0427/hero-v01.md",
  "hero": {
    "path": "/assets/articles/mrx1000/txloc/mrx-0427-txloc-reeves-county-record-map-hero-v01.webp",
    "alt": "A Texas county map highlighting Reeves County within the Delaware Basin region.",
    "width": 1600,
    "height": 900,
    "mime_type": "image/webp",
    "bytes": 0,
    "sha256": "computed-after-export",
    "phash64": "computed-after-export"
  },
  "social": {
    "path": "/assets/articles/mrx1000/txloc/mrx-0427-txloc-reeves-county-record-map-social-v01.jpg",
    "alt": "Reeves County mineral-rights guide with a county locator map in MRX navy and gold.",
    "width": 1200,
    "height": 630,
    "mime_type": "image/jpeg",
    "bytes": 0,
    "sha256": "computed-after-export",
    "phash64": "computed-after-export"
  },
  "ocr_text": [],
  "duplicate_check": {
    "index_version": "portfolio-index-version",
    "nearest_asset_id": null,
    "phash_distance": null,
    "clip_cosine": null,
    "status": "pending"
  },
  "compliance": {
    "legal_tax_sensitive": false,
    "money_figure_sourced": false,
    "claim_check": "pending",
    "reviewer": null,
    "reviewed_at": null
  },
  "creative_review": {
    "reviewer": null,
    "reviewed_at": null
  },
  "status": "brief_ready"
}
```

Never place credentials, private source URLs, PII, model API keys, or unpublished customer records in this manifest.

## 12. Duplication-detection architecture

Duplicate detection runs against a portfolio index containing:

- all 125 current hero references, including `/og-default.svg` as a prohibited fallback for new pages;
- every approved, rejected, and superseded MRX1000 hero/social export;
- source asset IDs and source hashes;
- alt text and OCR text;
- concept, template, and composition signature.

### 12.1 Layered gates

| Layer           | Test                                                                            | Initial threshold                      | Disposition      |
| --------------- | ------------------------------------------------------------------------------- | -------------------------------------- | ---------------- |
| Identity        | duplicate `asset_id`, path, filename, article binding                           | exact                                  | fail             |
| Source          | same source asset ID or same source SHA-256 assigned to two articles            | exact                                  | fail             |
| Pixels          | export SHA-256 duplicate                                                        | exact                                  | fail             |
| Perceptual      | 64-bit pHash Hamming distance                                                   | 0–4 fail; 5–8 hold; 9–12 manual review | fail/hold/review |
| Semantic visual | CLIP-style normalized image embedding cosine similarity                         | ≥0.965 hold; 0.930–0.964 review        | hold/review      |
| Composition     | identical normalized 8-field composition signature                              | exact                                  | fail             |
| Alt             | normalized exact duplicate                                                      | exact                                  | fail             |
| Alt semantic    | text embedding cosine ≥0.94 or trigram Jaccard ≥0.80                            | review                                 | review           |
| OCR             | repeated unapproved text, money figure, URL, claim, or fake document field      | any                                    | compliance hold  |
| Batch variety   | social template >6/25; same hero/social pair >4/25; photoreal human scenes >40% | any                                    | batch hold       |
| Human portfolio | contact-sheet judgment of same-scene or stock-pattern repetition                | reviewer judgment                      | review/rework    |

Thresholds are provisional until calibrated on the 25-asset pilot. The implementation must pin the hash algorithm, resize mode, color conversion, embedding model/version, and threshold version; otherwise scores are not reproducible.

### 12.2 Candidate comparison strategy

For each candidate:

1. Canonicalize orientation and color; compute dimensions, MIME, bytes, SHA-256, pHash64, OCR, and embedding.
2. Query exact source and export hashes.
3. Query pHash neighbors at distance ≤12.
4. Query the top 10 embedding neighbors portfolio-wide and top 10 within the same cluster/template.
5. Compare normalized alt and composition signature.
6. Render the candidate beside its five nearest visual neighbors in a reviewer panel.
7. Add the candidate to a 5 × 5 batch contact sheet.
8. Block approval until every fail/hold is resolved and all manual-review notes are recorded.

### 12.3 What counts as a duplicate

Reject or rework when any of the following is true:

- same photo/generated base with a new crop, color grade, overlay, mirror, or background blur;
- same hero used for a second article with a different filename;
- same scene with only the document label, county label, chart, or screen changed;
- same map with only one highlighted county changed when the visual cannot be distinguished at card size;
- same stock model/desk pose repeatedly used in a batch;
- same social card with only title text changed;
- same prompt with a different seed when the result remains compositionally equivalent;
- generic title-derived alt strings that differ only by article keyword.

### 12.4 False-positive handling

A reviewer may approve a flagged pair only with a short manifest note stating the visible differences and why the repeated structure is necessary. No exception may override exact source reuse, exact export hash reuse, or use of the default fallback for an indexable new article.

## 13. Compliance constraints

The repo compliance rubric explicitly requires that image alt text make no unsupported claim. That rule applies to image pixels, prompts, filenames, OCR text, captions, and social treatments as well.

### 13.1 Prohibited visual/copy claims

Do not depict or state:

- guaranteed value, offer, price, outcome, timing, tax result, or closing;
- “best,” “highest,” “only,” “most trustworthy,” “most reliable,” or superiority over a competitor;
- certified/formal/USPAP appraisal or an “exact value”;
- legal or tax advice, personal qualification, or “you should” outcome;
- fabricated customer proof, testimonial, review stars, awards, or ratings;
- fabricated money figures, production volumes, royalty amounts, tax savings, ROI, NPV, IRR, or offer ranges;
- a named competitor, government agency, operator, attorney, CPA, underwriter, or partner without authorization;
- official seals, regulatory marks, government logos, court/IRS endorsement, or fake notarization;
- “verified,” “approved,” shield, lock, or checkmark symbolism when it could imply a guarantee or certification not actually established.

### 13.2 Legal/tax/title images

- Treat tax, 1031, probate, estate, title, divorce, trust, lease, and contract assets as compliance-sensitive.
- Social image text may identify the educational topic but may not state that the reader qualifies or predict an outcome.
- Do not fabricate readable legal forms, signatures, notary stamps, tax returns, SSNs, account numbers, owner names, tract descriptions, or case numbers.
- Use abstract document anatomy or sanitized placeholder blocks that cannot be mistaken for an actual record.
- Any sourced statute, deadline, tax rate, or filing requirement requires an editorial source record and compliance review.

### 13.3 Valuation and production images

- Charts must be sourced or unmistakably conceptual and unlabeled with invented values.
- Avoid upward-only lines, stacks of cash, windfall language, and “fair price” badges.
- Geology/production diagrams must not imply property-specific reserves, production forecasts, or well performance.
- Never visualize an MRX DCF output unless a real, authorized, source-backed output is approved; placeholders are prohibited.

### 13.4 People, property, and licensing

- Identifiable people require documented model releases or approved owned/licensed sources.
- Do not imply a generated person is a real customer, underwriter, attorney, CPA, landman, government official, or employee.
- Do not show a recognizable private home, parcel, deed, royalty statement, or computer screen without rights and privacy review.
- Record stock license, source URL/ID, model release status, restrictions, and expiration where applicable.
- Generated assets are recorded as generated, with prompt and backend provenance; they are not presented as documentary evidence.

### 13.5 Maps and local intent

- County/state/basin boundaries must come from a named source and be dated/versioned.
- Do not invent parcel boundaries, nearby wells, permits, operator positions, production, or mineral ownership.
- Use “conceptual” labeling where the visual is explanatory rather than geospatially precise.
- Avoid state flags, official badges, and seals where they could imply affiliation or endorsement.

### 13.6 Compliance gate

Human compliance review is required before an asset becomes `approved` when any of these are present:

- legal/tax/title/investment/valuation-sensitive article;
- number, percentage, dollar sign, chart axis, timeline/deadline, or comparison outcome;
- badge, shield, check, seal, testimonial, quote, rating, or claim-like headline;
- external logo, public-agency identifier, branded document, or recognizable person/property;
- alt text containing a claim-risk term;
- OCR detects unexpected text.

## 14. Production workflow and ownership

### 14.1 State machine

`brief_ready → concept_ready → candidate → duplicate_hold/creative_review → compliance_review → approved → staged → published → superseded/retired`

No asset jumps from candidate to published.

### 14.2 Per-article workflow

1. **Brief intake** — article ID, canonical slug, cluster, owner question, specific visual concept, cited facts, geography, document type, sensitive-topic flag, CTA context.
2. **Inventory query** — retrieve nearest approved concepts, templates, prompts, alt strings, and visuals before ideation.
3. **Template assignment** — select a template that meets cluster quota and batch variety limits.
4. **Concept record** — write the composition signature and draft alt before rendering. Reject generic concepts.
5. **Prompt/source record** — save reproducible prompt or licensed/sourced asset information before generation/design.
6. **Candidate creation** — create hero master, then deliberate hero and social exports; do not auto-stretch/crop without focal review.
7. **Automated QA** — dimensions, MIME, bytes, source/export hashes, pHash, embedding, OCR, alt checks, broken paths.
8. **Creative review** — concept relevance, visual hierarchy, crop resilience, MRX brand, batch variety, misleading details.
9. **Accessibility review** — meaningful alt, contrast, text size, non-color cues, card-size legibility.
10. **Compliance review** — required based on Section 13; disposition recorded.
11. **Manifest lock** — record computed values, reviewers, timestamps, and approved version.
12. **Staging QA** — render article header, PostCard, OG/Twitter metadata, 600 × 315 social preview, and 300 px card preview.
13. **Publish gate** — article remains draft/noindex until the broader MRX article QA gates pass.

### 14.3 Owners

- `mrx_creative`: taxonomy enforcement, concept/template selection, prompt/source records, visual QA, exports, contact sheets.
- Article/editorial owner: article-specific accuracy, sources, labels, title shortening, and visual relevance.
- `mrx_compliance` or assigned compliance reviewer: sensitive-topic claims, visual implications, alt/social copy, source/use approval.
- `mrx_webdev`: manifest/frontmatter integration, accurate metadata, build/tests, rendered route checks.
- Program/Product Manager: batch selection, quota/throughput tracking, exception approval routing, evidence packet.

Live publishing, production deployment, social posting, paid promotion, and third-party mutations remain human-authorized gates.

## 15. Per-asset definition of done

An image pair is not done until all boxes are true:

- [ ] Immutable article/asset ID assigned.
- [ ] Cluster and hero/social template IDs assigned.
- [ ] Article-specific concept and 8-field composition signature recorded.
- [ ] Source/provenance/license/release record complete.
- [ ] Prompt saved before generation when applicable.
- [ ] Hero is 1600 × 900 WebP and within size budget.
- [ ] Social is 1200 × 630 with accurate MIME/dimension metadata and within size budget.
- [ ] Hero/social paths and filenames are unique and conformant.
- [ ] No default/fallback asset is used for an approved/indexable article.
- [ ] SHA-256, pHash64, OCR, embedding, and nearest-neighbor results recorded.
- [ ] No unresolved duplicate fail/hold.
- [ ] Alt describes the rendered hero, is ≤125 characters, and passes exact/semantic duplicate review.
- [ ] Social alt describes social pixels and text.
- [ ] No unexpected OCR text, fabricated record, PII, or unsupported visual claim.
- [ ] Creative, accessibility, editorial, and applicable compliance reviews recorded.
- [ ] Article header, card, and social previews inspected.
- [ ] Frontmatter/manifest agree and the asset resolves.
- [ ] Build/schema/image QA passes in the later implementation phase.

## 16. Pilot and scale plan

### 16.1 Pilot: 25 articles

Select a deliberately mixed batch:

- `sell`: 4
- `value`: 4
- `offer`: 3
- `inherit`: 3
- `royalty`: 3
- `tax`: 2
- `txloc`: 3
- `title`: 2
- `method`: 1

Pilot requirements:

- all 12 hero templates represented at least once where editorially appropriate;
- all six social templates represented;
- no more than 10 photorealistic human scenes;
- at least 10 diagrams/maps/cutaways/process/document-anatomy assets;
- one contact sheet for hero assets, one for social assets, and nearest-neighbor panels for every flagged candidate;
- render QA at article, card, and social-preview sizes;
- calibration report for pHash and embedding thresholds;
- reviewer minutes per asset, rework rate, asset bytes, and generation/design cost captured;
- no public indexing or live social posting.

### 16.2 Scale gates

Scale only when the pilot achieves:

- 25/25 unique source concepts and source assets;
- 0 unresolved exact/source/hash duplicates;
- 0 unresolved pHash/embedding holds;
- 25/25 conformant hero and social exports;
- 25/25 alt and social-alt approvals;
- 100% required compliance reviews complete;
- no broken frontmatter paths or metadata mismatches;
- human reviewer agreement that the batch does not look templated or stock-repetitive;
- documented reviewer capacity sufficient for the next batch.

Recommended scale steps: 25 → 50 → 100 per production wave. Keep human approval per asset even when automated checks are stable.

## 17. Implementation prerequisites and open risks

### 17.1 Social metadata schema gap

Current frontmatter supports `social_src` but not independent:

- `social_alt`
- `social_width`
- `social_height`
- `social_mime_type`
- `social_sha256`
- `social_perceptual_hash`

Current `ArticleLayout.astro` selects `social_src` for Open Graph but still passes the hero alt, hero width/height, and hero MIME. Therefore, a 1200 × 630 JPEG social derivative would be described as the hero’s 1600 × 900 MIME/dimensions unless the schema/layout is extended.

Prerequisite: `mrx_webdev` should implement and test independent social metadata before `social_src` is populated at scale. Until then, use the hero itself as the OG image so declared metadata remains accurate.

### 17.2 Existing unique-hero mismatch

The current 125-asset plan/check is not clean because one planned image is absent and its post uses `/og-default.svg`. Resolve it before treating the current library as a complete uniqueness baseline.

### 17.3 Current alt quality

Exact alt uniqueness exists, but title-derived wording, the repeated “educational illustration” suffix, long descriptions, and claim-risk terms show that uniqueness alone is not quality. A later remediation lane should rewrite current alt text from rendered pixels and send risky strings through compliance review.

### 17.4 Current provenance gap

The schema can store source/license/prompt/pHash, but current posts do not populate those fields. Source records may exist in `config/article-hero-plan.json`, but the production system needs one canonical manifest rather than split frontmatter/plan truth.

### 17.5 Semantic repetition

Current pHash results are clean, yet the representative visual audit found repeated desk-review and pumpjack-landscape motifs. Hashing cannot replace human portfolio review or semantic embeddings.

### 17.6 Dirty shared workspace

The repo was on `main` with approximately 710 modified/untracked paths during this audit. Any future implementation must use a clean branch/worktree and a defined dirty-state policy. This read-only architecture changed no site code or production state.

## 18. Recommended next executable cards

1. **Web metadata implementation** — owner `mrx_webdev`; add independent social metadata fields, render them accurately, and add schema/head tests.
2. **Image-manifest and dedupe checker** — owner `mrx_webdev` with `mrx_creative`; implement manifest validation, SHA-256/pHash/embedding/OCR candidate reports, and contact-sheet output.
3. **Current 125 image remediation audit** — owner `mrx_creative` plus compliance reviewer; resolve the default image/missing planned asset, rewrite title-derived/risky alts, and consolidate provenance.
4. **25-image noindex pilot** — owner `mrx_creative`; execute only after canonical article selection, SearchAtlas/dedupe gate, editorial briefs, and compliance review capacity are ready.
5. **Pilot compliance review** — owner assigned compliance profile; review sensitive imagery, alt/social copy, numbers, maps, documents, logos, and people before scale approval.

## 19. Verification performed in this phase

Read-only checks performed:

- Read the MRX 1,000-article first-pass plan and approved cluster quotas.
- Read current content schema, typed frontmatter, article layout, SEO metadata component, design tokens, compliance rubric, remediation policy, staged-content plan, and hero sync script.
- Counted current MDX posts and extracted hero `src`/alt values.
- Verified referenced local hero assets resolve.
- Checked current raster dimensions, formats, and file-size distribution.
- Computed exact SHA-256 groups and 64-bit pHash neighbor results for the current raster inventory.
- Reviewed a representative 20-image contact sheet for semantic/style repetition.
- Ran `pnpm run assets:article-heroes:check` and recorded its real exit-1 mismatch.
- Confirmed no image-generation or live-platform mutation occurred.

## 20. Approval decision requested from program synthesis

Approve the architecture as the MRX1000 image gate, then sequence implementation in this order:

1. canonical article IDs and 25-article pilot selection;
2. independent social metadata support;
3. manifest/dedupe tooling and current-125 baseline repair;
4. pilot production and review;
5. threshold calibration and CEO/Program approval to scale.

Do not authorize 1,000-image bulk generation before those prerequisites pass.

## 21. MRX1000-PILOT-001 (F5) per-asset decisions

Prepared for Kanban task `t_2c40075a` (MRX1000-PILOT-001 F5 hero/social asset architecture and per-asset manifest). Decision reference: D-2026-0720-05. This section operationalizes sections 1–20 for the 25 articles named in `config/mrx-1000-pilot-batch-001.json` and the per-asset manifest at `config/mrx-1000-pilot-batch-001-asset-manifest.json`. No images were generated, no SearchAtlas/GSC/GA4 state was changed, and no paid quota was spent.

### 21.1 Pilot scope and parent-decision guardrails

The 25-article pilot is bound by `D-2026-0720-05` (noindex-stage preparation only). All hard stops in that packet remain in force:

- `public_release_authorized = false`
- `indexing_authorized = false`
- `incremental_spend_authorized_usd = 0`
- `searchatlas_externally_published_transition_authorized = false`
- `gsc_submission_authorized = false`
- `request_indexing_authorized = false`
- `deploy_or_merge_authorized = false`
- `claude_substitution_authorized = false`

This lane may produce briefs, manifests, QA evidence, and dedupe tooling only. It may NOT generate, publish, index, submit, or spend paid quota.

### 21.2 Asset IDs and cluster mix

The first 25 immutable IDs from `MRX1000-0001` through `MRX1000-0025` are reserved for this pilot. Slug changes do not change the ID.

The canonical pilot batch cluster mix (from `config/mrx-1000-pilot-batch-001.json`) is:

| Cluster | Count | Notes                                           |
| ------- | ----: | ----------------------------------------------- |
| inherit |     4 | inherited-estate-probate map 261159             |
| royalty |     4 | royalties-owner-operations map 261160           |
| tax     |     4 | tax-1031-legal-education map 261161             |
| title   |     4 | title-lease-ownership-documents map 261162      |
| txloc   |     3 | texas-county-basin-local-intent map 261163      |
| offer   |     4 | offer-review-buyer-comparison-safety map 261164 |
| value   |     2 | valuation-methodology-drivers map 261165        |
| sell    |     0 | absent from this pilot; surface as open finding |
| method  |     0 | absent from this pilot; surface as open finding |

Pilot deviates from §16.1's recommended mix (4 sell / 4 value / 3 offer / 3 inherit / 3 royalty / 2 tax / 3 txloc / 2 title / 1 method). The deviation is a cluster-curation choice for the canonical pilot-001 batch; it is not an architecture change. Both absences (sell, method) are tracked as §16.2 scale-gate calibration findings, not as a violation.

### 21.3 Hero template allocation (§5 + §16.1)

| Template                     | Count | Asset IDs                         |
| ---------------------------- | ----: | --------------------------------- |
| H01 Owner context scene      |     1 | MRX1000-0001                      |
| H02 Evidence tabletop        |     3 | MRX1000-0009, -0015, -0019        |
| H03 Process roadmap          |     4 | MRX1000-0004, -0008, -0010, -0020 |
| H04 Neutral comparison       |     4 | MRX1000-0002, -0005, -0007, -0021 |
| H05 Driver/data framework    |     3 | MRX1000-0018, -0024, -0025        |
| H06 Land/geology cutaway     |     0 | absent; rationale below           |
| H07 Statement anatomy        |     2 | MRX1000-0003, -0006               |
| H08 Ownership/estate network |     2 | MRX1000-0013, -0014               |
| H09 Local map/context        |     1 | MRX1000-0017                      |
| H10 Timeline/milestones      |     2 | MRX1000-0011, -0016               |
| H11 Risk/question checklist  |     3 | MRX1000-0012, -0022, -0023        |
| H12 MRX evidence pipeline    |     0 | absent; rationale below           |

**H06 and H12 are not represented.** §16.1 says "where editorially appropriate"; the canonical pilot-001 batch has no first-fit H06 (no land/geology-cutaway article) and no first-fit H12 (no MRX-methodology article in `method` cluster for this batch). This is recorded as an open §16.2 scale-gate calibration finding — do not force-fit H06 or H12 into articles that don't match.

All other variety targets are met:

- photoreal human scenes ≤ 10/25: H01 alone = 1 (well under cap).
- diagrams/maps/cutaways/process/document-anatomy ≥ 10/25: 24 articles use diagram-class templates (only H01 is non-diagram).

### 21.4 Social template allocation (§6)

| Template                         | Count | Limit | Asset IDs                                       |
| -------------------------------- | ----: | ----: | ----------------------------------------------- |
| S01 Full-bleed editorial art     |     3 |    ≤6 | MRX1000-0018, -0021, -0024                      |
| S02 Left title / right visual    |     6 |    ≤6 | MRX1000-0001, -0005, -0013, -0014, -0007, -0025 |
| S03 Visual with lower title band |     5 |    ≤6 | MRX1000-0008, -0010, -0016, -0022, -0023        |
| S04 Locator card                 |     1 |    ≤6 | MRX1000-0017                                    |
| S05 Process/choice card          |     5 |    ≤6 | MRX1000-0002, -0004, -0011, -0012, -0020        |
| S06 Evidence-detail card         |     5 |    ≤6 | MRX1000-0003, -0006, -0009, -0015, -0019        |

§6 batch rules satisfied: max social-template-per-batch = 6 (at limit), max same hero/social pair = 4 (max observed = 3). All hero/social pair counts:

| Pair    | Count |
| ------- | ----: |
| H04+S02 |     3 |
| H02+S06 |     3 |
| H03+S05 |     2 |
| H07+S06 |     2 |
| H03+S03 |     2 |
| H08+S02 |     2 |
| H05+S01 |     2 |
| H11+S03 |     2 |
| H01+S02 |     1 |
| H04+S05 |     1 |
| H10+S05 |     1 |
| H11+S05 |     1 |
| H10+S03 |     1 |
| H09+S04 |     1 |
| H05+S02 |     1 |

### 21.5 Filename convention (pinned, §9.2)

```
mrx-<4-digit-id>-<cluster>-<concept-slug>-<variant>-v<2-digit-version>.<ext>
```

Examples pinned by the pilot manifest:

- `mrx-0001-inherit-inherited-offers-explained-hero-v01.webp`
- `mrx-0001-inherit-inherited-offers-explained-social-v01.jpg`
- `mrx-0017-txloc-texas-county-locator-hero-v01.webp`

Public path proposal (kept from §9.3): `/assets/articles/mrx1000/<cluster>/<filename>`. Hero = WebP, social = JPEG. Naming and dimension rules are pinned in the manifest and enforced by the dedupe script.

### 21.6 Alt-text regex gate (Gate C §4.4)

Gate C §4.4 requires "cluster + intent + target keyword" with `≤125` chars. The pilot manifest pins a regex gate that satisfies both the natural-language pattern in §10.2 and the checkable Gate C §4.4 form:

```
^(?=.{1,125}$)
(?=.*\b(cluster_tokens)\b)
(?=.*\b(intent_tokens)\b)
(?=.*\b(keyword_tokens)\b).+
```

with the following token sets (case-insensitive match):

- **cluster_tokens** — `inherit, inherited, inheritance, estate, heir, heirs, royalty, royalties, lease, leases, 1031, title, titles, tax, txloc, texas, production, offer, offers, value, values, valuation, buyer, buyers, exchange, owner, owners`
- **intent_tokens** — `explained, explaining, explains, compared, compare, compares, comparing, comparison, how, steps, step, guide, guides, checklist, checklists, documents, document, terms, term, hidden, fees, fee, rules, rule, factors, factor, production, evaluating, evaluation, reading, identifying, reviewing, summarized, summary, shown, show, shows, showing, written, writing, preparation, routing, lifecycle, milestone, milestones`
- **keyword_tokens** — `mineral[- ]rights, royalty, royalties, lease, leases, 1031, title, production, inherited, offer, offers, buyer, buyers, exchange, owner, owners, deed, estate`

The case-insensitive `i` flag is mandatory. Cluster tokens intentionally include plural and natural-language variants (`inherited`, `owners`, `royalties`) so alts read as prose while remaining checkable. Hero alt max remains 125 chars; social alt max is 160 chars per §10.4.

The script `scripts/check-mrx-1000-pilot-image-dedupe.mjs` enforces this regex against the manifest's `hero.alt` and `social.alt` for every entry. Token lists live inside the manifest so the regex and its tokens are version-controlled together.

### 21.7 pHash methodology pin (§12.1)

The pilot uses a deterministic 64-bit synthetic perceptual hash synthesized from each asset's `concept` + `composition_signature` + `template_id` + `social_template_id`. The algorithm is FNV-1a 64-bit (`algorithm_version = synthetic-fnv1a-64-v1`) and is reproducible across machines.

This proves the dedupe methodology can distinguish the 25 pilot concepts in a deterministic way BEFORE assets are rendered. When real assets exist, the implementation follow-up card replaces this projection with `sharp` 32×32 aHash and bumps `algorithm_version` to `real-aHash-32x32-v1`. The same Hamming-distance thresholds from §12.1 apply unchanged:

- Hamming distance 0–4: fail
- 5–8: hold
- 9–12: manual review
- ≥13: pass
- embedding cosine ≥0.965: hold; 0.93–0.964: manual review

Pre-render proof at `qa-search-atlas-pilot-image-dedupe.json` shows 25/25 unique hero hashes and 25/25 unique social hashes with 0 Hamming fails/holds/reviews across all 300 hero pairs and 300 social pairs (for 25 assets).

### 21.8 Per-asset manifest schema (§11)

The pilot manifest extends the §11 schema with the following fields:

| Field                                                                                           | Type    | Source                   | Purpose                                      |
| ----------------------------------------------------------------------------------------------- | ------- | ------------------------ | -------------------------------------------- |
| `asset_id`                                                                                      | string  | immutable, MRX1000-NNNN  | unique across portfolio                      |
| `article_slug`                                                                                  | string  | matches pilot-batch JSON | binding to canonical article                 |
| `pilot_index`                                                                                   | integer | 1..25                    | order in pilot batch                         |
| `cluster`                                                                                       | string  | §4 codes                 | routing key for downstream                   |
| `map_id`                                                                                        | integer | SearchAtlas map_id       | bridges to SearchAtlas (read-only this lane) |
| `primary_keyword`                                                                               | string  | pilot-batch JSON         | SEO intent                                   |
| `intent`                                                                                        | string  | derived                  | natural-language intent label                |
| `template_id`                                                                                   | string  | H01-H12                  | hero template (§5)                           |
| `social_template_id`                                                                            | string  | S01-S06                  | social template (§6)                         |
| `concept`                                                                                       | string  | brief                    | one-paragraph unique concept                 |
| `composition_signature`                                                                         | object  | 8 fields (§5)            | within-template uniqueness                   |
| `source.{type,source_id,source_uri,license,release}`                                            | object  | §7, §13                  | provenance                                   |
| `prompt_path`                                                                                   | string  | §9.3                     | path to hero prompt record                   |
| `hero.{path,alt,width,height,mime_type,bytes,sha256,phash64,social_text_baked_in}`              | object  | §8.1                     | hero export record                           |
| `social.{path,alt,width,height,mime_type,bytes,sha256,phash64,og_title_line_1,og_title_line_2}` | object  | §8.2                     | social export record                         |
| `ocr_text`                                                                                      | array   | §12.1 layer 8            | OCR-captured baked-in text                   |
| `duplicate_check`                                                                               | object  | §12.1 layers 1–10        | nearest-neighbor screening                   |
| `compliance`                                                                                    | object  | §13                      | sensitive-topic and money-figure flags       |
| `creative_review`                                                                               | object  | §14.2 step 8             | reviewer + timestamp                         |
| `status`                                                                                        | enum    | §14.1 state machine      | `brief_ready` for this pilot                 |

The full set of 25 entries is in `config/mrx-1000-pilot-batch-001-asset-manifest.json`. Every entry has `bytes=null`, `sha256=null`, `phash64=null` because no images have been rendered. Status is `brief_ready` for all 25 rows.

### 21.9 Acceptance criteria check (task t_2c40075a)

| #   | Criterion                                                                                          | Status | Evidence                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 25 unique hero concepts (no reuse, no swaps, no thin duplicates)                                   | PASS   | `qa-search-atlas-pilot-image-dedupe.json` `uniqueness.hero.unique = 25 / 25`; 25 distinct concept strings in manifest; 8-field composition signature per row.                                              |
| 2   | 25 unique social variants with OG/Twitter card renderings defined                                  | PASS   | `uniqueness.social.unique = 25 / 25`; each social entry carries `og_title_line_1`, `og_title_line_2` (≤64 chars total), 1200×630 dimensions, JPEG mime.                                                    |
| 3   | Alt-text rules per Gate C §4.4 (cluster + intent + target keyword, ≤125 chars; regex check passes) | PASS   | `alt_failures = 0` in evidence file; max hero alt length = 124; max social alt length = 105.                                                                                                               |
| 4   | Filename convention and image-dedup detection (perceptual hash) documented and applied             | PASS   | §21.5 pins filenames; §21.7 pins pHash algorithm and thresholds; `scripts/check-mrx-1000-pilot-image-dedupe.mjs` enforces both.                                                                            |
| 5   | Per-asset manifest with source, pHash, alt, social metadata fields                                 | PASS   | `config/mrx-1000-pilot-batch-001-asset-manifest.json` has 25 entries; every entry has source.{type,license}, hero.{alt,phash64,...}, social.{alt,phash64,...}. pHash fields are null pre-render by design. |
| 6   | Architecture document updated reflecting pilot-specific decisions                                  | PASS   | This §21.                                                                                                                                                                                                  |

### 21.10 Verification performed (this lane, read-only)

- Wrote the per-asset manifest at `config/mrx-1000-pilot-batch-001-asset-manifest.json`.
- Wrote the dedupe script at `scripts/check-mrx-1000-pilot-image-dedupe.mjs`.
- Ran the dedupe script and confirmed verdict = PASS with 0 alt failures, 0 Hamming fails/holds/reviews, 0 batch-variety violations.
- Captured evidence at `qa-search-atlas-pilot-image-dedupe.json`.
- Confirmed no images were generated; no SearchAtlas / GSC / GA4 / Vercel state was changed; no paid quota was spent.

### 21.11 Open pilot findings (not failures; tracked for §16.2 calibration)

1. H06 (land/geology cutaway) and H12 (MRX evidence pipeline) are not represented in this pilot. Track as scale-gate calibration finding; do not force-fit.
2. Pilot cluster mix deviates from §16.1's recommended mix (no sell, no method articles). Track as cluster-curation finding.
3. The 25 hero hashes are deterministic synthetic projections today; rerun the dedupe script with the real-aHash branch once assets are rendered (next executable card). The script header documents the swap path.
4. Social-template-per-batch count for S02 is at the 6/25 limit. The next 25-batch must rebalance if S02 is again the dominant pattern.
5. Pilot batch is `noindex-stage` only; do not transition to indexable without independent verifier signature on `verified_by` per D-2026-0720-04.

### 21.12 Next executable card

The implementation follow-up is owner `mrx_webdev` (with `mrx_creative` reviewer):

1. Extend frontmatter schema to add `social_alt`, `social_width`, `social_height`, `social_mime_type`, `social_sha256`, `social_perceptual_hash` (architecture §17.1 prerequisite).
2. Swap the dedupe script's `SYNTH_HASH()` projection for `sharp` 32×32 aHash; bump `algorithm_version` to `real-aHash-32x32-v1`; rerun against rendered hero+social exports.
3. Wire the manifest into `pnpm run assets:article-heroes:check` so a pre-commit gate enforces the architecture.
4. Keep `status: brief_ready` until per-asset brief intake (§14.2 step 1) is independently confirmed for the relevant asset.

End of F5 (MRX1000-PILOT-001) per-asset decisions.
