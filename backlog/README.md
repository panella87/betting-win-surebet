# BWS implementation backlog

```text
backlog_status=COMPLETED_TRACEABILITY
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
```

`bws_full_implementation.csv` is the retained completed dependency ledger for `BWS_FULL_PLATFORM_IMPLEMENTATION_V1`.

`bws_remaining_safe_local_map.csv` is the retained supporting map for the completed `BWS-591` through `BWS-599` work. It preserves dependency and acceptance traceability but is not an active implementation route.

Historical and future queue status values are:

```text
PENDING
IN_PROGRESS
VALIDATED
BLOCKED
PARKED
```

A controller selects the first dependency-ready `PENDING` row only when `docs/automation/current-implementation-task.md` explicitly opens and names that ledger as the active implementation queue. It updates a row only after implementation, focused success/failure proof, restart/idempotency/cleanup or recovery proof where applicable, canonical validation, and regenerated source evidence pass. The current task names no implementation queue, so these CSVs must not route another implementation campaign.

`BWS-100` through `BWS-599` are validated. The full-platform safe-local queue is carry-forward history; `BWS-600` is externally blocked and `BWS-900` is separately parked.

Historical SURE ledgers are retained evidence, not routing authority.

## External ecosystem gates

The completed local ledgers do not authorize a new implementation cycle. Current unresolved work is cross-repository:

```text
BWS-600=BLOCKED_ACCEPTED_BETTING_WIN_DOWNSTREAM_API_HANDOFF_AND_RUNTIME_EVIDENCE
BWS-710=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
BWS-900=PARKED_EXECUTION
```

The inspected `betting-win` source contains the B1 schema target but does not expose an accepted BWS runtime resource. It also exposes a `/dashboard/*` operator API rather than the `/contract` and `/query/*` contract currently required by BWS. These are external integration gates, not dependency-ready rows in a BWS implementation CSV.

## BWS-700 B1 implementation queue

`backlog/bws_b1_cross_venue_implementation.csv` is the completed operator-approved B1 implementation queue for dependency-ready local rows. `backlog/bws_b1_cross_venue_map.csv` maps tasks to docs, source areas, validation targets, and hard blockers.

`BWS-700`, `BWS-705`, and dependency-ready local rows `BWS-720` through `BWS-820` are validated. `BWS-710` real upstream intake remains blocked until `betting-win` exposes and authorizes an accepted read-only runtime resource for `betting-win.b1_multi_venue_markets.v1`; the schema declaration alone is insufficient. `BWS-830` and `BWS-840` remain parked. No B1 row is currently active, and fixtures remain prohibited as runtime evidence.
