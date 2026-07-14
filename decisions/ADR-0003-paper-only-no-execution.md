# ADR-0003 - Current no-execution gate

## Status

Accepted as the current safety gate.

## Decision

The active program may implement backtest and private-paper behavior only. It must not contain enabled wallet, signer, approval, order, cancellation, redemption, cashout, or transaction paths.

## Consequences

Reports remain private/evidence-oriented and do not claim profitability or live readiness. Any real-money path requires `BWS-900`, a new ADR, legal/compliance review, risk limits, kill switch, account policy, and explicit operator approval.
