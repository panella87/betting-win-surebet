# BWS118-R04 Review Report

## Executive verdict

`betting-win-surebet118.zip` was independently verified at SHA-256 `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7` with 657 regular files. The archive has no duplicate paths, unsafe paths, symlinks, or special entries. Compared byte-for-byte with the Wave 01 rebased authority `betting-win-surebet117(1).zip` (`0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494`), BWS118 adds 39 documentation files and changes one documentation index; it has zero removed paths and zero non-documentation differences. The executable source therefore remains compatible with the Wave 01 reviewed lineage.

R04 confirms **14 new root causes: 12 P1 and 2 P2**. All 14 block release; 12 block deployment. No P0 was identified in R04. All 41 inherited R01-R03 confirmed finding identities were read from the cumulative Wave 01 ledger and preserved without re-numbering or duplication.

The most material result is that the platform can complete an internally green simulation/backtest/report pipeline while losing event idempotency, actual execution economics, terminal lifecycle facts, cross-stage chronology, and unique-market counting. These are local BWS defects. They do not change the existing external holds: BWS-600 remains `BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`, BWS-710 remains blocked pending an accepted B1 resource, and BWS-900 remains parked.

Canonical Node 20.20.2 was unavailable. Node 22.16.0 build, focused tests, and bounded inert harnesses are labelled supplementary. Confirmed findings rely on current static source evidence; the harnesses demonstrate concrete reachable behavior but are not canonical release acceptance.

## Frozen authority and compatibility

| Item | Verified value |
|---|---|
| Current archive | `betting-win-surebet118.zip` |
| Current archive SHA-256 | `50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7` |
| Regular files | `657` |
| Package | `betting-win-surebet@0.1.0-bws-full-platform` |
| Canonical runtime | `Node 20.20.2` |
| Actual supplementary runtime | `Node 22.16.0` |
| Prior rebase | `betting-win-surebet117(1).zip`, `0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494` |
| Original Wave 01 review baseline | `betting-win-surebet116(1).zip`, `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376` |
| BWS117 -> BWS118 | 39 added docs, 1 changed doc, 0 removed, 0 executable differences |
| Inherited confirmed IDs | 41, preserved from `BWS116-R01-001` through `BWS116-R03-017` |
| Repository mutation | None; final rehash recorded in validation |

## Scope and architecture map

R04 owned the behavioral path after candidate construction and before public projection:

```text
R01 accepted source cycle / receipts
  -> R02 candidate, quote, solver and scenario authority
  -> R04 completion events and leg state
  -> R04 residual exposure
  -> R04 settlement / correction / finality replay
  -> R04 standard and B1 backtest orchestration
  -> R04 false-positive and backtest reports
  -> R04 private-paper and strategy-report projection
  -> R03 persistence semantics / R05 API and cockpit / R07 evidence publication
```

Primary owned source included every file under `packages/bootstrap/src/simulation/`, `backtest/`, and `reporting/`, plus the material private-paper runtime, strategy-ledger, B1 runtime-evidence consumers, focused tests, and current Wave 01 authority. R01 provenance, R02 pure mathematics, R03 transaction mechanics, R05 presentation, R06 process lifecycle, R07 publication, and R11 aggregate assurance were traced only to establish dependencies and handoffs.

## Answers to the required R04 questions

### 1. Does simulation preserve the exact R01 cycle and R02 candidate/quote identity?

**No.** Candidate and leg identifiers are carried in several paths, but completion events do not bind an immutable event/attempt ID, source receipt, provider generation, exact quote, or actual fill terms. The standard accepted result and strategy report then discard per-leg/event evidence. R01 findings 003/004/010 and R02 findings 002/004/005/007 remain dependencies rather than new R04 IDs.

### 2. Can fill, rejection, timeout, or cancellation ordering create impossible portfolio state?

**Yes.** Exact duplicates are rejected as ambiguous rather than treated idempotently, timestamp-shifted duplicates apply twice, standard partial+terminal state is serialized as merely partial, and a boolean kill can retroactively relabel a fully filled group. Existing guards correctly reject same-time ties, overfill, fill-after-terminal, and duplicate terminal markers, but they do not establish immutable replay convergence.

### 3. Are residual exposure, hedge cost, settlement, void, refund, correction, and reopen states complete and monotonic?

**No.** Residual and settlement economics reuse planned price/payout terms; B1 settlement drops fees, quote-age penalty, and capital-lock cost; actual void/refund/push/reopen states are absent; and correction/finality progression is inferred from timestamp/outcome changes without revision or supersession authority. The archive does not supply accepted provider-native lifecycle evidence, so the complete external state set remains blocked rather than guessed.

### 4. Can a backtest use future or changed data, double-count candidates, or report profitability from incomplete economics?

**Yes for B1.** The B1 plan has no decision time and no cross-stage quote/fill/settlement chronology. The bounded harness accepted settlement before quote comparison and fills after settlement. `marketsCompared` counts venue-pair candidates instead of unique markets, and settled net omits accepted costs. The standard path does contain explicit temporal guards, so standard lookahead leakage through this specific route was rejected as a suspicion.

### 5. Can report generation hide partial, rejected, unknown, stale, or unreconciled state?

**Yes.** An in-limit incomplete B1 fill with rejection/timeout is mapped to status/stage `accepted`, counted as fillable, and stripped of leg/residual state. Standard/private strategy reports reduce lifecycle evidence further while labelling the result `accepted_local_evidence`. The false-positive report excludes failures before settlement and uses accepted settlements only as its rate denominator.

## State and metric truth table

| Stage | Intended truth | Current R04 projection | Verdict |
|---|---|---|---|
| Completion event | Immutable provider/attempt event | Timestamp-ordered mutation without event ID | Defective |
| Partial then terminal | Partial quantity plus rejected/expired remainder | Standard snapshot emits only `leg_partial` | Defective |
| Kill | Ordered authority with defined effect | Unordered boolean overriding group state | Defective |
| Residual exposure | Actual fill terms and costs | Planned matrix scaled by filled stake | Defective |
| Settlement | Monetary result after all accepted costs | B1 payout minus stake only | Defective |
| Correction/finality | Explicit monotonic revision chain | Inferred from later time and outcome equality/change | Defective |
| B1 chronology | quote <= decision <= fills < settlement | No shared decision/cross-stage check | Defective |
| Fillable count | Fully filled candidates | All pipeline-accepted candidates | Defective |
| Markets compared | Unique market identities | Candidate/venue-pair count | Defective |
| False-positive rate | Explicit end-to-end denominator | Accepted settlement denominator only | Defective |
| Standard chronology | Explicit decision/window checks | Fail-closed guards present | Safeguard |
| Runtime/live status | Accepted external evidence | Local fixtures remain blocked/non-executable | Safeguard |

## Confirmed findings

### BWS118-R04-001 | P1 | Completion replay has no immutable event or attempt identity, so duplicates are either rejected as ambiguous or applied twice

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent / replayLegEvents` L38-L43
**Primary file SHA-256:** `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=yes

**Preconditions**

- A completion event is retried, replayed after restart, or re-received with the same logical provider attempt.
- The replay caller supplies only leg identity, event type, optional stake, and wall-clock timestamp.

**Trigger**

Submit the same logical fill twice at the same timestamp, or submit it again with a different timestamp.

**Expected behavior**

Each provider event or execution attempt must carry an immutable identity. An exact duplicate must be idempotent, while the same identity with a different payload must fail closed.

**Current behavior**

The event contracts have no event ID, attempt ID, source receipt, sequence, or payload digest. Same-leg same-time duplicates are rejected as ordering ambiguity, while a timestamp-shifted duplicate is treated as a second fill and added to the accumulator.

**Impact**

Restart, retry, or page replay can change filled stake, residual exposure, settlement, and reported profitability. Exact replays are not convergent.

**Evidence**

- The standard event type contains only legId, type, stakeMinor, and occurredAt; the B1 event type likewise contains selection/venue, type, timestamp, and stake.
- Both replay functions sort by timestamp and input index, reject same-leg timestamp ties, and then mutate stake additively without a processed-event identity set.
- The bounded Node 22 harness returned NON_ATOMIC_COMPLETION_EVENT_ORDER_AMBIGUOUS for the exact duplicate but accepted the shifted duplicate and increased the filled YES stake from 100 to 200 minor units.

**Exact source locations**

- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent` L38-L43, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. No immutable event/attempt/receipt field.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `replayLegEvents / validateNoSameLegTimestampTies` L375-L504, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Timestamp/index ordering and tie rejection replace idempotent identity.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `applyEvent` L530-L575, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Fill stake is accumulated for every accepted event.
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `B1FillabilityEvent` L36-L42, SHA-256 `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`. B1 event shape has the same identity omission.
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `replayB1FillabilityEvents / validateNoSameLegTimestampTies` L259-L430, SHA-256 `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`. B1 uses timestamp ordering and additive mutation without idempotency identity.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

Replay ordering is used as a substitute for event identity and idempotency. The state machine cannot distinguish a retry from a second real fill.

**Minimal fix boundary**

Add an immutable provider-event/attempt identity and source receipt to the standard and B1 completion event boundaries, make replay create-or-compare idempotent by that identity, and preserve conflict evidence. Durable transaction mechanics remain R03-owned.

**Required tests**

- Exact duplicate event in the same and different array positions is a no-op.
- Same immutable event ID with any changed type, stake, leg, timestamp, or receipt is blocked.
- Restart/replay permutation tests produce byte-identical completion and residual snapshots.
- Durable duplicate delivery test handed to R03 verifies one economic effect after crash and retry.

**Regression risks**

- Event schema compatibility
- Migration or persistence changes if identities become durable
- Provider adapters that cannot yet supply a stable event identity

**Inherited aliases or dependencies**

- `BWS116-R01-003`
- `BWS116-R01-004`
- `BWS116-R03-014`
- `BWS116-R03-016`

**Secondary sectors**

- R01 upstream provenance
- R03 durable idempotency
- R06 retry/cancellation lifecycle
- R11 test truth

**Explicitly unchanged areas**

- Stake-vector mathematics
- Supported event-type transition guards
- BWS-900 no-execution hold

---

### BWS118-R04-002 | P1 | Fill simulation records stake only and reuses planned odds and cash-flow terms instead of actual execution terms

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent` L38-L43
**Primary file SHA-256:** `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=yes

**Preconditions**

- A paper fill occurs at a price, fee, quantity, or source receipt different from the candidate plan.
- Residual exposure or settlement is calculated from the completion state.

**Trigger**

Replay a fill event that should carry actual execution price/odds, fee, slippage, capacity source, or provider receipt.

**Expected behavior**

A fill must preserve actual stake, price/odds, fees/costs, source time, receive time, provider generation, and immutable receipt before residual or settlement economics are calculated.

**Current behavior**

Standard and B1 fill events contain only stake and time. Residual exposure scales the precomputed plan matrix by filled stake, and B1 settlement calculates payout from the planned scenario rows. No actual execution price, fee, slippage, or source receipt can affect the result.

**Impact**

Simulated residual loss, settled net, and false-positive classification can be materially wrong even when fill quantity is correct. The system cannot audit a deviation between quoted, planned, and executed terms.

**Evidence**

- The event interfaces have no price/odds, fee, slippage, contract, generation, or receipt fields.
- Standard residual exposure multiplies planned per-unit matrix contributions by live filled units.
- B1 residual and settlement scale planned scenario payout rows by live fill and subtract only stake.

**Exact source locations**

- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionEvent` L38-L43, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Standard fill has no actual execution terms.
- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `B1FillabilityEvent` L36-L42, SHA-256 `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`. B1 fill has no actual execution terms.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `analyzeNonAtomicResidualExposure / sumScenarioNetForLiveFilledUnits` L701-L802, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Residual economics reuse planned matrix contribution.
- `packages/bootstrap/src/simulation/b1-residual-exposure.ts` `buildScenarioNets` L200-L245, SHA-256 `95752368da2da1bae3778ca9eae94892cb06db0876a8655beba9c6127c26a516`. B1 residual payout is proportional scaling of planned scenario rows.
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `calculateSettledNetMinor` L705-L745, SHA-256 `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`. B1 settlement uses planned row payout and filled stake only.

**Reproduction status**

`STATIC_SOURCE_CONFIRMED; ECONOMIC_DEVIATION_NOT_LIVE_REPRODUCED`

**Root cause**

The completion boundary models quantity transitions but not execution terms, while downstream economics assume planned matrix terms remain authoritative after fill.

**Minimal fix boundary**

Introduce immutable actual-fill terms and a quote-to-fill receipt at the simulation boundary, then compute residual and settlement from accepted actuals. Pure quote and solver mathematics remain R02-owned.

**Required tests**

- Adverse and favorable slippage change residual and settled net deterministically.
- Fill fee and fixed fee are included exactly once.
- Planned quote identity differs from actual fill receipt and is preserved rather than overwritten.
- Missing actual execution terms block any metric that claims settled or residual economics.

**Regression risks**

- Compatibility with existing fixtures
- Avoid double-counting R02 fee calculations
- Fixed-point scale migration

**Inherited aliases or dependencies**

- `BWS116-R01-004`
- `BWS116-R02-004`
- `BWS116-R02-005`
- `BWS116-R02-014`

**Secondary sectors**

- R01 provenance
- R02 numeric/economic authority
- R03 durable fill storage
- R07 evidence publication

**Explicitly unchanged areas**

- Candidate derivation
- Stake-vector feasibility
- No-live-write boundary

---

### BWS118-R04-003 | P1 | Standard partial fill followed by rejection or expiry loses the terminal disposition in the public leg snapshot

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/non-atomic-completion.ts` `freezeLegSnapshot / deriveLegState` L637-L679
**Primary file SHA-256:** `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=no

**Preconditions**

- A standard leg receives one or more partial fills.
- The remaining quantity is later rejected or expires.

**Trigger**

Replay fill(less than plan) followed by reject or expire on the same leg.

**Expected behavior**

The snapshot must preserve both the partial filled quantity and the terminal disposition of the unfilled remainder, or expose an exhaustive compound state.

**Current behavior**

The accumulator stores terminalDisposition internally, but the public snapshot omits it. deriveLegState checks liveFilledStakeMinor before terminalDisposition and therefore emits leg_partial, making partial+rejected and partial+expired indistinguishable from a still-open partial leg.

**Impact**

Reports, recovery, settlement, and operators cannot tell whether more fill is possible or whether the remainder is terminal. State may appear nonterminal after a terminal provider outcome.

**Evidence**

- reject/expire sets terminalDisposition and clears reservation.
- freezeLegSnapshot does not serialize terminalDisposition.
- deriveLegState returns leg_partial whenever any live fill exists before checking rejected/expired.
- The bounded harness accepted partial fill then reject and serialized the leg only as leg_partial.

**Exact source locations**

- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `LegAccumulator` L100-L107, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Terminal disposition exists only internally.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `applyEvent reject/expire` L577-L612, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Terminal status is set after a partial fill.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `freezeLegSnapshot / deriveLegState` L637-L679, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Snapshot drops terminal disposition and partial state wins by precedence.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The standard state model compresses two independent dimensions, fill quantity and terminal disposition, into one precedence-ordered enum and drops the secondary dimension.

**Minimal fix boundary**

Expose terminalDisposition in NonAtomicPaperLegSnapshot or replace the enum with an exhaustive compound lifecycle representation; update settlement/report consumers without changing B1 semantics unnecessarily.

**Required tests**

- Partial+rejected and partial+expired snapshots retain both quantity and terminal disposition.
- Recovery and report round trips preserve the compound state.
- A subsequent fill after terminal remains blocked.
- An open partial leg remains distinguishable from a terminal partial leg.

**Regression risks**

- Schema and report compatibility
- State-name migrations
- Avoid allowing terminal reopen implicitly

**Inherited aliases or dependencies**

- `BWS116-R03-014`

**Secondary sectors**

- R03 durable state
- R05 API/cockpit projection
- R07 evidence reports

**Explicitly unchanged areas**

- B1 snapshot already carries terminalDisposition
- Residual arithmetic
- Manual kill semantics

---

### BWS118-R04-004 | P1 | Manual or residual-floor kill is an unordered boolean that can retroactively relabel a fully completed group as killed

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/non-atomic-completion.ts` `deriveGroupState` L682-L698
**Primary file SHA-256:** `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=no

**Preconditions**

- Completion events fully fill every leg.
- manualKill is true, or the runtime reruns the same event list with manualKill=true after residual-floor evaluation.

**Trigger**

Evaluate a completed event history with manualKill=true or trigger the residual-floor kill rerun.

**Expected behavior**

Kill must be an ordered lifecycle event with identity and timestamp, and it must not rewrite economic facts that completed before the kill. The model must distinguish stop-future-work from cancellation, liquidation, and completed exposure.

**Current behavior**

manualKill is an input boolean outside the ordered event stream. deriveGroupState returns group_killed before checking whether every leg is filled. The private runtime may rerun the identical completion history with only manualKill changed to true.

**Impact**

A fully completed portfolio can be represented as killed without saying when or what was stopped. Reports cannot reconstruct whether the kill preceded fills, followed completion, or had any economic effect.

**Evidence**

- NonAtomicCompletionInput carries manualKill separately from events.
- deriveGroupState gives manualKill absolute precedence over group_complete.
- The private runtime repeats the same events with manualKill=true when the residual floor is crossed.
- The bounded harness produced group_killed with both legs leg_filled.

**Exact source locations**

- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `NonAtomicCompletionInput` L80-L85, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Kill is supplied outside the event stream.
- `packages/bootstrap/src/simulation/non-atomic-completion.ts` `freezeCompletionSnapshot / deriveGroupState` L649-L698, SHA-256 `3b9944da581cc8fafeb99037e714e4b99a9c1765a512616a7a4bde65d47611df`. Kill boolean overrides full completion.
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `simulateRuntimeCandidate` L878-L924, SHA-256 `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`. Runtime may rerun identical events with manualKill=true.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

Kill authority is modeled as an unordered final label instead of an immutable, causally ordered transition with a defined effect.

**Minimal fix boundary**

Represent kill request/acceptance/effect as explicit ordered evidence, define terminal precedence, and preserve completed fills and post-kill prohibited work separately. Generic cancellation propagation remains R06-owned.

**Required tests**

- Kill before any fill prevents subsequent modeled work and retains kill time/receipt.
- Kill after full completion preserves group_complete plus a separate post-completion stop marker.
- Residual-floor kill has deterministic trigger evidence and no duplicate rerun effect.
- Permutation and restart tests retain causal order.

**Regression risks**

- Existing report status compatibility
- Avoid implying unwind or rollback
- Coordination with runtime cancellation semantics

**Inherited aliases or dependencies**

- `BWS116-R03-011`

**Secondary sectors**

- R03 durable transition storage
- R06 cancellation/shutdown
- R07 kill evidence publication

**Explicitly unchanged areas**

- Fill transition validation
- Settlement outcome calculation
- BWS-900 parked state

---

### BWS118-R04-005 | P1 | B1 settlement and false-positive economics omit fees, quote-age penalties, and capital-lock cost accepted by net evaluation

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `calculateSettledNetMinor` L705-L745
**Primary file SHA-256:** `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`
**Blocks:** release=yes, deployment=yes, BWS-600=no, BWS-710=yes

**Preconditions**

- A B1 candidate passes net evaluation with nonzero fee, quote-age penalty, or capital-lock cost.
- Settlement replay is then calculated for that candidate.

**Trigger**

Compare netCandidate.worstCaseNetMinor with settlementReplay.settledNetMinor under nonzero accepted costs.

**Expected behavior**

Settlement and false-positive classification must carry forward every accepted economic cost exactly once, or explicitly reconcile actual settlement costs against the net model.

**Current behavior**

Net evaluation subtracts total fees, quote-age penalties, and capital-lock cost. Settlement replay ignores those values and computes each leg as planned payout minus live filled stake. falsePositive is then based on this gross settlement number.

**Impact**

A net-negative or materially weaker result can be reported as a positive settled result and not counted as a false positive. Backtest profitability is internally inconsistent across stages.

**Evidence**

- evaluateB1NetEconomics calculates totalFeeMinor, totalQuoteAgePenaltyMinor, capitalLockCostMinor, and net scenario cash flows.
- B1 scenario rows contain only stake and payout.
- calculateSettledNetMinor subtracts filled stake only.
- The bounded harness produced planned worst-case net 964 minor units but settled net 1000 minor units from the same candidate.

**Exact source locations**

- `packages/bootstrap/src/economics/b1-net-spread.ts` `evaluateB1NetEconomics` L114-L214, SHA-256 `0f4bbd52d105d75aef34baa43bea49b09b5c6fde8e3afc8ef7f51383cda0947b`. Net path explicitly computes all three cost classes.
- `packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts` `B1ScenarioCashflowRow / buildB1ScenarioCashflowMatrix` L11-L87, SHA-256 `f48a4d0f697fcc2d9d48328ef665689807f3f97d6c74fbcba67b01520293a580`. Matrix passed forward carries stake and payout but no accepted cost ledger.
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `analyzeB1SettlementReplay` L168-L203, SHA-256 `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`. Settlement false-positive decision uses the cost-free settled net.
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `calculateSettledNetMinor` L705-L745, SHA-256 `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`. Settled net is payout minus filled stake only.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The backtest passes only the stake/payout scenario matrix and fillability snapshots into settlement, dropping the net-economics cost ledger at the stage boundary.

**Minimal fix boundary**

Bind settlement analysis to the accepted net-economics cost breakdown or a settlement-cost ledger and define cost reconciliation. R02 retains ownership of cost formulas and fee expressiveness.

**Required tests**

- Nonzero percentage fee reduces settled net exactly once.
- Quote-age and capital-lock costs survive fill and settlement stages.
- A candidate whose gross settlement is positive but net settlement is nonpositive is marked false positive.
- Zero-cost control retains existing result.

**Regression risks**

- Avoid double charging costs
- Partial-fill cost allocation
- Scenario-conditional fee limitations inherited from R02

**Inherited aliases or dependencies**

- `BWS116-R02-004`
- `BWS116-R02-005`
- `BWS116-R02-014`

**Secondary sectors**

- R02 economics
- R03 persistence
- R07 evidence metrics

**Explicitly unchanged areas**

- Gross candidate derivation
- B1 fill state machine
- No-live-operation markers

---

### BWS118-R04-006 | P1 | Settlement domains cannot represent void, refund, push, reopen, or generation lifecycle despite claiming replay coverage

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `B1SettlementReplayRecord` L30-L35
**Primary file SHA-256:** `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=yes

**Preconditions**

- A provider emits a void, refund, push, cancellation, reopened result, reorg, or generation change.
- BWS attempts to replay or reconcile that terminal lifecycle.

**Trigger**

Supply lifecycle evidence that is not simply a yes/no or one B1 selection final outcome.

**Expected behavior**

The replay contract must encode the native terminal action, monetary consequence, revision/supersession relation, generation, and reopen/finality state without coercing it to a winner.

**Current behavior**

The standard consumed record supports only finalOutcome yes/no. The B1 record supports one finalOutcomeSelectionEquivalenceKey plus static settlementRuleVersion/voidRuleId compatibility. The B1 “void-rule replay” only verifies equal IDs and never represents an actual void, refund amount, push, reopen, or supersession event.

**Impact**

Unsupported terminal events cannot be faithfully replayed. They may be blocked elsewhere, coerced into a winner, or omitted from reports, and no deterministic recovery contract exists for reopened outcomes.

**Evidence**

- ConsumedSettlementReplay finalOutcome is a closed yes/no union.
- B1SettlementReplayRecord has no terminal action or monetary adjustment field.
- validateB1VoidRuleReplay returns compatibility metadata after comparing static rule IDs; it consumes no void/refund occurrence.
- Repository documentation promises void/refund/correction replay, but the executable R04 contracts do not contain those states.

**Exact source locations**

- `packages/bootstrap/src/simulation/settlement-replay.ts` `ConsumedSettlementReplay` L19-L29, SHA-256 `7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2`. Standard outcome domain is winner-only yes/no.
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `B1SettlementReplayRecord` L30-L35, SHA-256 `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`. B1 record has final winner but no terminal action or adjustment.
- `packages/bootstrap/src/simulation/b1-void-rule-replay.ts` `B1VoidRuleReplayRecord / validateB1VoidRuleReplay` L8-L85, SHA-256 `107607954dc2d9cf911e51e8e68d39592d4b5d8f06cddfcdb018ed92212ad2fb`. Void replay compares static compatibility IDs only.

**Reproduction status**

`STATIC_SOURCE_CONFIRMED; EXTERNAL_NATIVE_LIFECYCLE_EVIDENCE_UNAVAILABLE`

**Root cause**

Rule compatibility identifiers are treated as if they were lifecycle evidence, while the replay state machines model only winner replacement over time.

**Minimal fix boundary**

Add explicit provider-bound terminal lifecycle records and monetary effects, with unsupported states held fail-closed. Canonical upstream rule semantics remain external/R10-owned; BWS replay projection is R04-owned.

**Required tests**

- Void with full refund, partial refund, push, cancellation, and reopen cases.
- Generation change or reorg cannot join the prior lifecycle without explicit authority.
- Unsupported terminal action remains held and never produces settled profitability.
- Round-trip replay preserves action, amount, currency, revision, and source receipt.

**Regression risks**

- Contract versioning
- Provider-specific rule differences
- Historical fixture compatibility

**Inherited aliases or dependencies**

- `BWS116-R01-004`
- `BWS116-R01-010`

**Secondary sectors**

- R01 upstream contract/currentness
- R02 scenario semantics
- R03 persistence
- R05 projection
- R07 evidence

**Explicitly unchanged areas**

- Static settlement-rule compatibility checks
- Candidate identity
- No execution

---

### BWS118-R04-007 | P1 | Correction and finality progression are inferred from timestamp and outcome changes without explicit revision authority

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `resolveB1SettlementReplaySequence` L400-L445
**Primary file SHA-256:** `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=yes

**Preconditions**

- Two or more accepted replay manifests share a finalityAuthorityId.
- Their replayAcceptedAt values are strictly increasing.

**Trigger**

Add a later replay with the same outcome or a different outcome, regardless of whether it declares a correction or finality transition.

**Expected behavior**

Every correction or finality advance must be explicitly bound to a monotonic provider revision, superseded record, transition type, generation, and authoritative receipt.

**Current behavior**

Both standard and B1 replay sequences count a later same-outcome record as finality progression and a later different-outcome record as correction solely by timestamp and value comparison. There is no revision number, supersedes hash, correction reason, prior-state digest, or finality-state field.

**Impact**

Unrelated duplicate snapshots, delayed pages, mixed generations, or reordered retained evidence can manufacture corrections/finality and select an arbitrary latest result.

**Evidence**

- The sequence sort uses accepted time plus manifest hash.
- One authority ID and strict timestamp inequality are the only progression constraints.
- The bounded harness submitted three later groups and obtained correctionCount=1 and finalityProgressionCount=1 without any explicit transition evidence.

**Exact source locations**

- `packages/bootstrap/src/simulation/settlement-replay.ts` `consumeStandardBinarySettlementReplaySequence` L333-L392, SHA-256 `7967faca4d58a884c8c6762aaccac6fd1f04c630a3d5632f54c273202c89e8d2`. Standard progression is inferred from time and outcome equality/change.
- `packages/bootstrap/src/simulation/b1-settlement-replay.ts` `resolveB1SettlementReplaySequence` L400-L445, SHA-256 `d81e781e3499dfd1ed7a6135daa40e56b3e189124bf6df5cb74974d24df6d09d`. B1 uses the same inference.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

Temporal succession is conflated with semantic supersession and finality progression.

**Minimal fix boundary**

Require explicit revision/supersession/finality transition evidence and reject gaps, forks, regressions, mixed generations, or unverifiable latest pointers. Upstream provenance fields remain R01-owned.

**Required tests**

- Same-outcome duplicate snapshot does not advance finality without transition evidence.
- Changed outcome does not count as correction without explicit supersession.
- Revision gaps, forks, regressions, mixed generations, and equal revisions conflict deterministically.
- Permutation/restart tests resolve one identical authoritative chain.

**Regression risks**

- Provider revision availability
- Historical fixtures without revisions
- Interaction with retained-currentness semantics

**Inherited aliases or dependencies**

- `BWS116-R01-004`
- `BWS116-R01-010`
- `BWS116-R03-017`

**Secondary sectors**

- R01 provenance/currentness
- R03 durable ordering
- R05 API projection
- R07 evidence

**Explicitly unchanged areas**

- Per-manifest B1 leg completeness
- Finality authority equality check
- Static void-rule ID check

---

### BWS118-R04-008 | P1 | B1 backtest has no cross-stage decision chronology and accepts settlement before quotes with fills after settlement

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `B1CrossVenueBacktestPlan / runCandidateBacktest` L20-L29
**Primary file SHA-256:** `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
**Blocks:** release=yes, deployment=yes, BWS-600=no, BWS-710=yes

**Preconditions**

- A deterministic B1 fixture has quote timestamps and a plan has fill and settlement timestamps.
- Each individual component is syntactically valid.

**Trigger**

Place settlement replay time before quote comparison and fill events after settlement.

**Expected behavior**

Backtest orchestration must bind one explicit decision time and require source observations at or before decision, completion events at or after decision, and settlement strictly after the final completion event.

**Current behavior**

B1CrossVenueBacktestPlan contains no decision timestamp. runCandidateBacktest validates stages independently and never compares quote, decision, fill, or settlement times. The impossible temporal sequence is accepted.

**Impact**

Lookahead and post-settlement fills can generate accepted B1 profitability evidence. The run cannot prove that only information available at decision time was consumed.

**Evidence**

- The B1 plan interface contains policy, events, residual limit, and settlement records but no decision time.
- The orchestration calls gross, solver, net, fillability, and settlement sequentially without temporal cross-checks.
- The bounded harness accepted settlement at 2026-06-30T23:00Z, quote comparison at 2026-07-01T00:00:02.250Z, and fills on 2026-07-02.
- The standard backtest contains explicit decision/settlement and completion-window guards, showing the missing B1 boundary is not an unavoidable design limitation.

**Exact source locations**

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `B1CrossVenueBacktestPlan` L20-L29, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`. No decision timestamp or cross-stage time authority.
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `runCandidateBacktest` L372-L429, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`. Stages are composed without chronology checks.
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `validateExecutionPlanTemporalWindow / validateCompletionEventWindow` L465-L568, SHA-256 `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`. Standard path provides the missing explicit chronology safeguards.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

B1 orchestration composes locally valid artifacts without a shared temporal authority or monotonic cross-stage invariant.

**Minimal fix boundary**

Add a B1 decision timestamp and cross-stage time validation at orchestration input, binding quote source/receive/comparison, fills, and settlement. Durable timestamp constraints remain R03-owned.

**Required tests**

- Settlement before decision is blocked.
- Fill before decision and fill at/after settlement are blocked.
- Future quote or changed data after decision is blocked.
- Boundary equality behavior is specified and tested.
- Standard and B1 chronology tests share explicit invariant fixtures without sharing implementation outputs.

**Regression risks**

- Fixture schema change
- Time-zone and precision consistency
- Interaction with R01 source/receive time

**Inherited aliases or dependencies**

- `BWS116-R01-010`
- `BWS116-R03-017`

**Secondary sectors**

- R01 time/currentness
- R03 durable timestamp constraints
- R11 adversarial tests

**Explicitly unchanged areas**

- Standard backtest chronology guards
- B1 pure math
- BWS-900 hold

---

### BWS118-R04-009 | P1 | B1 report labels in-limit incomplete, rejected, or timed-out simulations as accepted and fillable while discarding leg state

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `toReportCandidateSummary` L452-L493
**Primary file SHA-256:** `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
**Blocks:** release=yes, deployment=yes, BWS-600=no, BWS-710=yes

**Preconditions**

- B1 fillability returns ok for group_incomplete because residual exposure is within the configured limit.
- Settlement replay accepts the partial exposure.

**Trigger**

Run a candidate with a partially filled rejected leg and another timed-out leg whose residual remains inside the limit.

**Expected behavior**

Report status must distinguish fully filled, incomplete-with-residual, rejected, timed-out, settled, and unreconciled states. “Fillable” must not mean merely that the pipeline returned ok.

**Current behavior**

Any candidate result that reaches settlement is mapped to status=accepted, stage=accepted. The summary drops fillability group state, leg snapshots, terminal dispositions, residual exposure, and exposure-limit status. calculateMetrics sets fillableCandidateCount to the number of accepted summaries.

**Impact**

A rejected/timed-out partial portfolio is reported as fillable and can satisfy acceptance gates. Operators cannot see the residual state from the report.

**Evidence**

- simulateB1FillRejectionTimeout intentionally returns accepted for in-limit group_incomplete states.
- toReportCandidateSummary maps every successful pipeline result to accepted without lifecycle fields.
- calculateMetrics equates acceptedCandidates.length with fillableCandidateCount.
- The bounded harness accepted a 5000/10000 rejected leg plus a zero-fill timed-out leg and reported fillableCandidateCount=1 with status/stage accepted.

**Exact source locations**

- `packages/bootstrap/src/simulation/b1-leg-completion.ts` `simulateB1FillRejectionTimeout` L83-L135, SHA-256 `108996f173a566dfb8b72de38c364d3f1d7b3610bcceadbe6c415d94a5fc5b3b`. Incomplete groups are accepted when residual exposure is within limit.
- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `toReportCandidateSummary` L452-L493, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`. Accepted summary drops fill and residual lifecycle.
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `B1BacktestReportCandidateSummary` L6-L25, SHA-256 `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`. Report schema has no fillability or residual state fields.
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `calculateMetrics` L369-L419, SHA-256 `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`. Accepted count is used as fillable count.
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `runtimeAcceptanceMetrics` L485-L514, SHA-256 `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`. Runtime acceptance consumes the collapsed report counters directly.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The report collapses “pipeline completed with analyzable residual exposure” into “accepted/fillable” and its schema lacks the state needed to preserve that distinction.

**Minimal fix boundary**

Expand candidate summaries and metrics to preserve fill group state, terminal dispositions, residual exposure, reconciliation state, and distinct fillability classification. Public UI projection remains R05-owned.

**Required tests**

- Fully filled and incomplete-in-limit candidates produce different report states and counters.
- Rejected/timed-out leg details survive report serialization and hashing.
- Acceptance gates do not count incomplete candidates as filled.
- Blocked, incomplete, settled, and fully filled states remain mutually exclusive.

**Regression risks**

- Report hash/version change
- Acceptance threshold recalibration
- Cockpit/API consumer compatibility

**Inherited aliases or dependencies**

- `BWS116-R02-005`
- `BWS116-R03-016`

**Secondary sectors**

- R03 persistence
- R05 API/cockpit
- R07 evidence acceptance
- R11 validator truth

**Explicitly unchanged areas**

- B1 residual limit calculation
- Candidate identity markers
- No-live-readiness markers

---

### BWS118-R04-010 | P1 | B1 false-positive analysis excludes failures before settlement and computes the rate only over accepted settlements

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `runDeterministicB1CrossVenueBacktest` L100-L121
**Primary file SHA-256:** `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`
**Blocks:** release=yes, deployment=yes, BWS-600=no, BWS-710=yes

**Preconditions**

- A candidate is blocked at gross, stake-vector, net-economics, or fillability stage, or settlement itself is blocked.
- The false-positive report is generated for the run.

**Trigger**

Include candidates that fail before settlement and a mix of accepted and blocked settlement observations.

**Expected behavior**

The falsification denominator and stage metrics must account for every derived candidate and distinguish pre-settlement false positives, fill failures, blocked/unknown settlement, and accepted settlement outcomes.

**Current behavior**

The backtest adds false-positive observations only for fully successful candidates and settlement-stage blockers. Gross, solver, net, and fillability failures disappear. createB1FalsePositiveReport divides falsePositiveCount by acceptedSettlementCount only, excluding blocked settlements from the rate.

**Impact**

The reported false-positive rate can improve when more candidates fail or remain unknown. It cannot measure end-to-end candidate false positives or compare candidate-to-fill-to-settlement attrition truthfully.

**Evidence**

- Observation collection has branches only for candidateResult.ok and candidateResult.stage===settlement.
- The report tracks accepted and blocked settlement counts but uses only acceptedSettlementCount as denominator.
- The bounded harness with one accepted and one blocked observation returned a 0 bps rate based solely on the accepted observation.

**Exact source locations**

- `packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts` `falsePositiveObservations collection` L100-L121, SHA-256 `b367b8880c8461a50912e13b3cb1489a1f5c8e2c235dfd556d2ef615b6a575d4`. Pre-settlement blocked candidates are omitted.
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `createB1FalsePositiveReport` L31-L100, SHA-256 `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`. Rate denominator is accepted settlements only.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The falsification model is settlement-only, but its name and downstream acceptance usage imply end-to-end candidate false-positive analysis.

**Minimal fix boundary**

Define explicit stage denominators and an end-to-end candidate outcome taxonomy; include every derived candidate exactly once and keep blocked/unknown rates separate from accepted settlement rates.

**Required tests**

- Gross, stake, net, fillability, and settlement failures each appear in stage counts.
- Blocked/unknown settlements cannot reduce the accepted-outcome false-positive rate silently.
- End-to-end denominator equals unique derived candidates.
- Duplicate candidate IDs and reordered observations do not alter counts.

**Regression risks**

- Historical metric comparability
- Acceptance threshold semantics
- Do not call operational blockage economic false positive

**Inherited aliases or dependencies**

- None.

**Secondary sectors**

- R02 pure economics
- R07 acceptance evidence
- R11 test/validator truth

**Explicitly unchanged areas**

- Settlement blocker code classification
- Private-only/no-profit markers
- Candidate derivation ordering

---

### BWS118-R04-011 | P1 | B1 marketsCompared counts venue-pair candidates rather than unique markets and can inflate the 50,000-market gate

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/reporting/b1-backtest-report.ts` `calculateMetrics` L369-L419
**Primary file SHA-256:** `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`
**Blocks:** release=yes, deployment=yes, BWS-600=no, BWS-710=yes

**Preconditions**

- One market produces multiple valid venue-pair candidates.
- The B1 runtime evidence gate consumes report.metrics.marketsCompared.

**Trigger**

Generate three candidate summaries for one marketEquivalenceKey across three venue pairs.

**Expected behavior**

marketsCompared must count unique market identities, separately from candidate and venue-pair counts.

**Current behavior**

calculateMetrics sets marketsCompared=candidates.length and candidateCount=candidates.length. Candidate derivation emits one candidate per market and venue pair, so one market is counted repeatedly. Runtime acceptance trusts this value for minimumMarketsCompared.

**Impact**

A run can satisfy the minimum 50,000 market requirement with materially fewer unique markets, creating false data-coverage readiness.

**Evidence**

- B1 candidate derivation iterates venue pairs within a market group.
- Report code assigns candidate length to marketsCompared.
- Runtime evidence compares that report field directly with minimumMarketsCompared.
- The bounded report harness supplied three venue-pair candidates for one market and returned marketsCompared=3, candidateCount=3, uniqueEvents=1.

**Exact source locations**

- `packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts` `deriveB1CrossVenueGrossOpportunityCandidates` L88-L142, SHA-256 `29866c6839497502a2f9371166dd3865026bc8bca7a8cc57dad12c5717ba2543`. One candidate is derived per venue pair within a market group.
- `packages/bootstrap/src/reporting/b1-backtest-report.ts` `calculateMetrics` L369-L419, SHA-256 `8c8cbc440a521c4ee32de8bde89c547fe3c97c36d43935008c3f0b39a2657272`. marketsCompared aliases candidate cardinality.
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` `dataCoverageBlockers / runtimeAcceptanceMetrics` L418-L500, SHA-256 `80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8`. Acceptance consumes the inflated value.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The report has no independent unique-market set and aliases a coverage metric to the candidate cardinality.

**Minimal fix boundary**

Derive marketsCompared from unique canonical market/equivalence identity, retain candidateCount separately, and bind acceptance to the corrected metric.

**Required tests**

- Multiple venue pairs for one market count as one market and multiple candidates.
- Same market across duplicate rows remains one market.
- Distinct markets on one event count separately.
- Runtime threshold test proves candidate multiplication cannot satisfy market coverage.

**Regression risks**

- Acceptance baselines may fall after correction
- Market identity dependency on R02
- Historical report hash changes

**Inherited aliases or dependencies**

- `BWS116-R02-002`
- `BWS116-R02-007`

**Secondary sectors**

- R02 market identity
- R07 runtime acceptance
- R11 validator truth

**Explicitly unchanged areas**

- Unique-event deduplication
- Venue-pair counting
- Candidate IDs

---

### BWS118-R04-012 | P1 | Standard backtest and private-paper strategy reports discard per-leg lifecycle evidence while labeling candidates accepted_local_evidence

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/strategy/strategy-ledger.ts` `SurebetStrategyCandidateReport / toBacktestCandidateReport / toPrivatePaperCandidateReport` L113-L123
**Primary file SHA-256:** `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`
**Blocks:** release=yes, deployment=yes, BWS-600=yes, BWS-710=no

**Preconditions**

- A standard candidate completes with partial, rejected, expired, rolled-back, killed, or otherwise nontrivial per-leg history.
- A strategy report or ledger entry is generated.

**Trigger**

Project an accepted backtest/private-paper result into SurebetStrategyCandidateReport.

**Expected behavior**

The accepted evidence report must retain the exact completion snapshots, terminal dispositions, event/receipt identities, residual scenario evidence, and reconciliation state needed to audit the acceptance label.

**Current behavior**

Standard accepted results retain only aggregate group state, counts, filled/excluded IDs, settlement, and optional residual summary. The strategy report reduces this further to completionGroupState, settledNetMinor, finalOutcome, and optional killReason, then labels it accepted_local_evidence.

**Impact**

Partial, rejected, expired, rolled-back, or kill-order facts can disappear from the authoritative report. Consumers cannot independently prove that accepted_local_evidence is consistent with the underlying lifecycle.

**Evidence**

- StandardBinaryBacktestAcceptedCandidateResult has no leg snapshots or completion event records.
- PrivatePaperRuntimeAcceptedCandidateResult likewise carries aggregate IDs rather than the complete replay evidence.
- SurebetStrategyCandidateReport has nine scalar/array fields and no per-leg/event evidence.
- Both mapping functions assign resultState=accepted_local_evidence for any accepted candidate result.

**Exact source locations**

- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `StandardBinaryBacktestAcceptedCandidateResult` L43-L62, SHA-256 `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`. Accepted result lacks leg snapshots and raw completion events.
- `packages/bootstrap/src/backtest/standard-binary-backtest.ts` `createAcceptedCandidateResult` L571-L607, SHA-256 `b89833bedd366b9d4b714cb0eddd6610e5eabd7217477063d7a1a2006b60e438`. Projection retains only aggregate completion evidence.
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `PrivatePaperRuntimeAcceptedCandidateResult` L106-L126, SHA-256 `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`. Private accepted result is also aggregate-only.
- `packages/bootstrap/src/runtime/private-paper-runtime.ts` `create accepted runtime candidate result` L1161-L1191, SHA-256 `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`. Runtime maps reconciliation to aggregate fields.
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `SurebetStrategyCandidateReport` L113-L123, SHA-256 `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`. Strategy report schema has no per-leg/event evidence.
- `packages/bootstrap/src/strategy/strategy-ledger.ts` `toBacktestCandidateReport / toPrivatePaperCandidateReport` L795-L841, SHA-256 `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`. Both accepted paths emit accepted_local_evidence from lossy aggregates.

**Reproduction status**

`STATIC_SOURCE_CONFIRMED`

**Root cause**

Evidence projection is lossy at two consecutive boundaries and the acceptance label is derived from pipeline success rather than an independently auditable lifecycle packet.

**Minimal fix boundary**

Preserve or content-address the full completion/reconciliation packet in accepted candidate reports and bind the acceptance label to that immutable evidence. API/UI rendering remains R05-owned; publication lineage remains R07-owned.

**Required tests**

- Per-leg terminal and quantity state survives backtest/private report generation.
- Report digest changes when any underlying event or snapshot changes.
- A consumer can validate accepted_local_evidence without an in-memory source object.
- Killed and incomplete candidates cannot appear equivalent to fully completed candidates.

**Regression risks**

- Larger report artifacts
- Backward compatibility and report hashes
- Retention/reference requirements

**Inherited aliases or dependencies**

- `BWS116-R01-003`
- `BWS116-R01-004`
- `BWS116-R03-014`
- `BWS116-R03-016`

**Secondary sectors**

- R03 persistence
- R05 API/cockpit
- R07 evidence publication
- R11 artifact tests

**Explicitly unchanged areas**

- Upstream lock reference fields
- Privacy=private_only
- No public profitability claim

---

### BWS118-R04-013 | P2 | B1 false-positive report throws on malformed top-level or observation objects instead of returning a blocked boundary result

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `createB1FalsePositiveReport / validateB1FalsePositiveObservation` L31-L105
**Primary file SHA-256:** `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`
**Blocks:** release=yes, deployment=no, BWS-600=no, BWS-710=yes

**Preconditions**

- An untyped JavaScript caller, deserialized payload, or future caller passes null/non-array input or an observation without a string candidateId.

**Trigger**

Call createB1FalsePositiveReport(null) or pass {settlementStatus:"accepted"} as an observation.

**Expected behavior**

All public boundary helpers must validate container and field types before dereference and return BoundaryResult blockers for malformed input.

**Current behavior**

The function immediately reads observations.length and the validator immediately calls observation.candidateId.trim() without checking object or string shape. Malformed input throws TypeError.

**Impact**

A malformed retained report or caller bug can crash a bounded backtest/report process rather than producing explicit blocker evidence. Diagnostics and batch isolation are weakened.

**Evidence**

- No Array.isArray check precedes observations.length.
- No object/string guard precedes candidateId.trim().
- Both malformed cases were reproduced in bounded Node 22 harnesses.

**Exact source locations**

- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `createB1FalsePositiveReport` L31-L100, SHA-256 `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`. Top-level input is dereferenced before type validation.
- `packages/bootstrap/src/reporting/b1-false-positive-report.ts` `validateB1FalsePositiveObservation` L102-L163, SHA-256 `55d3a251830501a284214bac6e94a16eb3f194fcce33195df5e3ee37cb985f95`. candidateId.trim is called before structural validation.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

The report helper relies on TypeScript compile-time shape guarantees at a runtime boundary that is called with deserialized/untrusted structures elsewhere in the repository.

**Minimal fix boundary**

Add top-level array and per-observation structural validation before dereference; return stable blocker codes and preserve current valid-output shape.

**Required tests**

- null, object, string, sparse array, null observation, missing candidateId, and non-string candidateId return blockers without throwing.
- Valid accepted and blocked observations remain unchanged.
- Batch runner continues after one malformed report input where policy permits.

**Regression risks**

- Blocker code compatibility
- Avoid masking programmer invariants as user input
- Performance for large arrays

**Inherited aliases or dependencies**

- None.

**Secondary sectors**

- R11 aggregate boundary tests

**Explicitly unchanged areas**

- Valid report arithmetic
- Settlement blocker classification
- Runtime acceptance semantics

---

### BWS118-R04-014 | P2 | Exported partial-fill status falsely identifies a legacy state machine that has no partial-fill state

**Confidence:** HIGH
**Primary owner:** R04
**Primary source:** `packages/bootstrap/src/simulation/partial-fill.ts` `partialFillModelStatus` L3-L18
**Primary file SHA-256:** `84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93`
**Blocks:** release=yes, deployment=no, BWS-600=no, BWS-710=no

**Preconditions**

- A validator, operator, or consumer relies on partialFillModelStatus as implementation capability evidence.

**Trigger**

Read the accepted status payload and follow implementationModule to src/simulation/leg-completion.ts.

**Expected behavior**

Capability/status evidence must identify the actual production partial-fill implementation and prove the claimed state is representable through its entrypoint.

**Current behavior**

partialFillModelStatus returns accepted and names src/simulation/leg-completion.ts, but PAPER_LEG_COMPLETION_STATES in that module contains open, reserved, filled, failed, stale, and settlement_pending only. The actual partial-fill behavior lives in non-atomic-completion.ts and B1 modules.

**Impact**

Marker-based validators and documentation can report partial-fill implementation present while following a module that cannot represent partial state, creating false assurance and confusing callers.

**Evidence**

- The accepted status payload hard-codes the legacy module path.
- The referenced enum has no leg_partial state.
- The focused tests pass because they assert marker/status strings rather than exercising partial fill through the referenced entrypoint.
- The bounded harness returned the accepted status unchanged.

**Exact source locations**

- `packages/bootstrap/src/simulation/partial-fill.ts` `PartialFillModelStatus / partialFillModelStatus` L3-L18, SHA-256 `84ea147e7d449e3ffdfcfcd662f29803dc5905f4d207b556ed04ab6b39071a93`. Accepted capability marker points to legacy module.
- `packages/bootstrap/src/simulation/leg-completion.ts` `PAPER_LEG_COMPLETION_STATES` L5-L12, SHA-256 `934fb7e5b36545bbc393d0c4909cd4fbc5ddaaf2d540819acc222577ba672aa7`. Referenced module has no partial state.
- `tests/leg-completion.test.ts` `partial-fill status assertions` L1-L246, SHA-256 `f3e273e97b4388f9aa45e6cb4197874f90aafdedceebea4892a2293abeadce24`. Focused tests exercise marker/status behavior rather than partial fill through the declared module.

**Reproduction status**

`REPRODUCED_OFFLINE_NODE22_SUPPLEMENTARY; STATIC_SOURCE_CONFIRMED`

**Root cause**

A static capability marker was not updated when implementation moved to a different state machine, and tests validate the declaration rather than the declared behavior.

**Minimal fix boundary**

Retire the stale status helper or point it to the actual production entrypoint with a behavioral validator. Aggregate validator ownership remains R11.

**Required tests**

- Status-referenced entrypoint accepts a genuine partial fill and returns a partial state.
- Renaming/removing the implementation causes the validator to fail.
- No marker-only test can pass without invoking the production path.

**Regression risks**

- Legacy consumer expectations
- Documentation links
- Avoid treating local capability as runtime acceptance

**Inherited aliases or dependencies**

- `KNOWN_BASELINE_MANIFEST_DRIFT`

**Secondary sectors**

- R11 tests/validators/manifest trust

**Explicitly unchanged areas**

- Actual non-atomic and B1 partial-fill implementations
- BWS-600 external hold
- No execution

---

## Hypothesis and external blockers

- **BWS118-R04-HYP-001 | Provider-native lifecycle may require additional terminal and correction states beyond those represented in the supplied archive.** Executable BWS contracts are narrower than the documented void/refund/correction scope, but external provider authority and accepted live payloads were explicitly unavailable and not contacted. Required proof: Accepted upstream contract plus sanitized native lifecycle captures for each supported provider/generation.
- **BWS118-R04-EXT-001 | Accepted betting-win B1 multi-venue runtime resource and API handoff remain unavailable.** BWS-710 and runtime-level verification of B1 fill/settlement semantics remain blocked. Offline fixtures cannot establish provider acceptance.
- **BWS118-R04-EXT-002 | Current provider void, refund, correction, reopen, and finality authority is absent from the supplied BWS archive.** R04 can confirm representational gaps but cannot establish the complete provider-native lifecycle contract without external upstream evidence.
- **BWS118-R04-ENV-001 | Canonical Node 20.20.2 was unavailable.** Node 22.16.0 build, test, and harness observations are supplementary only.
- **BWS118-R04-ENV-002 | Local disposable PostgreSQL execution was unavailable.** R03-owned transaction/isolation behavior was not dynamically retested during R04.

## Intentional safeguards

- **BWS118-R04-SAFE-001:** B1 fixtures and reports preserve runtimeEvidence=false and the accepted upstream block marker.
- **BWS118-R04-SAFE-002:** Standard backtest enforces quote/decision/settlement ordering and completion events inside the decision-to-settlement window.
- **BWS118-R04-SAFE-003:** Completion replay rejects same-leg timestamp ties, fill after terminal, overfill, and duplicate terminal markers.
- **BWS118-R04-SAFE-004:** B1 explicitly forbids unwind/rollback and keeps executable=false with BWS-900 parked.
- **BWS118-R04-SAFE-005:** Report contracts retain private-only and no-public-profitability markers.

## Rejected suspicions

- **BWS118-R04-REJ-001 | Standard deterministic backtest consumes settlement available at or before decision time:** Rejected. Source lines L465-L568 fail closed on quote/decision, settlement/decision, and completion/settlement ordering.
- **BWS118-R04-REJ-002 | B1 duplicate candidate plans silently overwrite each other:** Rejected. indexBacktestPlans blocks duplicate candidateId plans.
- **BWS118-R04-REJ-003 | Standard settlement accepts one manifest hash with conflicting payloads:** Rejected. The sequence consumer blocks idempotency mismatch for one replay manifest hash.
- **BWS118-R04-REJ-004 | B1 settlement accepts a manifest group missing one compared leg:** Rejected. Each manifest group is checked against the full expected leg-key set.
- **BWS118-R04-REJ-005 | Local B1 fixtures or reports can directly satisfy runtime evidence acceptance:** Rejected for the inspected path. runtimeEvidence=false and upstreamReadiness hold checks remain enforced.

## Cross-area handoffs

- **BWS118-R04-HO-R01-001 -> R01: Bind completion/settlement inputs to exact cycle, page, route, contract, generation, and immutable receive provenance.** R04 can preserve only identity and currentness receipts that R01 intake exposes; do not duplicate upstream provenance roots. Dependencies: `BWS116-R01-003`, `BWS116-R01-004`, `BWS116-R01-010`.
- **BWS118-R04-HO-R02-001 -> R02: Provide quote-bound actual economic authority and corrected unique market identity.** R04 owns lifecycle preservation, not pure identity, fee, solver, or scenario formulas. Dependencies: `BWS116-R02-002`, `BWS116-R02-004`, `BWS116-R02-005`, `BWS116-R02-014`.
- **BWS118-R04-HO-R03-001 -> R03: Persist replay IDs, compound terminal state, revisions, and chronology atomically with fenced restart semantics.** R04 defines semantic state; R03 owns durable atomicity, crash repair, and timestamp constraints. Dependencies: `BWS116-R03-014`, `BWS116-R03-015`, `BWS116-R03-016`, `BWS116-R03-017`.
- **BWS118-R04-HO-R05-001 -> R05: Ensure API and cockpit expose incomplete, terminal, residual, unknown, and unreconciled states without green projection.** The R04 source packet is lossy; R05 must not further manufacture truth during projection. Dependencies: `BWS118-R04-003`, `BWS118-R04-009`, `BWS118-R04-012`.
- **BWS118-R04-HO-R06-001 -> R06: Bind kill, cancellation, timeout, and late completion to process ownership and shutdown semantics.** Generic in-flight cancellation and late child completion are R06-owned. Dependencies: `BWS118-R04-001`, `BWS118-R04-004`.
- **BWS118-R04-HO-R07-001 -> R07: Do not publish BWS-600/B1 acceptance evidence from collapsed or inflated R04 metrics.** Evidence publication and campaign artifact truth are R07-owned. Dependencies: `BWS118-R04-005`, `BWS118-R04-009`, `BWS118-R04-010`, `BWS118-R04-011`, `BWS118-R04-012`.
- **BWS118-R04-HO-R11-001 -> R11: Validators and tests remain green despite R04 defects; retain known source-manifest drift under R11.** Five static validators and 171 focused tests passed while adversarial production-entrypoint probes reproduced these defects. Dependencies: `BWS118-R04-001`, `BWS118-R04-005`, `BWS118-R04-008`, `BWS118-R04-009`, `BWS118-R04-011`, `BWS118-R04-013`, `BWS118-R04-014`, `KNOWN_BASELINE_MANIFEST_DRIFT`.

## Test and validator gaps

- **BWS118-R04-TG-001:** No immutable completion event ID duplicate/conflict/restart matrix.
- **BWS118-R04-TG-002:** No actual-fill odds, price, fee, slippage, or source-receipt settlement test.
- **BWS118-R04-TG-003:** No standard partial-fill plus reject/expire snapshot round-trip test.
- **BWS118-R04-TG-004:** No causally ordered kill-before-fill, kill-during-fill, and kill-after-completion test.
- **BWS118-R04-TG-005:** No B1 settlement test with nonzero fee, quote-age, and capital-lock costs.
- **BWS118-R04-TG-006:** No void, refund, push, reopen, generation-change, or partial-refund replay test.
- **BWS118-R04-TG-007:** No explicit revision/supersedes/finality fork, gap, regression, and mixed-generation tests.
- **BWS118-R04-TG-008:** No B1 decision/quote/fill/settlement cross-stage chronology tests.
- **BWS118-R04-TG-009:** No report assertion that incomplete rejected/timed-out candidates are not counted as fillable.
- **BWS118-R04-TG-010:** No end-to-end false-positive denominator test covering every blocked stage.
- **BWS118-R04-TG-011:** No unique-market-versus-venue-pair coverage metric test.
- **BWS118-R04-TG-012:** No malformed null/nonobject report-boundary test for createB1FalsePositiveReport.
- **BWS118-R04-TG-013:** No behavioral validator proving the module named by partialFillModelStatus implements partial fills.
- **BWS118-R04-TG-014:** Canonical Node 20.20.2 build and focused suite were not rerun in this environment.
- **BWS118-R04-TG-015:** Accepted live B1 and provider terminal-lifecycle fixtures were unavailable by design.

The focused Node 22 suite passed 171 of 171 tests, and all five selected static validators passed. Those green results coexist with the reproduced defects above. This is direct evidence for the R11 handoff: current assurance emphasizes marker and happy-path correctness and does not establish adversarial production-entrypoint behavior.

## Prioritized review-only remediation order

1. Establish immutable completion-event identity and actual fill receipts before any downstream lifecycle correction.
2. Define an exhaustive compound completion and kill state model, including partial+terminal and causally ordered stop authority.
3. Define explicit settlement lifecycle actions, revision/supersession/finality authority, and cost reconciliation.
4. Add B1 decision-time and cross-stage chronology invariants.
5. Correct report state projection, fillability classification, false-positive denominators, and unique-market cardinality.
6. Preserve or content-address full lifecycle evidence in strategy reports.
7. Repair runtime boundary validation and stale capability markers.
8. Update R11 tests and validators, then rerun the complete canonical Node 20.20.2 gate.

This ordering is dependency-aware research guidance, not an implementation prompt or authorization.

## Validation summary

- Archive identity and all 657 member hashes reconciled.
- BWS117-to-BWS118 non-documentation compatibility reconciled.
- 41 inherited findings overlap-checked and preserved.
- Supplementary Node 22 build passed after linking an already installed local `@types/node` only inside the disposable copy; no package was installed.
- Focused Node 22 tests: 171 passed, 0 failed, 0 skipped.
- Bounded adversarial harnesses reproduced the reported state, chronology, metric, and malformed-input behavior.
- Five selected static validators passed but did not detect the defects.
- `validate_source_manifest.py` failed only for the known seven-path baseline drift, retained as `KNOWN_BASELINE_MANIFEST_DRIFT` for R11.
- No external network, provider, account, credential, service, `betting-win` checkout/database, persistent BWS database, or financial operation was accessed.
- No source, test, fixture, schema, documentation, configuration, manifest, archive, Git state, controller, or service was modified.

## Explicit unchanged areas

- The current BWS-600 external-runtime hold remains binding.
- The BWS-710 accepted B1 runtime-resource hold remains binding.
- BWS-900 execution remains parked and no execution path was enabled.
- `betting-win` remained an untouched read-only external dependency and was not accessed.
- R01 upstream trust/currentness, R02 pure identity/economics/solver mathematics, and R03 generic PostgreSQL transaction mechanics retain their existing owners and stable IDs.
- No documentation overlay, implementation prompt, server command, commit, push, pull, reset, clean, stash, branch change, or dependency installation was produced.

## Completion statement

R04 is complete for the supplied BWS118 archive: all 657 members are represented once in coverage; owned production paths, focused tests, and downstream report consumers were traced; all 41 inherited confirmed IDs were checked for overlap; 14 distinct R04 root causes have exact current-source evidence and bounded correction boundaries; shared-area effects are explicit handoffs; and the source tree remained unchanged.
