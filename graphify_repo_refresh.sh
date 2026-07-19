#!/usr/bin/env bash
# Refresh Graphify for the current Git repository in code-only local AST mode.
# Safe for Git hooks: use --nonfatal to warn and continue if Graphify is missing/fails.
set -Eeuo pipefail

nonfatal=0

warn() {
  printf 'WARNING: %s\n' "$*" >&2
}

fail_or_warn() {
  local code="$1"
  shift

  if [ "$nonfatal" = "1" ]; then
    warn "$*"
    return 0
  fi

  printf 'ERROR: %s\n' "$*" >&2
  return "$code"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --nonfatal)
      nonfatal=1
      shift
      ;;
    -h|--help)
      cat <<'USAGE'
Usage: ./graphify_repo_refresh.sh [--nonfatal]

Refreshes the local Graphify code graph for the current Git repository.
Mode: code-only local AST; no LLM API key; no MCP; no HTTP server; no watcher.

Options:
  --nonfatal   Print warnings and return success if Graphify is missing/fails.
USAGE
      exit 0
      ;;
    *)
      fail_or_warn 2 "unknown option: $1"
      exit $?
      ;;
  esac
done

repo="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  fail_or_warn 2 "not inside a Git repository"
  exit $?
}

repo="$(cd "$repo" && pwd -P)"
cd "$repo" || {
  fail_or_warn 1 "cannot cd to repository root: $repo"
  exit $?
}

if ! command -v graphify >/dev/null 2>&1; then
  fail_or_warn 127 "Graphify not found; skipping graph refresh"
  exit $?
fi

printf '%s\n' 'GRAPHIFY_REFRESH_START'
printf 'Repository: %s\n' "$repo"
printf 'Mode:       code-only local AST; no MCP/HTTP; no LLM labels\n'

if ! GRAPHIFY_QUERY_LOG_DISABLE=1 graphify . --code-only --no-viz; then
  fail_or_warn 1 "Graphify code-only extraction failed; continuing only if --nonfatal was used"
  exit $?
fi

cluster_args=(cluster-only "$repo" --no-label)

if graphify cluster-only --help 2>/dev/null | grep -q -- '--no-viz'; then
  cluster_args+=(--no-viz)
fi

if ! GRAPHIFY_QUERY_LOG_DISABLE=1 graphify "${cluster_args[@]}"; then
  fail_or_warn 1 "Graphify cluster/report generation failed; continuing only if --nonfatal was used"
  exit $?
fi

if [ ! -s "$repo/graphify-out/graph.json" ]; then
  fail_or_warn 1 "Graphify refresh finished but graphify-out/graph.json is missing or empty"
  exit $?
fi

if [ ! -s "$repo/graphify-out/GRAPH_REPORT.md" ]; then
  fail_or_warn 1 "Graphify refresh finished but graphify-out/GRAPH_REPORT.md is missing or empty"
  exit $?
fi

printf '%s\n' 'GRAPHIFY_REFRESH_DONE'
printf 'Graph:  %s\n' "$repo/graphify-out/graph.json"
printf 'Report: %s\n' "$repo/graphify-out/GRAPH_REPORT.md"
