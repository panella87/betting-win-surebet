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
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
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

`BWS-100` through `BWS-599` are validated. The repository has the domain engine, `surebet.*` persistence, immutable intake, explicit export and API convergence passes, a long-running explicit-mode upstream convergence service, long-running scheduler and worker services, read-only API, React cockpit, managed loopback cockpit serving with explicit API-mode build verification, complete product-owned lifecycle ownership, product-owned database lifecycle operations, structured observability surfaces, loopback acceptance, strict runtime handoff packaging, deterministic release packaging, service-owned paper runtime-evidence collection, managed-runtime soak/failure proof, and exact-mode external runtime preflight.

Validated executable and integration composition remains under `packages/bootstrap`; future implementation work must come from a reviewed source-fix handoff or explicit dependency-ready task, not from a stale safe-local queue.

The safe local operator service boundary is complete. The current source now has long-running explicit-mode upstream convergence, long-running scheduler and worker services, managed loopback cockpit serving, a full product-owned lifecycle owner, integrated root lifecycle/progress/log wrappers, product runtime evidence surfaces, service-owned paper runtime-evidence mode, runtime-evidence paper autopilot inside the owned lifecycle, exact-version upgrade/rollback/recovery proof, deterministic soak/failure evidence, external-runtime preflight, and final clean-room acceptance. The next gate is external `BWS-600` accepted-runtime evidence with a running operator-approved betting-win read-only API. The BWS runtime now fails fast before the long evidence window when the upstream API is unavailable or points at the local BWS API.

## Validated safe local program

The binding safe-local queue is complete through `BWS-599`:

```text
BWS-586  logs, metrics, diagnostics and evidence retention (validated)
BWS-587  root lifecycle/progress/log wrapper integration (validated)
BWS-588  service-owned paper evaluation (validated)
BWS-589  runtime-evidence paper autopilot (validated)
BWS-590  release and deployment packaging (validated)
BWS-591  upgrade, rollback and recovery proof (validated)
BWS-592  long-running soak and failure injection (validated)
BWS-593  external-runtime preflight and campaign manifest (validated)
BWS-599  integrated final local acceptance (validated)
BWS-600  accepted operator-approved runtime evidence
BWS-900  separately authorized execution
```

## Authority

Read in this order:

1. `AGENTS.md`
2. `docs/000_documentation_index.md`
3. `docs/repo_status_current.md`
4. `docs/automation/current-implementation-task.md`
5. `docs/automation/api-only-upstream.md`
6. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
7. `backlog/bws_full_implementation.csv`
8. `backlog/bws_remaining_safe_local_map.csv`

Detailed BWS-599 carry-forward contracts and historical blueprints stay discoverable from `docs/000_documentation_index.md`. Historical SURE ledgers remain regression evidence only and do not authorize implementation to stop.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Current automation route

The selected controller is now `run-paper-autopilot.sh` for the `BWS-600` runtime-evidence campaign. The safe-local implementation queue through `BWS-599` is complete and the upstream API preflight source fix is present; the remaining blocker is an operator-approved running betting-win read-only API.

The standardized helper surface is active: `zip_codebase.sh` creates numbered repo-root zips without a manifest; `pull_artifacts_and_zip_codebase.sh` pulls server `artifacts.zip` and then calls local `zip_codebase.sh` without reading `automation.config.sh`; `update_git.sh --acp` is the add/commit/push shorthand and preserves `GITHUB_TOKEN` support. `run-autonomous-implementation.sh`, `run-paper-evaluation.sh` and `run-autonomous-bugfix.sh` default to 72-hour standalone ceilings. `run-paper-evaluation.sh` replaces the old 12-hour helper and writes root `artifacts.zip`; `--adaptive` is clamped to 5..60 minutes. `run-autonomous-bugfix.sh` has no proactive/reactive mode flags. `stop-autonomous-run.sh` is intentionally absent.

The protected root-wrapper and paper-controller integration phase is complete. Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; any future protected automation repair requires a reviewed external overlay.

## Safety

The program may build private loopback services, explicit read-only upstream convergence, persisted continuous paper, API, workers, UI, lifecycle, evidence, backup/restore and recovery. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability or enable real-money execution.

## Automation temp and inode safety

Long autonomous and paper campaigns use one private repository-owned temp session per controller under `.automation/tmp`. The shared guard exports `TMPDIR`, `TMP`, and `TEMP`, rejects low free-byte or free-inode capacity, enforces per-session budgets, and removes dead marker-owned sessions. Parent and child controllers never share the same session.

See `docs/automation/repository-temp-inode-safety.md`. The maintenance command `cleanup_automation_temp_inode_residue.sh` is dry-run by default and does not perform generic `/tmp` deletion.
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing API readiness is a runtime-evidence blocker; there is no automatic file fallback. Supported root runtime commands enforce `paper`, provider-disabled, and execution-disabled policy; explicit process connection settings take precedence, `.env` supplies the canonical `POSTGRES_*` tuple, and repo-owned defaults cover internal runtime settings including the standard repo-local schedule path. No private-paper manifest content is synthesized.

