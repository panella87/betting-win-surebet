# 012 - Operator runbook

## Completed BWS-700 implementation and active BWS-600 runtime runbook

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
safe_local_terminal_gate=BWS-599
selected_controller=run-paper-autopilot.sh
broad_bugfix_campaign_status=COMPLETED_AND_ACCEPTED
broad_bugfix_areas_closed=8_of_8
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
bws600_launch_status=BLOCKED_CROSS_REPO_API_HANDOFF_NOT_ACCEPTED
```

The broad bugfix campaign is complete; do not rerun it without new evidence defining a bounded audit scope. The next phase remains BWS-600, but the current inspected betting-win source does not yet expose the accepted wire contract required by the BWS client and `/contract` preflight.

1. Use Node 20.
2. Keep `~/app_testing/betting-win-surebet` as the BWS working repository.
3. Treat `~/app_testing/betting-win` as an independently operated upstream repository. `BETTING_WIN_REPO_PATH` may inspect committed `HEAD`; BWS must not clone, mutate, start, stop, or deploy it.
4. Verify the exact cross-repository API contract before any long run. The current betting-win operator server uses `/dashboard/*`; BWS currently expects `/contract`, `/query/identity-entities`, `/query/rule-profiles`, `/query/normalized-records`, and a pinned contract/provenance envelope. Endpoint similarity is not acceptance.
5. Keep the private BWS `.env` configured with `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`; remove `DB_URL` and `DB_URL_TEST`. The wrapper owns approved BWS defaults and the standard repo-local schedule path. Explicit shell values win; `.env` fills only missing approved non-policy keys. It never substitutes a fixture schedule.
6. Start `run-paper-autopilot.sh` only after betting-win has accepted the downstream API handoff, real provider-to-PostgreSQL-to-API parity is retained, the exact committed-HEAD lock passes, and BWS preflight succeeds. Use `run-autonomous-implementation.sh` only for a reviewed BWS source handoff or unblocked BWS-710 intake.
7. Treat `betting-win.b1_multi_venue_markets.v1` as a declared schema target but not an accepted runtime resource. BWS-710 remains blocked until the runtime resource and API handoff are accepted.
8. Do not integrate `@betting-win/execution-sdk` in the current route. That package is upstream-owned, still fail-closed for real writes, and belongs to separately authorized BWS-900 work with an independent package lock.
9. Inspect retained machine-readable artifacts and ledgers, not elapsed time alone.

## Runtime safety

Bounded BWS tests may launch uniquely identified loopback-only child processes and must clean them up. Do not stop, replace, detach, or kill pre-existing BWS or betting-win services.

## After local completion

`BWS-599` is validated. `BWS-593` and `BWS-600` require an accepted external betting-win data-plane handoff, not merely an available HTTP server. The local BWS API on `127.0.0.1:4312`, dataset files, exports, fixtures, mocks, and synthetic schedules cannot satisfy the gate.

`BWS-600` remains private paper. `BWS-900` remains separately parked execution.
