# Receipt contracts and tranche state machine

Allowed tranche states are exactly:

```text
NOT_ADMITTED
ADMITTED
SOURCE_IMPLEMENTED
FOCUSED_TESTS_PASSED
ENVIRONMENT_PROOF_PASSED
ACCEPTED
BLOCKED
SOURCE_COMPLETE_EXTERNAL_PENDING
```

Valid transitions:

- `NOT_ADMITTED` → `ADMITTED`, `BLOCKED`
- `ADMITTED` → `SOURCE_IMPLEMENTED`, `BLOCKED`
- `SOURCE_IMPLEMENTED` → `FOCUSED_TESTS_PASSED`, `BLOCKED`, `SOURCE_COMPLETE_EXTERNAL_PENDING`
- `FOCUSED_TESTS_PASSED` → `ENVIRONMENT_PROOF_PASSED`, `ACCEPTED`, `BLOCKED`, `SOURCE_COMPLETE_EXTERNAL_PENDING`
- `ENVIRONMENT_PROOF_PASSED` → `ACCEPTED`, `BLOCKED`, `SOURCE_COMPLETE_EXTERNAL_PENDING`
- `ACCEPTED` → terminal
- `BLOCKED` → terminal
- `SOURCE_COMPLETE_EXTERNAL_PENDING` → terminal

`SOURCE_COMPLETE_EXTERNAL_PENDING` is terminal and non-promotable. Unknown states or transitions fail closed.

## Contracts

- [campaign-admission](campaign-admission.md)
- [tranche-admission](tranche-admission.md)
- [preimage-receipt](preimage-receipt.md)
- [current-source-reverification-receipt](current-source-reverification-receipt.md)
- [implementation-postimage-receipt](implementation-postimage-receipt.md)
- [focused-test-receipt](focused-test-receipt.md)
- [production-entrypoint-test-receipt](production-entrypoint-test-receipt.md)
- [environment-proof-receipt](environment-proof-receipt.md)
- [rollback-receipt](rollback-receipt.md)
- [tranche-result](tranche-result.md)
- [stage-result](stage-result.md)
- [campaign-result](campaign-result.md)
- [external-pending-receipt](external-pending-receipt.md)
- [hold-release-decision](hold-release-decision.md)
