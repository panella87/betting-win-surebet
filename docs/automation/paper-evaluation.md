# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` is the retained standalone fixture or explicit pinned-bundle evaluator with an added local-only runtime-evidence mode.

```text
current_controller_mode=single_pass_fixture_or_runtime_evidence
current_paper_service_lifecycle=runtime_evidence_mode_available
validated_task=BWS-588
```

It is not the selected implementation controller and cannot prove continuous runtime readiness on its own. After `BWS-588`, it may validate repo source, run bounded private fixture or explicit repo-local pinned-bundle checks, or collect bounded local-only runtime evidence with exact stack ownership checks. The explicit pinned-bundle variable remains `SUREBET_PINNED_BUNDLE`. It must not classify fixture success or local-only runtime evidence as `BWS-600` evidence.

`BWS-589` must integrate the paper autopilot with this validated runtime-evidence child mode. Parent workflow state must keep exact upstream-mode selection, bounded observation results, source-defect handoffs and parent-owned final notification without reintroducing no-service assumptions.

Direct provider calls, direct betting-win database reads, execution, public signals and profitability claims remain prohibited.
