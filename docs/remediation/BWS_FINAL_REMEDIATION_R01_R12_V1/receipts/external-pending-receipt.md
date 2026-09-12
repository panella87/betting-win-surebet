
# external-pending-receipt

Schema: `../schemas/external-pending-receipt.schema.json`
Non-evidence example: `../examples/external-pending-receipt.example.json`

## Purpose

This immutable receipt records the `external-pending-receipt` boundary for `BWS_FINAL_REMEDIATION_R01_R12_V1`. Unknown fields are rejected. Missing required fields fail closed. Raw secrets, credentials, passwords, tokens, private keys, or protected configuration values are prohibited.

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
- internal_postimage_generation_id
- internal_requirements_closed
- missing_external_evidence
- non_promotable_holds

## Digest and lineage

- Canonical receipt bytes use UTF-8 JSON, sorted object keys, no insignificant semantic defaults, and a final newline.
- `parent_receipt_sha256` binds the consuming hierarchy; `previous_receipt_sha256` binds supersession/retry lineage.
- Repository, source/postimage, runtime, test, environment, and hold identities must name the exact consumed generation.
- A mutable filename, latest pointer, status marker, or caller-provided hash is not independently sufficient.

## Failure behavior

Missing, blank, null where disallowed, unknown state, wrong generation, stale parent, invalid digest, wrong runtime, unexecuted proof, or conflicting identity is `BLOCKED`. No inferred default or external-evidence substitution is permitted.

Only T29 and T36 may use this receipt. It is non-promotable and retains every applicable hold.
