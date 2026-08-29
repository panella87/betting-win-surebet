#!/usr/bin/env bash
# Refresh Graphify for any Git repository. Local AST mode is the default.
# Hosted AI is opt-in and explicit; this script never auto-selects a provider.
set -Eeuo pipefail

readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly EXPECTED_GRAPHIFY_VERSION="${GRAPHIFY_EXPECTED_VERSION:-0.9.51}"
readonly OUTPUT_DIR_NAME="graphify-out"

repo_arg=""
nonfatal=0
online_provider="none"
model="${GRAPHIFY_ONLINE_MODEL:-}"
semantic_mode="${GRAPHIFY_SEMANTIC_MODE:-deep}"
token_budget="${GRAPHIFY_TOKEN_BUDGET:-4000}"
build_callflow=0
lock_fd=""

usage() {
  cat <<USAGE
Usage: $SCRIPT_NAME [options]

Run from anywhere inside a Git repository, or pass --repo PATH.

Default behavior:
  graphify update .

This refreshes code locally through Graphify's AST pipeline and retains its
LLM-free community labels. It does not call an online model.

Options:
  --repo PATH                  Target repository.
  --online none|gemini|openrouter
                               Explicit hosted semantic backend. Default: none.
  --model MODEL                Hosted model identifier. Required with --online.
  --mode normal|deep           Semantic extraction mode. Default: deep.
  --token-budget N             Semantic input chunk budget. Default: 4000.
  --callflow                   Generate Mermaid call-flow HTML after refresh.
  --nonfatal                   Warn and return success on failure; intended for hooks.
  -h, --help                   Show this help.

Provider environment:
  Gemini:     GEMINI_API_KEY or GOOGLE_API_KEY
  OpenRouter: OPENROUTER_API_KEY, or OPENAI_API_KEY
              OPENAI_BASE_URL defaults to https://openrouter.ai/api/v1

No API key is written to the repository. No Ollama backend is supported by this
integration. Agentic Antigravity use is installed by graphify_repo_install.sh;
run the Graphify skill inside Antigravity rather than through this headless script.
USAGE
}

warn() {
  printf 'WARNING: %s\n' "$*" >&2
}

fail() {
  local code="$1"
  shift
  if [ "$nonfatal" = "1" ]; then
    warn "$*"
    exit 0
  fi
  printf 'ERROR: %s\n' "$*" >&2
  exit "$code"
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --repo)
        [ "$#" -ge 2 ] || fail 2 "--repo requires a path"
        repo_arg="$2"
        shift 2
        ;;
      --repo=*)
        repo_arg="${1#*=}"
        shift
        ;;
      --online)
        [ "$#" -ge 2 ] || fail 2 "--online requires none, gemini, or openrouter"
        online_provider="$2"
        shift 2
        ;;
      --online=*)
        online_provider="${1#*=}"
        shift
        ;;
      --model)
        [ "$#" -ge 2 ] || fail 2 "--model requires a value"
        model="$2"
        shift 2
        ;;
      --model=*)
        model="${1#*=}"
        shift
        ;;
      --mode)
        [ "$#" -ge 2 ] || fail 2 "--mode requires normal or deep"
        semantic_mode="$2"
        shift 2
        ;;
      --mode=*)
        semantic_mode="${1#*=}"
        shift
        ;;
      --token-budget)
        [ "$#" -ge 2 ] || fail 2 "--token-budget requires a positive integer"
        token_budget="$2"
        shift 2
        ;;
      --token-budget=*)
        token_budget="${1#*=}"
        shift
        ;;
      --callflow)
        build_callflow=1
        shift
        ;;
      --nonfatal)
        nonfatal=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        fail 2 "unknown option: $1"
        ;;
    esac
  done

  case "$online_provider" in
    none|gemini|openrouter) ;;
    *) fail 2 "--online must be none, gemini, or openrouter" ;;
  esac
  case "$semantic_mode" in
    normal|deep) ;;
    *) fail 2 "--mode must be normal or deep" ;;
  esac
  [[ "$token_budget" =~ ^[1-9][0-9]*$ ]] || fail 2 "--token-budget must be a positive integer"
  if [ "$online_provider" != "none" ] && [ -z "$model" ]; then
    fail 2 "--online $online_provider requires --model MODEL or GRAPHIFY_ONLINE_MODEL"
  fi
}

resolve_repo() {
  local start resolved
  start="${repo_arg:-.}"
  resolved="$(git -C "$start" rev-parse --show-toplevel 2>/dev/null)" ||
    fail 2 "not inside a Git repository: $start"
  resolved="$(cd "$resolved" && pwd -P)" || fail 1 "cannot resolve repository root"
  printf '%s\n' "$resolved"
}

graphify_version() {
  graphify --version 2>/dev/null | awk '{print $NF}' | tr -d '\r' | tail -n 1
}

require_graphify() {
  export PATH="$HOME/.local/bin:$PATH"
  command -v graphify >/dev/null 2>&1 || fail 127 "Graphify is not installed or not on PATH"
  local found
  found="$(graphify_version)"
  [ "$found" = "$EXPECTED_GRAPHIFY_VERSION" ] ||
    fail 1 "Graphify version mismatch: expected $EXPECTED_GRAPHIFY_VERSION, found ${found:-unknown}"
}

git_storage_dir() {
  local directory
  directory="$(git rev-parse --git-common-dir 2>/dev/null)" || fail 1 "cannot resolve Git common directory"
  case "$directory" in
    /*) printf '%s\n' "$directory" ;;
    *) printf '%s\n' "$repo/$directory" ;;
  esac
}

acquire_lock() {
  command -v flock >/dev/null 2>&1 || {
    warn "flock is unavailable; relying on Graphify's own repository locking"
    return 0
  }
  local lock_path
  lock_path="$(git_storage_dir)/graphify-repo-refresh.lock"
  exec {lock_fd}>"$lock_path" || fail 1 "cannot open refresh lock: $lock_path"
  flock -n "$lock_fd" || fail 75 "another Graphify refresh is already running: $repo"
}

run_graphify() {
  GRAPHIFY_QUERY_LOG_DISABLE=1 \
  GRAPHIFY_NO_TIPS=1 \
  PYTHONHASHSEED=0 \
    graphify "$@"
}

prepare_provider() {
  case "$online_provider" in
    none)
      return 0
      ;;
    gemini)
      if [ -z "${GEMINI_API_KEY:-}" ] && [ -z "${GOOGLE_API_KEY:-}" ]; then
        fail 2 "Gemini requires GEMINI_API_KEY or GOOGLE_API_KEY"
      fi
      ;;
    openrouter)
      if [ -n "${OPENROUTER_API_KEY:-}" ]; then
        export OPENAI_API_KEY="$OPENROUTER_API_KEY"
      fi
      [ -n "${OPENAI_API_KEY:-}" ] || fail 2 "OpenRouter requires OPENROUTER_API_KEY or OPENAI_API_KEY"
      export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://openrouter.ai/api/v1}"
      ;;
  esac
}

validate_outputs() {
  local output_dir="$1"
  [ -s "$output_dir/graph.json" ] || fail 1 "missing or empty graph: $output_dir/graph.json"
  [ -s "$output_dir/GRAPH_REPORT.md" ] || fail 1 "missing or empty report: $output_dir/GRAPH_REPORT.md"

  python3 - "$output_dir/graph.json" <<'PY' || fail 1 "graph.json validation failed"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
    graph = json.loads(path.read_text(encoding="utf-8"))
except Exception as exc:
    raise SystemExit(f"ERROR: invalid JSON at {path}: {exc}")

nodes = graph.get("nodes")
links = graph.get("links", graph.get("edges"))
if not isinstance(nodes, list) or not nodes:
    raise SystemExit(f"ERROR: graph contains no nodes: {path}")
if not isinstance(links, list):
    raise SystemExit(f"ERROR: graph has no links/edges array: {path}")

communities = {
    str(node.get("community"))
    for node in nodes
    if isinstance(node, dict) and node.get("community") is not None
}
labels = set()
for node in nodes:
    if not isinstance(node, dict):
        continue
    for key in ("community_label", "community_name"):
        value = node.get(key)
        if isinstance(value, str) and value.strip():
            labels.add(value.strip())
for container in (graph, graph.get("metadata") if isinstance(graph.get("metadata"), dict) else {}):
    value = container.get("community_labels") if isinstance(container, dict) else None
    if isinstance(value, dict):
        for label in value.values():
            if isinstance(label, str) and label.strip():
                labels.add(label.strip())

print(
    f"GRAPHIFY_GRAPH_OK nodes={len(nodes)} edges={len(links)} "
    f"communities={len(communities)} observed_labels={len(labels)}"
)
PY
}

parse_args "$@"
command -v python3 >/dev/null 2>&1 || fail 127 "python3 is required"
repo="$(resolve_repo)"
cd "$repo" || fail 1 "cannot cd to repository root: $repo"
require_graphify
acquire_lock
prepare_provider

output_dir="$repo/$OUTPUT_DIR_NAME"
printf '%s\n' 'GRAPHIFY_REFRESH_START'
printf 'repository=%s\n' "$repo"
printf 'graphify_version=%s\n' "$EXPECTED_GRAPHIFY_VERSION"
printf 'online_provider=%s\n' "$online_provider"
printf 'model=%s\n' "${model:-none}"
printf 'output_dir=%s\n' "$output_dir"

if [ "$online_provider" = "none" ]; then
  run_graphify update . || fail 1 "local Graphify update failed"
else
  backend="$online_provider"
  [ "$online_provider" = "openrouter" ] && backend="openai"
  run_graphify extract . \
    --backend "$backend" \
    --model "$model" \
    --mode "$semantic_mode" \
    --token-budget "$token_budget" ||
    fail 1 "$online_provider semantic extraction failed"
fi

if [ "$build_callflow" = "1" ]; then
  run_graphify export callflow-html || fail 1 "Graphify call-flow export failed"
fi

validate_outputs "$output_dir"

printf '%s\n' 'GRAPHIFY_REFRESH_DONE'
printf 'graph=%s\n' "$output_dir/graph.json"
printf 'report=%s\n' "$output_dir/GRAPH_REPORT.md"
[ -s "$output_dir/graph.html" ] && printf 'visualization=%s\n' "$output_dir/graph.html" || true
if [ "$build_callflow" = "1" ]; then
  callflow="$(find "$output_dir" -maxdepth 1 -type f -name '*-callflow.html' -size +0c -print -quit 2>/dev/null || true)"
  [ -n "$callflow" ] && printf 'callflow=%s\n' "$callflow" || warn "call-flow command completed but no *-callflow.html was found"
fi
