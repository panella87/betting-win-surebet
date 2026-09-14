# Server launch contract

Target repository: `$HOME/app_testing/betting-win-surebet`.

Before T39 is accepted, `update_git.sh` is itself inside the admitted correction boundary. The bootstrap synchronization therefore uses a strict, non-interactive, fast-forward-only Git pull without mutating repository Git configuration. SSH remotes require an already pinned host key and batch authentication; missing trust or credentials stop the launch.

After synchronization, the operator activates exact Node `v20.20.2` and invokes `run-unattended-remediation-campaign.sh` in the foreground. The launcher initializes or resumes `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json`, obtains one kernel lock, captures one preimage per tranche, processes one exact tranche at a time, and returns to the same shell on completion, blocker, validation failure, deadline, or interruption.

Default cumulative operator window: 28 days. Pre-S2 task ceiling: 12 hours, clipped to the remaining campaign window. Post-S2 controller attempt ceiling: 72 hours, repeated only while the same tranche remains admitted and the persisted global window remains.

No force unlock is attempted. No existing controller is invoked before all thirteen S1/S2 tranche results are accepted and the S2 verifier passes.
