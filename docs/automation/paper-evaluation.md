# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` is the retained standalone fixture, explicit pinned-bundle, or bounded runtime-evidence evaluator. It replaces the obsolete `run-paper-evaluation-12h.sh`; no 12-hour helper should exist.

```text
current_controller_mode=single_pass_fixture_or_runtime_evidence
default_duration=72h
artifacts_zip=artifacts.zip
adaptive_flag=--adaptive
operator_interval_range=5m..60m
script_explicit_interval_clamp=not_enforced_by_current_protected_script
current_paper_service_lifecycle=runtime_evidence_mode_available
validated_task=BWS-588
parent_integration_task=BWS-589_VALIDATED
```

It is not the selected implementation controller and cannot prove continuous `BWS-600` readiness on its own. It may validate repo source, run bounded private fixture or explicit repo-local pinned-bundle checks, or collect bounded runtime evidence with exact stack ownership checks. The current protected script accepts explicit `--interval` values as provided; standardized operation must use `--adaptive` with explicit intervals inside `5m..60m` until a reviewed protected-controller repair adds automatic enforcement. The explicit pinned-bundle variable remains `SUREBET_PINNED_BUNDLE`.

`BWS-589` integrated this child mode into paper autopilot with selected upstream mode, campaign identity, source-defect handoffs, atomic child results and parent-owned final notification. The selected `BWS-600` route is the parent `run-paper-autopilot.sh`, not a standalone paper child.

Fixture success and local-only runtime evidence cannot validate `BWS-600`. Direct provider calls, direct betting-win database reads, execution, public signals and profitability claims remain prohibited.
