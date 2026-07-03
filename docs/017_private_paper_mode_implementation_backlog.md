# 017 — Private paper-mode implementation backlog

This document is the active safe backlog after SURE-001 and SURE-002A local engine completion.

The objective is to implement every repo-local step that can safely exist before live/provider work: pinned-interface intake, deterministic private paper report execution over local JSON bundles, artifact contracts, batch summaries, and fail-closed validation. It does **not** authorize provider connections, direct `betting-win` database reads, generated contract vendoring, wallets, signers, orders, public signals, live collectors, profitability claims, or execution readiness.

The allowed phase name is:

```text
SURE-002B_PRIVATE_PAPER_MODE_INTAKE
```

## Current truth

SURE-001 hardening and SURE-002A local deterministic engine work are complete. The repo can parse local export bundles, read repo-local fixture bundles, assemble standard-binary complete sets, build cash-flow matrices, solve local fixed-point stake vectors, simulate local completion/residual exposure, consume local settlement replay records, and write private fixture-only reports.

The next maximum safe implementation work is private paper-mode intake over repo-local pinned bundles. Real upstream evaluation remains blocked until Federico provides a pinned `betting-win` contract/export interface. Until then, paper-mode commands may use fake/local fixtures for smoke tests only.

## Private paper-mode definition

Private paper mode in this repo means:

```text
input = repo-local JSON export bundle from betting-win or fake/local fixture
provider_connection = prohibited
execution = prohibited
output = private JSON report under artifacts/
accepted = false
status = fixture_results_only or blocked
public_signal = prohibited
profitability_claim = prohibited
```

A private paper-mode report may describe fixture candidates and blockers. It must never claim live readiness, execution readiness, guaranteed profit, or provider-backed acceptance.

## Safe implementation backlog

Work down this list in order. Re-check current code before editing. Skip an item only if it is already implemented and covered by validation.

1. **SURE-002B final local output containment.** Ensure local paper report output paths are realpath-contained inside repo-local `artifacts/`, reject output directory/file symlinks, and add focused tests for symlink escape attempts.
2. **SURE-002B multi-candidate settlement reporting.** Replace ambiguous single-run settlement context with deterministic per-candidate settlement summaries when a run has multiple candidate markets. Keep single-candidate compatibility only when unambiguous.
3. **SURE-002B pinned-interface smoke command.** Add a repo-local command that accepts a local pinned bundle path, refuses URLs and missing paths, runs validation, writes a private paper report under `artifacts/private-paper-mode/`, and never connects to providers.
4. **SURE-002B paper-mode report artifact contract.** Add a validator/test that private paper-mode artifacts must include lane id, run id, source manifest hash, candidate reports, blocker counts, settlement summaries when present, `accepted=false`, and no public-signal/profitability/execution-readiness language.
5. **SURE-002B pinned-bundle intake validation.** Add a dedicated intake validator that checks local bundle path containment, `reference.source=betting-win`, contract version, 64-hex manifest hash, exported timestamp, supported bundle kind, identity/rules/quotes/settlement record coverage, and forbidden credential/execution/provider URL text.
6. **SURE-002B paper-mode batch runner.** Add a repo-local batch runner over a directory of local pinned bundles. It must reject remote paths, write one private report per bundle under `artifacts/private-paper-mode/`, and write a deterministic private batch summary with blocker frequencies and candidate counts only.
7. **SURE-002B paper-mode smoke fixtures.** Add fake/local fixtures for accepted-local, blocked-missing-settlement, blocked-stale-quotes, blocked-mixed-currency, and multi-candidate reports. They must not claim real upstream provenance.
8. **SURE-002B paper-mode runbook and freeze gate.** Document exactly how to run pinned-bundle smoke, how to interpret blocked reports, and when to stop. The freeze gate is: full validation passes, paper-mode smoke passes on local fixtures, and real upstream evaluation still requires Federico's pinned bundle.

## Current code status

As of 2026-07-02, items 1 through 8 are implemented and covered by `npm run validate`.

The safe repo-local private paper-mode backlog is exhausted. `docs/018_private_paper_mode_runbook.md` now documents the operator freeze gate: full validation passes, local fixture smoke passes, and real upstream evaluation still requires Federico's pinned `betting-win` bundle.

Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a concrete repo-local validation/tooling defect reopens safe work or Federico provides the pinned interface for the next blocked boundary.

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

only when this private paper-mode backlog is exhausted or the first remaining work requires Federico's real pinned `betting-win` export/interface.

It should write:

```text
BLOCKED=yes
```

only for a concrete repo-local validation defect, unsafe boundary conflict, missing mandatory local fixture evidence for the selected item, or an unavailable human decision.
