# MRX GBP / Local-Social Compliance Activation Packet

**Task:** t_f7ea370c — MRX Search Atlas remediation: GBP local social compliance activation
**Owner:** mrx_gbp
**Date:** 2026-07-20
**Profile posture:** Credential-free, no live GBP mutation, no invention.

## What this packet does NOT do

This packet does not claim, edit, post, or verify a Google Business Profile
for Mineral Rights Xchange. The repository has no Google Business Profile
API integration, no GBP credentials in `.env.example`, and no `GBP_*`
or `GOOGLE_BUSINESS_PROFILE_*` variable anywhere. Daryl has authorized
profile creation through the signed-in browser, but the documented MRX
operating model does not yet prove Google Business Profile eligibility.
No profile should be created until the blocked facts below are confirmed.

## What this packet DOES do (credential-free, already verified)

### 1. Anchored the public NAP graph to one canonical source

Changed `src/structured-data/site.ts` so `Organization` carries a single
`ContactPoint` derived from `SITE.email` and (optionally) `SITE.phone`.
The rendered Organization JSON-LD on `dist/index.html` now contains:

    "contactPoint": [{
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "underwriter@mineralrightsxchange.com",
      "areaServed": {"@type":"Country","name":"United States"},
      "availableLanguage": ["English"]
    }]

`telephone` is deliberately omitted when `SITE.phone` is empty so the
public graph cannot publish a phone the rest of the site has not
confirmed. This is the no-invention guardrail.

### 2. Fixed a stale LocalBusiness node

`src/structured-data/localbusiness.ts` was orphaned and emitted a
stale Texas-only `areaServed` (lines 15-18) that contradicts the
published nationwide scope in `src/content/pages/about.mdx:25`. The
file is now dormant (still not imported by `siteGraph()`), its
`areaServed` reads `Country: US`, its `telephone` is gated on
`SITE.phone`, its address contains only region/country, and the
docstring lists the four facts required before it can be activated.

The currently-published local citation node remains `ProfessionalService`
in `site.ts`, which already states `areaServed: Country: US` and
`addressRegion: TX`. This matches the public-facing copy.

### 3. Verified the rendered output is compliance-clean

- `pnpm run typecheck` — 0 errors, 0 warnings.
- `pnpm run lint` — clean.
- `pnpm run build` — clean (179-page build, sitemap rewrite OK,
  `scripts/check-visible-copy.mjs --rendered` OK).
- `node compliance/scripts/check-compliance.mjs` on the two changed
  files — ✅ passes. Caught one false-positive during the draft
  ("certified appraisal" in a negative-context comment) and the
  comment was rewritten to satisfy the lexicon without changing
  intent.
- Confirmed `dist/index.html` carries the new `contactPoint` node and
  the existing `sameAs` social profiles (Facebook, X, Instagram,
  LinkedIn).

## Public-facing facts this agent verified (no invention)

| Fact                        | Source                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Brand                       | `src/lib/site.ts`                                                                                                              |
| URL                         | `src/lib/site.ts` (canonical)                                                                                                  |
| Canonical email             | `underwriter@mineralrightsxchange.com` (footer + JSON-LD)                                                                      |
| Outbound email for delivery | `underwriter@mineralrightsxchange.com` (env + blog post)                                                                       |
| Phone                       | NOT published site-wide. One blog post carries `+1 (432) 400-6198`. Reserved `SITE.phone=''` and gated `PUBLIC_MRX_PHONE_TEL`. |
| Service area                | Nationwide educational guidance (about.mdx); deeper initial content for TX/NM/OK/ND/CO/WY/PA/WV/OH/LA.                         |
| Street address              | NONE published.                                                                                                                |
| Hours                       | NONE published (asynchronous + scheduled phone appointments).                                                                  |
| Social profiles (sameAs)    | Facebook, X, Instagram, LinkedIn (already in Organization JSON-LD).                                                            |

## First-party activation surface already wired (no secrets)

| Surface                               | Status today                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| Organization JSON-LD + ContactPoint   | Live (this PR).                                                               |
| ProfessionalService JSON-LD           | Live with `Country: US` areaServed.                                           |
| SameAs social profile handles         | Live.                                                                         |
| Footer email link                     | Live.                                                                         |
| Click-to-call phone CTA               | Gated behind `PUBLIC_MRX_PHONE_TEL`. Currently empty.                         |
| LocalBusiness JSON-LD                 | Dormant. Ready when Daryl confirms GBP facts.                                 |
| Reviews module tied to GBP            | Not present. ReviewCard in repo is marketing-only.                            |
| GBP API client / credentials          | Not present. Out of scope until Daryl provisions.                             |
| GHL contact + appointments + Voice AI | Live (this is the operations/CRM surface, not a public GBP citation channel). |

## Blocked facts for Daryl / mrx_ceo (cannot be invented)

These seven items are gating facts for any real GBP activation.
The agent cannot answer them from the codebase or the public web
without invention, which would breach rule 3 of the task body.

1. **Qualifying in-person operating model.** Confirm whether MRX either
   receives customers at a real, staffed location with permanent signage
   during stated hours, or sends MRX staff to customers at their locations.
   Online chat, email, scheduled phone calls, a mailing address, a virtual
   office, and nationwide website coverage do not establish eligibility.
2. **Single canonical phone.** Consolidate or replace the lone
   `+1 (432) 400-6198` from the permalink and commit to one number.
   Until then, `SITE.phone` stays `''` and no `telephone` is emitted.
3. **GBP service-area definition.** If MRX staff actually travel to
   customers, define only the real local area they serve from the operating
   base. Do not use the ten states covered by MRX educational content as a
   GBP service area unless staff genuinely travel throughout that footprint.
4. **Hours model.** GBP requires hours-of-operation. MRX is async
   chat plus scheduled phone appointments. Confirm whether to publish
   "by appointment" hours, Mon-Fri business hours, or hide hours
   (allowed for some SAB categories).
5. **Existing GBP claim state.** Has "Mineral Rights Xchange" or
   "MRX" already been claimed in Google Business Profile by Daryl or
   a prior operator? If yes, ownership or access must be resolved before
   creating a duplicate. If no and eligibility is confirmed, Codex can
   enter the approved facts; Daryl must complete any real-world video,
   postcard, phone, sign-in, or other verification challenge Google requires.
6. **In-person customer contact.** Google currently requires an eligible
   business to receive customers at a staffed, signed location during
   stated hours or travel to customers at their locations. The documented
   MRX experience is online chat plus scheduled phone conversations; unless
   MRX also has a real qualifying in-person operating model, it is not
   eligible for a Business Profile and no profile should be created.
7. **Primary category.** If the in-person eligibility requirement is met,
   select the closest available category based on the real operating model.
   Do not choose a category merely for search visibility or imply a license,
   professional service, or customer-facing location that MRX does not have.

## Compliance guardrails honoured

Every change above was vetted against:

- `compliance/five-hard-rules.json` (no guaranteed value, no certified
  appraisal, no legal/tax advice, no named underwriter, no unsupported
  claims).
- `compliance/disallowed.json` (43 disallowed phrases; one false
  positive caught and rewritten).
- `compliance/scripts/check-compliance.mjs` (passes on both edited
  files).

No GBP post, review response, or Q&A was generated because no GBP
account is owned by this agent and no template copy clears the
"do not invent" rule without a confirmed publication strategy.

## Activation checklist for Daryl (when ready)

1. Confirm all seven blocked facts above, beginning with in-person eligibility.
2. Set `SITE.phone` in `src/lib/site.ts` and `PUBLIC_MRX_PHONE_TEL`
   in the production env.
3. Re-run `pnpm run build` and confirm `Organization.contactPoint`
   carries the canonical phone.
4. If GBP SAB is the chosen mode, import `localBusiness` from
   `src/structured-data/localbusiness.ts` in `siteGraph()` and verify
   with `pnpm run build` + compliance script.
5. If eligible, create or claim the profile at https://business.google.com
   using the approved facts. Codex can perform authorized browser entry;
   Daryl completes any physical verification, CAPTCHA, sign-in challenge,
   or sensitive verification step Google requires.

## Evidence / artifacts

- Code change 1: `src/structured-data/site.ts` (Organization contactPoint).
- Code change 2: `src/structured-data/localbusiness.ts` (dormant node, scope-corrected).
- Verification: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`,
  `node compliance/scripts/check-compliance.mjs` on both files, and
  rendered `dist/index.html` inspection.
- This packet: `docs/MRX_GBP_LOCAL_SOCIAL_ACTIVATION_PACKET.md`.
