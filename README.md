# betting-win-surebet

## Current authority

`betting-win-surebet` is currently executing the activated R01-R12 remediation program. The active implementation authority is the immutable activation package under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`.

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
pre_s2_execution=direct_bounded_codex_only
existing_autonomous_controllers_before_s2=prohibited
post_s2_controller=run-autonomous-implementation.sh
global_operator_window=28d
canonical_node=v20.20.2
one_source_mutating_tranche_at_a_time=yes
```

The activation package admits T39 first and preauthorizes later tranches only in exact dependency order after accepted predecessor receipts. S1 and S2 are bounded operator-driven cycles. Existing repository controllers may not drive remediation until every S2 tranche is accepted. The active launcher is:

```text
docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/run-unattended-remediation-campaign.sh
```

The immutable files `docs/repo_status_current.md` and `docs/automation/current-implementation-task.md` begin with the active remediation authority. Their later BWS-600 blocks are validator-retained pre-remediation snapshots, not current routing instructions. Do not route from those later compatibility blocks.

## Repository purpose

This repository is the downstream surebet and complete-set strategy application built on the independent `betting-win` provider, data, history, export, and read-only query platform.

```text
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

BWS owns surebet-specific state and decisions. It must not connect directly to providers, mutate `betting-win`, write `betting-win` `core.*`, substitute fixtures for external runtime evidence, or perform live execution.

## Retained upstream design baseline

`config/betting-win.upstream-baseline.json` retains the reviewed BWS-100 design baseline for compatibility validation. Its uploaded-source archive SHA-256 is `9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f`, its contract is `betting-win.strategy-export.v1`, and its surebet profile is `surebet_standard_binary_v0`. This is design evidence, not a current runtime lock, provider connection, or accepted external proof.

## Current holds

```text
BWS-600=BLOCKED
BWS-710=BLOCKED
BWS-900=PARKED_NOT_AUTHORIZED
release=BLOCKED
deployment=BLOCKED
live_execution=PROHIBITED
betting_win_access_or_mutation=PROHIBITED
```

The remediation campaign does not release any hold. `SOURCE_COMPLETE_EXTERNAL_PENDING` is non-promotable.

## Source-of-truth order

1. Current source and tests.
2. Fresh retained evidence produced by current source.
3. The active admission, unattended plan, tranche tasks, and receipt state under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`.
4. The first active-remediation sections of `docs/repo_status_current.md` and `docs/automation/current-implementation-task.md`.
5. `docs/000_documentation_index.md` and `docs/documentation-inventory.json`.
6. Supporting architecture, automation, runbook, review, and historical documents.

## Standard automation contract

```text
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
update_git.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
automation.config.sh
docs/automation/
.automation/
```

Verified behavior:

- `zip_codebase.sh` creates the next numbered repository-root ZIP, includes Git-tracked and untracked non-ignored files, excludes generated, transient, secret, log, database, evidence, and archive paths, and creates no manifest.
- `pull_artifacts_and_zip_codebase.sh` pulls server-root `artifacts.zip`, saves a numbered local artifact ZIP, then invokes local `zip_codebase.sh`. It does not use `automation.config.sh`.
- `update_git.sh --acp` is the add, commit, and push shorthand and preserves `GITHUB_TOKEN` support.
- `run-autonomous-implementation.sh`, `run-paper-evaluation.sh`, and `run-autonomous-bugfix.sh` default to 72-hour ceilings.
- `run-autonomous-implementation.sh` has no `--task` option. Normal routing comes from repository task documents; the active post-S2 launcher uses the verified `--prompt-file` interface for one exact tranche.
- `run-paper-evaluation.sh` replaces the obsolete `run-paper-evaluation-12h.sh`, creates root `artifacts.zip`, and documents `--adaptive` as the canonical operator flag. The current script accepts explicit `--interval` values as supplied, so operators must keep them within 5 to 60 minutes.
- `run-autonomous-bugfix.sh` is one read-only audit and handoff controller and has no proactive/reactive mode flags.
- `stop-autonomous-run.sh` is intentionally absent.
- Protected automation files remain read-only except when the exact admitted task names an exact allowlist.

## Implemented source layout

Application composition remains under `packages/bootstrap`, persistence under `packages/persistence`, upstream compatibility under `packages/upstream`, and the operator cockpit under `apps/web`.

## Operator entry points

- Documentation map: `docs/000_documentation_index.md`
- Current campaign: `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/README.md`
- Active server runbook: `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/server-runbook.md`
- Automation command contract: `docs/automation/README.md`
- Current high-level status: `PROJECT_STATUS.md`
- Detailed active status: first section of `docs/repo_status_current.md`

## Local bootstrap and validation

```bash
npm ci --ignore-scripts
npm run build
python3 scripts/validate_repo.py
```

Exact Node acceptance for remediation is `v20.20.2`. `SOURCE_MANIFEST.json` remains stale until T40 and is not current-source authority.

## Historical validation lineage

```text
historical_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
validated_runtime_gates=BWS-592,BWS-593,BWS-599
```

The exact lowercase compatibility sentence required by the retained B1 validator is: no dependency-ready BWS-700 source queue remains binding.

## Historical platform baseline retained for validator compatibility

The following block records the completed B1 and BWS-600 pre-remediation routing snapshot. It is historical context only. It must not override the active remediation authority above.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
active_implementation_queue=none
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
BWS-900=parked
```

The selected controller is now `run-paper-autopilot.sh` for the carry-forward `BWS-600` runtime-evidence gate after BWS-700 dependency-ready local completion. This sentence is retained verbatim for legacy validator compatibility; it is not current routing authority. No dependency-ready BWS-700 source queue remains binding.
