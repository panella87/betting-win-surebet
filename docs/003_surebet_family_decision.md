# 003 - Surebet family decision

BWS owns surebet and complete-set strategy families. Predictive/value-betting strategy families belong to `betting-win-betting`.

Initial production-shaped lane:

```text
lane_id=standard_binary_complete_set_v1
family=same_venue_complete_set
upstream_profile=surebet_standard_binary_v0
execution=prohibited
```

The architecture must preserve extensibility for additional provider-neutral complete-set families without relaxing identity, rule, terminal-scenario, capacity, settlement, or provenance requirements.

Cross-venue equivalence, back/lay, synthetic payoff equivalence, smart routing, market making, and real-money use are not authorized by the initial local program. They require explicit tasks and evidence rather than hidden genericization.
