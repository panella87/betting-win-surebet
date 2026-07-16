# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` is currently the retained standalone fixture or explicit pinned-bundle evaluator.

```text
current_controller_mode=single_pass_no_service
current_paper_service_lifecycle=none
replacement_task=BWS-588
```

It is not the selected implementation controller and cannot prove continuous runtime readiness. Until `BWS-588`, it may validate repo source, run bounded private fixture or explicit repo-local pinned-bundle checks and create a strict implementation handoff. The explicit pinned-bundle variable remains `SUREBET_PINNED_BUNDLE`. It must not classify fixture success as `BWS-600` evidence.

`BWS-588` must integrate this controller with the validated product-owned full-stack lifecycle. Runtime-evidence mode must use one explicit upstream mode, bounded observation, exact service ownership, persisted runtime evidence, source-defect handoff generation and cleanup of only the stack instance it started.

Direct provider calls, direct betting-win database reads, execution, public signals and profitability claims remain prohibited.
