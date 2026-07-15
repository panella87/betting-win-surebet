# Paper autopilot controller

`run-paper-autopilot.sh` is the parent workflow for runtime evidence and source-fix handoffs:

```text
paper evaluation -> runtime evidence -> implementation handoff -> paper re-evaluation
```

It is not the active router while `BWS-520` through `BWS-580` remain pending. The current paper child is intentionally `single_pass_no_service` and can validate only a local fixture or explicit repo-local pinned bundle. It cannot create the executable API/worker lifecycle, continuous upstream convergence or scheduler required by the remaining source queue.

After `BWS-580` is validated, the router must verify that the paper controller is integrated with the new machine-readable runtime handoff before selecting it for the external `BWS-600` evidence campaign. Until then, `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE` is a truthful bounded result but not proof that all source work is complete.

The parent keeps one final Telegram notification and suppresses child notifications. It preserves strict lock, child identity, atomic terminal result, handoff, source-fingerprint, artifact and finalization behavior.

The seven-day parent and 72-hour child durations are maximum budgets, not mandatory idle time. A bounded source handoff may complete quickly. The parent stops only on a terminal result, explicit gate, validated blocker, repeat guard or exhausted budget.
