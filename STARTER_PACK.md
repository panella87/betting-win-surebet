# betting-win-surebet starter pack

```text
repo=betting-win-surebet
repo_role=surebet_strategy_application
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
completed_b1_queue=backlog/bws_b1_cross_venue_implementation.csv
completed_b1_map=backlog/bws_b1_cross_venue_map.csv
bws700_completion_status=DEPENDENCY_READY_LOCAL_IMPLEMENTATION_COMPLETE
b1_dependency_ready_local_rows=VALIDATED_THROUGH_BWS-820
bws710_status=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
bws600_current_task=BWS-600
current_live_execution_gate=closed
BWS-900=parked
```

Read:

1. `AGENTS.md`
2. `docs/automation/current-implementation-task.md`
3. `docs/repo_status_current.md`
4. `docs/000_documentation_index.md`
5. `docs/047_b1_cross_venue_offline_falsification_program.md`
6. `docs/048_b1_upstream_contract.md`
7. `docs/049_b1_market_equivalence.md`
8. `docs/050_b1_falsification_acceptance.md`
9. `docs/051_b1_implementation_map.md`
10. `backlog/bws_b1_cross_venue_implementation.csv`
11. `backlog/bws_b1_cross_venue_map.csv`
12. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
13. `backlog/bws_full_implementation.csv`
14. `backlog/bws_remaining_safe_local_map.csv`

`BWS-599` is validated. The protected integration phase is complete, so the current campaign does not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.

Validated carry-forward tranche:

```text
BWS-592  soak and failure injection (validated)
BWS-593  external-runtime preflight and campaign manifest (validated)
BWS-599  final local acceptance (validated)
```

The full-platform safe-local queue remains complete through `BWS-599`; `BWS-600` remains externally blocked on real betting-win API runtime evidence. BWS-700 dependency-ready local implementation is validated through BWS-820, and the broad bugfix campaign is complete across 8/8 areas. The selected route is now `run-paper-autopilot.sh` for BWS-600 runtime evidence.
