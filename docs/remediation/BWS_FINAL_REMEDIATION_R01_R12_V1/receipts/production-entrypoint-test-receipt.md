
# production-entrypoint-test-receipt

Schema: `../schemas/production-entrypoint-test-receipt.schema.json`
Non-evidence example: `../examples/production-entrypoint-test-receipt.example.json`

## Purpose

This immutable receipt records the `production-entrypoint-test-receipt` boundary for `BWS_FINAL_REMEDIATION_R01_R12_V1`. Unknown fields are rejected. Missing required fields fail closed. Raw secrets, credentials, passwords, tokens, private keys, or protected configuration values are prohibited.

## Required fields

- schema_version
- record_type
- program_id
- repository_identity
- created_at
- clock_authority
- owner
- reviewer
- parent_receipt_sha256
- previous_receipt_sha256
- unresolved_blockers
- retained_holds
- tranche_id
- campaign_order
- state
- postimage_generation_id
- tests
- all_required_tests_bound
- all_required_tests_passed
- production_entrypoint_contract

## Digest and lineage

- Canonical receipt bytes use UTF-8 JSON, sorted object keys, no insignificant semantic defaults, and a final newline.
- `parent_receipt_sha256` binds the consuming hierarchy; `previous_receipt_sha256` binds supersession/retry lineage.
- Repository, source/postimage, runtime, test, environment, and hold identities must name the exact consumed generation.
- A mutable filename, latest pointer, status marker, or caller-provided hash is not independently sufficient.

## Failure behavior

Missing, blank, null where disallowed, unknown state, wrong generation, stale parent, invalid digest, wrong runtime, unexecuted proof, or conflicting identity is `BLOCKED`. No inferred default or external-evidence substitution is permitted.
