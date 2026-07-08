#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 2; }
assert_active_node_runtime() {
  local target target_no_v expected_major actual_version actual_major
  target=""
  [[ -f .nvmrc ]] && target="$(tr -d '[:space:]' < .nvmrc)"
  target_no_v="${target#v}"
  expected_major="${target_no_v%%.*}"
  command -v node >/dev/null 2>&1 || fail "Node is missing. Activate the repo runtime first: . \"\$HOME/.nvm/nvm.sh\" && nvm use ${target_no_v:-20}"
  command -v npm >/dev/null 2>&1 || fail "NPM is missing from PATH after Node activation"
  actual_version="$(node -p 'process.versions.node')"
  actual_major="${actual_version%%.*}"
  if [[ -n "$expected_major" && "$actual_major" != "$expected_major" ]]; then
    fail "active Node is v${actual_version}, expected major ${expected_major}. Run: . \"\$HOME/.nvm/nvm.sh\" && nvm use ${target_no_v:-20}"
  fi
  printf 'NODE_OK=v%s\n' "$actual_version"
  printf 'NPM_OK=%s\n' "$(npm --version)"
}

bundle_path="${1:-${SUREBET_PINNED_BUNDLE:-}}"
if [[ -z "$bundle_path" ]]; then
  fail "provide a repo-local pinned bundle path as argv[1] or SUREBET_PINNED_BUNDLE."
fi
case "$bundle_path" in http://*|https://*|ws://*|wss://*) fail "pinned bundle path must be repo-local; remote URLs are prohibited." ;; esac
if [[ "$bundle_path" = /* ]]; then resolved_bundle="$bundle_path"; else resolved_bundle="$repo_root/$bundle_path"; fi
[[ -f "$resolved_bundle" ]] || fail "pinned bundle file not found: $bundle_path"

assert_active_node_runtime
node scripts/restore-required-executable-bits.js
npm install
npm run validate

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_path="artifacts/private-paper-mode/pinned-interface-smoke-${stamp}.report.json"
node cli.js local-report --bundle "$bundle_path" --output "$out_path" --pinned-intake
printf 'private_paper_report=%s\n' "$repo_root/$out_path"
