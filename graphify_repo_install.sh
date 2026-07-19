#!/usr/bin/env bash
# Install Graphify repo integration from the repository root.
# Does not patch update_git.sh. Does not start MCP/HTTP. Does not enable a live watcher.
set -Eeuo pipefail

GRAPHIFY_PACKAGE_SPEC="${GRAPHIFY_PACKAGE_SPEC:-graphifyy==0.9.18}"

warn() {
  printf 'WARNING: %s\n' "$*" >&2
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_repo_root() {
  local repo cwd

  repo="$(git rev-parse --show-toplevel 2>/dev/null)" ||
    fail "not inside a Git repository"

  repo="$(cd "$repo" && pwd -P)"
  cwd="$(pwd -P)"

  [ "$cwd" = "$repo" ] ||
    fail "run this script from the repository root: $repo"

  printf '%s\n' "$repo"
}

require_python_for_graphify() {
  command -v python3 >/dev/null 2>&1 ||
    fail "python3 is required"

  python3 - <<'PY'
import sys
if sys.version_info < (3, 10):
    raise SystemExit(f"ERROR: Graphify requires Python >= 3.10; found {sys.version.split()[0]}")
print(f"Python OK: {sys.version.split()[0]}")
PY
}

ensure_graphify() {
  export PATH="$HOME/.local/bin:$PATH"

  if command -v graphify >/dev/null 2>&1; then
    graphify --version
    return 0
  fi

  command -v pipx >/dev/null 2>&1 ||
    fail "Graphify is missing and pipx is not installed. Install pipx first, then rerun this script."

  printf 'Installing Graphify with pipx: %s\n' "$GRAPHIFY_PACKAGE_SPEC"
  pipx install "$GRAPHIFY_PACKAGE_SPEC"

  export PATH="$HOME/.local/bin:$PATH"
  command -v graphify >/dev/null 2>&1 ||
    fail "Graphify install finished but graphify is still not in PATH"

  graphify --version
}

write_graphifyignore() {
  python3 - <<'PY'
from pathlib import Path

path = Path(".graphifyignore")
start = "# BEGIN GRAPHIFY_CODE_ONLY_MANAGED\n"
end = "# END GRAPHIFY_CODE_ONLY_MANAGED\n"
block = start + """# Keep Graphify local, deterministic, and code-only.
# Generated/runtime output
graphify-out/
node_modules/
dist/
build/
coverage/
.cache/
.next/
.nuxt/
__pycache__/
artifacts/
logs/
tmp/
temp/
runtime/

# Archives and logs
*.log
*.zip
*.tar
*.tar.gz

# Secrets and private state
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
secrets/
credentials/

# Non-code semantic inputs intentionally excluded.
# The refresh script uses --code-only, so no LLM API key is needed.
*.md
*.mdx
*.pdf
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.svg
""" + end

text = path.read_text(encoding="utf-8") if path.exists() else ""

if start in text and end in text:
    before = text.split(start, 1)[0]
    after = text.split(end, 1)[1]
    text = before + block + after.lstrip("\n")
elif text.strip():
    text = text.rstrip() + "\n\n" + block
else:
    text = block

path.write_text(text, encoding="utf-8")
print(".graphifyignore updated")
PY
}

ensure_local_excludes() {
  mkdir -p .git/info
  touch .git/info/exclude

  for pattern in '/graphify-out/' '/.graphify-live-probe.js'; do
    if ! grep -qxF "$pattern" .git/info/exclude 2>/dev/null; then
      printf '%s\n' "$pattern" >> .git/info/exclude
    fi
  done

  printf '.git/info/exclude updated for local Graphify output\n'
}

install_managed_hook() {
  local hook_name="$1" hook_path=".git/hooks/$1"

  mkdir -p .git/hooks

  if [ -f "$hook_path" ]; then
    if grep -q 'GRAPHIFY_CODE_ONLY_MANAGED_HOOK' "$hook_path" 2>/dev/null ||
       grep -qi 'graphify' "$hook_path" 2>/dev/null; then
      :
    else
      warn "existing non-Graphify $hook_name hook found; leaving it unchanged and skipping Graphify $hook_name hook"
      return 0
    fi
  fi

  cat > "$hook_path" <<'HOOK'
#!/usr/bin/env bash
# GRAPHIFY_CODE_ONLY_MANAGED_HOOK
# Non-fatal local Graphify refresh after Git lifecycle events.
set +e

repo="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$repo" ]; then
  printf 'WARNING: Graphify hook could not resolve repository root; skipping\n' >&2
  exit 0
fi

cd "$repo" || {
  printf 'WARNING: Graphify hook could not cd to repository root; skipping\n' >&2
  exit 0
}

if [ ! -x "$repo/graphify_repo_refresh.sh" ]; then
  printf 'WARNING: graphify_repo_refresh.sh is missing or not executable; skipping Graphify refresh\n' >&2
  exit 0
fi

"$repo/graphify_repo_refresh.sh" --nonfatal
exit 0
HOOK

  chmod 0755 "$hook_path"
  printf '%s hook installed: %s\n' "$hook_name" "$hook_path"
}

disable_old_live_watcher_if_present() {
  command -v systemctl >/dev/null 2>&1 || return 0

  local repo="$1" repo_hash service
  repo_hash="$(printf '%s' "$repo" | sha256sum | cut -c1-12)"
  service="graphify-watch-$(basename "$repo")-${repo_hash}.service"

  systemctl --user disable --now "$service" >/dev/null 2>&1 || true
  systemctl --user reset-failed "$service" >/dev/null 2>&1 || true
  printf 'Live watcher disabled/not present: %s\n' "$service"
}

assert_no_graphify_server() {
  local unexpected

  unexpected="$(pgrep -u "$USER" -af 'graphify-mcp|graphify[.]serve|graphify[[:space:]]+serve' 2>/dev/null || true)"

  if [ -n "$unexpected" ]; then
    printf '%s\n' "$unexpected" >&2
    fail "unexpected Graphify MCP/server process is running"
  fi

  printf 'No Graphify MCP/HTTP server process detected\n'
}

repo="$(require_repo_root)"

printf '%s\n' '=== Graphify repository install ==='
printf 'Repository: %s\n' "$repo"

require_python_for_graphify
ensure_graphify

[ -f ./graphify_repo_refresh.sh ] ||
  fail "graphify_repo_refresh.sh must be present in the repository root"
chmod 0755 ./graphify_repo_refresh.sh

[ -f ./graphify_repo_status.sh ] && chmod 0755 ./graphify_repo_status.sh || true

write_graphifyignore
ensure_local_excludes

disable_old_live_watcher_if_present "$repo"
assert_no_graphify_server

printf '%s\n' 'Installing Codex Graphify integration...'
graphify install --project --platform codex
graphify codex install --project

printf '%s\n' 'Installing non-fatal code-only Git hooks...'
install_managed_hook post-commit
install_managed_hook post-checkout

printf '%s\n' 'Building initial code-only graph...'
./graphify_repo_refresh.sh

printf '%s\n' '=== Graphify repository install complete ==='
printf 'Repository: %s\n' "$repo"
printf 'Mode:       Codex hook + non-fatal Git hooks + manual refresh\n'
printf 'Refresh:    ./graphify_repo_refresh.sh\n'
printf 'Status:     ./graphify_repo_status.sh\n'
printf 'No watcher, no MCP, no HTTP server.\n'
