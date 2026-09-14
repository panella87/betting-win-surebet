# BWS_FINAL_REMEDIATION_R01_R12_V1

This tree contains the complete R01-R12 remediation architecture, 47 tranche packets, maps, schemas, proof runbooks, receipts, and the later activation package.

## Current state

```text
program_id=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
canonical_node=v20.20.2
```

The original documentation package was generated as `PROPOSED_NOT_ACTIVE` against BWS122. The explicit user authorization and BWS123 activation overlay superseded that proposal state. Current authority is:

- `activation/active-campaign-admission.json`
- `activation/unattended-plan.json`
- `activation/tasks/`
- `activation/immutable-authority.sha256`
- `activation/run-unattended-remediation-campaign.sh`
- the live campaign state under `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/` when present

The `s0/proposed-*` files and examples remain retained audit history. They do not override the active admission.

## Frozen review baseline

- Baseline: `betting-win-surebet122.zip`
- SHA-256: `e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd`
- Confirmed findings: `173`
- Tranches: `47`
- Stages: `S0` through `S7`
- Implementation parallelism: one source-mutating tranche at a time

## Navigation

- [Active campaign](activation/README.md)
- [Program authority](program-authority.md)
- [Baseline authority](baseline-authority.md)
- [Campaign order](campaign-order.md)
- [Dependency graph](dependency-graph.md)
- [Ownership and shared paths](ownership-and-shared-paths.md)
- [Hold register](hold-register.md)
- [Completion criteria](completion-criteria.md)
- [Stages](stages/README.md)
- [Tranche packets](tranches/README.md)
- [Finding and path maps](maps/README.md)
- [Immutable generations](generations/immutable-generations.md)
- [Receipt contracts](receipts/README.md)
- [JSON Schemas](schemas/README.md)
- [Proof runbooks](runbooks/README.md)
- [Hold decisions](holds/README.md)

## Non-promotion rule

Activation does not release BWS-600, BWS-710, BWS-900, release, deployment, or live execution. It does not authorize provider access or `betting-win` checkout access or mutation.
