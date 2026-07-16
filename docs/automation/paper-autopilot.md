# Paper autopilot controller

`run-paper-autopilot.sh` is the parent workflow for runtime evidence and source-fix handoffs:

```text
paper evaluation -> runtime evidence -> implementation handoff -> paper re-evaluation
```

`BWS-580` is validated, but paper autopilot is still not the active router. The current paper child is intentionally `single_pass_no_service` and can validate only a local fixture or explicit repo-local pinned bundle. It cannot prove the protected-controller integration review or supply the accepted external runtime inputs still required by `BWS-600`.

After `BWS-580` validation, the router must verify that the paper controller is integrated with the new machine-readable runtime handoff before selecting it for the external `BWS-600` evidence campaign. Until then, `PAPER_AUTOPILOT_BLOCKED_ON_PINNED_BUNDLE` is a truthful bounded result but not proof that the external gate is satisfied.

The parent keeps one final Telegram notification and suppresses child notifications. It preserves strict lock, child identity, atomic terminal result, handoff, source-fingerprint, artifact and finalization behavior.

The seven-day parent and 72-hour child durations are maximum budgets, not mandatory idle time. A bounded source handoff may complete quickly. The parent stops only on a terminal result, explicit gate, validated blocker, repeat guard or exhausted budget.
