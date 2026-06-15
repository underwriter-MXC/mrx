# Compliance

This folder is the **machine-readable mirror** of the MRX public-claims
compliance review at `project-pack/04-compliance/MRX Compliance Review.md`.

It is the source of truth for:

- The §4 disallowed-language lexicon (`disallowed.json`).
- The §6 named-competitor blocklist (`named-competitors.json`).
- The §7 standard disclaimer text (`disclaimer.ts`).
- The §9 per-page sign-off rubric (`signoff-rubric.json`).
- The §10 first-200-chars snippet test (consumed by `tests/e2e/snippet.spec.ts`).

## How the lexicons are generated

The lexicons are **generated** from the source compliance review by
`scripts/regenerate-lexicons.mjs`. The script reads
`project-pack/04-compliance/MRX Compliance Review.md`, extracts the
disallowed and named-competitor lists, and writes the JSON files
here.

The build's first step (`pnpm check-compliance`) re-verifies that
the generated JSON is current (it checks the file's `last_generated`
timestamp against the review's `Date:` line). If the review was
updated and the JSON was not regenerated, CI fails.

## How the disclaimer text is used

`src/lib/disclaimer.ts` re-exports `DISCLAIMER_TEXT` from
`compliance/disclaimer.ts`. The `<Disclaimer />` molecule imports
that constant. This means the disclaimer has exactly one source of
truth.

## How the build-time grep check works

`scripts/check-compliance.mjs`:

1. Loads `compliance/disallowed.json` and `compliance/named-competitors.json`.
2. Globs every `.mdx`, `.astro`, `.ts`, `.tsx`, `.json`, and `.js`
   file under `src/content/`, `src/components/`, and `src/structured-data/`.
3. For each file, checks the lowercased text against every
   disallowed phrase. If a match is found outside the allowlist
   files, the build fails with a tabular report.
4. The script also checks for the §4 "no advice verb" patterns
   ("we recommend", "we advise", etc.) as a hard-coded list.
5. The script also checks for the §6.2 "no superlative about MRX"
   patterns ("the only", "the most", "the best", etc.).
6. The script also checks for the §6.4 "no implicit personal
   knowledge" patterns ("we know you inherited", etc.).

## Allowlist

These files contain phrases that look like disallowed terms but
are intentionally allowed (the disclaimer itself, the script that
enforces the rules, the test fixtures):

- `src/lib/disclaimer.ts` — re-exports the disclaimer text.
- `compliance/disclaimer.ts` — the disclaimer text source.
- `compliance/scripts/check-compliance.mjs` — the rule itself.
- `tests/fixtures/disallowed.json` — the test fixture.

Any new exception must be added to the `ALLOWLIST_FILES` set in
`check-compliance.mjs` explicitly. No silent allowances.

## Re-generating

After any update to the source compliance review:

```bash
pnpm regenerate-lexicons
```

This is a one-shot script. CI verifies the JSON is current.
