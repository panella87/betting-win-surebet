#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

PYTHONDONTWRITEBYTECODE=1 bash ./run-autonomous-implementation.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none \
  --cycle-timeout 2h \
  --validation-timeout 20m
