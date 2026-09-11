# BWS117 Wave 01 handoff to Wave 02

```text
REPOSITORY=betting-win-surebet
CURRENT_BASELINE=betting-win-surebet117.zip
CURRENT_BASELINE_SHA256=0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494
ORIGINAL_REVIEW_BASELINE=betting-win-surebet116.zip
ORIGINAL_REVIEW_BASELINE_SHA256=6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376
MEMBER_SOURCE_EQUIVALENCE=yes
COMPLETED_AREAS=R01,R02,R03
CONFIRMED_FINDINGS=41
OPEN_P0=1
OPEN_P1=34
OPEN_P2=6
OPEN_P3=0
NEXT_AREAS=R04,R05,R06
IMPLEMENTATION_ALLOWED=no
BETTING_WIN_MUTATION_ALLOWED=no
LIVE_OPERATION_ALLOWED=no
OVERLAY_LANDED_STATUS=NOT_PROVEN_UNTIL_TRANSACTIONAL_APPLY_SUCCEEDS
```

## Accepted contracts

- BWS is the only repository in scope.
- `betting-win` is a read-only upstream dependency and must not be changed or controlled.
- Current BWS-600 and BWS-710 holds remain binding.
- BWS-900 execution remains parked.
- Review completion does not imply implementation or runtime readiness.
- BWS117 member bytes are exact source equivalents of the BWS116 review baseline.

## Source-pinned or provisional contracts

- Node 22 harness evidence is supplementary until Node 20.20.2 reruns.
- PostgreSQL isolation, role, concurrency, and crash behavior remains dynamically unproven.
- External betting-win API and B1 resources remain unavailable and unaccepted.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains an R11-owned cross-wave handoff.

## R04 exclusive scope

Simulation, non-atomic leg completion, partial fills, residual exposure, settlement/void/correction replay, B1 backtest orchestration, false-positive analysis, and report generation.

R04 must answer:

1. Does simulation preserve the exact R01 cycle and R02 candidate/quote identity?
2. Can fill, rejection, timeout, or cancellation ordering create impossible portfolio state?
3. Are residual exposure, hedge cost, settlement, void, refund, correction, and reopen states complete and monotonic?
4. Can a backtest use future or changed data, double-count candidates, or report profitability from incomplete economics?
5. Can report generation hide partial, rejected, unknown, stale, or unreconciled state?

Do not duplicate R02 mathematics or R03 transaction root causes. Relevant inherited IDs include R01-003/004/010, R02-001/003/004/005/006/009/010/012/014, and R03-014/015/016.

## R05 exclusive scope

BWS read-only API, query/read models, filters, sorting, pagination, cursors, response envelopes, web data client, operator cockpit, stale/error/loading/empty state, and presentation truth.

R05 must answer:

1. Can API or UI projection manufacture currentness, completeness, profitability, terminality, or readiness?
2. Are identifiers, fixed-point values, units, timestamps, unknowns, and source receipts preserved losslessly?
3. Are pagination/filter/sort/cursor semantics stable, bounded, deterministic, and restart-safe?
4. Are database and service errors kept distinct from empty results?
5. Does the cockpit ever convert held, stale, partial, missing, or failed state into green status?

Do not duplicate R01 intake, R02 mathematics, or R03 durable-state root causes. Relevant inherited IDs include R01-003/004/005/010, R02-002/004/005/007/013, and R03-003/007/012/013/017.

## R06 exclusive scope

Upstream convergence service, scheduler service, worker service, service runtime, runtime applications, operator lifecycle, start/status/stop wrappers, child-process ownership, health, shutdown, cancellation, restart, and drain.

R06 must answer:

1. Is every long-running process uniquely owned, bounded, observable, cancellable, and restart-safe?
2. Can status or health become green while work, children, leases, or checkpoints are partial or stale?
3. Do shutdown and timeout reach in-flight API, psql, scheduler, and worker operations?
4. Can late completion publish after timeout, stop, lease loss, or replacement?
5. Are PID, lock, listener, timer, log, file, and subprocess resources cleaned exactly once?

Do not duplicate R01 HTTP semantics or R03 durable transition mechanics. Relevant inherited IDs include R01-006/007/008/009 and R03-004/005/007/008/009/010/011/012.

## Shared read-only paths

Wave 02 may inspect R01-R03-owned contracts and repositories to trace effects. It must not reassign their root causes or propose independent edits to shared files without an explicit handoff.

## Prohibited assumptions

- Historical 22-round bugfix completion proves current correctness.
- Passing static validators proves BWS-600 readiness.
- Node 22 equals canonical Node 20 acceptance.
- A declared upstream schema equals an accepted runtime resource.
- A completed convergence checkpoint owns the exact records consumed.
- A positive gross/net label proves a valid complete-set portfolio.
- A clean status path is read-only without source proof.
- Any change to betting-win is authorized.
