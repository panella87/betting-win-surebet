# BWS118 Wave 02 cumulative dependency graph and review-only fix tranches

## Wave 01 tranches preserved

The complete Wave 01 tranche definitions remain authoritative at [`../../BWS117/wave-01/dependency-and-tranches.md`](../../BWS117/wave-01/dependency-and-tranches.md). Their IDs `BWS-W1-T01` through `BWS-W1-T13` are not renumbered.

## Cumulative dependency graph

```text
BWS-W1-T02 -> T03 -> T05
                    -> T06 -> T07 -> T08
BWS-W1-T01 -> T09 -> T10 -> T11/T12/T13

T03 + T10 -> BWS-W2-T14 event identity and state
T07 + T14 -> T15 actual-fill economics
T03 + T10 + T14/T15 -> T16 lifecycle, correction and chronology
T14 + T15 + T16 -> T17 truthful reports

T03 -> T18 public error/query receipts
T13 + T18 -> T19 snapshot pagination/currentness
T17 + T18 + T19 -> T20 exact cockpit contract and request ownership

T09 + T10 -> T21 process ownership and executable generation
T21 -> T22 readiness and supervision
T05 + T11 + T21 -> T23 shutdown/cancellation/resource ownership
T21 + T23 -> T24 terminal failure/evidence uniqueness
T21 -> T25 bounded health/diagnostics

All implementation remains serialized. Wave 03 research may proceed in parallel.
```

## BWS-W2-T14

- Issue IDs: `BWS118-R04-001, BWS118-R04-003, BWS118-R04-004`
- Primary owner: `R04`
- Secondary areas: `R01, R03, R06, R11`
- Likely files/components:
- simulation/non-atomic-completion.ts
- simulation/b1-leg-completion.ts
- completion-event contracts
- Prerequisites:
- BWS-W1-T03
- BWS-W1-T10
- Immutable event/attempt and ordered kill authority
- Acceptance conditions:
- Exact duplicate events are no-ops
- Conflicting duplicate IDs fail closed
- Partial quantity and terminal disposition remain independent
- Kill effects are causally ordered
- Focused tests:
- Duplicate/conflict/restart permutations
- partial+terminal state
- kill-before/after-fill matrix
- Broader validation:
- Node 20 simulation suite
- R03 durable replay proof
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- Stake solver mathematics
- No-live-operation hold

## BWS-W2-T15

- Issue IDs: `BWS118-R04-002, BWS118-R04-005`
- Primary owner: `R04`
- Secondary areas: `R01, R02, R03, R07, R11`
- Likely files/components:
- actual-fill contracts
- residual exposure
- B1 settlement replay
- Prerequisites:
- BWS-W1-T07
- BWS-W2-T14
- Accepted actual-fill receipt and cost-ledger contract
- Acceptance conditions:
- Actual price/odds/fees/slippage/receipt preserved
- Residual and settlement use actual accepted terms
- All accepted costs included exactly once
- Focused tests:
- Adverse/favorable slippage
- fee/penalty/capital-lock reconciliation
- missing actual terms block settled claims
- Broader validation:
- BWS-W1-T12 crash replay
- R07 evidence packet tests
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- Candidate derivation until R02 tranche closes

## BWS-W2-T16

- Issue IDs: `BWS118-R04-006, BWS118-R04-007, BWS118-R04-008`
- Primary owner: `R04`
- Secondary areas: `R01, R03, R07, R11`
- Likely files/components:
- settlement replay
- B1 settlement replay
- backtest chronology
- Prerequisites:
- BWS-W1-T03
- BWS-W1-T10
- Provider lifecycle/revision authority
- Acceptance conditions:
- Void/refund/push/reopen represented explicitly
- Corrections carry immutable revision/supersession authority
- quote<=decision<=fill<settlement enforced
- Focused tests:
- Lifecycle transition matrix
- correction/reopen/finality sequences
- impossible chronology rejection
- Broader validation:
- Provider-contract acceptance
- Node 20 backtest suite
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No provider access during implementation tests

## BWS-W2-T17

- Issue IDs: `BWS118-R04-009, BWS118-R04-010, BWS118-R04-011, BWS118-R04-012, BWS118-R04-013, BWS118-R04-014`
- Primary owner: `R04`
- Secondary areas: `R02, R03, R05, R07, R11`
- Likely files/components:
- B1 reports
- false-positive report
- strategy report
- capability/status markers
- Prerequisites:
- BWS-W2-T14
- BWS-W2-T15
- BWS-W2-T16
- Acceptance conditions:
- Reports preserve leg/residual/terminal state
- Denominators are explicit and end-to-end
- marketsCompared counts unique canonical markets
- malformed runtime input returns typed blocker
- capability markers reflect binding state machine
- Focused tests:
- Incomplete/rejected/timeout reporting
- candidate vs market cardinality
- malformed input
- marker-to-production behavior
- Broader validation:
- R05 projection tests
- R07 evidence truth
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- Historical report artifacts remain historical

## BWS-W2-T18

- Issue IDs: `BWS118-R05-001, BWS118-R05-006, BWS118-R05-009`
- Primary owner: `R05`
- Secondary areas: `R01, R03, R06, R11`
- Likely files/components:
- read-only HTTP adapter
- response envelope
- boundary version contracts
- Prerequisites:
- BWS-W1-T03
- Typed public error and normalized-query receipt contract
- Acceptance conditions:
- Validation/policy/not-found/conflict/unavailable/timeout/internal errors distinct
- Internal details sanitized
- Every page binds exact normalized query/sort/version/scope
- Focused tests:
- HTTP status taxonomy
- secret/SQL/path redaction
- empty wrong-scope rejection
- boundary version mismatch
- Broader validation:
- Node 20 API contract suite
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- GET-only route set
- Repository transaction mechanics

## BWS-W2-T19

- Issue IDs: `BWS118-R05-002, BWS118-R05-003, BWS118-R05-004, BWS118-R05-005, BWS118-R05-007, BWS118-R05-008`
- Primary owner: `R05`
- Secondary areas: `R01, R03, R06, R07, R11`
- Likely files/components:
- query service
- cursor contract
- runtime-cycle repository projection
- cockpit snapshot loader
- Prerequisites:
- BWS-W1-T03
- BWS-W1-T13
- BWS-W2-T18
- Stable snapshot/high-watermark authority
- Acceptance conditions:
- Authenticated/versioned cursors own one snapshot
- Runtime-cycle query is exhaustive or explicitly truncated/pageable
- Work remains bounded
- Cockpit follows continuations or labels partial data
- Shared as-of/currentness receipt enforced
- Focused tests:
- Mutation across pages
- forged/expired cursor
- old-cycle retrieval
- large page work bound
- seven-page coherence
- stale/future responses
- Broader validation:
- PostgreSQL query-plan/snapshot tests
- browser integration
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No upstream pagination root duplication

## BWS-W2-T20

- Issue IDs: `BWS118-R05-010, BWS118-R05-011, BWS118-R05-012, BWS118-R05-013`
- Primary owner: `R05`
- Secondary areas: `R02, R03, R04, R06, R11`
- Likely files/components:
- web API validators
- B1 browser contracts
- cockpit shell/state
- Prerequisites:
- BWS-W2-T17
- BWS-W2-T18
- BWS-W2-T19
- Acceptance conditions:
- Wire validator is exact with producer contract
- Valid null/unknown states preserved
- Malformed child economics/status/time rejected
- Loads are generation-bound and cancellable
- Empty/search-empty/failure/partial states distinct
- Focused tests:
- Producer-consumer round trip
- mutation matrix
- late response race
- empty-state copy/state tests
- Broader validation:
- Web typecheck/build under Node 20
- browser integration
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No literal green palette requirement

## BWS-W2-T21

- Issue IDs: `BWS118-R06-001, BWS118-R06-003, BWS118-R06-004, BWS118-R06-005`
- Primary owner: `R06`
- Secondary areas: `R03, R10, R11`
- Likely files/components:
- operator lifecycle
- standalone service state
- source/executable fingerprints
- Prerequisites:
- BWS-W1-T09
- BWS-W1-T10
- Repository-scoped process-generation authority
- Acceptance conditions:
- One atomic owner before side effects
- Every child owned immediately after spawn
- Runtime bound to immutable executable generation
- Ambiguous cleanup blocks replacement and preserves ownership
- Focused tests:
- Concurrent starts
- crash after claim/spawn
- source mutation after start
- failed stale cleanup
- Broader validation:
- Multi-process Node 20 lifecycle suite
- systemd sandbox
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No active service control during review

## BWS-W2-T22

- Issue IDs: `BWS118-R06-002, BWS118-R06-007, BWS118-R06-008, BWS118-R06-009`
- Primary owner: `R06`
- Secondary areas: `R03, R05, R07, R09, R11`
- Likely files/components:
- start outcome
- health/readiness/metrics
- root wrappers
- CLI/systemd unit
- Prerequisites:
- BWS-W2-T21
- Typed complete-stack readiness authority
- Acceptance conditions:
- created/initializing/started-not-ready/ready/degraded/failed distinct
- Health consumes live lifecycle owner and role state
- Root wrappers consume production envelopes
- CLI/systemd exit status reflects runtime state
- Focused tests:
- API healthy but roles blocked
- child death after start
- stale state files
- oneshot child failure
- Broader validation:
- R05 presentation
- R09 deployment review
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- External BWS-600 hold remains blocked

## BWS-W2-T23

- Issue IDs: `BWS118-R06-006, BWS118-R06-010, BWS118-R06-011, BWS118-R06-012, BWS118-R06-013, BWS118-R06-014`
- Primary owner: `R06`
- Secondary areas: `R01, R03, R05, R10, R11`
- Likely files/components:
- aggregate lifecycle budget
- shutdown/drain
- process signal/wait
- API listener/request ownership
- timeout helper
- Prerequisites:
- BWS-W1-T05
- BWS-W1-T11
- BWS-W2-T21
- Acceptance conditions:
- One aggregate deadline
- scheduler quiesced before worker drain
- all owned roles signaled/accounted despite failures
- PID identity rechecked/fenced at signal and wait
- requests/listener abort and close bounded
- losing timers cleared
- Focused tests:
- Hung child and remaining-role shutdown
- PID ABA
- request rejection
- listener close hang
- timer-handle leak
- Broader validation:
- Node 20 lifecycle suite
- systemd sandbox
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No broad process termination

## BWS-W2-T24

- Issue IDs: `BWS118-R06-015, BWS118-R06-016`
- Primary owner: `R06`
- Secondary areas: `R03, R07, R12, R11`
- Likely files/components:
- service exception finalization
- lifecycle evidence filenames and publication
- Prerequisites:
- BWS-W2-T21
- BWS-W2-T23
- Immutable evidence ID authority
- Acceptance conditions:
- Unexpected exception writes terminal failed/unknown state and evidence
- Evidence IDs are collision-free and create-or-compare
- Focused tests:
- Injected pass rejection
- same-millisecond concurrent evidence
- conflicting evidence ID payload
- Broader validation:
- R07 evidence publication
- R12 controller artifact tests
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- No runtime evidence marked accepted by docs

## BWS-W2-T25

- Issue IDs: `BWS118-R06-017`
- Primary owner: `R06`
- Secondary areas: `R07, R09, R10, R11`
- Likely files/components:
- health source fingerprints
- failure diagnostics and log tails
- Prerequisites:
- Immutable startup fingerprint and bounded index/tail contract
- Acceptance conditions:
- Health reads precomputed immutable digest
- Failure diagnostics use bounded tail/index operations
- Focused tests:
- Large-tree and large-log boundedness
- symlink/special file rejection
- Broader validation:
- R09 soak/resource tests
- Current-source re-verification required: `true`
- Explicitly unchanged areas:
- Diagnostic content remains sanitized

