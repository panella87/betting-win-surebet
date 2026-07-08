# 018 — Private paper-mode runbook

This runbook is for `betting-win-surebet` only. It never authorizes provider connections, direct `betting-win` database reads, live collectors, wallets, signers, orders, public reports, profitability claims, or execution readiness.

```text
paper_mode_owner=betting-win-surebet
account_policy=separate_from_betting-win-betting
```

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

Run full repo validation under the repo Node runtime before any paper-mode smoke:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
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

Current status: this section is a private paper operator path for a repo-local bundle supplied by Federico. The paper controller now shell-quotes the operator-provided bundle path before any `bash -lc` command construction and validates `SUREBET_REQUIRE_PINNED_BUNDLE` as strict `0` or `1`.

After Federico provides a pinned `betting-win` export bundle, place the bundle under the repo working tree or pass a repo-local path. Then run:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
SUREBET_PINNED_BUNDLE=path/to/pinned-betting-win-export.json \
  bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --model cli-default --fallback-model none
```

The controller must fail closed on missing paths, remote URLs, provider URLs,
credentials, execution language, or outputs outside `artifacts/private-paper-mode/`.
`commands/run-pinned-interface-smoke.sh` remains as a one-shot compatibility
helper and must rely on CLI containment instead of pre-creating artifact
directories. Do not use the compatibility helper for a real pinned bundle until
Federico has provided the repo-local pinned bundle.

If the report is blocked, keep the artifact and stop. Do not loosen validation,
do not retry with remote inputs, and do not reinterpret the result as live or
provider-backed evidence.

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

## Standard paper supervisor

Use the canonical root supervisor for long private fixture observation:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20 && bash ./run-paper-evaluation.sh --duration 72h --interval 5m --adaptive --keep-monitoring-when-ready --model cli-default --fallback-model none
```

This standardized no-service supervisor validates source, runs the configured
repo-local private fixture smoke, writes local artifacts, sends one final
Telegram notification, and never starts/stops services. The pinned-bundle path is
controller-safe now: operator-provided paths are shell-quoted before `bash -lc`
execution and `SUREBET_REQUIRE_PINNED_BUNDLE` is strict `0` or `1`. This
controller is not a replacement for Federico's pinned bundle and must not be
interpreted as real upstream acceptance evidence.


## Autopilot entrypoint

For unattended private paper-mode supervision, use `run-paper-autopilot.sh`. It stops as `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE` when fixture-only proof is complete and no pinned `betting-win` export is available.
