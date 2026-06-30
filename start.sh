#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

. scripts/load-node-runtime.sh "$repo_root"
node scripts/restore-required-executable-bits.js
npm install
npm run validate
