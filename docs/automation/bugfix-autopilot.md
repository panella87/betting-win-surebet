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

The controller writes `artifacts/bugfix_autopilot_*`, `campaign_coverage.tsv`, `rounds.tsv`, per-round child command/output/result files, final summaries, `artifacts.zip`, and one final Telegram notification. Audit and implementation handoffs use strict schema-v1 allowlists, evidence hashes, semantic fingerprints, and exact child stdout/run-directory reconciliation. If active-child process identity cannot be verified during abnormal finalization, the controller preserves the lock for explicit operator inspection instead of silently orphaning or unlocking the child.

Safety boundaries remain unchanged: no providers, no direct `betting-win` database access, no wallets/orders/transactions, no service lifecycle, no paper controller calls, no public reports, and no profitability/live-readiness claims.
