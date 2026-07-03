# 018 — Private paper-mode runbook

This runbook is for `betting-win-surebet` only. It never authorizes provider connections, direct `betting-win` database reads, live collectors, wallets, signers, orders, public reports, profitability claims, or execution readiness.

## Current mode

```text
phase=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
mode=private_paper_only
provider_connection=prohibited
execution=prohibited
input=repo-local JSON bundle or repo-local pinned-bundle directory
output=artifacts/private-paper-mode/*.json
accepted=false
```

## Validation-first entry

Run full repo validation before any paper-mode smoke:

```bash
npm run validate
```

If validation fails, stop and repair the repo-local defect before producing or trusting any private paper-mode artifact.

## Fixture smoke

Use the local fixture only to validate the repo-local paper pipeline:

```bash
node cli.js local-report \
  --bundle tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json \
  --output artifacts/private-paper-mode/fixture-smoke.report.json
```

The result is private, fixture-only, and not real upstream evidence. A passing fixture smoke proves only that the local deterministic paper path still works over fake/local fixtures.

## Pinned bundle smoke

When Federico provides a pinned `betting-win` export bundle, place it under the repo working tree or pass a repo-local path. Then run:

```bash
SUREBET_PINNED_BUNDLE=path/to/pinned-betting-win-export.json bash commands/run-pinned-interface-smoke.sh
```

The command must fail closed on missing paths, remote URLs, provider URLs, credentials, execution language, or outputs outside `artifacts/private-paper-mode/`.

If the report is blocked, keep the artifact and stop. Do not loosen validation, do not retry with remote inputs, and do not reinterpret the result as live or provider-backed evidence.

## Pinned bundle batch

When a repo-local directory contains multiple pinned `betting-win` export bundles, run:

```bash
node cli.js local-report-batch \
  --bundle-dir path/to/pinned-bundle-dir \
  --output artifacts/private-paper-mode/pinned-bundle-batch-summary.json
```

The batch command must fail closed on remote paths, repo escapes, invalid pinned intake, or outputs outside `artifacts/`. On success it writes one private report per bundle plus a deterministic private batch summary with blocker frequencies and candidate counts only.

## Blocked report interpretation

A report with `status=blocked` or `accepted=false` is negative evidence, not a near-ready opportunity. It means the local bundle or report failed a required contract such as settlement coverage, quote freshness, quote currency consistency, or pinned-intake validation. Preserve the artifact, inspect `blockers`, and stop instead of promoting or re-running with weaker checks.

## Freeze gate

The repo-local private paper-mode backlog is complete only when all of the following stay true:

- `npm run validate` passes.
- The local fixture smoke command writes a private artifact under `artifacts/private-paper-mode/`.
- Real upstream evaluation still requires Federico's repo-local pinned `betting-win` bundle.

## Stop conditions

Stop after the freeze gate passes unless a concrete repo-local defect is confirmed.

Stop if the pinned bundle is missing, the pinned smoke command returns an intake error, or any private paper-mode report stays blocked.

Do not claim live readiness, profitability, execution readiness, or provider-backed acceptance from any private paper-mode artifact.
