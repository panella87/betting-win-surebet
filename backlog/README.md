# BWS implementation backlog

`bws_full_implementation.csv` is the binding dependency ledger for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

`bws_remaining_safe_local_map.csv` is the supporting implementation map for the remaining `BWS-590` through `BWS-599` work. It decomposes each binding row into dependency-ordered, acceptance-backed subtasks without replacing the parent ledger.

Status values in the binding ledger:

```text
PENDING
IN_PROGRESS
VALIDATED
BLOCKED
PARKED
```

The controller selects the first `PENDING` row whose internal dependencies are `VALIDATED`. It updates a row only after implementation, focused success/failure proof, restart/idempotency/cleanup or recovery proof where applicable, canonical validation and regenerated source evidence pass.

`BWS-100` through `BWS-589` are validated. Safe local implementation remains from `BWS-590` through the terminal gate `BWS-599`. `BWS-600` is externally blocked and `BWS-900` is separately parked.

Historical SURE ledgers are retained evidence, not routing authority.
