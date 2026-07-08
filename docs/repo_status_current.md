# Current Repository Status

```text
repo=betting-win-surebet
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
current_task_status=repo_local_private_paper_mode_baseline_complete_full_blueprint_blocked_on_pinned_interface
next_allowed_task=wait_for_federico_pinned_betting_win_contract_export_interface_before_real_upstream_evaluation_or_continue_with_approved_autopilot_alignment
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
provider_connections=prohibited
execution=prohibited
runtime_service=none
```

## Active queue

- [x] Establish skeleton files from the handoff.
- [x] Add no-provider/no-execution/no-direct-DB validators.
- [x] Add empty typed stubs and fixture directories.
- [x] Add master plan and current-status docs.
- [x] Add adapted Git, artifact, validation, progress, and autonomous shell helpers.
- [x] Harden autonomous controller status parsing so malformed cycle status fails closed.
- [x] Wait for an explicit user request before moving beyond SURE-001.
- [x] Implement the maximum safe local engine backlog in `docs/015_local_engine_implementation_backlog.md`.
- [x] Implement the maximum safe private paper-mode backlog in `docs/017_private_paper_mode_implementation_backlog.md`.
- [ ] Wait for Federico to provide the pinned `betting-win` contract/export interface before real upstream evaluation. See `docs/016_pinned_betting_win_interface_readiness.md`.

## Current safe work

The accepted three-repo boundary is documented in `docs/019_three_repo_surebet_strategy_boundary.md`, `docs/020_strategy_data_and_state_ownership.md`, `docs/021_backtest_paper_live_mode_roadmap.md`, and `docs/022_separate_account_policy.md`.

SURE-001 hardening is complete. The documented SURE-002A local implementation backlog is also complete: contracts, parsers, local fixture readers, deterministic paper math, state machines, private reports, and CLI/reporting over local fixtures are implemented. The documented SURE-002B private paper-mode backlog is also complete: pinned-intake validation, private artifact contracts, batch summaries, smoke fixtures, and the operator freeze gate are implemented. Real upstream evaluation remains blocked.

## Blocked work

The following remain blocked under the current gate: provider integration, live execution, public reporting, profitability claims, direct upstream database access, generated-contract vendoring, and real upstream readiness claims. Local deterministic stake-vector, completion, residual exposure, and settlement replay consumption may now be implemented only against fake/local fixtures and must remain blocked from real acceptance.

## Operational commands

Canonical daily entrypoints are root scripts, not historical phase wrappers:

```bash
cd ~/app_testing/betting-win-surebet && . "$HOME/.nvm/nvm.sh" && nvm use 20 && bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none
```

For ordinary repo-local validation/tooling/source defects, use `bash ./run-autonomous-implementation.sh --duration 72h --model cli-default --fallback-model none` after parent-shell Node activation. Use `bash ./run-autonomous-bugfix.sh --duration 72h --model cli-default --fallback-model none --handover-autonomous-implementation` when the task is source bug audit and handoff. Use `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` only for a newly approved automation-maintenance task touching protected root automation files.


```text
local_env_policy=ignored_local_only
archive_env_policy=forbidden
```

A repo-root `.env` may exist locally for helper configuration if Git ignores it. It must not be included in source handoff archives or codebase zips.

## Packaging helpers

`zip_codebase.sh` is the repo-local clean codebase packager. `pull_artifacts_and_zip_codebase.sh` now uses it instead of maintaining a separate packaging implementation.

## Post-wave controller audit

The latest SURE-001 loop exposed one controller safety gap: malformed `continue_status.txt` content could be treated as continue. The controller now validates the status file strictly and fails closed on malformed, missing, combined, unknown, nonzero-Codex, or post-cycle-validation-failed states.

## SURE-001 artifact quality hardening

Required autonomous cycle artifacts are audit evidence. Missing, placeholder, or empty required report files fail closed before cycle status is accepted. `SOURCE_MANIFEST.json` is validated against the current source tree during `npm run validate`.

## Continuation status

The repo-local SURE-001 hardening backlog, the safe SURE-002A local implementation backlog, and the safe SURE-002B private paper-mode backlog are exhausted. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens safe work. The remaining blocker is Federico's pinned `betting-win` contract/export interface for real upstream evaluation.


## Private paper-mode intake backlog

```text
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
current_task_status=repo_local_private_paper_mode_baseline_complete_full_blueprint_blocked_on_pinned_interface
provider_connections=prohibited
execution=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
```

`docs/017_private_paper_mode_implementation_backlog.md` is now a completed safe backlog. `docs/018_private_paper_mode_runbook.md` is the operator runbook and freeze gate. No unchecked repo-local item remains in `docs/017_private_paper_mode_implementation_backlog.md`.

Private paper-mode work may create repo-local validators, commands, fake fixtures, artifact contracts, and batch summaries. It may not connect to providers, read `betting-win` databases, vendor generated contracts, execute orders, publish reports, or make profitability/live-readiness claims. The freeze gate remains: `npm run validate` passes, local fixture smoke passes, and real upstream evaluation still requires Federico's pinned bundle.


## Legacy surebet import archive

Surebet-specific legacy material imported from the original `betting-win` repo has been rehomed under dedicated legacy archive paths and is not active authority.

```text
legacy_surebet_import_status=imported_and_rehomed
source_import_path_removed=yes
active_authority=no
```

The active authority remains the three-repo surebet boundary docs.

`docs/imported-from-betting-win/` must remain absent after legacy surebet material is rehomed.

## Standard automation status

```text
automation_contract=standard_root_scripts_v1
run_autonomous_implementation=standardized_with_canonical_flags_and_telegram
run_autonomous_bugfix=standardized_audit_handoff_with_telegram
run_paper_evaluation=canonical_repo_local_private_fixture_and_pinned_bundle_only
run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle
paper_interval_behavior=no_service_single_cycle_accepts_interval_for_workflow_compatibility
lock_dir=.automation/locks
root_artifacts_zip=required_before_run_script_exit
stop_autonomous_run_helper=removed
```

For ordinary source implementation, omit `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; use it only for a newly approved automation-maintenance task touching protected root automation files. The current safe paper command, after parent-shell Node activation, is
`./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none`. It is limited to private fixture smoke unless Federico provides a repo-local pinned `betting-win` bundle. The pinned-bundle branch is now shell-quoted, strict about `SUREBET_REQUIRE_PINNED_BUNDLE`, and fail-fast about missing/remote/out-of-repo/symlink/non-JSON placeholder bundle paths, but real upstream private paper evaluation remains blocked until Federico provides the pinned bundle.


## Automation helper standardization

```text
update_git_pull=git_pull_ff_only_autostash
zip_codebase_artifacts_only=supported
pull_artifacts_remote_artifact_override=supported
progress_helpers=current_artifact_layout
start_stop=no_service_validation_and_noop
shared_telegram_helper=.automation/lib/telegram_notify.sh
run_autonomous_implementation=standardized_with_canonical_flags_and_telegram
run_autonomous_bugfix=standardized_audit_handoff_with_telegram
run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle
```


## Automation runtime artifact policy

```text
source_manifest_runtime_artifacts=ignored_fail_safe
source_manifest_automation_source_helpers=tracked
paper_controller_final_exit_status=actual_process_status
```

Controller-created runtime locks and handoff files are operational state, not source authority. `SOURCE_MANIFEST.json` validation and regeneration ignore `.automation/locks/`, `.automation/corrupt/`, and exact paper/bugfix/implementation handoff files while still tracking source-owned files such as `.automation/README.md` and `.automation/lib/*.sh`. `run-paper-evaluation.sh` final summaries and Telegram notifications must report the actual process exit code.


## Paper autopilot

run_paper_autopilot=standardized_no_service_parent_supervisor

Default unattended command:

```bash
bash ./run-paper-autopilot.sh --duration 7d --paper-duration 72h --implementation-duration 72h --interval 5m --adaptive --max-rounds 6 --max-same-handoff 2 --model cli-default --fallback-model none
```

The controller is no-service/private-paper only. Missing pinned bundle is an external-input blocker, not a source implementation task.
