# MRX Three-Summit Brand Application Report — 2026-08-31

## Outcome

The June-August 2026 Summit additions required MRX-specific brand work beyond the already active global AI Atom and shared-agent updates. The safe, non-overlapping actions are applied: MRX now has an approved, versioned Brand Context Pack; live Search Atlas generation instructions preserve the organizational author, directional-assessment and professional-advice limits, disclosed-buyer relationship, local-claim limits, exact-title hero/share policy, separate inline-image gate, and source-first release verification; and the LLM Visibility prompt denominator is explicitly versioned.

The run is partially complete because Search Atlas's existing 314-document Brand Vault index still answers the public-author question incorrectly. The generation settings are corrected, but the indexed Q&A corpus needs a source rebuild that the available API does not expose.

## Changes applied

1. Created `docs/brand-context/mrx-summit-2026/` with approved brand, claims, sources, account-readiness, and measurement records.
2. Passed the Summit playbook's strict Brand Context Pack validator.
3. Updated Brand Vault AI defaults to:
   - act as the MRX Editorial Team organizational publisher;
   - use the approved national owner audience and disclosed-buyer revenue model;
   - keep FAQ generation off and generic hero/inline generation off where MRX's exact-title and separate-image gates cannot be enforced;
   - include an organizational byline, source-first facts, answer-first structure, and humanization;
   - reject guarantees, appraisal/advice claims, marketplace positioning, fake local presence, unsupported proof, fabricated entities/schema, and outcome promises;
   - preserve approved article titles and the exact-title hero/share asset policy.
4. Upserted the same source-backed global background without triggering AI regeneration.
5. Updated OTTO's general, page-title, and meta-description refine instructions and wrote `MRX Editorial Team` into the authorship fields.
6. Audited the Search Atlas LLM Visibility project. Its fixed dashboard denominator is 18 topics and 49 queries. The core user-created segment is 13 topics/34 queries; the legacy auto-generated diagnostic segment is 5 topics/15 queries. No visibility result exists because `last_analysis_at` is empty.
7. Preserved the active article writer and made no changes to article content or assets.

## Verification and remaining defect

- Brand pack strict validation: pass.
- Brand Vault index: ready, 314 documents.
- Brand Vault settings write: accepted and echoed all applied settings.
- OTTO refine/authorship write: `success=true`, `sync_complete=true`.
- Narrow Brand Vault author test: fail—the indexed answer calls Tommy the approved author even though Tommy is a fictional AI guide and the approved author is MRX Editorial Team.
- Narrow Brand Vault location-limit test: incomplete—the answer recognizes nationwide education but does not retrieve the explicit limits on storefront, service area, licensed presence, LocalBusiness, or Google Business Profile claims.
- OTTO compact readback still displays an empty `authors` array despite the successful authorship-field write.

Search Atlas MCP does not expose a Brand Vault source rebuild. The authenticated Chrome path was attempted after the API gap was established, but the ChatGPT Chrome extension connection was unavailable even though Chrome and the extension are installed and enabled. Per the browser-control safety rules, no AppleScript, shell UI automation, alternate browser, forced AI regeneration, or source deletion was used.

## Deliberately not activated

- No bulk OTTO recommendations or deployment: the preceding verified OTTO state remains 2,515 total, 2,515 approved/deployed, and 0 pending.
- No public website deploy or Search Atlas recrawl: this run changed no public source.
- No paid media or distribution: no charge was authorized or needed.
- No Google Business Profile or LocalBusiness activation: eligibility and staffed-location/service-area facts remain unverified.
- No social auto-posting: no approved channel plan or connected-platform evidence warranted activation.
- No LLM Visibility analysis: the project has no recorded baseline, and a separately metered run was not needed to correct brand governance.

## Required follow-up

When the Chrome extension connection or a source-rebuild API is available, rebuild the Brand Vault indexed corpus without regenerating the approved profile, then rerun the narrow author and location-limit tests. Until that passes, use the versioned brand pack and the corrected generation settings as the approved source for new MRX work; do not trust Brand Vault Q&A for authorship.
