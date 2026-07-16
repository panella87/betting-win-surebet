# Paper autopilot controller

`run-paper-autopilot.sh` remains the hardened parent workflow for paper evidence and source-fix handoffs:

```text
paper evaluation -> source defect -> implementation -> runtime re-evaluation
```

```text
current_paper_service_lifecycle=full_stack_owned
integration_task=BWS-589
selected_now=yes_for_runtime_evidence_source_fix_loops
```

`BWS-589` validates the parent against the product-owned full-stack runtime-evidence lifecycle while preserving:

- exact parent and child lock ownership;
- atomic child terminal-result files;
- parent-only Telegram notification;
- validated source/runtime handoffs and semantic repeat guards;
- selected upstream mode and retained campaign directory across source fixes;
- post-lock artifact refresh;
- no parsing machine state from streamed logs.

`BWS-599` must still prove the complete local paper-autopilot flow. `BWS-600` remains externally blocked until an operator-approved runtime campaign manifest and read-only input exist.

Seven-day and 72-hour durations are ceilings. A bounded task may finish quickly, but the parent or implementation controller must continue while another dependency-ready safe task remains.
