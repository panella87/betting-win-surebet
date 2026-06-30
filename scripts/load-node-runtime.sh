#!/usr/bin/env bash
# Source-compatible Node/NPM runtime loader for betting-win-surebet.
#
# This loader intentionally does not source nvm.sh and does not call the NVM shell function.
# Some WSL/Bash environments can abort while sourcing nvm.sh before the controller
# has a chance to write logs. We only inspect already-installed Node binaries and
# update PATH to a matching runtime.
#
# Usage from scripts: . scripts/load-node-runtime.sh "$repo_root"
# Usage directly: bash scripts/load-node-runtime.sh [repo_root]

load_betting_win_surebet_node_runtime() {
  local repo_root="${1:-$(pwd)}"
  local target=""
  local target_no_v=""
  local target_with_v=""
  local expected_major=""
  local selected_node=""
  local selected_dir=""
  local actual_version=""
  local candidate=""
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  local -a candidate_dirs=()

  cd "$repo_root" || return 1

  if [[ -f .nvmrc ]]; then
    target="$(tr -d '[:space:]' < .nvmrc)"
    target_no_v="${target#v}"
    target_with_v="v${target_no_v}"
    expected_major="${target_no_v%%.*}"
  fi

  echo "node_runtime_target=${target_no_v:-none}"

  _surebet_node_version() {
    local node_bin="$1"
    "$node_bin" -p 'process.versions.node' 2>/dev/null
  }

  _surebet_node_matches() {
    local node_bin="$1"
    local version=""
    local major=""
    version="$(_surebet_node_version "$node_bin")" || return 1
    major="${version%%.*}"
    if [[ -n "$expected_major" && "$major" != "$expected_major" ]]; then
      return 1
    fi
    actual_version="$version"
    selected_node="$node_bin"
    selected_dir="$(cd "$(dirname "$node_bin")" && pwd)"
    return 0
  }

  if command -v node >/dev/null 2>&1; then
    candidate="$(command -v node)"
    if _surebet_node_matches "$candidate"; then
      PATH="$selected_dir:$PATH"
      export PATH
      hash -r 2>/dev/null || true
      echo "node_runtime_source=path"
    fi
  fi

  if [[ -z "$selected_node" && -n "$target_no_v" ]]; then
    candidate_dirs+=(
      "$nvm_dir/versions/node/$target_with_v/bin"
      "$nvm_dir/versions/node/$target_no_v/bin"
      "$HOME/.nvm/versions/node/$target_with_v/bin"
      "$HOME/.nvm/versions/node/$target_no_v/bin"
    )

    # Fall back to any already-installed Node with the required major, preferring
    # lexical last paths after the exact .nvmrc candidates above.
    local dir=""
    shopt -s nullglob
    for dir in "$nvm_dir"/versions/node/v"$expected_major".*/bin "$HOME/.nvm"/versions/node/v"$expected_major".*/bin; do
      candidate_dirs+=("$dir")
    done
    shopt -u nullglob

    local seen=""
    for dir in "${candidate_dirs[@]}"; do
      [[ -n "$dir" && -x "$dir/node" ]] || continue
      case ":$seen:" in
        *":$dir:"*) continue ;;
      esac
      seen="$seen:$dir"
      if _surebet_node_matches "$dir/node"; then
        PATH="$selected_dir:$PATH"
        export PATH
        hash -r 2>/dev/null || true
        echo "node_runtime_source=direct_nvm_binary"
        break
      fi
    done
  fi

  if [[ -z "$selected_node" ]]; then
    echo "ERROR: no Node.js runtime matching .nvmrc major ${expected_major:-any} was found without sourcing nvm.sh" >&2
    if command -v node >/dev/null 2>&1; then
      echo "current_path_node=$(command -v node)" >&2
      echo "current_path_node_version=$(_surebet_node_version "$(command -v node)" 2>/dev/null || echo unknown)" >&2
    else
      echo "current_path_node=missing" >&2
    fi
    echo "checked_nvm_dir=$nvm_dir" >&2
    if [[ -n "$target_no_v" ]]; then
      echo "expected_direct_node=$nvm_dir/versions/node/$target_with_v/bin/node" >&2
      echo "Install it from an interactive shell with: nvm install $target_no_v" >&2
    fi
    return 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm not found after selecting Node runtime at $selected_dir" >&2
    return 1
  fi

  local npm_path=""
  npm_path="$(command -v npm)"
  case "$npm_path" in
    "$selected_dir"/*) ;;
    *)
      if [[ -x "$selected_dir/npm" ]]; then
        PATH="$selected_dir:$PATH"
        export PATH
        hash -r 2>/dev/null || true
      fi
      ;;
  esac

  echo "NODE_OK=v${actual_version}"
  echo "NPM_OK=$(npm --version)"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  load_betting_win_surebet_node_runtime "${1:-$(pwd)}"
  exit $?
fi

load_betting_win_surebet_node_runtime "${1:-$(pwd)}"
