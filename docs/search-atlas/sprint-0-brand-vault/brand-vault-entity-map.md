# Sprint 0 Brand Vault entity map — draft

Task: `t_eee35875`
Generated: 2026-07-20T05:07:59Z
Policy: `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md` §3.3 allows draft Brand Vault maps, source-of-truth tables, JSON-LD drafts, validator output, and canonical/hreflang/entity proposals only.

## Source handles checked

- `docs/MRX_SEARCH_ATLAS_REMEDIATION_POLICY.md:64-79` — lane permissions and human-only gates.
- `src/lib/site.ts:8-21` — canonical brand/site facts.
- `src/structured-data/site.ts:6-84` — current Organization, ProfessionalService, WebSite, WebPage graph factories.
- `src/structured-data/localbusiness.ts:1-59` — dormant LocalBusiness gate and service-area cautions.
- `src/structured-data/article.ts:10-52` — Article and SpeakableSpecification factory.
- `src/structured-data/breadcrumb.ts:9-18` — BreadcrumbList factory.
- `src/structured-data/faq.ts:9-21` — FAQPage factory.
- `src/content/team/organization.mdx:1-14` — organization prose source.
- `src/content/authors/mrx-editorial-team.mdx:1-13` — editorial organization source.
- `src/data/guides.ts:18-140` — disclosed AI guide facts for Tommy/Angela.

## Source-of-truth table

| Entity                              | Proposed entity ID                        | JSON-LD `@id`                                                         | Canonical URL                                                  | Primary source                                         | Status             | Human gate                                                                                      |
| ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| Mineral Rights Xchange organization | `mrx:org:mineral-rights-xchange`          | `https://mineralrightsxchange.com/#org`                               | `https://mineralrightsxchange.com/`                            | `src/lib/site.ts`, `src/content/team/organization.mdx` | Active draft map   | Confirm any sameAs/social profiles before adding.                                               |
| Website                             | `mrx:site:mineralrightsxchange.com`       | `https://mineralrightsxchange.com/#site`                              | `https://mineralrightsxchange.com/`                            | `src/structured-data/site.ts`                          | Active draft map   | None for draft; production edits need PR/live verification.                                     |
| Professional service                | `mrx:service:national-underwriter-review` | `https://mineralrightsxchange.com/#service`                           | `https://mineralrightsxchange.com/`                            | `src/structured-data/site.ts`                          | Active draft map   | Confirm phone/service-area/address before enriching.                                            |
| LocalBusiness service-area draft    | `mrx:local:service-area-business`         | `https://mineralrightsxchange.com/#local`                             | `https://mineralrightsxchange.com/`                            | `src/structured-data/localbusiness.ts`                 | Dormant draft only | GBP activation, canonical phone, service-area mode, public address decision.                    |
| MRX Editorial Team                  | `mrx:publisher:editorial-team`            | `https://mineralrightsxchange.com/authors/mrx-editorial-team/#author` | `https://mineralrightsxchange.com/authors/mrx-editorial-team/` | `src/content/authors/mrx-editorial-team.mdx`           | Active draft map   | None for organization author; production edits need PR/live verification.                       |
| Tommy AI guide                      | `mrx:ai-guide:tommy`                      | `https://mineralrightsxchange.com/team/#tommy`                        | `https://mineralrightsxchange.com/team/`                       | `src/data/guides.ts`                                   | Draft-only         | Legal/compliance approval before any Person schema; must not imply human/licensed professional. |
| Angela AI guide                     | `mrx:ai-guide:angela`                     | `https://mineralrightsxchange.com/team/#angela`                       | `https://mineralrightsxchange.com/team/`                       | `src/data/guides.ts`                                   | Draft-only         | Legal/compliance approval before any Person schema or outbound-calling implication.             |

## Normalization rules

1. Use non-www canonical domain: `https://mineralrightsxchange.com`.
2. Use trailing slash canonical URLs for route pages, matching `src/lib/seo.ts:48-53`.
3. Keep organization `sameAs: []` until first-party ownership is confirmed.
4. Keep `SITE.phone` empty and omit telephone in emitted schema until Daryl confirms the canonical business phone.
5. Keep LocalBusiness dormant until GBP/service-area facts are approved.
6. Prefer MRX Editorial Team as article author/publisher. Treat guide-persona Person schema as draft-only unless legal/compliance approves a representation pattern.

## Human-only gates surfaced

- GBP edits or activation.
- Wikidata edits.
- Brand Vault / Knowledge Graph record creation or update.
- Publishing JSON-LD into production.
- Adding sameAs links without first-party ownership confirmation.
- Adding phone/street-address/service-area facts without Daryl confirmation.
- Representing AI guides as real people without legal/compliance approval.

Machine-readable companion: `docs/search-atlas/sprint-0-brand-vault/entity-map.json`.
