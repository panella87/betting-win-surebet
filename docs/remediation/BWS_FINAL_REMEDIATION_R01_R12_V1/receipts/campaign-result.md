
# campaign-result

Schema: `../schemas/campaign-result.schema.json`
Non-evidence example: `../examples/campaign-result.example.json`

## Purpose

This immutable receipt records the `campaign-result` boundary for `BWS_FINAL_REMEDIATION_R01_R12_V1`. Unknown fields are rejected. Missing required fields fail closed. Raw secrets, credentials, passwords, tokens, private keys, or protected configuration values are prohibited.

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
- result
- finding_count
- tranche_count
- tranche_results
- closure_manifest_sha256
- all_internal_findings_closed

## Digest and lineage

- Canonical receipt bytes use UTF-8 JSON, sorted object keys, no insignificant semantic defaults, and a final newline.
- `parent_receipt_sha256` binds the consuming hierarchy; `previous_receipt_sha256` binds supersession/retry lineage.
- Repository, source/postimage, runtime, test, environment, and hold identities must name the exact consumed generation.
- A mutable filename, latest pointer, status marker, or caller-provided hash is not independently sufficient.

## Failure behavior

Missing, blank, null where disallowed, unknown state, wrong generation, stale parent, invalid digest, wrong runtime, unexecuted proof, or conflicting identity is `BLOCKED`. No inferred default or external-evidence substitution is permitted.
