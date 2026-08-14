# betting-win-surebet

## Completed B1 implementation authority and active BWS-600 route

The BWS-700 implementation authority `BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1` is validated through `BWS-820` for dependency-ready local deterministic offline/private-paper B1 work. It preserves `BWS-100` through `BWS-599`, the external `BWS-600` runtime-evidence gate, and parked `BWS-900` execution. The completed B1 queue is `backlog/bws_b1_cross_venue_implementation.csv`; the completed B1 implementation map is `backlog/bws_b1_cross_venue_map.csv`.

`BWS-710` real upstream intake remains blocked until `betting-win` exposes an accepted read-only `betting-win.b1_multi_venue_markets.v1` resource. Dependency-ready local work may implement contract skeletons, equivalence, gross/net calculations, stake-vector solving, fill/rejection/timeout simulation, settlement false-positive analysis, deterministic offline backtesting, private persistence, read-only reporting and acceptance/kill criteria. Fixtures are not runtime evidence.

## Verified bugfix campaign completion

The broad bugfix campaign is complete and accepted. The terminal parent `artifacts/bugfix_autopilot_20260812T133805Z` finished with `BUGFIX_AUTOPILOT_COMPLETE`, `all_campaign_areas_closed`, 22 rounds, and all 8 campaign areas closed. Its final cross-area audit passed the full baseline and PostgreSQL-backed loopback acceptance. No active bugfix or implementation queue remains; the next selected phase is the externally gated `BWS-600` paper/runtime-evidence campaign.

```text
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_parent_run=bugfix_autopilot_20260812T133805Z
broad_bugfix_final_status=BUGFIX_AUTOPILOT_COMPLETE
broad_bugfix_stop_reason=all_campaign_areas_closed
broad_bugfix_rounds_completed=22
broad_bugfix_areas_closed=8
broad_bugfix_total_areas=8
broad_bugfix_lock_release_status=released
broad_bugfix_next_action=none
```


`betting-win-surebet` is the surebet and complete-set application built on top of the `betting-win` provider, data, history, export and read-only query platform.

It remains a separate downstream repository. It does not fork the provider platform or copy provider adapters. It consumes exact contracts, immutable exports, canonical identifiers, provenance and read-only query/API surfaces. It owns all surebet-specific state and decisions.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
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
active_implementation_queue=none
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
bws600_current_task=BWS-600
bws600_current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
execution_gate=closed
BWS-900=parked
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

BWS must not connect directly to providers, write betting-win `core.*`, treat snapshots as canonical provider history, or silently fall back between compatibility inputs. Managed service and BWS-600 runtime transport are API-only; retained workspace, export, pinned-bundle, and fixture paths are non-runtime development, parser, backtest, migration, or regression inputs.

## Validated foundation

`BWS-100` through `BWS-599` are validated. The repository has the domain engine, `surebet.*` persistence, immutable compatibility intake, retained deterministic export parser and convergence regression coverage, API convergence, an API-only long-running upstream convergence service, long-running scheduler and worker services, read-only API, React cockpit, managed loopback cockpit serving, complete product-owned lifecycle ownership, product-owned database lifecycle operations, structured observability surfaces, loopback acceptance, strict runtime handoff packaging, deterministic release packaging, service-owned paper runtime-evidence collection, managed-runtime soak and failure proof, and API-only external runtime preflight.

Validated executable and integration composition remains under `packages/bootstrap`; future implementation work must come from a reviewed source-fix handoff or explicit dependency-ready task, not from a stale safe-local queue.

The safe local operator service boundary is complete. The current source now has long-running API-only upstream convergence, long-running scheduler and worker services, managed loopback cockpit serving, a full product-owned lifecycle owner, integrated root lifecycle, progress, and log wrappers, product runtime evidence surfaces, service-owned paper runtime-evidence mode, runtime-evidence paper autopilot inside the owned lifecycle, exact-version upgrade, rollback, and recovery proof, deterministic soak and failure evidence, API-only external-runtime preflight, and final clean-room acceptance. The next gate is external `BWS-600` accepted-runtime evidence with a running operator-approved betting-win read-only API. The BWS runtime now fails fast before the long evidence window when the upstream API is unavailable or points at the local BWS API.

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
2. `docs/automation/current-implementation-task.md`
3. `docs/repo_status_current.md`
4. `docs/000_documentation_index.md`
5. `docs/047_b1_cross_venue_offline_falsification_program.md`
6. `docs/048_b1_upstream_contract.md`
7. `docs/049_b1_market_equivalence.md`
8. `docs/050_b1_falsification_acceptance.md`
9. `docs/051_b1_implementation_map.md`
10. `docs/052_b1_future_strategy_stubs.md`
11. `backlog/bws_b1_cross_venue_implementation.csv`
12. `backlog/bws_b1_cross_venue_map.csv`
13. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
14. `backlog/bws_full_implementation.csv`
15. `backlog/bws_remaining_safe_local_map.csv`

Detailed BWS-599 carry-forward contracts and historical blueprints stay discoverable from `docs/000_documentation_index.md`. Historical SURE ledgers remain regression evidence only and do not authorize implementation to stop. BWS-600 paper/runtime evidence is now the selected route because the BWS-700 dependency-ready local queue is complete.

## Validation

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm ci --ignore-scripts
npm run validate
```

## Current automation route

The selected controller is now `run-paper-autopilot.sh` for the carry-forward `BWS-600` runtime-evidence gate after BWS-700 dependency-ready local completion. The accepted 8/8 broad bugfix closure means `run-bugfix-autopilot.sh` is not selected again unless new evidence opens a new bounded audit scope. The source of task authority is `docs/automation/current-implementation-task.md` plus the accepted B1 docs and backlog. `run-paper-autopilot.sh` remains blocked until the operator-approved betting-win read-only API is available, but no dependency-ready BWS-700 source queue remains binding.

The standardized helper surface is active: `zip_codebase.sh` creates numbered repo-root zips without a manifest; `pull_artifacts_and_zip_codebase.sh` pulls server `artifacts.zip` and then calls local `zip_codebase.sh` without reading `automation.config.sh`; `update_git.sh --acp` is the add/commit/push shorthand and preserves `GITHUB_TOKEN` support. `run-autonomous-implementation.sh`, `run-paper-evaluation.sh` and `run-autonomous-bugfix.sh` default to 72-hour standalone ceilings. `run-paper-evaluation.sh` replaces the old 12-hour helper and writes root `artifacts.zip`; the canonical operator flag is `--adaptive`, and active commands must keep explicit observation intervals inside the 5..60 minute policy until a reviewed protected-controller change implements automatic explicit-interval clamping. `run-autonomous-bugfix.sh` has no proactive/reactive mode flags. `stop-autonomous-run.sh` is intentionally absent.

The protected root-wrapper and paper-controller integration phase is complete. Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; any future protected automation repair requires a reviewed external overlay.

## Safety

The program may build private loopback services, explicit read-only upstream convergence, persisted continuous paper, API, workers, UI, lifecycle, evidence, backup/restore and recovery. It may not use direct provider endpoints or credentials, create wallets/signers/orders/transactions, mutate provider accounts, publish signals, claim profitability or enable real-money execution.

## Automation temp and inode safety

Long autonomous and paper campaigns use one private repository-owned temp session per controller under `.automation/tmp`. The shared guard exports `TMPDIR`, `TMP`, and `TEMP`, rejects low free-byte or free-inode capacity, enforces per-session budgets, and removes dead marker-owned sessions. Parent and child controllers never share the same session.

See `docs/automation/repository-temp-inode-safety.md`. The maintenance command `cleanup_automation_temp_inode_residue.sh` is dry-run by default and does not perform generic `/tmp` deletion.
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing API readiness is a runtime-evidence blocker; there is no automatic file fallback. Supported root runtime commands enforce `paper`, provider-disabled, and execution-disabled policy; explicit process connection settings take precedence, `.env` supplies the canonical `POSTGRES_*` tuple, and repo-owned defaults cover internal runtime settings including the standard repo-local schedule path. No private-paper manifest content is synthesized.
