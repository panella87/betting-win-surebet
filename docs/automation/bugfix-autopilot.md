# Bugfix autopilot: betting-win-surebet

`run-bugfix-autopilot.sh` is the unattended parent for bounded source-audit hardening. It is separate from `run-paper-autopilot.sh` and enforces a mandatory same-area re-audit after every validated implementation. The enforced lifecycle is `audit -> implementation -> same-area re-audit`.

Default command after activating Node 20 in the parent shell:

```bash
bash ./run-bugfix-autopilot.sh \
  --duration 7d \
  --bugfix-duration 72h \
  --implementation-duration 72h \
  --max-rounds 0 \
  --max-same-handoff 2 \
  --model cli-default \
  --fallback-model none
```

Workflow:

```text
select one bounded campaign area
  -> run-autonomous-bugfix.sh
  -> confirmed defect? run-autonomous-implementation.sh --handover-bugfix-audit
  -> require validated source change
  -> re-audit the exact same campaign area
  -> close only after BUGFIX_AUDIT_COMPLETE=yes
```

Campaign areas:

```text
boundary_and_input_contracts
filesystem_path_and_artifact_safety
identity_rules_quotes_and_bundle_parsing
scenario_solver_rounding_and_capacity_math
leg_completion_residual_exposure_and_settlement
reports_cli_batch_and_private_artifact_integrity
automation_handoff_lock_manifest_and_packaging_integrity
cross_area_regression_and_campaign_closure
```

Normal `--max-rounds 0` means the parent duration and repeated bug-signature guard control termination. The parent clamps each child duration to the remaining parent budget.

Before acquiring its own lock or creating `artifacts/bugfix_autopilot_*`, the parent runs the shared cross-controller incompatibility guard. A verified live paper parent, standalone implementation, standalone paper evaluation, or unrelated bugfix controller blocks the campaign before any campaign artifact is created. Verified parent-launched audit and implementation children remain the only allowed exceptions. `--print-config` reports `cross_controller_lock_guard=enabled`.

The controller writes `artifacts/bugfix_autopilot_*`, `campaign_coverage.tsv`, `rounds.tsv`, per-round child command/output/result files, final summaries, `artifacts.zip`, and one final Telegram notification. Audit and implementation handoffs use strict schema-v1 allowlists, evidence hashes, semantic fingerprints, and exact child stdout/run-directory reconciliation.

The parent atomically claims a fully formed lock before campaign artifacts. Final machine output includes `child_cleanup_status`, `child_cleanup_exit_code`, `lock_release_status`, `lock_release_exit_code`, and `lock_preserved`. `BUGFIX_AUTOPILOT_BLOCKED_CHILD_IDENTITY` means the recorded child could not be safely verified or terminated, so the lock remains. `BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE` means child cleanup completed but strict ownership/removal failed. Telegram is sent only after those states are final. Verified `--force-unlock` waits after TERM and after any KILL escalation and refuses to remove the lock while the controller remains alive.

The parent heartbeat records liveness through the lock file modification time. The background worker checks for shutdown every second but refreshes only at `AUTOMATION_LOCK_HEARTBEAT_SECONDS`. It never rewrites the full lock env record, so it cannot overwrite newer active-child metadata written by the parent, and finalization does not wait for a long heartbeat sleep to finish.

Safety boundaries remain unchanged: no providers, no direct `betting-win` database access, no wallets/orders/transactions, no service lifecycle, no paper controller calls, no public reports, and no profitability/live-readiness claims.
