# Risks and mandatory stop conditions

The campaign stops without trying an alternative route when any of these conditions occurs:

- a tranche cannot reverify its finding against current source;
- a dependency is missing, blocked, stale, or not `ACCEPTED`;
- exact Node `v20.20.2` is unavailable;
- required disposable PostgreSQL, filesystem, systemd, crash/restart, browser, soak, or other environment proof cannot be produced;
- a task requires a path outside its admitted correction boundary and cannot justify an admission amendment;
- a protected file differs outside the exact tranche allowlist;
- tests, production entrypoints, validators, or receipt validation fail;
- an existing controller lock blocks the post-S2 controller;
- the 28-day operator window ends;
- external evidence is required and the only lawful terminal state is `SOURCE_COMPLETE_EXTERNAL_PENDING` or `BLOCKED`.

The launcher does not delete locks, kill unrelated processes, infer external evidence, downgrade test scope, substitute Node 22, or continue after an ambiguous result.
