# Changelog

## 2026-07-03 — Three-repo surebet boundary documentation rebaseline

- Re-anchored active docs so `betting-win-surebet` is the dedicated surebet/complete-set strategy repo while current live execution remains gated and disabled.
- Added surebet boundary, strategy-state ownership, backtest/paper/live-mode roadmap, separate-account policy, legacy-import manifest, and ADR-0004.
- Added `scripts/validate_three_repo_surebet_boundary.py` and `tests/three-repo-surebet-boundary.test.ts` so docs cannot drift back into provider-truth ownership, predictive/value-betting scope, shared accounts, or ungated live execution.
- Preserved all SURE-002B private paper-mode gates: provider connections prohibited, execution prohibited, real upstream evaluation blocked until Federico provides a pinned `betting-win` bundle.

## 2026-07-02 — SURE-002A local safety bugfix hardening

- Hardened the repo-local export bundle reader against symlink and realpath escapes while preserving the no-provider/no-network boundary.
- Added runtime validation for read-only query resource names so JavaScript callers cannot bypass the TypeScript union.
- Enforced resolved same-currency quote legs before complete-set paper math; `UNKNOWN` and mixed `USD`/`USDC` quote groups now block.
- Required accepted local settlement replay evidence before private opportunity reports can be emitted from local fixture bundles.
- Wired quote freshness into local paper reports using bundle `exportedAt` and a deterministic local freshness window.
- Replaced the stale partial-fill blocked stub with a local status contract pointing to the implemented completion/residual modules.
- Added regression tests for symlink rejection, resource validation, quote currency blocking, settlement-required reporting, stale quote blocking, and partial-fill status.

## 2026-07-02 — SURE-002A local backlog completion handoff

- Synced README, AGENTS, scope, runbook, master-plan, and current-status docs after the 12-cycle SURE-002A local engine run exhausted the safe local backlog.
- Added `docs/016_pinned_betting_win_interface_readiness.md` as the next required handoff checklist before any real upstream evaluation.
- Strengthened local-engine backlog validation so stale docs cannot continue telling agents to invent more local implementation work after both retained backlogs are exhausted.
- Preserved hard boundaries: no provider connections, no execution paths, no direct `betting-win` DB access, no vendored contracts, no public signals, and no profitability claims.

## 2026-07-02 — SURE-002A local engine implementation backlog overlay

- Documented why the latest autonomous run stopped: SURE-001 hardening backlog was exhausted and the controller correctly wrote `AUTONOMOUS_GOAL_COMPLETE=yes`.
- Added `docs/015_local_engine_implementation_backlog.md` so the next run can implement the maximum safe local surebet engine work without a real upstream `betting-win` export bundle.
- Updated autonomous task selection to continue from SURE-001 hardening into SURE-002A local interface/engine implementation while preserving one bounded slice per cycle.
- Added `commands/run-sure-local-engine-autonomous.sh` as the clearer start wrapper for this phase.
- Added `scripts/validate_local_engine_backlog_contract.py` and `tests/local-engine-backlog-contract.test.ts` so the local-only/no-provider/no-execution boundary is validated.
- Updated status/master-plan docs to allow local deterministic contracts, parsers, fixture readers, paper math, state machines, settlement replay consumers, and private reports while keeping real upstream evaluation blocked until Federico provides the pinned interface.


## 2026-07-01 — SURE-001 autonomous continuation backlog overlay

- Documented why the latest run stopped quickly: the controller reached `AUTONOMOUS_GOAL_COMPLETE=yes` after one bounded slice because the prompt still told it to stop after one slice.
- Added `docs/014_sure_001_remaining_hardening_backlog.md` as the active safe SURE-001 backlog for the next autonomous run.
- Updated the controller prompt so each cycle still performs one bounded safe SURE-001 slice, but the run continues with `CONTINUE_REQUIRED=yes` while safe backlog items remain.
- Added a continuation-contract validator and test coverage so the one-slice stop behavior does not silently return.
- Preserved SURE-001 boundaries: no provider connections, execution paths, direct `betting-win` DB access, generated-contract vendoring, solver, simulation, or settlement implementation.

## 2026-07-01 — SURE-001 cycle artifact quality and manifest hardening

- Added fail-closed controller validation for required cycle artifact quality: missing, placeholder, or empty required report artifacts now stop the loop before machine status is accepted.
- Preserved `git_diff.patch` as the only required artifact that may be empty when a cycle genuinely makes no source diff.
- Added `scripts/validate_source_manifest.py` and refreshed `SOURCE_MANIFEST.json` so stale source handoff manifests are caught by `npm run validate`.
- Extended controller contract docs and tests without adding provider connections, execution paths, direct `betting-win` DB access, generated-contract vendoring, or solver implementation.

## 2026-07-01 — SURE-001 autonomous status fail-closed hardening

- Fixed the autonomous controller status parser so malformed, missing, combined, or unknown `continue_status.txt` content fails closed instead of being treated as `CONTINUE_REQUIRED=yes`.
- The controller now fails closed on nonzero Codex cycle exit before accepting any cycle status.
- The controller now requires post-cycle `npm run validate` to pass before accepting `AUTONOMOUS_GOAL_COMPLETE=yes` or any other cycle status.
- Added `scripts/validate_autonomous_controller_contract.py` and wired it into `npm run validate` so future controller/prompt drift is caught.
- Added `docs/013_autonomous_controller_status_contract.md` and updated the autonomous loop contract/run docs.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 autonomous controller and codebase packaging fix

- Fixed the autonomous controller `set -u` startup crash by splitting dependent `local` assignments in `run-autonomous-implementation.sh`.
- The controller now removes only its exact generated root archives (`artifacts.zip`, `autonomous-codebase.zip`) before preflight so a previous completed run cannot poison the next hygiene check.
- The controller now writes a lock PID and can remove the legacy empty lock directory left by the prior `out_dir` crash, while still refusing active PID/nonempty locks.
- Added `scripts/validate_shell_local_assignments.py` so the same Bash `local var=... dependent="$var/..."` regression is caught by `npm run validate`.
- Added repo-local `zip_codebase.sh`, adapted from the main `betting-win` packaging pattern for `betting-win-surebet`.
- Updated `pull_artifacts_and_zip_codebase.sh` to delegate clean codebase packaging to `zip_codebase.sh` and to scan browser duplicate archive names such as `betting-win-surebet1(2).zip` when choosing the next suffix.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 no-source-NVM launcher fix

- Replaced the startup runtime loader with a no-source loader that never sources `nvm.sh` and never calls the NVM shell function.
- The launcher now accepts the current PATH Node when it matches the `.nvmrc` major, otherwise it tries direct already-installed Node binaries under `$NVM_DIR/versions/node/.../bin`.
- Added `validate_node_runtime_loader.py` so future launcher changes cannot reintroduce the WSL/Bash `nvm.sh` startup failure.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## SURE-001 launcher NVM shell-context fix

- Replaced launcher-time `nvm.sh` sourcing with direct `.nvmrc` runtime path discovery.
- Keeps startup visible before validation and avoids WSL/bash `pop_var_context` failures from NVM internals.
- Adds `scripts/load-node-runtime.sh` to executable-bit validation.


## 2026-06-30 — SURE-001 local `.env` hygiene correction

- Allowed a repo-root `.env` file to exist locally when it is explicitly ignored by Git.
- Kept `.env` forbidden in source handoff/codebase archives so secrets are not packaged.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 master-plan operations overlay

- Added the surebet master plan and current-status docs.
- Added Linux-first repo hygiene files: `.gitattributes`, expanded `.gitignore`, `.env.example`, and `PROJECT_STATUS.md`.
- Added adapted operational shell helpers from the Hyperliquid reference pattern: validation start wrapper, safe no-service stop wrapper, progress/log watchers, Git helper, artifact/codebase pull helper, source handoff archive helper, and autonomous implementation controller.
- Added executable-bit restoration and validation.
- Kept SURE-001 boundaries intact: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.


## SURE-002B private paper-mode intake overlay

- Added the SURE-002B private paper-mode backlog and runbook for safe repo-local pinned-interface intake and artifact/report hardening.
- Added `commands/run-sure-paper-mode-autonomous.sh` and `commands/run-pinned-interface-smoke.sh`.
- Hardened local report output containment against realpath/symlink escapes.
- Added per-candidate settlement summaries for multi-candidate private paper reports.
- Added validator and tests for the private paper-mode backlog contract.
