# BWS implementation backlog

`bws_full_implementation.csv` is the binding dependency ledger for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

`bws_remaining_safe_local_map.csv` is the supporting implementation map for the remaining `BWS-591` through `BWS-599` work. It decomposes each binding row into dependency-ordered, acceptance-backed subtasks without replacing the parent ledger.

Status values in the binding ledger:

```text
PENDING
IN_PROGRESS
VALIDATED
BLOCKED
PARKED
```

The controller selects the first `PENDING` row whose internal dependencies are `VALIDATED`. It updates a row only after implementation, focused success/failure proof, restart/idempotency/cleanup or recovery proof where applicable, canonical validation and regenerated source evidence pass.

`BWS-100` through `BWS-599` are validated. The full-platform safe-local queue is carry-forward history; `BWS-600` is externally blocked and `BWS-900` is separately parked.

Historical SURE ledgers are retained evidence, not routing authority.


## BWS-700 B1 implementation queue

`backlog/bws_b1_cross_venue_implementation.csv` is the active operator-approved B1 implementation queue. `backlog/bws_b1_cross_venue_map.csv` maps tasks to docs, source areas, validation targets and hard blockers.

`BWS-710` real upstream intake is intentionally blocked until `betting-win` exposes `betting-win.b1_multi_venue_markets.v1`; dependency-ready local offline surfaces may still be implemented without treating fixtures as runtime evidence.
