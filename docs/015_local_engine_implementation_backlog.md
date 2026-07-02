# 015 — Local engine implementation backlog

This document starts the next phase after the SURE-001 hardening backlog was exhausted.

The objective is to implement the maximum safe repo-local surebet engine work that does **not** require provider connections, live evidence, direct `betting-win` database access, or a real upstream export bundle.

The allowed phase name is:

```text
SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP
```

This is not full SURE-002 acceptance. A real pinned `betting-win` contract/export interface is still missing. Until Federico provides it, every implementation must remain fixture-driven, local-only, paper-only, and clearly blocked from real readiness claims.

## Stop diagnosis for the previous loop

The 2026-07-01 loop stopped correctly because all documented SURE-001 hardening items were complete and the controller was still configured to stop once only SURE-002+ work remained.

That was not a crash.

## Allowed implementation without a real upstream bundle

The repo may now implement deterministic local contracts and algorithms that are independent of provider access:

```text
local export-bundle schema and parser
local read-only fixture bundle reader
canonical identity record validation shape
rule/finality record validation shape
quote/depth/capacity record validation shape
settlement replay input shape and settlement replay consumption
standard binary complete-set grouping
terminal scenario cash-flow construction
fixed-point stake-vector math
partial completion and residual exposure state machines
private paper report assembly
offline CLI/report commands over local fixtures only
```

These implementations must remain blocked from real use until a pinned upstream `betting-win` interface is provided and accepted.

## Still forbidden

Do not implement:

```text
provider SDK/client imports
provider URLs
provider credentials
live collectors
wallets
signers
token approvals
orders
cancellations
redemptions
cashouts
transactions
public signals
profitability claims
execution readiness claims
direct betting-win PostgreSQL access
core.* migrations
manual vendoring of generated betting-win contracts
```

## Local implementation backlog

Work down this list in order. Re-check current code before editing. Skip an item only if it is already implemented and covered by validation.

1. **SURE-002A export bundle contract.** Harden the local `BettingWinExportBundle` envelope: schema string, `reference.source='betting-win'`, non-empty contract version, 64-hex manifest hash, ISO exported timestamp, bundle kind enum, and readonly records array. Add focused parser tests for malformed and accepted local fixture bundles.
2. **SURE-002A local bundle reader.** Add a local-filesystem-only fixture reader that reads JSON export bundles from a repo-local path. Reject remote URLs, absolute paths outside the repo, missing files, malformed JSON, and bundles that fail the contract parser. Do not connect to providers, databases, or networks.
3. **SURE-002A resource record contracts.** Add local TypeScript contracts and validators for identity, rule/finality, quote/depth/capacity, and settlement replay records. They may validate fake/local fixtures only and must not claim upstream readiness.
4. **SURE-003 market group assembler.** Build a standard-binary complete-set candidate group from validated local records. Reject unresolved identity, unknown provider generation, mismatched rule profiles, missing result source/finality policy, non-YES/NO outcomes, and incomplete groups.
5. **SURE-003 scenario cash-flow builder.** Build deterministic terminal-scenario cash-flow rows from a validated standard-binary group, stakes, payouts, fees, and costs. Keep all money values fixed-point integers and reject negative values, missing scenarios, or unknown outcomes.
6. **SURE-004 stake-vector solver.** Implement local paper-only fixed-point stake-vector solving for a complete standard-binary scenario matrix under capacity and rounding constraints. Output blockers instead of acceptance when constraints are insufficient. Do not make profitability claims.
7. **SURE-004 solver edge coverage.** Add tests for insufficient capacity, minimum stake inversion, fee/cost effects, rounding dust, impossible non-negative worst-case exposure, and deterministic output ordering.
8. **SURE-005 completion state machine.** Implement local paper leg-state and group-state simulation for open, reserved, filled, failed, stale, settlement-pending, complete, incomplete, and killed states. Avoid execution terminology beyond blocked safety docs/tests.
9. **SURE-005 residual exposure analyzer.** Compute residual exposure for incomplete local paper groups from filled/failed/stale legs and scenario rows. Return blockers for missing scenarios or inconsistent state.
10. **SURE-006 settlement replay consumer.** Consume a local settlement replay fixture shape and map final outcomes to terminal scenarios. Do not infer finality. Reject missing finality authority or replay manifest hash.
11. **SURE-007 private paper report assembler.** Produce deterministic private blocked/opportunity/run reports from local fixture results. Reports must include blockers and must not contain public-signal, execution-readiness, or profitability-claim language.
12. **Offline local CLI/report path.** Add a CLI or script entrypoint that validates a local fixture bundle and writes a private paper report to `artifacts/` only. It must refuse provider URLs, remote inputs, `.env` mutation, or real-money claims.

## Current code status

As of 2026-07-02, all twelve local implementation backlog items above are implemented and covered by `npm run validate`.

The safe repo-local SURE-002A backlog is exhausted. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens one of these local-only items. Real upstream evaluation remains blocked pending Federico's pinned `betting-win` contract/export interface.

## Continuation rule

The autonomous controller should write:

```text
CONTINUE_REQUIRED=yes
```

while any safe unchecked item in this document remains.

It should write:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
```

only when this local backlog is exhausted or the first remaining work requires Federico's real pinned `betting-win` export/interface.

It should write:

```text
BLOCKED=yes
```

only for a concrete repo-local validation defect, unsafe boundary conflict, missing mandatory evidence for the selected item, or an unavailable human decision.
