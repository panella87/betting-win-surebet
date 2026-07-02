# 014 — SURE-001 remaining hardening backlog

This document prevents short autonomous runs from stopping after one tiny SURE-001 slice while safe repo-local hardening work still exists.

The controller still performs one bounded change per cycle. The cycle must write `CONTINUE_REQUIRED=yes` when a safe unchecked item below remains after the current slice. It may write `AUTONOMOUS_GOAL_COMPLETE=yes` only when the SURE-001 backlog is exhausted or the only remaining work is SURE-002+ blocked on Federico's pinned `betting-win` contract/export interface.

## Current stop diagnosis

The 2026-07-01 run stopped cleanly because cycle 2 wrote:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
```

That was not a crash. The run obeyed the older prompt wording that said to implement one bounded SURE-001 hardening slice and stop after that slice.

## Safe SURE-001 backlog

Work down this list in order. Re-check current code before editing; skip an item only if it is already fully implemented and covered by validation.

1. Add a repo-local SOURCE_MANIFEST.json regeneration helper that uses exactly the same inclusion and ordering rules as `scripts/validate_source_manifest.py`. Add a package script and focused test. The helper must not include `.env`, generated archives, `node_modules`, `dist`, `artifacts`, locks, logs, temp files, or Python caches.
2. Require critical validator tests as repo assets in `scripts/validate_repo.py`, starting with `tests/validate-artifact-hygiene.test.ts`, `tests/validate-shell-local-assignments.test.ts`, `tests/validate-source-manifest.test.ts`, and `tests/packaging-helpers.test.ts`.
3. Remove duplicate entries from the controller `REQUIRED_CYCLE_ARTIFACTS` list and add validator/test coverage so duplicate required artifact names cannot silently return.
4. Add focused archive-contract coverage showing `zip_codebase.sh` excludes `.env`, root zips, artifacts, `node_modules`, `dist`, `.locks`, logs, and temporary files from generated source archives.
5. Add focused documentation that maps each SURE-001 validator to the exact risk it controls, so future agents do not weaken validators as a shortcut.
6. Add a non-provider fixture integrity smoke fixture for the pinned-interface placeholder path. It must remain fake/local and must not imply SURE-002 readiness.

## Current code status

As of 2026-07-02, all six SURE-001 hardening items above are implemented and covered by `npm run validate`.

The safe SURE-001 backlog is exhausted. Autonomous cycles should now write `AUTONOMOUS_GOAL_COMPLETE=yes` unless a repo-local validation/tooling defect reopens one of these items.

## Still blocked

SURE-002+ remains blocked pending Federico's pinned upstream interface. Do not implement these until Federico explicitly provides the pinned upstream interface and asks for SURE-002+ work:

```text
provider connections
provider SDK/client imports
wallet/signer/order/transaction paths
direct betting-win DB access
core.* migrations
generated-contract vendoring
solver implementation
stake-vector implementation
leg-completion simulation
residual-exposure engine
settlement replay implementation
profitability or execution-readiness claims
```
