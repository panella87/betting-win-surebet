#!/usr/bin/env bash
set -Eeuo pipefail

parse_duration_seconds() {
  local raw="$1" number unit
  if [[ "$raw" =~ ^([1-9][0-9]*)([smhd])$ ]]; then
    number="${BASH_REMATCH[1]}"
    unit="${BASH_REMATCH[2]}"
  else
    printf 'ERROR: duration must match positive integer plus s, m, h, or d: %s\n' "$raw" >&2
    return 2
  fi
  case "$unit" in
    s) printf '%s\n' "$number" ;;
    m) printf '%s\n' "$((number * 60))" ;;
    h) printf '%s\n' "$((number * 3600))" ;;
    d) printf '%s\n' "$((number * 86400))" ;;
  esac
}

main() {
  local repo program_root activation validator state_root state_file
  local global_duration direct_timeout controller_duration global_seconds direct_seconds controller_seconds
  local start_epoch deadline now remaining attempt_seconds
  local task_line order tranche stage mode task_file result_file rc maintenance gate
  local model fallback codex_bin

  repo="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)}"
  program_root="$repo/docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1"
  activation="$program_root/activation"
  validator="$activation/validate_activation_package.py"
  state_root="$repo/artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1"
  state_file="$state_root/campaign-state.json"

  global_duration="${BWS_CAMPAIGN_DURATION:-28d}"
  direct_timeout="${BWS_DIRECT_TRANCHE_TIMEOUT:-12h}"
  controller_duration="${BWS_CONTROLLER_TRANCHE_DURATION:-72h}"
  model="${BWS_MODEL:-cli-default}"
  fallback="${BWS_FALLBACK_MODEL:-none}"
  codex_bin="${BWS_CODEX_BIN:-codex}"

  global_seconds="$(parse_duration_seconds "$global_duration")" || return 2
  direct_seconds="$(parse_duration_seconds "$direct_timeout")" || return 2
  controller_seconds="$(parse_duration_seconds "$controller_duration")" || return 2

  cd "$repo" || return 2
  [[ -f package.json && ! -L package.json ]] || { printf 'ERROR: invalid repository root: %s\n' "$repo" >&2; return 2; }
  python3 -c 'import json; p=json.load(open("package.json")); assert p.get("name")=="betting-win-surebet"' || return 2
  [[ "$(node --version)" == "v20.20.2" ]] || { printf 'ERROR: exact Node v20.20.2 is required; observed %s\n' "$(node --version 2>/dev/null || printf missing)" >&2; return 2; }
  command -v "$codex_bin" >/dev/null 2>&1 || { printf 'ERROR: Codex CLI not found: %s\n' "$codex_bin" >&2; return 2; }
  command -v timeout >/dev/null 2>&1 || { printf 'ERROR: timeout command not found\n' >&2; return 2; }
  command -v python3 >/dev/null 2>&1 || { printf 'ERROR: python3 not found\n' >&2; return 2; }

  (cd "$repo" && sha256sum -c "docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/immutable-authority.sha256") || return 2
  python3 "$validator" --repo "$repo" --static || return 2
  python3 "$validator" --repo "$repo" --init-state || return 2

  if [[ ! -d node_modules ]]; then
    printf 'DEPENDENCY_INSTALL=node_modules_missing_explicit_npm_ci_ignore_scripts\n'
    timeout --foreground 15m npm ci --ignore-scripts || return 2
  fi

  start_epoch="$(date +%s)"
  deadline="$((start_epoch + global_seconds))"

  while true; do
    now="$(date +%s)"
    if (( now >= deadline )); then
      printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
      return 3
    fi

    task_line="$(python3 "$validator" --repo "$repo" --next-task)" || return 2
    if [[ "$task_line" == "COMPLETE" ]]; then
      printf 'BWS_FINAL_REMEDIATION_R01_R12_V1_COMPLETE state=%s\n' "$state_file"
      return 0
    fi

    IFS=$'\t' read -r order tranche stage mode task_file result_file <<< "$task_line"
    [[ "$order" =~ ^[1-9][0-9]*$ && -n "$tranche" && -f "$task_file" ]] || {
      printf 'ERROR: malformed next-task record: %s\n' "$task_line" >&2
      return 2
    }

    printf 'BWS_REMEDIATION_TRANCHE_START order=%s tranche=%s stage=%s mode=%s\n' "$order" "$tranche" "$stage" "$mode"

    if (( order <= 13 )); then
      [[ "$mode" == "DIRECT_BOUNDED_CODEX" ]] || { printf 'ERROR: pre-S2 mode mismatch\n' >&2; return 2; }
      set +e
      BWS_ACTIVE_TRANCHE="$tranche" \
      BWS_CAMPAIGN_ORDER="$order" \
      BWS_CAMPAIGN_STATE_PATH="$state_file" \
      timeout --foreground "$direct_seconds" "$codex_bin" exec -C "$repo" --sandbox danger-full-access "$(cat "$task_file")"
      rc=$?
      set -e
      if (( rc != 0 )); then
        printf 'ERROR: direct bounded tranche failed order=%s tranche=%s exit=%s\n' "$order" "$tranche" "$rc" >&2
        return 2
      fi

      if (( order < 9 )); then
        timeout --foreground 2h npm run build || return 2
        PYTHONDONTWRITEBYTECODE=1 timeout --foreground 120s python3 scripts/validate_repo.py || return 2
        timeout --foreground 20m npm run validate:boundary || return 2
      else
        timeout --foreground 2h npm run validate || return 2
      fi
    else
      [[ "$mode" == "REPAIRED_IMPLEMENTATION_CONTROLLER" ]] || { printf 'ERROR: post-S2 mode mismatch\n' >&2; return 2; }
      python3 "$validator" --repo "$repo" --s2 || return 2
      maintenance="$(awk -F= '$1=="automation_maintenance_allowed" {print $2}' "$task_file")"
      case "$maintenance" in
        yes) gate=1 ;;
        no) gate=0 ;;
        *) printf 'ERROR: invalid protected maintenance marker in %s\n' "$task_file" >&2; return 2 ;;
      esac

      while true; do
        now="$(date +%s)"
        remaining="$((deadline - now))"
        (( remaining > 0 )) || { printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"; return 3; }
        attempt_seconds="$controller_seconds"
        (( remaining < attempt_seconds )) && attempt_seconds="$remaining"
        (( attempt_seconds >= 3600 )) || { printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"; return 3; }

        set +e
        BWS_ACTIVE_TRANCHE="$tranche" \
        BWS_CAMPAIGN_ORDER="$order" \
        BWS_CAMPAIGN_STATE_PATH="$state_file" \
        AUTOMATION_ALLOW_PROTECTED_CHANGES="$gate" \
        bash ./run-autonomous-implementation.sh \
          --duration "$attempt_seconds" \
          --prompt-file "$task_file" \
          --model "$model" \
          --fallback-model "$fallback" \
          --cycle-timeout 2h \
          --validation-timeout 20m \
          --max-cycles 200 \
          --sandbox danger-full-access
        rc=$?
        set -e

        if (( rc == 0 )); then
          break
        fi
        if (( rc == 3 )); then
          printf 'BWS_REMEDIATION_TRANCHE_CONTINUE order=%s tranche=%s\n' "$order" "$tranche"
          continue
        fi
        printf 'ERROR: repaired implementation controller stopped order=%s tranche=%s exit=%s\n' "$order" "$tranche" "$rc" >&2
        return 2
      done
    fi

    (cd "$repo" && sha256sum -c "docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/immutable-authority.sha256") || return 2
    python3 "$validator" --repo "$repo" --static || return 2
    python3 "$validator" --repo "$repo" --result "$tranche" || return 2
    python3 "$validator" --repo "$repo" --advance "$tranche" || return 2
    printf 'BWS_REMEDIATION_TRANCHE_ACCEPTED order=%s tranche=%s\n' "$order" "$tranche"
  done
}

main "$@"
