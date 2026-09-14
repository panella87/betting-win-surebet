# Master Plan - betting-win-surebet

## Active program

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
review_program=COMPLETE_R01_R12
confirmed_findings=173
tranches=47
stages=S0_through_S7
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
canonical_node=v20.20.2
implementation_parallelism=one_source_mutating_tranche_at_a_time
```

The binding implementation sequence is the active admission and unattended plan under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`. The original BWS122 remediation architecture remains the finding, dependency, ownership, proof, and hold baseline. BWS123 activated that plan. Current campaign authority records no accepted remediation source result. Exact current archive, extracted-tree, Git, path-mode, and source-state identity must be supplied by an external audit or admission receipt; persistent repository documentation does not designate a rolling numbered ZIP as current.

## Goal

Close all 173 confirmed findings through 47 exact tranches without merging ownership boundaries, changing stable finding IDs, bypassing dependency order, weakening external holds, or treating documentation as implementation proof.

## Stage sequence

| Stage | Purpose | Execution rule |
|---|---|---|
| S0 | Admission and immutable campaign freeze | Completed by active admission; no application mutation |
| S1 | P0 safety corridor | Direct bounded operator-driven cycles only |
| S2 | Exact source/Node authority and controller repair | Direct bounded cycles; no existing controller before full S2 acceptance |
| S3 | Immutable source, process, evidence, and release generations | Repaired implementation controller may orchestrate one admitted tranche at a time |
| S4 | Domain, simulation, and durable-state correctness | One tranche at a time |
| S5 | API, cockpit, diagnostics, and campaign truth | One tranche at a time; external evidence remains explicit |
| S6 | Retention, upgrade, soak, recovery, and promotion proof | Controlled environment campaigns where mapped |
| S7 | Assurance hardening and machine closure | T43 last |

Exact order, dependencies, owners, findings, test counts, and proof environments are in `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-order.json` and the active `unattended-plan.json`.

## Current tranche

T39 owns four R10 findings in:

```text
pull_artifacts_and_zip_codebase.sh
scripts/create-source-handoff-archive.sh
update_git.sh
zip_codebase.sh
```

It must converge nested-secret exclusion, archive member policy, non-destructive repository-local Git configuration, pinned SSH identity, and no first-use trust assumptions. It is admitted but not accepted.

## Completion model

A tranche closes only with exact source re-verification, admitted path scope, postimages, executed focused and production-entrypoint tests, mapped environment proof, retained holds, and a valid result receipt. Unknown or missing states fail closed. `SOURCE_COMPLETE_EXTERNAL_PENDING` never promotes release, deployment, BWS-600, BWS-710, or live execution.

The program completes only after T43 accounts for every stable finding and rejects missing, stale, unexecuted, wrong-runtime, or wrong-generation evidence.

## Hold model

```text
BWS-600=BLOCKED
BWS-710=BLOCKED
BWS-900=PARKED_NOT_AUTHORIZED
release=BLOCKED
deployment=BLOCKED
live_execution=PROHIBITED
```

No internal source completion alone releases those holds. BWS-600 still requires accepted read-only upstream evidence and real provider-to-PostgreSQL-to-API parity. BWS-710 still requires an accepted runtime `betting-win.b1_multi_venue_markets.v1` resource. BWS-900 requires a separate explicit authorization program.

## Architecture

BWS remains a downstream strategy application. `betting-win` owns provider truth and canonical history. BWS owns `surebet.*`, deterministic strategy/economics, backtesting, private paper state, read-only API/cockpit projection, and future separately gated execution decisions. No direct provider access or upstream repository mutation is allowed.

## Automation operating model

- Orders 1 through 13: the active launcher invokes direct bounded Codex sessions, one tranche at a time.
- Orders 14 through 47: the launcher may invoke repaired `run-autonomous-implementation.sh` only after the S2 validator passes.
- Ordinary standalone controller defaults remain 72 hours.
- The global unattended campaign window is 28 days.
- Force unlock is unavailable without fresh lock and ownership evidence.
- Exact Node `v20.20.2` is mandatory.

## Documentation ownership

The canonical navigation is `docs/000_documentation_index.md`. The exhaustive classification is `docs/documentation-inventory.json`. The active task and status are the first sections of the immutable files `docs/automation/current-implementation-task.md` and `docs/repo_status_current.md`, backed by the activation package.

## Historical validation lineage

```text
repo_role=surebet_strategy_application
upstream_platform=betting-win
continuous_runtime_gate=BWS-600
execution_gate=BWS-900
validated_runtime_gates=BWS-581,BWS-592,BWS-593,BWS-599
```

The retained controller family includes `run-autonomous-implementation.sh`, `run-bugfix-autopilot.sh`, and `run-paper-autopilot.sh`.

## Historical platform program retained for validator compatibility

The block below records the completed pre-remediation platform route. It is not current implementation authority.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
bws600_current_task=BWS-600
safe_local_terminal_gate=BWS-599
```

`backlog/bws_full_implementation.csv` remains completed traceability. `BWS-581` through `BWS-599` remain validated carry-forward behavior. The old route is preserved for tests and audit history only.
