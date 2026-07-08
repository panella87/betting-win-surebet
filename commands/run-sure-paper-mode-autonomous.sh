#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

# Compatibility wrapper only. The canonical unattended paper workflow is run-paper-autopilot.sh.
PYTHONDONTWRITEBYTECODE=1 bash ./run-paper-autopilot.sh \
  --duration 7d \
  --paper-duration 72h \
  --implementation-duration 72h \
  --interval 5m \
  --adaptive \
  --max-rounds 6 \
  --max-same-handoff 2 \
  --model cli-default \
  --fallback-model none \
  --validation-timeout 20m
