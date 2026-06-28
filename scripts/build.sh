#!/usr/bin/env bash
# scripts/build.sh — canonical build-verification shim for mrx-web.
#
# This is the single command future workers run to verify an Astro change.
# See BUILD.md (the parent doc) for the full procedure and acceptance criteria.
#
# Usage:
#   ./scripts/build.sh                    # build with summary
#   ./scripts/build.sh 2>&1 | tee /tmp/mrx-build.log   # capture for evidence
#
# Exit code:
#   0  on success (compliance clean, typecheck clean, dist/ emitted, all checks pass)
#   1  on any failure (the failing step's stderr is forwarded; nothing is hidden)
#   2  on environment problem (no pnpm, no local astro)
#
# Side effects:
#   - Removes and recreates ./dist
#   - Writes /tmp/mrx-build.log if you tee it (recommended)
#   - Prints a final evidence block ready to paste into a Kanban card comment

set -euo pipefail

# Resolve repo root from this script's location, regardless of cwd.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Pick the right package-manager binary. pnpm is canonical; fall back to local astro
# when pnpm is missing (CI sandboxes, minimal images).
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
elif [ -x "$REPO_ROOT/node_modules/.bin/astro" ]; then
  PM=local-fallback
else
  echo "ERROR: neither 'pnpm' nor a local astro binary is available." >&2
  echo "Install pnpm:  npm i -g pnpm   (or)   corepack enable" >&2
  exit 2
fi

echo "==[ mrx-web build verification ]================================="
echo "Repo:    $REPO_ROOT"
echo "PM:      $PM"
echo "Node:    $(node --version 2>/dev/null || echo 'missing')"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=================================================================="

BUILD_START=$(date +%s)

if [ "$PM" = "pnpm" ]; then
  pnpm build
else
  # Local fallback: invoke the same three steps package.json defines.
  echo "[1/3] compliance check (local fallback)"
  node compliance/scripts/check-compliance.mjs
  echo "[2/3] astro check (local fallback)"
  ./node_modules/.bin/astro check
  echo "[3/3] astro build (local fallback)"
  ./node_modules/.bin/astro build
fi

BUILD_EXIT=$?
BUILD_END=$(date +%s)
BUILD_SECS=$((BUILD_END - BUILD_START))

# Acceptance gate. Fail loud if anything is missing.
FAIL=0
[ -d dist ]                || { echo "FAIL: dist/ not created"; FAIL=1; }
# _worker.js is emitted by the Cloudflare adapter in directory mode as a DIRECTORY
# containing chunked JS files (per @astrojs/cloudflare docs). A plain `test -f`
# would falsely fail. Use `test -e` so both shapes are accepted.
[ -e dist/_worker.js ]     || { echo "FAIL: dist/_worker.js missing (neither file nor directory)"; FAIL=1; }
[ -f dist/_routes.json ]   || { echo "FAIL: dist/_routes.json missing"; FAIL=1; }

HTML_COUNT=$(find dist -name '*.html' -type f 2>/dev/null | wc -l | tr -d ' ')
TOTAL_FILES=$(find dist -type f 2>/dev/null | wc -l | tr -d ' ')
DIST_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
SITEMAP_URLS=$(grep -oE '<loc>[^<]+</loc>' dist/sitemap-0.xml 2>/dev/null | wc -l | tr -d ' ')
ROUTE_TOTAL=$(node -e "const r=require('./dist/_routes.json');console.log(r.include.length+r.exclude.length)" 2>/dev/null || echo 0)

[ "$HTML_COUNT" -ge 25 ]   || { echo "FAIL: HTML count $HTML_COUNT < 25"; FAIL=1; }
[ "$SITEMAP_URLS" -ge 20 ] || { echo "FAIL: sitemap URLs $SITEMAP_URLS < 20"; FAIL=1; }

if [ "$BUILD_EXIT" -ne 0 ]; then
  echo "FAIL: underlying build command exited $BUILD_EXIT"
  FAIL=1
fi

echo
echo "==[ evidence block — paste into Kanban card ]===================="
echo "astro build exit: ${BUILD_EXIT}"
echo "build wall time:  ${BUILD_SECS}s"
echo "HTML pages:       ${HTML_COUNT}"
echo "Total dist files: ${TOTAL_FILES}"
echo "dist size:        ${DIST_SIZE}"
echo "Sitemap URLs:     ${SITEMAP_URLS}"
echo "Routes (inc+exc): ${ROUTE_TOTAL}"
echo "Repo root:        ${REPO_ROOT}"
echo "=================================================================="

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "BUILD VERIFICATION FAILED — see messages above." >&2
  exit 1
fi

echo
echo "BUILD VERIFICATION PASSED"
exit 0
