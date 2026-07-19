# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
current_task_status=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE
selected_controller=run-paper-autopilot.sh
safe_local_terminal_gate=BWS-599
bws600_upstream_api_preflight_source_fix=present
```

`BWS-100` through `BWS-589` are validated carry-forward foundations. The runtime has full product lifecycle ownership, database lifecycle, observability, root wrappers, service-owned paper evaluation and runtime-evidence paper autopilot.

The safe-local queue through `BWS-599` is complete. `BWS-592` soak/failure injection, `BWS-593` external preflight, and `BWS-599` final acceptance are validated carry-forward surfaces. The active gate is `BWS-600` external runtime evidence.

`BETTING_WIN_REPO_PATH` remains a read-only pointer to the existing betting-win checkout. BWS reads committed `HEAD` through Git objects and must not clone, clean, reset or modify that checkout.

## Controller selection

```text
run-autonomous-implementation.sh  selected only for future validated source-fix handoffs
run-autonomous-bugfix.sh          standalone audit only
run-bugfix-autopilot.sh           broad audit and automatic repair after implementation
run-paper-evaluation.sh           fixture evaluator plus validated runtime-evidence mode
run-paper-autopilot.sh            selected runtime-evidence parent for BWS-600
```

Paper autopilot is selected because the `BWS-600` runtime-evidence path now has a fail-fast upstream betting-win API availability gate. The remaining blocker is external operator-approved upstream API availability.

## Exact protected-file policy

The historical `BWS-587` through `BWS-589` phase used an exact reviewed allowlist that included `run-autonomous-implementation.sh` for runtime-evidence return handoffs.

The current task source contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. Any protected automation change blocks the cycle unless an external overlay first updates the binding task source. The blanket manual override is disabled.

## Process-test boundary

Autonomous cycles may not mutate pre-existing services or user sessions. Bounded repo-owned loopback child processes are permitted only for task-required lifecycle, crash, restart, shutdown, recovery or soak tests. They must use unique identities and ports, remain attached to the test and be cleaned up by the command that created them.

## Notifications and child results

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final parent notification. Standalone controllers retain their own final notification. Parent/child terminal state uses the atomic child-result side channel, never streamed human output.


## Clean validation bootstrap

`npm test` now builds the root TypeScript graph, generates and verifies the exact committed-HEAD betting-win lock, creates the ignored repo-local `artifacts/` directory, and only then starts the serialized compiled test suite. Validation must not depend on stale generated state from a previous controller run.

The managed cockpit build replaces browser assets but atomically preserves `dist/apps/web/src`, which contains Node-importable modules required by the API and lifecycle CLIs. `validate:web` uses that managed builder with the explicit loopback validation port `4312`; it does not invoke destructive Vite output directly. This keeps `start.sh`, release packaging, and clean-checkout tests deterministic after the browser build.

## Evidence packaging

All root controllers archive the complete `artifacts/` directory with fast standard ZIP compression and refresh the current final summary after lock classification. Repo-local temporary files are used instead of relying on writable `/tmp`.

For status, inspect machine-readable retained evidence. Do not infer success from elapsed time or exit code alone.

## Temporary-file and inode safety

`docs/automation/repository-temp-inode-safety.md` is binding for every autonomous, bugfix, paper, and parent-autopilot controller. `run_common.sh` creates one `.automation/tmp/sessions/...` root per controller, propagates `TMPDIR`/`TMP`/`TEMP`, performs byte and inode preflight, and runs a bounded capacity watchdog. Parent and child controllers receive distinct roots.

The operator maintenance command is `cleanup_automation_temp_inode_residue.sh`. It is dry-run by default and never performs a generic `/tmp` purge.
## API-only upstream transport

The BWS runtime consumes betting-win only through its accepted read-only API. `BWS_UPSTREAM_MODE` and the file-export runtime selector are removed. Missing API readiness is a runtime-evidence blocker; there is no automatic file fallback.

The supported root runtime path enforces `SUREBET_RUNTIME_MODE=paper`, `SUREBET_PROVIDER_CONNECTIONS=disabled`, and `SUREBET_EXECUTION_ENABLED=false`. Explicit process values win for approved non-policy connection settings; the selective `.env` reader accepts the canonical `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` tuple and derives internal `SUREBET_PG_*` values. Repo-owned defaults cover BWS runtime intervals, worker identity, API transport, cockpit mode, upstream lock path, and the standard private-paper schedule path. Retired export selectors, pinned bundles, and URL-style database variables are rejected or scrubbed before runtime child startup. The root paper-runtime-evidence wrapper rebuilds the compiled runtime and managed cockpit assets immediately before evidence collection, so BWS-600 does not depend on stale `dist/apps/web/index.html` output from earlier validation stages. Runtime-evidence startup requires the managed API health endpoint to be observable, then records readiness as evidence over the requested window; if health is not observable, the lifecycle error includes bounded repo-local child stdout/stderr log paths, redacted log tails, and last probe details. The runtime-evidence command timeout is the requested duration plus 300 seconds.

- `docs/automation/api-only-upstream.md`: binding API-only betting-win transport contract.

### Watchdog measurement-race hardening

<!-- WATCHDOG_RACE_TOLERANCE_V2 -->

The centralized temp/inode guard no longer treats a single `du` traversal race as a controller failure. Sustained unusable measurements and genuine capacity breaches remain fail-closed and exact-owner scoped.
