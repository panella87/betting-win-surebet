# Activated unattended remediation campaign

This directory activates `BWS_FINAL_REMEDIATION_R01_R12_V1` from the exact BWS123 repository snapshot while retaining BWS122 as the frozen application-source baseline.

## Execution shape

1. Orders 1 through 13 execute as separate bounded direct Codex sessions. No existing autonomous controller is invoked.
2. Every session may mutate only one admitted tranche, writes immutable receipts under `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1`, and must reach `ACCEPTED` before the next order is admitted.
3. After T47 and the full S2 gate pass, orders 14 through 47 use the repaired `run-autonomous-implementation.sh`, one exact task file per invocation.
4. The launcher has a 28-day operator window and stops on the first failure, blocker, malformed receipt, failed validation, stale dependency, controller lock, or exhausted deadline.

## Files

- `active-campaign-admission.json`: binding activation authority.
- `unattended-plan.json`: exact 47-order routing plan and per-tranche protected-file allowance.
- `campaign-state.seed.json`: immutable seed copied into the artifact state root on first launch.
- `tasks/`: one exact task source per tranche.
- `validate_activation_package.py`: deterministic static, state, dependency, and receipt verifier.
- `run-unattended-remediation-campaign.sh`: operator-launched fixed-order runner.
- `risks-and-stop-conditions.md`: non-negotiable stop conditions.

The runner never commits, pushes, pulls, resets, cleans, stashes, switches branches, deploys, starts live execution, accesses `betting-win`, or force-unlocks a controller.
