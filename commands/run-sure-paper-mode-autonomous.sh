#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

PYTHONDONTWRITEBYTECODE=1 bash ./run-paper-evaluation.sh \
  --duration 72h \
  --interval 5m \
  --adaptive \
  --keep-monitoring-when-ready \
  --model cli-default \
  --fallback-model none \
  --validation-timeout 20m
