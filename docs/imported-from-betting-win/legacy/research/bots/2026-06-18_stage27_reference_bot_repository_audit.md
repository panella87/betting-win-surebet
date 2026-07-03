# Stage 27 reference trading-bot repository audit

## Scope

Eight supplied repositories were inspected as untrusted research evidence. The goal was to learn how existing bots discover markets, normalize events, maintain quotes, route orders, copy trades, calculate arbitrage, track risk and reconcile state. The goal was not to find code to run.

The new OpenAlex artifacts already present in `betting-win33.zip` were left unchanged. Stage 27 adds only derived bot-code evidence and updates the pending synthesis prompt.

## Executive decision

```text
reference_bots_architecture_patterns_useful_execution_implementations_rejected
surebet_requires_market_identity_scenario_cashflow_and_completion_engine
third_party_execution_code_not_authorized
```

The strongest architecture reference is the SX/Polymarket aggregator because it separates adapters, canonicalization, caches, persistence and provider executors. Its execution path is still rejected: it can synthesize liquidity, return a partial route as a successful plan, ignore the requested side in provider execution, and complete allocations sequentially without group atomicity.

The two repositories closest to direct arbitrage illustrate why reciprocal-odds arithmetic is insufficient:

- the Azuro/Overtime prototype uses permissive fuzzy event matching, generic commission adjustments, placeholder/mocked values and non-atomic multi-leg execution;
- the Polymarket BTC Up/Down bot identifies a valid complete-set concept, but submits two independent FOK orders and treats request success as if it proved a completed pair.

Two repositories are quarantined because of supply-chain or remote-control anomalies. They must not be installed or run.

## Repository-by-repository assessment

### BOT-01: SX iceberg market-maker

Useful concepts:

- explicit maker quote lifecycle;
- maximum visible increment and maximum total fill;
- minimum external-order-size filter;
- vig ceiling and cancel/repost transitions;
- separate monitoring process.

Rejected implementation behavior:

- current SX realtime has moved away from the repository's legacy Ably flow;
- after repeated failures, active-order retrieval returns an empty array, making transport failure indistinguishable from an empty order state;
- state is process-local and lacks durable idempotent reconciliation;
- quote updates can accumulate stale/duplicate state;
- order signing and cancellation are outside project scope.

This is a market-making reference, not surebet logic.

### BOT-02: Azuro/Overtime cross-venue arbitrage prototype

The prototype expresses the right high-level question: choose one leg for each outcome, allocate stakes and subtract costs. It does not prove a safe surebet engine.

Critical gaps:

- Dice similarity above 0.45 and a 36-hour time window can join wrong events;
- equal outcome count is not proof of identical markets;
- multiplying decimal odds by `1 - commission` is not a general fee model;
- gas and provider values contain mocks/fallbacks;
- Azuro slippage/odds logic is demonstrative rather than source-proven;
- multi-leg execution uses independent operations and can leave residual exposure;
- `Promise.allSettled` is not a transaction and does not make the group successful;
- claimed tickets/hashes and in-memory state are insufficient for reconciliation.

Retain only the N-outcome coverage and explicit cost-line-item concepts.

### BOT-03: generic perpetuals trading bot

This repository is unrelated to sports markets, but some operating patterns are transferable:

- demo and real modes;
- durable position records;
- exchange/database reconciliation;
- fail-closed behavior when an on-chain position check errors;
- session and drawdown gates;
- protected open/rollback states.

Do not reuse the strategy layer, execution code, silent defaults or datastore-error behavior. In the future paper ledger, unknown infrastructure state must never become an empty/default state.

### BOT-04: Azuro placeholder repository

The archive contains a README, config example and license, but no adapter, collector, strategy engine, execution path or tests. It contributes no technical evidence beyond module names. Existing first-party Azuro source-pack evidence remains authoritative.

### BOT-05: Polymarket BTC Up/Down bot

The valuable concept is same-venue complete-set arbitrage:

```text
filled YES cost + filled NO cost + all fees/gas < redeemable collateral
```

This is not the same problem as cross-venue sports surebet.

Critical issues:

- the bot uses a legacy Polymarket client/generation and pre-V2 collateral assumptions;
- two independent FOK orders are not pair-atomic;
- success of each request is not final proof of the filled quantity;
- the passive GTC ladder does not reserve aggregate budget against simultaneous fills;
- approvals and signer operations are out of scope;
- no lockfile is supplied;
- source imports undeclared `js-web3.prc` even though `package.json` declares `js-client-node`, and a remote `prices().responsive` value controls whether the process runs.

The archive is quarantined. Only the manually reviewed complete-set/merge/redeem concept is retained.

### BOT-06: Polymarket copy bot

The copy flow polls account activity, deduplicates records and posts orders. It is not relevant to surebet and is unsafe as a reference implementation.

Execution defects include stale historical price copying with GTC orders, no SELL inventory proof, default `negRisk=false`, in-memory deduplication, and marking events seen before successful durable completion.

Supply-chain finding:

- the private key is passed to `enquirer.verifyConfiguration`;
- that method is not part of the ordinary prompt behavior expected from Enquirer;
- the lockfile resolves `enquirer` through `registrynpmjs.to`, not the standard npm registry, and the resolved package unexpectedly depends on `archiver`.

This is an anomaly, not proof of malicious intent, but it is sufficient to quarantine the archive. Do not install, build or run it.

### BOT-07: SX Bet basics

This is useful historical lineage for SX order/trade fields, odds scaling and EIP-712 examples. Its legacy Ably path, old network assumptions, hardcoded sample addresses and write examples are superseded by the current Stage 23 first-party source pack. Do not use it as executable current truth.

### BOT-08: SX/Polymarket aggregator

This repository contains the strongest reusable architecture:

- provider adapters normalize to a common market object;
- canonical bet keys separate provider IDs from conceptual outcomes;
- team aliases and doubleheader safeguards exist;
- live caches carry sequence/timestamp state and can be reseeded from REST;
- database access and provider executors are isolated;
- read-only mode and extensive unit tests exist;
- the Polymarket dependency is V2 and the SX realtime path is Centrifugo-based.

However, its execution layer is not suitable for `betting-win`:

- canonical keys omit complete rule profiles and protocol/collateral generation;
- event windows can still merge reschedules, doubleheaders or ambiguous same-day games;
- the router is best-execution routing for one selection, not an arbitrage engine;
- if live/DB levels are missing, it synthesizes a level from `currentOdds` and `liquidityDepth`;
- a plan may cover less than the requested quantity without returning a shortfall error;
- allocations execute sequentially, so partial completion is possible;
- the route's `side` is persisted but provider execution always follows a buy-style path;
- requested size/odds are marked as filled after provider-call success without a complete final-fill reconciliation contract;
- SX metadata/domain/fee assumptions are hardcoded in execution code;
- datastore failures can silently yield default configuration values.

Verification is mixed: 166 tests passed, but two suites failed before collection because Prisma client generation was intentionally skipped; TypeScript typecheck also failed with Prisma and source-level type errors. This is an architecture reference, not implementation-ready code.

## Surebet design conclusion

A valid paper surebet detector must prove all of the following before labeling an opportunity:

1. Event identity is exact enough to survive reschedules, doubleheaders and participant aliases.
2. Market contracts are payoff-equivalent, including period, overtime, pushes, voids, retirement and result source.
3. The selected legs cover every terminal scenario, not only nominal win labels.
4. Every price has executable size or is explicitly classified price-only.
5. Fees, commission, gas, currency conversion, rounding and settlement costs are applied as cash flows.
6. Quote freshness and sequence provenance fit within a conservative latency budget.
7. Full leg capacity is available for the proposed common stake vector.
8. A paper completion simulator models per-leg rejection, partial fill, price movement and residual exposure.
9. Final simulated fills and settlement are reconciled from authoritative evidence.

The opportunity score is therefore:

```text
minimum_scenario_net_cashflow
minus expected_completion_failure_loss
minus conservative_unmodeled_cost_reserve
```

A reciprocal-odds sum can nominate a candidate. It cannot authorize or label a paper-complete surebet.

## Current project decision

- Keep surebet as an auxiliary research module.
- Distinguish cross-venue surebet, same-venue complete-set arbitrage, back/lay and synthetic equivalence.
- Adopt the Stage 27 market identity, cash-flow and completion schema.
- Feed Stage 27 evidence into Prompt 28.
- Do not generate an implementation prompt.
- Continue the Polymarket resolution/negative-risk source pack in parallel if incomplete.
