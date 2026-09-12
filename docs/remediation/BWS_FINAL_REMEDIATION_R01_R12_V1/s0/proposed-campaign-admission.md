
# Proposed S0 campaign admission

```text
program=BWS_FINAL_REMEDIATION_R01_R12_V1
baseline=betting-win-surebet122.zip
baseline_sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd
candidate_tranche=BWS-W4-T39
campaign_order=1
stage=S1
owner=R10
activation_state=PROPOSED_NOT_ACTIVE
```

## Authority

This is a proposed, non-active admission record. It does not authorize implementation, does not set an active implementation queue, does not change selected controller routing, and does not release a hold.

## Candidate findings

- BWS121-R10-010
- BWS121-R10-011
- BWS121-R10-012
- BWS121-R10-013

## Candidate paths

- `pull_artifacts_and_zip_codebase.sh` — TO_CONFIRM_DURING_ADMISSION
- `scripts/create-source-handoff-archive.sh` — TO_CONFIRM_DURING_ADMISSION
- `update_git.sh` — TO_CONFIRM_DURING_ADMISSION
- `zip_codebase.sh` — TO_CONFIRM_DURING_ADMISSION

## Activation prerequisites

1. explicit later user instruction naming this program and exactly BWS-W4-T39
2. activation-time Git and working-tree capture
3. exact protected authority verification
4. current-source re-verification for all four findings and four candidate paths
5. exact allowed edit set, read-only set, test command set, and rollback root approved
6. Node/runtime and safe temporary-fixture capability verified
7. no controller process, lock, handoff, artifacts.zip, service, database, provider, or betting-win access active

## Current holds

- BWS-600=BLOCKED
- BWS-710=BLOCKED
- BWS-900=PARKED_NOT_AUTHORIZED
- release=BLOCKED
- deployment=BLOCKED
- live_execution=PROHIBITED

## Source-manifest restriction

`SOURCE_MANIFEST.json` is stale and remains unchanged. It is not the preimage authority. New documentation paths are additional expected drift owned by T40.
