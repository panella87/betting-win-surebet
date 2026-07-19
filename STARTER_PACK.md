# betting-win-surebet starter pack

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
repo_role=surebet_strategy_application
upstream_platform=betting-win
current_task=BWS-600
safe_local_terminal_gate=BWS-599
current_live_execution_gate=closed
```

Read:

1. `AGENTS.md`
2. `docs/000_documentation_index.md`
3. `docs/repo_status_current.md`
4. `docs/automation/current-implementation-task.md`
5. `docs/automation/api-only-upstream.md`
6. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
7. `backlog/bws_full_implementation.csv`
8. `backlog/bws_remaining_safe_local_map.csv`

`BWS-599` is validated. The protected integration phase is complete, so the current campaign does not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.

Validated carry-forward tranche:

```text
BWS-592  soak and failure injection (validated)
BWS-593  external-runtime preflight and campaign manifest (validated)
BWS-599  final local acceptance (validated)
```

No safe local implementation row remains. Route to paper autopilot for the active `BWS-600` runtime campaign.
