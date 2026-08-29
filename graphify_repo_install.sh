#!/usr/bin/env bash
# Audit and install a portable Graphify repository integration.
# Default mode is read-only audit. Use --apply explicitly to mutate a repository.
# Integration revision: 2026-08-29.3 (name-independent behavior-based update_git.sh migration).
set -Eeuo pipefail

readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly GRAPHIFY_VERSION_REQUIRED="${GRAPHIFY_VERSION:-0.9.51}"
readonly GRAPHIFY_PACKAGE_SPEC_DEFAULT="graphifyy[gemini,openai]==${GRAPHIFY_VERSION_REQUIRED}"
readonly GRAPHIFY_PACKAGE_SPEC="${GRAPHIFY_PACKAGE_SPEC:-$GRAPHIFY_PACKAGE_SPEC_DEFAULT}"
readonly MANAGED_IGNORE_START="# BEGIN GRAPHIFY_REPO_ONLINE_AI_MANAGED_V2"
readonly MANAGED_IGNORE_END="# END GRAPHIFY_REPO_ONLINE_AI_MANAGED_V2"

mode="audit"
repo_arg=""
package_manager="auto"
assistants="codex"
hook_mode="auto"
track_graph=0
allow_dirty=0
run_refresh=1
build_callflow=0
skip_package=0
backup_root=""
package_changed=0

usage() {
  cat <<USAGE
Usage: $SCRIPT_NAME [--audit|--check|--apply] [options]

Modes:
  --audit                     Read-only report (default); always exits 0.
  --check                     Read-only gate: 0=OK, 3=drift, 4=blocked.
  --apply                     Back up, migrate, install, validate, and refresh.

Options:
  --repo PATH                 Target repository; otherwise resolve from cwd.
  --package-manager auto|uv|pipx
                              Reuse the detected manager; default: auto.
  --assistants codex|antigravity|both|none
                              Project integrations to install. Default: codex.
  --hook-mode auto|native|external|none
                              auto: retain an update_git.sh wrapper when present;
                              otherwise install Graphify's native hooks.
  --track-graph               Make graphify-out eligible for Git tracking.
                              Default is local generated output.
  --allow-dirty               Permit apply when managed tracked files are dirty.
  --no-refresh                Do not run the initial local graph refresh.
  --callflow                  Generate call-flow HTML during initial refresh.
  --skip-package              Do not install/upgrade Graphify; require it already.
  -h, --help                  Show this help.

Pinned package:
  $GRAPHIFY_PACKAGE_SPEC

This package contains hosted Gemini/OpenRouter client support and no Ollama
extra. API keys are never persisted by this script. Unknown Graphify code in
update_git.sh or unknown legacy hook content blocks --apply rather than being
silently overwritten.
USAGE
}

warn() {
  printf 'WARNING: %s\n' "$*" >&2
}

fail() {
  local code="$1"
  shift
  printf 'ERROR: %s\n' "$*" >&2
  exit "$code"
}

parse_args() {
  local selected_mode=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --audit|--check|--apply)
        [ -z "$selected_mode" ] || fail 2 "select only one mode"
        selected_mode="${1#--}"
        mode="$selected_mode"
        shift
        ;;
      --repo)
        [ "$#" -ge 2 ] || fail 2 "--repo requires a path"
        repo_arg="$2"
        shift 2
        ;;
      --repo=*)
        repo_arg="${1#*=}"
        shift
        ;;
      --package-manager)
        [ "$#" -ge 2 ] || fail 2 "--package-manager requires auto, uv, or pipx"
        package_manager="$2"
        shift 2
        ;;
      --package-manager=*)
        package_manager="${1#*=}"
        shift
        ;;
      --assistants)
        [ "$#" -ge 2 ] || fail 2 "--assistants requires codex, antigravity, both, or none"
        assistants="$2"
        shift 2
        ;;
      --assistants=*)
        assistants="${1#*=}"
        shift
        ;;
      --hook-mode)
        [ "$#" -ge 2 ] || fail 2 "--hook-mode requires auto, native, external, or none"
        hook_mode="$2"
        shift 2
        ;;
      --hook-mode=*)
        hook_mode="${1#*=}"
        shift
        ;;
      --track-graph)
        track_graph=1
        shift
        ;;
      --allow-dirty)
        allow_dirty=1
        shift
        ;;
      --no-refresh)
        run_refresh=0
        shift
        ;;
      --callflow)
        build_callflow=1
        shift
        ;;
      --skip-package)
        skip_package=1
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

  case "$package_manager" in auto|uv|pipx) ;; *) fail 2 "invalid package manager: $package_manager" ;; esac
  case "$assistants" in codex|antigravity|both|none) ;; *) fail 2 "invalid assistants value: $assistants" ;; esac
  case "$hook_mode" in auto|native|external|none) ;; *) fail 2 "invalid hook mode: $hook_mode" ;; esac
}

require_python() {
  command -v python3 >/dev/null 2>&1 || fail 127 "python3 is required"
  python3 - <<'PY' || fail 1 "Python version validation failed"
import sys
if sys.version_info < (3, 10):
    raise SystemExit(f"ERROR: Python >=3.10 is required; found {sys.version.split()[0]}")
PY
}

resolve_repo() {
  local start resolved
  start="${repo_arg:-.}"
  resolved="$(git -C "$start" rev-parse --show-toplevel 2>/dev/null)" ||
    fail 2 "not inside a Git repository: $start"
  resolved="$(cd "$resolved" && pwd -P)" || fail 1 "cannot resolve repository root"
  printf '%s\n' "$resolved"
}

script_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P
}

graphify_version() {
  graphify --version 2>/dev/null | awk '{print $NF}' | tr -d '\r' | tail -n 1
}

resolved_graphify_path() {
  local path
  path="$(command -v graphify 2>/dev/null || true)"
  [ -n "$path" ] || return 1
  readlink -f "$path" 2>/dev/null || printf '%s\n' "$path"
}

detect_graphify_manager() {
  local path
  path="$(resolved_graphify_path 2>/dev/null || true)"
  case "$path" in
    */uv/tools/*|*/.local/share/uv/tools/*) printf '%s\n' uv ;;
    */pipx/venvs/*|*/.local/share/pipx/venvs/*|*/.local/pipx/venvs/*) printf '%s\n' pipx ;;
    "") printf '%s\n' missing ;;
    *) printf '%s\n' unmanaged ;;
  esac
}

graphify_has_online_extras() {
  local launcher resolved shebang python_path
  launcher="$(command -v graphify 2>/dev/null || true)"
  [ -n "$launcher" ] || return 1
  resolved="$(readlink -f "$launcher" 2>/dev/null || printf '%s' "$launcher")"
  shebang="$(head -n 1 "$resolved" 2>/dev/null || true)"
  case "$shebang" in
    '#!'*) python_path="${shebang#\#!}" ;;
    *) return 2 ;;
  esac
  [ -x "$python_path" ] || return 2
  "$python_path" -c 'import openai, tiktoken' >/dev/null 2>&1
}

select_package_manager() {
  local detected
  detected="$(detect_graphify_manager)"

  if [ "$package_manager" != "auto" ]; then
    if [ "$detected" != "missing" ] && [ "$detected" != "$package_manager" ]; then
      fail 4 "Graphify is managed by '$detected'; refusing to shadow it with '$package_manager'"
    fi
    printf '%s\n' "$package_manager"
    return 0
  fi

  case "$detected" in
    uv|pipx) printf '%s\n' "$detected" ;;
    unmanaged) printf '%s\n' unmanaged ;;
    missing)
      if command -v uv >/dev/null 2>&1; then
        printf '%s\n' uv
      elif command -v pipx >/dev/null 2>&1; then
        printf '%s\n' pipx
      else
        fail 127 "Graphify is missing and neither uv nor pipx is installed"
      fi
      ;;
  esac
}

ensure_graphify_package() {
  export PATH="$HOME/.local/bin:$PATH"
  local manager found="" needs_install=1

  if [ "$skip_package" = "1" ]; then
    command -v graphify >/dev/null 2>&1 || fail 127 "--skip-package used but graphify is missing"
    found="$(graphify_version)"
    [ "$found" = "$GRAPHIFY_VERSION_REQUIRED" ] ||
      fail 1 "Graphify version mismatch: expected $GRAPHIFY_VERSION_REQUIRED, found ${found:-unknown}"
    graphify_has_online_extras || fail 1 "Graphify hosted-AI extras are not installed"
    printf 'package_reconcile=skipped\n'
    return 0
  fi

  manager="$(select_package_manager)"
  if command -v graphify >/dev/null 2>&1; then
    found="$(graphify_version)"
    if [ "$found" = "$GRAPHIFY_VERSION_REQUIRED" ] && graphify_has_online_extras; then
      needs_install=0
    fi
  fi

  if [ "$needs_install" = "1" ]; then
    [ "$manager" != "unmanaged" ] ||
      fail 4 "existing Graphify is unmanaged and cannot be safely replaced in place"
    printf 'package_install_manager=%s\n' "$manager"
    printf 'package_install_spec=%s\n' "$GRAPHIFY_PACKAGE_SPEC"
    case "$manager" in
      uv)
        command -v uv >/dev/null 2>&1 || fail 127 "uv is not installed"
        uv tool install --force "$GRAPHIFY_PACKAGE_SPEC"
        ;;
      pipx)
        command -v pipx >/dev/null 2>&1 || fail 127 "pipx is not installed"
        pipx install --force "$GRAPHIFY_PACKAGE_SPEC"
        ;;
      *) fail 4 "unsupported package manager state: $manager" ;;
    esac
    package_changed=1
  else
    printf 'package_install=not-needed\n'
  fi

  export PATH="$HOME/.local/bin:$PATH"
  command -v graphify >/dev/null 2>&1 || fail 127 "Graphify installation completed but graphify is not on PATH"
  found="$(graphify_version)"
  [ "$found" = "$GRAPHIFY_VERSION_REQUIRED" ] ||
    fail 1 "Graphify version mismatch after install: expected $GRAPHIFY_VERSION_REQUIRED, found ${found:-unknown}"
  graphify_has_online_extras || fail 1 "Graphify Gemini/OpenAI-compatible extras are unavailable after install"
  printf 'graphify_command=%s\n' "$(command -v graphify)"
  printf 'graphify_version=%s\n' "$found"
}

git_storage_dir() {
  local directory
  directory="$(git rev-parse --git-common-dir)"
  case "$directory" in /*) printf '%s\n' "$directory" ;; *) printf '%s\n' "$repo/$directory" ;; esac
}

ensure_backup_root() {
  if [ -z "$backup_root" ]; then
    local repo_slug
    repo_slug="$(basename "$repo" | tr -c 'A-Za-z0-9._-' '_')"
    backup_root="${XDG_STATE_HOME:-$HOME/.local/state}/graphify-repo-integration/backups/${repo_slug}-$(date -u +%Y%m%dT%H%M%SZ)-$$"
    mkdir -p "$backup_root"
  fi
}

backup_path() {
  local path="$1" base hash destination
  [ -e "$path" ] || return 0
  ensure_backup_root
  base="$(basename "$path")"
  hash="$(printf '%s' "$path" | sha256sum | cut -c1-12)"
  destination="$backup_root/${hash}-${base}"
  cp -a "$path" "$destination"
  printf 'backup=%s -> %s\n' "$path" "$destination"
}

manage_graphifyignore() {
  local action="$1" path="$2"
  python3 - "$action" "$path" "$MANAGED_IGNORE_START" "$MANAGED_IGNORE_END" <<'PY'
from __future__ import annotations
import sys
from pathlib import Path

action, raw_path, new_start, new_end = sys.argv[1:]
path = Path(raw_path)
old_start = "# BEGIN GRAPHIFY_CODE_ONLY_MANAGED"
old_end = "# END GRAPHIFY_CODE_ONLY_MANAGED"
text = path.read_text(encoding="utf-8") if path.exists() else ""

block = f"""{new_start}
# Graphify output and repository internals
graphify-out/
.git/

# Dependencies, generated files, caches, and runtime output
node_modules/
.pnpm-store/
.yarn/
.venv/
venv/
dist/
build/
coverage/
.cache/
.next/
.nuxt/
__pycache__/
*.pyc
artifacts/
logs/
tmp/
temp/
runtime/

# Archives, logs, and local databases
*.log
*.zip
*.tar
*.tar.gz
*.sqlite
*.sqlite3
*.db

# Secrets and private state
.env
.env.*
!.env.example
!.env.sample
!.env.template
*.pem
*.key
*.p12
*.pfx
secrets/
.secrets/
credentials/

# Markdown, MDX, YAML, and text documentation are deliberately included.
# They are sent online only by an explicit --online refresh command.
# Binary/media semantic inputs remain excluded from unattended fleet runs.
*.pdf
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.svg
*.mp3
*.wav
*.mp4
*.mov
{new_end}
"""

def strip_marked(source: str, start: str, end: str) -> tuple[str, bool]:
    has_start = start in source
    has_end = end in source
    if has_start != has_end:
        print(f"BLOCKED: unbalanced markers in {path}: {start} / {end}", file=sys.stderr)
        raise SystemExit(4)
    changed = False
    while start in source:
        before, remainder = source.split(start, 1)
        _, after = remainder.split(end, 1)
        source = before.rstrip() + "\n\n" + after.lstrip("\n")
        changed = True
    return source, changed

def strip_legacy_semantic_sections(source: str) -> tuple[str, bool]:
    """Remove only recognized old global semantic-exclusion stanzas.

    Repository-specific patterns such as docs/private/*.md are preserved. The
    legacy installers emitted a heading followed by global extension patterns;
    those stanzas prevented the new explicit online semantic mode from seeing
    repository documentation.
    """
    known_patterns = {
        "*.md", "*.mdx", "*.pdf", "*.png", "*.jpg", "*.jpeg",
        "*.gif", "*.webp", "*.svg",
    }
    lines = source.splitlines()
    output: list[str] = []
    removed = False
    index = 0
    while index < len(lines):
        heading = lines[index].strip().lower()
        if heading.startswith("# non-code semantic") and "excluded" in heading:
            end = index + 1
            while end < len(lines) and lines[end].strip():
                end += 1
            section = lines[index:end]
            patterns = {
                line.strip()
                for line in section
                if line.strip() and not line.lstrip().startswith("#")
            }
            if {"*.md", "*.mdx"}.issubset(patterns) and patterns.issubset(known_patterns):
                removed = True
                index = end
                while index < len(lines) and not lines[index].strip():
                    index += 1
                if output and output[-1].strip():
                    output.append("")
                continue
        output.append(lines[index])
        index += 1
    return "\n".join(output).rstrip() + ("\n" if output else ""), removed


stripped, had_old = strip_marked(text, old_start, old_end)
stripped, had_new = strip_marked(stripped, new_start, new_end)
stripped, had_unmarked = strip_legacy_semantic_sections(stripped)

base = stripped.strip()
desired = (base + "\n\n" if base else "") + block

if action == "inspect":
    if text == desired:
        print("current")
        raise SystemExit(0)
    if had_old:
        print("legacy-managed")
    elif had_unmarked:
        print("legacy-unmarked")
    elif had_new:
        print("managed-drift")
    elif not text:
        print("missing")
    else:
        print("custom-plus-managed-needed")
    raise SystemExit(3)

if action != "write":
    print(f"BLOCKED: unknown action: {action}", file=sys.stderr)
    raise SystemExit(4)
if text == desired:
    print("unchanged")
else:
    path.write_text(desired, encoding="utf-8")
    print("updated")
PY
}

classify_update_git() {
  local path="$1"
  python3 - "$path" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.exists():
    print("absent")
    raise SystemExit(0)

text = path.read_text(encoding="utf-8")
legacy_tokens = (
    "graphify . --code-only",
    "graphify cluster-only",
    "--no-label",
)
wrapper_tokens = (
    "graphify_repo_refresh.sh",
    "--nonfatal",
)
function_header = re.compile(
    r"(?m)^(?P<indent>[ \t]*)(?:"
    r"function[ \t]+(?P<function_name>[A-Za-z_][A-Za-z0-9_]*)[ \t]*(?:\(\))?"
    r"|(?P<plain_name>[A-Za-z_][A-Za-z0-9_]*)[ \t]*\(\)"
    r")[ \t]*\{[ \t]*(?:#.*)?$"
)


def matching_brace_end(source: str, open_index: int) -> int:
    depth = 0
    quote: str | None = None
    escaped = False
    comment = False
    index = open_index
    while index < len(source):
        char = source[index]
        if comment:
            if char == "\n":
                comment = False
            index += 1
            continue
        if quote is not None:
            if quote in {'"', '`'} and escaped:
                escaped = False
            elif quote in {'"', '`'} and char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue
        if char in {"'", '"', '`'}:
            quote = char
            index += 1
            continue
        if char == "\\":
            index += 2
            continue
        if char == "#" and (
            index == 0
            or source[index - 1].isspace()
            or source[index - 1] in ";|&(){}"
        ):
            comment = True
            index += 1
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1
            if depth < 0:
                raise ValueError("encountered an unmatched closing brace")
        index += 1
    raise ValueError("could not locate the matching function closing brace")


def parsed_functions(source: str) -> list[tuple[str, int, int, str]]:
    parsed: list[tuple[str, int, int, str]] = []
    errors: list[str] = []
    for match in function_header.finditer(source):
        name = match.group("function_name") or match.group("plain_name")
        try:
            end = matching_brace_end(source, match.end() - 1)
        except ValueError as exc:
            next_match = function_header.search(source, match.end())
            provisional_end = next_match.start() if next_match else len(source)
            provisional = source[match.start():provisional_end]
            if any(token in provisional for token in legacy_tokens + wrapper_tokens):
                errors.append(f"{name}: {exc}")
            continue
        parsed.append((name, match.start(), end, source[match.start():end]))
    if errors:
        raise ValueError("; ".join(errors))
    return parsed


try:
    functions = parsed_functions(text)
except ValueError as exc:
    print(f"unknown parse_error={exc}")
    raise SystemExit(4)

legacy = [item for item in functions if all(token in item[3] for token in legacy_tokens)]
wrappers = [item for item in functions if all(token in item[3] for token in wrapper_tokens)]

if legacy:
    if len(legacy) == 1 and not wrappers:
        print("legacy-direct")
        raise SystemExit(3)
    print(
        "unknown "
        f"legacy_candidates={','.join(item[0] for item in legacy) or 'none'} "
        f"wrapper_candidates={','.join(item[0] for item in wrappers) or 'none'}"
    )
    raise SystemExit(4)

if any(token in text for token in legacy_tokens):
    print("unknown legacy_tokens_outside_behavior_matched_function")
    raise SystemExit(4)

if wrappers:
    if len(wrappers) == 1:
        print("wrapper")
        raise SystemExit(0)
    print(f"unknown wrapper_candidates={','.join(item[0] for item in wrappers)}")
    raise SystemExit(4)

if "graphify_repo_refresh.sh" in text or "graphify" in text.lower():
    print("unknown unrecognized_graphify_content")
    raise SystemExit(4)

print("none")
raise SystemExit(0)
PY
}

migrate_legacy_update_git() {
  local path="$1"
  python3 - "$path" <<'PY'
from __future__ import annotations

import os
import re
import stat
import subprocess
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
legacy_tokens = (
    "graphify . --code-only",
    "graphify cluster-only",
    "--no-label",
)
function_header = re.compile(
    r"(?m)^(?P<indent>[ \t]*)(?:"
    r"function[ \t]+(?P<function_name>[A-Za-z_][A-Za-z0-9_]*)[ \t]*(?:\(\))?"
    r"|(?P<plain_name>[A-Za-z_][A-Za-z0-9_]*)[ \t]*\(\)"
    r")[ \t]*\{[ \t]*(?:#.*)?$"
)


def matching_brace_end(source: str, open_index: int) -> int:
    depth = 0
    quote: str | None = None
    escaped = False
    comment = False
    index = open_index
    while index < len(source):
        char = source[index]
        if comment:
            if char == "\n":
                comment = False
            index += 1
            continue
        if quote is not None:
            if quote in {'"', '`'} and escaped:
                escaped = False
            elif quote in {'"', '`'} and char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue
        if char in {"'", '"', '`'}:
            quote = char
            index += 1
            continue
        if char == "\\":
            index += 2
            continue
        if char == "#" and (
            index == 0
            or source[index - 1].isspace()
            or source[index - 1] in ";|&(){}"
        ):
            comment = True
            index += 1
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1
            if depth < 0:
                raise ValueError("encountered an unmatched closing brace")
        index += 1
    raise ValueError("could not locate the matching function closing brace")


candidates: list[tuple[str, int, int, str]] = []
parse_errors: list[str] = []
for match in function_header.finditer(text):
    name = match.group("function_name") or match.group("plain_name")
    try:
        end = matching_brace_end(text, match.end() - 1)
    except ValueError as exc:
        next_match = function_header.search(text, match.end())
        provisional_end = next_match.start() if next_match else len(text)
        provisional = text[match.start():provisional_end]
        if any(token in provisional for token in legacy_tokens):
            parse_errors.append(f"{name}: {exc}")
        continue
    body = text[match.start():end]
    if all(token in body for token in legacy_tokens):
        candidates.append((name, match.start(), end, text[match.start():match.end()]))

if parse_errors:
    raise SystemExit(
        "BLOCKED: could not safely parse a legacy Graphify function: "
        + "; ".join(parse_errors)
    )
if len(candidates) != 1:
    names = ", ".join(candidate[0] for candidate in candidates) or "none"
    raise SystemExit(
        "BLOCKED: expected exactly one behavior-matched legacy Graphify function; "
        f"found {len(candidates)} ({names})"
    )

name, start, end, original_header = candidates[0]
replacement = original_header + r'''
  local graphify_repo

  graphify_repo="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    printf 'WARNING: Graphify refresh skipped because repository root could not be resolved\n' >&2
    return 0
  }

  if [ ! -x "$graphify_repo/graphify_repo_refresh.sh" ]; then
    printf 'WARNING: graphify_repo_refresh.sh is missing or not executable; skipping post-acp refresh\n' >&2
    return 0
  fi

  "$graphify_repo/graphify_repo_refresh.sh" --nonfatal
}'''
new = text[:start] + replacement + text[end:]

new = re.sub(
    r"(?ms)^Graphify:\n.*?(?=^USAGE[ \t]*$)",
    "Graphify:\n"
    "  After a successful --acp commit and push, graphify_repo_refresh.sh runs\n"
    "  in non-fatal local AST mode. Hosted AI is never invoked by update_git.sh.\n",
    new,
    count=1,
)

for forbidden in legacy_tokens:
    if forbidden in new:
        raise SystemExit(
            f"BLOCKED: legacy direct Graphify token remains after migration: {forbidden}"
        )
if '"$graphify_repo/graphify_repo_refresh.sh" --nonfatal' not in new:
    raise SystemExit("BLOCKED: migrated update_git.sh is missing the refresh wrapper call")
if name not in new:
    raise SystemExit(f"BLOCKED: migrated function name was not preserved: {name}")

mode = stat.S_IMODE(path.stat().st_mode)
temporary = path.with_name(path.name + f".graphify-migrate-{os.getpid()}.tmp")
try:
    temporary.write_text(new, encoding="utf-8")
    os.chmod(temporary, mode)
    result = subprocess.run(["bash", "-n", str(temporary)], check=False)
    if result.returncode:
        raise SystemExit("ERROR: migrated update_git.sh failed bash -n; original left unchanged")
    os.replace(temporary, path)
finally:
    temporary.unlink(missing_ok=True)

print(f"migrated-to-wrapper function={name}")
PY
}

hooks_dir() {
  local directory
  directory="$(git rev-parse --git-path hooks 2>/dev/null)" || fail 1 "cannot resolve Git hooks directory"
  case "$directory" in /*) printf '%s\n' "$directory" ;; *) printf '%s\n' "$repo/$directory" ;; esac
}

classify_legacy_hook() {
  local path="$1"
  python3 - "$path" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.is_file():
    print("absent")
    raise SystemExit(0)
text = path.read_text(encoding="utf-8", errors="replace")
if "GRAPHIFY_CODE_ONLY_MANAGED_HOOK" not in text:
    print("none")
    raise SystemExit(0)
required = [
    "graphify_repo_refresh.sh",
    "--nonfatal",
    "Non-fatal local Graphify refresh after Git lifecycle events",
]
if all(token in text for token in required) and "graphify-hook-start" not in text:
    print("legacy-known")
    raise SystemExit(3)
print("unknown")
raise SystemExit(4)
PY
}

legacy_hooks_state() {
  local directory path state rc legacy=0 unknown=0
  directory="$(hooks_dir)"
  for path in "$directory/post-commit" "$directory/post-checkout"; do
    set +e
    state="$(classify_legacy_hook "$path" 2>&1)"
    rc=$?
    set -e
    case "$rc" in
      0) ;;
      3) legacy=1 ;;
      4)
        unknown=1
        printf 'legacy_hook_blocker=%s:%s\n' "$path" "$state" >&2
        ;;
      *) unknown=1 ;;
    esac
  done
  if [ "$unknown" = "1" ]; then printf 'unknown\n'; return 4; fi
  if [ "$legacy" = "1" ]; then printf 'legacy-known\n'; return 3; fi
  printf 'none\n'
  return 0
}

remove_legacy_hooks() {
  local directory path state rc
  directory="$(hooks_dir)"
  for path in "$directory/post-commit" "$directory/post-checkout"; do
    set +e
    state="$(classify_legacy_hook "$path" 2>&1)"
    rc=$?
    set -e
    case "$rc" in
      0) ;;
      3)
        backup_path "$path"
        rm -f "$path"
        printf 'legacy_hook_removed=%s\n' "$path"
        ;;
      4) fail 4 "unknown legacy Graphify hook requires manual review: $path ($state)" ;;
      *) fail 1 "could not classify hook: $path" ;;
    esac
  done
}

managed_dirty_paths=(
  .graphifyignore
  AGENTS.md
  .codex
  .agents
  .antigravity
  .gemini
  .gitattributes
  update_git.sh
)

managed_files_dirty() {
  git status --porcelain --untracked-files=all -- "${managed_dirty_paths[@]}" | grep -q .
}

install_repo_scripts() {
  local source_directory source target temporary
  source_directory="$(script_dir)"
  for source in "$source_directory/graphify_repo_install.sh" "$source_directory/graphify_repo_refresh.sh"; do
    [ -f "$source" ] || fail 4 "required bundle script is missing: $source"
    target="$repo/$(basename "$source")"
    if [ ! -f "$target" ] || ! cmp -s "$source" "$target"; then
      backup_path "$target"
      temporary="$target.tmp.$$"
      cp "$source" "$temporary"
      chmod 0755 "$temporary"
      mv -f "$temporary" "$target"
      printf 'script_installed=%s\n' "$target"
    else
      chmod 0755 "$target"
      printf 'script_current=%s\n' "$target"
    fi
  done
}

inspect_script() {
  local source="$1" target="$2"
  if [ ! -f "$source" ]; then printf 'source-missing\n'; return 4; fi
  if [ -f "$target" ] && cmp -s "$source" "$target"; then printf 'current\n'; return 0; fi
  printf 'missing-or-drift\n'
  return 3
}

configure_graph_output() {
  local exclude_path probe="graphify-out/.graphify-output-probe"
  exclude_path="$(git rev-parse --git-path info/exclude)"
  case "$exclude_path" in /*) ;; *) exclude_path="$repo/$exclude_path" ;; esac
  mkdir -p "$(dirname "$exclude_path")"
  touch "$exclude_path"

  if [ "$track_graph" = "0" ]; then
    if ! git check-ignore -q --no-index "$probe" 2>/dev/null; then
      backup_path "$exclude_path"
      grep -qxF '/graphify-out/' "$exclude_path" 2>/dev/null || printf '/graphify-out/\n' >>"$exclude_path"
    fi
    printf 'graph_output_policy=local\n'
    return 0
  fi

  if grep -qxF '/graphify-out/' "$exclude_path" 2>/dev/null; then
    backup_path "$exclude_path"
    python3 - "$exclude_path" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
lines = [line for line in lines if line.strip() != "/graphify-out/"]
path.write_text("\n".join(lines).rstrip() + ("\n" if lines else ""), encoding="utf-8")
PY
  fi
  if git check-ignore -q --no-index "$probe" 2>/dev/null; then
    fail 4 "--track-graph requested but graphify-out is ignored by .gitignore or another Git exclude source"
  fi
  printf 'graph_output_policy=trackable\n'
}

resolve_hook_mode() {
  local state="$1"
  if [ "$hook_mode" != "auto" ]; then
    printf '%s\n' "$hook_mode"
    return 0
  fi
  case "$state" in
    wrapper|legacy-direct) printf 'external\n' ;;
    none|absent) printf 'native\n' ;;
    *) fail 4 "cannot auto-select hook mode from update_git state: $state" ;;
  esac
}

install_assistants() {
  case "$assistants" in
    none)
      printf 'assistant_integrations=none\n'
      ;;
    codex)
      graphify install --project --platform codex
      printf 'assistant_integrations=codex\n'
      ;;
    antigravity)
      graphify install --project --platform antigravity
      printf 'assistant_integrations=antigravity\n'
      ;;
    both)
      graphify install --project --platform codex
      graphify install --project --platform antigravity
      printf 'assistant_integrations=codex,antigravity\n'
      ;;
  esac
}

codex_state() {
  if [ "$assistants" = "none" ] || [ "$assistants" = "antigravity" ]; then
    printf 'not-requested\n'
    return 0
  fi
  if [ -f "$repo/AGENTS.md" ] && grep -qx '## graphify' "$repo/AGENTS.md" 2>/dev/null; then
    printf 'present\n'
    return 0
  fi
  printf 'missing\n'
  return 3
}

official_hook_state() {
  if ! command -v graphify >/dev/null 2>&1 || [ "$(graphify_version)" != "$GRAPHIFY_VERSION_REQUIRED" ]; then
    printf 'not-checkable\n'
    return 3
  fi
  local output rc
  set +e
  output="$(graphify hook status 2>&1)"
  rc=$?
  set -e
  printf '%s\n' "$output"
  if [ "$rc" != "0" ] || grep -qiE 'not installed|partially|out of date|not registered' <<<"$output"; then
    return 3
  fi
  return 0
}

graph_output_state() {
  if [ -s "$repo/graphify-out/graph.json" ] && [ -s "$repo/graphify-out/GRAPH_REPORT.md" ]; then
    printf 'present\n'
  else
    printf 'missing\n'
    return 3
  fi
}

audit_repo() {
  local ignore_dirty="${1:-0}"
  local drift=0 blocked=0 rc state manager found extras update_state hook_recommendation hook_status output_policy source_directory

  printf '%s\n' '=== Graphify repository audit ==='
  printf 'repository=%s\n' "$repo"
  printf 'required_version=%s\n' "$GRAPHIFY_VERSION_REQUIRED"
  printf 'package_spec=%s\n' "$GRAPHIFY_PACKAGE_SPEC"
  printf 'assistants=%s\n' "$assistants"

  if managed_files_dirty; then
    printf 'managed_files_dirty=yes\n'
    [ "$ignore_dirty" = "1" ] || blocked=1
  else
    printf 'managed_files_dirty=no\n'
  fi

  export PATH="$HOME/.local/bin:$PATH"
  manager="$(detect_graphify_manager)"
  printf 'graphify_manager=%s\n' "$manager"
  if command -v graphify >/dev/null 2>&1; then
    found="$(graphify_version)"
    printf 'graphify_command=%s\n' "$(command -v graphify)"
    printf 'graphify_version=%s\n' "${found:-unknown}"
    [ "$found" = "$GRAPHIFY_VERSION_REQUIRED" ] || drift=1
    if graphify_has_online_extras; then extras=present; else extras=missing-or-unknown; drift=1; fi
    printf 'hosted_ai_extras=%s\n' "$extras"
    if [ "$manager" = "unmanaged" ] && { [ "$found" != "$GRAPHIFY_VERSION_REQUIRED" ] || [ "$extras" != present ]; }; then
      blocked=1
    fi
  else
    printf 'graphify_command=missing\n'
    printf 'graphify_version=missing\n'
    printf 'hosted_ai_extras=missing\n'
    drift=1
  fi

  source_directory="$(script_dir)"
  set +e
  state="$(inspect_script "$source_directory/graphify_repo_install.sh" "$repo/graphify_repo_install.sh")"; rc=$?
  set -e
  printf 'installer_script=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1
  [ "$rc" = "4" ] && blocked=1

  set +e
  state="$(inspect_script "$source_directory/graphify_repo_refresh.sh" "$repo/graphify_repo_refresh.sh")"; rc=$?
  set -e
  printf 'refresh_script=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1
  [ "$rc" = "4" ] && blocked=1

  set +e
  state="$(manage_graphifyignore inspect "$repo/.graphifyignore" 2>&1)"; rc=$?
  set -e
  printf 'graphifyignore=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1
  [ "$rc" = "4" ] && blocked=1

  set +e
  update_state="$(classify_update_git "$repo/update_git.sh" 2>&1)"; rc=$?
  set -e
  printf 'update_git_integration=%s\n' "$update_state"
  [ "$rc" = "3" ] && drift=1
  [ "$rc" = "4" ] && blocked=1

  set +e
  state="$(legacy_hooks_state 2>&1)"; rc=$?
  set -e
  printf 'legacy_hooks=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1
  [ "$rc" = "4" ] && blocked=1

  if [ "$update_state" = "unknown" ]; then
    hook_recommendation=blocked
  else
    set +e
    hook_recommendation="$(resolve_hook_mode "$update_state" 2>&1)"; rc=$?
    set -e
    [ "$rc" = "0" ] || blocked=1
  fi
  printf 'recommended_hook_mode=%s\n' "$hook_recommendation"

  set +e
  hook_status="$(official_hook_state 2>&1)"; rc=$?
  set -e
  printf 'official_hook_status<<EOF\n%s\nEOF\n' "$hook_status"
  if [ "$hook_recommendation" = "native" ]; then
    [ "$rc" = "0" ] || drift=1
  elif [ "$hook_recommendation" = "external" ] || [ "$hook_recommendation" = "none" ]; then
    if [ "$rc" = "0" ]; then drift=1; fi
  fi

  set +e
  state="$(codex_state)"; rc=$?
  set -e
  printf 'codex_integration=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1

  if [ "$track_graph" = "0" ]; then
    if git check-ignore -q --no-index graphify-out/.graphify-output-probe 2>/dev/null; then
      output_policy=local
    else
      output_policy=not-local-yet
      drift=1
    fi
  else
    if git check-ignore -q --no-index graphify-out/.graphify-output-probe 2>/dev/null; then
      output_policy=blocked-by-ignore
      blocked=1
    else
      output_policy=trackable
    fi
  fi
  printf 'graph_output_policy=%s\n' "$output_policy"

  set +e
  state="$(graph_output_state)"; rc=$?
  set -e
  printf 'graph_output=%s\n' "$state"
  [ "$rc" = "3" ] && drift=1

  if [ "$blocked" = "1" ]; then
    printf 'AUDIT_RESULT=BLOCKED\n'
    return 4
  fi
  if [ "$drift" = "1" ]; then
    printf 'AUDIT_RESULT=DRIFT\n'
    return 3
  fi
  printf 'AUDIT_RESULT=OK\n'
  return 0
}

write_graphifyignore_if_needed() {
  local state rc
  set +e
  state="$(manage_graphifyignore inspect "$repo/.graphifyignore" 2>&1)"; rc=$?
  set -e
  case "$rc" in
    0) printf 'graphifyignore=current\n' ;;
    3)
      backup_path "$repo/.graphifyignore"
      manage_graphifyignore write "$repo/.graphifyignore"
      ;;
    4) fail 4 "$state" ;;
    *) fail 1 "could not inspect .graphifyignore" ;;
  esac
}

apply_repo() {
  local update_state state rc selected_hook hook_status
  printf '%s\n' '=== Graphify repository apply ==='
  printf 'repository=%s\n' "$repo"

  set +e
  update_state="$(classify_update_git "$repo/update_git.sh" 2>&1)"; rc=$?
  set -e
  [ "$rc" != "4" ] || fail 4 "unknown Graphify integration in update_git.sh requires manual review"

  set +e
  state="$(legacy_hooks_state 2>&1)"; rc=$?
  set -e
  [ "$rc" != "4" ] || fail 4 "unknown legacy Graphify hook requires manual review"

  if managed_files_dirty && [ "$allow_dirty" != "1" ]; then
    git status --short -- "${managed_dirty_paths[@]}" >&2 || true
    fail 4 "managed files have uncommitted changes; rerun after committing/reverting or use --allow-dirty"
  fi

  ensure_graphify_package
  install_repo_scripts

  # Migrate the legacy update_git.sh integration before mutating other tracked
  # repository files. If this conservative migration blocks, the repository is
  # left unchanged apart from non-repository backups and package reconciliation.
  if [ "$update_state" = "legacy-direct" ]; then
    backup_path "$repo/update_git.sh"
    migrate_legacy_update_git "$repo/update_git.sh"
    update_state=wrapper
  fi

  write_graphifyignore_if_needed
  configure_graph_output

  selected_hook="$(resolve_hook_mode "$update_state")"
  printf 'selected_hook_mode=%s\n' "$selected_hook"

  remove_legacy_hooks
  backup_path "$repo/AGENTS.md"
  backup_path "$repo/.codex"
  backup_path "$repo/.agents"
  backup_path "$repo/.antigravity"
  backup_path "$repo/.gemini"
  install_assistants

  case "$selected_hook" in
    native)
      backup_path "$(hooks_dir)/post-commit"
      backup_path "$(hooks_dir)/post-checkout"
      backup_path "$repo/.gitattributes"
      graphify hook install
      ;;
    external|none)
      backup_path "$(hooks_dir)/post-commit"
      backup_path "$(hooks_dir)/post-checkout"
      backup_path "$repo/.gitattributes"
      graphify hook uninstall >/dev/null 2>&1 || true
      ;;
    *) fail 4 "unsupported resolved hook mode: $selected_hook" ;;
  esac

  bash -n "$repo/graphify_repo_install.sh"
  bash -n "$repo/graphify_repo_refresh.sh"
  [ ! -f "$repo/update_git.sh" ] || bash -n "$repo/update_git.sh"
  git diff --check -- graphify_repo_install.sh graphify_repo_refresh.sh .graphifyignore AGENTS.md .codex .agents .antigravity .gemini .gitattributes update_git.sh

  if [ "$run_refresh" = "1" ]; then
    refresh_args=(--repo "$repo")
    [ "$build_callflow" = "1" ] && refresh_args+=(--callflow)
    "$repo/graphify_repo_refresh.sh" "${refresh_args[@]}"
  fi

  printf '%s\n' '=== Post-apply audit ==='
  if audit_repo 1; then rc=0; else rc=$?; fi
  [ "$rc" = "0" ] || fail "$rc" "post-apply audit did not reach OK"
  [ -z "$backup_root" ] || printf 'backup_root=%s\n' "$backup_root"
  printf '%s\n' 'GRAPHIFY_REPO_APPLY_OK'
}

parse_args "$@"
require_python
repo="$(resolve_repo)"
cd "$repo" || fail 1 "cannot cd to repository root: $repo"

case "$mode" in
  audit)
    if audit_repo; then rc=0; else rc=$?; fi
    [ "$rc" = "4" ] && warn "audit found blockers"
    [ "$rc" = "3" ] && warn "audit found configuration drift"
    exit 0
    ;;
  check)
    if audit_repo; then exit 0; else exit $?; fi
    ;;
  apply)
    apply_repo
    ;;
  *) fail 2 "internal mode error: $mode" ;;
esac
