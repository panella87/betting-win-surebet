# Paper autopilot controller

`run-paper-autopilot.sh` remains the hardened parent workflow for paper evidence and source-fix handoffs:

```text
paper evaluation -> source defect -> implementation -> runtime re-evaluation
```

```text
current_paper_service_lifecycle=none
integration_task=BWS-589
selected_now=no
```

The current child evaluator is no-service and therefore cannot own the final continuous campaign. Its current bounded missing-input classification remains `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE`; that result is not continuous-runtime readiness. `BWS-589` must bind the parent to the product-owned full-stack lifecycle while preserving:

- exact parent and child lock ownership;
- atomic child terminal-result files;
- parent-only Telegram notification;
- validated source/runtime handoffs and semantic repeat guards;
- selected upstream mode and retained campaign directory across source fixes;
- post-lock artifact refresh;
- no parsing machine state from streamed logs.

After `BWS-589`, `BWS-599` must prove the complete local paper-autopilot flow. `BWS-600` remains externally blocked until an operator-approved runtime campaign manifest and read-only input exist.

Seven-day and 72-hour durations are ceilings. A bounded task may finish quickly, but the parent or implementation controller must continue while another dependency-ready safe task remains.
