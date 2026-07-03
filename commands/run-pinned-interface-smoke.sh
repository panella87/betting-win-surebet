#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

bundle_path="${1:-${SUREBET_PINNED_BUNDLE:-}}"
if [[ -z "$bundle_path" ]]; then
  echo "ERROR: provide a repo-local pinned bundle path as argv[1] or SUREBET_PINNED_BUNDLE." >&2
  exit 2
fi
case "$bundle_path" in
  http://*|https://*|ws://*|wss://*)
    echo "ERROR: pinned bundle path must be repo-local; remote URLs are prohibited." >&2
    exit 2
    ;;
esac

if [[ "$bundle_path" = /* ]]; then
  resolved_bundle="$bundle_path"
else
  resolved_bundle="$repo_root/$bundle_path"
fi
if [[ ! -f "$resolved_bundle" ]]; then
  echo "ERROR: pinned bundle file not found: $bundle_path" >&2
  exit 2
fi

. scripts/load-node-runtime.sh "$repo_root"
node scripts/restore-required-executable-bits.js
npm install
npm run validate

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_dir="artifacts/private-paper-mode"
out_path="$out_dir/pinned-interface-smoke-${stamp}.report.json"
mkdir -p "$out_dir"
node cli.js local-report --bundle "$bundle_path" --output "$out_path" --pinned-intake
printf 'private_paper_report=%s\n' "$repo_root/$out_path"
