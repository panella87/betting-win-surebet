# BWS service run contract

The repository currently contains validated service-runtime configuration, read-only HTTP handlers, bounded workers and loopback acceptance, but it does not yet contain a complete operator-runnable continuous service lifecycle.

Current evidence:

```text
start.sh=install_and_validate_only
stop.sh=no_long_running_service
cli.js=local_report_commands_only
paper_evaluation=single_pass_no_service
```

`BWS-520` through `BWS-580` must produce canonical executable API/worker entrypoints, explicit export/API convergence, continuous scheduling, verified lifecycle commands, status/evidence publication and integrated continuous-runtime acceptance.

The closed-stack contract requires explicit runtime configuration, including `BETTING_WIN_REPO_PATH`, the upstream lock, PostgreSQL, loopback API port, worker identity/queue/lease, `SUREBET_RUNTIME_MODE=paper`, provider connections disabled and execution disabled.

The API must remain loopback-only and surface `/health` and `/readiness`. Missing operational evidence must fail closed. The cockpit must use explicit mock or loopback API mode.

After `BWS-580`, service processes remain loopback/read-only by default. Continuous external paper observation still requires `BWS-600` evidence and operator configuration.
