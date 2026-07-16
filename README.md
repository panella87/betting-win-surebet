# betting-win-surebet

`betting-win-surebet` is the surebet and complete-set application built on top of the `betting-win` provider, data, history, export and read-only query platform.

It remains a separate downstream repository. It does not fork the provider platform or copy provider adapters. It consumes exact contracts, immutable exports, canonical identifiers, provenance and read-only query/API surfaces. It owns all surebet-specific state and decisions.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
provider_truth_owner=betting-win
canonical_history_owner=betting-win
strategy_state_owner=betting-win-surebet
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
current_task=BWS-592
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
execution_gate=closed
```

## Upstream surfaces

```text
upstream_archive_sha256=9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f
strategy_export_schema=betting-win.strategy-export.v1
surebet_profile=surebet_standard_binary_v0
```

BWS consumes:

1. Exact `@betting-win/*` package and contract boundaries.
2. Immutable `betting-win.strategy-export.v1` bundles using profile `surebet_standard_binary_v0`.
3. Typed read-only betting-win query/API surfaces.
4. Canonical identity, rule, provider-generation, quote, trade, settlement and source-lineage references.

BWS must not connect directly to providers, write betting-win `core.*`, treat snapshots as canonical provider history or silently fall back between workspace, export, API and fixture modes.

## Validated foundation

`BWS-100` through `BWS-590` are validated. The repository has the domain engine, `surebet.*` persistence, immutable intake, explicit export and API convergence passes, a long-running explicit-mode upstream convergence service, long-running scheduler and worker services, read-only API, React cockpit, managed loopback cockpit serving with explicit API-mode build verification, complete product-owned lifecycle ownership, product-owned database lifecycle operations, structured observability surfaces, loopback acceptance, strict runtime handoff packaging, deterministic release packaging and service-owned paper runtime-evidence collection.

Validated executable and integration composition remains under `packages/bootstrap`; the remaining queue extends that package surface rather than replacing it.

That is not the final operator service. The current source now has long-running explicit-mode upstream convergence, long-running scheduler and worker services, managed loopback cockpit serving, a full product-owned lifecycle owner, integrated root lifecycle/progress/log wrappers, product runtime evidence surfaces, service-owned paper runtime-evidence mode, runtime-evidence paper autopilot inside the owned lifecycle, and exact-version upgrade/rollback/recovery proof. The remaining gaps are soak, external preflight and final clean-room acceptance.

## Remaining safe local program

The binding queue now continues through `BWS-599`:

```text
BWS-586  logs, metrics, diagnostics and evidence retention (validated)
BWS-587  root lifecycle/progress/log wrapper integration (validated)
BWS-588  service-owned paper evaluation (validated)
BWS-589  runtime-evidence paper autopilot (validated)
BWS-590  release and deployment packaging (validated)
BWS-591  upgrade, rollback and recovery proof (validated)
BWS-592  long-running soak and failure injection
BWS-593  external-runtime preflight and campaign manifest
BWS-599  integrated final local acceptance
BWS-600  accepted operator-approved runtime evidence
BWS-900  separately authorized execution
```

## Authority

Read in this order:

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `backlog/bws_full_implementation.csv`
7. `docs/034_remaining_operator_runtime_implementation_program.md`
8. `backlog/bws_remaining_safe_local_map.csv`
9. `docs/042_release_packaging_implementation_blueprint.md`
10. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
11. `docs/044_soak_failure_injection_implementation_blueprint.md`
12. `docs/045_external_runtime_preflight_implementation_blueprint.md`
13. `docs/046_final_local_acceptance_implementation_blueprint.md`
14. `docs/automation/current-implementation-task.md`

Historical SURE ledgers remain regression evidence only. They do not authorize implementation to stop.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Autonomous implementation

The selected controller is `run-autonomous-implementation.sh`. It reads the current task and binding ledger; no invented `--task` or prompt file is required.

The protected root-wrapper and paper-controller integration phase is complete. The current `BWS-590` through `BWS-599` campaign authorizes no protected automation changes and must not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.

## Safety

The program may build private loopback services, explicit read-only upstream convergence, persisted continuous paper, API, workers, UI, lifecycle, evidence, backup/restore and recovery. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability or enable real-money execution.
