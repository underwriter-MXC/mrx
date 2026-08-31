# MRX Summit 2026 Brand Context Pack

This is the project-owned, source-backed context pack for applying the authenticated June-August 2026 Summit playbooks to Mineral Rights Xchange.

Use `brand.json` for identity, audience, positioning, conversions, and channel rules; `claims.json` for approved claims and source links; `sources.json` for provenance and limitations; `accounts.json` for identifier-only readiness; and `measurement-register.json` for the fixed Search Atlas LLM Visibility denominator and legacy diagnostic segment.

The pack does not authorize unsupported claims, LocalBusiness or Google Business Profile activation, paid spend, bulk Search Atlas deployment, article-title replacement, generic hero generation, or the use of owner private data in prompts. Public content still requires the MRX website and article release gates.

Validate before execution:

```sh
python3 /Users/darylhill/.codex/skills/codex-marketing-playbooks/scripts/validate_brand_pack.py docs/brand-context/mrx-summit-2026 --strict
```
