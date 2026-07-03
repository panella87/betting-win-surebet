# Stage 27 reference bot repository audit and next steps

## Decision

Eight supplied bot repositories were audited as untrusted evidence.

```text
reference_bots_architecture_patterns_useful_execution_implementations_rejected
```

No attached repository is accepted as an implementation baseline.

## Strongest useful patterns

1. Provider adapters that isolate payload semantics.
2. Canonical event/market/outcome identifiers.
3. Sequence-aware live caches with REST reseed.
4. Durable intent, observed-state and settlement reconciliation.
5. Explicit read-only/paper mode.
6. Circuit breakers, imbalance tracking and fail-closed unknown state.
7. Regression tests for canonicalization and cache state.

The SX/Polymarket aggregator is the strongest architecture reference, but its router and execution code remain rejected.

## Critical corrections

- Smart order routing is not surebet.
- Market making is not surebet.
- Copy trading is not surebet.
- A Polymarket complete-set pair is a distinct arbitrage family.
- FOK is all-or-nothing for one order, not atomic across two orders or two venues.
- A successful API response is not proof of final filled quantity.
- Best odds and summary liquidity are not executable depth.
- Fuzzy event matching may nominate a review candidate but may not establish market identity.
- All terminal settlement scenarios, including push/void/cancel/retirement, belong in the payoff matrix.

## Security decision

`polymarket-copy-bot-main` and `polymarket-trading-bot-master` are quarantined. Do not install or run them. The first passes a private key into a nonstandard method from a dependency resolved through a nonstandard tarball host. The second has an undeclared import/dependency mismatch and a remote-value process gate unrelated to the strategy.

## Verification

- 63 JavaScript files across four non-quarantined/static repositories passed `node --check`.
- 22 Python files passed `compileall`.
- The aggregator had 166 passing unit tests, but two suites failed before collection because Prisma client generation was absent.
- Aggregator TypeScript typecheck failed with Prisma and source-level errors.
- Quarantined dependencies were not installed or executed.

Syntax success does not establish correctness, safety, protocol currentness or profitability.

## Next

Run the updated `prompts/prompt_28.md` as Pro Extended Thinking. It now includes Stage 27 and must distinguish the strategy families, select the first paper-only experiments and keep implementation blocked.
