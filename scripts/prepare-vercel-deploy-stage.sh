#!/usr/bin/env bash
# Build a lean, self-contained Vercel source bundle for MRX production deploys.
#
# The release build needs a narrow set of signed MRX1000 evidence inputs, but
# uploading every local artifact exceeds Vercel's file-entry cap. This helper
# copies application source plus only those fail-closed gate inputs to an empty
# staging directory. Deploy the printed directory with:
#   pnpm dlx vercel@latest "$STAGE_DIR" --prod --yes --scope team-mrx \
#     --project mrx-web --archive=tgz
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
stage_dir=${1:-}

if [[ -z "$stage_dir" ]]; then
  stage_dir=$(mktemp -d "${TMPDIR:-/tmp}/mrx-vercel-stage.XXXXXX")
else
  if [[ -e "$stage_dir" && -n "$(find "$stage_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    echo "Refusing to populate a non-empty staging directory: $stage_dir" >&2
    exit 1
  fi
  mkdir -p "$stage_dir"
  stage_dir=$(cd "$stage_dir" && pwd)
fi

copy_parent() {
  mkdir -p "$stage_dir/$(dirname "$1")"
  cp "$repo_root/$1" "$stage_dir/$1"
  if [[ -f "$repo_root/$1.sha256" ]]; then
    cp "$repo_root/$1.sha256" "$stage_dir/$1.sha256"
  fi
}

rsync -a \
  --exclude='.git/' \
  --exclude='.vercel/' \
  --exclude='.worktrees/' \
  --exclude='.worktrees' \
  --exclude='node_modules/' \
  --exclude='.astro/' \
  --exclude='dist/' \
  --exclude='artifacts/' \
  --exclude='reports/' \
  --exclude='coverage/' \
  --exclude='playwright-report/' \
  --exclude='test-results/' \
  --exclude='tmp/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='public/assets/icons/react/' \
  --exclude='public/assets/icons/*/svg/' \
  "$repo_root/" "$stage_dir/"

mkdir -p "$stage_dir/artifacts/mrx1000-release-10"
rsync -a \
  "$repo_root/artifacts/mrx1000-release-10/decisions/" \
  "$stage_dir/artifacts/mrx1000-release-10/decisions/"
rsync -a \
  "$repo_root/artifacts/mrx1000-release-10/reviews/final/" \
  "$stage_dir/artifacts/mrx1000-release-10/reviews/final/"
rsync -a \
  "$repo_root/artifacts/mrx1000-release-10/creative-remediation-15d/" \
  "$stage_dir/artifacts/mrx1000-release-10/creative-remediation-15d/"

for release_input in \
  artifacts/mrx1000-release-10/release/bound-pre-edit-batch.json \
  artifacts/mrx1000-release-10/release/retained-production-baseline.json; do
  copy_parent "$release_input"
done

while IFS= read -r release_input; do
  [[ -n "$release_input" ]] && copy_parent "$release_input"
done < <(
  node -e '
    const batch = require(process.argv[1]);
    const inputs = [batch.decision_authority?.batch_source_admitted_shortlist_path];
    for (const binding of Object.values(batch.release_evidence_bindings ?? {})) inputs.push(binding?.path);
    for (const input of [...new Set(inputs.filter(Boolean))].sort()) console.log(input);
  ' "$repo_root/config/mrx1000-release-10-batch.json"
)

file_count=$(find "$stage_dir" -type f | wc -l | tr -d ' ')
if (( file_count >= 4900 )); then
  echo "Refusing Vercel staging bundle with $file_count files (limit: 4,900)." >&2
  exit 1
fi

printf 'STAGE_DIR=%s\nFILE_COUNT=%s\n' "$stage_dir" "$file_count"
