# Repo automation contract: betting-win-surebet

## Current remediation route

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
pre_s2_execution=direct_bounded_codex_only
existing_controllers_before_s2=prohibited
post_s2_controller=run-autonomous-implementation.sh
active_launcher=docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/run-unattended-remediation-campaign.sh
canonical_node=v20.20.2
```

The active launcher owns campaign order, dependency checks, task selection, receipt validation, and the S2 controller gate. Operators must not bypass it by starting a root controller directly for remediation. Orders 1 through 13 are direct bounded sessions. Orders 14 through 47 may use the repaired implementation controller only after all S2 tranches are accepted.

`docs/repo_status_current.md` and `docs/automation/current-implementation-task.md` are immutable activation inputs. Their first sections are current. Later BWS-600 sections are validator-retained historical text and must not be used to select a controller.

## Standardized command surface

```text
zip_codebase.sh                         numbered repo-root source ZIP, no manifest
pull_artifacts_and_zip_codebase.sh      pulls server root artifacts.zip, then calls local zip_codebase.sh, no automation.config.sh
update_git.sh --acp                     add/commit/push shorthand with GITHUB_TOKEN env/.env support
run-autonomous-implementation.sh        72h default implementation controller
run-paper-evaluation.sh                 72h default standalone paper evaluator, root artifacts.zip
run-autonomous-bugfix.sh                72h default standalone read-only audit/handoff, no proactive/reactive mode flags
run-paper-autopilot.sh                  seven-day paper/evidence parent with 72h children
run-bugfix-autopilot.sh                 seven-day audit/repair parent with 72h children
automation.config.sh                    executable repository profile and command configuration
```

`run-paper-evaluation.sh` replaces `run-paper-evaluation-12h.sh`. The canonical adaptive flag is `--adaptive`. The protected script currently accepts explicit `--interval` values without enforcing the documented policy, so active operator commands must keep explicit intervals inside 5 to 60 minutes. `--adaptive-interval` is compatibility-only and is not the documented command. `stop-autonomous-run.sh` must not exist.

`run-autonomous-implementation.sh` has no `--task` option. Normal controller selection comes from repository authority. The active remediation launcher uses the verified `--prompt-file` option for one exact tranche after S2.

## Helper behavior

- `zip_codebase.sh` includes tracked and untracked non-ignored source, excludes archives, secrets, logs, databases, runtime evidence, generated output, and transient paths, and creates no manifest.
- `pull_artifacts_and_zip_codebase.sh` reads explicit SSH settings from environment then `.env`, downloads root `artifacts.zip`, stores a numbered local artifact ZIP, and invokes local `zip_codebase.sh`.
- `update_git.sh --pull` uses fast-forward-only pull with autostash. `--acp` stages required executable modes before commit and push.
- Root controllers return to the current shell and do not require `exec` or a stop helper.

## Exact protected-file policy

Protected paths are listed in `docs/automation/PROTECTED_AUTOMATION_FILES.md`. `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is not blanket permission. It is valid only when the active task source sets `automation_maintenance_allowed=yes` and names one exact comma-separated allowlist. Missing, duplicate, malformed, or out-of-list authorization fails closed. The blanket manual override is disabled.

T39 currently authorizes only:

```text
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
update_git.sh
```

`scripts/create-source-handoff-archive.sh` is not a protected automation path but remains inside the T39 source boundary.

## Runtime and process boundary

Product, paper, audit, and remediation tasks must not control `betting-win`, providers, live execution, release, or deployment. Test-owned loopback children must be bounded and exactly owned. Controllers use repo-scoped locks, atomic child-result side channels, terminal receipts, and retained artifacts. `TELEGRAM_NOTIFY=0` disables notifications; autopilot children do not send parent-level final notifications.

## Evidence packaging

Root `artifacts.zip` contains the complete retained-evidence portion of `artifacts/` after transient cleanup and safety validation. Current source is returned separately through `zip_codebase.sh`. See `docs/automation/artifact-retention-and-cleanup.md`.

For a fresh continuation, provide both numbered outputs from `pull_artifacts_and_zip_codebase.sh`: the artifact ZIP and current source ZIP. Do not provide `.env`, credentials, databases, `node_modules`, or unretained logs.

## Temporary-file and inode safety

The shared guard uses repository-owned `.automation/tmp`, free-byte and free-inode checks, bounded per-run budgets, ownership metadata, and watchdog cleanup. See `docs/automation/repository-temp-inode-safety.md`. A writable `/tmp` is not an accepted fallback for an invalid managed root.

## Documentation navigation

Canonical repository navigation and classification are in `docs/000_documentation_index.md` and `docs/documentation-inventory.json`.

## Validator-retained pre-remediation route record

### Active post-BWS-700 controller route

This subsection is retained verbatim enough for existing repository validators. It is a historical route snapshot, not current routing authority.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
safe_local_terminal_gate=BWS-599
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
bws600_selected_controller=run-paper-autopilot.sh
bws600_upstream_api_preflight_source_fix=present
automation_maintenance_allowed=no
```

```text
run-autonomous-implementation.sh  available only for future reviewed source handoffs or unblocked BWS-710 intake
```

Paper autopilot is selected for BWS-600 after BWS-700 dependency-ready local completion. `run-paper-autopilot.sh` is selected for `BWS-600` runtime evidence in this retained snapshot. `run-autonomous-implementation.sh` is not the selected route now in that snapshot. Its purpose was to preserve the truthful upstream API blocker rather than fabricate runtime readiness.
