# MRX owner two-image retrofit authorization

Decision ID: D-2026-0811-17

- Status: **APPROVED — EFFECTIVE IMMEDIATELY; FAIL-CLOSED**
- Authority: Daryl owner directive issued 2026-08-11
- Scope: Existing public MRX articles and every remaining article in the MRX 1,000-article program

## Authorization

Every MRX article must use a unique canonical hero/share image with the exact canonical article title visibly rendered into its pixels and a distinct in-body image with the finalized page keyword or search phrase visibly rendered into its pixels. Each filename stem must be the deterministic lowercase kebab-case slug of the exact text rendered in that image.

This decision authorizes replacement and hash rebinding of existing MRX article image assets and the source-frontmatter bytes necessarily changed by that retrofit. It supersedes historical source-image and hero-image hash immutability only for the validated two-image retrofit. It does not change program-row identity, canonical slug, canonical title, body claims, citations, admission order, or production URL.

## Required evidence

The rebind is releasable only when all of the following pass:

1. The current two-image retrofit manifest covers all 99 public article routes.
2. Hero and in-body OCR pass for every route.
3. Hero/share identity, in-body distinctness, text/filename identity, dimensions, MIME, alt metadata, uniqueness, and local file existence pass.
4. The MRX1000 release asset comparison passes against the complete current article-image library without weakening duplicate thresholds.
5. Editorial, factual/citation, and compliance reviews are refreshed and hash-locked to the current article bytes.
6. Publication manifests and evidence packets are current and PASS.
7. Build, rendered HTML, metadata, social identity, live image responses, and all active production targets pass after deployment.

Historical admission decisions remain provenance evidence for identity and ordering. Their superseded article and hero hashes must not be used to reject a current row when this decision's complete replacement evidence passes.

## Continuous program rule

The same two-image requirements are hard release gates for every article created or materially revised through the 1,000-article program. Article count is not a release gate; article-specific quality evidence remains mandatory.
