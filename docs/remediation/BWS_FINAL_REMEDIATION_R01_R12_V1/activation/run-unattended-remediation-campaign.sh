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

run_repository_validation() {
  local repo="$1" order="$2"
  if (( order < 9 )); then
    timeout --foreground 2h npm run build || return 2
    PYTHONDONTWRITEBYTECODE=1 timeout --foreground 120s python3 scripts/validate_repo.py || return 2
    timeout --foreground 20m npm run validate:boundary || return 2
  else
    timeout --foreground 2h npm run validate || return 2
  fi
}

verify_immutable_activation() {
  local repo="$1" validator="$2"
  (
    cd "$repo"
    sha256sum -c "docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/immutable-authority.sha256"
  ) || return 2
  python3 "$validator" --repo "$repo" --static || return 2
}

finalize_result() {
  local repo="$1" validator="$2" order="$3" tranche="$4" command_rc="$5"
  local output state

  verify_immutable_activation "$repo" "$validator" || return 2
  output="$(python3 "$validator" --repo "$repo" --result "$tranche")" || return 2
  printf '%s\n' "$output"
  state="$(printf '%s\n' "$output" | awk -F= '$1=="BWS_REMEDIATION_TRANCHE_RESULT_STATE" {print $2}')"

  case "$state" in
    ACCEPTED)
      if (( command_rc != 0 )); then
        printf 'ERROR: tranche reported ACCEPTED after command failure order=%s tranche=%s exit=%s\n' \
          "$order" "$tranche" "$command_rc" >&2
        return 2
      fi
      run_repository_validation "$repo" "$order" || return 2
      verify_immutable_activation "$repo" "$validator" || return 2
      python3 "$validator" --repo "$repo" --result "$tranche" || return 2
      python3 "$validator" --repo "$repo" --advance "$tranche" || return 2
      printf 'BWS_REMEDIATION_TRANCHE_ACCEPTED order=%s tranche=%s\n' "$order" "$tranche"
      return 0
      ;;
    BLOCKED|SOURCE_COMPLETE_EXTERNAL_PENDING)
      python3 "$validator" --repo "$repo" --advance "$tranche" || return 2
      printf 'BWS_REMEDIATION_CAMPAIGN_STOPPED order=%s tranche=%s state=%s command_exit=%s\n' \
        "$order" "$tranche" "$state" "$command_rc"
      return 10
      ;;
    *)
      printf 'ERROR: validator returned no supported terminal result state for %s\n' "$tranche" >&2
      return 2
      ;;
  esac
}

campaign_main() {
  local repo program_root activation validator state_root state_file
  local global_duration direct_timeout controller_duration global_seconds direct_seconds controller_seconds
  local deadline now remaining attempt_seconds
  local task_line order tranche stage mode task_file result_file rc maintenance gate
  local model fallback codex_bin result_finalize_rc window_output

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
  [[ -f package.json && ! -L package.json ]] || {
    printf 'ERROR: invalid repository root: %s\n' "$repo" >&2
    return 2
  }
  python3 -c 'import json; p=json.load(open("package.json")); assert p.get("name")=="betting-win-surebet"' || return 2
  [[ "$(node --version)" == "v20.20.2" ]] || {
    printf 'ERROR: exact Node v20.20.2 is required; observed %s\n' "$(node --version 2>/dev/null || printf missing)" >&2
    return 2
  }
  command -v "$codex_bin" >/dev/null 2>&1 || {
    printf 'ERROR: Codex CLI not found: %s\n' "$codex_bin" >&2
    return 2
  }
  command -v timeout >/dev/null 2>&1 || {
    printf 'ERROR: timeout command not found\n' >&2
    return 2
  }
  command -v python3 >/dev/null 2>&1 || {
    printf 'ERROR: python3 not found\n' >&2
    return 2
  }

  verify_immutable_activation "$repo" "$validator" || return 2
  python3 "$validator" --repo "$repo" --init-state || return 2
  window_output="$(python3 "$validator" --repo "$repo" --window-seconds "$global_seconds")" || return 2
  printf '%s\n' "$window_output"
  deadline="$(printf '%s\n' "$window_output" | awk -F= '$1=="BWS_REMEDIATION_OPERATOR_WINDOW_DEADLINE_EPOCH" {print $2}')"
  [[ "$deadline" =~ ^[1-9][0-9]*$ ]] || {
    printf 'ERROR: validator returned no authoritative campaign deadline\n' >&2
    return 2
  }

  if [[ ! -d node_modules ]]; then
    printf 'DEPENDENCY_INSTALL=node_modules_missing_explicit_npm_ci_ignore_scripts\n'
    timeout --foreground 15m npm ci --ignore-scripts || return 2
  fi

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
    [[ "$order" =~ ^[1-9][0-9]*$ && -n "$tranche" && -f "$task_file" && ! -L "$task_file" ]] || {
      printf 'ERROR: malformed next-task record: %s\n' "$task_line" >&2
      return 2
    }

    printf 'BWS_REMEDIATION_TRANCHE_START order=%s tranche=%s stage=%s mode=%s\n' \
      "$order" "$tranche" "$stage" "$mode"
    python3 "$validator" --repo "$repo" --prepare "$tranche" || return 2

    if [[ -f "$result_file" && ! -L "$result_file" ]]; then
      set +e
      finalize_result "$repo" "$validator" "$order" "$tranche" 0
      result_finalize_rc=$?
      set -e
      case "$result_finalize_rc" in
        0) continue ;;
        10) return 4 ;;
        *) return "$result_finalize_rc" ;;
      esac
    fi

    rc=0
    if (( order <= 13 )); then
      [[ "$mode" == "DIRECT_BOUNDED_CODEX" ]] || {
        printf 'ERROR: pre-S2 mode mismatch\n' >&2
        return 2
      }
      now="$(date +%s)"
      remaining="$((deadline - now))"
      (( remaining > 0 )) || {
        printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
        return 3
      }
      attempt_seconds="$direct_seconds"
      (( remaining < attempt_seconds )) && attempt_seconds="$remaining"

      set +e
      BWS_ACTIVE_TRANCHE="$tranche" \
      BWS_CAMPAIGN_ORDER="$order" \
      BWS_CAMPAIGN_STATE_PATH="$state_file" \
      BWS_TRANCHE_PREIMAGE_PATH="$(python3 -c 'import sys; from pathlib import Path; print(Path(sys.argv[1]) / "artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/preimages" / f"{int(sys.argv[2]):03d}-{sys.argv[3]}.json")' "$repo" "$order" "$tranche")" \
      timeout --foreground "$attempt_seconds" "$codex_bin" exec -C "$repo" --sandbox danger-full-access "$(cat "$task_file")"
      rc=$?
      set -e
    else
      [[ "$mode" == "REPAIRED_IMPLEMENTATION_CONTROLLER" ]] || {
        printf 'ERROR: post-S2 mode mismatch\n' >&2
        return 2
      }
      python3 "$validator" --repo "$repo" --s2 || return 2
      maintenance="$(awk -F= '$1=="automation_maintenance_allowed" {print $2}' "$task_file")"
      case "$maintenance" in
        yes) gate=1 ;;
        no) gate=0 ;;
        *)
          printf 'ERROR: invalid protected maintenance marker in %s\n' "$task_file" >&2
          return 2
          ;;
      esac

      while true; do
        now="$(date +%s)"
        remaining="$((deadline - now))"
        (( remaining > 0 )) || {
          printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
          return 3
        }
        attempt_seconds="$controller_seconds"
        (( remaining < attempt_seconds )) && attempt_seconds="$remaining"
        (( attempt_seconds >= 3600 )) || {
          printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
          return 3
        }

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

        if [[ -f "$result_file" && ! -L "$result_file" ]]; then
          break
        fi
        if (( rc == 3 )); then
          printf 'BWS_REMEDIATION_TRANCHE_CONTINUE order=%s tranche=%s\n' "$order" "$tranche"
          continue
        fi
        if (( rc == 0 )); then
          printf 'ERROR: repaired implementation controller returned success without a tranche result order=%s tranche=%s\n' \
            "$order" "$tranche" >&2
        else
          printf 'ERROR: repaired implementation controller stopped without a tranche result order=%s tranche=%s exit=%s\n' \
            "$order" "$tranche" "$rc" >&2
        fi
        return 2
      done
    fi

    if [[ ! -f "$result_file" || -L "$result_file" ]]; then
      printf 'ERROR: tranche command ended without a safe result receipt order=%s tranche=%s exit=%s\n' \
        "$order" "$tranche" "$rc" >&2
      return 2
    fi

    set +e
    finalize_result "$repo" "$validator" "$order" "$tranche" "$rc"
    result_finalize_rc=$?
    set -e
    case "$result_finalize_rc" in
      0) ;;
      10) return 4 ;;
      *) return "$result_finalize_rc" ;;
    esac
  done
}

run_with_campaign_lock() {
  local repo script state_root lock_file rc
  repo="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)}"
  script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/$(basename "${BASH_SOURCE[0]}")"

  if [[ "${BWS_REMEDIATION_CAMPAIGN_LOCK_HELD:-0}" == "1" ]]; then
    campaign_main "$@"
    return $?
  fi

  command -v flock >/dev/null 2>&1 || {
    printf 'ERROR: flock command not found\n' >&2
    return 2
  }
  state_root="$repo/artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1"
  mkdir -p "$state_root"
  lock_file="$state_root/campaign-launcher.lock"

  set +e
  flock -n -E 75 "$lock_file" \
    env BWS_REMEDIATION_CAMPAIGN_LOCK_HELD=1 REPO_DIR="$repo" \
    bash "$script" "$@"
  rc=$?
  set -e

  if (( rc == 75 )); then
    printf 'ERROR: another remediation campaign launcher owns %s\n' "$lock_file" >&2
  fi
  return "$rc"
}

run_with_campaign_lock "$@"
