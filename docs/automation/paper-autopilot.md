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

`BWS-599` has validated the complete local paper-autopilot flow. `BWS-600` is now the selected externally gated campaign and remains blocked until the operator-approved betting-win read-only API and campaign evidence are available.

Seven-day and 72-hour durations are ceilings. A bounded task may finish quickly, but the parent or implementation controller must continue while another dependency-ready safe task remains.
