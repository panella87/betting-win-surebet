# BWS service run contract

The repository now contains validated service-runtime configuration, read-only HTTP handlers, bounded workers, loopback acceptance, repo-owned loopback API lifecycle commands, persisted runtime/API/cockpit convergence, integrated continuous-runtime acceptance, and the strict machine-readable runtime handoff required for the closed local private-paper surface.

Current evidence:

```text
start.sh=install_and_validate_only
stop.sh=no_long_running_service
cli.js=includes_product_owned_runtime_lifecycle_commands
paper_evaluation=single_pass_no_service
```

`BWS-520` through `BWS-580` produced canonical executable API/worker entrypoints, explicit export/API convergence, continuous scheduling, verified lifecycle commands, status/evidence publication, API/cockpit convergence, integrated continuous-runtime acceptance, and strict handoff packaging. `BWS-600` is the remaining external gate.

The closed-stack contract requires explicit runtime configuration, including `BETTING_WIN_REPO_PATH`, the upstream lock, PostgreSQL, loopback API port, worker identity/queue/lease, `SUREBET_RUNTIME_MODE=paper`, provider connections disabled and execution disabled.

The API must remain loopback-only and surface `/health` and `/readiness`. Missing operational evidence must fail closed. The cockpit must use explicit mock or loopback API mode.

After `BWS-580`, service processes remain loopback/read-only by default. Continuous external paper observation still requires `BWS-600` evidence and operator configuration.
