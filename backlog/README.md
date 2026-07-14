# BWS implementation backlog

`bws_full_implementation.csv` is the binding dependency ledger for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

Status values:

```text
PENDING
VALIDATED
BLOCKED
PARKED
```

The controller selects the first dependency-ready `PENDING` row and updates status only after required proof passes. Historical SURE ledgers are not routing authority.
