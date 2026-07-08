# Master Plan — betting-win-surebet

## Goal

Build the dedicated surebet / complete-set strategy repository that consumes canonical identity, rules, quote/depth evidence, settlement evidence, and generic paper infrastructure from `betting-win`. Current implementation is private paper-only; future live surebet execution decisions remain disabled until a separate explicit authorization.

```text
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```

This repo must never become the provider/evidence platform and must not duplicate canonical provider history. Under the current gate it must not become a live executor; future live surebet decision loops require a new ADR and explicit approval.

## Current stage

```text
stage=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
status=repo-local private paper-mode backlog complete; real upstream blocked pending pinned betting-win interface
provider_connections=prohibited
execution=prohibited
solver_implementation=local_fixture_only_complete
private_paper_mode=repo_local_complete
pinned_betting_win_interface=missing
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
```

## First lane

```text
lane_id=polymarket_standard_binary_complete_set_v0
venue=polymarket
family=same_venue_complete_set
mode=paper_only
provider_connection=prohibited
execution=prohibited
identity_source=betting-win canonical identity
rules_source=betting-win rule profiles and settlement replay
quotes_source=betting-win retained quote/depth evidence or read-only export
settlement_source=betting-win settlement/finality replay
```

## Non-negotiable blockers before real implementation

Real surebet logic remains blocked until all of the following are available and pinned:

1. `betting-win` generated contract or export package version.
2. Canonical market identity shape.
3. Rule profile and result-source/finality shape.
4. Quote/depth/capacity evidence shape.
5. Settlement replay shape.
6. Generic paper ledger/capacity/reservation primitives.
7. Fixture bundle or read-only query/export interface for tests.

Until then, this repo may implement deterministic local contracts, parsers, fixture readers, paper math, state machines, and private reports. It may not claim real readiness, use real upstream evidence, or connect to providers until Federico provides the pinned interface.


## Current local implementation authority

The controlling three-repo boundary docs are `docs/019_three_repo_surebet_strategy_boundary.md`, `docs/020_strategy_data_and_state_ownership.md`, `docs/021_backtest_paper_live_mode_roadmap.md`, and `docs/022_separate_account_policy.md`. They do not reopen provider integration or live execution. They clarify that surebet-specific backtesting and private paper state belong here, while provider truth remains upstream in `betting-win`.


`docs/015_local_engine_implementation_backlog.md` is the retained SURE-002A local implementation ledger after SURE-001. It authorized the maximum safe local implementation possible without a real upstream bundle: interface contracts, local bundle parsing, standard-binary grouping, terminal scenario cash flows, fixed-point stake-vector math, completion and residual exposure simulation, settlement replay consumption, private paper reporting, and an offline local fixture-to-artifact report path.

This authority is local-only and paper-only. It does not authorize provider connections, execution, public signals, profitability claims, direct `betting-win` database reads, `core.*` migrations, or manual vendoring of generated `betting-win` contracts.

## SURE phases

### SURE-001 — Skeleton and hard boundary

Objective: create the repo skeleton, docs, ADRs, TypeScript stubs, tests, operational shell helpers, and fail-closed validators.

Required behavior:

```text
no provider SDK imports
no provider URLs
no wallet/signer/order/transaction paths
no direct betting-win PostgreSQL access
no core.* migrations
no manually vendored generated betting-win contracts
no solver implementation
```

Acceptance:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm run validate
./run-autonomous-implementation.sh --check-only --model cli-default --fallback-model none
```

### SURE-002 — Dependency contract with betting-win

Define exactly how this repo consumes `betting-win` outputs: contract package version, export bundle path, read-only query shape, canonical identity shape, rule profile shape, quote/depth shape, settlement replay shape, and paper ledger shape.

### SURE-003 — Market group and terminal scenario model

Represent one complete-set candidate group and its terminal scenarios from fixtures only.

### SURE-004 — Stake-vector solver

Compute paper stake vectors from a complete scenario cash-flow matrix and capacities.

### SURE-005 — Leg completion and residual exposure simulator

Simulate partial completion without assuming every leg fills.

### SURE-006 — Settlement replay

Replay accepted `betting-win` settlement/finality fixture data through surebet cash flows. This repo must not infer finality itself.

### SURE-007 — Private paper report

Produce deterministic private reports for candidates, blockers, residual exposure, and paper outcomes. Reports must avoid public signal language, profitability claims, and execution readiness claims. Surebet-specific backtesting belongs in this repo once it consumes pinned `betting-win` history exports; canonical history remains upstream.

## Autonomous implementation rules

The autonomous controller may work only on the first safe unchecked SURE phase or documented local implementation backlog. SURE-001 docs/tooling/validator hardening is complete, the safe repo-local SURE-002A backlog is complete, and the safe repo-local SURE-002B private paper-mode backlog is complete. Autonomous work should therefore stop with `BLOCKED=yes` when no repo-local validation/tooling defect exists and the only remaining active blocker is the missing pinned `betting-win` interface. Use `AUTONOMOUS_GOAL_COMPLETE=yes` only for a bounded repo-local task that is genuinely complete; do not use it to imply the full product blueprint is done.

It must not connect to providers, create execution modules, add wallet/signer/order dependencies, read or mutate `betting-win` databases, copy provider adapters from another repo, claim readiness based on reciprocal odds only, or mark later phases complete without pinned upstream evidence.

## Definition of done for the current local baseline

Activate the repo Node runtime before package installation, validation, or root-controller checks:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm install
npm run validate
./run-autonomous-implementation.sh --check-only --model cli-default --fallback-model none
python3 scripts/validate_autonomous_controller_contract.py
./pull_artifacts_and_zip_codebase.sh --help
./zip_codebase.sh
./update_git.sh --help
```

## Active implementation backlog

`docs/014_sure_001_remaining_hardening_backlog.md`, `docs/015_local_engine_implementation_backlog.md`, and `docs/017_private_paper_mode_implementation_backlog.md` are retained as completed ledgers. `docs/018_private_paper_mode_runbook.md` defines the current freeze gate. `docs/016_pinned_betting_win_interface_readiness.md` is the next required handoff checklist. Real upstream work remains blocked on Federico's pinned `betting-win` interface.


### SURE-002B — Private paper-mode intake

Objective: implement every safe repo-local step needed before real private paper evaluation: pinned-interface intake, private paper report artifact contracts, fake/local smoke fixtures, batch summaries, and operator runbooks.

Authority:

```text
docs/017_private_paper_mode_implementation_backlog.md
SURE-002B_PRIVATE_PAPER_MODE_INTAKE
provider_connections=prohibited
execution=prohibited
accepted=false
```

This phase still requires Federico's pinned `betting-win` export/interface before real upstream evaluation. It may not add provider connections, direct database reads, wallet/signer/order code, public signals, profitability claims, or execution readiness. The live execution prohibition is the current safety gate; future surebet execution decisions require a separate ADR and new validators.

Current retained state: the repo-local SURE-002B backlog is complete, the freeze gate is documented, and the first remaining non-local step still requires Federico's real pinned `betting-win` bundle. Placeholder paths are invalid and fail preflight.

## Automation operating model

The repo now uses the shared root automation command surface:

```text
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
update_git.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
run-autonomous-bugfix.sh
```

`run-paper-evaluation.sh` is the canonical private paper supervisor and replaces
`run-paper-evaluation-12h.sh` naming. For the current `SURE-002B` freeze state it
is configured only for repo-local private fixture evaluation. Its pinned-bundle branch is shell-quoted and strict about `SUREBET_REQUIRE_PINNED_BUNDLE`, but must not be used with real operator input unless Federico provides a repo-local pinned `betting-win` bundle. It does not
start services, stop services, call providers, or mutate live/runtime state.

Protected automation files are documented in `docs/automation/PROTECTED_AUTOMATION_FILES.md`.
Normal autonomous cycles must not change them.


## Automation helper standardization

Approved helper wave standardizes `update_git.sh`, `zip_codebase.sh --artifacts-only`, `pull_artifacts_and_zip_codebase.sh`, progress/log helpers, `start.sh`, `stop.sh`, and `.automation/lib/telegram_notify.sh`. The controller waves standardize `run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, `run-paper-evaluation.sh`, and `run-paper-autopilot.sh` with canonical flags, fail-closed artifact/status handling, and Telegram final notifications. The paper controller is surebet-specific and no-service: private fixture smoke now, with pinned-bundle command hardening complete and real upstream evaluation still blocked on Federico's pinned bundle/interface.


## Paper autopilot operating model

Use `run-paper-autopilot.sh` for unattended no-service private paper evaluation plus bounded implementation handoffs. Do not add provider clients, direct DB reads, execution paths, service lifecycle, public reports, profitability claims, or live readiness claims.
