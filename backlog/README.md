# BWS implementation backlog

## Current routing

The active remediation campaign does not use a CSV backlog as its routing authority. It uses the immutable active plan and 47 task files under:

```text
docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/
```

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
csv_backlogs_are_current_routing_authority=no
```

## Retained completed ledgers

- `bws_full_implementation.csv` is completed full-platform traceability.
- `bws_remaining_safe_local_map.csv` is the completed BWS-591 through BWS-599 supporting map.
- `bws_b1_cross_venue_implementation.csv` is the completed dependency-ready local B1 implementation queue.
- `bws_b1_cross_venue_map.csv` maps completed B1 rows to source and validation.

`BWS-100` through `BWS-599` are validated. `backlog/bws_b1_cross_venue_implementation.csv` is the completed operator-approved B1 implementation queue for dependency-ready local rows. These ledgers remain regression and audit evidence but do not select remediation work.

## External gates

```text
BWS-600=BLOCKED_ACCEPTED_BETTING_WIN_DOWNSTREAM_API_HANDOFF_AND_RUNTIME_EVIDENCE
BWS-710=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED
BWS-900=PARKED_EXECUTION
```

No fixture, local API, export, declaration, or caller assertion satisfies those gates.

## Historical validator snapshot

```text
backlog_status=COMPLETED_TRACEABILITY
current_task=BWS-600
active_implementation_queue=none
selected_controller=run-paper-autopilot.sh
```

This block records the pre-remediation route only.
