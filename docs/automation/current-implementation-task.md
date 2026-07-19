
# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=SOURCE_IMPLEMENTATION_REQUIRED
active_implementation_queue=BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
post_overlay_controller=run-autonomous-implementation.sh
```

## Campaign objective

Prepare the repository for the next autonomous implementation cycle that fixes the `BWS-600` runtime-evidence gate before another paper-autopilot campaign is started.

The safe-local product queue through `BWS-599` remains validated. Do not reopen the product implementation ledger and do not reimplement validated BWS runtime features. The binding task is a bounded source-fix tranche for the `BWS-600` external runtime-evidence path:

```text
bws600_source_fix=BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX
betting_win_api_preflight_required=before_bws_runtime_evidence_window
bws_local_api_4312_does_not_satisfy_upstream_preflight=true
run_paper_autopilot_after_source_fix=true
```

The failure that motivates this task is that the BWS runtime can start its own loopback API and collect degraded evidence for a full 72-hour window even when the upstream `betting-win` read-only API is not running. `127.0.0.1:4312` is the BWS local read-only API and must never be accepted as proof that the upstream `betting-win` API is available.

## Required reading

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/automation/README.md`
4. `docs/034_remaining_operator_runtime_implementation_program.md`
5. `docs/automation/api-only-upstream.md`
6. `docs/automation/paper-autopilot.md`
7. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
8. `backlog/bws_full_implementation.csv`
9. `backlog/bws_remaining_safe_local_map.csv`
10. `docs/042_release_packaging_implementation_blueprint.md`
11. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
12. `docs/044_soak_failure_injection_implementation_blueprint.md`
13. `docs/045_external_runtime_preflight_implementation_blueprint.md`
14. `docs/046_final_local_acceptance_implementation_blueprint.md`

The validated service, database, observability, wrapper and paper-controller contracts in `docs/035` through `docs/041` remain binding carry-forward requirements.

## Verified carry-forward state

`BWS-100` through `BWS-599` are validated, including `BWS-592` soak/failure injection and `BWS-593` external runtime preflight. Preserve their contracts. Do not reimplement or weaken validated functionality merely to create work.

`BWS-600` remains externally gated. The new source-fix implementation must only improve fail-fast detection and evidence when the required upstream `betting-win` read-only API is unavailable.

## First task

```text
id=BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX
objective=fail fast before BWS starts a long runtime-evidence window when the upstream betting-win read-only API is unavailable
largest_safe_tranche=complete_upstream_api_preflight_source_fix
```

Required outcomes:

- resolve the configured upstream `betting-win` read-only API base URL from the existing approved runtime environment/default path;
- reject credential-bearing, non-loopback, malformed, blank or unsupported upstream API URLs with a bounded redacted error;
- probe the upstream `betting-win` read-only API before BWS starts or attaches to its own managed stack for `paper-runtime-evidence`;
- make the probe prove upstream API availability, not merely BWS local API availability on `127.0.0.1:4312`;
- fail fast when the upstream API is absent or incompatible instead of collecting 72 hours of degraded BWS-only evidence;
- surface a precise runtime-evidence blocker such as `PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE` or an equivalent existing fail-closed classification;
- retain bounded non-secret evidence: configured upstream base URL, probe path, HTTP status or connection error class, timeout, upstream lock commit/package version when available, and the fact that no export fallback was used;
- preserve no-clone, no-reset, no-clean and no-mutation treatment of `BETTING_WIN_REPO_PATH`;
- preserve no direct provider connections, no betting-win database reads/writes, no execution, no public signals and no profitability claims;
- update affected docs, validators and tests so the fail-fast preflight is a maintained contract.

## Full remaining sequence

```text
BWS-600_UPSTREAM_API_PREFLIGHT_SOURCE_FIX  source implementation required before next paper-autopilot runtime-evidence campaign
BWS-600_RUNTIME_EVIDENCE                  run paper autopilot only after the source fix validates and the operator starts/approves the betting-win read-only API
```

## Protected automation authorization

The protected wrapper and paper-controller integration tasks are complete. This source-fix task does not authorize protected automation edits.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Rules:

- Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for this campaign.
- Do not edit protected automation files unless a later external overlay explicitly changes this task source and names the exact allowlist.
- Prefer non-protected product/runtime source such as `scripts/bws-root-wrapper-runtime.mjs`, `packages/bootstrap/src/**`, `tests/**`, non-protected docs and validators.
- Do not broaden authorization from inside an autonomous cycle.

## Campaign budgets

```text
campaign_duration=72h
max_cycles=200
recommended_cycle_timeout=6h
validation_timeout=45m
```

A successful completion cycle reports `AUTONOMOUS_GOAL_COMPLETE=yes` only after the upstream API preflight source fix, focused tests, practical validation and source manifest update pass.

## Process-test authorization

Do not start, stop, restart, kill, detach or replace pre-existing services or user sessions.

Bounded repo-owned loopback child processes launched by tests are allowed only when required to prove the fail-fast preflight. They must use unique identities and ports, remain attached to the test, and be cleaned up by the creating test. Test fixtures may simulate a `betting-win` read-only API; they must not require or mutate the real `~/app_testing/betting-win` checkout.

## Continuation rules

```text
CONTINUE_REQUIRED=yes
  while another safe bounded source-fix slice for BWS-600 upstream API preflight remains

AUTONOMOUS_GOAL_COMPLETE=yes
  only after the BWS-600 upstream API fail-fast preflight source fix is validated

BLOCKED=yes
  only for a concrete unrecoverable repository state, unsafe protected-file requirement, unavailable tooling, or external operator evidence that cannot be produced by local source implementation
```

After this source fix validates, `BWS-600` runtime evidence may remain externally blocked until the operator starts and approves the `betting-win` read-only API. `BWS-900` remains parked.

## Safety constraints

```text
BETTING_WIN_REPO_PATH=existing_read_only_checkout
betting_win_checkout_mutation=prohibited
betting_win_service_start_by_bws=prohibited
betting_win_service_stop_by_bws=prohibited
bws_local_api_port_4312=not_upstream_api_evidence
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
direct_betting_win_database_reads=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
file_export_fallback=prohibited
secret_output=prohibited
pre_existing_service_mutation=prohibited
```

Do not clone the betting-win checkout. Do not invent a contract, endpoint, acceptance result or external runtime evidence.

## Repository automation transition

```text
automation_safety=temp_inode_guard_required_and_implemented
managed_temp_base=.automation/tmp
post_overlay_controller=run-autonomous-implementation.sh
post_source_fix_controller=run-paper-autopilot.sh
force_unlock_required=no
```

The next controller may start only after the server has enough free bytes and inodes to pass the guard preflight. The guard does not authorize provider connections, execution, service replacement, or a generic system-temp purge.

## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing upstream API readiness must fail fast before the long BWS runtime-evidence window; there is no automatic file fallback.
