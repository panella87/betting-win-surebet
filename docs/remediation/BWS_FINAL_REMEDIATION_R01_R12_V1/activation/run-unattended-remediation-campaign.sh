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
  (
    cd "$repo"
    if (( order < 9 )); then
      timeout --foreground 2h npm run build || return 2
      PYTHONDONTWRITEBYTECODE=1 timeout --foreground 120s python3 scripts/validate_repo.py || return 2
      timeout --foreground 20m npm run validate:boundary || return 2
    else
      timeout --foreground 2h npm run validate || return 2
    fi
  )
}

verify_immutable_activation() {
  local repo="$1" validator="$2" manifest_rel state_file committed_manifest authority_commit current_commit
  manifest_rel="docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/immutable-authority.sha256"
  state_file="$repo/artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json"
  current_commit="$(git -C "$repo" rev-parse --verify HEAD 2>/dev/null)" || return 2
  authority_commit="$current_commit"
  if [[ -f "$state_file" && ! -L "$state_file" ]]; then
    authority_commit="$(python3 - "$state_file" <<'PY'
import json,re,sys
value=json.load(open(sys.argv[1], encoding='utf-8')).get('initial_git',{}).get('commit')
if not isinstance(value,str) or re.fullmatch(r'(?:[0-9a-f]{40}|[0-9a-f]{64})',value) is None:
    raise SystemExit(2)
print(value)
PY
)" || return 2
  fi
  [[ "$current_commit" == "$authority_commit" ]] || {
    printf 'ERROR: Git HEAD changed after campaign admission: expected=%s observed=%s
' "$authority_commit" "$current_commit" >&2
    return 2
  }
  committed_manifest="$(mktemp)" || return 2
  if ! (
    cd "$repo"
    git show "$authority_commit:$manifest_rel" > "$committed_manifest"
    cmp -s -- "$committed_manifest" "$manifest_rel"
    git diff --quiet -- "$manifest_rel"
    git diff --cached --quiet -- "$manifest_rel"
    sha256sum -c "$committed_manifest" >/dev/null
  ); then
    rm -f -- "$committed_manifest"
    printf 'ERROR: immutable activation authority differs from the campaign-admission Git commit or a pinned postimage
' >&2
    return 2
  fi
  rm -f -- "$committed_manifest"
  python3 "$validator" --repo "$repo" --static || return 2
}

capture_runtime_guard() {
  local state_file="$1" preimage_file="$2"
  [[ -f "$state_file" && ! -L "$state_file" && -f "$preimage_file" && ! -L "$preimage_file" ]] || return 2
  printf '%s	%s
' "$(sha256sum -- "$state_file" | awk '{print $1}')" "$(sha256sum -- "$preimage_file" | awk '{print $1}')"
}

verify_runtime_guard() {
  local state_file="$1" preimage_file="$2" expected_state="$3" expected_preimage="$4"
  [[ -f "$state_file" && ! -L "$state_file" && -f "$preimage_file" && ! -L "$preimage_file" ]] || {
    printf 'ERROR: campaign state or tranche preimage disappeared during child execution
' >&2
    return 2
  }
  [[ "$(sha256sum -- "$state_file" | awk '{print $1}')" == "$expected_state" ]] || {
    printf 'ERROR: campaign state was modified outside the launcher-owned transition
' >&2
    return 2
  }
  [[ "$(sha256sum -- "$preimage_file" | awk '{print $1}')" == "$expected_preimage" ]] || {
    printf 'ERROR: tranche preimage was modified during child execution
' >&2
    return 2
  }
}

verify_campaign_lock_identity() {
  local lock_path="${BWS_REMEDIATION_CAMPAIGN_LOCK_PATH:-}"
  local expected_identity="${BWS_REMEDIATION_CAMPAIGN_LOCK_IDENTITY:-}" observed_identity
  [[ -n "$lock_path" && -n "$expected_identity" ]] || {
    printf 'ERROR: campaign lock identity was not supplied to the locked launcher
' >&2
    return 2
  }
  [[ -f "$lock_path" && ! -L "$lock_path" ]] || {
    printf 'ERROR: campaign lock path was removed, replaced, or made unsafe: %s
' "$lock_path" >&2
    return 2
  }
  observed_identity="$(stat -Lc '%d:%i' -- "$lock_path")" || return 2
  [[ "$observed_identity" == "$expected_identity" ]] || {
    printf 'ERROR: campaign lock inode changed during execution: expected=%s observed=%s
' "$expected_identity" "$observed_identity" >&2
    return 2
  }
}

assert_no_controller_locks() {
  local repo="$1" lock found=0
  while IFS= read -r -d '' lock; do
    found=1
    if [[ ! -f "$lock" || -L "$lock" ]]; then
      printf 'ERROR: incompatible controller lock is not a safe regular file: %s\n' "$lock" >&2
    else
      printf 'ERROR: pre-S2 direct cycle refuses existing controller lock: %s\n' "$lock" >&2
      sed -n '1,80p' "$lock" >&2 || true
    fi
  done < <(find "$repo/.automation/locks" -maxdepth 1 -name '*.lock' -print0 2>/dev/null || true)
  (( found == 0 )) || return 27
}

build_composite_prompt() {
  local contract="$1" task="$2" destination="$3"
  [[ -f "$contract" && ! -L "$contract" && -f "$task" && ! -L "$task" ]] || return 2
  mkdir -p "$(dirname "$destination")"
  {
    printf '%s\n\n' '# Binding bounded-tranche execution contract'
    cat "$contract"
    printf '%s\n\n' '# Exact active tranche task'
    cat "$task"
    printf '%s\n' '# Trusted evidence replay requirement'
    printf '%s\n' 'The launcher independently re-executes every declared test command. Each command must be an argv array, reference its exact test requirement ID in argv or a referenced repository test file, and bind required production-entrypoint tests to the relevant production source path. Do not use shell -c, placeholders, hashes from unrun commands, generic npm test as a substitute, or commands that contact providers or mutate external systems.'
  } > "$destination"
  chmod 0600 "$destination"
}

quarantine_invalid_result() {
  local state_root="$1" order="$2" tranche="$3" result_file="$4" reason="$5"
  local destination_root timestamp suffix attestation
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  destination_root="$state_root/invalid-results"
  mkdir -p "$destination_root"
  chmod 0700 "$destination_root"
  suffix="$(printf '%s' "$reason" | tr -c 'A-Za-z0-9._-' '_' | cut -c1-80)"
  if [[ -f "$result_file" && ! -L "$result_file" ]]; then
    mv -- "$result_file" "$destination_root/$(printf '%03d' "$order")-$tranche-$timestamp-$suffix.json"
  fi
  attestation="$state_root/trusted-evidence/$(printf '%03d' "$order")-$tranche.json"
  if [[ -f "$attestation" && ! -L "$attestation" ]]; then
    mv -- "$attestation" "$destination_root/$(printf '%03d' "$order")-$tranche-$timestamp-$suffix.attestation.json"
  fi
}

finalize_result() {
  local repo="$1" validator="$2" verifier="$3" order="$4" tranche="$5" command_rc="$6"
  local state_file="$7" preimage_file="$8" expected_state="$9" expected_preimage="${10}"
  local output state

  verify_campaign_lock_identity || return 2
  verify_immutable_activation "$repo" "$validator" || return 2
  python3 "$verifier" --repo "$repo" --tranche "$tranche" || return 2
  verify_runtime_guard "$state_file" "$preimage_file" "$expected_state" "$expected_preimage" || return 2
  verify_campaign_lock_identity || return 2
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
      verify_runtime_guard "$state_file" "$preimage_file" "$expected_state" "$expected_preimage" || return 2
      verify_campaign_lock_identity || return 2
      verify_immutable_activation "$repo" "$validator" || return 2
      python3 "$validator" --repo "$repo" --result "$tranche" || return 2
      python3 "$validator" --repo "$repo" --advance "$tranche" || return 2
      printf 'BWS_REMEDIATION_TRANCHE_ACCEPTED order=%s tranche=%s\n' "$order" "$tranche"
      return 0
      ;;
    BLOCKED|SOURCE_COMPLETE_EXTERNAL_PENDING)
      verify_runtime_guard "$state_file" "$preimage_file" "$expected_state" "$expected_preimage" || return 2
      verify_campaign_lock_identity || return 2
      verify_immutable_activation "$repo" "$validator" || return 2
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
  local repo program_root activation validator verifier supervisor contract state_root state_file prompt_root
  local global_duration direct_timeout controller_duration global_seconds direct_seconds controller_seconds
  local deadline now remaining attempt_seconds controller_budget attempt max_attempts retry_delay
  local task_line order tranche stage mode task_file result_file rc maintenance gate
  local model fallback codex_bin result_finalize_rc window_output prompt_file preimage_file
  local runtime_guard expected_state_sha expected_preimage_sha
  local -a codex_args

  repo="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd -P)}"
  program_root="$repo/docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1"
  activation="$program_root/activation"
  validator="$activation/validate_activation_package.py"
  verifier="$repo/scripts/validate_remediation_tranche_evidence.py"
  supervisor="$repo/scripts/run_bounded_remediation_child.py"
  contract="$activation/bounded-tranche-task-contract.md"
  state_root="$repo/artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1"
  state_file="$state_root/campaign-state.json"
  prompt_root="$state_root/prompts"

  global_duration="${BWS_CAMPAIGN_DURATION:-28d}"
  direct_timeout="${BWS_DIRECT_TRANCHE_TIMEOUT:-12h}"
  controller_duration="${BWS_CONTROLLER_TRANCHE_DURATION:-72h}"
  max_attempts="${BWS_MAX_DIRECT_ATTEMPTS_PER_TRANCHE:-32}"
  retry_delay="${BWS_DIRECT_RETRY_DELAY_SECONDS:-30}"
  model="${BWS_MODEL:-cli-default}"
  fallback="${BWS_FALLBACK_MODEL:-none}"
  codex_bin="${BWS_CODEX_BIN:-codex}"

  [[ "$max_attempts" =~ ^[1-9][0-9]*$ && "$retry_delay" =~ ^[0-9]+$ ]] || {
    printf 'ERROR: invalid direct retry configuration\n' >&2
    return 2
  }
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
  for command in timeout python3 flock sha256sum git; do
    command -v "$command" >/dev/null 2>&1 || {
      printf 'ERROR: required command not found: %s\n' "$command" >&2
      return 2
    }
  done
  [[ -f "$verifier" && ! -L "$verifier" ]] || {
    printf 'ERROR: trusted evidence verifier is missing or unsafe: %s\n' "$verifier" >&2
    return 2
  }
  [[ -x "$supervisor" && ! -L "$supervisor" ]] || {
    printf 'ERROR: bounded child supervisor is missing, non-executable, or unsafe: %s\n' "$supervisor" >&2
    return 2
  }

  verify_campaign_lock_identity || return 2
  verify_immutable_activation "$repo" "$validator" || return 2
  if [[ ! -f "$state_file" ]]; then
    [[ -z "$(git status --porcelain=v1 --untracked-files=no)" ]] || {
      printf 'ERROR: first campaign launch requires no tracked or staged changes\n' >&2
      return 2
    }
  fi
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
    preimage_file="$state_root/preimages/$(printf '%03d' "$order")-$tranche.json"
    runtime_guard="$(capture_runtime_guard "$state_file" "$preimage_file")" || return 2
    IFS=$'\t' read -r expected_state_sha expected_preimage_sha <<< "$runtime_guard"
    [[ "$expected_state_sha" =~ ^[0-9a-f]{64}$ && "$expected_preimage_sha" =~ ^[0-9a-f]{64}$ ]] || return 2
    prompt_file="$prompt_root/$(printf '%03d' "$order")-$tranche.md"
    build_composite_prompt "$contract" "$task_file" "$prompt_file" || return 2

    if [[ -f "$result_file" && ! -L "$result_file" ]]; then
      verify_runtime_guard "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha" || return 2
      set +e
      finalize_result "$repo" "$validator" "$verifier" "$order" "$tranche" 0 \
        "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha"
      result_finalize_rc=$?
      set -e
      case "$result_finalize_rc" in
        0) continue ;;
        10) return 4 ;;
        *)
          quarantine_invalid_result "$state_root" "$order" "$tranche" "$result_file" "resume-validation-failed"
          ;;
      esac
    fi

    rc=0
    if (( order <= 13 )); then
      [[ "$mode" == "DIRECT_BOUNDED_CODEX" ]] || {
        printf 'ERROR: pre-S2 mode mismatch\n' >&2
        return 2
      }
      assert_no_controller_locks "$repo" || return $?
      attempt=0
      while [[ ! -f "$result_file" ]]; do
        attempt="$((attempt + 1))"
        (( attempt <= max_attempts )) || {
          printf 'ERROR: direct tranche attempt ceiling reached order=%s tranche=%s attempts=%s\n' \
            "$order" "$tranche" "$attempt" >&2
          return 2
        }
        now="$(date +%s)"
        remaining="$((deadline - now))"
        (( remaining >= 300 )) || {
          printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
          return 3
        }
        attempt_seconds="$direct_seconds"
        (( remaining < attempt_seconds )) && attempt_seconds="$remaining"
        codex_args=("$codex_bin" exec -C "$repo" --sandbox danger-full-access)
        [[ "$model" == "cli-default" ]] || codex_args+=(-m "$model")

        printf 'BWS_REMEDIATION_DIRECT_ATTEMPT order=%s tranche=%s attempt=%s timeout_seconds=%s\n' \
          "$order" "$tranche" "$attempt" "$attempt_seconds"
        set +e
        BWS_ACTIVE_TRANCHE="$tranche" \
        BWS_CAMPAIGN_ORDER="$order" \
        BWS_CAMPAIGN_STATE_PATH="$state_file" \
        BWS_TRANCHE_PREIMAGE_PATH="$state_root/preimages/$(printf '%03d' "$order")-$tranche.json" \
        python3 "$supervisor" \
          --repo "$repo" \
          --timeout-seconds "$attempt_seconds" \
          --label "direct-$(printf '%03d' "$order")-$tranche-attempt-$attempt" \
          -- "${codex_args[@]}" "$(cat "$prompt_file")"
        rc=$?
        set -e
        verify_runtime_guard "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha" || return 2
        verify_campaign_lock_identity || return 2
        verify_immutable_activation "$repo" "$validator" || return 2

        if [[ -f "$result_file" && ! -L "$result_file" ]]; then
          break
        fi
        printf 'BWS_REMEDIATION_DIRECT_RETRY order=%s tranche=%s attempt=%s exit=%s\n' \
          "$order" "$tranche" "$attempt" "$rc"
        if [[ "$fallback" != "none" && "$fallback" != "cli-default" ]]; then
          model="$fallback"
        fi
        (( retry_delay == 0 )) || sleep "$retry_delay"
        assert_no_controller_locks "$repo" || return $?
        python3 "$validator" --repo "$repo" --prepare "$tranche" || return 2
      done
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
        (( remaining >= 3600 )) || {
          printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
          return 3
        }
        attempt_seconds="$controller_seconds"
        (( remaining < attempt_seconds )) && attempt_seconds="$remaining"

        controller_budget="$((attempt_seconds - 300))"
        (( controller_budget >= 300 )) || {
          printf 'BWS_REMEDIATION_CAMPAIGN_WINDOW_EXHAUSTED state=%s\n' "$state_file"
          return 3
        }
        set +e
        BWS_ACTIVE_TRANCHE="$tranche" \
        BWS_CAMPAIGN_ORDER="$order" \
        BWS_CAMPAIGN_STATE_PATH="$state_file" \
        AUTOMATION_ALLOW_PROTECTED_CHANGES="$gate" \
        python3 "$supervisor" \
          --repo "$repo" \
          --timeout-seconds "$attempt_seconds" \
          --label "controller-$(printf '%03d' "$order")-$tranche" \
          -- bash ./run-autonomous-implementation.sh \
            --duration "${controller_budget}s" \
            --prompt-file "$prompt_file" \
            --model "$model" \
            --fallback-model "$fallback" \
            --cycle-timeout 2h \
            --validation-timeout 20m \
            --max-cycles 200 \
            --sandbox danger-full-access
        rc=$?
        set -e
        verify_runtime_guard "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha" || return 2
        verify_campaign_lock_identity || return 2
        verify_immutable_activation "$repo" "$validator" || return 2

        if [[ -f "$result_file" && ! -L "$result_file" ]]; then
          break
        fi
        if (( rc == 3 )); then
          printf 'BWS_REMEDIATION_TRANCHE_CONTINUE order=%s tranche=%s\n' "$order" "$tranche"
          continue
        fi
        printf 'ERROR: repaired implementation controller stopped without a tranche result order=%s tranche=%s exit=%s\n' \
          "$order" "$tranche" "$rc" >&2
        return 2
      done
    fi

    if [[ ! -f "$result_file" || -L "$result_file" ]]; then
      printf 'ERROR: tranche command ended without a safe result receipt order=%s tranche=%s exit=%s\n' \
        "$order" "$tranche" "$rc" >&2
      return 2
    fi

    verify_runtime_guard "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha" || return 2
    set +e
    finalize_result "$repo" "$validator" "$verifier" "$order" "$tranche" "$rc" \
      "$state_file" "$preimage_file" "$expected_state_sha" "$expected_preimage_sha"
    result_finalize_rc=$?
    set -e
    case "$result_finalize_rc" in
      0) ;;
      10) return 4 ;;
      *)
        quarantine_invalid_result "$state_root" "$order" "$tranche" "$result_file" "validation-failed"
        if (( order <= 13 )); then
          printf 'BWS_REMEDIATION_INVALID_RESULT_RETRY order=%s tranche=%s\n' "$order" "$tranche"
          continue
        fi
        return "$result_finalize_rc"
        ;;
    esac
  done
}

run_with_campaign_lock() {
  local repo script state_root lock_file lock_identity rc
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
  [[ -d "$state_root" && ! -L "$state_root" ]] || {
    printf 'ERROR: unsafe remediation campaign state root: %s\n' "$state_root" >&2
    return 2
  }
  lock_file="$state_root/campaign-launcher.lock"
  if [[ -e "$lock_file" || -L "$lock_file" ]]; then
    [[ -f "$lock_file" && ! -L "$lock_file" ]] || {
      printf 'ERROR: unsafe remediation campaign lock path: %s\n' "$lock_file" >&2
      return 2
    }
  else
    : > "$lock_file"
    chmod 0600 "$lock_file"
  fi
  lock_identity="$(stat -Lc '%d:%i' -- "$lock_file")" || return 2

  set +e
  flock -n -E 75 "$lock_file" \
    env BWS_REMEDIATION_CAMPAIGN_LOCK_HELD=1 REPO_DIR="$repo" \
      BWS_REMEDIATION_CAMPAIGN_LOCK_PATH="$lock_file" \
      BWS_REMEDIATION_CAMPAIGN_LOCK_IDENTITY="$lock_identity" \
    bash "$script" "$@"
  rc=$?
  set -e

  if (( rc == 75 )); then
    printf 'ERROR: another remediation campaign launcher owns %s\n' "$lock_file" >&2
  fi
  return "$rc"
}

run_with_campaign_lock "$@"
