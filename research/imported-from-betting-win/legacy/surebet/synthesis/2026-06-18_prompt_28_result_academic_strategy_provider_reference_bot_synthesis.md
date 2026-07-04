# Betting-win Academic Strategy, Provider and Reference-Bot Evidence Synthesis

Status: private research roadmap only  
Implementation status: blocked  
Execution status: prohibited  
Evidence cutoff: repository state in `betting-win34.zip`

## Executive decision

The first paper-only lane is:

```text
Sport: Tennis
Competition scope: ATP main-tour, main-draw, best-of-three matches
Market: pre-match full-match winner, two outcomes
Strategy: surface-specific Elo residual versus SX Bet no-vig market probability
Provider: SX Bet
Initial evidence class: price_only for signal, calibration and CLV research
Paper-fill eligibility: blocked until top_level or depth_snapshot evidence exists
```

This lane is selected because it has the strongest direct academic forecasting base, a simple binary payoff structure, high event frequency, active SX tennis market evidence, and a model baseline that is interpretable and easy to falsify. It is deliberately restricted to ATP main-tour best-of-three matches to avoid mixing Grand Slam best-of-five formats, team competitions, Challenger/ITF integrity risk, and heterogeneous settlement rules in the first experiment.

Surebet remains an auxiliary identity, price-quality and mispricing module. It receives exactly one separate paper-only experiment:

```text
Family: same-venue complete-set arbitrage
Venue: Polymarket CLOB V2
Collateral generation: pUSD
Market scope: standard binary markets only
Excluded: negative-risk markets until the missing source pack is complete
```

Cross-venue surebet, back/lay arbitrage and synthetic equivalence remain parked. They require stronger rule equivalence, executable capacity, retention rights and completion evidence than the repository currently contains.

The next action is a narrow data-source feasibility pass. No implementation prompt should be generated until the selected tennis lane has a free, legally retainable feature source, an admissible closing-price path, an accepted SX retention posture, and a complete tennis settlement-rule profile.

## Evidence basis

This decision synthesizes the reviewed evidence rather than the raw claims from any one prior output.

| Evidence layer | Canonical conclusion used here |
|---|---|
| Prompt 26 and Stage 25 | Surebet mathematics is valid only after identity, scenario, cost, capacity, completion and settlement proof. Quoted opportunities do not establish executable or settled arbitrage. |
| Prompt 27 and Stage 26 | Tennis, Soccer and MLB are the academic Phase 1 lanes. Tennis has the strongest direct model literature. Soccer is evidence-rich but efficient. MLB is data-rich but single-game EV remains unproven. |
| SX Stages 12-16 and 23 | SX has a deterministic REST/backfill paper-ledger specification, active tennis and MLB payload evidence, price-only best odds, trade/settlement evidence and partial chain verification. Executable depth and continuous-retention permission remain unresolved. |
| Azuro Stages 21-22 | Azuro has a substantially complete static source pack and strong contract/event accounting surfaces, but current runtime capture, OpenAPI/current Graph mapping and retention rights remain open. |
| Polymarket Stage 24 | Polymarket has the strongest public L2 depth and native price-history surface, but current resolution and negative-risk source packs remain incomplete. Current production is CLOB V2 with pUSD. |
| Stage 27 bot audit | Provider adapters, canonical identity, sequence-aware caches, durable reconciliation and fail-closed state are reusable patterns. All supplied execution implementations are rejected. |
| Compliance and data-rights gates | Work remains private, read-only and non-promotional. No wallet, execution, public signals, affiliate flow or automated betting is allowed. Public readability does not automatically permit indefinite historical retention. |

No sport, strategy or provider is classified as profitable. The roadmap ranks falsifiable research experiments, not betting recommendations.

## Ranked paper-only experiment roadmap

All experiments are read-only. `price_only` may support model comparison, signal frequency and CLV research, but it may not support simulated fillability, capacity or ROI. A simulated fill requires at least `top_level` evidence with explicit size. Multi-leg or slippage-sensitive work requires `depth_snapshot` evidence.

| Rank | Experiment | Family | Exact lane and hypothesis | Provider and source mapping | Minimum quote evidence | Readiness | Exact kill condition |
|---:|---|---|---|---|---|---|---|
| 1 | EXP-01 ATP surface-Elo residual | Predictive/value | ATP main-tour, best-of-three, pre-match match winner. Test whether surface-specific Elo adds calibrated information beyond SX no-vig probability. | SX REST/backfill for market, price, trades and settlement; free/external tennis feature source pending verification. | `price_only` for signal/CLV; `top_level` for paper fill. | Selected first lane, source-feasibility gated. | Kill before implementation if no free legally retainable feature source exists, fewer than 1,000 eligible out-of-sample matches can be joined, identity/rules cannot be resolved for every included match, or the model fails to improve both Brier score and log loss over the no-vig market in at least two of three walk-forward windows. Kill the strategy signal if mean CLV is non-positive after 500 eligible signals. |
| 2 | EXP-02 MLB starter-adjusted moneyline | Predictive/value | Full-game MLB moneyline using team strength, confirmed starter quality and home/park context. | SX for market/settlement; free/external MLB feature source and weather source pending rights review. | `price_only`; `top_level` for fill. | High academic/data plausibility, source-rights gated. | Kill if confirmed-starter timestamps are missing for more than 5% of eligible games, the starter model does not beat a team-only baseline in two of three walk-forward windows, or mean CLV is non-positive after 500 signals. |
| 3 | EXP-03 MLB first-five innings starter model | Predictive/value | MLB first-five innings moneyline. Test whether removing bullpen variance improves calibration and market residual quality. | SX first-five market evidence plus free/external starter, park and weather data. | `price_only`; `top_level` for fill. | Provider market evidence exists; rule profile incomplete. | Kill if the provider cannot supply an exact first-five rule/listed-pitcher profile, fewer than 300 eligible events are available, or the model does not improve log loss over the full-game starter model. |
| 4 | EXP-04 top-league soccer totals | Predictive/value | Top-league pre-match total-goals line, initially 2.5 where available, using Dixon-Coles or bivariate count probabilities. Avoid 1X2 as the first soccer market. | SX where exact totals rules are available; Azuro only after bounded runtime evidence; free/external results and closing-price source pending. | `price_only`; `top_level` for fill. | Academic replication lane, provider/data gated. | Kill if exact line and settlement rules cannot be versioned, market probability beats the model on both RPS-equivalent binary scoring and log loss in two of three windows, or no positive CLV remains after vig-removal sensitivity tests. |
| 5 | EXP-05 ATP surface-transition residual | Information/model overlay | ATP best-of-three match winner after a player changes surface category. Test whether market prices underreact to recent surface-specific strength. | SX plus the same verified tennis feature source as EXP-01. | `price_only`. | Depends on EXP-01 data stack. | Kill if the transition term is unstable across walk-forward windows, adds no out-of-sample Brier improvement, or produces fewer than 100 eligible signals per year. |
| 6 | EXP-06 ATP favorite-longshot calibration filter | Behavioural/filter | Test whether excluding or reweighting extreme probability ranges improves calibration and CLV relative to the unfiltered EXP-01 model. | SX best odds and settled results; same tennis features as EXP-01. | `price_only`. | Low incremental data burden after EXP-01. | Kill if probability-bucket calibration and mean CLV do not improve over the unfiltered model after at least 1,000 observations. Do not convert a filter into a stand-alone “bet favorites” rule. |
| 7 | EXP-07 NBA confirmed-lineup first-quarter total | Information-event/value | First-quarter total after confirmed lineup or major late availability change. Test whether a bounded information window remains after the official update. | SX if the exact market exists; free/external lineup, injury and timestamp source required. | At least `top_level`; two time-ordered observations required. | Phase 2 and strongly data gated. | Kill if no free legally retainable confirmed-lineup timestamp source exists, provider market coverage is below 300 events, the median data-to-price latency is shorter than the collection cadence, or CLV is non-positive after 300 signals. |
| 8 | EXP-08 Polymarket standard complete-set | Same-venue complete-set arbitrage | Standard binary market where fully filled YES and NO costs plus fees, gas and reserves are below one pUSD redeemable unit. | Polymarket Gamma, CLOB full depth, CLOB V2 source, pUSD collateral adapter and current resolution source. | `depth_snapshot` for every leg; `reserved_paper_capacity` before arming. | Separate auxiliary experiment; resolution source-pack gated. | Kill if current resolution evidence is incomplete, the market is negative-risk or generation-unknown, any terminal scenario has non-positive net cash flow, fewer than 100 candidates survive full-depth and fee checks in the observation window, or simulated full-group completion is below 95%. |
| 9 | EXP-09 MLB starting-pitcher-change lag | Information-event/value | Full-game or first-five price response after an officially timestamped starter replacement. | SX snapshots/trades plus a legally retainable starter-change source. | `top_level` and at least two sequential quotes. | Data-latency gated. | Kill if official change timestamps are unavailable, the observed price response completes before the collection cadence in at least 90% of events, or fewer than 100 qualifying changes exist across the available history. |
| 10 | EXP-10 Polymarket sports L2 price-discovery | Market microstructure | Standard sports binary markets. Test whether book imbalance, spread and trade flow predict the next bounded price move without assuming profitability. | Polymarket CLOB REST/WebSocket and native price history; resolution source required for outcome analysis. | `depth_snapshot`. | Public surface strong; bounded capture and terms pending. | Kill if sports-market coverage is below 200 resolved markets, sequence gaps cannot be reseeded deterministically, or the signal fails to improve next-move log loss/AUC over midpoint and last-trade baselines in two of three windows. |
| 11 | EXP-11 SX–Polymarket matched-market divergence | Cross-provider price-quality | Compare verified equivalent sports markets to measure disagreement and stale-price frequency. This is not surebet and does not authorize multi-leg completion. | SX `price_only` snapshots plus Polymarket `depth_snapshot`, canonical identity graph and rule profiles. | SX `price_only`; Polymarket `depth_snapshot`. | Identity and coverage gated. | Kill if fewer than 200 exact market matches survive rule verification, more than 2% of reviewed candidates reveal identity/rule mismatch, or observed divergence disappears after time alignment, fees and conservative latency reserve. |
| 12 | EXP-12 second-tier soccer model with integrity gate | Predictive/value, high risk | Second-tier pre-match totals or handicap model, never generic 1X2 by default. Test whether softer pricing survives lower data quality and integrity controls. | SX or Azuro after runtime proof; free/external results, odds and integrity data required. | `price_only`; depth required for fill claims. | Lowest priority; effectively parked until evidence improves. | Kill immediately if integrity monitoring, stable IDs, settlement rules or legal data access are missing. Otherwise kill if liquidity/capacity is unknown for most candidates or CLV is non-positive after 500 signals. |

## Selected first lane

### Lane contract

```text
lane_id: EXP-01
sport: tennis
competition_scope: ATP main tour
round_scope: main draw
format_scope: best of three
market_family: full_match_match_winner
market_timing: pre_match
outcomes: player_a, player_b
strategy: surface_specific_elo_market_residual
primary_provider: SX Bet
initial_mode: signal_and_clv_only
paper_fill_mode: blocked pending explicit size evidence
```

Grand Slam best-of-five matches, Davis Cup and other team competitions, qualifiers, Challenger, ITF, live markets, set markets, game handicaps and totals are outside the first lane.

### Research question

Does a surface-specific ATP Elo model produce probabilities that are better calibrated than SX no-vig match-winner probabilities and identify positive provider-internal closing-line movement out of sample?

The experiment does not ask whether the model produces real-money profit. The first objective is to establish whether the model adds repeatable probability information after the market baseline.

### Model and baselines

The candidate model is a deterministic surface-specific Elo system with separate hard, clay and grass ratings, explicit time decay and a logistic probability transform. Hyperparameters are chosen on a validation window only.

Required baselines:

1. SX no-vig match-winner probability from the two outcomes in the same observation.
2. Global Elo without surface separation.
3. Ranking-only logistic baseline if a legally retainable ranking source exists.
4. Constant/base-rate model for scoring-rule sanity checks.

The chosen probability-calibration method must be fixed before the final test window. Platt or isotonic calibration may be compared on validation data, but the better test result may not be selected post hoc.

### Temporal evaluation

- At least five complete seasons of legally retained history.
- At least 1,000 eligible events in the combined out-of-sample windows.
- Three non-overlapping walk-forward test windows.
- No random train/test split.
- Every feature must have an `available_at` timestamp not later than the prediction timestamp.
- The final paper-forward window is untouched until the model, threshold and rule profile are frozen.

### Primary metrics

- Brier score and Brier skill versus SX no-vig probability.
- Log loss versus SX no-vig probability.
- Calibration curve and expected calibration error.
- Provider-internal CLV from signal observation to the final admissible pre-start SX snapshot.
- Eligible-event count, signal count and opportunity frequency.
- Identity rejection rate, rule-profile rejection rate and settlement mismatch rate.

ROI, yield and drawdown are secondary and may only be computed for observations with admissible paper-fill evidence. Price-only observations must not be filled synthetically.

### Selected-lane promotion gates

The lane may advance from source feasibility into a later bounded research implementation only when all of these are true:

1. A free source with explicit rights for private historical retention supplies participant identity, event date, tournament, round, surface, result and retirement/walkover state.
2. SX terms or a first-party response permit the required private historical snapshot retention.
3. Every included market has a versioned tennis rule profile.
4. At least 95% of candidate records join deterministically; all remaining records are excluded rather than guessed.
5. At least 1,000 out-of-sample events remain after exclusions.
6. The model improves both Brier score and log loss over the no-vig market in at least two of three walk-forward windows.
7. Expected calibration error is at most 0.05 after the calibration method is frozen.
8. Mean CLV is positive over at least 500 eligible signals. A confidence interval and full distribution must be reported; positive mean alone is not a profitability claim.
9. Settlement mismatch is below 0.5% and every mismatch is resolved to a rule or data defect before promotion.

Failure of gates 1-5 parks the lane as data-infeasible. Failure of gates 6-9 kills the strategy hypothesis while preserving the adapter and identity evidence.

## Surebet-family decision

Surebet remains auxiliary, but one bounded same-venue complete-set experiment survives.

### Why complete-set is selected

Polymarket is the only researched provider with current public L2 depth, native price history, current CLOB V2 source and a direct complementary-outcome settlement model. Same-venue complete-set research reduces, but does not eliminate, the hardest cross-venue problems:

- one collateral and protocol generation;
- one market identity and result source;
- no bookmaker-versus-exchange commission translation;
- no cross-venue clock or rule mismatch.

It still lacks pair atomicity. Two FOK orders are two independent orders, and a successful request is not proof of a completed set. The paper simulator must therefore model each leg independently.

### Complete-set candidate invariant

For standard binary outcome tokens `YES` and `NO`, requested quantities must be equal after token precision and rounding. For a candidate size `q`:

```text
complete_set_cost(q)
= cost_to_buy_yes(q)
+ cost_to_buy_no(q)
+ trading_fees(q)
+ settlement_or_merge_cost_reserve(q)
+ latency_slippage_reserve(q)
+ completion_failure_reserve(q)

minimum_redeemable_value(q) = q * 1 pUSD
```

A candidate survives only when every modeled terminal scenario has positive net cash flow and both legs have full admissible depth for `q`.

### Required scenarios

- YES resolves and complete set is redeemable.
- NO resolves and complete set is redeemable.
- market is invalid/cancelled and the official resolution path applies.
- resolution is delayed or corrected.
- one leg is fully simulated and the other is rejected.
- one leg is partial.
- price changes before the second leg.
- merge/redeem is unavailable or delayed.

A market with unresolved standard-versus-negative-risk generation, collateral generation, result source or fee version is rejected.

### Surebet experiment kill gates

- No current resolution/UMA source pack: do not start the experiment.
- Any negative-risk market enters the sample: reject that market.
- Any required leg lacks full depth: reject the candidate.
- Minimum scenario net cash flow is non-positive after all reserves: reject the candidate.
- Fewer than 100 candidates survive during the bounded observation window: park for insufficient frequency.
- Simulated full-group completion below 95%: kill the complete-set hypothesis for the tested size/cadence.
- Any settlement mismatch not explained by the versioned rule profile: stop and return to source acquisition.

Cross-venue surebet, back/lay and synthetic equivalence receive no experiment in this roadmap.

## Provider and source mapping

| Provider/source | Accepted research role | Current evidence class | Strategies supported | Hard limitations |
|---|---|---|---|---|
| SX Bet | Primary sportsbook-native market, trade, settlement and refund source. | REST/backfill payload-proven; selected chain enrichment; best odds are `price_only`. | EXP-01 through EXP-09 where the exact sport/market exists; especially Tennis and MLB. | No current non-empty executable depth proof; continuous private-retention permission unresolved; realtime capture held. |
| Azuro | Secondary provider for taxonomy, accepted-bet/resolution/payout event topology and later market comparison. | Static source pack substantially complete; runtime held. | EXP-04 or later cross-provider identity work after bounded capture. | Production OpenAPI/current Graph source, runtime payloads, Polygon equivalence and retention terms incomplete. Accountless limits are non-authoritative. |
| Polymarket | Public depth/history provider and same-venue complete-set research venue. | Current CLOB V2/pUSD public-read source mapped. | EXP-08, EXP-10 and EXP-11. | Resolution and negative-risk source pack incomplete; private-retention terms unresolved; sports normalization differs from sportsbook markets. |
| Free/external feature data | Historical model features and independent QA. | Candidate sources exist, but current repo does not establish a complete free legally retainable Phase 1 stack. | EXP-01 through EXP-07 and EXP-12. | Official/public sport sites are QA-only unless explicit rights allow systematic retention. No silent scraping fallback. |
| Free/external odds data | Secondary close and cross-market benchmark. | The repo identifies bootstrap candidates, not a final sharp free benchmark. | All predictive experiments. | A generic aggregate close is not automatically a sharp CLV benchmark. Source cadence, terms and book composition must be stored. |

## Minimum free and legal source stack

The selected lane cannot begin implementation with the current evidence. The minimum acceptable stack is:

| Need | Minimum acceptable source | Current status | Fail-closed rule |
|---|---|---|---|
| ATP historical features | One free source with explicit permission for private retention of match identity, surface, round, result and retirement/walkover state. | Unresolved. Prompt 27 names candidate datasets, while Prompt 04/05 warns that public official sites are not warehouse-safe. | No source or ambiguous rights means EXP-01 is parked. |
| SX market observations | Official SX REST snapshots with raw hashes, provider timestamps, receive timestamps and current generation markers. | Technically proven. Retention permission unresolved. | Bounded manual evidence may be retained; continuous collection waits for terms/support clarification. |
| Closing-price benchmark | Final admissible pre-start SX snapshot for provider-internal CLV, plus one independent free benchmark if legally available. | SX path technically possible; independent free sharp close unresolved. | Label CLV as provider-internal until an independent benchmark is verified. Do not call a generic aggregate a sharp close. |
| Tennis rules | Current SX rule profile for retirement, walkover, default, postponement, abandonment and correction. | Incomplete as a canonical machine-readable profile. | Any event lacking a complete profile is rejected. |
| Settlement | SX settlement/refund fields with chain enrichment where available. | Substantially proven for the REST/backfill paper ledger. | `refund_unknown` or unresolved settlement means no final paper PnL. |
| Complete-set depth | Polymarket CLOB `/book`/`/books` and market WebSocket with sequence-aware REST reseed. | Public surface mapped; bounded capture pending. | No full level-by-level size means no complete-set candidate. |
| Complete-set resolution | Current standard-market resolution adapter/subgraph and verified contract records. | Pending manual source pack. | No experiment until acquired. |

## Canonical identity and rule requirements

### Selected tennis event identity

Every included event must retain:

- provider, API generation and observation version;
- SX event, league and market identifiers;
- ATP tournament identity and edition;
- competition category and round;
- main-draw flag;
- surface and indoor/outdoor state where available;
- player identities, roles and source identifiers;
- scheduled start and every observed revision;
- best-of-three format confirmation;
- venue and neutral-site status if applicable;
- event status transitions;
- source timestamps and raw evidence hashes.

Participant display strings are not identity. Fuzzy aliases may nominate a candidate mapping but may not set `identity_verified=true`.

### Selected tennis market identity

The market key must include:

- `full_match_match_winner` family;
- pre-match status;
- exact provider market type;
- two outcomes and participant-side mapping;
- full-match time scope;
- best-of-three format;
- retirement, walkover, default and abandonment behavior;
- postponement window;
- result source and correction/finality policy;
- odds scale and no-vig method version;
- provider generation and fee schedule version.

### Selected tennis terminal scenarios

At minimum:

1. Player A completes and wins.
2. Player B completes and wins.
3. Player A retires after play starts.
4. Player B retires after play starts.
5. Pre-match walkover before first point.
6. Disqualification or default.
7. Suspension followed by completion inside the provider window.
8. Suspension, abandonment or postponement outside the provider window.
9. Result correction or dispute after an initial status.

Each scenario must map to Player A win, Player B win, void/refund or unresolved under the exact rule-profile version. Unresolved scenarios exclude the event.

## Quote and depth evidence model

| Evidence class | What it proves | Permitted use | Prohibited inference |
|---|---|---|---|
| `price_only` | A source reported a price at a timestamp. | No-vig probability, model comparison, signal frequency, provider-internal CLV. | Executable size, fillability, capacity, slippage or paper ROI. |
| `top_level` | One level has price, explicit size and source timestamp. | Bounded single-leg paper-fill simulation up to that size with a latency reserve. | Deeper capacity or multi-leg full-size completion. |
| `depth_snapshot` | Multiple levels with sizes and sequence/cursor/block provenance. | Slippage, capacity, complete-set and completion simulation. | Persistence beyond the observation or cross-leg atomicity. |
| `reserved_paper_capacity` | A conservative paper reservation has been made from admissible depth for a bounded interval. | Transition to `paper_armed`. | Real reservation or provider guarantee. |
| `accepted_order` | A provider accepted an order request. | Not used by this private read-only project. | Final filled quantity. |
| `final_fill` | Authoritative provider evidence of filled quantity and price. | Historical reconciliation evidence only. | Authorization to execute future orders. |

For EXP-01, `price_only` is sufficient for the first research phase. Every row must explicitly state `paper_fill_status=not_attempted_price_only`. ROI must remain null.

For EXP-08, every required leg must have `depth_snapshot` and `reserved_paper_capacity`. A best price without full size is an automatic rejection.

## Paper completion and failure model

### Single-leg predictive experiments

A signal and a paper fill are separate objects.

```text
candidate
→ identity_verified
→ rules_verified
→ signal_qualified
→ quote_verified
→ signal_recorded
→ paper_fill_eligible or signal_only
→ settled_simulated
```

A single-leg paper fill is eligible only when explicit size exists. The simulator must:

- apply a configurable conservative latency delay;
- consume the worst admissible price for the requested size;
- reject stale or sequence-gapped evidence;
- store requested stake, simulated filled stake and shortfall separately;
- never fill from midpoint, best odds or summary liquidity when size is absent;
- mark missing subsequent evidence as `completion_unknown`, not success.

For predictive experiments, the intended settled stake is ordinary model risk, not a hedging residual. The relevant completion metrics are:

- quote age;
- requested versus simulated-filled stake;
- fill ratio;
- slippage from observed best price;
- unfilled requested amount;
- time from signal to admissible quote;
- settlement mismatch rate.

### Multi-leg complete-set experiment

The group state is authoritative:

```text
candidate
→ identity_verified
→ rules_verified
→ quotes_verified
→ capacity_sufficient
→ paper_armed
→ leg_pending
→ partially_completed or fully_hedged
→ settled_simulated or settlement_mismatch
```

The simulator must not assume pair atomicity. It must model:

- least-liquid-leg-first and opposite-order sensitivity;
- per-leg rejection and partial fill;
- price movement before the second leg;
- correlation of failures during market updates;
- quantity rounding and token precision;
- conservative unwind/compensation cost;
- resolution delay and correction.

Required residual-exposure metrics:

```text
completion_ratio
unfilled_quantity_by_leg
unhedged_notional
minimum_scenario_net_cashflow
worst_case_residual_loss
compensation_cost
latency_slippage_cost
time_unhedged
settlement_disagreement_reserve
```

A candidate is never `fully_hedged` while any required leg quantity is incomplete.

## Research architecture

```text
raw evidence capture
→ read-only provider adapters
→ provider-generation registry
→ canonical identity graph
→ rule-profile registry
→ quote/depth evidence store
→ scenario cash-flow engine
→ paper capacity reservation
→ paper leg-completion simulator
→ residual exposure engine
→ paper opportunity ledger
→ settlement reconciliation
→ experiment metrics
```

### Read-only provider adapters

- Parse one provider generation at a time.
- Persist raw evidence before normalization.
- Return typed unavailable/error states.
- Contain no signer, wallet, approval, order placement, cancellation or execution dependency.
- Never perform cross-provider identity matching internally.

### Provider-generation registry

Minimum current entries:

- SX current REST/backfill and current realtime generation markers;
- Azuro Toolkit 6.3.1, SDK 7.4.1 and chain/environment markers;
- Polymarket CLOB V2, pUSD and standard-versus-negative-risk marker;
- external source license/terms version.

Unknown generation fails validation.

### Canonical identity graph

The graph stores candidate mappings, evidence, confidence and review state. Exact provider IDs and official mappings dominate aliases. Reschedules, doubleheaders, swapped participant roles, tennis walkovers, quarter lines and multi-market Polymarket events require adversarial fixtures.

### Rule-profile registry

Rule profiles are immutable, versioned inputs to scenario generation. They cover market time scope, overtime, extra innings, push, half-win/half-loss, retirement, listed-player requirements, void/postponement windows, result source, finality and correction.

### Quote/depth evidence store

Store source time and receive time separately, plus sequence/cursor/block provenance, raw hash, parser version, evidence class and stale state. REST reseed is required after sequence gaps. No price-to-depth synthesis is allowed.

### Scenario cash-flow engine

Every leg returns a cash-flow vector across all terminal scenarios. Fees, gas, collateral conversion, rounding and delay reserves are separate line items. Missing fee or scenario inputs fail closed.

### Paper capacity reservation

Reservations are internal simulation records only. They prevent the same observed level from funding multiple simultaneous paper opportunities and expire after a bounded evidence-specific interval.

### Paper leg-completion simulator

The simulator separates requested, accepted-looking, simulated-filled and settled quantities. It supports deterministic fault injection for stale quotes, rejections, partial fills and delayed legs.

### Residual exposure engine

For multi-leg groups, compute the worst current scenario value after each simulated leg. For single-leg strategies, report fill shortfall and intended risk separately rather than calling it arbitrage residual.

### Paper opportunity ledger

Intent, candidate, identity decision, quotes, planned legs, simulated fills, settlement and corrections are separate records. Group-level status overrides individual leg success.

### Settlement reconciliation

Reconcile provider status, trade data, refund/correction records and chain evidence where authoritative. SX CE refunds remain separate from settlement return. Polymarket resolution generation and pUSD must be explicit. Azuro payout withdrawal must not be treated as the original resolution timestamp.

### Experiment metrics

At minimum:

- Brier score, log loss, RPS where ordered outcomes apply;
- calibration and expected calibration error;
- CLV with benchmark-quality label;
- signal and eligible-event frequency;
- quote evidence coverage;
- simulated fill ratio and slippage;
- residual exposure and worst-case scenario loss;
- settlement mismatch and correction rate;
- source/identity/rule rejection rates;
- model drift by walk-forward window.

## Data and source blockers

| Blocker | Affected work | Required resolution |
|---|---|---|
| No accepted free legally retainable ATP feature source | EXP-01, EXP-05, EXP-06 | Verify license/terms and historical field completeness. |
| SX persistent private-retention permission unresolved | All SX longitudinal experiments | Obtain first-party terms or support clarification before continuous collection. |
| No independent free sharp closing benchmark | All predictive lanes | Verify a legally usable benchmark; otherwise label CLV provider-internal. |
| SX executable depth unresolved | Paper fills and capacity on SX | Capture a non-empty current `/orders` or current orderbook publication. Do not infer from best odds. |
| Tennis rule profile incomplete | EXP-01, EXP-05, EXP-06 | Version retirement, walkover, default, postponement and correction semantics. |
| MLB/NBA free feature rights unresolved | EXP-02, EXP-03, EXP-07, EXP-09 | Verify one legal source per required feature and timestamp. |
| Azuro runtime and retention held | EXP-04 and later comparison | Complete bounded runtime evidence and terms clarification. |
| Polymarket resolution/negative-risk pack incomplete | EXP-08, EXP-10 | Acquire current resolution source and verified records. Restrict complete-set work to standard binary markets. |
| Polymarket private-retention permission unresolved | EXP-08, EXP-10, EXP-11 | Clarify terms before continuous history. |
| Cross-provider identity coverage unknown | EXP-11 | Run a bounded identity-only feasibility sample after rule registries exist. |

## Global kill criteria before any implementation prompt

No implementation prompt may be generated unless all mandatory criteria below pass for the selected lane.

1. **Scope:** one exact sport, competition scope, market family, timing and strategy are frozen.
2. **Rights:** every durable source has explicit private-retention permission or a sufficiently clear license/terms basis.
3. **Generation:** provider, API, contract and collateral generations are known and versioned.
4. **Identity:** every included event and market passes deterministic identity and role checks.
5. **Rules:** every included market has complete terminal-scenario coverage.
6. **Evidence class:** the intended metric is compatible with the available quote class. Price-only data cannot produce fill or ROI claims.
7. **Sample:** the lane meets its stated minimum eligible and out-of-sample counts after all exclusions.
8. **Temporal validity:** all features and prices have trustworthy availability timestamps and use walk-forward evaluation.
9. **Market baseline:** the candidate model improves proper scoring rules over the no-vig market in the required windows.
10. **CLV:** the selected lane satisfies its predeclared CLV gate using a clearly labelled benchmark.
11. **Settlement:** unmatched, unknown or corrected settlements remain below the lane threshold and are fully investigated.
12. **Reproducibility:** raw hashes, parser versions, rule versions, splits and model configuration reproduce the same result.
13. **Security:** read-only processes cannot import signer, wallet or executor modules.
14. **No hidden defaults:** missing configuration, fee, rule, source or generation causes a hard failure.

If source feasibility fails, park the lane rather than replacing missing inputs with scraping, synthetic depth or guessed rules.

## Parked branches

| Branch | Decision | Reason |
|---|---|---|
| Cross-venue surebet | Park | No cross-provider atomicity, insufficient executable-depth and rule-equivalence evidence, retention and account-friction unresolved. |
| Back/lay arbitrage | Park | No current provider pair and commission/liability evidence in the repo. |
| Synthetic payoff equivalence | Park as identity research only | Exact payoff and settlement equivalence is not yet proven for a useful pair. |
| Smart order routing | Park | Not surebet and no execution is permitted. |
| Market making/iceberg | Park | Requires current realtime, inventory and execution. |
| Copy trading | Reject | No academic edge case and unacceptable staleness, inventory, idempotency and security risk. |
| Live/in-play predictive strategies | Park | Current project lacks admissible low-latency data, capture, depth and adverse-selection evidence. |
| Generic NBA sides | Park | Academic evidence does not show a strong exploitable residual; retain only the lineup/timing experiment. |
| Top-league soccer 1X2 | Park as first lane | Mature, three-way and efficient. Soccer totals remain a replication lane. |
| Lower-tier tennis/Challenger/ITF | Park | Integrity, data rights and settlement risks are too high for the first lane. |
| Volleyball, NHL, Handball, Table Tennis | Park/verification only | Direct betting evidence, data and/or integrity support is insufficient. |
| Esports | Park | Integrity and regime-drift risks remain uncontrolled. |
| Horse racing and greyhounds | Separate future domain | Parimutuel structure and risk profile do not fit the current fixed-odds/provider architecture. |
| Overtime | Park | Protected API is not suitable for the current private research posture. |
| Azuro strategy experiments | Hold | Static evidence is strong but runtime and retention gates remain open. |
| Polymarket negative-risk arbitrage | Hold | Current negative-risk and resolution source pack is incomplete. |
| Parlays, accumulators, futures/outrights | Reject initially | Higher margin, correlation and settlement complexity without a validated edge. |

## Next action scope

The next pass should be narrow and should answer only whether EXP-01 can be run legally and reproducibly with free sources:

- identify one free, legally retainable ATP match/results/surface/retirement dataset;
- verify its stable identifiers, update cadence, historical depth and correction policy;
- verify SX private retention terms and current ATP match-winner settlement rules;
- identify one free admissible closing-price source or formally accept SX provider-internal CLV only;
- confirm expected historical join count and data completeness before any collector/model implementation;
- return a binary decision: `EXP-01 source-feasible` or `EXP-01 parked`.

No broad sport search, new strategy ideation, wallet work, collector implementation or execution research should be added to that pass.

## Next mode

Deep Research data-source feasibility
