# BWS service run contract

The current repo does not yet have the final BWS service stack. `BWS-400` through `BWS-500` implement API, workers, UI, configuration, security, observability, and process definitions. `BWS-510` remains the integrated local acceptance gate.

The local closed-stack contract requires explicit runtime configuration:

- `BETTING_WIN_REPO_PATH`
- `BWS_UPSTREAM_LOCK_PATH`
- `BWS_API_PORT`
- `BWS_WORKER_ID`
- `BWS_WORKER_QUEUE_NAME`
- `BWS_WORKER_LEASE_DURATION_MS`
- `SUREBET_RUNTIME_MODE=paper`
- `SUREBET_PROVIDER_CONNECTIONS=disabled`
- `SUREBET_EXECUTION_ENABLED=false`

Run `npm run validate:loopback-acceptance` only with an explicit disposable PostgreSQL test configuration. The validator fails closed if the upstream path is missing, the database environment is incomplete, or the DB-backed acceptance test would otherwise skip.

The BWS API remains loopback-only and surfaces `/health` and `/readiness`. Missing operational-status evidence fails closed instead of silently degrading. The cockpit browser config also remains explicit: `VITE_BWS_COCKPIT_DATA_MODE` must be set, and `VITE_BWS_COCKPIT_API_BASE_URL` is accepted only for loopback hosts.

Until those tasks are validated:

- retained paper evaluation is no-service and fixture/pinned-bundle only;
- no provider endpoint or provider credential is accepted;
- no direct betting-win database access is allowed;
- no execution path is enabled.

After `BWS-510`, service processes remain loopback/read-only by default. Continuous external paper observation still requires `BWS-600` evidence and operator configuration.
