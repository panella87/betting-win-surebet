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
2. `docs/002_dependency_contract_with_betting_win.md`
3. `docs/automation/current-implementation-task.md`
4. `docs/repo_status_current.md`
5. `docs/000_documentation_index.md`
6. `docs/047_b1_cross_venue_offline_falsification_program.md`
7. `docs/048_b1_upstream_contract.md`
8. `docs/049_b1_market_equivalence.md`
9. `docs/050_b1_falsification_acceptance.md`
10. `docs/051_b1_implementation_map.md`
11. `backlog/bws_b1_cross_venue_implementation.csv`
12. `backlog/bws_b1_cross_venue_map.csv`
13. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
14. `backlog/bws_full_implementation.csv`
15. `backlog/bws_remaining_safe_local_map.csv`

`BWS-599` is validated. The protected integration phase is complete, so the current campaign does not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.

Validated carry-forward tranche:

```text
BWS-592  soak and failure injection (validated)
BWS-593  external-runtime preflight and campaign manifest (validated)
BWS-599  final local acceptance (validated)
```

The full-platform safe-local queue remains complete through `BWS-599`; `BWS-600` remains externally blocked on an accepted cross-repository API contract, authorized real-provider parity, and retained runtime evidence. BWS-700 dependency-ready local implementation is validated through BWS-820, and the broad bugfix campaign is complete across 8/8 areas. The selected route is now `run-paper-autopilot.sh` for BWS-600 runtime evidence.

## Cross-repository reviews

For a task that changes the betting-win integration contract, provide both current repository ZIPs plus the relevant upstream architecture/status evidence. The surebet ZIP remains authority for BWS files; the betting-win ZIP is authority for upstream source capabilities. An uploaded archive never replaces the committed-HEAD runtime lock.

Current ecosystem reconciliation baseline:

```text
betting_win_source_archive=betting-win218(3).zip
betting_win_source_archive_sha256=7b2c3a48bbc4cba95bcace384bb20892916a5958e6477d49651c983b16d11dc2
canonical_integration_contract=docs/002_dependency_contract_with_betting_win.md
```

## Evidence to return for continuation

After a server controller stops, run `pull_artifacts_and_zip_codebase.sh` from the local repository root. Provide both newly numbered outputs to the next review: `artifactsN.zip` for retained server evidence and `betting-win-surebetN.zip` for the current repository source. Command output is supplemental, not a substitute for either ZIP. Never include `.env`, credentials, databases, `node_modules`, or unretained server logs.
