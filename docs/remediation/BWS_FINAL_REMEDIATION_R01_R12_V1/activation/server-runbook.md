# Server launch contract

Target repository: `$HOME/app_testing/betting-win-surebet`.

Before T39 is accepted, `update_git.sh` is itself inside the admitted correction boundary. Bootstrap synchronization therefore uses a strict, non-interactive, fast-forward-only Git pull without mutating repository Git configuration. SSH remotes require an already pinned host key and batch authentication; missing trust or credentials stop the launch.

After synchronization, the operator activates exact Node `v20.20.2` and invokes `run-unattended-remediation-campaign.sh` in the foreground. The launcher initializes or resumes `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json`, obtains one kernel lock, captures one preimage per tranche, and processes exactly one admitted tranche at a time.

Orders 1 through 13 use repeated bounded direct Codex attempts. Every Codex process runs below `scripts/run_bounded_remediation_child.py`, which acts as a Linux child subreaper, clips the timeout to the persistent operator deadline, disables interactive or remote Git transport, removes inherited repository/SSH/database credential variables, and terminates only the owned process group and tracked descendants before the launcher validates state. An attempt that ends without a result may retry inside the same persisted operator window. A malformed candidate result is preserved under `invalid-results/`; the current source delta is rechecked against the original preimage before any retry. Existing controller locks stop pre-S2 work and are never deleted by this launcher.

The immutable checksum manifest is loaded from the Git commit captured when campaign state is first admitted. The launcher requires that commit, branch, and upstream to remain unchanged across every attempt and restart; changing Git refs or committing a replacement manifest cannot redefine acceptance. Campaign state, tranche-preimage digests, and the launcher lock's device/inode identity are retained and rechecked around every child and proof cycle.

Every complete candidate receipt is independently replayed by `scripts/validate_remediation_tranche_evidence.py`. The verifier executes each exact test argv in a scrubbed bounded process group, recomputes output digests and environment identities, checks for surviving owned descendants, records dynamically executed repository paths from Node V8 coverage, Python tracing, and Bash source tracing, retains `/proc` observations as diagnostics only, builds proof-lane receipts, and writes the trusted attestation required for advancement. Static filename mentions cannot satisfy production-entrypoint proof.

After all thirteen S1/S2 tranches are accepted and every historical result/preimage/attestation chain is revalidated, later tranches use the repaired `run-autonomous-implementation.sh` with one exact composite prompt and 72-hour child windows clipped to the persisted campaign deadline. The repaired controller is itself contained by the same subreaper with a reserved finalization margin. A state-only claim cannot enable the controller.

Default cumulative operator window: 28 days. The recommended bounded campaign command may set seven days. Pre-S2 attempt ceiling: 12 hours. Post-S2 controller attempt ceiling: 72 hours. Restarting does not reset the cumulative window.

No force unlock is attempted. The launcher returns to the same shell on completion, blocker, validation failure, deadline, or interruption. No existing controller is invoked before all thirteen S1/S2 results are accepted and the S2 verifier passes.
