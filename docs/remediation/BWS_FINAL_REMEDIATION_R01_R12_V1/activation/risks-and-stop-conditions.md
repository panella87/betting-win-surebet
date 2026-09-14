# Risks and mandatory stop conditions

The campaign stops without trying an alternative route when any of these conditions occurs:

- another campaign launcher owns the kernel lock;
- a tranche cannot reverify its finding against current source;
- a dependency is missing, blocked, stale, or not `ACCEPTED`;
- exact Node `v20.20.2` is unavailable;
- required disposable PostgreSQL, filesystem, systemd, crash/restart, browser, soak, or other environment proof cannot be produced;
- a task changes secret metadata, immutable activation authority, a future-owner path, or a protected file outside its exact allowlist;
- independently computed changed paths differ from the receipt;
- a receipt omits or invents mapped test IDs, finding membership, production-entrypoint authority, proof lanes, output digests, or generation identities;
- tests, production entrypoints, validators, or receipt validation fail;
- an existing controller lock blocks the post-S2 controller;
- the persisted 28-day operator window ends;
- external evidence is required and the only lawful terminal state is `SOURCE_COMPLETE_EXTERNAL_PENDING` or `BLOCKED`.

`BLOCKED` and `SOURCE_COMPLETE_EXTERNAL_PENDING` are persisted as terminal, non-advancing outcomes. Restarting the launcher does not rerun them or extend the operator window.

The launcher does not delete locks, kill unrelated processes, infer external evidence, downgrade test scope, substitute Node 22, or continue after an ambiguous result.
