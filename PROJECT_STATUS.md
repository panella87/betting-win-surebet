# PROJECT_STATUS

```text
repo=betting-win-surebet
status=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
runtime=paper_only
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
first_lane=polymarket_standard_binary_complete_set_v0
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
next_task=wait_for_federico_pinned_betting_win_contract_export_interface_before_real_upstream_evaluation
```

Current state:

- The repo is the dedicated surebet / complete-set strategy repository under the accepted three-repo architecture.
- Current implementation remains private paper-only and live execution remains disabled until a separate explicit gate.
- It owns surebet strategy logic, backtesting, private paper mode, reports, and future gated live surebet execution decisions.
- It does not own provider truth.
- It does not connect to SX, Azuro, Polymarket, Limitless, or any future provider.
- It does not implement wallets, signers, token approvals, orders, cancellations, redemptions, cashouts, transactions, live collectors, public signals, or profitability claims.
- It consumes only stable contracts/exports/read-only evidence from `betting-win` after those interfaces exist.
- It uses a separate account and bankroll from `betting-win-betting`; no shared-capital coordinator exists here.
- Controller runtime locks and handoff files are ignored by source-manifest validation/regeneration while source-owned `.automation` helpers remain tracked.
- `run-paper-evaluation.sh` acquires its lock before run creation or stale-handoff rotation and reports lock-release state before Telegram.
- `run-paper-autopilot.sh` uses an atomic full-file parent-lock claim and preserves the lock on child-identity or release failure.

Authoritative active docs:

1. `AGENTS.md`
2. `docs/MASTER_PLAN.md`
3. `docs/repo_status_current.md`
4. `docs/001_scope_and_boundaries.md`
5. `docs/002_dependency_contract_with_betting_win.md`
6. `docs/019_three_repo_surebet_strategy_boundary.md`
7. `docs/020_strategy_data_and_state_ownership.md`
8. `docs/021_backtest_paper_live_mode_roadmap.md`
9. `docs/022_separate_account_policy.md`
10. `docs/012_runbook.md`
11. `docs/operations/autonomous_72h_runbook.md`

Validation command:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm run validate
```

Local `.env` policy: allowed in the working folder only because `.gitignore` explicitly ignores it; archive validators still reject `.env` inside generated codebase/source handoff archives.


## Launcher hardening

Root controllers inherit the active Node runtime from the parent shell and log Node/NPM runtime checks before validation. Compatibility wrappers under `commands/` may still use `scripts/load-node-runtime.sh`; the canonical daily entrypoints are the root scripts. `.env` may exist locally when ignored by `.gitignore`; it must not be archived or committed.

## Packaging helpers

`zip_codebase.sh` creates a local clean codebase archive. `pull_artifacts_and_zip_codebase.sh` downloads remote `artifacts.zip` when present and delegates codebase packaging to `zip_codebase.sh`. Both helpers exclude `.env`, dependencies, build output, logs, and generated archives.

## Controller status contract

The autonomous controller must fail closed on malformed cycle status, nonzero Codex exit, or failed post-cycle validation. It must not treat unknown `continue_status.txt` content as `CONTINUE_REQUIRED=yes`.

## SURE-001 artifact quality hardening

Required autonomous cycle artifacts are audit evidence. Missing, placeholder, or empty required report files fail closed before cycle status is accepted. `SOURCE_MANIFEST.json` is validated against the current source tree during `npm run validate`.

## Local implementation backlog

The repo-local SURE-001 hardening backlog and the safe SURE-002A local implementation backlog are now exhausted. The repo has local-only deterministic interface contracts, fixture readers, scenario math, stake-vector math, completion/residual simulation, settlement replay consumption, private paper reporting, and an offline fixture-to-artifact report path.

Real upstream evaluation remains blocked pending Federico's pinned `betting-win` contract/export interface. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens safe local work.


## Local safety bugfix hardening

The local fixture pipeline now blocks symlink/realpath export escapes, unsupported runtime query resources, unresolved or mixed quote currencies, missing settlement replay evidence, and stale quote evidence before private opportunity reports are emitted. Partial-fill status now points to the implemented local completion/residual modules while real upstream acceptance remains blocked pending Federico's pinned `betting-win` interface.


## Private paper-mode intake backlog

Federico asked for the maximum safe implementation possible up to private paper mode. The repo-local private paper-mode backlog is now complete:

```text
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
input=repo-local JSON bundles only
output=artifacts/private-paper-mode/*.report.json
```

`docs/017_private_paper_mode_implementation_backlog.md` is now a completed implementation ledger after SURE-001 and SURE-002A completion. `docs/018_private_paper_mode_runbook.md` captures the freeze gate: `npm run validate` passes, local fixture smoke passes, and real upstream evaluation still requires Federico's repo-local pinned `betting-win` bundle.

Use the canonical root controller after activating Node 20 in the parent shell:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none
```

for repo-local private fixture paper checks. The paper controller now preflights pinned-bundle paths before run creation, uses direct argv for known report commands, verifies source immutability, and strictly validates `SUREBET_REQUIRE_PINNED_BUNDLE`; for ordinary repo-local source defects, omit `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. `commands/run-sure-*` wrappers are compatibility wrappers only. Use `commands/run-pinned-interface-smoke.sh` only when Federico provides a repo-local pinned `betting-win` export bundle, and do not treat pinned-bundle output as live readiness or profitability evidence.


## Legacy surebet import archive

Surebet-specific legacy material imported from the original `betting-win` repo has been rehomed under dedicated legacy archive paths and is not active authority.

```text
legacy_surebet_import_status=imported_and_rehomed
source_import_path_removed=yes
active_authority=no
```

The active authority remains the three-repo surebet boundary docs.

## Standard automation status

```text
automation_contract=standard_root_scripts_v1
implementation_controller=run-autonomous-implementation.sh standardized_with_canonical_flags_and_telegram
paper_controller=run-paper-evaluation.sh standardized_with_telegram_no_service_private_fixture_pinned_bundle
bugfix_controller=run-autonomous-bugfix.sh strict_four_state_read_only_audit_handoff
bugfix_mutation_guard=content_fingerprint_detects_already_dirty_file_edits
bugfix_artifact_hint=resolved_before_current_run_directory_creation
paper_input_preflight=existing_regular_non_symlink_repo_local_json_before_run_creation
paper_known_command_execution=direct_argv
paper_source_mutation_guard=enabled
paper_handoff_contract=schema_v1_atomic_source_and_evidence_fingerprinted
paper_artifacts_zip=timeout_bounded
implementation_standalone_handoff_consumer=exact_schema_source_fingerprint_and_evidence_sha_verified
paper_supported=repo_local_private_fixture_only
paper_real_upstream=blocked_until_federico_pinned_betting_win_interface
lock_dir=.automation/locks
root_artifacts_zip=required_before_run_script_exit
stop_autonomous_run_helper=removed
```

`run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, `run-paper-evaluation.sh`, and `run-paper-autopilot.sh` now use the standardized root-controller flag, artifact, exit-code, and Telegram final-notification contract. The paper controller is surebet-specific and no-service: it preflights any pinned-bundle path before run creation, executes known local-report commands as direct argv, verifies source/protected-file immutability, strictly validates `SUREBET_REQUIRE_PINNED_BUNDLE`, and never starts/stops services or calls providers. The private paper-mode backlog remains complete; real upstream evaluation still requires Federico's pinned bundle.


## Automation helper standardization

```text
update_git_pull=git_pull_ff_only_autostash
zip_codebase_artifacts_only=supported
pull_artifacts_remote_artifact_override=supported
progress_helpers=current_artifact_layout
shared_telegram_helper=.automation/lib/telegram_notify.sh
run_autonomous_implementation=standardized_with_canonical_flags_and_telegram
run_autonomous_bugfix=strict_four_state_read_only_audit_handoff
run_autonomous_bugfix_mutation_guard=content_fingerprint
run_paper_evaluation_standardization=standardized_with_telegram_no_service_private_fixture_pinned_bundle
run_paper_evaluation_input_preflight=fail_fast_before_expensive_validation
```


## Autopilot status

run_paper_autopilot=standardized_no_service_parent_supervisor

`run-paper-autopilot.sh` is now the unattended parent workflow. It has no service lifecycle and only alternates private paper evaluation with bounded source implementation when `.automation/paper-mode-to-autonomous-implementation.env` exists.


## Bugfix autopilot hardening

`run-autonomous-bugfix.sh` now uses a strict four-state audit contract and `run-bugfix-autopilot.sh` provides the bounded audit -> implementation -> same-area re-audit campaign workflow. The bugfix parent applies the shared cross-controller guard, atomically claims a complete lock before campaign artifacts, preserves unverifiable child/release locks, and sends Telegram only after terminal lock classification.


## Run-script hardening wave 4

`run-paper-evaluation.sh` now emits only canonical atomic schema-v1 implementation handoffs. Each actionable handoff records the classified exit code, producer/source-run identity, current source fingerprint, evidence path/hash, and stable semantic fingerprint. `run-autonomous-implementation.sh` independently verifies those fields for standalone paper and bugfix handoffs, preserves the accepted input handoff in run evidence, and fails before Codex on evidence tampering, source drift, unknown schema keys, or run-path mismatch.

```text
run_paper_evaluation_artifacts_zip=timeout_bounded
run_paper_autopilot_handoff_consumer=canonical_schema_v1_exact_keys_source_evidence_and_child_result_verified
run_paper_autopilot_legacy_normalization=disabled
run_paper_autopilot_paper_child_zip_timeout=forwarded
shared_controller_lock_protocol=managed_child_process_groups_graceful_force_unlock_and_cross_controller_guard
```


## Run-script hardening wave 7

```text
standalone_implementation_lock_acquisition=before_run_directory
standalone_bugfix_lock_acquisition=before_run_directory
standalone_lock_release_failure=blocked_with_lock_preserved
standalone_lock_machine_output=release_status_exit_code_and_preserved_state
implementation_handoff_consumption=revoked_when_final_lock_release_fails
```

The implementation and bug-audit controllers no longer suppress shared lock-release failures. They classify active-child identity or termination failures before final notification, preserve the lock, correct terminal summaries and archives, and return exit code `2`. The implementation controller also removes a consumed-handoff marker and rewrites its return handoff if final lock release is unsafe.


## Paper controller lock completion

```text
run_paper_evaluation_lock=atomic_claim_before_run_directory
run_paper_evaluation_release=classified_before_telegram
run_paper_autopilot_lock=atomic_full_file_parent_claim
run_paper_autopilot_child_cleanup=fail_closed_with_preserved_lock
```

Concurrent paper starts cannot both acquire the same repo-scoped lock. A failed managed-child identity check or strict release no longer appears as paper success.


## Bugfix parent lock completion

```text
run_bugfix_autopilot_lock=atomic_full_file_parent_claim
run_bugfix_autopilot_child_cleanup=fail_closed_with_preserved_lock
run_bugfix_autopilot_lock_release=classified_before_telegram
```

Concurrent bugfix-parent starts cannot observe or claim an empty live lock. Child-identity or strict release failure becomes a blocked exit with corrected evidence and machine-readable lock state.

Both parent heartbeat workers now update only lock mtime, poll for shutdown every second, and never rewrite the full lock env from a background snapshot. Shared TERM/KILL escalation verifies process exit before lock removal.
