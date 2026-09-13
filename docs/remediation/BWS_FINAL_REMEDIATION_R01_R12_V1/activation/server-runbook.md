# Server launch contract

Target repository: `$HOME/app_testing/betting-win-surebet`.

The operator performs one existing-helper pull, activates exact Node `v20.20.2`, and invokes `run-unattended-remediation-campaign.sh` in the foreground. The launcher initializes or resumes `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json`, processes one exact tranche at a time, and returns to the same shell on completion, blocker, validation failure, deadline, or interruption.

Default operator window: 28 days. Pre-S2 task timeout: 12 hours each. Post-S2 controller attempt: 72 hours, repeated only while the same tranche remains admitted and the global window remains.

No force unlock is attempted. No controller is invoked before all thirteen S1/S2 tranche results are accepted and the S2 verifier passes.
