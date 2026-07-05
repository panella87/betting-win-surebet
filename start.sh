#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
target=""
[[ -f .nvmrc ]] && target="$(tr -d '[:space:]' < .nvmrc)"
target_no_v="${target#v}"
expected_major="${target_no_v%%.*}"
command -v node >/dev/null 2>&1 || fail "Node is missing. Activate the repo runtime first: . \"$HOME/.nvm/nvm.sh\" && nvm use ${target_no_v:-20}"
command -v npm >/dev/null 2>&1 || fail "NPM is missing from PATH after Node activation"
actual_version="$(node -p 'process.versions.node')"
actual_major="${actual_version%%.*}"
if [[ -n "$expected_major" && "$actual_major" != "$expected_major" ]]; then
  fail "active Node is v${actual_version}, expected major ${expected_major}. Run: . \"$HOME/.nvm/nvm.sh\" && nvm use ${target_no_v:-20}"
fi
printf 'NODE_OK=v%s\n' "$actual_version"
printf 'NPM_OK=%s\n' "$(npm --version)"
node scripts/restore-required-executable-bits.js
npm install
npm run validate
