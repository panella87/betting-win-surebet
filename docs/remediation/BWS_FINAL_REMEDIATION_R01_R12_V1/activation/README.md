# Activated unattended remediation campaign

This directory activates `BWS_FINAL_REMEDIATION_R01_R12_V1`. BWS122 remains the frozen review and finding baseline; exact mutable source identity is captured at each tranche preimage.

## Execution shape

1. Orders 1 through 13 execute as repeated bounded direct Codex sessions. No existing repository controller is invoked.
2. A kernel-owned launcher lock permits only one campaign process. Its exact device/inode identity is rechecked around every child and proof cycle, so unlink-and-recreate cannot create a second owner. Each Codex or controller child is additionally owned by `scripts/run_bounded_remediation_child.py`, a Linux subreaper that enforces the clipped timeout, blocks interactive Git transport, removes inherited repository/SSH/database credentials, and terminates only its process group, token-owned descendants, and observed descendants before control returns.
3. Before any tranche command, the validator captures one immutable full-tree preimage outside excluded generated and secret paths. Secret-bearing paths are never read and their metadata must remain unchanged.
4. Every restart rechecks the current delta against the retained preimage and the exact tranche path authority before Codex resumes.
5. The validator independently computes the postimage delta, generation IDs, parent receipt, mapped test IDs, test-to-finding membership, production-entrypoint flags, proof lanes, protected-file allowance, and retained holds.
6. `scripts/validate_remediation_tranche_evidence.py` independently re-executes every declared test command in a scrubbed, time-bounded, output-bounded child process and checks for surviving token-owned descendants. It records dynamic production-path execution from Node V8 coverage, Python tracing, and Bash source tracing; Linux process observations are retained as diagnostics but cannot independently satisfy production-entrypoint proof. Acceptance requires a trusted attestation bound to the exact result, validator, verifier, preimage, postimage, test outputs, dynamic entrypoint paths, and proof environments. Listed-but-unrun tests, arbitrary hashes, and tests that merely mention a production filename are rejected.
7. Every test command must bind its exact requirement ID. A production-entrypoint requirement must additionally execute or load at least one exact mapped production source path during trusted replay; argv or source-text references alone are only a preflight filter.
8. All 21 protected automation paths from `automation.config.sh` are enforced. Only a tranche's exact allowlist may change, and immutable acceptance maps, schemas, packets, and the test matrix are checksum-pinned to the campaign-admission Git commit. The launcher rejects any later commit, branch, upstream, index, or worktree-manifest substitution.
9. `ACCEPTED` advances exactly one order. Every accepted history event is revalidated against its immutable result digest, exact predecessor chain, retained preimage, mapped tests, proof lanes, and trusted attestation before later work or the S2 controller gate may proceed. `BLOCKED` and `SOURCE_COMPLETE_EXTERNAL_PENDING` are persisted as terminal non-advancing states. Unknown or malformed states fail closed.
10. After T47 and the complete S2 gate pass, orders 14 through 47 use the repaired `run-autonomous-implementation.sh`, one exact composite task file per invocation.
11. The operator window is persisted in campaign state on first launch and cannot be extended by restarting. Direct attempts retry only inside that same window and preserve invalid receipts for audit.

## Files

- `active-campaign-admission.json`: binding activation authority.
- `unattended-plan.json`: exact 47-order routing plan and per-tranche protected-file allowance.
- `campaign-state.seed.json`: immutable seed copied into the artifact state root on first launch.
- `tasks/`: one exact task source per tranche.
- `validate_activation_package.py`: static, state, preimage, postimage, dependency, path, and receipt verifier.
- `scripts/validate_remediation_tranche_evidence.py`: trusted bounded test replay, dynamic production-entrypoint observation, and attestation generator.
- `scripts/run_bounded_remediation_child.py`: subreaper-based Codex/controller timeout and descendant-containment supervisor.
- `run-unattended-remediation-campaign.sh`: locked, fixed-order foreground runner with persistent retry and resume behavior.
- `bounded-tranche-task-contract.md`: receipt and implementation transaction.
- `risks-and-stop-conditions.md`: non-negotiable stop conditions.
- `server-runbook.md`: strict bootstrap and launch boundary.

The runner never commits, pushes, pulls, resets, cleans, stashes, switches branches, deploys, starts live execution, accesses `betting-win`, or force-unlocks a controller.
