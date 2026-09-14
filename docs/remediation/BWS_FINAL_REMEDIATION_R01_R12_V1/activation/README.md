# Activated unattended remediation campaign

This directory activates `BWS_FINAL_REMEDIATION_R01_R12_V1`. BWS122 remains the frozen review and finding baseline; exact mutable source identity is captured at each tranche preimage.

## Execution shape

1. Orders 1 through 13 execute as separate bounded direct Codex sessions. No existing repository controller is invoked.
2. A kernel-owned launcher lock permits only one campaign process. The lock is released automatically when the process ends; no lock deletion or process killing is used.
3. Before any tranche command, the validator captures one immutable full-tree preimage outside excluded generated and secret paths. Secret-bearing paths are never read and their metadata must remain unchanged.
4. The validator independently computes the postimage delta, exact generation IDs, parent receipt, mapped test IDs, test-to-finding membership, production-entrypoint flags, proof lanes, protected-file allowance, and retained holds. A self-reported count or arbitrary test ID is not acceptance evidence.
5. `ACCEPTED` advances exactly one order. `BLOCKED` and `SOURCE_COMPLETE_EXTERNAL_PENDING` are persisted as terminal non-advancing states. Unknown or malformed states fail closed.
6. After T47 and the complete S2 gate pass, orders 14 through 47 use the repaired `run-autonomous-implementation.sh`, one exact task file per invocation.
7. The 28-day operator window is persisted in campaign state on first launch and cannot be extended by restarting the launcher. Every direct or controller attempt is clipped to the remaining window.

## Files

- `active-campaign-admission.json`: binding activation authority.
- `unattended-plan.json`: exact 47-order routing plan and per-tranche protected-file allowance.
- `campaign-state.seed.json`: immutable seed copied into the artifact state root on first launch.
- `tasks/`: one exact task source per tranche.
- `validate_activation_package.py`: static, state, preimage, postimage, dependency, test, environment, and receipt verifier.
- `run-unattended-remediation-campaign.sh`: locked, fixed-order foreground runner.
- `bounded-tranche-task-contract.md`: receipt and implementation transaction.
- `risks-and-stop-conditions.md`: non-negotiable stop conditions.
- `server-runbook.md`: strict bootstrap and launch boundary.

The runner never commits, pushes, pulls, resets, cleans, stashes, switches branches, deploys, starts live execution, accesses `betting-win`, or force-unlocks a controller.
